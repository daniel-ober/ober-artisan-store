import React, { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import ManageProjectModal from "./ManageProjectModal";
import "./ManageProjects.css";

const buildPhases = [
  "Step 1. Wood Preparation",
  "Step 2. Shell Construction",
  "Step 3. Fine-Tuning",
  "Step 4. Shell Exterior Finish",
  "Step 5. Bearing Edges",
  "Step 6. Snare Bed Cutting",
  "Step 7. Hardware Drilling",
  "Step 8. Hardware Assembly",
  "Step 9. Tuning and Detailing",
  "Step 10. Quality Check",
];

const ManageProjects = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [filter, setFilter] = useState(""); // Filter for build phases
  const [selectedProject, setSelectedProject] = useState(null); // Selected project for modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch projects from Firestore
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsCollection = collection(db, "projects");
        const projectsSnapshot = await getDocs(projectsCollection);
        const projectsList = projectsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setProjects(projectsList);
        setFilteredProjects(projectsList);
      } catch (error) {
        console.error("Error fetching projects:", error);
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
            (filter === "Overdue" && isOverdue(project))
        )
      );
    } else {
      setFilteredProjects(projects);
    }
  }, [filter, projects]);

  // Check if a project is overdue
  const isOverdue = (project) => {
    const phaseIndex = buildPhases.indexOf(project.currentPhase);
    const phaseStartDate = new Date(project.startDate.seconds * 1000); // Convert Firestore timestamp
    phaseStartDate.setDate(phaseStartDate.getDate() + phaseIndex * 2); // Assume 2 days per phase
    return new Date() > phaseStartDate;
  };

  // Open the modal for a specific project
  const openModal = (project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  // Close the modal
  const closeModal = () => {
    setSelectedProject(null);
    setIsModalOpen(false);
  };

  // Handle save updates in the modal
  const handleSave = async (updatedData) => {
    try {
      if (!selectedProject) return;

      const projectRef = doc(db, "projects", selectedProject.id);
      await updateDoc(projectRef, updatedData);

      // Update state with the new data
      setProjects((prev) =>
        prev.map((project) =>
          project.id === selectedProject.id ? { ...project, ...updatedData } : project
        )
      );

      // Close the modal after saving
      closeModal();
    } catch (error) {
      console.error("Error saving project updates:", error);
    }
  };

  return (
    <div className="manage-projects">
      <h2>Manage Projects</h2>

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
            <th>Project ID</th>
            <th>Customer Name</th>
            <th>Current Phase</th>
            <th>Progress</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredProjects.map((project) => {
            const phaseIndex = buildPhases.indexOf(project.currentPhase);
            const progress = ((phaseIndex + 1) / buildPhases.length) * 100;

            return (
              <tr key={project.id} onClick={() => openModal(project)}>
                <td>{project.id}</td>
                <td>{project.customerName || "N/A"}</td>
                <td>{project.currentPhase}</td>
                <td>
                  <div className="progress-bar">
                    <div
                      className="progress"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </td>
                <td>{isOverdue(project) ? "Overdue" : "On Track"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Project Modal */}
      {isModalOpen && (
        <ManageProjectModal
          isOpen={isModalOpen}
          onClose={closeModal}
          projectData={selectedProject}
          onSave={handleSave} // Pass the save handler to the modal
        />
      )}
    </div>
  );
};

export default ManageProjects;