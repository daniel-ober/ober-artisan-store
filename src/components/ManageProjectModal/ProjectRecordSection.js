import React from 'react';
// import ProjectOverview from '../ProjectOverview';
import './ProjectRecordSection.css';

const LifecyclePanel = ({ lifecycle, onToggleCheckpoint }) => {
  if (!lifecycle?.stages) return null;

  const stages = Object.entries(lifecycle.stages || {});

  if (!stages.length) return null;

  return (
    <section className="mprs-lifecycle-card">
      <div className="mprs-section-head">
        <div>
          <div className="mprs-kicker">Lifecycle</div>
          <h3 className="mprs-title">Project checkpoints</h3>
          <p className="mprs-subtitle">
            Supporting admin-only lifecycle checkpoints and completion tracking.
          </p>
        </div>
      </div>

      <div className="mprs-lifecycle-stack">
        {stages.map(([stageId, stage]) => {
          const steps = Object.entries(stage?.steps || {});
          return (
            <div key={stageId} className="mprs-stage-card">
              <div className="mprs-stage-head">
                <h4>{stage?.label || stageId}</h4>
                <span
                  className={`mprs-stage-badge ${
                    stage?.completed ? 'is-complete' : ''
                  }`}
                >
                  {stage?.completed ? 'Complete' : 'In Progress'}
                </span>
              </div>

              <div className="mprs-stage-steps">
                {steps.map(([stepId, step]) => {
                  const checkpoints = Object.entries(step?.checkpoints || {});
                  return (
                    <div key={stepId} className="mprs-step-card">
                      <div className="mprs-step-head">
                        <strong>{step?.label || stepId}</strong>
                        <span
                          className={`mprs-step-badge ${
                            step?.completed ? 'is-complete' : ''
                          }`}
                        >
                          {step?.completed ? 'Done' : 'Open'}
                        </span>
                      </div>

                      {!!checkpoints.length && (
                        <div className="mprs-checkpoint-list">
                          {checkpoints.map(([checkpointId, checkpoint]) => (
                            <label
                              key={checkpointId}
                              className="mprs-checkpoint-row"
                            >
                              <input
                                type="checkbox"
                                checked={!!checkpoint?.completed}
                                onChange={(e) =>
                                  onToggleCheckpoint?.(
                                    stageId,
                                    stepId,
                                    checkpointId,
                                    e.target.checked
                                  )
                                }
                              />
                              <span>
                                {checkpoint?.label || checkpointId}
                                {checkpoint?.timestamp ? (
                                  <em>
                                    {' '}
                                    · {new Date(
                                      checkpoint.timestamp
                                    ).toLocaleString()}
                                  </em>
                                ) : null}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const ProjectRecordSection = ({
  editableData,
  projectData,
  isEditing,
  setIsEditing,
  setEditableData,
  originalData,
  saveToFirestore,
  setShowSnackbar,
  handleLifecycleCheckpointToggle,
}) => {
  const val = (...candidates) =>
    candidates.find((v) => v !== undefined && v !== null && v !== '') ?? '';

  const customerName = val(
    editableData?.customerName,
    editableData?.customer?.name,
    projectData?.customerName,
    projectData?.customer?.name
  );

  const customerEmail = val(
    editableData?.customerEmail,
    editableData?.customer?.email,
    projectData?.customerEmail,
    projectData?.customer?.email
  );

  const artisanLine = val(
    editableData?.artisanLine,
    projectData?.artisanLine,
    editableData?.series,
    projectData?.series
  );

  const serial = val(
    editableData?.lineSerial,
    editableData?.serial,
    editableData?.serialNumber,
    projectData?.lineSerial,
    projectData?.serial,
    projectData?.serialNumber
  );

  const diameter = val(
    editableData?.width,
    editableData?.diameter,
    projectData?.width,
    projectData?.diameter
  );

  const depth = val(
    editableData?.shellDepth,
    editableData?.depth,
    projectData?.shellDepth,
    projectData?.depth
  );

  const shellConstruction = val(
    editableData?.shellConstruction,
    projectData?.shellConstruction
  );

  const primaryWoodSpecies = val(
    editableData?.primaryWoodSpecies,
    projectData?.primaryWoodSpecies
  );

  const hardwareFinish = val(
    editableData?.hardwareFinish,
    projectData?.hardwareFinish
  );

  const bearingEdgeSpec = val(
    editableData?.bearingEdgeSpec,
    projectData?.bearingEdgeSpec
  );

  const additionalNotes = val(
    editableData?.additionalNotes,
    projectData?.additionalNotes
  );

  const handleNestedChange = (path, value) => {
    setEditableData((prev) => {
      const updated = { ...prev };
      const keys = path.split('.');
      let cur = updated;

      for (let i = 0; i < keys.length - 1; i += 1) {
        if (!cur[keys[i]] || typeof cur[keys[i]] !== 'object') {
          cur[keys[i]] = {};
        }
        cur = cur[keys[i]];
      }

      cur[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const handleSaveRecord = () => {
    saveToFirestore(editableData);
    setIsEditing(false);
    setShowSnackbar(true);
  };

  const handleCancelRecord = () => {
    setEditableData(originalData);
    setIsEditing(false);
  };

  return (
    <div className="mprs-shell">
      <section className="mprs-record-card">
        <div className="mprs-section-head">
          <div>
            <div className="mprs-kicker">Project Record</div>
            <h3 className="mprs-title">Core build details</h3>
            <p className="mprs-subtitle">
              Primary project identity, customer info, and core build specs.
            </p>
          </div>

          <div className="mprs-actions">
            {isEditing ? (
              <>
                <button
                  type="button"
                  className="mprs-btn mprs-btn-secondary"
                  onClick={handleCancelRecord}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="mprs-btn mprs-btn-primary"
                  onClick={handleSaveRecord}
                >
                  Save
                </button>
              </>
            ) : (
              <button
                type="button"
                className="mprs-btn mprs-btn-primary"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
            )}
          </div>
        </div>

        <div className="mprs-grid">
          <div className="mprs-field">
            <span className="mprs-label">Customer Name</span>
            {isEditing ? (
              <input
                className="mprs-input"
                type="text"
                value={customerName}
                onChange={(e) =>
                  handleNestedChange('customer.name', e.target.value)
                }
              />
            ) : (
              <span className="mprs-value">{customerName || '—'}</span>
            )}
          </div>

          <div className="mprs-field">
            <span className="mprs-label">Customer Email</span>
            {isEditing ? (
              <input
                className="mprs-input"
                type="email"
                value={customerEmail}
                onChange={(e) =>
                  handleNestedChange('customer.email', e.target.value)
                }
              />
            ) : (
              <span className="mprs-value">{customerEmail || '—'}</span>
            )}
          </div>

          <div className="mprs-field">
            <span className="mprs-label">Artisan Line</span>
            {isEditing ? (
              <input
                className="mprs-input"
                type="text"
                value={artisanLine}
                onChange={(e) => handleNestedChange('artisanLine', e.target.value)}
              />
            ) : (
              <span className="mprs-value">{artisanLine || '—'}</span>
            )}
          </div>

          <div className="mprs-field">
            <span className="mprs-label">Serial</span>
            {isEditing ? (
              <input
                className="mprs-input"
                type="text"
                value={serial}
                onChange={(e) => handleNestedChange('serial', e.target.value)}
              />
            ) : (
              <span className="mprs-value">{serial || '—'}</span>
            )}
          </div>

          <div className="mprs-field">
            <span className="mprs-label">Diameter</span>
            {isEditing ? (
              <input
                className="mprs-input"
                type="text"
                value={diameter}
                onChange={(e) => handleNestedChange('width', e.target.value)}
              />
            ) : (
              <span className="mprs-value">{diameter || '—'}</span>
            )}
          </div>

          <div className="mprs-field">
            <span className="mprs-label">Depth</span>
            {isEditing ? (
              <input
                className="mprs-input"
                type="text"
                value={depth}
                onChange={(e) => handleNestedChange('shellDepth', e.target.value)}
              />
            ) : (
              <span className="mprs-value">{depth || '—'}</span>
            )}
          </div>

          <div className="mprs-field">
            <span className="mprs-label">Shell Construction</span>
            {isEditing ? (
              <input
                className="mprs-input"
                type="text"
                value={shellConstruction}
                onChange={(e) =>
                  handleNestedChange('shellConstruction', e.target.value)
                }
              />
            ) : (
              <span className="mprs-value">{shellConstruction || '—'}</span>
            )}
          </div>

          <div className="mprs-field">
            <span className="mprs-label">Primary Wood</span>
            {isEditing ? (
              <input
                className="mprs-input"
                type="text"
                value={primaryWoodSpecies}
                onChange={(e) =>
                  handleNestedChange('primaryWoodSpecies', e.target.value)
                }
              />
            ) : (
              <span className="mprs-value">{primaryWoodSpecies || '—'}</span>
            )}
          </div>

          <div className="mprs-field">
            <span className="mprs-label">Hardware Finish</span>
            {isEditing ? (
              <input
                className="mprs-input"
                type="text"
                value={hardwareFinish}
                onChange={(e) =>
                  handleNestedChange('hardwareFinish', e.target.value)
                }
              />
            ) : (
              <span className="mprs-value">{hardwareFinish || '—'}</span>
            )}
          </div>

          <div className="mprs-field">
            <span className="mprs-label">Bearing Edge</span>
            {isEditing ? (
              <input
                className="mprs-input"
                type="text"
                value={bearingEdgeSpec}
                onChange={(e) =>
                  handleNestedChange('bearingEdgeSpec', e.target.value)
                }
              />
            ) : (
              <span className="mprs-value">{bearingEdgeSpec || '—'}</span>
            )}
          </div>

          <div className="mprs-field mprs-field-full">
            <span className="mprs-label">Additional Notes</span>
            {isEditing ? (
              <textarea
                className="mprs-input mprs-textarea"
                rows={4}
                value={additionalNotes}
                onChange={(e) =>
                  handleNestedChange('additionalNotes', e.target.value)
                }
              />
            ) : (
              <span className="mprs-value">{additionalNotes || '—'}</span>
            )}
          </div>
        </div>
      </section>

      <LifecyclePanel
        lifecycle={editableData?.lifecycle}
        onToggleCheckpoint={handleLifecycleCheckpointToggle}
      />
    </div>
  );
};

export default ProjectRecordSection;