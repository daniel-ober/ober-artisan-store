import React, { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import ManageProjectModal from './ManageProjectModal'
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

const ManageProjects = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [filter, setFilter] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp instanceof Date) return timestamp.toLocaleString();
    if (timestamp?.seconds)
      return new Date(timestamp.seconds * 1000).toLocaleString();
    return 'Invalid date';
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsCollection = collection(db, 'projects');
        const projectsSnapshot = await getDocs(projectsCollection);
        const projectsList = projectsSnapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
            };
          })
          .sort((a, b) => {
            const getDate = (project) => {
              if (project.startDate?.seconds) return project.startDate.seconds;
              if (project.startDate instanceof Timestamp)
                return project.startDate.toMillis();
              if (project.startDate instanceof Date)
                return project.startDate.getTime();
              return 0;
            };
            return getDate(b) - getDate(a);
          });

        setProjects(projectsList);
        setFilteredProjects(projectsList);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    if (filter) {
      setFilteredProjects(
        projects.filter(
          (project) =>
            project.currentPhase === filter ||
            (filter === 'Overdue' && isOverdue(project))
        )
      );
    } else {
      setFilteredProjects(projects);
    }
  }, [filter, projects]);

  const isOverdue = (project) => {
    const phaseIndex = buildPhases.indexOf(project.currentPhase);
    if (!project.startDate?.seconds) return false;
    const phaseStartDate = new Date(project.startDate.seconds * 1000);
    phaseStartDate.setDate(phaseStartDate.getDate() + phaseIndex * 2);
    return new Date() > phaseStartDate;
  };

  const openModal = (project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedProject(null);
    setIsModalOpen(false);
  };

  const handleSave = async (updatedData) => {
    try {
      if (!selectedProject) return;
      const projectRef = doc(db, 'projects', selectedProject.id);
      await updateDoc(projectRef, updatedData);
      setProjects((prev) =>
        prev.map((p) =>
          p.id === selectedProject.id ? { ...p, ...updatedData } : p
        )
      );
      setFilteredProjects((prev) =>
        prev.map((p) =>
          p.id === selectedProject.id ? { ...p, ...updatedData } : p
        )
      );
      closeModal();
    } catch (error) {
      console.error('Error saving project updates:', error);
    }
  };

  const calculateProjectProgress = (project) => {
    let total = 0;

    for (const [stepKey, weight] of Object.entries(stepWeights)) {
      const checklist = project[stepKey]?.checklist;
      if (!checklist || checklist.length === 0) continue;

      const completedCount = checklist.filter((item) => item.completed).length;
      const percentComplete = completedCount / checklist.length;

      total += percentComplete * weight;
    }

    return Math.round(total * 100); // percent
  };

  const handleLiveUpdate = (partialUpdate) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === partialUpdate.id ? { ...p, ...partialUpdate } : p
      )
    );
    setFilteredProjects((prev) =>
      prev.map((p) =>
        p.id === partialUpdate.id ? { ...p, ...partialUpdate } : p
      )
    );
    setSelectedProject((prev) =>
      prev && prev.id === partialUpdate.id
        ? { ...prev, ...partialUpdate }
        : prev
    );
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
              <option key={phase} value={phase}>
                {phase}
              </option>
            ))}
            <option value="Overdue">Overdue</option>
          </select>
        </label>
      </div>

      <table className="projects-table">
        <thead>
          <tr>
            <th>Project ID</th>
            <th>Customer Name</th>
            <th>Created At</th>
            <th>Current Phase</th>
            <th>Progress</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredProjects.map((project) => {
            const phaseIndex = buildPhases.indexOf(project.currentPhase);
            const progress =
              phaseIndex >= 0
                ? ((phaseIndex + 1) / buildPhases.length) * 100
                : 0;

            const createdAt = formatDate(project.startDate);

            return (
              <tr key={project.id} onClick={() => openModal(project)}>
                <td>{project.id}</td>
                <td>{project.customerName || 'N/A'}</td>
                <td>{createdAt}</td>
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
            );
          })}
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
