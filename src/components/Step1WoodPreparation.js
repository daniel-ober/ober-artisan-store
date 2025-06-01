import React, { useState } from 'react';
import { formatDate } from './ManageProjectModal/utils';

const Step1WoodPreparation = ({
  stepData,
  onToggleChecklist,
  onSaveToFirestore,
  relatedData,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(stepData);
  const [currentSessionStart, setCurrentSessionStart] = useState(null);

  const handleStart = () => {
    setCurrentSessionStart(new Date().toISOString());
  };

  const handleStop = async () => {
    if (!currentSessionStart) return;

    const stopTime = new Date().toISOString();
    const newSession = {
      startTime: currentSessionStart,
      stopTime,
    };

    const updatedSessions = [...(stepData.workSessions || []), newSession];

    const updatedStepData = {
      ...stepData,
      workSessions: updatedSessions,
    };

    await onSaveToFirestore({ woodPreparation: updatedStepData });
    setCurrentSessionStart(null);
  };

  const handleComplete = async () => {
    const completeTime = new Date().toISOString();
    const updatedStepData = {
      ...stepData,
      completeTime,
    };
    await onSaveToFirestore({ woodPreparation: updatedStepData });
  };

  const handleSessionDelete = async (index) => {
    const updatedSessions = [...(stepData.workSessions || [])];
    updatedSessions.splice(index, 1);

    await onSaveToFirestore({
      woodPreparation: {
        ...stepData,
        workSessions: updatedSessions,
      },
    });
  };

  const calculateMinutes = (start, stop) => {
    const startTime = new Date(start);
    const stopTime = new Date(stop);
    return Math.round((stopTime - startTime) / 60000);
  };

  const totalTime = (stepData.workSessions || []).reduce((total, session) => {
    return total + calculateMinutes(session.startTime, session.stopTime);
  }, 0);

  const handleSave = async () => {
    setIsEditing(false);
    await onSaveToFirestore({
      woodPreparation: {
        ...stepData,
        ...editedData,
      },
    });
  };

  const handleCancel = () => {
    setEditedData(stepData);
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div>
      <h3>Step 1: Wood Preparation</h3>

      <div className="related-details">
        <p><strong>Wood Species:</strong> {relatedData?.woodSpecies || 'N/A'}</p>
        <p><strong>Thickness:</strong> {relatedData?.thickness || 'N/A'}</p>
        <p><strong>Bearing Edge:</strong> {relatedData?.bearingEdge || 'N/A'}</p>
      </div>

      <div className="stage-buttons">
        <button onClick={handleStart} disabled={!!currentSessionStart}>
          {currentSessionStart
            ? `Started: ${formatDate(currentSessionStart)}`
            : 'Start'}
        </button>

        <button
          onClick={handleStop}
          disabled={!currentSessionStart}
        >
          Stop
        </button>

        <button
          onClick={handleComplete}
          disabled={!!stepData.completeTime}
        >
          {stepData.completeTime
            ? `Completed: ${formatDate(stepData.completeTime)}`
            : 'Mark as Complete'}
        </button>
      </div>

      <ul>
        {stepData.checklist?.map((item, index) => (
          <li key={index}>
            <label>
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => onToggleChecklist(index)}
              />
              {item.task}
            </label>
          </li>
        ))}
      </ul>

      <textarea
        placeholder="Notes"
        value={isEditing ? editedData.notes || '' : stepData.notes || ''}
        onChange={(e) => handleInputChange('notes', e.target.value)}
        disabled={!isEditing}
      />

      <div className="edit-buttons">
        {isEditing ? (
          <>
            <button onClick={handleSave}>Save</button>
            <button onClick={handleCancel}>Cancel</button>
          </>
        ) : (
          <button onClick={() => setIsEditing(true)}>Edit</button>
        )}
      </div>

      <div className="work-session-log">
        <h4>Work Sessions</h4>
        {(stepData.workSessions || []).map((session, index) => (
          <div key={index}>
            <p>
              <strong>Start:</strong> {formatDate(session.startTime)}<br />
              <strong>Stop:</strong> {formatDate(session.stopTime)}<br />
              <strong>Duration:</strong> {calculateMinutes(session.startTime, session.stopTime)} min
            </p>
            <button onClick={() => handleSessionDelete(index)}>Delete</button>
            {/* Edit functionality could be added here if needed */}
          </div>
        ))}
        <p><strong>Total Time:</strong> {totalTime} minutes</p>
      </div>
    </div>
  );
};

export default Step1WoodPreparation;