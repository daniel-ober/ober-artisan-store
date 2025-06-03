// src/components/Step2ShellConstruction.js
import React, { useState, useEffect, useRef } from 'react';
import './Step2ShellConstruction.css';

const defaultChecklist = [
  { task: 'Confirm stave layout and count', completed: false, totalSeconds: 0 },
  { task: 'Align grain direction and orientation', completed: false, totalSeconds: 0 },
  { task: 'Apply glue to all joint edges', completed: false, totalSeconds: 0 },
  { task: 'Clamp shell evenly under high tension', completed: false, totalSeconds: 0 },
  { task: 'Cure in mold for 24–48 hours', completed: false, totalSeconds: 0 },
  { task: 'Sand exterior for roundness & bonding', completed: false, totalSeconds: 0 },
  { task: 'Inspect joints and structural integrity', completed: false, totalSeconds: 0 },
];

const Step2ShellConstruction = ({ stepData = {}, onToggleChecklist }) => {
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
    <div className="step2-container">
      <h3 className="step2-title">Step 2: Shell Construction</h3>
      <div className="step2-checklist">
        <table className="step2-table">
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
                      className="timer-toggle"
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
                <td>{formatTime(timers[index]?.seconds || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Step2ShellConstruction;