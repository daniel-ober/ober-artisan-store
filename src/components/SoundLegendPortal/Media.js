import React, { useEffect, useMemo, useRef, useState } from 'react';
import './Media.css';
import { useActorContext } from '../../hooks/useActorContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '../../firebaseConfig';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

/* -------------------- helpers -------------------- */

function tsToMillis(v) {
  if (!v) return 0;
  if (typeof v === 'string') {
    const t = Date.parse(v);
    return Number.isFinite(t) ? t : 0;
  }
  if (typeof v === 'number') return v;
  if (v instanceof Date) return v.getTime() || 0;
  if (typeof v === 'object' && v.seconds) return v.seconds * 1000;
  try {
    const t = new Date(v).getTime();
    return Number.isFinite(t) ? t : 0;
  } catch {
    return 0;
  }
}

const FILE_TYPES = {
  image: ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.tiff'],
  video: ['.mp4', '.mov', '.webm', '.m4v'],
  audio: ['.mp3', '.m4a', '.wav', '.flac', '.aac', '.ogg'],
  doc: ['.pdf', '.doc', '.docx', '.xls', '.xlsx'],
};

const buildPhases = [
  'Step 1. Wood Preparation',
  'Step 2. Shell Construction',
  'Step 3. Fine-Tuning',
  'Step 4. Shell Exterior Finish',
  'Step 5. Bearing Edges',
  'Step 6. Snare Bed Cutting',
  'Step 7. Hardware Drilling',
  'Step 8. Hardware Assembly',
  'Step 9. Tuning and Detailing',
  'Step 10. Quality Check',
];

const extOf = (url = '') => {
  try {
    const u = new URL(url);
    const p = u.pathname.toLowerCase();
    const m = p.match(/\.[a-z0-9]+$/i);
    return m ? m[0] : '';
  } catch {
    const p = String(url || '').toLowerCase();
    const m = p.match(/\.[a-z0-9]+$/i);
    return m ? m[0] : '';
  }
};

