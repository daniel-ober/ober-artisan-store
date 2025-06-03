// src/components/Step6SnareBedCutting.js
import React, { useEffect, useRef, useState } from 'react';
import './Step6SnareBedCutting.css';

const defaultChecklist = [
  { task: 'Mark snare bed zones at lug points', completed: false, totalSeconds: 0 },
  { task: 'Set router depth stop for snare bed', completed: false, totalSeconds: 0 },
  { task: 'Cut shallow taper into shell center', completed: false, totalSeconds: 0 },
  { task: 'Hand-finish taper for smooth transition', completed: false, totalSeconds: 0 },
  { task: 'Inspect symmetry and centrality', completed: false, totalSeconds: 0 },
  { task: 'Sand and buff inner curve', completed: false, totalSeconds: 0 },
  { task: 'Log snare bed depth + artisan initials', completed: false, totalSeconds: 0 },
];

const Step6SnareBedCutting = ({ stepData = {}, onToggleChecklist }) => {
  const checklist = stepData?.checklist?.length ? stepData.checklist : defaultChecklist;
  const [timers, setTimers] = useState([]);
  const intervals = useRef({});

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
      updated[index].running = !updated[index].running;
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="step6-container">
      <h3 className="step6-title">Step 6: Snare Bed Cutting</h3>
      <div className="step6-checklist">
        <table className="step6-table">
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
                    <button onClick={() => toggleTimer(index)} className="timer-toggle">
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
                <td>{formatTime(timers[index]?.seconds || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Step6SnareBedCutting;