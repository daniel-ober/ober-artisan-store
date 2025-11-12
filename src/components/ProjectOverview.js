import React, { useEffect, useState, useMemo } from 'react';
import './ProjectOverview.css';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, db } from '../firebaseConfig';

/* ---------- tiny helpers ---------- */
const val = (...c) => c.find(v => v !== undefined && v !== null && v !== '') ?? undefined;
const getIdentifier = (p = {}) => {
  const serial = val(p.serial, p.serialNumber, p.projectSerial, p.snareSerial, p.serialId, p.lineSerial) || '';
  const line   = val(p.series, p.artisanLine, p.productLine, p.seriesLine, p.line) || '';
  const dia    = val(p.diameter, p.width);
  const dep    = val(p.depth, p.shellDepth);
  const size   = dia && dep ? ` · ${dia}×${dep}"` : '';
  if (serial && line) return `${serial} · ${line}${size}`;
  if (serial)         return `${serial}${size}`;
  if (line)           return `${line}${size}`;
  return size ? size.slice(3) : '—';
};

/** AfterShip universal tracking link */
const makeTrackingUrl = (tracking) =>
  tracking ? `https://track.aftership.com/${encodeURIComponent(String(tracking).trim())}` : '';

/* ---------- Vault fallbacks (preview only) ---------- */
const LEGACY_PRIVATE_TEXT = '<p>Legacy is set to Private.</p>';
const LEGACY_UNKNOWN_TEXT = '<p>Legacy Unknown.</p>';

/* ---------- Toggle ---------- */
const Toggle = ({ checked, onChange, disabled, id }) => (
  <button
    id={id}
    type="button"
    className={`apo-toggle ${checked ? 'on' : 'off'} ${disabled ? 'disabled' : ''}`}
    role="switch"
    aria-checked={checked}
    onClick={() => !disabled && onChange(!checked)}
  >
    <span className="knob" />
  </button>
);

