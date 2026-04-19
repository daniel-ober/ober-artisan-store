import React from 'react';

const PreConsultPrepSection = ({ consultPrepBoards = [] }) => {
  return (
    <div className="idv-shell">
      <section className="idv-section">
        <div className="idv-section-body">
          <div className="idv-card idv-card-full">
            <div className="idv-card-head">
              <span className="idv-card-kicker">Consultation Prep</span>
              <h5>What to carry into the call</h5>
            </div>

            <div className="idv-grid-2">
              <div className="idv-card">
                <div className="idv-card-head">
                  <span className="idv-card-kicker">Purpose</span>
                  <h5>What this page is for</h5>
                </div>
                <p>
                  Use this page to walk into the consultation with a clean read
                  of what already feels directionally useful, what still needs
                  pressure-testing, and what should stay open.
                </p>
              </div>

              <div className="idv-card">
                <div className="idv-card-head">
                  <span className="idv-card-kicker">Reminder</span>
                  <h5>Prepare here, do not decide here</h5>
                </div>
                <p>
                  Nothing on this page should pretend the consultation has
                  already happened. This is a prep tool, not a truth-locking
                  tool.
                </p>
              </div>
            </div>
          </div>

          <div className="idv-truth-checklist-grid">
            {consultPrepBoards.map((truth) => (
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

                <div className="idv-list-stack">
                  <div className="idv-info-row">
                    <div className="idv-info-row-top">
                      <strong>What already feels true</strong>
                    </div>
                    {truth.knownItems?.length ? (
                      <ul className="idv-list">
                        {truth.knownItems.map((item, index) => (
                          <li key={`${truth.key}-known-${index}`}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="idv-empty">
                        Nothing trustworthy yet from intake alone.
                      </div>
                    )}
                  </div>

                  <div className="idv-info-row">
                    <div className="idv-info-row-top">
                      <strong>Questions to ask on the call</strong>
                    </div>
                    {truth.questionItems?.length ? (
                      <ul className="idv-list">
                        {truth.questionItems.map((item, index) => (
                          <li key={`${truth.key}-question-${index}`}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="idv-empty">
                        No specific questions generated yet.
                      </div>
                    )}
                  </div>

                  <div className="idv-info-row">
                    <div className="idv-info-row-top">
                      <strong>What not to assume yet</strong>
                    </div>
                    {truth.whatNotToAssume?.length ? (
                      <ul className="idv-list">
                        {truth.whatNotToAssume.map((item, index) => (
                          <li key={`${truth.key}-avoid-${index}`}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="idv-empty">
                        No major assumption warnings here.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default PreConsultPrepSection;