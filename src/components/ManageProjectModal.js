// src/components/ManageProjectModal.js
import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

import Step1WoodPreparation from './Step1WoodPreparation';
import Step2ShellConstruction from './Step2ShellConstruction';
import Step3FineTuning from './Step3FineTuning';
import Step4ShellExteriorFinish from './Step4ShellExteriorFinish';
import Step5BearingEdges from './Step5BearingEdges';
import Step6SnareBedCutting from './Step6SnareBedCutting';
import Step7HardwareDrilling from './Step7HardwareDrilling';
import Step8HardwareAssembly from './Step8HardwareAssembly';
import Step9TuningDetailing from './Step9TuningDetailing';
import Step10QualityCheck from './Step10QualityCheck';

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

// 🔧 Utility to remove undefined values before Firestore write
const removeUndefined = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  } else if (obj && typeof obj === 'object') {
    const cleaned = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        cleaned[key] = removeUndefined(obj[key]);
      }
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

  const renderContent = () => {
    const sharedProps = (stepKey) => ({
      onToggleChecklist: (index, completed, seconds) =>
        handleChecklistToggle(stepKey, index, completed, seconds),
      onSaveToFirestore: saveToFirestore,
    });

    switch (selectedTab) {
      case 'overview':
        return (
          <ProjectOverview
            editableData={editableData}
            isEditing={isEditing}
            onEditToggle={() => setIsEditing(!isEditing)}
            onChange={(field, value) =>
              setEditableData((prev) => ({ ...prev, [field]: value }))
            }
            onSave={saveToFirestore}
          />
        );
      case 'Step 1. Wood Preparation':
        return (
          <Step1WoodPreparation
            stepData={editableData.woodPreparation}
            relatedData={{
              woodSpecies: editableData.woodSpecies,
              thickness: editableData.thickness,
              bearingEdge: editableData.bearingEdge,
            }}
            {...sharedProps('woodPreparation')}
          />
        );
      case 'Step 2. Shell Construction':
        return (
          <Step2ShellConstruction
            stepData={editableData.shellConstruction}
            {...sharedProps('shellConstruction')}
          />
        );
      case 'Step 3. Fine-Tuning':
        return (
          <Step3FineTuning
            stepData={editableData.fineTuning}
            {...sharedProps('fineTuning')}
          />
        );
      case 'Step 4. Shell Exterior Finish':
        return (
          <Step4ShellExteriorFinish
            stepData={editableData.shellExteriorFinish}
            {...sharedProps('shellExteriorFinish')}
          />
        );
      case 'Step 5. Bearing Edges':
        return (
          <Step5BearingEdges
            stepData={editableData.bearingEdges}
            {...sharedProps('bearingEdges')}
          />
        );
      case 'Step 6. Snare Bed Cutting':
        return (
          <Step6SnareBedCutting
            stepData={editableData.snareBedCutting}
            {...sharedProps('snareBedCutting')}
          />
        );
      case 'Step 7. Hardware Drilling':
        return (
          <Step7HardwareDrilling
            stepData={editableData.hardwareDrilling}
            {...sharedProps('hardwareDrilling')}
          />
        );
      case 'Step 8. Hardware Assembly':
        return (
          <Step8HardwareAssembly
            stepData={editableData.hardwareAssembly}
            {...sharedProps('hardwareAssembly')}
          />
        );
      case 'Step 9. Tuning and Detailing':
        return (
          <Step9TuningDetailing
            stepData={editableData.tuningDetailing}
            {...sharedProps('tuningDetailing')}
          />
        );
      case 'Step 10. Quality Check':
        return (
          <Step10QualityCheck
            stepData={editableData.qualityCheck}
            {...sharedProps('qualityCheck')}
          />
        );
      default:
        return <div style={{ padding: '1rem' }}>Coming soon...</div>;
    }
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