// src/components/StepComponentTemplate.js
import React, { useMemo, useState, useEffect } from 'react';
import './StepComponentTemplate.css';
import { STAGE_TEMPLATES } from '../utils/workflowDefinitions';

/* ---------- Time helpers ---------- */

const fmtHM = (totalSeconds = 0) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
};

/**
 * SAFE EXPORT
 * (Used by ManageProjectModal helper functions)
 *
 * We hydrate it dynamically from STAGE_TEMPLATES.
 */
export const CHECKPOINTS_BY_ITEM_ID = Object.values(STAGE_TEMPLATES || {})
  .flatMap((stage) => stage?.steps || [])
  .reduce((acc, step) => {
    if (!step?.id || !step?.checkpoints) return acc;
    acc[step.id] = step.checkpoints;
    return acc;
  }, {});

/* ---------- Presets ---------- */

const TIME_PRESETS = [
  { label: '0 min', seconds: 0 },
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
  { label: '15 min', seconds: 900 },
  { label: '20 min', seconds: 1200 },
  { label: '30 min', seconds: 1800 },
  { label: '45 min', seconds: 2700 },
  { label: '1 hr', seconds: 3600 },
  { label: '2 hr', seconds: 7200 },
  { label: '4 hr', seconds: 14400 },
  { label: '8 hr', seconds: 28800 },
];

const findClosestPreset = (totalSeconds = 0) => {
  let closest = TIME_PRESETS[0];
  let diff = Math.abs(totalSeconds - closest.seconds);

  for (const p of TIME_PRESETS) {
    const d = Math.abs(totalSeconds - p.seconds);
    if (d < diff) {
      diff = d;
      closest = p;
    }
  }
  return closest;
};

/* ---------- checkpoint helpers ---------- */

const normalizeCheckpointArray = (arr, len) => {
  const base = Array.isArray(arr) ? arr : [];

  const normalized = base.map((v) => {
    if (v === 'na') return 'na';
    return v === true;
  });

  return normalized
    .concat(new Array(Math.max(0, len - normalized.length)).fill(false))
    .slice(0, len);
};

const isCheckpointDone = (v) => v === true;
const isCheckpointNA = (v) => v === 'na';

const safeText = (v) => {
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return '';
};

/* ---------- StepComponent ---------- */

const StepComponentTemplate = ({
  stepKey,
  stepLabel,
  stepData = { checklist: [] },
  onToggleChecklist,
  onUpdateCheckpointStates,
  isLocked = false,
  activeIndex = null,
}) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [presetSeconds, setPresetSeconds] = useState(0);

  const items = stepData.checklist || [];

  const activeIdx =
    activeIndex !== null && activeIndex >= 0 && activeIndex < items.length
      ? activeIndex
      : 0;

  const activeItem = items[activeIdx];

  /* ---------- resolve checkpoints ---------- */

  const stage = STAGE_TEMPLATES?.[stepKey];

  let checkpointDefs = stage?.steps?.[activeIdx]?.checkpoints || [];

  // fallback for legacy saved projects
  if (!checkpointDefs.length && activeItem?.checkpointStates?.length) {
    checkpointDefs = Array.from(
      { length: activeItem.checkpointStates.length },
      (_, i) => ({
        ui: `Checkpoint ${i + 1}`,
        details: [],
        book: `Checkpoint ${i + 1}`,
        naAllowed: true,
      })
    );
  }

  // HARD fallback
  if (!checkpointDefs.length) {
    checkpointDefs = [
      {
        ui: 'Mark step complete',
        details: [],
        book: safeText(activeItem?.task) || `Step ${activeIdx + 1}`,
        naAllowed: false,
      },
    ];
  }

  /* ---------- local state ---------- */

  const [localCheckpointStates, setLocalCheckpointStates] = useState(() =>
    normalizeCheckpointArray(activeItem?.checkpointStates, checkpointDefs.length)
  );

  useEffect(() => {
    setLocalCheckpointStates(
      normalizeCheckpointArray(activeItem?.checkpointStates, checkpointDefs.length)
    );
  }, [activeItem?.id, checkpointDefs.length]);

  const totalTime = useMemo(() => activeItem?.totalSeconds || 0, [activeItem]);

  const persistCheckpointStates = (next) => {
    setLocalCheckpointStates(next);
    onUpdateCheckpointStates?.(activeIdx, next);
  };

  const handleCheckpointToggle = (idx, checked) => {
    const next = [...localCheckpointStates];
    next[idx] = checked ? true : false;
    persistCheckpointStates(next);
  };

  const handleCheckpointNAToggle = (idx) => {
    const def = checkpointDefs[idx];
    if (def?.naAllowed === false) return;

    const next = [...localCheckpointStates];
    next[idx] = next[idx] === 'na' ? false : 'na';
    persistCheckpointStates(next);
  };

  if (!activeItem) {
    return (
      <div className="mpm-step-detail">
        <h2>{stepLabel}</h2>
        <p>No sub-step data found.</p>
      </div>
    );
  }

  const allSatisfied = checkpointDefs.every(
    (_, i) => isCheckpointDone(localCheckpointStates[i]) || isCheckpointNA(localCheckpointStates[i])
  );

  const checked = !!activeItem.completed || allSatisfied;

  /* ---------- UI ---------- */

  return (
    <div className="mpm-step-detail">
      <h2 className="mpm-step-title">{stepLabel}</h2>

      <div className="mpm-step-total">
        Total Time:
        <span>{fmtHM(totalTime)}</span>
      </div>

      {/* COMPLETE TOGGLE */}
      <label className="mpm-step-status-label">
        <input
          type="checkbox"
          disabled={isLocked}
          checked={checked}
          onChange={(e) =>
            onToggleChecklist?.(activeIdx, e.target.checked, activeItem.totalSeconds || 0)
          }
        />
        <span>Mark sub-step complete</span>
      </label>

      {/* CHECKPOINTS */}
      <div className="mpm-check-grid">
        {checkpointDefs.map((def, idx) => {
          const val = localCheckpointStates[idx];
          const done = isCheckpointDone(val);
          const na = isCheckpointNA(val);

          // ✅ never render an object accidentally
          const title =
            typeof def?.ui === 'string'
              ? def.ui
              : typeof def?.book === 'string'
              ? def.book
              : `Checkpoint ${idx + 1}`;

          const details = def?.details;

          return (
            <div key={`${idx}-${title}`} className="mpm-check-row">
              <input
                type="checkbox"
                checked={done || na}
                disabled={isLocked}
                onChange={(e) => handleCheckpointToggle(idx, e.target.checked)}
              />

              <div style={{ opacity: na ? 0.6 : 1 }}>
                <div className="mpm-check-title">
                  {title}
                  {na && <span className="na-pill">N/A</span>}
                </div>

                {/* ✅ BULLETPOINT EXAMPLES */}
                {Array.isArray(details) && details.length > 0 && (
                  <ul className="mpm-check-details">
                    {details.map((d, i) => (
                      <li key={`${idx}-d-${i}`}>{safeText(d)}</li>
                    ))}
                  </ul>
                )}

                {typeof details === 'string' && details.trim() && (
                  <div className="mpm-check-details-text">{details}</div>
                )}

                {def?.naAllowed !== false && (
                  <button type="button" onClick={() => handleCheckpointNAToggle(idx)}>
                    {na ? 'Undo N/A' : 'N/A'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepComponentTemplate;