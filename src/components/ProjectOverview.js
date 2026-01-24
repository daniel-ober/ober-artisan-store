import React, { useEffect, useState, useMemo } from 'react';
import './ProjectOverview.css';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, db } from '../firebaseConfig';
import { calculateProjectProgress } from '../utils/calculateProjectProgress';

/* ---------- tiny helpers ---------- */
const val = (...c) =>
  c.find((v) => v !== undefined && v !== null && v !== '') ?? undefined;

const getIdentifier = (p = {}) => {
  const serial =
    val(
      p.serial,
      p.serialNumber,
      p.projectSerial,
      p.snareSerial,
      p.serialId,
      p.lineSerial
    ) || '';
  const line =
    val(p.series, p.artisanLine, p.productLine, p.seriesLine, p.line) || '';
  const dia = val(p.diameter, p.width);
  const dep = val(p.depth, p.shellDepth);
  const size = dia && dep ? ` · ${dia}×${dep}"` : '';
  if (serial && line) return `${serial} · ${line}${size}`;
  if (serial) return `${serial}${size}`;
  if (line) return `${line}${size}`;
  return size ? size.slice(3) : '—';
};

/** Safely render anything that should be text. Avoids crashing on objects
 * like { checklist: [...] } coming from bad data.
 */
const safeText = (value, fallback = 'N/A') => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') return fallback;
  return String(value);
};

/** AfterShip universal tracking link */
const makeTrackingUrl = (tracking) =>
  tracking
    ? `https://track.aftership.com/${encodeURIComponent(
        String(tracking).trim()
      )}`
    : '';

/* ---------- Vault fallbacks (preview only) ---------- */
const LEGACY_PRIVATE_TEXT = '<p>Legacy is set to Private.</p>';
const LEGACY_UNKNOWN_TEXT = '<p>Legacy Unknown.</p>';

/* ---------- Toggle ---------- */
const Toggle = ({ checked, onChange, disabled, id }) => (
  <button
    id={id}
    type="button"
    className={`apo-toggle ${checked ? 'on' : 'off'} ${
      disabled ? 'disabled' : ''
    }`}
    role="switch"
    aria-checked={checked}
    onClick={() => !disabled && onChange(!checked)}
  >
    <span className="knob" />
  </button>
);

/* ---------- Build phases (for progress breakdown + attachment categories) ---------- */
const buildPhases = [
  { key: 'discoveryDesign', label: '1. Discovery & Design' },
  { key: 'commitmentPortal', label: '2. Commitment & Portal Setup' },
  { key: 'woodVisionLockIn', label: '3. Wood & Vision Lock-In' },
  { key: 'rawShellCreation', label: '4. Raw Shell Creation' },
  { key: 'shellTrueingTorchTune', label: '5. Shell Trueing & Torch Tune' },
  { key: 'exteriorArtFinish', label: '6. Exterior Art & Finish' },
  { key: 'edgesSnareBeds', label: '7. Edges & Snare Beds' },
  { key: 'hardwareAssembly', label: '8. Hardware & Assembly' },
  { key: 'legacyTuningMedia', label: '9. Legacy Tuning & Media' },
  {
    key: 'finalQAPackagingDelivery',
    label: '10. Final QA, Packaging & Delivery',
  },
];

/**
 * Patch the data before sending to calculateProjectProgress.
 * Same alias map as ManageProjectModal.
 */
const getWeightedProgressPct = (data) => {
  if (!data) return 0;

  const patched = {
    ...data,
    woodPreparation: data.discoveryDesign,
    shellConstruction: data.commitmentPortal,
    fineTuning: data.woodVisionLockIn,
    shellExteriorFinish: data.rawShellCreation,
    bearingEdges: data.shellTrueingTorchTune,
    snareBedCutting: data.exteriorArtFinish,
    hardwareDrilling: data.edgesSnareBeds,
    hardwareAssembly: data.hardwareAssembly,
    tuningAndDetailing: data.legacyTuningMedia,
    qualityCheck: data.finalQAPackagingDelivery,
  };

  return calculateProjectProgress(patched);
};

/* ---- helpers: normalize attachments shape ---- */
const normalizeAttachments = (attachments) => {
  const result = {};

  Object.entries(attachments || {}).forEach(([sectionKey, fileArray]) => {
    if (Array.isArray(fileArray)) {
      result[sectionKey] = fileArray;
    } else if (fileArray && typeof fileArray === 'object') {
      // handle old object-based shape
      const vals = Object.values(fileArray);
      result[sectionKey] = vals.length ? vals : [];
    } else {
      result[sectionKey] = [];
    }
  });

  if (!result.other) result.other = [];
  return result;
};

