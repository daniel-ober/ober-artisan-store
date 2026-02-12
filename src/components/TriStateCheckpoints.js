import React, { useMemo, useState } from 'react';
import './TriStateCheckpoints.css';

const STATUS = {
  NOT_STARTED: 'notStarted',
  IN_PROGRESS: 'inProgress',
  COMPLETED: 'completed',
};

const statusLabel = (s) => {
  if (s === STATUS.NOT_STARTED) return 'Not Started';
  if (s === STATUS.IN_PROGRESS) return 'In Progress';
  if (s === STATUS.COMPLETED) return 'Completed';
  return 'Not Started';
};

// Backward compat: boolean[] -> state objects
export const normalizeCheckpointStates = (states, expectedCount = 0) => {
  const make = (status = STATUS.NOT_STARTED, durationSeconds = 0) => ({
    status,
    durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : 0,
  });

  if (Array.isArray(states) && states.length) {
    // boolean legacy
    if (typeof states[0] === 'boolean') {
      return states.map((b) => make(b ? STATUS.COMPLETED : STATUS.NOT_STARTED, 0));
    }

    // already object-form
    if (typeof states[0] === 'object' && states[0] !== null) {
      return states.map((s) =>
        make(
          s.status || STATUS.NOT_STARTED,
          Number.isFinite(s.durationSeconds) ? s.durationSeconds : 0
        )
      );
    }
  }

  // no states -> build defaults if we know expected count
  if (expectedCount > 0) return new Array(expectedCount).fill(null).map(() => make());
  return [];
};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const DurationModal = ({ isOpen, title, onCancel, onConfirm }) => {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);

  const minuteOptions = useMemo(() => {
    const arr = [];
    for (let m = 0; m <= 55; m += 5) arr.push(m);
    return arr;
  }, []);

  if (!isOpen) return null;

  return (
    <div className="tsc-modal-overlay" onClick={onCancel}>
      <div className="tsc-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="tsc-modal-title">{title}</h3>
        <p className="tsc-modal-sub">Log Duration (Hours + Minutes)</p>

        <div className="tsc-modal-row">
          <label className="tsc-modal-label">Hours</label>
          <input
            className="tsc-modal-input"
            type="number"
            min={0}
            max={24}
            value={hours}
            onChange={(e) => setHours(clamp(parseInt(e.target.value || '0', 10), 0, 24))}
          />
        </div>

        <div className="tsc-modal-row">
          <label className="tsc-modal-label">Minutes</label>
          <select
            className="tsc-modal-select"
            value={minutes}
            onChange={(e) => setMinutes(parseInt(e.target.value, 10))}
          >
            {minuteOptions.map((m) => (
              <option key={m} value={m}>
                {String(m).padStart(2, '0')}
              </option>
            ))}
          </select>
        </div>

        <div className="tsc-modal-actions">
          <button className="tsc-btn tsc-btn-ghost" onClick={onCancel} type="button">
            Cancel
          </button>
          <button
            className="tsc-btn tsc-btn-primary"
            onClick={() => onConfirm(hours, minutes)}
            type="button"
          >
            Save Duration
          </button>
        </div>
      </div>
    </div>
  );
};

const nextStatus = (s) => {
  if (s === STATUS.NOT_STARTED) return STATUS.IN_PROGRESS;
  if (s === STATUS.IN_PROGRESS) return STATUS.COMPLETED;
  return STATUS.NOT_STARTED;
};

export default function TriStateCheckpoints({
  title = 'Internal Checkpoints',
  checkpointStates = [],
  expectedCount = 0,
  labels = [], // optional display names per checkpoint
  onChange,
}) {
  const normalized = useMemo(
    () => normalizeCheckpointStates(checkpointStates, expectedCount),
    [checkpointStates, expectedCount]
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [pendingIndex, setPendingIndex] = useState(null);
  const [pendingNextStatus, setPendingNextStatus] = useState(null);

  const commit = (idx, status, durationSeconds) => {
    const next = normalized.map((s, i) => {
      if (i !== idx) return s;

      // If leaving Completed -> reset duration
      if (s.status === STATUS.COMPLETED && status !== STATUS.COMPLETED) {
        return { status, durationSeconds: 0 };
      }

      // If moving to completed, duration comes from modal
      if (status === STATUS.COMPLETED) {
        return { status, durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : 0 };
      }

      // Otherwise keep duration as-is (unless leaving completed above)
      return { ...s, status };
    });

    onChange?.(next);
  };

  const handleClick = (idx) => {
    const cur = normalized[idx] || { status: STATUS.NOT_STARTED, durationSeconds: 0 };
    const ns = nextStatus(cur.status);

    if (ns === STATUS.COMPLETED) {
      // open modal to log duration
      setPendingIndex(idx);
      setPendingNextStatus(ns);
      setModalOpen(true);
      return;
    }

    commit(idx, ns);
  };

  return (
    <div className="tsc-wrap">
      <div className="tsc-title">{title}</div>

      <div className="tsc-grid">
        {normalized.map((cp, idx) => {
          const s = cp?.status || STATUS.NOT_STARTED;
          return (
            <button
              key={idx}
              type="button"
              className={`tsc-chip ${s}`}
              onClick={() => handleClick(idx)}
              title={statusLabel(s)}
            >
              <span className="tsc-chip-name">
                {labels[idx] || `Checkpoint ${idx + 1}`}
              </span>
              <span className="tsc-chip-status">{statusLabel(s)}</span>
            </button>
          );
        })}
      </div>

      <DurationModal
        isOpen={modalOpen}
        title="Log Duration"
        onCancel={() => {
          setModalOpen(false);
          setPendingIndex(null);
          setPendingNextStatus(null);
        }}
        onConfirm={(h, m) => {
          const seconds = (Number(h) || 0) * 3600 + (Number(m) || 0) * 60;
          commit(pendingIndex, pendingNextStatus, seconds);
          setModalOpen(false);
          setPendingIndex(null);
          setPendingNextStatus(null);
        }}
      />
    </div>
  );
}