const ProjectOverview = ({
  editableData,
  isEditing,
  onEditToggle,
  handleChange,
  onSave,
  onCancel,
}) => {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [modalPreview, setModalPreview] = useState(null);
  const [isPreviewLoaded, setIsPreviewLoaded] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState(
    editableData?.attachments || { other: [] }
  );

  /* ---- Vault public prefs (admin controls) ---- */
  const [publicPrefs, setPublicPrefs] = useState({
    namePublicEnabled: false,
    storyPublicEnabled: false,
    displayName: '',
    storyHtml: '',
  });

  const woodSpeciesOptions = [
    'Maple','Walnut','Cherry','Birch','Oak','Ash','Mahogany','Bubinga','Purpleheart','Rosewood',
  ];

  const fileCategories = [
    'Build Proposal',
    'Wood Selection',
    'Early Mockups (Pre-Production)',
    'Stave Construction (Pre-Milling)',
    'Stave Construction (Post-Milling)',
    'Final Mockups (Mid-Production)',
    'Media Files (Audio/Video)',
    'Other',
  ];

  /* ---------- util date formatters ---------- */
  const getDateInputValue = (val) => {
    if (!val) return '';
    try {
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
      let d;
      if (val?.toDate) d = val.toDate();
      else if (val?.seconds) d = new Date(val.seconds * 1000);
      else d = new Date(val);
      if (isNaN(d)) return '';
      return d.toISOString().split('T')[0];
    } catch { return ''; }
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
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  /* ---- seed public prefs from Firestore doc (if present) ---- */
  useEffect(() => {
    const p = editableData?.publicPrefs || {};
    setPublicPrefs({
      namePublicEnabled: !!p.namePublicEnabled,
      storyPublicEnabled: !!p.storyPublicEnabled,
      displayName: p.displayName || '',
      storyHtml: p.storyHtml || '',
    });
  }, [editableData]);

  /* ---------- uploads ---------- */
  const regroupFilesByCategory = (allFiles) => {
    const grouped = {};
    Object.entries(allFiles || {}).forEach(([key, fileArray]) => {
      (fileArray || []).forEach((file) => {
        const category = file?.category || key || 'other';
        if (!grouped[category]) grouped[category] = [];
        grouped[category].push(file);
      });
    });
    return grouped;
  };

  const handleDeleteFile = (sectionKey, index) => {
    const file = uploadedFiles[sectionKey]?.[index];
    if (!file || !file.url) return;
    if (!editableData?.id) return;

    if (!window.confirm('Delete this file?')) return;

    const updatedSection = [...uploadedFiles[sectionKey]];
    updatedSection.splice(index, 1);
    const updatedAll = { ...uploadedFiles, [sectionKey]: updatedSection };
    setUploadedFiles(updatedAll);

    updateDoc(doc(db, 'projects', editableData.id), {
      [`attachments.${sectionKey}`]: updatedSection,
    }).catch((err) => console.error('❌ Failed to delete file from Firestore:', err));
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
            const updatedFiles = { ...uploadedFiles, [safeCategory]: updated };
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

  const groupedFiles = useMemo(() => regroupFilesByCategory(uploadedFiles), [uploadedFiles]);

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
    ? (publicPrefs.displayName || editableData?.customer?.name || '—')
    : 'Anonymous Legend';

  const previewStoryHtml = publicPrefs.storyPublicEnabled
    ? (publicPrefs.storyHtml || LEGACY_UNKNOWN_TEXT)
    : LEGACY_PRIVATE_TEXT;

  const trackingUrl = makeTrackingUrl(editableData?.shipping?.trackingNumber);

  /* ==================== RENDER ==================== */
  return (
    <div className="apo-container">
      {/* header chips */}
      <div className="apo-header-chips">
        <span className="apo-chip apo-id">🆔 {getIdentifier(editableData || {})}</span>
        {editableData?.customerName && <span className="apo-chip">👤 {editableData.customerName}</span>}
        {editableData?.id && <span className="apo-chip apo-mono">ID: {editableData.id}</span>}
      </div>

      <div className="apo-title">Project Details</div>

      {/* meta line */}
      <div className="apo-meta">
        <div className="apo-meta-item">
          <span className="apo-label">Project ID:</span>
          <span className="apo-mono">{editableData?.id || 'N/A'}</span>
        </div>
        <div className="apo-meta-item">
          <span className="apo-label">Parent Order ID:</span>
          <a
            className="apo-link"
            href={`/orders/${editableData?.orderId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {editableData?.orderId || 'N/A'}
          </a>
        </div>
        {editableData?.id && (
          <div className="apo-meta-item">
            <span className="apo-label">View as Customer:</span>
            <a
              href={`/projects/${editableData.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="apo-link"
            >
              Open Project View ↗
            </a>
          </div>
        )}
      </div>

      <div className="apo-actions">
        {isEditing ? (
          <>
            <button className="apo-btn primary" onClick={onSave}>Save Changes</button>
            <button className="apo-btn ghost" onClick={onCancel}>Cancel Edit</button>
          </>
        ) : (
          <button className="apo-btn ghost" onClick={onEditToggle}>Edit</button>
        )}
      </div>

      {/* ---------- LEGACY VAULT VISIBILITY (admin) ---------- */}
      <div className="apo-card">
        <h4 className="apo-h4">Legacy Vault Visibility</h4>

        <div className="apo-row">
          <label className="apo-label" htmlFor="toggle-name">Display name publicly</label>
          <div className="apo-field">
            <Toggle
              id="toggle-name"
              checked={publicPrefs.namePublicEnabled}
              onChange={(v) => setPublicPrefs({ ...publicPrefs, namePublicEnabled: v })}
            />
            <span className="apo-hint">
              If off, Vault will show <strong>Anonymous Legend</strong>.
            </span>
          </div>
        </div>

        <div className="apo-row">
          <label className="apo-label">Public Name (optional override)</label>
          {isEditing ? (
            <input
              className="apo-input"
              type="text"
              placeholder="Leave blank to use account name"
              value={publicPrefs.displayName}
              onChange={(e) => setPublicPrefs({ ...publicPrefs, displayName: e.target.value })}
            />
          ) : (
            <span className="apo-value">
              {publicPrefs.displayName || editableData?.customer?.name || '—'}
            </span>
          )}
        </div>

        <hr className="apo-sep" />

        <div className="apo-row">
          <label className="apo-label" htmlFor="toggle-story">Display story publicly</label>
          <div className="apo-field">
            <Toggle
              id="toggle-story"
              checked={publicPrefs.storyPublicEnabled}
              onChange={(v) => setPublicPrefs({ ...publicPrefs, storyPublicEnabled: v })}
            />
            <span className="apo-hint">
              If off, Vault will show <strong>Legacy is set to Private</strong>.
            </span>
          </div>
        </div>

        <div className="apo-row">
          <label className="apo-label">Story HTML (optional override)</label>
          {isEditing ? (
            <textarea
              className="apo-input"
              rows={7}
              placeholder="Paste or write HTML."
              value={publicPrefs.storyHtml}
              onChange={(e) => setPublicPrefs({ ...publicPrefs, storyHtml: e.target.value })}
            />
          ) : (
            <div
              className="apo-value"
              dangerouslySetInnerHTML={{ __html: (publicPrefs.storyHtml || LEGACY_UNKNOWN_TEXT) }}
            />
          )}
        </div>

        <div className="apo-actions">
          <button className="apo-btn primary" onClick={saveVaultPrefs}>Save Vault Preferences</button>
        </div>

        <div className="vp-title">Public Preview</div>
        <div className="vp-card">
          <div className="vp-name">
            {publicPrefs.namePublicEnabled
              ? (publicPrefs.displayName || editableData?.customer?.name || '—')
              : 'Anonymous Legend'}
          </div>
          <div
            className="vp-story"
            dangerouslySetInnerHTML={{
              __html: publicPrefs.storyPublicEnabled
                ? (publicPrefs.storyHtml || LEGACY_UNKNOWN_TEXT)
                : LEGACY_PRIVATE_TEXT,
            }}
          />
        </div>
      </div>

      {/* -------- Customer info -------- */}
      <div className="apo-card">
        <h4 className="apo-h4">Customer Info</h4>
        <div className="apo-row"><label className="apo-label">Customer Name:</label><span className="apo-value">{editableData?.customer?.name || 'N/A'}</span></div>
        <div className="apo-row"><label className="apo-label">Email:</label><span className="apo-value">{editableData?.customer?.email || 'N/A'}</span></div>
        <div className="apo-row"><label className="apo-label">Phone:</label><span className="apo-value">{editableData?.customer?.phone || 'N/A'}</span></div>
        <div className="apo-row"><label className="apo-label">Street:</label><span className="apo-value">{editableData?.customer?.address?.street || 'N/A'}</span></div>
        <div className="apo-row"><label className="apo-label">City:</label><span className="apo-value">{editableData?.customer?.address?.city || 'N/A'}</span></div>
        <div className="apo-row"><label className="apo-label">State:</label><span className="apo-value">{editableData?.customer?.address?.state || 'N/A'}</span></div>
        <div className="apo-row"><label className="apo-label">Zip Code:</label><span className="apo-value">{editableData?.customer?.address?.zip || 'N/A'}</span></div>
      </div>

      {/* -------- Drum build (unchanged fields condensed) -------- */}
      <div className="apo-card">
        <h4 className="apo-h4">Drum Build Details</h4>

        <div className="apo-row">
          <label className="apo-label">Line Serial (e.g., SL-001):</label>
          {isEditing
            ? <input className="apo-input apo-input-mono" value={editableData?.lineSerial || ''} onChange={(e)=>handleChange('lineSerial', e.target.value)} />
            : <span className="apo-value apo-mono">{editableData?.lineSerial || '—'}</span>}
        </div>

        <div className="apo-row">
          <label className="apo-label">Global Serial (overall build #):</label>
          {isEditing
            ? <input className="apo-input apo-input-mono" value={editableData?.globalSerial || ''} onChange={(e)=>handleChange('globalSerial', e.target.value)} />
            : <span className="apo-value apo-mono">{editableData?.globalSerial || '—'}</span>}
        </div>

        <div className="apo-row">
          <label className="apo-label">Start Date:</label>
          {isEditing
            ? <input className="apo-input" type="date" value={getDateInputValue(editableData?.startDate)} onChange={(e)=>handleChange('startDate', e.target.value)} />
            : <span className="apo-value">{formatDate(editableData?.startDate)}</span>}
        </div>

        <div className="apo-row">
          <label className="apo-label">Target Completion:</label>
          {isEditing
            ? <input className="apo-input" type="date" value={getDateInputValue(editableData?.targetCompletion)} onChange={(e)=>handleChange('targetCompletion', e.target.value)} />
            : <span className="apo-value">{formatDate(editableData?.targetCompletion)}</span>}
        </div>

        <div className="apo-row">
          <label className="apo-label">Actual Completion:</label>
          {isEditing
            ? <input className="apo-input" type="date" value={getDateInputValue(editableData?.actualCompletion)} onChange={(e)=>handleChange('actualCompletion', e.target.value)} />
            : <span className="apo-value">{formatDate(editableData?.actualCompletion)}</span>}
        </div>
      </div>

      {/* -------- Shipping -------- */}
      <div className="apo-card">
        <h4 className="apo-h4">Shipping Details</h4>

        <div className="apo-row">
          <label className="apo-label">Ship Date:</label>
          {isEditing
            ? <input className="apo-input" type="date" value={getDateInputValue(editableData?.shipping?.shipDate)} onChange={(e)=>handleChange('shipping.shipDate', e.target.value)} />
            : <span className="apo-value">{formatDate(editableData?.shipping?.shipDate)}</span>}
        </div>

        <div className="apo-row">
          <label className="apo-label">Delivery Date:</label>
          {isEditing
            ? <input className="apo-input" type="date" value={getDateInputValue(editableData?.shipping?.deliveryDate)} onChange={(e)=>handleChange('shipping.deliveryDate', e.target.value)} />
            : <span className="apo-value">{formatDate(editableData?.shipping?.deliveryDate)}</span>}
        </div>

        <div className="apo-row">
          <label className="apo-label">Tracking Number:</label>
          {isEditing ? (
            <input
              className="apo-input apo-input-mono"
              type="text"
              placeholder="e.g., 1Z999AA10123456784"
              value={editableData?.shipping?.trackingNumber || ''}
              onChange={(e) => handleChange('shipping.trackingNumber', e.target.value)}
            />
          ) : editableData?.shipping?.trackingNumber ? (
            <a className="apo-link apo-mono" href={trackingUrl} target="_blank" rel="noopener noreferrer">
              {editableData.shipping.trackingNumber}
            </a>
          ) : (
            <span className="apo-value">N/A</span>
          )}
        </div>
      </div>

      {/* -------- Uploads -------- */}
      <div className="apo-card">
        <h4 className="apo-h4">Upload Files</h4>

        <div
          className={`apo-dropzone ${dragging ? 'drag' : ''}`}
          onDrop={(e) => handleDrop(e)}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={() => setDragging(true)}
          onDragLeave={() => setDragging(false)}
        >
          <div className="apo-manual-upload">
            <label htmlFor="manual-file-input" className="apo-label">Or choose files:</label>
            <input
              id="manual-file-input"
              type="file"
              multiple
              onChange={(e) => {
                const dt = new DataTransfer();
                Array.from(e.target.files).forEach((f) => dt.items.add(f));
                handleDrop({ dataTransfer: dt, preventDefault: () => {} });
              }}
            />
          </div>
          <p className="apo-hint">Drag & drop files here (PDF, audio, images, video)</p>
          {uploading && <p className="apo-progress">Uploading... {uploadProgress}%</p>}
        </div>

        {Object.entries(groupedFiles).map(([sectionKey, fileArray]) =>
          fileArray?.length > 0 ? (
            <div key={sectionKey}>
              <h4 className="apo-h4">{sectionKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</h4>
              <div className="file-preview-grid">
                {fileArray.map((file, i) => {
                  const url = file?.url || (typeof file === 'string' ? file : '');
                  const hidden = file.hidden ?? true;
                  const category = file.category || sectionKey || 'other';

                  const filename = decodeURIComponent(
                    url.split('/').pop().split('?')[0].split('%2F').pop()
                  );
                  const fileType = (filename.split('.').pop() || '').toLowerCase();
                  const isImage = ['jpg','jpeg','png','gif','webp'].includes(fileType);
                  const isPDF   = fileType === 'pdf';
                  const isAudio = ['mp3','wav','ogg'].includes(fileType);
                  const isVideo = ['mp4','webm','mov'].includes(fileType);

                  const updateFile = (updates) => {
                    const updatedFile = { ...file, ...updates };
                    const updatedArray = [...fileArray];
                    updatedArray[i] = updatedFile;

                    const updatedAll = { ...groupedFiles, [sectionKey]: updatedArray };

                    // flatten back to Firestore-friendly structure
                    const flattened = Object.values(updatedAll).flat();
                    const groupedForFirestore = {};
                    flattened.forEach((f) => {
                      const cat = f.category || 'other';
                      if (!groupedForFirestore[cat]) groupedForFirestore[cat] = [];
                      groupedForFirestore[cat].push(f);
                    });

                    setUploadedFiles(groupedForFirestore);

                    if (editableData?.id) {
                      updateDoc(doc(db, 'projects', editableData.id), {
                        attachments: groupedForFirestore,
                      }).catch((err) => console.error('❌ Firestore update failed:', err));
                    }
                  };

                  return (
                    <div key={i} className="file-preview-item">
                      <div
                        className="file-preview-inner"
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          setIsPreviewLoaded(false);
                          const ext = fileType;
                          setModalPreview({ url, ext });
                        }}
                      >
                        {isImage && <img src={url} alt="Preview" className="file-preview-image" />}
                        {isPDF && <iframe src={url} className="file-preview-pdf" title={`pdf-${i}`} />}
                        {isAudio && <audio controls className="file-preview-audio"><source src={url} /></audio>}
                        {isVideo && <video muted autoPlay loop className="file-preview-video" title={`video-${i}`}><source src={url} /></video>}
                        {!isImage && !isPDF && !isAudio && !isVideo && <p className="file-name">{filename}</p>}
                      </div>

                      <div className="file-actions">
                        <label>
                          Sub-Category:
                          <select
                            value={category}
                            onChange={(e) => updateFile({ category: e.target.value })}
                          >
                            {fileCategories.map((cat) => (
                              <option key={cat} value={cat.replace(/\s+/g, '_').toLowerCase()}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label style={{ marginLeft: '1rem' }}>
                          <input
                            type="checkbox"
                            checked={!hidden}
                            onChange={(e) => updateFile({ hidden: !e.target.checked })}
                          />
                          Visible to Customer
                        </label>
                        <button className="delete-file-btn" onClick={() => handleDeleteFile(sectionKey, i)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null
        )}
      </div>

      {modalPreview && (
        <div className="file-preview-modal" onClick={() => setModalPreview(null)}>
          <div className="file-preview-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-button" onClick={() => setModalPreview(null)}>✕</button>
            <a href={modalPreview.url} download target="_blank" rel="noopener noreferrer" className="modal-download-button">⬇ Download</a>
            {!isPreviewLoaded && <div className="preview-loading-spinner">Loading...</div>}
            {modalPreview.ext === 'pdf' ? (
              <iframe
                src={modalPreview.url}
                title="PDF Preview"
                className="file-preview-pdf"
                style={{ visibility: isPreviewLoaded ? 'visible' : 'hidden', opacity: isPreviewLoaded ? 1 : 0, transition: 'opacity 0.4s ease' }}
                onLoad={() => setIsPreviewLoaded(true)}
              />
            ) : ['mp4','webm','mov'].includes(modalPreview.ext) ? (
              <video
                controls
                autoPlay
                loop
                className="file-preview-video"
                style={{ visibility: isPreviewLoaded ? 'visible' : 'hidden', opacity: isPreviewLoaded ? 1 : 0, transition: 'opacity 0.4s ease' }}
                onLoadedData={() => setIsPreviewLoaded(true)}
              >
                <source src={modalPreview.url} />
              </video>
            ) : ['mp3','wav','ogg'].includes(modalPreview.ext) ? (
              <audio
                controls
                className="file-preview-audio"
                style={{ visibility: isPreviewLoaded ? 'visible' : 'hidden', opacity: isPreviewLoaded ? 1 : 0, transition: 'opacity 0.4s ease' }}
                onLoadedData={() => setIsPreviewLoaded(true)}
              >
                <source src={modalPreview.url} />
              </audio>
            ) : (
              <img
                src={modalPreview.url}
                alt="Preview"
                className="file-preview-image"
                style={{ visibility: isPreviewLoaded ? 'visible' : 'hidden', opacity: isPreviewLoaded ? 1 : 0, transition: 'opacity 0.4s ease' }}
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