const ProjectOverview = ({
  editableData,
  isEditing,
  onEditToggle,
  handleChange,
  onSave,
  onCancel,
}) => {
  /* ---- uploads / preview ---- */
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [modalPreview, setModalPreview] = useState(null);
  const [isPreviewLoaded, setIsPreviewLoaded] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState(() =>
    normalizeAttachments(editableData?.attachments)
  );

  // keep attachments in sync if I switch projects
  useEffect(() => {
    setUploadedFiles(normalizeAttachments(editableData?.attachments));
  }, [editableData?.attachments]);

  /* ---- collapsible sections: all collapsed by default; max one open ---- */
  const [openSections, setOpenSections] = useState({
    scope: false,
    openCheckpoints: false,
    customer: false,
    vault: false,
  });

  const toggleSection = (key) => {
    setOpenSections((prev) => {
      const isCurrentlyOpen = !!prev[key];

      // base: everything closed
      const base = {
        scope: false,
        openCheckpoints: false,
        customer: false,
        vault: false,
      };

      // if clicking an open section -> close all
      if (isCurrentlyOpen) return base;

      // otherwise open just this one
      return { ...base, [key]: true };
    });
  };

  /* ---- Vault public prefs (admin controls) ---- */
  const [publicPrefs, setPublicPrefs] = useState({
    namePublicEnabled: false,
    storyPublicEnabled: false,
    displayName: '',
    storyHtml: '',
  });

  const woodSpeciesOptions = [
    'Maple',
    'Walnut',
    'Cherry',
    'Birch',
    'Oak',
    'Ash',
    'Mahogany',
    'Bubinga',
    'Purpleheart',
    'Rosewood',
  ];

  const artisanLines = [
    'SoundLegend',
    'Heritage',
    'Feuzon',
    'One Series',
    'Other',
  ];

  const shellConstructionOptions = [
    'Stave',
    'Feuzon Hybrid',
    'Segmented',
    'Ply / Keller',
    'Steam-Bent',
    'Other',
  ];

  const bearingEdgeOptions = [
    '45° inner / 1/4" roundover outer',
    '45° inner / full roundover',
    'Double 45°',
    'Rounded vintage',
    'Custom',
  ];

  const hoopOptions = [
    'Die-Cast',
    'Triple-Flanged',
    'Single-Flanged',
    'Wood hoops',
  ];

  // Attachment categories aligned to 10 steps (+ uncategorized)
  const fileCategories = [
    '1. Discovery & Design',
    '2. Commitment & Portal Setup',
    '3. Wood & Vision Lock-In',
    '4. Raw Shell Creation',
    '5. Shell Trueing & Torch Tune',
    '6. Exterior Art & Finish',
    '7. Edges & Snare Beds',
    '8. Hardware & Assembly',
    '9. Legacy Tuning & Media',
    '10. Final QA, Packaging & Delivery',
  ];

  /* ---------- util date formatters ---------- */
  const getDateInputValue = (val) => {
    if (!val) return '';
    try {
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val))
        return val;
      let d;
      if (val?.toDate) d = val.toDate();
      else if (val?.seconds) d = new Date(val.seconds * 1000);
      else d = new Date(val);
      if (isNaN(d)) return '';
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const formatDate = (value) => {
    if (!value) return 'N/A';
    let date;
    if (value?.toDate) date = value.toDate();
    else if (value?.seconds) date = new Date(value.seconds * 1000);
    else if (typeof value === 'string') {
      const parsed = new Date(value);
      if (isNaN(parsed)) return 'N/A';
      date = parsed;
    } else if (value instanceof Date) date = value;
    else return 'N/A';
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  /* ---- seed public prefs from Firestore doc (if present) ---- */
  useEffect(() => {
    const p = editableData?.publicPrefs || {};
    setPublicPrefs({
      namePublicEnabled: p.namePublicEnabled ?? p.showName ?? false,
      storyPublicEnabled: p.storyPublicEnabled ?? p.showStory ?? false,
      displayName: p.displayName || '',
      storyHtml: p.storyHtml || '',
    });
  }, [editableData]);

  // keep local uploadedFiles in sync when switching projects (old shape)
  useEffect(() => {
    setUploadedFiles(editableData?.attachments || { other: [] });
  }, [editableData?.attachments]);

  /* ---------- uploads (used by Attachments) ---------- */
  // Normalize attachments: keep original buckets, just ensure each is an array
  const normalizeAttachmentsByBucket = (allFiles) => {
    const normalized = {};

    Object.entries(allFiles || {}).forEach(([bucket, fileArray]) => {
      let arr;

      if (Array.isArray(fileArray)) {
        arr = fileArray;
      } else if (fileArray && typeof fileArray === 'object') {
        // Could be {0: file, 1: file} or a single file object
        const values = Object.values(fileArray);
        if (
          values.length &&
          values.every((v) => v && typeof v === 'object' && v.url)
        ) {
          arr = values;
        } else {
          arr = [fileArray];
        }
      } else {
        arr = [];
      }

      normalized[bucket] = arr;
    });

    return normalized;
  };

  const handleDeleteFile = (sectionKey, index) => {
    const bucket = uploadedFiles[sectionKey];
    if (!bucket || !editableData?.id) return;

    if (!window.confirm('Delete this file?')) return;

    // Normalize to an array so we can safely splice
    const currentArr = Array.isArray(bucket)
      ? [...bucket]
      : Object.values(bucket || {});

    if (!currentArr[index]) return;

    // Remove the selected file (even if it has no .url)
    currentArr.splice(index, 1);

    const updatedAll = {
      ...uploadedFiles,
      [sectionKey]: currentArr,
    };
    setUploadedFiles(updatedAll);

    updateDoc(doc(db, 'projects', editableData.id), {
      [`attachments.${sectionKey}`]: currentArr,
    }).catch((err) =>
      console.error('❌ Failed to delete file from Firestore:', err)
    );
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragging(false);

    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length === 0 || !editableData?.id) return;

    const safeCategory = 'other';
    const projectId = editableData.id;

    for (const file of files) {
      const path = `projects/${projectId}/attachments/${safeCategory}/${file.name}`;
      const fileRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(fileRef, file);

      setUploading(true);
      setUploadProgress(0);

      await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(pct.toFixed(0));
          },
          (error) => {
            console.error('❌ Upload failed:', error);
            setUploading(false);
            reject(error);
          },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            const newFile = { url, category: safeCategory, hidden: true };

            const updated = [...(uploadedFiles[safeCategory] || []), newFile];
            const updatedFiles = {
              ...uploadedFiles,
              [safeCategory]: updated,
            };
            setUploadedFiles(updatedFiles);

            try {
              await updateDoc(doc(db, 'projects', projectId), {
                [`attachments.${safeCategory}`]: updated,
              });
            } catch (err) {
              console.error('❌ Firestore update failed:', err);
            }

            setUploadProgress(0);
            resolve();
          }
        );
      });
    }

    setUploading(false);
  };

  const normalizedFiles = useMemo(
    () => normalizeAttachmentsByBucket(uploadedFiles),
    [uploadedFiles]
  );

  /* ---------- SAVE: Vault prefs (admin) ---------- */
  const saveVaultPrefs = async () => {
    if (!editableData?.id) return;
    try {
      await updateDoc(doc(db, 'projects', editableData.id), {
        publicPrefs: {
          namePublicEnabled: !!publicPrefs.namePublicEnabled,
          storyPublicEnabled: !!publicPrefs.storyPublicEnabled,
          displayName: publicPrefs.displayName || '',
          storyHtml: publicPrefs.storyHtml || '',
        },
      });
      alert('Your Vault privacy preferences were saved.');
    } catch (err) {
      console.error('❌ Failed to save vault prefs:', err);
      alert('There was an error saving Vault preferences.');
    }
  };

  /* ---------- derived preview ---------- */
  const previewName = publicPrefs.namePublicEnabled
    ? safeText(
        publicPrefs.displayName ||
          editableData?.customer?.name ||
          editableData?.customerName,
        '—'
      )
    : 'Anonymous Legend';

  const previewStoryHtml = publicPrefs.storyPublicEnabled
    ? publicPrefs.storyHtml || LEGACY_UNKNOWN_TEXT
    : LEGACY_PRIVATE_TEXT;

  const trackingUrl = makeTrackingUrl(
    safeText(editableData?.shipping?.trackingNumber, '')
  );

  /* ---------- time-weighted progress + checklist stats ---------- */
  const progressMeta = useMemo(() => {
    const data = editableData || {};

    // Tasks (raw checklist progress)
    let completedTasks = 0;
    let totalTasks = 0;

    buildPhases.forEach((phase) => {
      const cl = data[phase.key]?.checklist || [];
      totalTasks += cl.length;
      completedTasks += cl.filter((t) => t.completed).length;
    });

    const tasksPct = totalTasks
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    // Weighted progress we use everywhere
    const weightedPct = getWeightedProgressPct(data);

    // Current phase label
    let currentPhaseLabel = 'All Steps Complete';
    for (const phase of buildPhases) {
      const cl = data[phase.key]?.checklist;
      if (!cl || cl.some((i) => !i.completed)) {
        currentPhaseLabel = phase.label;
        break;
      }
    }

    return {
      weightedPct,
      tasksPct,
      completedTasks,
      totalTasks,
      currentPhaseLabel,
    };
  }, [editableData]);

  /* ---------- OPEN CHECKPOINTS (grouped by step) ---------- */
  const openCheckpointsByStep = useMemo(() => {
    const data = editableData || {};
    const map = {};

    buildPhases.forEach((phase) => {
      const checklist = data[phase.key]?.checklist || [];
      const openItems = checklist.filter((item) => !item.completed);
      if (openItems.length) {
        map[phase.label] = openItems.map((item, idx) => ({
          id: item.id || `${phase.key}-${idx}`,
          task: item.task || item.label || '',
        }));
      }
    });

    return map;
  }, [editableData]);

  const totalOpenSteps = Object.keys(openCheckpointsByStep).length;
  const totalOpenTasks = Object.values(openCheckpointsByStep).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  /* ==================== RENDER ==================== */
  return (
    <div className="apo-container">
      {/* ---------- Progress overview (always visible at top) ---------- */}
        <h4 className="apo-h4">Progress Overview</h4>
        <div className="apo-progress-bar-wrap">
          <div className="apo-progress-bar-track">
            <div
              className="apo-progress-bar-fill"
              style={{ width: `${progressMeta.weightedPct || 0}%` }}
            />
          </div>
          <div className="apo-progress-bar-label">
            Overall Progress (time-weighted):{' '}
            <span className="apo-progress-pill">
              {progressMeta.weightedPct || 0}%
            </span>
          </div>
        </div>

        <div className="apo-progress-meta-row">
          <div className="apo-progress-pill-row">
            <span className="apo-progress-pill-label">
              Checklist completion:
            </span>
            <span className="apo-progress-pill">
              {progressMeta.completedTasks}/{progressMeta.totalTasks || 0} tasks
              ({progressMeta.tasksPct || 0}%)
            </span>
          </div>
          <div className="apo-progress-pill-row">
            <span className="apo-progress-pill-label">Current phase:</span>
            <span className="apo-progress-pill apo-progress-phase-pill">
              {progressMeta.currentPhaseLabel}
            </span>
          </div>
        </div>

      {/* ======================================================
          1) PROJECT SCOPE
         ====================================================== */}
      <div
        className={`apo-card apo-section ${
          openSections.scope ? 'open' : 'collapsed'
        }`}
      >
        <button
          type="button"
          className="apo-section-header"
          onClick={() => toggleSection('scope')}
        >
          <div className="apo-section-header-main">
            <span className="apo-section-title">Project Scope</span>
            <span className="apo-section-subtitle">
              A high-level snapshot of how this drum is built.
            </span>
          </div>
          <div className="apo-section-header-meta">
            <span className="apo-section-summary">
              {safeText(editableData?.artisanLine, '—')} ·{' '}
              {safeText(
                editableData?.width ?? editableData?.diameter,
                '—'
              )}
              ×
              {safeText(
                editableData?.shellDepth ?? editableData?.depth,
                '—'
              )}
              "
            </span>

            {isEditing ? (
              <div
                className="apo-edit-controls"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="apo-cancel-btn"
                  onClick={onCancel}
                >
                  Cancel
                </button>
                <button type="button" className="apo-save-btn" onClick={onSave}>
                  Save
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="apo-edit-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditToggle();
                }}
              >
                Edit
              </button>
            )}

            <span
              className={`apo-section-chevron ${
                openSections.scope ? 'open' : ''
              }`}
            >
              ▾
            </span>
          </div>
        </button>

        {openSections.scope && (
          <div className="apo-section-body apo-scope-body">
            <p className="apo-scope-admin-hint">
              Admin view: you’re viewing the scope of work for{' '}
              <span className="apo-mono">
                {safeText(
                  editableData?.customer?.email ||
                    editableData?.customerEmail,
                  '—'
                )}
              </span>
              .
            </p>

            {/* Identity */}
            <div className="apo-scope-group">
              <div className="apo-scope-heading">Identity</div>

              <div className="apo-row">
                <label className="apo-label">Artisan Line</label>
                {isEditing ? (
                  <select
                    className="apo-input"
                    value={safeText(editableData?.artisanLine, '')}
                    onChange={(e) =>
                      handleChange('artisanLine', e.target.value)
                    }
                  >
                    <option value="">Select line</option>
                    {artisanLines.map((line) => (
                      <option key={line} value={line}>
                        {line}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="apo-value">
                    {safeText(editableData?.artisanLine, 'N/A')}
                  </span>
                )}
              </div>

              <div className="apo-row">
                <label className="apo-label">Serial</label>
                {isEditing ? (
                  <input
                    className="apo-input"
                    type="text"
                    value={safeText(
                      editableData?.serial ||
                        editableData?.serialNumber ||
                        editableData?.projectSerial ||
                        editableData?.snareSerial,
                      ''
                    )}
                    onChange={(e) => handleChange('serial', e.target.value)}
                  />
                ) : (
                  <span className="apo-value">
                    {safeText(
                      editableData?.serial ||
                        editableData?.serialNumber ||
                        editableData?.projectSerial ||
                        editableData?.snareSerial,
                      'N/A'
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Shell & Geometry */}
            <div className="apo-scope-group">
              <div className="apo-scope-heading">Shell &amp; Geometry</div>

              <div className="apo-row">
                <label className="apo-label">Dimensions</label>
                {isEditing ? (
                  <div className="apo-size-row">
                    <input
                      type="number"
                      className="apo-input apo-input-inline"
                      placeholder='Diameter (e.g. 14")'
                      value={safeText(
                        editableData?.width ?? editableData?.diameter,
                        ''
                      )}
                      onChange={(e) => handleChange('width', e.target.value)}
                    />
                    <span className="apo-size-x">×</span>
                    <input
                      type="number"
                      className="apo-input apo-input-inline"
                      placeholder='Depth (e.g. 8")'
                      value={safeText(
                        editableData?.shellDepth ?? editableData?.depth,
                        ''
                      )}
                      onChange={(e) =>
                        handleChange('shellDepth', e.target.value)
                      }
                    />
                    <span className="apo-size-unit">"</span>
                  </div>
                ) : (
                  <span className="apo-value apo-mono">
                    {safeText(
                      editableData?.width ?? editableData?.diameter,
                      '—'
                    )}
                    ×
                    {safeText(
                      editableData?.shellDepth ?? editableData?.depth,
                      '—'
                    )}
                    "
                  </span>
                )}
              </div>

              <div className="apo-row">
                <label className="apo-label">Stave Count</label>
                {isEditing ? (
                  <input
                    type="number"
                    className="apo-input apo-input-inline"
                    placeholder="# of staves"
                    value={safeText(editableData?.staveCount, '')}
                    onChange={(e) => handleChange('staveCount', e.target.value)}
                  />
                ) : (
                  <span className="apo-value">
                    {editableData?.staveCount
                      ? `${safeText(editableData.staveCount)}-stave`
                      : 'N/A'}
                  </span>
                )}
              </div>

              <div className="apo-row">
                <label className="apo-label">Shell Construction</label>
                {isEditing ? (
                  <select
                    className="apo-input"
                    value={safeText(editableData?.shellConstruction, '')}
                    onChange={(e) =>
                      handleChange('shellConstruction', e.target.value)
                    }
                  >
                    <option value="">Select construction</option>
                    {shellConstructionOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="apo-value">
                    {safeText(editableData?.shellConstruction, 'N/A')}
                  </span>
                )}
              </div>

              <div className="apo-row">
                <label className="apo-label">Reinforcement Rings</label>
                {isEditing ? (
                  <input
                    className="apo-input"
                    type="text"
                    placeholder='e.g. None, 1/4" Maple top/bottom'
                    value={safeText(editableData?.reinforcementRings, '')}
                    onChange={(e) =>
                      handleChange('reinforcementRings', e.target.value)
                    }
                  />
                ) : (
                  <span className="apo-value">
                    {safeText(editableData?.reinforcementRings, 'None')}
                  </span>
                )}
              </div>
            </div>

            {/* Wood & Veneer */}
            <div className="apo-scope-group">
              <div className="apo-scope-heading">Wood &amp; Veneer</div>

              <div className="apo-row">
                <label className="apo-label">Primary Species</label>
                {isEditing ? (
                  <select
                    className="apo-input"
                    value={safeText(editableData?.primaryWoodSpecies, '')}
                    onChange={(e) =>
                      handleChange('primaryWoodSpecies', e.target.value)
                    }
                  >
                    <option value="">Select primary species</option>
                    {woodSpeciesOptions.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="apo-value">
                    {safeText(editableData?.primaryWoodSpecies, 'N/A')}
                  </span>
                )}
              </div>

              <div className="apo-row">
                <label className="apo-label">Secondary / Hybrid</label>
                {isEditing ? (
                  <input
                    className="apo-input"
                    type="text"
                    placeholder="e.g. Cherry (50%)"
                    value={safeText(editableData?.secondaryWoodSpecies, '')}
                    onChange={(e) =>
                      handleChange('secondaryWoodSpecies', e.target.value)
                    }
                  />
                ) : (
                  <span className="apo-value">
                    {safeText(editableData?.secondaryWoodSpecies, 'None')}
                  </span>
                )}
              </div>

              <div className="apo-row">
                <label className="apo-label">Veneer / Top Sheet</label>
                {isEditing ? (
                  <input
                    className="apo-input"
                    type="text"
                    placeholder="e.g. Mappa Burl (Exotic)"
                    value={safeText(editableData?.veneerTopSheet, '')}
                    onChange={(e) =>
                      handleChange('veneerTopSheet', e.target.value)
                    }
                  />
                ) : (
                  <span className="apo-value">
                    {safeText(editableData?.veneerTopSheet, 'N/A')}
                  </span>
                )}
              </div>
            </div>

            {/* Edges & Snare Beds */}
            <div className="apo-scope-group">
              <div className="apo-scope-heading">Edges &amp; Snare Beds</div>

              <div className="apo-row">
                <label className="apo-label">Bearing Edges</label>
                {isEditing ? (
                  <select
                    className="apo-input"
                    value={safeText(editableData?.bearingEdgeSpec, '')}
                    onChange={(e) =>
                      handleChange('bearingEdgeSpec', e.target.value)
                    }
                  >
                    <option value="">Select edge spec</option>
                    {bearingEdgeOptions.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="apo-value">
                    {safeText(editableData?.bearingEdgeSpec, 'N/A')}
                  </span>
                )}
              </div>

              <div className="apo-row">
                <label className="apo-label">Snare Bed Depth</label>
                {isEditing ? (
                  <input
                    className="apo-input"
                    type="text"
                    placeholder="e.g. Low / Medium / Deep"
                    value={safeText(editableData?.snareBedDepth, '')}
                    onChange={(e) =>
                      handleChange('snareBedDepth', e.target.value)
                    }
                  />
                ) : (
                  <span className="apo-value">
                    {safeText(editableData?.snareBedDepth, 'N/A')}
                  </span>
                )}
              </div>
            </div>

            {/* Hardware */}
            <div className="apo-scope-group">
              <div className="apo-scope-heading">Hardware</div>

              <div className="apo-row">
                <label className="apo-label">Lug Type</label>
                {isEditing ? (
                  <input
                    className="apo-input"
                    type="text"
                    placeholder="e.g. Single-point Vintage Tube"
                    value={safeText(editableData?.lugType, '')}
                    onChange={(e) => handleChange('lugType', e.target.value)}
                  />
                ) : (
                  <span className="apo-value">
                    {safeText(editableData?.lugType, 'N/A')}
                  </span>
                )}
              </div>

              <div className="apo-row">
                <label className="apo-label">Hardware Finish</label>
                {isEditing ? (
                  <input
                    className="apo-input"
                    type="text"
                    placeholder="e.g. Brass / Gold"
                    value={safeText(editableData?.hardwareFinish, '')}
                    onChange={(e) =>
                      handleChange('hardwareFinish', e.target.value)
                    }
                  />
                ) : (
                  <span className="apo-value">
                    {safeText(editableData?.hardwareFinish, 'N/A')}
                  </span>
                )}
              </div>

              <div className="apo-row">
                <label className="apo-label">Hoops</label>
                {isEditing ? (
                  <select
                    className="apo-input"
                    value={safeText(editableData?.hoopType, '')}
                    onChange={(e) => handleChange('hoopType', e.target.value)}
                  >
                    <option value="">Select hoop type</option>
                    {hoopOptions.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="apo-value">
                    {safeText(editableData?.hoopType, 'N/A')}
                  </span>
                )}
              </div>

              <div className="apo-row">
                <label className="apo-label">Throw-Off</label>
                {isEditing ? (
                  <input
                    className="apo-input"
                    type="text"
                    placeholder="e.g. Trick"
                    value={safeText(editableData?.throwOff, '')}
                    onChange={(e) => handleChange('throwOff', e.target.value)}
                  />
                ) : (
                  <span className="apo-value">
                    {safeText(editableData?.throwOff, 'N/A')}
                  </span>
                )}
              </div>

              <div className="apo-row">
                <label className="apo-label">Snare Wires</label>
                {isEditing ? (
                  <input
                    className="apo-input"
                    type="text"
                    placeholder="e.g. Puresound"
                    value={safeText(editableData?.snareWires, '')}
                    onChange={(e) => handleChange('snareWires', e.target.value)}
                  />
                ) : (
                  <span className="apo-value">
                    {safeText(editableData?.snareWires, 'N/A')}
                  </span>
                )}
              </div>
            </div>

            {/* Finish */}
            <div className="apo-scope-group">
              <div className="apo-scope-heading">Finish</div>

              <div className="apo-row">
                <label className="apo-label">Exterior Finish</label>
                {isEditing ? (
                  <input
                    className="apo-input"
                    type="text"
                    placeholder="e.g. Custom PolyGloss"
                    value={safeText(
                      editableData?.exteriorFinish ||
                        editableData?.finishDetails,
                      ''
                    )}
                    onChange={(e) =>
                      handleChange('exteriorFinish', e.target.value)
                    }
                  />
                ) : (
                  <span className="apo-value">
                    {safeText(
                      editableData?.exteriorFinish ||
                        editableData?.finishDetails,
                      'N/A'
                    )}
                  </span>
                )}
              </div>

              <div className="apo-row">
                <label className="apo-label">Interior Finish</label>
                {isEditing ? (
                  <input
                    className="apo-input"
                    type="text"
                    placeholder="e.g. Raw / Oil / Sealed"
                    value={safeText(editableData?.interiorFinish, '')}
                    onChange={(e) =>
                      handleChange('interiorFinish', e.target.value)
                    }
                  />
                ) : (
                  <span className="apo-value">
                    {safeText(editableData?.interiorFinish, '—')}
                  </span>
                )}
              </div>

              <div className="apo-row">
                <label className="apo-label">Resin / Acrylic Accent</label>
                {isEditing ? (
                  <input
                    className="apo-input"
                    type="text"
                    placeholder="e.g. Cowboy Blue"
                    value={safeText(editableData?.resinAccent, '')}
                    onChange={(e) =>
                      handleChange('resinAccent', e.target.value)
                    }
                  />
                ) : (
                  <span className="apo-value">
                    {safeText(editableData?.resinAccent, 'N/A')}
                  </span>
                )}
              </div>

              <div className="apo-row apo-row-textarea">
                <label className="apo-label">Additional Notes</label>
                {isEditing ? (
                  <textarea
                    className="apo-input"
                    rows={3}
                    placeholder="Any special requests or build notes."
                    value={safeText(editableData?.additionalNotes, '')}
                    onChange={(e) =>
                      handleChange('additionalNotes', e.target.value)
                    }
                  />
                ) : (
                  <span className="apo-value">
                    {safeText(editableData?.additionalNotes, 'N/A')}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================
          2) OPEN CHECKPOINTS
         ====================================================== */}
      <div
        className={`apo-card apo-section ${
          openSections.openCheckpoints ? 'open' : 'collapsed'
        }`}
      >
        <button
          type="button"
          className="apo-section-header"
          onClick={() => toggleSection('openCheckpoints')}
        >
          <div className="apo-section-header-main">
            <span className="apo-section-title">Open Checkpoints</span>
            <span className="apo-section-subtitle">Grouped by build phase</span>
          </div>
          <div className="apo-section-header-meta">
            <span className="apo-section-summary">
              {totalOpenTasks === 0
                ? 'All tasks complete'
                : `${totalOpenTasks} open task${
                    totalOpenTasks === 1 ? '' : 's'
                  } across ${totalOpenSteps} step${
                    totalOpenSteps === 1 ? '' : 's'
                  }`}
            </span>
            <span
              className={`apo-section-chevron ${
                openSections.openCheckpoints ? 'open' : ''
              }`}
            >
              ▾
            </span>
          </div>
        </button>

        {openSections.openCheckpoints && (
          <div className="apo-section-body">
            {totalOpenTasks === 0 ? (
              <p className="apo-hint">All checklist items are complete.</p>
            ) : (
              <div className="apo-open-groups">
                {Object.entries(openCheckpointsByStep).map(
                  ([stepLabel, items]) => (
                    <div key={stepLabel} className="apo-open-group">
                      <div className="apo-open-group-header">
                        <span className="apo-open-step">
                          {stepLabel}{' '}
                          <span className="apo-open-count">
                            ({items.length})
                          </span>
                        </span>
                      </div>
                      <ul className="apo-open-list">
                        {items.map((it) => (
                          <li key={it.id} className="apo-open-item">
                            <span className="apo-open-task">
                              {safeText(it.task, '')}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================================================
          3) CUSTOMER DETAILS
         ====================================================== */}
      <div
        className={`apo-card apo-section ${
          openSections.customer ? 'open' : 'collapsed'
        }`}
      >
        <button
          type="button"
          className="apo-section-header"
          onClick={() => toggleSection('customer')}
        >
          <div className="apo-section-header-main">
            <span className="apo-section-title">Customer Details</span>
            <span className="apo-section-subtitle">
              Contact + shipping information
            </span>
          </div>
          <div className="apo-section-header-meta">
            <span className="apo-section-summary">
              {safeText(
                editableData?.customer?.name || editableData?.customerName,
                'No name on file'
              )}
            </span>

            {isEditing ? (
              <div
                className="apo-edit-controls"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="apo-cancel-btn"
                  onClick={onCancel}
                >
                  Cancel
                </button>
                <button type="button" className="apo-save-btn" onClick={onSave}>
                  Save
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="apo-edit-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditToggle();
                }}
              >
                Edit
              </button>
            )}

            <span
              className={`apo-section-chevron ${
                openSections.customer ? 'open' : ''
              }`}
            >
              ▾
            </span>
          </div>
        </button>

        {openSections.customer && (
          <div className="apo-section-body">
            <div className="apo-row">
              <label className="apo-label">Customer Name</label>
              {isEditing ? (
                <input
                  className="apo-input"
                  type="text"
                  value={safeText(
                    editableData?.customer?.name ||
                      editableData?.customerName,
                    ''
                  )}
                  onChange={(e) =>
                    handleChange('customer.name', e.target.value)
                  }
                />
              ) : (
                <span className="apo-value">
                  {safeText(
                    editableData?.customer?.name ||
                      editableData?.customerName,
                    'N/A'
                  )}
                </span>
              )}
            </div>

            <div className="apo-row">
              <label className="apo-label">Email</label>
              {isEditing ? (
                <input
                  className="apo-input"
                  type="email"
                  value={safeText(editableData?.customer?.email, '')}
                  onChange={(e) =>
                    handleChange('customer.email', e.target.value)
                  }
                />
              ) : (
                <span className="apo-value">
                  {safeText(editableData?.customer?.email, 'N/A')}
                </span>
              )}
            </div>

            <div className="apo-row">
              <label className="apo-label">Phone</label>
              {isEditing ? (
                <input
                  className="apo-input"
                  type="tel"
                  value={safeText(editableData?.customer?.phone, '')}
                  onChange={(e) =>
                    handleChange('customer.phone', e.target.value)
                  }
                />
              ) : (
                <span className="apo-value">
                  {safeText(editableData?.customer?.phone, 'N/A')}
                </span>
              )}
            </div>

            <div className="apo-row">
              <label className="apo-label">Street</label>
              {isEditing ? (
                <input
                  className="apo-input"
                  type="text"
                  value={safeText(
                    editableData?.customer?.address?.street,
                    ''
                  )}
                  onChange={(e) =>
                    handleChange('customer.address.street', e.target.value)
                  }
                />
              ) : (
                <span className="apo-value">
                  {safeText(
                    editableData?.customer?.address?.street,
                    'N/A'
                  )}
                </span>
              )}
            </div>

            <div className="apo-row">
              <label className="apo-label">City</label>
              {isEditing ? (
                <input
                  className="apo-input"
                  type="text"
                  value={safeText(editableData?.customer?.address?.city, '')}
                  onChange={(e) =>
                    handleChange('customer.address.city', e.target.value)
                  }
                />
              ) : (
                <span className="apo-value">
                  {safeText(
                    editableData?.customer?.address?.city,
                    'N/A'
                  )}
                </span>
              )}
            </div>

            <div className="apo-row">
              <label className="apo-label">State</label>
              {isEditing ? (
                <input
                  className="apo-input"
                  type="text"
                  value={safeText(editableData?.customer?.address?.state, '')}
                  onChange={(e) =>
                    handleChange('customer.address.state', e.target.value)
                  }
                />
              ) : (
                <span className="apo-value">
                  {safeText(
                    editableData?.customer?.address?.state,
                    'N/A'
                  )}
                </span>
              )}
            </div>

            <div className="apo-row">
              <label className="apo-label">Zip Code</label>
              {isEditing ? (
                <input
                  className="apo-input"
                  type="text"
                  value={safeText(editableData?.customer?.address?.zip, '')}
                  onChange={(e) =>
                    handleChange('customer.address.zip', e.target.value)
                  }
                />
              ) : (
                <span className="apo-value">
                  {safeText(editableData?.customer?.address?.zip, 'N/A')}
                </span>
              )}
            </div>

            <div className="apo-row">
              <label className="apo-label">Target Completion</label>
              {isEditing ? (
                <input
                  className="apo-input"
                  type="date"
                  value={getDateInputValue(editableData?.targetCompletion)}
                  onChange={(e) =>
                    handleChange('targetCompletion', e.target.value)
                  }
                />
              ) : (
                <span className="apo-value">
                  {formatDate(editableData?.targetCompletion)}
                </span>
              )}
            </div>

            <div className="apo-row">
              <label className="apo-label">Shipping Tracking #</label>
              {isEditing ? (
                <input
                  className="apo-input apo-input-mono"
                  type="text"
                  value={safeText(
                    editableData?.shipping?.trackingNumber,
                    ''
                  )}
                  onChange={(e) =>
                    handleChange('shipping.trackingNumber', e.target.value)
                  }
                />
              ) : trackingUrl ? (
                <a
                  href={trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="apo-link apo-mono"
                >
                  {safeText(
                    editableData?.shipping?.trackingNumber,
                    'N/A'
                  )}
                </a>
              ) : (
                <span className="apo-value">
                  {safeText(
                    editableData?.shipping?.trackingNumber,
                    'N/A'
                  )}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ======================================================
          4) VAULT SETTINGS
         ====================================================== */}
      <div
        className={`apo-card apo-section ${
          openSections.vault ? 'open' : 'collapsed'
        }`}
      >
        <button
          type="button"
          className="apo-section-header"
          onClick={() => toggleSection('vault')}
        >
          <div className="apo-section-header-main">
            <span className="apo-section-title">Legacy Vault Settings</span>
            <span className="apo-section-subtitle">
              Public name, story, and preview
            </span>
          </div>
          <div className="apo-section-header-meta">
            <span className="apo-section-summary">
              {publicPrefs.namePublicEnabled || publicPrefs.storyPublicEnabled
                ? 'Partially public'
                : 'Private by default'}
            </span>
            <span
              className={`apo-section-chevron ${
                openSections.vault ? 'open' : ''
              }`}
            >
              ▾
            </span>
          </div>
        </button>

        {openSections.vault && (
          <div className="apo-section-body">
            <div className="apo-row">
              <label className="apo-label" htmlFor="toggle-name">
                Display name publicly
              </label>
              <div className="apo-field">
                <Toggle
                  id="toggle-name"
                  checked={publicPrefs.namePublicEnabled}
                  onChange={(v) =>
                    setPublicPrefs({
                      ...publicPrefs,
                      namePublicEnabled: v,
                    })
                  }
                />
                <span className="apo-hint">
                  If off, Vault will show <strong>Anonymous Legend</strong>.
                </span>
              </div>
            </div>

            <div className="apo-row">
              <label className="apo-label">Public Name</label>
              {isEditing ? (
                <input
                  className="apo-input"
                  type="text"
                  placeholder="Leave blank to use account name"
                  value={publicPrefs.displayName}
                  onChange={(e) =>
                    setPublicPrefs({
                      ...publicPrefs,
                      displayName: e.target.value,
                    })
                  }
                />
              ) : (
                <span className="apo-value">
                  {publicPrefs.displayName ||
                    safeText(
                      editableData?.customer?.name ||
                        editableData?.customerName,
                      '—'
                    )}
                </span>
              )}
            </div>

            <hr className="apo-sep" />

            <div className="apo-row">
              <label className="apo-label" htmlFor="toggle-story">
                Display story publicly
              </label>
              <div className="apo-field">
                <Toggle
                  id="toggle-story"
                  checked={publicPrefs.storyPublicEnabled}
                  onChange={(v) =>
                    setPublicPrefs({
                      ...publicPrefs,
                      storyPublicEnabled: v,
                    })
                  }
                />
                <span className="apo-hint">
                  If off, Vault will show{' '}
                  <strong>Legacy is set to Private</strong>.
                </span>
              </div>
            </div>

            <div className="apo-row apo-row-textarea">
              <label className="apo-label">Story HTML</label>
              {isEditing ? (
                <textarea
                  className="apo-input"
                  rows={7}
                  placeholder="Paste or write HTML shown in the Legacy Vault."
                  value={publicPrefs.storyHtml}
                  onChange={(e) =>
                    setPublicPrefs({
                      ...publicPrefs,
                      storyHtml: e.target.value,
                    })
                  }
                />
              ) : (
                <div
                  className="apo-value"
                  dangerouslySetInnerHTML={{
                    __html: publicPrefs.storyHtml || LEGACY_UNKNOWN_TEXT,
                  }}
                />
              )}
            </div>

            <div className="apo-actions-inline">
              <button
                className="apo-btn primary"
                type="button"
                onClick={saveVaultPrefs}
              >
                Save Vault Preferences
              </button>
            </div>

            <div className="vp-title">Public Preview</div>
            <div className="vp-card">
              <div className="vp-name">{previewName}</div>
              <div
                className="vp-story"
                dangerouslySetInnerHTML={{
                  __html: previewStoryHtml,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ======================================================
          ATTACHMENTS
         ====================================================== */}
      <div className="apo-card">
        <h4 className="apo-h4">Attachments</h4>

        <div
          className={`apo-dropzone ${dragging ? 'drag' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragging(false);
          }}
          onDrop={handleDrop}
        >
          <div>
            Drop files here to upload (defaults to “Other / Uncategorized” &amp;
            hidden).
          </div>
          {uploading && (
            <div className="apo-progress">Uploading… {uploadProgress}%</div>
          )}
        </div>

        <div className="file-preview-grid">
          {Object.entries(uploadedFiles || {}).map(([sectionKey, files]) => {
            // ensure array
            const arr = Array.isArray(files)
              ? files
              : files && typeof files === 'object'
              ? Object.values(files)
              : [];

            return arr.map((file, idx) => {
              const url = file?.url || file?.downloadURL || file?.path || '';

              return (
                <div key={`${sectionKey}-${idx}`} className="file-preview-item">
                  <button
                    type="button"
                    className="file-preview-inner"
                    onClick={() => {
                      if (!url) return;
                      setModalPreview({ ...file, url });
                      setIsPreviewLoaded(false);
                    }}
                  >
                    {/* basic type sniff */}
                    {!url ? (
                      <div className="file-preview-image file-preview-missing">
                        No preview
                      </div>
                    ) : url.match(/\.mp4|\.mov|\.webm/i) ? (
                      <video className="file-preview-video" src={url} />
                    ) : url.match(/\.mp3|\.wav|\.m4a/i) ? (
                      <audio
                        className="file-preview-audio"
                        src={url}
                        controls
                      />
                    ) : url.match(/\.pdf/i) ? (
                      <div className="file-preview-image file-preview-pdf">
                        PDF Preview
                      </div>
                    ) : (
                      <img
                        src={url}
                        alt={file.fileName || sectionKey}
                        className="file-preview-image"
                      />
                    )}
                    <div className="file-name">
                      {safeText(
                        file.category,
                        'Other / Uncategorized'
                      )}
                    </div>
                  </button>

                  <div className="file-actions">
                    <label>
                      Category
                      <select
                        value={file.category || ''}
                        onChange={(e) => {
                          const nextCat =
                            e.target.value || 'Other / Uncategorized';

                          const currentArrRaw = uploadedFiles[sectionKey] || [];
                          const currentArr = Array.isArray(currentArrRaw)
                            ? [...currentArrRaw]
                            : Object.values(currentArrRaw || {});

                          currentArr[idx] = {
                            ...currentArr[idx],
                            category: nextCat,
                          };

                          const updatedAll = {
                            ...uploadedFiles,
                            [sectionKey]: currentArr,
                          };
                          setUploadedFiles(updatedAll);

                          updateDoc(doc(db, 'projects', editableData.id), {
                            [`attachments.${sectionKey}`]: currentArr,
                          }).catch((err) =>
                            console.error(
                              '❌ Failed to update file category:',
                              err
                            )
                          );
                        }}
                      >
                        <option value="">Other / Uncategorized</option>
                        {fileCategories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Visible to customer
                      <input
                        type="checkbox"
                        checked={!file.hidden}
                        onChange={(e) => {
                          const visible = e.target.checked;
                          const currentArrRaw = uploadedFiles[sectionKey] || [];
                          const currentArr = Array.isArray(currentArrRaw)
                            ? [...currentArrRaw]
                            : Object.values(currentArrRaw || {});

                          currentArr[idx] = {
                            ...currentArr[idx],
                            hidden: !visible,
                          };

                          const updatedAll = {
                            ...uploadedFiles,
                            [sectionKey]: currentArr,
                          };
                          setUploadedFiles(updatedAll);

                          updateDoc(doc(db, 'projects', editableData.id), {
                            [`attachments.${sectionKey}`]: currentArr,
                          }).catch((err) =>
                            console.error(
                              '❌ Failed to update hidden flag:',
                              err
                            )
                          );
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      className="delete-file-btn"
                      onClick={() => handleDeleteFile(sectionKey, idx)}
                    >
                      Delete file
                    </button>
                  </div>
                </div>
              );
            });
          })}
        </div>
      </div>

      {/* ---------- Preview modal ---------- */}
      {modalPreview && (
        <div className="file-preview-modal">
          <div className="file-preview-modal-content">
            <button
              className="modal-close-button"
              onClick={() => setModalPreview(null)}
            >
              Close
            </button>
            <a
              className="modal-download-button"
              href={modalPreview.url}
              download
            >
              Download
            </a>

            {!isPreviewLoaded && (
              <div className="preview-loading-spinner">Loading preview…</div>
            )}

            {modalPreview.url?.match(/\.mp4|\.mov|\.webm/i) ? (
              <video
                className="file-preview-video"
                src={modalPreview.url}
                controls
                onLoadedData={() => setIsPreviewLoaded(true)}
              />
            ) : modalPreview.url?.match(/\.mp3|\.wav|\.m4a/i) ? (
              <audio
                className="file-preview-audio"
                src={modalPreview.url}
                controls
                onLoadedData={() => setIsPreviewLoaded(true)}
              />
            ) : modalPreview.url?.match(/\.pdf/i) ? (
              <iframe
                title="PDF preview"
                className="file-preview-pdf"
                src={modalPreview.url}
                onLoad={() => setIsPreviewLoaded(true)}
              />
            ) : (
              <img
                src={modalPreview.url}
                alt="Attachment preview"
                className="file-preview-image"
                onLoad={() => setIsPreviewLoaded(true)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectOverview;