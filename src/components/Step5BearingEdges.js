// src/components/Step5BearingEdges.js
import React, { useEffect, useRef, useState } from 'react';
import './Step5BearingEdges.css';

const defaultChecklist = [
  { task: 'Confirm shell flatness on edge sander', completed: false, totalSeconds: 0 },
  { task: 'Mark inner and outer edge guide lines', completed: false, totalSeconds: 0 },
  { task: 'Cut inner 45° bearing edge', completed: false, totalSeconds: 0 },
  { task: 'Cut outer roundover bearing edge', completed: false, totalSeconds: 0 },
  { task: 'Inspect for burns or inconsistencies', completed: false, totalSeconds: 0 },
  { task: 'Final sand bearing edges with 320 grit', completed: false, totalSeconds: 0 },
  { task: 'Document edge spec and artisan signature', completed: false, totalSeconds: 0 },
];

const Step5BearingEdges = ({ stepData = {}, onToggleChecklist }) => {
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
    <div className="step5-container">
      <h3 className="step5-title">Step 5: Bearing Edges</h3>
      <div className="step5-checklist">
        <table className="step5-table">
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

export default Step5BearingEdges;