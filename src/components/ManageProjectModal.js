// Updated ManageProjectModal.js with Overview split out

import React, { useState, useEffect } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { storage, db } from '../firebaseConfig';
import Step1WoodPreparation from './Step1WoodPreparation';
import ProjectOverview from './ProjectOverview';
import './ManageProjectModal.css';

const buildPhases = [
  { key: 'overview', label: 'Overview' },
  { key: 'Step 1. Wood Preparation', label: 'Step 1. Wood Preparation' },
  { key: 'Step 2. Shell Construction', label: 'Step 2. Shell Construction' },
  { key: 'Step 3. Fine-Tuning', label: 'Step 3. Fine-Tuning' },
  { key: 'Step 4. Shell Exterior Finish', label: 'Step 4. Shell Exterior Finish' },
  { key: 'Step 5. Bearing Edges', label: 'Step 5. Bearing Edges' },
  { key: 'Step 6. Snare Bed Cutting', label: 'Step 6. Snare Bed Cutting' },
  { key: 'Step 7. Hardware Drilling', label: 'Step 7. Hardware Drilling' },
  { key: 'Step 8. Hardware Assembly', label: 'Step 8. Hardware Assembly' },
  { key: 'Step 9. Tuning and Detailing', label: 'Step 9. Tuning and Detailing' },
  { key: 'Step 10. Quality Check', label: 'Step 10. Quality Check' },
];

const ManageProjectModal = ({ isOpen, onClose, projectData, onSave }) => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [editableData, setEditableData] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!projectData) return;

    const convertTimestamps = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      if ('seconds' in obj && 'nanoseconds' in obj) {
        return new Date(obj.seconds * 1000).toISOString();
      }
      if (Array.isArray(obj)) return obj.map(convertTimestamps);
      const newObj = {};
      for (const key in obj) {
        newObj[key] = convertTimestamps(obj[key]);
      }
      return newObj;
    };

    const normalizedData = convertTimestamps(projectData);
    setEditableData(normalizedData);
  }, [projectData]);

  const saveToFirestore = async (updatedData = {}) => {
    try {
      const projectRef = doc(db, 'projects', editableData.id);
      const dataToSave = {
        ...editableData,
        ...updatedData,
      };
      await setDoc(projectRef, dataToSave, { merge: true });
      console.log('Data saved successfully!');
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const handleChecklistToggle = (stepKey, itemIndex) => {
    const updatedChecklist = editableData[stepKey]?.checklist.map((item, i) =>
      i === itemIndex ? { ...item, completed: !item.completed } : item
    );
    const updatedStepData = {
      ...editableData[stepKey],
      checklist: updatedChecklist,
    };
    setEditableData((prev) => ({
      ...prev,
      [stepKey]: updatedStepData,
    }));
    saveToFirestore({ [stepKey]: updatedStepData });
  };

  const renderContent = () => {
    if (selectedTab === 'overview') {
      return (
        <ProjectOverview
          editableData={editableData}
          isEditing={isEditing}
          onEditToggle={() => setIsEditing(!isEditing)}
          onChange={(field, value) =>
            setEditableData((prev) => ({
              ...prev,
              [field]: value,
            }))
          }
          onSave={saveToFirestore}
        />
      );
    }

    if (selectedTab === 'Step 1. Wood Preparation') {
      return (
        <Step1WoodPreparation
          stepData={editableData.woodPreparation}
          relatedData={{
            woodSpecies: editableData.woodSpecies,
            thickness: editableData.thickness,
            bearingEdge: editableData.bearingEdge,
          }}
          onToggleChecklist={(index) =>
            handleChecklistToggle('woodPreparation', index)
          }
          onSaveToFirestore={saveToFirestore}
        />
      );
    }

    return <div style={{ padding: '1rem' }}>Coming soon...</div>;
  };

  if (!isOpen) return null;

  return (
    <div className="manage-project-modal-overlay">
      <div className="manage-project-modal-content">
        <header>
          <h2>Project Overview</h2>
          <button onClick={onClose} className="close-modal-btn">
            &times;
          </button>
        </header>
        <div className="modal-body">
          <aside className="sidebar">
            {buildPhases.map((phase) => (
              <button
                key={phase.key}
                className={selectedTab === phase.key ? 'active' : ''}
                onClick={() => setSelectedTab(phase.key)}
              >
                {phase.label}
              </button>
            ))}
          </aside>
          <main>
            {renderContent()}
            {isEditing && selectedTab === 'overview' && (
              <button onClick={() => saveToFirestore()} className="save-button">
                Save
              </button>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ManageProjectModal;