const classifyType = (url = '') => {
  const lower = (url || '').toLowerCase();

  // Host-based hints for URLs with no extension
  if (/youtube\.com|youtu\.be|vimeo\.com/.test(lower)) return 'video';
  if (/soundcloud\.com|spotify\.com|bandcamp\.com/.test(lower)) return 'audio';

  const ext = extOf(url);
  if (FILE_TYPES.image.includes(ext)) return 'image';
  if (FILE_TYPES.video.includes(ext)) return 'video';
  if (FILE_TYPES.audio.includes(ext)) return 'audio';
  if (FILE_TYPES.doc.includes(ext)) return 'doc';
  if (/^data:image\//.test(url)) return 'image';
  if (/^data:audio\//.test(url)) return 'audio';
  if (/^data:video\//.test(url)) return 'video';
  return 'doc';
};

const filenameFromUrl = (url = '') => {
  try {
    const u = new URL(url);
    const last = u.pathname.split('/').filter(Boolean).pop() || '';
    return decodeURIComponent(last) || 'download';
  } catch {
    const parts = String(url).split('?')[0].split('/').filter(Boolean);
    return parts.pop() || 'download';
  }
};

// try to infer build stage (1–10) from attachment fields or category name
const inferStage = (attachment = {}, category = '') => {
  const candidates = [
    attachment.stage,
    attachment.step,
    attachment.buildStage,
    attachment.stageNumber,
    attachment.phase,
    category,
  ];

  for (const v of candidates) {
    if (v == null) continue;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    const m = String(v).match(/(\d+)/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n)) return n;
    }
  }
  return 0; // unknown / misc
};

const stageLabel = (stage) => {
  if (!stage) return 'No stage / Misc';
  const idx = stage - 1;
  if (idx < 0 || idx >= buildPhases.length) return `Stage ${stage}`;
  return buildPhases[idx];
};

/* ---- video helpers (YouTube / Vimeo) ---- */

const normaliseUrl = (url = '') => {
  let s = (url || '').trim();
  if (!s) return null;

  // if it's protocol-relative or missing protocol, add https so URL() doesn’t throw
  if (!/^https?:\/\//i.test(s)) {
    s = 'https://' + s.replace(/^\/+/, '');
  }
  return s;
};

const getYouTubeId = (url = '') => {
  const normalised = normaliseUrl(url);
  if (!normalised) return null;

  try {
    const u = new URL(normalised);
    const host = u.hostname.toLowerCase();

    if (host.includes('youtu.be')) {
      const seg = u.pathname.split('/').filter(Boolean)[0];
      return seg || null;
    }

    const vParam = u.searchParams.get('v');
    if (vParam) return vParam;

    const mEmbed = u.pathname.match(/\/embed\/([^/?]+)/i);
    if (mEmbed) return mEmbed[1];

    // fallback regex (covers odd cases)
    const mShort = normalised.match(/youtu\.be\/([^?&]+)/i);
    if (mShort) return mShort[1];
    const mQuery = normalised.match(/[?&]v=([^?&]+)/i);
    if (mQuery) return mQuery[1];
  } catch {
    // final regex-only fallback
    const mShort = url.match(/youtu\.be\/([^?&]+)/i);
    if (mShort) return mShort[1];
    const mQuery = url.match(/[?&]v=([^?&]+)/i);
    if (mQuery) return mQuery[1];
  }
  return null;
};

const getYouTubeThumbnail = (url = '') => {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
};

const getVideoEmbedUrl = (url = '') => {
  const normalised = normaliseUrl(url);
  if (!normalised) return null;

  try {
    const u = new URL(normalised);
    const host = u.hostname.toLowerCase();

    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      const id = getYouTubeId(normalised);
      return id ? `https://www.youtube.com/embed/${id}?rel=0` : null;
    }

    if (host.includes('vimeo.com')) {
      const seg = u.pathname.split('/').filter(Boolean);
      const id = seg.pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    // ignore, will fall through and return null
  }

  return null;
};

/* ---- flatten attachments ---- */

const flattenAttachments = (attachments = {}) => {
  const out = [];
  let globalIndex = 0;
  for (const [category, arr] of Object.entries(attachments)) {
    if (!Array.isArray(arr)) continue;
    arr.forEach((it, index) => {
      if (!it?.url) return;
      const type = classifyType(it.url);
      const createdAt = tsToMillis(it.createdAt || it.uploadedAt);
      out.push({
        id: it.id || `${category}:${index}:${it.url}`,
        url: it.url,
        title: it.title || it.name || filenameFromUrl(it.url),
        category,
        itemIndex: index,
        type,
        createdAt: createdAt || 0,
        stage: inferStage(it, category),
        order: globalIndex++, // fallback “upload order”
      });
    });
  }
  return out;
};

const labelForType = (type) => {
  switch (type) {
    case 'image':
      return 'Images';
    case 'video':
      return 'Video';
    case 'audio':
      return 'Audio';
    case 'doc':
    default:
      return 'Documents';
  }
};

const TYPE_FILTERS = [
  { id: 'all', label: 'All media' },
  { id: 'image', label: 'Images' },
  { id: 'video', label: 'Video' },
  { id: 'audio', label: 'Audio' },
  { id: 'doc', label: 'Documents' },
];

const STAGE_FILTERS = [
  { id: 'all', label: 'All stages' },
  { id: '0', label: 'No stage / Misc' },
  ...buildPhases.map((label, idx) => ({
    id: String(idx + 1),
    label: `Stage ${idx + 1}`,
  })),
];

const VIEW_MODES = {
  MEDIA: 'media',
  STAGE: 'stage',
};

const SORT_MEDIA_OPTIONS = [
  { id: 'type_asc', label: 'Media type · A → Z' },
  { id: 'type_desc', label: 'Media type · Z → A' },
];

const SORT_STAGE_OPTIONS = [
  { id: 'stage_asc', label: 'Build stage · 1 → 10' },
  { id: 'stage_desc', label: 'Build stage · 10 → 1' },
];

/* -------------------- main tab component -------------------- */

export default function Media({ project }) {
  const { actorIsAdmin, isImpersonating, actorEmail } =
    useActorContext() || {};

  // Only admins in impersonation mode can edit
  const canEdit = !!project?.id && actorIsAdmin && isImpersonating;

  const [viewMode, setViewMode] = useState(VIEW_MODES.MEDIA);
  const [sortMode, setSortMode] = useState('type_asc');
  const [typeFilter, setTypeFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState(project?.attachments || {});
  const [viewerIndex, setViewerIndex] = useState(null);

  // sync when project changes
  useEffect(() => {
    setAttachments(project?.attachments || {});
  }, [project?.attachments]);

  // keep sortMode in sync with viewMode
  useEffect(() => {
    if (viewMode === VIEW_MODES.MEDIA) {
      if (!sortMode.startsWith('type_')) setSortMode('type_asc');
    } else {
      if (!sortMode.startsWith('stage_')) setSortMode('stage_asc');
    }
  }, [viewMode, sortMode]);

  const items = useMemo(
    () => flattenAttachments(attachments || {}),
    [attachments]
  );

  // apply filters
  const filtered = useMemo(() => {
    let list = items;
    if (typeFilter !== 'all') {
      list = list.filter((it) => it.type === typeFilter);
    }
    if (stageFilter !== 'all') {
      if (stageFilter === '0') {
        list = list.filter((it) => !it.stage);
      } else {
        const target = parseInt(stageFilter, 10);
        if (Number.isFinite(target)) {
          list = list.filter((it) => (it.stage || 0) === target);
        }
      }
    }
    return list;
  }, [items, typeFilter, stageFilter]);

  // sort
  const sorted = useMemo(() => {
    const out = [...filtered];
    out.sort((a, b) => {
      const labelA = labelForType(a.type);
      const labelB = labelForType(b.type);
      const sa = a.stage || 0;
      const sb = b.stage || 0;

      if (sortMode === 'type_asc') {
        if (labelA !== labelB) return labelA.localeCompare(labelB);
        return (a.title || '').localeCompare(b.title || '');
      }

      if (sortMode === 'type_desc') {
        if (labelA !== labelB) return labelB.localeCompare(labelA);
        return (b.title || '').localeCompare(a.title || '');
      }

      if (sortMode === 'stage_asc') {
        if (sa !== sb) {
          if (sa === 0) return 1;
          if (sb === 0) return -1;
          return sa - sb;
        }
        return (a.title || '').localeCompare(b.title || '');
      }

      if (sortMode === 'stage_desc') {
        if (sa !== sb) {
          if (sa === 0) return 1;
          if (sb === 0) return -1;
          return sb - sa;
        }
        return (a.title || '').localeCompare(b.title || '');
      }

      return 0;
    });
    return out;
  }, [filtered, sortMode]);

  /* ---- buckets / sections ---- */

  const mediaBuckets = useMemo(() => {
    if (viewMode !== VIEW_MODES.MEDIA) return null;
    const buckets = { Images: [], Video: [], Audio: [], Documents: [] };
    for (const it of sorted) {
      if (it.type === 'image') buckets.Images.push(it);
      else if (it.type === 'video') buckets.Video.push(it);
      else if (it.type === 'audio') buckets.Audio.push(it);
      else buckets.Documents.push(it);
    }
    return buckets;
  }, [sorted, viewMode]);

  const stageSections = useMemo(() => {
    if (viewMode !== VIEW_MODES.STAGE) return null;
    const map = new Map();
    const sections = [];

    for (const it of sorted) {
      const key = it.stage || 0;
      let sec = map.get(key);
      if (!sec) {
        sec = { stage: key, title: stageLabel(key), items: [] };
        map.set(key, sec);
        sections.push(sec);
      }
      sec.items.push(it);
    }

    return sections;
  }, [sorted, viewMode]);

  // close viewer if sorted list shrinks and index is invalid
  useEffect(() => {
    if (
      viewerIndex !== null &&
      (viewerIndex < 0 || viewerIndex >= sorted.length)
    ) {
      setViewerIndex(null);
    }
  }, [sorted.length, viewerIndex]);

  const openViewer = (item) => {
    const idx = sorted.findIndex((it) => it.id === item.id);
    if (idx !== -1) setViewerIndex(idx);
  };

  const closeViewer = () => setViewerIndex(null);

  const goPrev = () => {
    if (!sorted.length) return;
    setViewerIndex((idx) => {
      if (idx === null || idx <= 0) return sorted.length - 1;
      return idx - 1;
    });
  };

  const goNext = () => {
    if (!sorted.length) return;
    setViewerIndex((idx) => {
      if (idx === null || idx >= sorted.length - 1) return 0;
      return idx + 1;
    });
  };

  const currentItem =
    viewerIndex !== null && viewerIndex >= 0 && viewerIndex < sorted.length
      ? sorted[viewerIndex]
      : null;

  /* ---------- Firestore helper (no audit) ---------- */

  const updateAttachmentsCategory = async (category, newArray) => {
    if (!project?.id) return;
    const docRef = doc(db, 'projects', project.id);
    await updateDoc(docRef, {
      [`attachments.${category}`]: newArray,
      updatedAt: serverTimestamp(),
    });
  };

  /* ---------- upload / url add / stage / delete ---------- */

  const handleUploadFiles = async (fileList, stageValue) => {
    if (!canEdit || !project?.id) return;
    const files = Array.from(fileList || []);
       if (!files.length) return;

    const stage = Number(stageValue) || 0;
    const category = 'media';

    setUploading(true);
    try {
      const uploadedEntries = [];

      for (const file of files) {
        const path = `projects/${project.id}/media/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, path);
        await new Promise((resolve, reject) => {
          const task = uploadBytesResumable(storageRef, file);
          task.on(
            'state_changed',
            () => {},
            (err) => reject(err),
            () => resolve()
          );
        });
        const url = await getDownloadURL(storageRef);

        uploadedEntries.push({
          url,
          title: file.name,
          stage,
          createdAt: new Date().toISOString(),
          uploadedAt: new Date().toISOString(),
          uploadedBy: actorEmail || 'admin',
          type: classifyType(url),
        });
      }

      const prevArr = attachments?.[category] || [];
      const updatedArr = [...prevArr, ...uploadedEntries];
      const nextAttachments = {
        ...(attachments || {}),
        [category]: updatedArr,
      };

      setAttachments(nextAttachments);
      await updateAttachmentsCategory(category, updatedArr);
    } catch (err) {
      console.error('Media upload error:', err);
      alert(
        `Sorry, there was a problem uploading media.\n\n${
          err?.message || String(err)
        }`
      );
    } finally {
      setUploading(false);
    }
  };

  const handleAddUrl = async ({ url, title, stageValue }) => {
    if (!canEdit || !project?.id) return;
    if (!url) return;

    const stage = Number(stageValue) || 0;
    const category = 'media';

    try {
      const entry = {
        url,
        title: title?.trim() || filenameFromUrl(url),
        stage,
        createdAt: new Date().toISOString(),
        uploadedAt: new Date().toISOString(),
        uploadedBy: actorEmail || 'admin',
        type: classifyType(url),
      };

      const prevArr = attachments?.[category] || [];
      const updatedArr = [...prevArr, entry];
      const nextAttachments = {
        ...(attachments || {}),
        [category]: updatedArr,
      };
      setAttachments(nextAttachments);
      await updateAttachmentsCategory(category, updatedArr);
    } catch (err) {
      console.error('Media URL add error:', err);
      alert(
        `Sorry, there was a problem adding this URL.\n\n${
          err?.message || String(err)
        }`
      );
    }
  };

  const handleChangeStage = async (item, newStageValue) => {
    if (!canEdit || !project?.id || !item) return;
    const category = item.category;
    const idx = item.itemIndex;
    const arr = (attachments && attachments[category]) || [];
    if (!arr[idx]) return;

    const newStage = Number(newStageValue) || 0;
    const prevStage = arr[idx].stage || 0;
    if (prevStage === newStage) return;

    const newArr = [...arr];
    newArr[idx] = { ...arr[idx], stage: newStage };

    const nextAttachments = {
      ...(attachments || {}),
      [category]: newArr,
    };
    setAttachments(nextAttachments);

    try {
      await updateAttachmentsCategory(category, newArr);
    } catch (err) {
      console.error('Media stage change error:', err);
      alert(
        `Sorry, there was a problem updating the media stage.\n\n${
          err?.message || String(err)
        }`
      );
    }
  };

  const handleDeleteItem = async (item) => {
    if (!canEdit || !project?.id || !item) return;
    const category = item.category;
    const idx = item.itemIndex;
    const arr = (attachments && attachments[category]) || [];
    if (!arr[idx]) return;

    const ok = window.confirm(
      `Delete this media item?\n\n${item.title || item.url}`
    );
    if (!ok) return;

    const newArr = arr.filter((_, i) => i !== idx);
    const nextAttachments = {
      ...(attachments || {}),
      [category]: newArr,
    };
    setAttachments(nextAttachments);

    try {
      await updateAttachmentsCategory(category, newArr);
    } catch (err) {
      console.error('Media delete error:', err);
      alert(
        `Sorry, there was a problem deleting this media item.\n\n${
          err?.message || String(err)
        }`
      );
    }
  };

  const sortOptions =
    viewMode === VIEW_MODES.MEDIA ? SORT_MEDIA_OPTIONS : SORT_STAGE_OPTIONS;

  return (
    <div className="slp-card mg-card" data-component="Media">
      <h3>Media</h3>
      <p className="slp-muted mg-description">
        Curated by <b>Ober Artisan</b> throughout your build journey — follow
        along as your SoundLegend comes to life. Click any item to preview; use
        the download button to save.
      </p>

      <MediaToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortMode={sortMode}
        onSortChange={setSortMode}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        stageFilter={stageFilter}
        onStageFilterChange={setStageFilter}
        sortOptions={sortOptions}
      />

      {sorted.length === 0 ? (
        <div className="pp2-empty">No media has been published yet.</div>
      ) : viewMode === VIEW_MODES.MEDIA ? (
        <>
          <MediaSection
            title="Images"
            items={mediaBuckets?.Images || []}
            onOpen={openViewer}
          />
          <MediaSection
            title="Video"
            items={mediaBuckets?.Video || []}
            onOpen={openViewer}
          />
          <MediaSection
            title="Audio"
            items={mediaBuckets?.Audio || []}
            onOpen={openViewer}
          />
          <MediaSection
            title="Documents"
            items={mediaBuckets?.Documents || []}
            onOpen={openViewer}
          />
        </>
      ) : (
        <>
          {stageSections?.map((sec) => (
            <MediaSection
              key={sec.stage}
              title={sec.title}
              items={sec.items}
              onOpen={openViewer}
            />
          ))}
        </>
      )}

      {canEdit && (
        <MediaUploadPanel
          uploading={uploading}
          onUploadFiles={handleUploadFiles}
          onAddUrl={handleAddUrl}
        />
      )}

      <MediaModal
        open={!!currentItem}
        item={currentItem}
        index={viewerIndex ?? 0}
        total={sorted.length}
        onClose={closeViewer}
        onPrev={goPrev}
        onNext={goNext}
        canEdit={canEdit}
        onChangeStage={handleChangeStage}
        onDelete={handleDeleteItem}
      />
    </div>
  );
}

/* -------------------- toolbar -------------------- */

function MediaToolbar({
  viewMode,
  onViewModeChange,
  sortMode,
  onSortChange,
  typeFilter,
  onTypeFilterChange,
  stageFilter,
  onStageFilterChange,
  sortOptions,
}) {
  return (
    <div className="mg-toolbar">
      <div className="mg-left">
        <div className="mg-viewby">
          <span className="mg-view-label">View by</span>
          <div className="mg-view-pill-row">
            <button
              type="button"
              className={
                'mg-view-pill ' +
                (viewMode === VIEW_MODES.MEDIA ? 'is-active' : '')
              }
              onClick={() => onViewModeChange(VIEW_MODES.MEDIA)}
            >
              Media type
            </button>
            <button
              type="button"
              className={
                'mg-view-pill ' +
                (viewMode === VIEW_MODES.STAGE ? 'is-active' : '')
              }
              onClick={() => onViewModeChange(VIEW_MODES.STAGE)}
            >
              Build stage
            </button>
          </div>
        </div>

        {/* Filter selects (Screenshot A style, but styled like the rest of the page) */}
        <div className="mg-filter-stack">
          <label className="mg-select-filter">
            <span className="mg-select-label">Build stage</span>
            <select
              className="mg-select"
              value={stageFilter}
              onChange={(e) => onStageFilterChange(e.target.value)}
            >
              {STAGE_FILTERS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <label className="mg-select-filter">
            <span className="mg-select-label">Media type</span>
            <select
              className="mg-select"
              value={typeFilter}
              onChange={(e) => onTypeFilterChange(e.target.value)}
            >
              {TYPE_FILTERS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="mg-filter-tip">
          Tip: Start with <b>All stages</b> and <b>All media</b> to see
          everything, then narrow down to a specific build step or just images,
          video, audio, or documents.
        </p>
      </div>

      <label className="mg-sort">
        <span className="mg-sort-label">Sort</span>
        <select
          value={sortMode}
          onChange={(e) => onSortChange(e.target.value)}
        >
          {sortOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

/* -------------------- section grid -------------------- */

function MediaSection({ title, items, onOpen }) {
  if (!items?.length) return null;

  return (
    <div className="mg-section">
      <div className="mg-title">{title}</div>
      <div className="mg-grid">
        {items.map((it) => {
          const isPdfDoc = it.type === 'doc' && extOf(it.url) === '.pdf';
          const ytThumb =
            it.type === 'video' ? getYouTubeThumbnail(it.url) : null;

          return (
            <button
              key={it.id}
              className={`mg-thumb mg-${it.type}`}
              title={`${it.title} — ${it.category?.replace(/_/g, ' ') || ''}`}
              onClick={() => onOpen(it)}
            >
              {it.type === 'image' ? (
                <img src={it.url} alt={it.title} loading="lazy" />
              ) : it.type === 'video' && ytThumb ? (
                <div className="mg-video-thumb">
                  <img
                    className="mg-video-thumb-img"
                    src={ytThumb}
                    alt={it.title}
                    loading="lazy"
                  />
                  <div className="mg-video-thumb-overlay">
                    <span className="mg-video-play-icon">▶</span>
                    <span className="mg-name" title={it.title}>
                      {it.title}
                    </span>
                  </div>
                </div>
              ) : isPdfDoc ? (
                <div className="mg-doc-thumb">
                  <iframe
                    title={it.title}
                    src={`${it.url}#toolbar=0&navpanes=0&scrollbar=0`}
                  />
                  <div className="mg-doc-overlay">
                    <span className="mg-kind">PDF</span>
                    <span className="mg-name" title={it.title}>
                      {it.title}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mg-nonimage">
                  <span className="mg-kind">{it.type.toUpperCase()}</span>
                  <span className="mg-name" title={it.title}>
                    {it.title}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------- upload panel (admin only) -------------------- */

function MediaUploadPanel({ uploading, onUploadFiles, onAddUrl }) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [stage, setStage] = useState('0');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (uploading) return;
    const files = e.dataTransfer?.files;
    if (files && files.length) {
      onUploadFiles(files, stage);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragOver) setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length) {
      onUploadFiles(files, stage);
    }
    e.target.value = '';
  };

  const handleAddUrlClick = () => {
    if (!url.trim()) return;
    onAddUrl({ url: url.trim(), title: title.trim(), stageValue: stage });
    setUrl('');
    // keep title/stage for quick batch entry if desired
  };

  return (
    <section className="mg-upload-section">
      <h4 className="sow-heading mg-upload-heading">Add Media (admin)</h4>
      <div
        className={`mg-upload-card ${
          dragOver ? 'is-dragover' : ''
        } ${uploading ? 'is-uploading' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
      >
        <div className="mg-upload-main">
          <div className="mg-upload-icon">⬆️</div>
          <div className="mg-upload-text">
            <div className="mg-upload-title">
              {uploading
                ? 'Uploading media…'
                : 'Drag & drop media files here'}
            </div>
            <div className="mg-upload-sub">
              or click anywhere in this area to browse
            </div>
          </div>
        </div>

        <div className="mg-upload-fields">
          <input
            type="text"
            className="mg-upload-input"
            placeholder="Paste media URL (YouTube, Vimeo, SoundCloud…) — optional"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          <input
            type="text"
            className="mg-upload-input"
            placeholder="Optional title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          <select
            className="mg-upload-select"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          >
            <option value="0">No stage / Misc</option>
            {buildPhases.map((label, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {`Stage ${idx + 1} · ${label.replace(/^Step \d+\.\s*/, '')}`}
              </option>
            ))}
          </select>
        </div>

        <div className="mg-upload-actions">
          <button
            type="button"
            className="apo-btn mg-upload-btn"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
            disabled={uploading}
          >
            {uploading ? 'Uploading…' : 'Upload media files'}
          </button>
          <button
            type="button"
            className="apo-btn mg-upload-btn mg-upload-url-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleAddUrlClick();
            }}
            disabled={uploading || !url.trim()}
          >
            Add URL
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
        />
      </div>
      <p className="mg-upload-hint">
        Files are automatically grouped into Images, Video, Audio, or Documents
        based on type. Each item can be associated with a single build stage or
        marked as “No stage / Misc.”
      </p>
    </section>
  );
}

/* -------------------- modal viewer -------------------- */

function MediaModal({
  open,
  item,
  index,
  total,
  onClose,
  onPrev,
  onNext,
  canEdit,
  onChangeStage,
  onDelete,
}) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragOrigin = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
      if (item?.type === 'image') {
        if (e.key === '=') {
          e.preventDefault();
          setZoom((z) => Math.min(4, z + 0.25));
        }
        if (e.key === '-') {
          e.preventDefault();
          setZoom((z) => Math.max(1, z - 0.25));
        }
        if (e.key === '0') {
          e.preventDefault();
          setZoom(1);
          setOffset({ x: 0, y: 0 });
        }
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrev?.();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNext?.();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, item?.type, onClose, onPrev, onNext]);

  // reset zoom/offset when switching items
  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [item?.id]);

  if (!open || !item) return null;

  const filename = filenameFromUrl(item.url);

  const startDrag = (e) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setDragging(true);
    dragOrigin.current = {
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    };
  };

  const onDrag = (e) => {
    if (!dragging) return;
    e.preventDefault();
    const x = e.clientX - dragOrigin.current.x;
    const y = e.clientY - dragOrigin.current.y;
    setOffset({ x, y });
  };

  const endDrag = () => {
    setDragging(false);
  };

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = item.url;
      link.download = filename;
      link.target = '_blank';
      link.rel = 'noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download failed, opening in new tab instead.', err);
      window.open(item.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleStageChange = (e) => {
    const nextStage = e.target.value;
    onChangeStage?.(item, nextStage);
  };

const embedUrl =
  item.type === 'video' ? getVideoEmbedUrl(item.url) : null;

const isYouTubeHosted =
  item.type === 'video' && !!getYouTubeId(item.url);

  const showDownloadButton =
    item.type !== 'video' || !embedUrl || !isYouTubeHosted;

  const showOpenYouTubeButton =
    item.type === 'video' && embedUrl && isYouTubeHosted;

  return (
    <div
      className="mg-modal"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target.classList.contains('mg-modal')) onClose?.();
      }}
      onMouseMove={onDrag}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
    >
      <div className="mg-modal-inner">
        <div className="mg-modal-top">
          <div className="mg-nav-info">
            <div className="mg-modal-name" title={filename}>
              {filename}
              {item.category ? (
                <span className="mg-modal-cat">
                  {' '}
                  · {String(item.category).replace(/_/g, ' ')}
                </span>
              ) : null}
            </div>
            <div className="mg-modal-stage-wrap">
              {canEdit ? (
                <select
                  className="mg-modal-stage-select"
                  value={String(item.stage || 0)}
                  onChange={handleStageChange}
                >
                  <option value="0">No stage / Misc</option>
                  {buildPhases.map((label, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {`Stage ${idx + 1} · ${label.replace(
                        /^Step \d+\.\s*/,
                        ''
                      )}`}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="mg-modal-stage">
                  {stageLabel(item.stage || 0)}
                </span>
              )}
            </div>
            <div className="mg-index">
              {total > 0 ? `${index + 1} / ${total}` : null}
            </div>
          </div>

          <div className="mg-actions">
            {canEdit && (
              <button
                type="button"
                className="apo-btn mg-delete-btn"
                onClick={() => onDelete?.(item)}
              >
                Delete
              </button>
            )}

            <button
              className="apo-btn mg-nav-btn"
              onClick={onPrev}
              aria-label="Previous media"
            >
              ‹
            </button>
            <button
              className="apo-btn mg-nav-btn"
              onClick={onNext}
              aria-label="Next media"
            >
              ›
            </button>

            {item.type === 'image' && (
              <>
                <button
                  className="apo-btn"
                  onClick={() =>
                    setZoom((z) => Math.max(1, z - 0.25))
                  }
                >
                  –
                </button>
                <button
                  className="apo-btn"
                  onClick={() => {
                    setZoom(1);
                    setOffset({ x: 0, y: 0 });
                  }}
                >
                  Fit
                </button>
                <button
                  className="apo-btn"
                  onClick={() =>
                    setZoom((z) => Math.min(4, z + 0.25))
                  }
                >
                  +
                </button>
              </>
            )}

            {showDownloadButton && (
              <button
                type="button"
                className="apo-btn"
                onClick={handleDownload}
              >
                Download
              </button>
            )}

            {showOpenYouTubeButton && (
              <button
                type="button"
                className="apo-btn"
                onClick={() =>
                  window.open(item.url, '_blank', 'noopener,noreferrer')
                }
              >
                Open in YouTube
              </button>
            )}

            <button
              className="apo-btn"
              onClick={onClose}
              aria-label="Close preview"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="mg-modal-body">
          {item.type === 'image' && (
            <div className="mg-image-viewport">
              <div
                className={
                  'mg-image-wrap' +
                  (zoom > 1 ? ' is-zoomed' : '') +
                  (dragging ? ' is-dragging' : '')
                }
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                }}
                onMouseDown={startDrag}
              >
                <img src={item.url} alt={filename} />
              </div>
            </div>
          )}

          {item.type === 'video' && (
            <div className="mg-media-box mg-video-embed">
              {embedUrl ? (
                <div className="mg-embed-wrapper">
                  <iframe
                    src={embedUrl}
                    title={filename}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <video
                  src={item.url}
                  controls
                  playsInline
                  preload="metadata"
                  style={{ maxWidth: '100%', maxHeight: '100%' }}
                />
              )}
            </div>
          )}

          {item.type === 'audio' && (
            <div className="mg-media-box mg-audio">
              <div className="mg-audio-title">{filename}</div>
              <audio controls src={item.url} style={{ width: '100%' }} />
            </div>
          )}

          {item.type === 'doc' && (
            <div className="mg-doc">
              {extOf(item.url) === '.pdf' ? (
                <iframe
                  title={filename}
                  src={item.url}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    background: '#fff',
                  }}
                />
              ) : (
                <div className="pp2-empty">
                  Preview unavailable. Use <b>Download</b> to open this file.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}