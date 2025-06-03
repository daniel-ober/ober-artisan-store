// src/components/ManageProjectModal.js
import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

import StepComponentTemplate from './StepComponentTemplate';
import ProjectOverview from './ProjectOverview';
import './ManageProjectModal.css';

const buildPhases = [
  { key: 'overview', label: 'Overview' },
  { key: 'woodPreparation', label: 'Step 1: Wood Preparation' },
  { key: 'shellConstruction', label: 'Step 2: Shell Construction' },
  { key: 'fineTuning', label: 'Step 3: Fine-Tuning' },
  { key: 'shellExteriorFinish', label: 'Step 4: Shell Exterior Finish' },
  { key: 'bearingEdges', label: 'Step 5: Bearing Edges' },
  { key: 'snareBedCutting', label: 'Step 6: Snare Bed Cutting' },
  { key: 'hardwareDrilling', label: 'Step 7: Hardware Drilling' },
  { key: 'hardwareAssembly', label: 'Step 8: Hardware Assembly' },
  { key: 'tuningDetailing', label: 'Step 9: Tuning and Detailing' },
  { key: 'qualityCheck', label: 'Step 10: Quality Check' },
];

const removeUndefined = (obj) => {
  if (Array.isArray(obj)) return obj.map(removeUndefined);
  if (obj && typeof obj === 'object') {
    const cleaned = {};
    for (const key in obj) {
      if (obj[key] !== undefined) cleaned[key] = removeUndefined(obj[key]);
    }
    return cleaned;
  }
  return obj;
};

const ManageProjectModal = ({ isOpen, onClose, projectData, onSave }) => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [editableData, setEditableData] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!projectData) return;
    const convertTimestamps = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      if ('seconds' in obj && 'nanoseconds' in obj) return new Date(obj.seconds * 1000).toISOString();
      if (Array.isArray(obj)) return obj.map(convertTimestamps);
      const newObj = {};
      for (const key in obj) newObj[key] = convertTimestamps(obj[key]);
      return newObj;
    };
    setEditableData(convertTimestamps(projectData));
  }, [projectData]);

  const saveToFirestore = async (updatedData = {}) => {
    try {
      const projectRef = doc(db, 'projects', projectData.id);
      const dataToSave = removeUndefined({ ...editableData, ...updatedData });
      await setDoc(projectRef, dataToSave, { merge: true });
      console.log('✅ Data saved successfully!');
    } catch (error) {
      console.error('❌ Error updating project:', error);
    }
  };

  const handleChecklistToggle = (stepKey, index, completed, totalSeconds) => {
    const stepData = editableData[stepKey] || {};
    const checklist = stepData.checklist || [];
    const updatedChecklist = checklist.map((item, i) =>
      i === index ? { ...item, completed, totalSeconds } : item
    );
    const updatedStep = { ...stepData, checklist: updatedChecklist };
    const updatedData = { ...editableData, [stepKey]: updatedStep };
    setEditableData(updatedData);
    saveToFirestore({ [stepKey]: updatedStep });
  };

  const calculateProjectTotalTime = () => {
    let total = 0;
    for (const key in editableData) {
      if (editableData[key]?.checklist) {
        total += editableData[key].checklist.reduce((sum, item) => sum + (item.totalSeconds || 0), 0);
      }
    }
    return total;
  };

  const renderContent = () => {
    if (selectedTab === 'overview') {
      return (
        <ProjectOverview
          editableData={editableData}
          isEditing={isEditing}
          onEditToggle={() => setIsEditing(!isEditing)}
          onChange={(field, value) =>
            setEditableData((prev) => ({ ...prev, [field]: value }))
          }
          onSave={saveToFirestore}
          totalTime={calculateProjectTotalTime()}
        />
      );
    }

    return (
      <StepComponentTemplate
        stepKey={selectedTab}
        stepLabel={buildPhases.find((p) => p.key === selectedTab)?.label || selectedTab}
        stepData={editableData[selectedTab]}
        onToggleChecklist={(index, completed, seconds) =>
          handleChecklistToggle(selectedTab, index, completed, seconds)
        }
      />
    );
  };

  if (!isOpen) return null;

  return (
    <div className="manage-project-modal-overlay">
      <div className="manage-project-modal-content">
        <header>
          <h2>Project Overview</h2>
          <button onClick={onClose} className="close-modal-btn">&times;</button>
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