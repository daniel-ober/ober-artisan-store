import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import StepComponentTemplate from './StepComponentTemplate';
import ProjectOverview from './ProjectOverview';
import defaultStepData from '../utils/defaultStepData';
import { Snackbar } from '@mui/material';
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

const formatFullTime = (totalSeconds) => {
  const days = Math.floor(totalSeconds / 86400);
  const remainder = totalSeconds % 86400;
  const hours = Math.floor(remainder / 3600);
  const minutes = Math.floor((remainder % 3600) / 60);
  const seconds = remainder % 60;
  return `${days}d ${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const getCurrentStepProgress = () => {
  const currentKey = buildPhases.find((p) => p.label === currentStepName)?.key;
  const checklist = editableData?.[currentKey]?.checklist || [];
  const completed = checklist.filter((t) => t.completed).length;
  const total = checklist.length || 1;
  return Math.round((completed / total) * 100);
};

const getStepProgressClass = () => {
  const pct = getCurrentStepProgress();
  if (pct === 0) return 'step-chip step-0';
  if (pct < 35) return 'step-chip step-25';
  if (pct < 65) return 'step-chip step-50';
  if (pct < 100) return 'step-chip step-75';
  return 'step-chip step-100';
};

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

const ManageProjectModal = ({
  isOpen,
  onClose,
  projectData,
  onProjectUpdate,
}) => {
  const [selectedTab, setSelectedTab] = useState('details');
  const [editableData, setEditableData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState('Unknown');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [originalData, setOriginalData] = useState({});

  const isStepComplete = (key) => {
    const list = editableData[key]?.checklist;
    return list?.length > 0 && list.every((item) => item.completed);
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

  useEffect(() => {
    if (!projectData) return;
    const hydrate = ensureChecklistStructure(projectData);
    setEditableData(hydrate);
    setOriginalData(hydrate);
    setStatus(determineOverallStatus(hydrate));
  }, [projectData]);

  const calculateProjectTotalTime = (data = editableData) => {
    let total = 0;
    for (const key in data) {
      if (data[key]?.checklist) {
        total += data[key].checklist.reduce(
          (sum, item) => sum + extractValidSeconds(item.totalSeconds),
          0
        );
      }
    }
    return total;
  };

  useEffect(() => {
    if (!projectData) return;
    const hydrate = ensureChecklistStructure(projectData);
    setEditableData(hydrate);
    setOriginalData(hydrate);
    setStatus(determineOverallStatus(hydrate));
  }, [projectData]);

  const determineOverallStatus = (data = editableData) => {
    const allTasks = buildPhases.flatMap((p) => data[p.key]?.checklist || []);
    const total = allTasks.length;
    const completed = allTasks.filter((t) => t.completed).length;
    if (completed === 0) return 'Initial Planning';
    if (completed === total) return 'Finished';
    return 'In Production';
  };

  const extractValidSeconds = (val) => {
    if (typeof val === 'number') return val;
    if (val?.seconds && typeof val.seconds === 'number') return val.seconds;
    if (typeof val === 'object') {
      const nested = Object.values(val).find((v) => typeof v === 'number');
      return typeof nested === 'number' ? nested : 0;
    }
    return 0;
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Initial Planning':
        return 'status-chip planning';
      case 'In Production':
        return 'status-chip production';
      case 'Finished':
        return 'status-chip finished';
      default:
        return 'status-chip';
    }
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
  
      // ✅ Move UI updates here so they apply universally (overview save + task toggle)
      setIsEditing(false);
      setShowSnackbar(true);
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
    const merged = { ...editableData, ...update };

    setEditableData(merged);
    setStatus(determineOverallStatus(merged)); // ✅ Immediately update UI status

    if (onProjectUpdate) {
      onProjectUpdate({ id: projectData.id, [stepKey]: updatedStep });
    }
    saveToFirestore(update);
    setIsEditing(false);
    setShowSnackbar(true);
  };

  const renderContent = () => {
    if (selectedTab === 'details') {
      return (
<ProjectOverview
  editableData={{
    id: editableData?.id,
    orderId: editableData?.orderId,
    startDate: editableData?.startDate,
    targetCompletion: editableData?.targetCompletion,
    shellConstruction: editableData?.shellConstructionName || '',
    staveCount: editableData?.staveCount,
    woodPrimary: editableData?.woodPrimary,
    woodSecondary: editableData?.woodSecondary,
    woodSecondaryPercent: editableData?.woodSecondaryPercent,
    hybridSteamBentSpecies: editableData?.hybridSteamBentSpecies,
    width: editableData?.width,
    shellDepth: editableData?.shellDepth,
    lugCount: editableData?.lugCount,
    lugType: editableData?.lugType,
    hardwareColor: editableData?.hardwareColor,
    hoops: editableData?.hoops,
    reinforcementRings: editableData?.reinforcementRings,
    reringsSpecies: editableData?.reringsSpecies,
    snareThrowOff: editableData?.snareThrowOff,
    snareWires: editableData?.snareWires,
    snareBedDepth: editableData?.snareBedDepth,
    finishDetails: editableData?.finishDetails,
    additionalNotes: editableData?.additionalNotes,
  }}
  isEditing={isEditing}
  onEditToggle={() => setIsEditing(!isEditing)}
  handleChange={(field, value) =>
    setEditableData((prev) => ({ ...prev, [field]: value }))
  }
  onSave={() => {
    saveToFirestore(editableData);
    setShowSnackbar(true);
  }}
  onCancel={() => {
    setEditableData(originalData);
    setIsEditing(false);
  }}
/>
      );
    }

    const currentStepIndex = buildPhases.findIndex(
      (p) => p.key === selectedTab
    );
    const isLocked =
      selectedTab !== 'details' &&
      currentStepIndex > 0 &&
      !isStepComplete(buildPhases[currentStepIndex - 1].key);
    const currentIndex = buildPhases.findIndex((p) => p.key === selectedTab);
    const isUnlocked =
      currentIndex === 0 ||
      buildPhases.slice(0, currentIndex).every((p) => isStepComplete(p.key));

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
        isLocked={isLocked}
      />
    );
  };

  if (!isOpen) return null;

  const currentStepName = determineCurrentPhase(editableData);

  const getCurrentStepProgress = () => {
    const currentKey = buildPhases.find(
      (p) => p.label === currentStepName
    )?.key;
    const checklist = editableData?.[currentKey]?.checklist || [];
    const completed = checklist.filter((t) => t.completed).length;
    const total = checklist.length || 1;
    return Math.round((completed / total) * 100);
  };

  const getStepProgressClass = () => {
    const pct = getCurrentStepProgress();
    if (pct === 0) return 'step-chip step-0';
    if (pct < 35) return 'step-chip step-25';
    if (pct < 65) return 'step-chip step-50';
    if (pct < 100) return 'step-chip step-75';
    return 'step-chip step-100';
  };

  return (
    <div className="manage-project-modal-overlay">
      <div className="manage-project-modal-content">
        <header className="modal-header">
          <h2 className="modal-title">Admin Project View</h2>
          <div className={getStatusClass(status)}>Status: {status}</div>

          <div className={getStepProgressClass()}>
            Current Step: {currentStepName}
          </div>
          <div className="total-time-wrapper">
            <span className="total-time-label">Total Time Spent:</span>
            <span className="total-time-value">
              {formatFullTime(calculateProjectTotalTime())}
            </span>
            <button onClick={onClose} className="close-modal-btn">
              &times;
            </button>
          </div>
        </header>
        <div className="modal-body">
          <aside className="sidebar">
            <button
              className={selectedTab === 'details' ? 'active' : ''}
              onClick={() => setSelectedTab('details')}
            >
              📝 Overview
            </button>

            {buildPhases.map((phase, idx) => {
              const isUnlocked = buildPhases
                .slice(0, idx)
                .every((prev) => isStepComplete(prev.key));
              const isLocked = !isUnlocked;
              const isActive = selectedTab === phase.key;

              return (
                <button
                  key={phase.key}
                  className={`${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                  onClick={() => setSelectedTab(phase.key)}
                  title={isLocked ? 'Complete the previous step to unlock' : ''}
                >
                  {isStepComplete(phase.key) ? '✅ ' : isLocked ? '🔒 ' : ''}
                  {phase.label}
                </button>
              );
            })}
          </aside>
          <main>{renderContent()}</main>
        </div>
      </div>
      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowSnackbar(false)}
        message="Changes saved"
      />
    </div>
  );
};

export default ManageProjectModal;
