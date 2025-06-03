// src/components/Step1WoodPreparation.js
import React, { useState, useEffect, useRef } from 'react';
import './Step1WoodPreparation.css';

const defaultChecklist = [
  { task: 'Inspect raw wood for defects or warping', completed: false, totalSeconds: 0 },
  { task: 'Verify moisture content (8–12%)', completed: false, totalSeconds: 0 },
  { task: 'Rough cut to stave or segment lengths', completed: false, totalSeconds: 0 },
  { task: 'Joint edges and flatten faces', completed: false, totalSeconds: 0 },
  { task: 'Run through planer to thickness spec', completed: false, totalSeconds: 0 },
  { task: 'Arrange for grain direction / visual layout', completed: false, totalSeconds: 0 },
];

const Step1WoodPreparation = ({ stepData = {}, onToggleChecklist }) => {
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
    <div className="step1-container">
      <h3 className="step1-title">Step 1: Wood Preparation</h3>
      <div className="step1-checklist">
        <table className="step1-table">
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

export default Step1WoodPreparation;