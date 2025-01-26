import React, { useState } from "react";
import { collection, addDoc, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebaseConfig";
import "./CreateProjectModal.css";

const CreateProjectModal = ({ orderDetails, onClose, onProjectCreated }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCreateProject = async () => {
    setLoading(true);

    try {
      const projectData = {
        orderId: orderDetails.id,
        customerName: orderDetails.customerName || "N/A",
        startDate: new Date().toISOString(),
        itemDetails: selectedItem || null,
        status: "Not Started",
        phases: [],
        notes: [],
      };

      const projectRef = await addDoc(collection(db, "projects"), projectData);
      const projectId = projectRef.id;

      const orderRef = doc(db, "orders", orderDetails.id);
      await updateDoc(orderRef, {
        relatedProjects: arrayUnion({ projectId, itemName: selectedItem?.name || "Blank Project" }),
      });

      onProjectCreated({ projectId, itemName: selectedItem?.name || "Blank Project" });
      onClose();
      alert(`Project created successfully! Project ID: ${projectId}`);
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Failed to create project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Create Project</h3>

        <h4>Select an Item:</h4>
        <ul>
          {orderDetails.items.map((item, index) => (
            <li key={index}>
              <label>
                <input
                  type="radio"
                  name="selectedItem"
                  value={item.name}
                  onChange={() => setSelectedItem(item)}
                />
                {item.name}
              </label>
            </li>
          ))}
          <li>
            <label>
              <input
                type="radio"
                name="selectedItem"
                onChange={() => setSelectedItem(null)}
              />
              Blank Project
            </label>
          </li>
        </ul>

        <button onClick={handleCreateProject} disabled={loading}>
          {loading ? "Creating..." : "Create Project"}
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default CreateProjectModal;