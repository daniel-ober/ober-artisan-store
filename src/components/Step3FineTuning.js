// src/components/Step3FineTuning.js
import React, { useState, useEffect, useRef } from 'react';
import './Step3FineTuning.css';

const defaultChecklist = [
  { task: 'Inspect shell roundness after curing', completed: false, totalSeconds: 0 },
  { task: 'Measure inner and outer diameters', completed: false, totalSeconds: 0 },
  { task: 'Sand interior wall for tonal consistency', completed: false, totalSeconds: 0 },
  { task: 'Balance shell weight and symmetry', completed: false, totalSeconds: 0 },
  { task: 'Run tap tone resonance test', completed: false, totalSeconds: 0 },
  { task: 'Record tuning frequency baseline', completed: false, totalSeconds: 0 },
  { task: 'Log artisan observations', completed: false, totalSeconds: 0 },
];

const Step3FineTuning = ({ stepData = {}, onToggleChecklist }) => {
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
    <div className="step3-container">
      <h3 className="step3-title">Step 3: Fine-Tuning</h3>
      <div className="step3-checklist">
        <table className="step3-table">
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

export default Step3FineTuning;