import React, { useEffect, useState } from 'react';
import './ProjectOverview.css';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, db } from '../firebaseConfig';

const ProjectOverview = ({
  editableData,
  isEditing,
  onEditToggle,
  handleChange,
  onSave,
  onCancel,
}) => {
  const [overallStatus, setOverallStatus] = useState('Unknown');
  const [secondWood, setSecondWood] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [modalPreview, setModalPreview] = useState(null);
  const [isPreviewLoaded, setIsPreviewLoaded] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState(
    editableData?.attachments || { other: [] }
  );

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

  const [selectedCategory, setSelectedCategory] = useState(fileCategories[0]);

  const getDateInputValue = (val) => {
    if (!val) return '';
    try {
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val))
        return val;

      let d;
      if (val.toDate) d = val.toDate();
      else if (val.seconds) d = new Date(val.seconds * 1000);
      else d = new Date(val);

      if (isNaN(d)) return '';
      return d.toISOString().split('T')[0]; // returns YYYY-MM-DD
    } catch {
      return '';
    }
  };

  const formatDate = (value) => {
    if (!value) return 'N/A';

    let date;

    if (value.toDate) {
      // Firestore Timestamp
      date = value.toDate();
    } else if (value.seconds) {
      // Firestore Timestamp (alternate)
      date = new Date(value.seconds * 1000);
    } else if (typeof value === 'string') {
      const parsed = new Date(value);
      if (isNaN(parsed)) return 'N/A';
      date = parsed;
    } else if (value instanceof Date) {
      date = value;
    } else {
      return 'N/A';
    }

    // ✅ Local browser timezone rendering
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateStatus = (data) => {
    if (!data || !data.currentPhase) return 'Unknown';

    const phases = [
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

    const currentIndex = phases.indexOf(data.currentPhase);

    if (currentIndex === -1) return 'Unknown';
    if (currentIndex === phases.length - 1) return 'Final Check';
    if (currentIndex >= 0 && currentIndex < phases.length - 1)
      return 'In Progress';

    return 'Unknown';
  };

  useEffect(() => {
    if (editableData) {
      setOverallStatus(calculateStatus(editableData));
    }
  }, [editableData]);

  useEffect(() => {
    if (editableData?.attachments) {
      setUploadedFiles(editableData.attachments);
    }
  }, [editableData]);

  const renderDropdownField = (label, key, options) => (
    <div className="project-field-row" key={key}>
      <label className="project-label">{label}:</label>
      {isEditing ? (
        <select
          className="project-input"
          value={editableData?.[key] || ''}
          onChange={(e) => handleChange(key, e.target.value)}
        >
          <option value="">-- Select --</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <span className="project-value">
          {typeof editableData?.[key] === 'object'
            ? JSON.stringify(editableData[key])
            : editableData?.[key] || 'N/A'}
        </span>
      )}
    </div>
  );

  const renderTextField = (label, key) => {
    const getValue = (obj, path) =>
      path.split('.').reduce((o, p) => o?.[p], obj);

    return (
      <div className="project-field-row" key={key}>
        <label className="project-label">{label}:</label>
        {isEditing ? (
          <input
            className="project-input"
            type="text"
            value={getValue(editableData, key) || ''}
            onChange={(e) => handleChange(key, e.target.value)}
          />
        ) : (
          <span className="project-value">
            {getValue(editableData, key) || 'N/A'}
          </span>
        )}
      </div>
    );
  };

  const renderCheckboxField = (label, key) => {
    const getValue = (obj, path) =>
      path.split('.').reduce((o, p) => o?.[p], obj);

    return (
      <div className="project-field-row" key={key}>
        <label className="project-label">{label}:</label>
        {isEditing ? (
          <input
            type="checkbox"
            checked={!!getValue(editableData, key)}
            onChange={(e) => handleChange(key, e.target.checked)}
          />
        ) : (
          <span className="project-value">
            {getValue(editableData, key) ? 'Yes' : 'No'}
          </span>
        )}
      </div>
    );
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragging(false);

    const file = e.dataTransfer?.files?.[0];
    if (!file || !editableData?.id) return;

    const safeCategory = 'other';
    const path = `projects/${editableData.id}/attachments/${safeCategory}/${file.name}`;
    const fileRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(fileRef, file);

    setUploading(true);
    setUploadProgress(0);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(pct.toFixed(0));
      },
      (error) => {
        console.error('❌ Upload failed:', error);
        setUploading(false);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        const newFile = {
          url,
          category: safeCategory,
          hidden: true,
        };

        const updated = [...(uploadedFiles[safeCategory] || []), newFile];
        const updatedFiles = {
          ...uploadedFiles,
          [safeCategory]: updated,
        };

        setUploadedFiles(updatedFiles);

        try {
          await updateDoc(doc(db, 'projects', editableData.id), {
            [`attachments.${safeCategory}`]: updated,
          });
        } catch (err) {
          console.error('❌ Firestore update failed:', err);
        }

        setUploading(false);
        setUploadProgress(0);
      }
    );
  };

  return (
    <div className="admin-project-overview-content">
      <div className="admin-project-title">Project Details</div>
      <label className="project-label">
        Project ID: {editableData?.id || 'N/A'}
      </label>
      <label className="project-label">
        Parent Order ID:{' '}
        <a
          className="project-link"
          href={`/orders/${editableData?.orderId}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {editableData?.orderId || 'N/A'}
        </a>
      </label>
      {editableData?.id && (
        <p>
          <strong>View as Customer: </strong>
          <a
            href={`/projects/${editableData.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="customer-view-link"
          >
            Open Project View ↗
          </a>
        </p>
      )}
      <div className="admin-project-details">
        <div className="section-divider">
          <h4>Customer Info</h4>
          {renderTextField('Customer Name', 'customer.name')}
          {renderTextField('Email', 'customer.email')}
          {renderTextField('Phone', 'customer.phone')}
          {renderTextField('Street', 'customer.address.street')}
          {renderTextField('City', 'customer.address.city')}
          {renderTextField('State', 'customer.address.state')}
          {renderTextField('Zip Code', 'customer.address.zip')}
          {renderCheckboxField('Contact by Email', 'customer.prefersEmail')}
          {renderCheckboxField('Contact by Text', 'customer.prefersText')}
        </div>

        <h4>Drum Build Details</h4>

        <div className="project-field-row">
          <label className="project-label">Start Date:</label>
          {isEditing ? (
            <input
              className="project-input"
              type="date"
              value={getDateInputValue(editableData?.startDate)}
              onChange={(e) => handleChange('startDate', e.target.value)}
            />
          ) : (
            <span className="project-value">
              {formatDate(editableData?.startDate)}
            </span>
          )}
        </div>

        <div className="project-field-row">
          <label className="project-label">Target Completion:</label>
          {isEditing ? (
            <>
              <input
                className="project-input"
                type="date"
                value={getDateInputValue(editableData?.targetCompletion)}
                onChange={(e) =>
                  handleChange('targetCompletion', e.target.value)
                }
              />
              <span className="project-value" style={{ marginLeft: '1rem' }}>
                →
                {editableData?.targetCompletion
                  ? ` ${new Date(
                      new Date(
                        getDateInputValue(editableData.targetCompletion)
                      ).getTime() +
                        14 * 24 * 60 * 60 * 1000
                    ).toLocaleDateString()}`
                  : ' N/A'}{' '}
                (2-week buffer)
              </span>
            </>
          ) : (
            <span className="project-value">
              {formatDate(editableData?.targetCompletion)} →
              {editableData?.targetCompletion
                ? ` ${new Date(
                    new Date(
                      getDateInputValue(editableData.targetCompletion)
                    ).getTime() +
                      14 * 24 * 60 * 60 * 1000
                  ).toLocaleDateString()}`
                : ' N/A'}{' '}
              (2-week buffer)
            </span>
          )}
        </div>

        {renderDropdownField('Artisan Line', 'artisanLine', [
          'Soundlegend',
          'Heritage',
          'Feuzon Hybrid',
        ])}

        {renderDropdownField('Bearing Edge', 'bearingEdge', [
          'Double 45',
          'Double Rounded',
          '45 Inner + Rounded Outer',
        ])}

        {renderDropdownField('Shell Construction', 'shellConstructionName', [
          'Stave',
          'Hybrid',
          'Steam-bent',
        ])}

        {['stave', 'hybrid'].includes(
          typeof editableData?.shellConstructionName === 'string'
            ? editableData.shellConstructionName.toLowerCase()
            : ''
        ) ? (
          <>
            {renderDropdownField('Quantity Staves', 'staveCount', [
              '8',
              '10',
              '12',
              '16',
              '20',
            ])}

            {renderTextField(
              'Target Shell Thickness (mm)',
              'targetShellThickness'
            )}

            {renderDropdownField(
              'Primary Wood Species',
              'woodPrimary',
              woodSpeciesOptions
            )}
            {isEditing && (
              <>
                <label className="project-label">
                  Add Second Wood Species?
                </label>
                <input
                  type="checkbox"
                  checked={secondWood || !!editableData?.woodSecondary}
                  onChange={() => setSecondWood(!secondWood)}
                />
              </>
            )}
            {(secondWood || !!editableData?.woodSecondary) && (
              <>
                {renderDropdownField(
                  'Secondary Wood Species',
                  'woodSecondary',
                  woodSpeciesOptions
                )}
                {renderTextField('% of Secondary Wood', 'woodSecondaryPercent')}
              </>
            )}
            {(editableData?.shellConstructionName || '').toLowerCase() ===
              'hybrid' &&
              renderDropdownField(
                'Steam Bent Wood Species',
                'hybridSteamBentSpecies',
                woodSpeciesOptions
              )}
          </>
        ) : null}

        {typeof editableData?.shellConstruction === 'string' &&
          editableData.shellConstructionName.toLowerCase() === 'steam-bent' &&
          renderDropdownField(
            'Steam Bent Wood Species',
            'woodPrimary',
            woodSpeciesOptions
          )}

        {renderDropdownField('Width (Diameter)', 'width', [
          '10"',
          '12"',
          '13"',
          '14"',
          '15"',
        ])}
        {renderDropdownField('Depth', 'shellDepth', [
          '5"',
          '5.5"',
          '6"',
          '6.5"',
          '7"',
          '7.5"',
          '8"',
        ])}
        {renderDropdownField('Lug Count', 'lugCount', ['5', '6', '8', '10'])}
        {renderDropdownField('Lug Type', 'lugType', [
          'Single-end point bullet',
          'Single-end point tube',
          'Double-end tube',
          'Other',
        ])}
        {renderDropdownField('Hardware Color', 'hardwareColor', [
          'Chrome',
          'Brass/Gold',
          'Black Nickel',
          'Other',
        ])}
        {renderDropdownField('Hoops', 'hoops', [
          'Die-Cast',
          '2.3mm Triple Flange',
          '3.0mm Triple Flange',
        ])}
        {renderDropdownField('Reinforcement Rings', 'reinforcementRings', [
          'Yes',
          'None',
        ])}

        {editableData?.reinforcementRings === 'Yes' &&
          renderDropdownField(
            'Re-Rings Wood Species',
            'reringsSpecies',
            woodSpeciesOptions
          )}

        {renderDropdownField('Throw-off', 'snareThrowOff', [
          'Trick Percussion GS007AM (Multi-Step)',
          'Trick Percussion GS007AS (Single-Step)',
          'Dunnett R5 Swivel',
          'Gibraltar Dunnett R7',
          'Gibraltar George Way Beer Tap',
          'DW MAG',
        ])}
        {renderDropdownField('Snare Wires', 'snareWires', [
          'Puresound Custom',
          'Puresound Custom Pro (Steel)',
          'Puresound Custom Pro (Brass)',
          'Puresound Super 30',
          'Puresound Equalizer',
          'Puresound Blaster',
          'Puresound Twisted',
          'Puresound Concert',
        ])}
        {renderDropdownField('Snare Bed Depth', 'snareBedDepth', [
          'Low',
          'Medium',
          'Deep',
          'None',
        ])}
        {renderDropdownField('Finish Details', 'finishDetails', [
          'Natural',
          'Veneer (Standard)',
          'Veneer (Exotic)',
          'Stained',
          'Spray',
          'Epoxy',
          'Wrap',
        ])}
        {renderTextField('Additional Notes', 'additionalNotes')}

        <div className="project-buttons">
          <div className="project-buttons">
            {isEditing ? (
              <>
                <button className="save-btn" onClick={onSave}>
                  Save Changes
                </button>
                <button className="admin-edit-toggle-btn" onClick={onCancel}>
                  Cancel Edit
                </button>
              </>
            ) : (
              <button className="admin-edit-toggle-btn" onClick={onEditToggle}>
                Edit
              </button>
            )}
          </div>
        </div>
        <div className="project-upload-section">
          <h4>Upload Files</h4>
          <div
            className={`dropzone ${dragging ? 'drag-active' : ''}`}
            onDrop={(e) => handleDrop(e)}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => setDragging(true)}
            onDragLeave={() => setDragging(false)}
          >
            <p>Drag & drop files here (PDF, audio, images, video)</p>
            {uploading && (
              <p className="upload-progress">Uploading... {uploadProgress}%</p>
            )}
          </div>

          {Object.entries(uploadedFiles).map(([sectionKey, fileArray]) =>
            fileArray?.length > 0 ? (
              <div key={sectionKey}>
                <h4>{sectionKey.replace(/_/g, ' ').toUpperCase()}</h4>
                <div className="file-preview-grid">
                  {fileArray.map((file, i) => {
                    const url =
                      typeof file === 'string' ? file : file?.url || '';
                    const hidden = file.hidden ?? true;
                    const category = file.category || sectionKey || 'other';

                    const fileType = url.split('.').pop().toLowerCase();
                    const isImage = [
                      'jpg',
                      'jpeg',
                      'png',
                      'gif',
                      'webp',
                    ].includes(fileType);
                    const isPDF = fileType === 'pdf';
                    const isAudio = ['mp3', 'wav', 'ogg'].includes(fileType);
                    const isVideo = ['mp4', 'webm', 'mov'].includes(fileType);
                    const filename = decodeURIComponent(
                      url.split('/').pop().split('?')[0].split('%2F').pop()
                    );

                    const updateFile = (updates) => {
                      const newFiles = [...fileArray];
                      newFiles[i] = { ...newFiles[i], ...updates };
                      setUploadedFiles((prev) => ({
                        ...prev,
                        [sectionKey]: newFiles,
                      }));

                      updateDoc(doc(db, 'projects', editableData.id), {
                        [`attachments.${sectionKey}`]: newFiles,
                      }).catch((err) =>
                        console.error('❌ Firestore update failed:', err)
                      );
                    };

                    return (
                      <div key={i} className="file-preview-item">
                        <div
                          className="file-preview-inner"
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setIsPreviewLoaded(false);
                            const filename = url.split('/').pop().split('?')[0];
                            const ext = filename.includes('.')
                              ? filename.split('.').pop().toLowerCase()
                              : '';
                            setModalPreview({ url, ext });
                          }}
                        >
                          {isImage && (
                            <img
                              src={url}
                              alt="Preview"
                              className="file-preview-image"
                            />
                          )}
                          {isPDF && (
                            <iframe
                              src={url}
                              className="file-preview-pdf"
                              title={`pdf-${i}`}
                            />
                          )}
                          {isAudio && (
                            <audio controls className="file-preview-audio">
                              <source src={url} />
                            </audio>
                          )}
                          {isVideo && (
                            <video
                              muted
                              autoPlay
                              loop
                              className="file-preview-video"
                              title={`video-${i}`}
                            >
                              <source src={url} />
                            </video>
                          )}
                          {!isImage && !isPDF && !isAudio && !isVideo && (
                            <p className="file-name">{filename}</p>
                          )}
                        </div>

                        <div className="file-actions">
                          <label>
                            Sub-Category:
                            <select
                              value={category}
                              onChange={(e) =>
                                updateFile({ category: e.target.value })
                              }
                            >
                              {fileCategories.map((cat) => (
                                <option
                                  key={cat}
                                  value={cat.replace(/\s+/g, '_').toLowerCase()}
                                >
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label style={{ marginLeft: '1rem' }}>
                            <input
                              type="checkbox"
                              checked={!hidden}
                              onChange={(e) =>
                                updateFile({ hidden: !e.target.checked })
                              }
                            />
                            Visible to Customer
                          </label>
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
  <div
    className="file-preview-modal"
    onClick={() => setModalPreview(null)}
  >
    <div
      className="file-preview-modal-content"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="modal-close-button"
        onClick={() => setModalPreview(null)}
      >
        ✕
      </button>
      <a
        href={modalPreview.url}
        download
        target="_blank"
        rel="noopener noreferrer"
        className="modal-download-button"
      >
        ⬇ Download
      </a>

      {!isPreviewLoaded && modalPreview.ext !== 'pdf' && (
        <div className="preview-loading-spinner">Loading...</div>
      )}

      {modalPreview.ext === 'pdf' ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#ccc' }}>
            Preview not available due to browser restrictions.
          </p>
          <a
            href={modalPreview.url}
            target="_blank"
            rel="noopener noreferrer"
            className="modal-download-button"
          >
            Open PDF in New Tab ↗
          </a>
        </div>
      ) : modalPreview.ext === 'mp4' ||
        modalPreview.ext === 'webm' ||
        modalPreview.ext === 'mov' ? (
        <video
          controls
          autoPlay
          loop
          className="file-preview-video"
          style={{
            visibility: isPreviewLoaded ? 'visible' : 'hidden',
            opacity: isPreviewLoaded ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
          onLoadedData={() => setIsPreviewLoaded(true)}
        >
          <source src={modalPreview.url} />
        </video>
      ) : modalPreview.ext === 'mp3' ||
        modalPreview.ext === 'wav' ||
        modalPreview.ext === 'ogg' ? (
        <audio
          controls
          className="file-preview-audio"
          style={{
            visibility: isPreviewLoaded ? 'visible' : 'hidden',
            opacity: isPreviewLoaded ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
          onLoadedData={() => setIsPreviewLoaded(true)}
        >
          <source src={modalPreview.url} />
        </audio>
      ) : (
        <img
          src={modalPreview.url}
          alt="Preview"
          className="file-preview-image"
          style={{
            visibility: isPreviewLoaded ? 'visible' : 'hidden',
            opacity: isPreviewLoaded ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
          onLoad={() => setIsPreviewLoaded(true)}
        />
      )}
    </div>
  </div>
)}
      </div>
    </div>
  );
};

export default ProjectOverview;
