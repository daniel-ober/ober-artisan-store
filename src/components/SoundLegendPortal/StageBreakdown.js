// src/components/SoundLegendPortal/StageBreakdown.js

import React from 'react';

/**
 * StageBreakdown
 *
 * Props:
 * - stageIndex: number
 * - stage: stage definition from PROJECT_STAGE_DEFINITION
 * - lifecycle: project.lifecycle object
 * - stats: { status, totalSteps, completedSteps, totalCp, completedCp }
 * - isLocked: boolean (future stage not yet unlocked)
 */

const StageBreakdown = ({ stageIndex, stage, lifecycle, stats, isLocked }) => {
  const statusLabel =
    stats.status === 'completed'
      ? 'COMPLETED'
      : stats.status === 'in_progress'
      ? 'IN PROGRESS'
      : 'NOT STARTED';

  const statusClass =
    stats.status === 'completed'
      ? 'is-completed'
      : stats.status === 'in_progress'
      ? 'is-inprogress'
      : 'is-notstarted';

  // Helper to compute per-step checkpoint summary
  const getStepSummary = (step) => {
    const stageState = lifecycle?.stages?.[stage.id];
    const stepState = stageState?.steps?.[step.id];

    const totalCp = step.checkpoints.length;
    let doneCp = 0;

    step.checkpoints.forEach((cp) => {
      const cpState = stepState?.checkpoints?.[cp.id];
      if (cpState?.completed) doneCp += 1;
    });

    const completed =
      (!!stepState?.completed || (totalCp > 0 && doneCp === totalCp)) &&
      totalCp > 0;

    return { totalCp, doneCp, completed };
  };

  return (
    <section
      className={[
        'sl-progress-stage',
        'sl-progress-stage--breakdown',
        isLocked ? 'is-locked' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <header className="sl-progress-stage-header">
        <div className="sl-progress-stage-header-main">
          <h2 className="sl-progress-stage-title">
            Stage {stageIndex + 1}. {stage.label}
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
        <div className="sl-progress-stage-header-meta">
          <span>
            Steps: {stats.completedSteps}/{stats.totalSteps}
          </span>
          <span>
            Checkpoints: {stats.completedCp}/{stats.totalCp}
          </span>
        </div>
      </header>

      <div className="sl-progress-stage-body sl-progress-stage-body--singlecol">
        {stage.steps.map((step) => {
          const { totalCp, doneCp, completed } = getStepSummary(step);
          return (
            <div
              key={step.id}
              className={[
                'sl-progress-step-block',
                completed ? 'is-complete' : 'is-pending',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <div className="sl-progress-step-block-header">
                <div className="sl-progress-step-block-title">
                  {step.label}
                </div>
                <div className="sl-progress-step-block-meta">
                  <span>
                    {doneCp}/{totalCp} checkpoints
                  </span>
                  {completed && (
                    <span className="sl-progress-step-block-badge">
                      Complete
                    </span>
                  )}
                </div>
              </div>

              <ul className="sl-progress-step-block-checkpoints">
                {step.checkpoints.map((cp) => {
                  const stageState = lifecycle?.stages?.[stage.id];
                  const stepState = stageState?.steps?.[step.id];
                  const cpState = stepState?.checkpoints?.[cp.id];
                  const cpCompleted = !!cpState?.completed;

                  return (
                    <li
                      key={cp.id}
                      className={[
                        'sl-progress-checkpoint-item',
                        cpCompleted ? 'is-completed' : 'is-notstarted',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <div className="sl-progress-checkpoint-main">
                        <span className="sl-progress-checkpoint-icon">
                          {cpCompleted ? '✓' : '•'}
                        </span>
                        <span className="sl-progress-checkpoint-label">
                          {cp.label}
                        </span>
                      </div>
                      <div className="sl-progress-checkpoint-status">
                        {cpCompleted ? 'Completed' : 'Pending'}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <footer className="sl-progress-stage-footer">
        <p className="sl-progress-stage-files">
          Photos, audio, and files for each stage will appear here as they’re
          attached to your project.
        </p>
      </footer>
    </section>
  );
};

export default StageBreakdown;