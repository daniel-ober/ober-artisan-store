import React, { useState } from "react";

const Step1WoodPreparation = ({
  stepData,
  onToggleChecklist,
  onStart,
  onComplete,
  onSaveToFirestore,
  relatedData,
}) => {
  const [isEditing, setIsEditing] = useState(false); // State to toggle editing mode
  const [editedData, setEditedData] = useState(stepData); // Local state for editing data

  const handleStart = async () => {
    const startTime = new Date().toISOString();
    onStart(startTime);
    await onSaveToFirestore({ startTime });
  };

  const handleComplete = async () => {
    const completeTime = new Date().toISOString();
    onComplete(completeTime);
    await onSaveToFirestore({ completeTime });
  };

  const handleSave = async () => {
    setIsEditing(false);
    await onSaveToFirestore(editedData); // Save updated data to Firestore
  };

  const handleCancel = () => {
    setEditedData(stepData); // Revert changes
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

      {/* Display related information */}
      <div className="related-details">
        <p>
          <strong>Wood Species:</strong>{" "}
          {isEditing ? (
            <input
              type="text"
              value={editedData.woodSpecies || ""}
              onChange={(e) => handleInputChange("woodSpecies", e.target.value)}
            />
          ) : (
            relatedData.woodSpecies || "N/A"
          )}
        </p>
        <p>
          <strong>Thickness:</strong>{" "}
          {isEditing ? (
            <input
              type="text"
              value={editedData.thickness || ""}
              onChange={(e) => handleInputChange("thickness", e.target.value)}
            />
          ) : (
            relatedData.thickness || "N/A"
          )}
        </p>
        <p>
          <strong>Bearing Edge:</strong>{" "}
          {isEditing ? (
            <input
              type="text"
              value={editedData.bearingEdge || ""}
              onChange={(e) => handleInputChange("bearingEdge", e.target.value)}
            />
          ) : (
            relatedData.bearingEdge || "N/A"
          )}
        </p>
      </div>

      {/* Start and Complete buttons */}
      <div className="stage-buttons">
        <button onClick={handleStart} disabled={stepData.startTime}>
          {stepData.startTime
            ? `Started: ${new Date(stepData.startTime).toLocaleString()}`
            : "Start"}
        </button>
        <button onClick={handleComplete} disabled={!stepData.startTime || stepData.completeTime}>
          {stepData.completeTime
            ? `Completed: ${new Date(stepData.completeTime).toLocaleString()}`
            : "Complete"}
        </button>
      </div>

      {/* Checkpoints */}
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

      {/* Notes */}
      <textarea
        placeholder="Notes"
        value={isEditing ? editedData.notes || "" : stepData.notes || ""}
        onChange={(e) => handleInputChange("notes", e.target.value)}
        disabled={!isEditing}
      />

      {/* Edit Buttons */}
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
    </div>
  );
};

export default Step1WoodPreparation;