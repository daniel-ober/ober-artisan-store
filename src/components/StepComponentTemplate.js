import React, { useState, useEffect, useRef } from 'react';
import './StepComponentTemplate.css';

const StepComponentTemplate = ({
  stepKey,
  stepLabel,
  stepData = {},
  onToggleChecklist,
  isLocked,
}) => {
  const [localChecklist, setLocalChecklist] = useState([]);
  const [timers, setTimers] = useState([]);
  const intervals = useRef({});
  const [editingIndex, setEditingIndex] = useState(null);
  const [editHh, setEditHh] = useState('00');
  const [editMm, setEditMm] = useState('00');
  const [editSs, setEditSs] = useState('00');

  useEffect(() => {
    setLocalChecklist(stepData?.checklist || []);
  }, [stepData?.checklist]);

  useEffect(() => {
    setTimers((prevTimers) =>
      localChecklist.map((item, i) => ({
        running: prevTimers[i]?.running || false,
        seconds: extractValidSeconds(item.totalSeconds),
      }))
    );
  }, [JSON.stringify(localChecklist)]);

  const toggleTimer = (index) => {
    const isRunning = timers[index]?.running;

    if (isRunning) {
      clearInterval(intervals.current[index]);
      delete intervals.current[index];

      setTimers((prevTimers) => {
        const updated = [...prevTimers];
        updated[index] = {
          ...updated[index],
          running: false,
        };
        return updated;
      });

      const finalSeconds =
        typeof timers[index]?.seconds === 'number'
          ? timers[index].seconds
          : extractValidSeconds(localChecklist[index]?.totalSeconds);

      onToggleChecklist(index, localChecklist[index]?.completed || false, finalSeconds);
    } else {
      setTimers((prevTimers) => {
        const updated = [...prevTimers];
        updated[index] = {
          ...updated[index],
          running: true,
        };
        return updated;
      });

      intervals.current[index] = setInterval(() => {
        setTimers((prevTimers) => {
          const updated = [...prevTimers];
          if (updated[index]?.running) {
            updated[index] = {
              ...updated[index],
              seconds: (updated[index].seconds || 0) + 1,
            };
          }
          return updated;
        });
      }, 1000);
    }
  };

  const handleCheckboxToggle = (index) => {
    if (timers[index]) {
      timers[index].running = false;
      clearInterval(intervals.current[index]);
      delete intervals.current[index];
    }

    const raw =
      timers[index]?.seconds ?? localChecklist[index]?.totalSeconds ?? 0;

    const totalSeconds =
      typeof raw === 'number' ? raw : extractValidSeconds(raw);

    onToggleChecklist(index, !localChecklist[index]?.completed, totalSeconds);
  };

  const handleClear = (index) => {
    if (timers[index]) {
      timers[index].running = false;
      clearInterval(intervals.current[index]);
      delete intervals.current[index];
    }

    const updatedTimers = [...timers];
    updatedTimers[index].seconds = 0;
    setTimers(updatedTimers);

    onToggleChecklist(index, localChecklist[index]?.completed || false, 0);
  };

  const extractValidSeconds = (val) => {
    if (typeof val === 'number') return val;
    if (val?.seconds && typeof val.seconds === 'number') return val.seconds;
    if (typeof val === 'object') {
      const nested = Object.values(val).find((v) => typeof v === 'number');
      return typeof nested === 'number' ? nested : 0;
    }
    return 0;
  };

  const formatTime = (seconds) => {
    const safeSeconds = isNaN(seconds) ? 0 : seconds;
    const hrs = Math.floor(safeSeconds / 3600);
    const mins = Math.floor((safeSeconds % 3600) / 60);
    const secs = safeSeconds % 60;
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalStepTime = localChecklist.reduce((acc, item, idx) => {
    const t =
      typeof timers[idx]?.seconds === 'number'
        ? timers[idx].seconds
        : extractValidSeconds(item?.totalSeconds);
    return acc + t;
  }, 0);

  const handleManualTimeSave = (index) => {
    const hh = parseInt(editHh, 10) || 0;
    const mm = Math.min(parseInt(editMm, 10) || 0, 59);
    const ss = Math.min(parseInt(editSs, 10) || 0, 59);
    const totalSeconds = hh * 3600 + mm * 60 + ss;

    if (timers[index]) {
      timers[index].running = false;
      clearInterval(intervals.current[index]);
      delete intervals.current[index];
    }

    const updatedTimers = [...timers];
    updatedTimers[index].seconds = totalSeconds;
    setTimers(updatedTimers);

    onToggleChecklist(index, localChecklist[index]?.completed || false, totalSeconds);
    setEditingIndex(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (editingIndex !== null) {
        const isInsideTimeInputs =
          e.target.closest('.time-input-group') || e.target.closest('.time-input-actions');
        if (!isInsideTimeInputs) {
          alert('Please save or cancel your time edit first.');
          e.stopPropagation();
        }
      }
    };

    document.addEventListener('click', handleClickOutside, true);
    return () => document.removeEventListener('click', handleClickOutside, true);
  }, [editingIndex]);

  return (
    <div className="step-container">
      <h3 className="step-title">{stepLabel}</h3>
      <p className="step-total-time">
        <strong>Total Time:</strong> {formatTime(totalStepTime)}
      </p>

      <div className="step-checklist">
        <table className="step-table">
          <thead>
            <tr>
              <th></th>
              <th></th>
              <th>Task</th>
              <th>Total Time</th>
            </tr>
          </thead>
          <tbody>
            {localChecklist.map((item, index) => (
              <tr key={index}>
                <td>
                  {!item.completed && (
                    <button
                      onClick={() => toggleTimer(index)}
                      className={`timer-toggle ${timers[index]?.running ? 'stop' : 'start'}`}
                    >
                      {timers[index]?.running ? 'Stop' : 'Start'}
                    </button>
                  )}
                </td>
                <td>
                  <input
                    type="checkbox"
                    disabled={isLocked}
                    checked={item.completed}
                    onChange={() => handleCheckboxToggle(index)}
                    className={isLocked ? 'locked-task' : ''}
                  />
                </td>
                <td>{item.task}</td>
                <td>
                  {editingIndex === index ? (
                    <>
                      <div className="time-input-group">
                        <input
                          type="text"
                          maxLength={2}
                          className="manual-time-input"
                          value={editHh}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                            setEditHh(val);
                          }}
                        />
                        :
                        <input
                          type="text"
                          maxLength={2}
                          className="manual-time-input"
                          value={editMm}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, '').slice(0, 2);
                            if (parseInt(val, 10) > 59) val = '59';
                            setEditMm(val);
                          }}
                        />
                        :
                        <input
                          type="text"
                          maxLength={2}
                          className="manual-time-input"
                          value={editSs}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, '').slice(0, 2);
                            if (parseInt(val, 10) > 59) val = '59';
                            setEditSs(val);
                          }}
                        />
                      </div>
                      <div className="time-input-actions">
                        <button onClick={() => handleManualTimeSave(index)}>Save</button>
                        <button className="cancel-btn" onClick={handleCancelEdit}>
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <span
                      className="time-display"
                      onClick={() => {
                        const raw =
                          timers[index]?.seconds ??
                          localChecklist[index]?.totalSeconds ??
                          0;
                        const total =
                          typeof raw === 'number' ? raw : extractValidSeconds(raw);
                        const hh = Math.floor(total / 3600)
                          .toString()
                          .padStart(2, '0');
                        const mm = Math.floor((total % 3600) / 60)
                          .toString()
                          .padStart(2, '0');
                        const ss = (total % 60).toString().padStart(2, '0');
                        setEditHh(hh);
                        setEditMm(mm);
                        setEditSs(ss);
                        setEditingIndex(index);
                      }}
                    >
                      {formatTime(
                        typeof timers[index]?.seconds === 'number'
                          ? timers[index].seconds
                          : extractValidSeconds(localChecklist[index]?.totalSeconds)
                      )}
                    </span>
                  )}
                  <div>
                    <button
                      onClick={() => handleClear(index)}
                      className="clear-time-btn"
                    >
                      Clear
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StepComponentTemplate;