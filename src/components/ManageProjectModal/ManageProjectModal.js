import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Sidebar from "./Sidebar";
import ProjectDetails from "./ProjectDetails";
import ScopeOfWork from "./ScopeOfWork";
import CustomerDetails from "./CustomerDetails";
import FileUploader from "./FileUploader";
import { db } from "../../firebaseConfig";
import "./ManageProjectModal.css";

const ManageProjectModal = ({ isOpen, onClose, projectData }) => {
  const [editableData, setEditableData] = useState({});
  const [customerData, setCustomerData] = useState({});
  const [isEditingProjectDetails, setIsEditingProjectDetails] = useState(false);
  const [isEditingScopeOfWork, setIsEditingScopeOfWork] = useState(false);
  const [isEditingCustomerDetails, setIsEditingCustomerDetails] = useState(false);

  // Load project and customer data
  useEffect(() => {
    if (projectData) {
      setEditableData({
        ...projectData,
        woodPreparation: projectData?.woodPreparation || {
          checklist: [],
          notes: "",
          startTime: null,
          completeTime: null,
        },
      });

      const fetchCustomerDetails = async () => {
        try {
          const ordersRef = doc(db, "orders", projectData.orderId);
          const orderSnapshot = await getDoc(ordersRef);

          if (orderSnapshot.exists()) {
            const orderData = orderSnapshot.data();
            setCustomerData({
              userId: orderData.userId || "Guest",
              customerName: orderData.customerName || "N/A",
              customerEmail: orderData.customerEmail || "N/A",
              customerPhone: orderData.customerPhone || "N/A",
              customerAddress: orderData.customerAddress || "N/A",
              notes: projectData.notes || "",
            });
          } else {
            console.error("No matching order found.");
          }
        } catch (error) {
          console.error("Error fetching customer details:", error);
        }
      };

      fetchCustomerDetails();
    }
  }, [projectData]);

  // Save updated data to Firestore
  const saveToFirestore = async () => {
    try {
      const projectRef = doc(db, "projects", editableData.id);
      await updateDoc(projectRef, editableData);

      console.log("Project updated successfully!");
    } catch (error) {
      console.error("Error updating project:", error);
    }
  };

  const handleProjectDetailsSave = () => {
    setIsEditingProjectDetails(false);
    saveToFirestore();
  };

  const handleScopeOfWorkSave = () => {
    setIsEditingScopeOfWork(false);
    saveToFirestore();
  };

  const handleCustomerDetailsSave = () => {
    setIsEditingCustomerDetails(false);
    saveToFirestore();
  };

  const handleProjectDetailsCancel = () => {
    setIsEditingProjectDetails(false);
  };

  const handleScopeOfWorkCancel = () => {
    setIsEditingScopeOfWork(false);
  };

  const handleCustomerDetailsCancel = () => {
    setIsEditingCustomerDetails(false);
  };

  const handleChange = (field, value) => {
    setEditableData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCustomerChange = (field, value) => {
    setCustomerData((prev) => ({
      ...prev,
      [field]: value,
    }));
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
          <Sidebar />
          <main>
            <div className="overview-details">
              {/* Project Details Section */}
              <ProjectDetails
                data={editableData}
                handleChange={handleChange}
                isEditing={isEditingProjectDetails}
                onSave={handleProjectDetailsSave}
                onEditToggle={() =>
                  setIsEditingProjectDetails(!isEditingProjectDetails)
                }
                onCancel={handleProjectDetailsCancel}
              />

              {/* Scope of Work Section */}
              <ScopeOfWork
                scopeData={editableData}
                handleChange={handleChange}
                isEditing={isEditingScopeOfWork}
                onSave={handleScopeOfWorkSave}
                onEditToggle={() =>
                  setIsEditingScopeOfWork(!isEditingScopeOfWork)
                }
                onCancel={handleScopeOfWorkCancel}
                woodSpeciesOptions={[
                  "Ash",
                  "Beech",
                  "Birch",
                  "Bubinga",
                  "Cherry",
                  "Jatoba",
                  "Kapur",
                  "Leopardwood",
                  "Mahogany",
                  "Mango",
                  "Maple",
                  "Oak",
                  "Padauk",
                  "Poplar",
                  "Purpleheart",
                  "Sapele",
                  "Walnut",
                  "Other",
                ]}
              />
            </div>

            {/* Customer Details Section */}
            <CustomerDetails
              customerData={customerData}
              handleChange={handleCustomerChange}
              isEditing={isEditingCustomerDetails}
              onSave={handleCustomerDetailsSave}
              onEditToggle={() =>
                setIsEditingCustomerDetails(!isEditingCustomerDetails)
              }
              onCancel={handleCustomerDetailsCancel}
            />

            {/* FileUploader Section */}
            <FileUploader projectId={editableData.id} />
          </main>
        </div>
      </div>
    </div>
  );
};

export default ManageProjectModal;