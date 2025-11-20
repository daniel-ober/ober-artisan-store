// src/components/SoundLegendPortal/StageOverview.js

import React, { useMemo } from 'react';

/**
 * StageOverview
 *
 * Props:
 * - stageIndex: number (0-based)
 * - stage: stage definition from PROJECT_STAGE_DEFINITION
 * - meta: narrative metadata (from NARRATIVE_STEPS in ProjectProgress)
 * - status: 'not_started' | 'in_progress' | 'completed'
 * - stageTarget: string | null  (e.g., '08/08/2025') or null => show "TBD"
 * - lifecycle: project.lifecycle object
 */

const StageOverview = ({
  stageIndex,
  stage,
  meta,
  status,
  stageTarget,
  lifecycle,
}) => {
  const statusLabel = useMemo(() => {
    switch (status) {
      case 'completed':
        return 'COMPLETED';
      case 'in_progress':
        return 'IN PROGRESS';
      default:
        return 'NOT STARTED';
    }
  }, [status]);

  const statusClass = useMemo(() => {
    switch (status) {
      case 'completed':
        return 'is-completed';
      case 'in_progress':
        return 'is-inprogress';
      default:
        return 'is-notstarted';
    }
  }, [status]);

  // helper: compute status + checkpoint counts for each sub-step in this stage
  const getStepSummary = (step) => {
    const stageState = lifecycle?.stages?.[stage.id];
    const stepState = stageState?.steps?.[step.id];

    const totalCp = step.checkpoints.length;
    let doneCp = 0;

    step.checkpoints.forEach((cp) => {
      const cpState = stepState?.checkpoints?.[cp.id];
      if (cpState?.completed) doneCp += 1;
    });

    const completedFlag = !!stepState?.completed;
    const completedByCheckpoints =
      totalCp > 0 && doneCp === totalCp && totalCp > 0;

    let label = 'NOT STARTED';
    let className = 'is-notstarted';

    if (completedFlag || completedByCheckpoints) {
      label = 'COMPLETED';
      className = 'is-completed';
    } else if (doneCp > 0) {
      label = 'IN PROGRESS';
      className = 'is-inprogress';
    }

    return {
      label,
      className,
      doneCp,
      totalCp,
    };
  };

  return (
    <section className="sl-progress-stage">
      <header className="sl-progress-stage-header">
        <div className="sl-progress-stage-header-main">
          <h2 className="sl-progress-stage-title">
            {stageIndex + 1}. {meta.label}
          </h2>
          <div
            className={[
              'sl-progress-stage-status-pill',
              statusClass,
            ].join(' ')}
          >
            {statusLabel}
          </div>
        </div>
      </header>

      {/* Stage stats row */}
      <div className="sl-progress-stage-stats">
        <div className="sl-progress-stage-stat">
          <div className="sl-progress-stage-stat-label">
            Est. Time (focused hours)
          </div>
          <div className="sl-progress-stage-stat-value">
            {meta.estHours}
          </div>
        </div>

        <div className="sl-progress-stage-stat">
          <div className="sl-progress-stage-stat-label">
            Avg. Turnaround (calendar days)
          </div>
          <div className="sl-progress-stage-stat-value">
            {meta.avgDays}
          </div>
        </div>

        <div className="sl-progress-stage-stat">
          <div className="sl-progress-stage-stat-label">
            Stage Completion Target
          </div>
          <div className="sl-progress-stage-stat-value">
            {stageTarget || 'TBD'}
          </div>
        </div>
      </div>

      {/* Two-column content */}
      <div className="sl-progress-stage-body">
        {/* LEFT: narrative + “stage checkpoints” summary */}
        <div className="sl-progress-stage-col">
          <div className="sl-progress-card">
            <h3 className="sl-progress-card-title">What we do</h3>
            <p className="sl-progress-card-text">{meta.what}</p>
          </div>

          <div className="sl-progress-card">
            <h3 className="sl-progress-card-title">Why it matters</h3>
            <p className="sl-progress-card-text">{meta.why}</p>
          </div>

          {/* Stage checkpoints: each STEP with live checkpoint counts + status */}
          <div className="sl-progress-card">
            <h3 className="sl-progress-card-title">Stage checkpoints</h3>
            <ul className="sl-progress-checkpoint-list">
              {stage.steps.map((step) => {
                const summary = getStepSummary(step);

                return (
                  <li
                    key={step.id}
                    className={[
                      'sl-progress-checkpoint-item',
                      summary.className,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <div className="sl-progress-checkpoint-main">
                      <span className="sl-progress-checkpoint-label">
                        {step.label}
                      </span>
                      <span className="sl-progress-checkpoint-count">
                        {summary.doneCp}/{summary.totalCp} checkpoints
                      </span>
                    </div>
                    <div className="sl-progress-checkpoint-status">
                      {summary.label}
                    </div>
                  </li>
                );
              })}
            </ul>

            <p className="sl-progress-card-footnote">
              Detailed step-by-step progress appears below in the build
              breakdown.
            </p>
          </div>
        </div>

        {/* RIGHT: techniques / tools + mantra */}
        <div className="sl-progress-stage-col">
          <div className="sl-progress-card">
            <h3 className="sl-progress-card-title">Techniques used</h3>
            <div className="sl-progress-pill-row">
              {meta.techniques.map((t) => (
                <span key={t} className="sl-progress-pill">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="sl-progress-card">
            <h3 className="sl-progress-card-title">Tools involved</h3>
            <div className="sl-progress-pill-row">
              {meta.tools.map((t) => (
                <span key={t} className="sl-progress-pill">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="sl-progress-card sl-progress-card--quote">
            <div className="sl-progress-quote-icon">★</div>
            <p className="sl-progress-quote-text">
              {meta.mantra ||
                'The difference between “pretty on paper” and “just locks in” lives inside the details of this step.'}
            </p>
          </div>
        </div>
      </div>

      <footer className="sl-progress-stage-footer">
        <p className="sl-progress-stage-files">
          Files for this step will appear here as we add photos, audio, and
          PDFs.
        </p>
      </footer>
    </section>
  );
};

export default StageOverview;