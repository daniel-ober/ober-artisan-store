import React from 'react';
import {
  FILE_SECTION_KEYS,
  FILE_SECTION_LABELS,
  getProjectFileUrl,
  normalizeProjectFileRecord,
} from '../shared/projectFileHelpers';
import { MEDIA_FILE_SECTIONS } from '../shared/constants';

const MediaFilesSection = ({
  files,
  mediaFilterSection,
  setMediaFilterSection,
  mediaFilterVisibility,
  setMediaFilterVisibility,
  mediaFilterKind,
  setMediaFilterKind,
  mediaSortMode,
  setMediaSortMode,
  pendingProjectFileSection,
  setPendingProjectFileSection,
  pendingProjectFileHidden,
  setPendingProjectFileHidden,
  pendingProjectFile,
  setPendingProjectFile,
  isUploadingProjectFile,
  handleProjectFileUpload,
  handleUpdateProjectFile,
  handleMoveProjectFile,
  handleDeleteProjectFile,
  setPreviewFile,
}) => {
  const filteredFiles = files.filter((file) => {
    const section =
      file.section || file.category || file.subCategory || 'other';
    const visibility =
      file.hiddenFromCustomer || file.hidden ? 'hidden' : 'visible';
    const kind = file.kind || 'document';

    if (mediaFilterSection !== 'all' && section !== mediaFilterSection) {
      return false;
    }

    if (
      mediaFilterVisibility !== 'all' &&
      visibility !== mediaFilterVisibility
    ) {
      return false;
    }

    if (mediaFilterKind !== 'all' && kind !== mediaFilterKind) {
      return false;
    }

    return true;
  });

  const sortFiles = (arr = []) => {
    const copied = [...arr];

    if (mediaSortMode === 'nameAsc') {
      return copied.sort((a, b) =>
        String(a.displayName || a.name || '').localeCompare(
          String(b.displayName || b.name || '')
        )
      );
    }

    if (mediaSortMode === 'nameDesc') {
      return copied.sort((a, b) =>
        String(b.displayName || b.name || '').localeCompare(
          String(a.displayName || a.name || '')
        )
      );
    }

    if (mediaSortMode === 'newest') {
      return copied.sort(
        (a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0)
      );
    }

    if (mediaSortMode === 'oldest') {
      return copied.sort(
        (a, b) => new Date(a.uploadedAt || 0) - new Date(b.uploadedAt || 0)
      );
    }

    return copied.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  };

  const filesBySection = FILE_SECTION_KEYS.reduce((acc, key) => {
    acc[key] = sortFiles(
      filteredFiles.filter((file) => {
        const category =
          file?.section || file?.category || file?.subCategory || 'other';
        return category === key;
      })
    );
    return acc;
  }, {});

  return (
    <section className="mpm-surface mpm-tab-shell">
      <div className="mpm-tab-section-header">
        <div>
          <div className="mpm-tab-kicker">Overview</div>
          <h3 className="mpm-tab-title">Media & files</h3>
          <p className="mpm-tab-subtitle">
            Reference images, proposals, build captures, customer-visible files,
            and internal-only project assets.
          </p>
        </div>
      </div>

      <div className="mpm-surface" style={{ marginBottom: 18 }}>
        <div className="mpm-tab-kicker">Upload</div>
        <h4 className="mpm-tab-title">Add project files</h4>
        <p className="mpm-tab-subtitle">
          Upload reference images, proposals, build captures, and
          customer-facing or internal-only assets for this project.
        </p>

        <div className="mpm-media-upload-grid">
          <div className="mpm-media-upload-field">
            <label className="mpm-intake-field-label">Choose File</label>
            <input
              type="file"
              className="mpm-media-file-input"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setPendingProjectFile(file);
              }}
            />
          </div>

          <div className="mpm-media-upload-field">
            <label className="mpm-intake-field-label">File Section</label>
            <select
              className="mpm-phase-selector-dropdown"
              value={pendingProjectFileSection}
              onChange={(e) => setPendingProjectFileSection(e.target.value)}
            >
              {MEDIA_FILE_SECTIONS.map((section) => (
                <option key={section.key} value={section.key}>
                  {section.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mpm-media-upload-field">
            <label className="mpm-intake-field-label">Visibility</label>
            <label className="mpm-media-visibility-toggle">
              <input
                type="checkbox"
                checked={pendingProjectFileHidden}
                onChange={(e) => setPendingProjectFileHidden(e.target.checked)}
              />
              <span>
                {pendingProjectFileHidden
                  ? 'Hidden from customer portal'
                  : 'Visible in customer portal'}
              </span>
            </label>
          </div>
        </div>

        <div className="mpm-media-upload-actions">
          <button
            type="button"
            className="mpm-bulk-btn"
            onClick={handleProjectFileUpload}
            disabled={!pendingProjectFile || isUploadingProjectFile}
          >
            {isUploadingProjectFile ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </div>

      <div className="mpm-surface" style={{ marginBottom: 18 }}>
        <div className="mpm-tab-kicker">View Controls</div>
        <h4 className="mpm-tab-title">Filter and sort</h4>

        <div className="mpm-media-upload-grid">
          <div className="mpm-media-upload-field">
            <label className="mpm-intake-field-label">Section</label>
            <select
              className="mpm-phase-selector-dropdown"
              value={mediaFilterSection}
              onChange={(e) => setMediaFilterSection(e.target.value)}
            >
              <option value="all">All Sections</option>
              {MEDIA_FILE_SECTIONS.map((section) => (
                <option key={section.key} value={section.key}>
                  {section.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mpm-media-upload-field">
            <label className="mpm-intake-field-label">Visibility</label>
            <select
              className="mpm-phase-selector-dropdown"
              value={mediaFilterVisibility}
              onChange={(e) => setMediaFilterVisibility(e.target.value)}
            >
              <option value="all">All</option>
              <option value="hidden">Hidden</option>
              <option value="visible">Visible</option>
            </select>
          </div>

          <div className="mpm-media-upload-field">
            <label className="mpm-intake-field-label">Type</label>
            <select
              className="mpm-phase-selector-dropdown"
              value={mediaFilterKind}
              onChange={(e) => setMediaFilterKind(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="pdf">PDFs</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="document">Documents</option>
            </select>
          </div>

          <div className="mpm-media-upload-field">
            <label className="mpm-intake-field-label">Sort</label>
            <select
              className="mpm-phase-selector-dropdown"
              value={mediaSortMode}
              onChange={(e) => setMediaSortMode(e.target.value)}
            >
              <option value="custom">Custom Order</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="nameAsc">Name A–Z</option>
              <option value="nameDesc">Name Z–A</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mpm-media-section-stack">
        {FILE_SECTION_KEYS.map((sectionKey) => {
          const sectionFiles = filesBySection[sectionKey] || [];

          return (
            <div key={sectionKey} className="mpm-surface mpm-media-section-card">
              <div className="mpm-media-section-header">
                <div>
                  <div className="mpm-tab-kicker">File Section</div>
                  <h4 className="mpm-tab-title">
                    {FILE_SECTION_LABELS[sectionKey]}
                  </h4>
                </div>
                <span className="mpm-media-count-badge">
                  {sectionFiles.length}
                </span>
              </div>

              {sectionFiles.length === 0 ? (
                <div className="mpm-media-empty-state">
                  No files in this section yet.
                </div>
              ) : (
                <div className="mpm-media-file-list">
                  {sectionFiles.map((file, idx) => {
                    const normalizedFile = normalizeProjectFileRecord(file);
                    const url = getProjectFileUrl(normalizedFile);
                    const isImage = normalizedFile?.kind === 'image';
                    const canMoveUp = mediaSortMode === 'custom' && idx > 0;
                    const canMoveDown =
                      mediaSortMode === 'custom' &&
                      idx < sectionFiles.length - 1;

                    return (
                      <div
                        key={
                          normalizedFile?.id ||
                          normalizedFile?.name ||
                          `${sectionKey}-${idx}`
                        }
                        className="mpm-media-file-row"
                      >
                        <div className="mpm-media-file-thumb">
                          {isImage && url ? (
                            <img
                              src={normalizedFile.thumbnailUrl || url}
                              alt={
                                normalizedFile.displayName ||
                                normalizedFile.name
                              }
                            />
                          ) : (
                            <span className="mpm-media-file-thumb-fallback">
                              {String(
                                normalizedFile.kind || 'file'
                              ).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="mpm-media-file-main">
                          <div className="mpm-media-file-title-wrap">
                            <input
                              type="text"
                              value={
                                normalizedFile.displayName ||
                                normalizedFile.name ||
                                ''
                              }
                              onChange={(e) =>
                                handleUpdateProjectFile(normalizedFile.id, {
                                  displayName: e.target.value,
                                })
                              }
                              className="mpm-media-file-display-input"
                            />
                          </div>

                          <div className="mpm-media-file-meta">
                            <div className="mpm-media-file-original">
                              Original:{' '}
                              {normalizedFile.originalFileName ||
                                normalizedFile.name ||
                                '—'}
                            </div>

                            <div className="mpm-media-file-status-row">
                              <span
                                className={`mpm-media-pill ${
                                  normalizedFile.hiddenFromCustomer ||
                                  normalizedFile.hidden
                                    ? 'mpm-media-pill-hidden'
                                    : 'mpm-media-pill-visible'
                                }`}
                              >
                                {normalizedFile.hiddenFromCustomer ||
                                normalizedFile.hidden
                                  ? 'Hidden'
                                  : 'Visible'}
                              </span>

                              <span className="mpm-media-pill mpm-media-pill-kind">
                                {String(
                                  normalizedFile.kind || 'document'
                                ).toUpperCase()}
                              </span>
                            </div>
                          </div>

                          <div className="mpm-media-file-edit-row">
                            <select
                              className="mpm-phase-selector-dropdown"
                              value={
                                normalizedFile.section ||
                                normalizedFile.category ||
                                normalizedFile.subCategory ||
                                'other'
                              }
                              onChange={(e) =>
                                handleUpdateProjectFile(normalizedFile.id, {
                                  section: e.target.value,
                                })
                              }
                            >
                              {MEDIA_FILE_SECTIONS.map((section) => (
                                <option key={section.key} value={section.key}>
                                  {section.label}
                                </option>
                              ))}
                            </select>

                            <label className="mpm-media-file-inline-toggle">
                              <input
                                type="checkbox"
                                checked={
                                  !!(
                                    normalizedFile.hiddenFromCustomer ||
                                    normalizedFile.hidden
                                  )
                                }
                                onChange={(e) =>
                                  handleUpdateProjectFile(normalizedFile.id, {
                                    hiddenFromCustomer: e.target.checked,
                                  })
                                }
                              />
                              <span>
                                {normalizedFile.hiddenFromCustomer ||
                                normalizedFile.hidden
                                  ? 'Hidden from customer portal'
                                  : 'Visible in customer portal'}
                              </span>
                            </label>
                          </div>
                        </div>

                        <div className="mpm-media-file-actions">
                          <div className="mpm-media-file-actions-grid">
                            <button
                              type="button"
                              className="mpm-bulk-btn mpm-media-btn-primary"
                              onClick={() => {
                                if (!url) return;
                                setPreviewFile(normalizedFile);
                              }}
                              disabled={!url}
                            >
                              Preview
                            </button>

                            <button
                              type="button"
                              className="mpm-bulk-btn mpm-media-btn-secondary"
                              onClick={() => {
                                if (!url) return;
                                window.open(url, '_blank', 'noopener,noreferrer');
                              }}
                              disabled={!url}
                            >
                              Download
                            </button>

                            <button
                              type="button"
                              className="mpm-bulk-btn mpm-media-btn-secondary"
                              onClick={() =>
                                handleMoveProjectFile(normalizedFile.id, 'up')
                              }
                              disabled={!canMoveUp}
                            >
                              Move Up
                            </button>

                            <button
                              type="button"
                              className="mpm-bulk-btn mpm-media-btn-secondary"
                              onClick={() =>
                                handleMoveProjectFile(normalizedFile.id, 'down')
                              }
                              disabled={!canMoveDown}
                            >
                              Move Down
                            </button>
                          </div>

                          <button
                            type="button"
                            className="mpm-bulk-btn mpm-media-btn-danger"
                            onClick={() =>
                              handleDeleteProjectFile(normalizedFile.id)
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default MediaFilesSection;