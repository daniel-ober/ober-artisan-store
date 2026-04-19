import React from 'react';

const IntakeInterpretationSection = ({
  intakeOpen,
  setIntakeOpen,
  intakeLocked,
  questionnaireStatus,
  intakeInterpretationRows,
  handleMarkIntakeComplete,
  questionnaireReceived,
}) => {
  return (
    <section className="idv-section">
      <button
        type="button"
        className="idv-section-toggle"
        onClick={() => setIntakeOpen((prev) => !prev)}
      >
        <div className="idv-section-toggle-copy">
          <span className="idv-section-kicker">A</span>
          <h4>Intake Notes / Interpretation</h4>
          <p>
            A clean read of what the questionnaire is already giving us and
            where it still leaves the craftsman guessing.
          </p>
        </div>
        <div className="idv-section-toggle-right">
          <span
            className={`idv-status-pill ${
              intakeLocked ? 'is-good' : 'is-soft'
            }`}
          >
            {intakeLocked ? 'Reviewed' : questionnaireStatus}
          </span>
          <span className="idv-toggle-icon">{intakeOpen ? '−' : '+'}</span>
        </div>
      </button>

      {intakeOpen && (
        <div className="idv-section-body">
          <div className="idv-card idv-card-full">
            <div className="idv-card-head">
              <span className="idv-card-kicker">Questionnaire Read</span>
              <h5>What the intake is telling us vs. not telling us</h5>
            </div>

            <div className="idv-intake-board">
              <div className="idv-intake-board-head idv-intake-board-head--spacer" />
              <div className="idv-intake-board-head idv-intake-board-head--known">
                What the intake is telling us
              </div>
              <div className="idv-intake-board-head idv-intake-board-head--unknown">
                What the intake is not telling us
              </div>

              {intakeInterpretationRows.map((row) => (
                <React.Fragment key={row.key}>
                  <div className="idv-intake-board-rowhead">
                    <span className="idv-intake-board-rowicon">
                      {row.badge}
                    </span>
                    <div className="idv-intake-board-rowtitle">
                      {row.title}
                    </div>
                  </div>

                  <div className="idv-intake-board-cell idv-intake-board-cell--known">
                    <ul className="idv-list">
                      {row.tellingItems.map((item, index) => (
                        <li key={`${row.key}-known-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="idv-intake-board-cell idv-intake-board-cell--unknown">
                    <ul className="idv-list">
                      {row.notTellingItems.map((item, index) => (
                        <li key={`${row.key}-unknown-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </React.Fragment>
              ))}
            </div>

            <div className="idv-action-row idv-action-row--end">
              <button
                type="button"
                className="idv-btn idv-btn-primary"
                onClick={handleMarkIntakeComplete}
                disabled={intakeLocked || !questionnaireReceived}
              >
                {intakeLocked ? 'Intake Reviewed' : 'Mark Intake Reviewed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default IntakeInterpretationSection;