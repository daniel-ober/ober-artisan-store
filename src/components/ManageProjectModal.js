// ManageProjectModal.js
import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import StepComponentTemplate from './StepComponentTemplate';
import ProjectOverview from './ProjectOverview';
import defaultStepData from '../utils/defaultStepData';
import './ManageProjectModal.css';

const buildPhases = [
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

const ensureChecklistStructure = (data) => {
  const fixed = { ...data };

  for (const [stepKey, stepValue] of Object.entries(defaultStepData)) {
    if (!fixed[stepKey]) {
      fixed[stepKey] = stepValue;
    } else if (!Array.isArray(fixed[stepKey].checklist)) {
      fixed[stepKey].checklist = stepValue.checklist;
    } else {
      const existingTasks = fixed[stepKey].checklist.map((item) => item.task);
      const mergedChecklist = [...fixed[stepKey].checklist];
      stepValue.checklist.forEach((defaultItem) => {
        if (!existingTasks.includes(defaultItem.task)) {
          mergedChecklist.push(defaultItem);
        }
      });
      fixed[stepKey].checklist = mergedChecklist;
    }
  }
  return fixed;
};

const determineCurrentPhase = (data = editableData) => {
    for (const phase of buildPhases) {
      const checklist = data[phase.key]?.checklist;
      if (!checklist || checklist.some((item) => !item.completed)) {
        return phase.label;
      }
    }
    return 'All Steps Complete';
  };

const ManageProjectModal = ({
  isOpen,
  onClose,
  projectData,
  onProjectUpdate,
}) => {
  const [selectedTab, setSelectedTab] = useState('details');
  const [editableData, setEditableData] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!projectData) return;
    const hydrate = ensureChecklistStructure(projectData);
    setEditableData(hydrate);
  }, [projectData]);

  const calculateProjectTotalTime = (data = editableData) => {
    let total = 0;
    for (const key in data) {
      if (data[key]?.checklist) {
        total += data[key].checklist.reduce(
          (sum, item) => sum + (item.totalSeconds || 0),
          0
        );
      }
    }
    return total;
  };

  const determineOverallStatus = (data = editableData) => {
    const allTasks = buildPhases.flatMap((p) => data[p.key]?.checklist || []);
    const total = allTasks.length;
    const completed = allTasks.filter((t) => t.completed).length;
    if (completed === 0) return 'Initial Planning';
    if (completed === total) return 'Finished';
    return 'In Production';
  };

  const saveToFirestore = async (updatedPartial = {}) => {
    try {
      const merged = { ...editableData, ...updatedPartial };
      const totalTimeSeconds = calculateProjectTotalTime(merged);
      const status = determineOverallStatus(merged);
      const currentPhase = determineCurrentPhase(merged);

      const dataToSave = {
        ...merged,
        totalTimeSeconds,
        status,
        currentPhase, 
      };

      const projectRef = doc(db, 'projects', projectData.id);
      await setDoc(projectRef, dataToSave, { merge: true });

      const refreshed = await getDoc(projectRef);
      const rehydrated = ensureChecklistStructure(refreshed.data());
      setEditableData(rehydrated);
    } catch (err) {
      console.error('❌ Failed to save project data:', err);
    }
  };

  const handleChecklistToggle = (stepKey, index, completed, totalSeconds) => {
    const step = editableData[stepKey] || { checklist: [] };
    const updatedChecklist = step.checklist.map((item, i) =>
      i === index ? { ...item, completed, totalSeconds } : item
    );

    const updatedStep = { ...step, checklist: updatedChecklist };
    const update = { [stepKey]: updatedStep };
    setEditableData((prev) => ({ ...prev, ...update }));
    if (onProjectUpdate) {
        onProjectUpdate({
          id: projectData.id,
          [stepKey]: updatedStep,
        });
      }
    saveToFirestore(update);
  };

  const isStepComplete = (key) => {
    const list = editableData[key]?.checklist;
    return list?.length > 0 && list.every((item) => item.completed);
  };

  const renderContent = () => {
    if (selectedTab === 'details') {
      return (
        <ProjectOverview
          editableData={editableData}
          isEditing={isEditing}
          onEditToggle={() => setIsEditing(!isEditing)}
          handleChange={(field, value) =>
            setEditableData((prev) => ({ ...prev, [field]: value }))
          }
          onSave={saveToFirestore}
        />
      );
    }

    return (
      <StepComponentTemplate
        stepKey={selectedTab}
        stepLabel={
          buildPhases.find((p) => p.key === selectedTab)?.label || selectedTab
        }
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
          <div className="header-left">
            <h2>Project Overview</h2>
            <button
              className="link-button"
              onClick={() => setSelectedTab('details')}
            >
              Project Details
            </button>
          </div>
          <div className="total-time-wrapper">
            <span className="total-time-label">Total Time Spent:</span>
            <span className="total-time-value">
              {Math.floor(calculateProjectTotalTime() / 3600)} hrs
            </span>
            <button onClick={onClose} className="close-modal-btn">
              &times;
            </button>
          </div>
        </header>
        <div className="modal-body">
          <aside className="sidebar">
          {buildPhases.map((phase, index) => {
  const allPriorComplete = buildPhases
    .slice(0, index)
    .every((p) =>
      editableData[p.key]?.checklist?.every((item) => item.completed)
    );

  const isActive = selectedTab === phase.key;

  return (
    <button
      key={phase.key}
      disabled={!allPriorComplete}
      className={isActive ? 'active' : ''}
      onClick={() => setSelectedTab(phase.key)}
    >
      {isStepComplete(phase.key) ? '✅ ' : ''}
      {phase.label}
    </button>
  );
})}
          </aside>
          <main>{renderContent()}</main>
        </div>
      </div>
    </div>
  );
};

export default ManageProjectModal;
