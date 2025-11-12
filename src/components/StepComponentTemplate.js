import React, { useMemo, useState } from 'react';

/* Format a totalSeconds integer to "Hh MMm" (no seconds) */
const fmtHM = (totalSeconds = 0) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
};

/* Convert hours/minutes to seconds */
const hmToSeconds = (h, m) => {
  const hours = Number.isFinite(+h) ? Math.max(0, parseInt(h, 10) || 0) : 0;
  const mins = Number.isFinite(+m) ? Math.max(0, parseInt(m, 10) || 0) : 0;
  return hours * 3600 + mins * 60;
};

const StepComponentTemplate = ({
  stepKey,
  stepLabel,
  stepData = { checklist: [] },
  onToggleChecklist,      // (index, completed, totalSeconds)
  isLocked = false,
}) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [hInput, setHInput] = useState('0');
  const [mInput, setMInput] = useState('0');

  const totalTime = useMemo(
    () =>
      (stepData.checklist || []).reduce(
        (sum, item) => sum + (item.totalSeconds || 0),
        0
      ),
    [stepData.checklist]
  );

  const beginEdit = (idx, currentSeconds = 0) => {
    const h = Math.floor(currentSeconds / 3600);
    const m = Math.floor((currentSeconds % 3600) / 60);
    setHInput(String(h));
    setMInput(String(m));
    setEditingIndex(idx);
  };

  const saveEdit = (idx, checked) => {
    const secs = hmToSeconds(hInput, mInput);
    onToggleChecklist(idx, checked, secs);
    setEditingIndex(null);
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.6rem', marginBottom: '.75rem' }}>{stepLabel}</h2>

      {/* total time with units */}
      <div style={{ marginBottom: '1rem', fontWeight: 600 }}>
        Total Time: {fmtHM(totalTime)}
      </div>

      <div style={{ borderTop: '1px solid #eee' }}>
        {(stepData.checklist || []).map((item, idx) => {
          const checked = !!item.completed;
          const isEditing = editingIndex === idx;

          return (
            <div
              key={idx}
              style={{
                display: 'grid',
                gridTemplateColumns: '28px 1fr 220px',
                gap: '12px',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid #f0f0f0',
                opacity: isLocked ? 0.6 : 1,
              }}
            >
              {/* checkbox */}
              <input
                type="checkbox"
                checked={checked}
                disabled={isLocked}
                onChange={(e) =>
                  onToggleChecklist(idx, e.target.checked, item.totalSeconds || 0)
                }
              />

              {/* task label */}
              <div style={{ color: '#111' }}>{item.task}</div>

              {/* time cell */}
              <div style={{ justifySelf: 'end' }}>
                {!isEditing ? (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {/* reading with "h m" */}
                    <div style={{ minWidth: 90, textAlign: 'right' }}>
                      {fmtHM(item.totalSeconds || 0)}
                    </div>
                    <button
                      disabled={isLocked}
                      onClick={() => beginEdit(idx, item.totalSeconds || 0)}
                      style={{
                        border: '1px solid #d1d5db',
                        background: '#fff',
                        padding: '4px 8px',
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      disabled={isLocked || (item.totalSeconds || 0) === 0}
                      onClick={() => onToggleChecklist(idx, checked, 0)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#999',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                      }}
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number"
                      min="0"
                      value={hInput}
                      onChange={(e) => setHInput(e.target.value)}
                      style={{ width: 56, textAlign: 'right' }}
                    />
                    <span>h</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={mInput}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '' || (/^\d+$/.test(v) && Number(v) <= 59)) setMInput(v);
                      }}
                      style={{ width: 56, textAlign: 'right' }}
                    />
                    <span>m</span>
                    <button
                      onClick={() => saveEdit(idx, checked)}
                      style={{
                        background: '#22c55e',
                        color: '#fff',
                        border: '1px solid #16a34a',
                        padding: '4px 10px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingIndex(null)}
                      style={{
                        border: '1px solid #d1d5db',
                        background: '#fff',
                        padding: '4px 10px',
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
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