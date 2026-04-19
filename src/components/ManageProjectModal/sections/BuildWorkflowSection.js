import React from 'react';
import StepComponentTemplate from '../../StepComponentTemplate';
import '../BuildWorkflowSection.css';

const StatusPip = ({ level, status }) => {
  if (status === 'done') {
    if (level === 'step') {
      return (
        <span
          className={['mpm-pip', `mpm-pip-${level}`, 'mpm-pip-done-check'].join(
            ' '
          )}
          aria-hidden="true"
        >
          ✓
        </span>
      );
    }

    if (level === 'substep') {
      return (
        <span
          className={['mpm-pip', `mpm-pip-${level}`, 'mpm-pip-done-green'].join(
            ' '
          )}
          aria-hidden="true"
        >
          ✓
        </span>
      );
    }

    return (
      <span
        className={['mpm-pip', `mpm-pip-${level}`, 'mpm-pip-done-white'].join(
          ' '
        )}
        aria-hidden="true"
      >
        ✓
      </span>
    );
  }

  return (
    <span
      className={['mpm-pip', `mpm-pip-${level}`, `mpm-pip-${status}`].join(' ')}
      aria-hidden="true"
    />
  );
};

const BuildWorkflowSection = ({
  buildPhases,
  editableData,
  selectedStepKey,
  selectedSubIndex,
  setSelectedTab,
  ADMIN_SECTIONS,
  expandedStepKey,
  setExpandedStepKey,
  setSelectedStepKey,
  setSelectedSubIndex,
  activePtr,
  currentSubLabel,
  bulkUpdateStepCompletion,
  handleSubStepCompletionChange,
  handleCheckpointStatesChange,
}) => {
  return (
    <div className="mpbws-shell">
      <div className="mpm-bulk-step-actions">
        <span className="mpm-bulk-step-label">Bulk actions for this stage:</span>

        <button
          type="button"
          className="mpm-bulk-btn"
          disabled={!selectedStepKey}
          onClick={() => {
            if (!selectedStepKey) return;
            const count = editableData[selectedStepKey]?.checklist?.length || 0;

            if (
              window.confirm(
                `Mark all ${count} sub-steps in this stage as complete?`
              )
            ) {
              bulkUpdateStepCompletion(selectedStepKey, true);
            }
          }}
        >
          Mark stage complete
        </button>

        <button
          type="button"
          className="mpm-bulk-btn mpm-bulk-btn-reset"
          disabled={!selectedStepKey}
          onClick={() => {
            if (!selectedStepKey) return;
            const count = editableData[selectedStepKey]?.checklist?.length || 0;

            if (
              window.confirm(
                `Reset all ${count} sub-steps in this stage to incomplete? Time tracking will be preserved.`
              )
            ) {
              bulkUpdateStepCompletion(selectedStepKey, false);
            }
          }}
        >
          Reset stage
        </button>
      </div>

      <div className="mpbws-mobile-list">
        <div className="mpbws-mobile-stage-list">
          {(Array.isArray(buildPhases) ? buildPhases : []).map((step) => {
            const checklist = Array.isArray(editableData?.[step.key]?.checklist)
              ? editableData[step.key].checklist
              : [];

            const stepStatus = (() => {
              if (!checklist.length) return 'todo';

              const allDone = checklist.every((it) => {
                const states = Array.isArray(it?.checkpointStates)
                  ? it.checkpointStates
                  : [];
                const checkpointsDone =
                  states.length > 0 && states.every(Boolean);
                return !!it?.completed || checkpointsDone;
              });

              if (allDone) return 'done';

              const containsActive =
                !!activePtr && activePtr.stepKey === step.key;
              return containsActive ? 'doing' : 'todo';
            })();

            return (
              <div key={step.key} className="mpbws-stage-card">
                <button
                  className={`mpbws-stage-btn ${
                    selectedStepKey === step.key ? 'active' : ''
                  }`}
                  onClick={() => {
                    setSelectedTab(ADMIN_SECTIONS.BUILD_WORKFLOW);
                    setExpandedStepKey(step.key);
                    setSelectedStepKey(step.key);
                    setSelectedSubIndex(0);
                  }}
                  type="button"
                >
                  <StatusPip level="step" status={stepStatus} />
                  <span>{step.label}</span>
                </button>

                {expandedStepKey === step.key && checklist.length > 0 && (
                  <div className="mpbws-substep-list">
                    {checklist.map((item, idx) => {
                      const states = Array.isArray(item?.checkpointStates)
                        ? item.checkpointStates
                        : [];
                      const checkpointsDone =
                        states.length > 0 && states.every(Boolean);
                      const isDone = !!item?.completed || checkpointsDone;
                      const isGlobalActive =
                        !!activePtr &&
                        activePtr.stepKey === step.key &&
                        activePtr.idx === idx;

                      const subStatus = isDone
                        ? 'done'
                        : isGlobalActive
                          ? 'doing'
                          : 'todo';

                      return (
                        <button
                          key={item?.id || idx}
                          className={`mpbws-substep-btn ${
                            selectedStepKey === step.key &&
                            selectedSubIndex === idx
                              ? 'active'
                              : ''
                          }`}
                          type="button"
                          onClick={() => {
                            setSelectedTab(ADMIN_SECTIONS.BUILD_WORKFLOW);
                            setExpandedStepKey(step.key);
                            setSelectedStepKey(step.key);
                            setSelectedSubIndex(idx);
                          }}
                        >
                          <StatusPip level="substep" status={subStatus} />
                          <span>{item?.task ?? item?.label ?? ''}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mpm-surface mpm-step-scope">
        <StepComponentTemplate
          stepKey={selectedStepKey}
          stepLabel={currentSubLabel}
          stepData={editableData[selectedStepKey] || { checklist: [] }}
          onToggleChecklist={(index, completed, seconds) => {
            const safeSeconds = Number.isFinite(seconds) ? seconds : undefined;
            handleSubStepCompletionChange(
              selectedStepKey,
              index,
              completed,
              safeSeconds
            );
          }}
          onUpdateCheckpointStates={(itemIndex, states) =>
            handleCheckpointStatesChange(selectedStepKey, itemIndex, states)
          }
          isLocked={false}
          showCheckbox={true}
          activeIndex={selectedSubIndex}
        />
      </div>
    </div>
  );
};

export default BuildWorkflowSection;