import React, { useEffect, useMemo, useRef, useState } from 'react';
import './Media.css';

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

// Flatten your attachments map into a single list with type + category + stage
const flattenAttachments = (attachments = {}) => {
  const out = [];
  let idx = 0;
  for (const [category, arr] of Object.entries(attachments)) {
    if (!Array.isArray(arr)) continue;
    for (const it of arr) {
      if (!it?.url) continue;
      const type = classifyType(it.url);
      out.push({
        id: `${category}:${it.url}`,
        url: it.url,
        title: it.title || it.name || filenameFromUrl(it.url),
        category,
        type,
        createdAt: tsToMillis(it.createdAt) || 0,
        stage: inferStage(it, category),
        order: idx++, // fallback “upload order”
      });
    }
  }
  return out;
};

// Group into the 4 top buckets we want to show (order fixed)
const bucketize = (items) => {
  const buckets = { Images: [], Video: [], Audio: [], Documents: [] };
  for (const it of items) {
    if (it.type === 'image') buckets.Images.push(it);
    else if (it.type === 'video') buckets.Video.push(it);
    else if (it.type === 'audio') buckets.Audio.push(it);
    else buckets.Documents.push(it);
  }
  return buckets;
};

const SORT_OPTIONS = [
  { id: 'date_desc', label: 'Upload date · Newest first' },
  { id: 'date_asc', label: 'Upload date · Oldest first' },
  { id: 'stage_asc', label: 'Build stage · 1 → 10' },
  { id: 'stage_desc', label: 'Build stage · 10 → 1' },
];

const TYPE_FILTERS = [
  { id: 'all', label: 'All media' },
  { id: 'image', label: 'Images' },
  { id: 'video', label: 'Video' },
  { id: 'audio', label: 'Audio' },
  { id: 'doc', label: 'Documents' },
];

/* -------------------- main tab component -------------------- */

export default function Media({ project }) {
  const [sortMode, setSortMode] = useState('date_desc');
  const [typeFilter, setTypeFilter] = useState('all');

  // NEW: index of current item in the *sorted* array (for modal nav)
  const [viewerIndex, setViewerIndex] = useState(null);

  const items = useMemo(
    () => flattenAttachments(project?.attachments || {}),
    [project?.attachments]
  );

  // apply media-type filter
  const filtered = useMemo(() => {
    if (typeFilter === 'all') return items;
    return items.filter((it) => it.type === typeFilter);
  }, [items, typeFilter]);

  // apply sort mode (unchanged from your working version)
  const sorted = useMemo(() => {
    const out = [...filtered];
    out.sort((a, b) => {
      const tA = a.createdAt || a.order;
      const tB = b.createdAt || b.order;

      if (sortMode === 'date_asc') {
        return tA - tB;
      }
      if (sortMode === 'date_desc') {
        return tB - tA;
      }

      const sa = a.stage || 0;
      const sb = b.stage || 0;

      if (sortMode === 'stage_asc') {
        if (sa !== sb) {
          if (sa === 0) return 1; // unknown last
          if (sb === 0) return -1;
          return sa - sb; // 1 → 10
        }
        // tie-break within same stage: oldest → newest
        return tA - tB;
      }

      if (sortMode === 'stage_desc') {
        if (sa !== sb) {
          if (sa === 0) return 1; // unknown last
          if (sb === 0) return -1;
          return sb - sa; // 10 → 1
        }
        // tie-break within same stage: newest → oldest
        return tB - tA;
      }

      return 0;
    });
    return out;
  }, [filtered, sortMode]);

  const buckets = useMemo(() => bucketize(sorted), [sorted]);

  // close viewer if sorted list shrinks and index is now invalid
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

  return (
    <div
      className="slp-card mg-card"
      data-component="Media"
    >
      <h3>Media</h3>
      <p className="slp-muted mg-description">
        Curated by <b>Ober Artisan</b> throughout your build journey — follow
        along as your SoundLegend comes to life. Click any item to preview; use
        the download button to save.
      </p>

      <MediaToolbar
        sortMode={sortMode}
        onSortChange={setSortMode}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
      />

      {sorted.length === 0 ? (
        <div className="pp2-empty">No media has been published yet.</div>
      ) : (
        <>
          <MediaSection
            title="Images"
            items={buckets.Images}
            onOpen={openViewer}
          />
          <MediaSection
            title="Video"
            items={buckets.Video}
            onOpen={openViewer}
          />
          <MediaSection
            title="Audio"
            items={buckets.Audio}
            onOpen={openViewer}
          />
          <MediaSection
            title="Documents"
            items={buckets.Documents}
            onOpen={openViewer}
          />
        </>
      )}

      <MediaModal
        open={!!currentItem}
        item={currentItem}
        index={viewerIndex ?? 0}
        total={sorted.length}
        onClose={closeViewer}
        onPrev={goPrev}
        onNext={goNext}
      />
    </div>
  );
}

/* -------------------- toolbar -------------------- */

function MediaToolbar({
  sortMode,
  onSortChange,
  typeFilter,
  onTypeFilterChange,
}) {
  return (
    <div className="mg-toolbar">
      <div className="mg-filter-group" aria-label="Filter by media type">
        {TYPE_FILTERS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`mg-pill ${typeFilter === t.id ? 'is-active' : ''}`}
            onClick={() => onTypeFilterChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <label className="mg-sort">
        <span className="mg-sort-label">Sort by</span>
        <select
          value={sortMode}
          onChange={(e) => onSortChange(e.target.value)}
        >
          {SORT_OPTIONS.map((opt) => (
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
          const isPdfDoc =
            it.type === 'doc' && extOf(it.url) === '.pdf';

          return (
            <button
              key={it.id}
              className={`mg-thumb mg-${it.type}`}
              title={`${it.title} — ${
                it.category?.replace(/_/g, ' ') || ''
              }`}
              onClick={() => onOpen(it)}
            >
              {it.type === 'image' ? (
                <img src={it.url} alt={it.title} loading="lazy" />
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

/* -------------------- modal viewer -------------------- */

function MediaModal({ open, item, index, total, onClose, onPrev, onNext }) {
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
              {item.stage ? (
                <span className="mg-modal-stage">
                  {' '}
                  · Stage {item.stage}
                </span>
              ) : null}
            </div>
            <div className="mg-index">
              {total > 0 ? `${index + 1} / ${total}` : null}
            </div>
          </div>

          <div className="mg-actions">
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

            <button
              type="button"
              className="apo-btn"
              onClick={handleDownload}
            >
              Download
            </button>
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
            <div className="mg-media-box">
              <video
                src={item.url}
                controls
                playsInline
                preload="metadata"
                style={{ maxWidth: '100%', maxHeight: '72vh' }}
              />
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
                    height: '72vh',
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