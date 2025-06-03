import React, { useEffect, useRef, useState } from 'react';
import './Step10QualityCheck.css';

const defaultChecklist = [
  { task: 'Final shell inspection (interior + exterior)', completed: false, totalSeconds: 0 },
  { task: 'Check for visual defects or inconsistencies', completed: false, totalSeconds: 0 },
  { task: 'Confirm bearing edge cleanliness and integrity', completed: false, totalSeconds: 0 },
  { task: 'Inspect hardware tightness and alignment', completed: false, totalSeconds: 0 },
  { task: 'Ensure snare wire response is consistent', completed: false, totalSeconds: 0 },
  { task: 'Full test-play to confirm tonal balance', completed: false, totalSeconds: 0 },
  { task: 'Clean and polish entire drum for delivery', completed: false, totalSeconds: 0 },
  { task: 'Mark drum as production complete', completed: false, totalSeconds: 0 },
];

const Step10QualityCheck = ({ stepData = {}, onToggleChecklist }) => {
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

    console.log(`Checkbox ${index} toggled: ${isNowCompleted}`);

    // Stop timer if checked
    if (isNowCompleted) {
      timers[index].running = false;
      clearInterval(intervals.current[index]);
      delete intervals.current[index];
    }

    // Let parent update Firestore and re-render
    onToggleChecklist(index, isNowCompleted, seconds);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="step10-container">
      <h3 className="step10-title">Step 10: Quality Check</h3>
      <div className="step10-checklist">
        <table className="step10-table">
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

export default Step10QualityCheck;