import React, { useState, useEffect } from 'react';
import {
  collection,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import ManageProjectModal from './ManageProjectModal';
import './ManageProjects.css';

const buildPhases = [
  'Step 1. Wood Preparation',
  'Step 2. Shell Construction',
  'Step 3. Fine-Tuning',
  'Step 4. Shell Exterior Finish',
  'Step 5. Bearing Edges',
  'Step 6. Snare Bed Cutting',
  'Step 7. Hardware Drilling',
  'Step 8. Hardware Assembly',
  'Step 9. Tuning and Detailing',
  'Step 10. Quality Check',
];

const stepWeights = {
  woodPreparation: 0.05,
  shellConstruction: 0.2,
  fineTuning: 0.1,
  shellExteriorFinish: 0.2,
  bearingEdges: 0.1,
  snareBedCutting: 0.1,
  hardwareDrilling: 0.1,
  hardwareAssembly: 0.05,
  tuningAndDetailing: 0.05,
  qualityCheck: 0.05,
};

const normalize = (str) =>
  str?.toLowerCase().replace(/[^a-z0-9 ]/gi, '').replace(/\s+/g, ' ').trim() || '';

const ManageProjects = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [filter, setFilter] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    let date;
    if (timestamp?.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Invalid';
    } else {
      return 'Invalid';
    }
    return date.toLocaleDateString();
  };

  const formatTargetCompletion = (timestamp) => {
    if (!timestamp) return 'N/A';
    let date;
    if (timestamp?.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Invalid';
    } else {
      return 'Invalid';
    }
    date.setDate(date.getDate() + 35);
    return date.toLocaleDateString();
  };

  const isOverdue = (project) => {
    const phaseIndex = buildPhases.indexOf(project.currentPhase);
    if (!project.startDate?.seconds) return false;
    const phaseStartDate = new Date(project.startDate.seconds * 1000);
    phaseStartDate.setDate(phaseStartDate.getDate() + phaseIndex * 2);
    return new Date() > phaseStartDate;
  };

  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('startDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveProjects = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProjects(liveProjects);
      setFilteredProjects(() => {
        if (!filter) return liveProjects;
        return liveProjects.filter(
          (p) =>
            normalize(p.currentPhase) === filter ||
            (normalize(filter) === 'overdue' && isOverdue(p))
        );
      });
    });
    return () => unsubscribe();
  }, [filter]);

  useEffect(() => {
    if (filter) {
      setFilteredProjects(
        projects.filter(
          (p) =>
            normalize(p.currentPhase) === filter||
            (normalize(filter) === 'overdue' && isOverdue(p))
        )
      );
    } else {
      setFilteredProjects(projects);
    }
  }, [filter, projects]);

  const openModal = (project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedProject(null);
    setIsModalOpen(false);
  };

  const handleSave = async (updatedData) => {
    if (!selectedProject) return;
    const projectRef = doc(db, 'projects', selectedProject.id);
    await updateDoc(projectRef, updatedData);
    const updated = { ...selectedProject, ...updatedData };
    handleLiveUpdate(updated);
    closeModal();
  };

  const handleLiveUpdate = (updatedProject) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
    setFilteredProjects((prev) =>
      prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
    setSelectedProject((prev) =>
      prev?.id === updatedProject.id ? updatedProject : prev
    );
  };

  const calculateProjectProgress = (project) => {
    let total = 0;
    for (const [key, weight] of Object.entries(stepWeights)) {
      const checklist = project[key]?.checklist;
      if (!checklist?.length) continue;
      const completed = checklist.filter((item) => item.completed).length;
      total += (completed / checklist.length) * weight;
    }
    return Math.round(total * 100);
  };

  const calculateTotalProjectTime = (project) => {
    let total = 0;
    Object.keys(stepWeights).forEach((key) => {
      const step = project[key];
      if (step?.checklist?.length) {
        step.checklist.forEach((item) => {
          const val = item.totalSeconds;
          if (typeof val === 'number') total += val;
          else if (val?.seconds && typeof val.seconds === 'number')
            total += val.seconds;
        });
      }
    });
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div className="manage-projects">
      <h2>Manage Projects</h2>
      <div className="filters">
        <label>
          Filter by Phase:
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All Phases</option>
            {buildPhases.map((phase) => (
  <option key={phase} value={normalize(phase)}>
    {phase}
  </option>
))}
            <option value="overdue">Overdue</option>
          </select>
        </label>
      </div>

      <table className="projects-table">
        <thead>
          <tr>
            <th>Project ID</th>
            <th>Customer Name</th>
            <th>Created At</th>
            <th>Target Completion</th>
            <th>Total Time Spent</th>
            <th>Current Phase</th>
            <th>Progress</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredProjects.map((project) => (
            <tr key={project.id} onClick={() => openModal(project)}>
            {(() => {
  try {
    const time = calculateTotalProjectTime(project);
    console.log('🧪 Project Time for:', project.id, time);
    return <td>{time}</td>;
  } catch (err) {
    console.error('❌ Error in time calc for:', project.id, err);
    return <td>Error</td>;
  }
})()}
              <td>{project.id}</td>
              <td>{project.customerName || 'N/A'}</td>
              <td>{formatDate(project.startDate)}</td>
              <td>{formatTargetCompletion(project.startDate)}</td>
              <td>{calculateTotalProjectTime(project)}</td>
              <td>{project.currentPhase}</td>
              <td>
                <div className="project-progress-bar">
                  <div className="progress-bar-wrapper">
                    <div className="progress-bar-track">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${calculateProjectProgress(project)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="progress-percent">
                    {calculateProjectProgress(project)}%
                  </span>
                </div>
              </td>
              <td>{isOverdue(project) ? 'Overdue' : 'On Track'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <ManageProjectModal
          isOpen={isModalOpen}
          onClose={closeModal}
          projectData={selectedProject}
          onSave={handleSave}
          onProjectUpdate={handleLiveUpdate}
        />
      )}
    </div>
  );
};

export default ManageProjects;
