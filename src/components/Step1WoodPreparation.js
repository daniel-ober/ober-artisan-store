import React, { useState, useEffect, useRef } from 'react';
import './Step1WoodPreparation.css';

const Step1WoodPreparation = ({ stepData, onToggleChecklist, relatedData, onSaveToFirestore }) => {
  const [timers, setTimers] = useState([]);
  const intervals = useRef({});

  useEffect(() => {
    const initialTimers = stepData?.checklist?.map((item) => ({
      running: false,
      seconds: item.totalSeconds || 0,
    })) || [];
    setTimers(initialTimers);
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
          if (updated[index].running) {
            updated[index].seconds += 1;
          }
          return updated;
        });
      }, 1000);
    }
  };

  const handleCheckboxToggle = (index) => {
    const updatedTimers = [...timers];
    updatedTimers[index].running = false;
    clearInterval(intervals.current[index]);

    // Update local state
    setTimers(updatedTimers);

    // Update checklist item with completion + total time
    const updatedItem = {
      ...stepData.checklist[index],
      completed: true,
      totalSeconds: updatedTimers[index]?.seconds || 0,
    };

    const updatedChecklist = stepData.checklist.map((item, i) =>
      i === index ? updatedItem : item
    );

    // Persist full woodPreparation object
    const updatedStepData = {
      ...stepData,
      checklist: updatedChecklist,
    };

    // Update parent and Firestore
    onToggleChecklist(index); // for local UI
    onSaveToFirestore({
      woodPreparation: updatedStepData,
    });
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
            {stepData?.checklist?.map((item, index) => (
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