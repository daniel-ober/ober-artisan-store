import React from 'react';

const DiscoveryOverviewSection = ({
  discoveryProgressPercent,
  discoveryConfidenceLabel,
  consultLocked,
  questionnaireReceived,
  intakeLocked,
  summaryGenerated,
  builderPrepIntro,
  builderPrepBuildScope,
  summaryText,
  updateSummaryMeta,
  discoveryBlockers,
}) => {
  return (
    <section className="idv-section">
      <div className="idv-section-body">
        <div className="idv-card idv-card-full">
          <div className="idv-card-head">
            <span className="idv-card-kicker">Discovery Overview</span>
            <h5>Recap notes before build direction</h5>
          </div>

          <div className="idv-grid-2">
            <div className="idv-card">
              <div className="idv-card-head">
                <span className="idv-card-kicker">Progress</span>
                <h5>How far discovery has moved</h5>
              </div>

              <div className="idv-meta-row">
                <div className="idv-meta-chip">
                  <span className="idv-meta-label">Discovery Complete</span>
                  <strong>{discoveryProgressPercent}%</strong>
                </div>

                <div className="idv-meta-chip">
                  <span className="idv-meta-label">Confidence</span>
                  <strong>{discoveryConfidenceLabel}</strong>
                </div>

                <div className="idv-meta-chip">
                  <span className="idv-meta-label">Build Phase</span>
                  <strong>
                    {consultLocked ? 'Can begin opening up' : 'Keep locked'}
                  </strong>
                </div>
              </div>

              <div className="idv-list-stack" style={{ marginTop: 16 }}>
                <div className="idv-info-row">
                  <div className="idv-info-row-top">
                    <strong>Questionnaire</strong>
                    <span
                      className={`idv-status-pill ${
                        questionnaireReceived ? 'is-good' : 'is-soft'
                      }`}
                    >
                      {questionnaireReceived ? 'Received' : 'Waiting'}
                    </span>
                  </div>
                </div>

                <div className="idv-info-row">
                  <div className="idv-info-row-top">
                    <strong>Intake Review</strong>
                    <span
                      className={`idv-status-pill ${
                        intakeLocked ? 'is-good' : 'is-soft'
                      }`}
                    >
                      {intakeLocked ? 'Reviewed' : 'Active'}
                    </span>
                  </div>
                </div>

                <div className="idv-info-row">
                  <div className="idv-info-row-top">
                    <strong>Consultation</strong>
                    <span
                      className={`idv-status-pill ${
                        consultLocked ? 'is-good' : 'is-soft'
                      }`}
                    >
                      {consultLocked ? 'Completed' : 'Active'}
                    </span>
                  </div>
                </div>

                <div className="idv-info-row">
                  <div className="idv-info-row-top">
                    <strong>Discovery Notes</strong>
                    <span
                      className={`idv-status-pill ${
                        summaryGenerated ? 'is-good' : 'is-soft'
                      }`}
                    >
                      {summaryGenerated ? 'Generated' : 'Building'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="idv-card">
              <div className="idv-card-head">
                <span className="idv-card-kicker">Builder Recap</span>
                <h5>What we know so far and what is still missing for scope</h5>
              </div>

              <div className="idv-list-stack">
                <div className="idv-info-row">
                  <div className="idv-info-row-top">
                    <strong>What feels usable now</strong>
                  </div>
                  <p>{builderPrepIntro}</p>
                </div>

                <div className="idv-info-row">
                  <div className="idv-info-row-top">
                    <strong>Missing build details</strong>
                  </div>
                  <p>{builderPrepBuildScope}</p>
                </div>

                <div className="idv-info-row">
                  <div className="idv-info-row-top">
                    <strong>Editable builder handoff</strong>
                  </div>
                  <textarea
                    className="idv-textarea idv-summary-textarea"
                    rows={6}
                    value={summaryText}
                    onChange={(e) =>
                      updateSummaryMeta({
                        editableText: e.target.value,
                      })
                    }
                    placeholder="Write a simple, bench-ready summary of where discovery stands right now."
                  />
                </div>
              </div>
            </div>
          </div>

          {discoveryBlockers.length ? (
            <div className="idv-card" style={{ marginTop: 18 }}>
              <div className="idv-card-head">
                <span className="idv-card-kicker">Current Risks</span>
                <h5>What would still weaken build direction</h5>
              </div>

              <ul className="idv-list">
                {discoveryBlockers.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default DiscoveryOverviewSection;