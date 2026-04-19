import React from 'react';

const REVIEW_STATE_OPTIONS = [
  { value: 'clarify', label: 'Open Question' },
  { value: 'verify', label: 'Needs Confirming' },
  { value: 'confirmed', label: 'Locked In' },
];

const getReviewStatePillClass = (reviewState) => {
  if (reviewState === 'confirmed') return 'is-good';
  if (reviewState === 'verify') return 'is-medium';
  return 'is-soft';
};

const ConsultationWorkspaceSection = ({
  consultLocked,
  truthBoards = [],
  updateTruthRow,
  handleGenerateConsultationSummary,
  storyEngineRunning,
  isNormalizingTranscript,
  storyEngineData,
  setStoryEngineData,
  handleMarkConsultComplete,
  consultState,
  safeDateLabel,
  cleanText,
  smartTranscriptTurns = [],
}) => {
  const consultFlowBullets = [
    'Start with what already feels true from the intake.',
    'Move one truth at a time: Purpose, Feel, Voice, then Legacy.',
    'Ask the clearest open questions first.',
    'Only confirm what actually sounds real in conversation.',
    'Leave weak decisions open instead of forcing them.',
  ];

  return (
    <div className="idv-shell">
      <div className="idv-header">
        <div>
          <div className="idv-kicker">Intake & Direction</div>
          <h3 className="idv-title">Consultation Workspace</h3>
          <p className="idv-subtitle">
            Capture the real conversation, review truth-by-truth movement, and
            save the consultation record cleanly.
          </p>
        </div>
      </div>

      <section className="idv-section">
        <div className="idv-section-body">
          <div className="idv-card idv-card-full">
            <div className="idv-card-head">
              <span className="idv-card-kicker">Call Guide</span>
              <h5>Use this during the conversation</h5>
            </div>

            <div className="idv-list-stack">
              <div className="idv-info-row">
                <div className="idv-info-row-top">
                  <strong>How to open the call</strong>
                </div>
                <p>
                  Thanks again for taking the time to do this. I do not want to
                  force decisions too quickly. I just want to understand what
                  already feels true, what still needs clarity, and how this
                  drum can become something honest and personal for you.
                </p>
              </div>

              <div className="idv-info-row">
                <div className="idv-info-row-top">
                  <strong>How to frame the conversation</strong>
                </div>
                <p>
                  I am listening for four things as we talk: Purpose, Feel,
                  Voice, and Legacy. Once those feel clear enough, the real
                  build direction starts to take shape naturally.
                </p>
              </div>

              <div className="idv-info-row">
                <div className="idv-info-row-top">
                  <strong>Simple call flow</strong>
                </div>
                <ul className="idv-list">
                  {consultFlowBullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="idv-card idv-card-full">
            <div className="idv-card-head">
              <span className="idv-card-kicker">Truth-by-Truth Review</span>
              <h5>Confirm the build through Purpose, Feel, Voice, and Legacy</h5>
            </div>

            <div className="idv-truth-checklist-grid">
              {truthBoards.map((truth) => (
                <div key={truth.key} className="idv-truth-checklist-card">
                  <div className="idv-truth-checklist-head">
                    <div className="idv-truth-top">
                      <span className="idv-truth-badge">{truth.badge}</span>
                      <div>
                        <strong>{truth.title}</strong>
                        <p>{truth.summary}</p>
                      </div>
                    </div>
                  </div>

                  <div className="idv-truth-checklist-items">
                    {truth.items.map((item) => (
                      <div key={item.fieldId} className="idv-truth-item-card">
                        <div className="idv-truth-item-top">
                          <strong>{item.label}</strong>
                          <span
                            className={`idv-status-pill ${getReviewStatePillClass(
                              item.reviewState
                            )}`}
                          >
                            {item.reviewState === 'confirmed'
                              ? 'Locked In'
                              : item.reviewState === 'verify'
                                ? 'Needs Confirming'
                                : 'Open Question'}
                          </span>
                        </div>

                        <div className="idv-truth-item-value">
                          {item.finalValue || '—'}
                        </div>

                        <div className="idv-field" style={{ marginTop: 10 }}>
                          <label className="idv-field-label">Move Item</label>
                          <select
                            value={item.reviewState}
                            onChange={(e) =>
                              updateTruthRow(truth.key, item.fieldId, {
                                reviewState: e.target.value,
                                checked: e.target.value === 'confirmed',
                              })
                            }
                            disabled={consultLocked}
                          >
                            {REVIEW_STATE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="idv-field" style={{ marginTop: 10 }}>
                          <label className="idv-field-label">Notes</label>
                          <textarea
                            className="idv-textarea"
                            rows={3}
                            value={item.notes}
                            onChange={(e) =>
                              updateTruthRow(truth.key, item.fieldId, {
                                notes: e.target.value,
                              })
                            }
                            disabled={consultLocked}
                            placeholder={`Any notes about how ${truth.title.toLowerCase()} is becoming clearer here...`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="idv-card idv-card-full">
            <div className="idv-card-head">
              <span className="idv-card-kicker">Consult Actions</span>
              <h5>Process and save the conversation</h5>
            </div>

            <div className="idv-action-stack">
              <button
                type="button"
                className="idv-btn idv-btn-secondary"
                onClick={handleGenerateConsultationSummary}
                disabled={
                  consultLocked ||
                  storyEngineRunning ||
                  isNormalizingTranscript ||
                  !cleanText(storyEngineData?.consultationTranscript)
                }
              >
                {isNormalizingTranscript
                  ? 'Processing…'
                  : 'Format + Summarize Call'}
              </button>

              <button
                type="button"
                className="idv-btn idv-btn-primary"
                onClick={handleMarkConsultComplete}
                disabled={consultLocked}
              >
                {consultLocked
                  ? 'Consultation Complete'
                  : 'Mark Consultation Complete'}
              </button>
            </div>

            <div className="idv-meta-row" style={{ marginTop: 14 }}>
              <div className="idv-meta-chip">
                <span className="idv-meta-label">Transcript</span>
                <strong>
                  {cleanText(storyEngineData?.consultationTranscript)
                    ? 'Added'
                    : 'Missing'}
                </strong>
              </div>

              <div className="idv-meta-chip">
                <span className="idv-meta-label">Craftsman Notes</span>
                <strong>
                  {cleanText(storyEngineData?.adminNotes) ? 'Added' : 'Missing'}
                </strong>
              </div>

              <div className="idv-meta-chip">
                <span className="idv-meta-label">Completed At</span>
                <strong>{safeDateLabel(consultState?.completedAt)}</strong>
              </div>
            </div>
          </div>

          <div className="idv-grid-2">
            <div className="idv-card">
              <div className="idv-card-head">
                <span className="idv-card-kicker">Call Capture</span>
                <h5>Consultation transcript</h5>
              </div>

              <textarea
                className="idv-textarea idv-textarea-tall"
                rows={14}
                value={storyEngineData?.consultationTranscript || ''}
                onChange={(e) => {
                  if (consultLocked) return;
                  setStoryEngineData((prev) => ({
                    ...prev,
                    consultationTranscript: e.target.value,
                  }));
                }}
                disabled={consultLocked}
                placeholder="Paste the consultation transcript here..."
              />
            </div>

            <div className="idv-card">
              <div className="idv-card-head">
                <span className="idv-card-kicker">Craftsman Notes</span>
                <h5>Internal observations after the call</h5>
              </div>

              <textarea
                className="idv-textarea idv-textarea-tall"
                rows={14}
                value={storyEngineData?.adminNotes || ''}
                onChange={(e) => {
                  if (consultLocked) return;
                  setStoryEngineData((prev) => ({
                    ...prev,
                    adminNotes: e.target.value,
                  }));
                }}
                disabled={consultLocked}
                placeholder="Builder observations, emotional cues, contradictions, meaningful details, and anything worth protecting..."
              />
            </div>
          </div>

          {!!smartTranscriptTurns.length && (
            <div className="idv-card">
              <div className="idv-card-head">
                <span className="idv-card-kicker">Conversation Preview</span>
                <h5>Formatted transcript</h5>
              </div>

              <div className="idv-thread">
                {smartTranscriptTurns.map((turn, idx) => (
                  <div
                    key={turn?.id || `turn-${idx}`}
                    className={`idv-thread-row ${
                      turn?.speaker === 'Ober Artisan'
                        ? 'is-builder'
                        : 'is-artist'
                    }`}
                  >
                    <div className="idv-thread-speaker">
                      {turn?.speaker || 'Artist'}
                    </div>
                    <div className="idv-thread-bubble">{turn?.text || ''}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ConsultationWorkspaceSection;