// src/components/Step4ShellExteriorFinish.js
import React, { useState, useEffect, useRef } from 'react';
import './Step4ShellExteriorFinish.css';

const defaultChecklist = [
  { task: 'Select exterior finish type (oil, lacquer, wrap)', completed: false, totalSeconds: 0 },
  { task: 'Apply base sanding to shell exterior', completed: false, totalSeconds: 0 },
  { task: 'Wipe down for dust/debris removal', completed: false, totalSeconds: 0 },
  { task: 'Apply first coat / treatment', completed: false, totalSeconds: 0 },
  { task: 'Allow full cure/dry period', completed: false, totalSeconds: 0 },
  { task: 'Apply secondary coat / buffing', completed: false, totalSeconds: 0 },
  { task: 'Final visual inspection & touch-ups', completed: false, totalSeconds: 0 },
  { task: 'Record artisan notes / observations', completed: false, totalSeconds: 0 },
];

const Step4ShellExteriorFinish = ({ stepData = {}, onToggleChecklist }) => {
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
    <div className="step4-container">
      <h3 className="step4-title">Step 4: Shell Exterior Finish</h3>
      <div className="step4-checklist">
        <table className="step4-table">
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

export default Step4ShellExteriorFinish;