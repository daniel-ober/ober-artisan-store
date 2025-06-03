import React, { useState, useEffect, useRef } from 'react';
import './StepComponentTemplate.css';

const StepComponentTemplate = ({
  stepKey,
  stepLabel,
  stepData = {},
  onToggleChecklist,
}) => {
  const checklist = stepData?.checklist || [];
  const [timers, setTimers] = useState([]);
  const intervals = useRef({});
  const [editingIndex, setEditingIndex] = useState(null);
  const [editHh, setEditHh] = useState('00');
  const [editMm, setEditMm] = useState('00');
  const [editSs, setEditSs] = useState('00');

  useEffect(() => {
    setTimers(
      checklist.map((item) => ({
        running: false,
        seconds: item.totalSeconds || 0,
      }))
    );
  }, [stepData]);

  const toggleTimer = (index) => {
    setTimers((prev) => {
      const updated = [...prev];
      const wasRunning = updated[index].running;
      updated[index].running = !wasRunning;

      if (wasRunning) {
        const seconds = updated[index].seconds;
        onToggleChecklist(index, checklist[index]?.completed || false, seconds);
      }

      return updated;
    });

    if (!intervals.current[index]) {
      intervals.current[index] = setInterval(() => {
        setTimers((prev) => {
          const updated = [...prev];
          if (updated[index]?.running) {
            updated[index].seconds += 1;
          }
          return updated;
        });
      }, 1000);
    }
  };

  const handleCheckboxToggle = (index) => {
    const isNowCompleted = !checklist[index]?.completed;
    const seconds = timers[index]?.seconds || 0;

    if (isNowCompleted) {
      timers[index].running = false;
      clearInterval(intervals.current[index]);
      delete intervals.current[index];
    }

    onToggleChecklist(index, isNowCompleted, seconds);
  };

  const handleClear = (index) => {
    timers[index].running = false;
    clearInterval(intervals.current[index]);
    delete intervals.current[index];

    setTimers((prev) => {
      const updated = [...prev];
      updated[index].seconds = 0;
      return updated;
    });

    onToggleChecklist(index, checklist[index]?.completed || false, 0);
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalStepTime = timers.reduce(
    (acc, timer) => acc + (timer?.seconds || 0),
    0
  );

  const handleManualTimeSave = (index) => {
    const hh = parseInt(editHh, 10) || 0;
    const mm = Math.min(parseInt(editMm, 10) || 0, 59);
    const ss = Math.min(parseInt(editSs, 10) || 0, 59);
    const totalSeconds = hh * 3600 + mm * 60 + ss;

    timers[index].running = false;
    clearInterval(intervals.current[index]);
    delete intervals.current[index];

    setTimers((prev) => {
      const updated = [...prev];
      updated[index].seconds = totalSeconds;
      return updated;
    });

    onToggleChecklist(index, checklist[index]?.completed || false, totalSeconds);
    setEditingIndex(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (editingIndex !== null) {
        const isInsideTimeInputs = e.target.closest('.time-input-group') || e.target.closest('.time-input-actions');
        if (!isInsideTimeInputs) {
          alert('Please save or cancel your time edit first.');
          e.stopPropagation(); // prevent other actions
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
            {checklist.map((item, index) => (
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
                    checked={item.completed}
                    onChange={() => handleCheckboxToggle(index)}
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
                        <button className="cancel-btn" onClick={handleCancelEdit}>Cancel</button>
                      </div>
                    </>
                  ) : (
                    <span
                      className="time-display"
                      onClick={() => {
                        const total = timers[index]?.seconds || 0;
                        const hh = Math.floor(total / 3600).toString().padStart(2, '0');
                        const mm = Math.floor((total % 3600) / 60).toString().padStart(2, '0');
                        const ss = (total % 60).toString().padStart(2, '0');
                        setEditHh(hh);
                        setEditMm(mm);
                        setEditSs(ss);
                        setEditingIndex(index);
                      }}
                    >
                      {formatTime(timers[index]?.seconds || 0)}
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