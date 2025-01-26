import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './InProduction.css';

const buildPhases = [
  "In Production - Step 1. Wood Preparation",
  "In Production - Step 2. Shell Construction",
  "In Production - Step 3. Fine-Tuning",
  "In Production - Step 4. Shell Exterior Finish",
  "In Production - Step 5. Bearing Edge Cutting",
  "In Production - Step 6. Snare Bed Cutting",
  "In Production - Step 7. Hardware Drilling",
  "In Production - Step 8. Hardware Assembly",
  "In Production - Step 9. Tuning and Detailing",
  "In Production - Step 10. Thorough Quality Check",
];

const InProduction = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [filter, setFilter] = useState(''); // Filter for build phases or overdue

  // Fetch projects from Firestore
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const ordersCollection = collection(db, 'orders');
        const ordersSnapshot = await getDocs(ordersCollection);
        const ordersList = ordersSnapshot.docs
          .map((docSnapshot) => {
            const data = docSnapshot.data();
            return {
              id: docSnapshot.id,
              ...data,
              startDate: data.startDate ? new Date(data.startDate.seconds * 1000) : null,
              currentPhase: data.currentPhase || buildPhases[0],
              notes: data.notes || [],
            };
          })
          .filter((order) => buildPhases.includes(order.currentPhase)); // Filter by "In Production" phases

        setProjects(ordersList);
        setFilteredProjects(ordersList);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, []);

  // Filter projects dynamically
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

  // Check if a project is overdue
  const isOverdue = (project) => {
    const phaseIndex = buildPhases.indexOf(project.currentPhase);
    const phaseStartDate = new Date(project.startDate);
    phaseStartDate.setDate(phaseStartDate.getDate() + phaseIndex * 2); // Assuming 2 days per phase
    return new Date() > phaseStartDate;
  };

  // Update project phase
  const updatePhase = async (projectId, newPhase) => {
    try {
      const projectRef = doc(db, 'orders', projectId);
      await updateDoc(projectRef, { currentPhase: newPhase });

      setProjects((prev) =>
        prev.map((project) =>
          project.id === projectId ? { ...project, currentPhase: newPhase } : project
        )
      );
    } catch (error) {
      console.error('Error updating project phase:', error);
    }
  };

  return (
    <div className="in-production">
      <h2>In Production Tracker</h2>

      {/* Filters */}
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

      {/* Projects Table */}
      <table className="projects-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Current Phase</th>
            <th>Progress</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredProjects.map((project) => {
            const phaseIndex = buildPhases.indexOf(project.currentPhase);
            const progress = ((phaseIndex + 1) / buildPhases.length) * 100;

            return (
              <tr key={project.id}>
                <td>{project.name || `${project.id}`}</td>
                <td>{project.currentPhase}</td>
                <td>
                  <div className="progress-bar">
                    <div
                      className="progress"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </td>
                <td>{isOverdue(project) ? 'Overdue' : 'On Track'}</td>
                <td>
                  <select
                    value={project.currentPhase}
                    onChange={(e) => updatePhase(project.id, e.target.value)}
                  >
                    {buildPhases.map((phase) => (
                      <option key={phase} value={phase}>
                        {phase}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default InProduction;