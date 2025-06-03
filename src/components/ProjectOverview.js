import React, { useEffect, useState } from 'react';
import './ProjectOverview.css';

const ProjectOverview = ({
  editableData,
  isEditing,
  onEditToggle,
  handleChange,
  onSave,
}) => {
  const [overallStatus, setOverallStatus] = useState('Unknown');

  const formatDate = (value) => {
    if (!value) return 'N/A';
    if (typeof value === 'string') return new Date(value).toLocaleString();
    if (value?.seconds) return new Date(value.seconds * 1000).toLocaleString();
    if (value instanceof Date) return value.toLocaleString();
    return 'Invalid date';
  };

  const calculateStatus = (data) => {
    const allChecklists = Object.values(data || {}).flatMap((section) =>
      Array.isArray(section?.checklist) ? section.checklist : []
    );
    const total = allChecklists.length;
    const completed = allChecklists.filter((t) => t.completed).length;

    if (total === 0) return 'Unknown';
    if (completed === 0) return 'Initial Planning';
    if (completed === total) return 'Finished';
    return 'In Production';
  };

  useEffect(() => {
    if (editableData) {
      setOverallStatus(calculateStatus(editableData));
    }
  }, [editableData]);

  return (
    <div className="project-overview-content">
      <h3>Project Details</h3>
      <div className="project-details">
        <p>
          <strong>Project ID:</strong> {editableData?.id || 'N/A'}
        </p>

        <p>
          <strong>Parent Order ID:</strong>{' '}
          {isEditing ? (
            <input
              type="text"
              value={editableData?.orderId || ''}
              onChange={(e) => handleChange('orderId', e.target.value)}
            />
          ) : (
            <a
              href={`/orders/${editableData?.orderId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {editableData?.orderId || 'N/A'}
            </a>
          )}
        </p>

        <p>
          <strong>Start Date:</strong> {formatDate(editableData?.startDate)}
        </p>
        <p>
          <strong>Target Completion:</strong>{' '}
          {formatDate(editableData?.targetCompletion)}
        </p>

        <p>
          <strong>Overall Project Status:</strong>{' '}
          {overallStatus || 'Unknown'}
        </p>

        <p>
          <strong>Current Phase:</strong>{' '}
          {isEditing ? (
            <select
              value={editableData?.currentPhase || ''}
              onChange={(e) => handleChange('currentPhase', e.target.value)}
            >
              <option value="">-- Select Phase --</option>
              <option value="Step 1. Wood Preparation">
                Step 1. Wood Preparation
              </option>
              <option value="Step 2. Shell Construction">
                Step 2. Shell Construction
              </option>
              <option value="Step 3. Fine-Tuning">Step 3. Fine-Tuning</option>
              <option value="Step 4. Shell Exterior Finish">
                Step 4. Shell Exterior Finish
              </option>
              <option value="Step 5. Bearing Edges">
                Step 5. Bearing Edges
              </option>
              <option value="Step 6. Snare Bed Cutting">
                Step 6. Snare Bed Cutting
              </option>
              <option value="Step 7. Hardware Drilling">
                Step 7. Hardware Drilling
              </option>
              <option value="Step 8. Hardware Assembly">
                Step 8. Hardware Assembly
              </option>
              <option value="Step 9. Tuning and Detailing">
                Step 9. Tuning and Detailing
              </option>
              <option value="Step 10. Quality Check">
                Step 10. Quality Check
              </option>
            </select>
          ) : (
            editableData?.currentPhase || 'N/A'
          )}
        </p>

        {isEditing && (
          <button className="save-btn" onClick={onSave}>
            Save Changes
          </button>
        )}
        <button className="edit-toggle-btn" onClick={onEditToggle}>
          {isEditing ? 'Cancel Edit' : 'Edit'}
        </button>
      </div>
    </div>
  );
};

export default ProjectOverview;