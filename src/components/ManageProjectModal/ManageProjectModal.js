import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Sidebar from "./Sidebar";
import ProjectDetails from "./ProjectDetails";
import ScopeOfWork from "./ScopeOfWork";
import CustomerDetails from "./CustomerDetails";
import FileUploader from "./FileUploader";
import Step1WoodPreparation from "./Step1WoodPreparation";
import { db } from "../../firebaseConfig";
import "./ManageProjectModal.css";

const ManageProjectModal = ({ isOpen, onClose, projectData }) => {
  const [editableData, setEditableData] = useState({});
  const [customerData, setCustomerData] = useState({});
  const [selectedTab, setSelectedTab] = useState("overview"); // Default tab
  const [isEditingProjectDetails, setIsEditingProjectDetails] = useState(false);
  const [isEditingScopeOfWork, setIsEditingScopeOfWork] = useState(false);
  const [isEditingCustomerDetails, setIsEditingCustomerDetails] = useState(false);

  useEffect(() => {
    if (projectData) {
      console.log("Project Data:", projectData); // Debugging
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

  const saveToFirestore = async (updatedData = {}) => {
    try {
      const projectRef = doc(db, "projects", editableData.id);
      const dataToSave = {
        ...editableData,
        ...updatedData,
      };
      await updateDoc(projectRef, dataToSave);

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

  console.log("Current Tab:", selectedTab); // Debugging
  console.log("Customer Data:", customerData); // Debugging

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
          {/* Sidebar with tab switching */}
          <Sidebar selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
          <main>
            {/* Conditional rendering based on selectedTab */}
            {selectedTab === "overview" && (
              <>
                <div className="overview-details">
                  <ProjectDetails
                    data={editableData}
                    handleChange={handleChange}
                    isEditing={isEditingProjectDetails}
                    onSave={handleProjectDetailsSave}
                    onCancel={() => setIsEditingProjectDetails(false)}
                    onEditToggle={() =>
                      setIsEditingProjectDetails(!isEditingProjectDetails)
                    }
                  />
                  <ScopeOfWork
                    scopeData={editableData}
                    handleChange={handleChange}
                    isEditing={isEditingScopeOfWork}
                    onSave={handleScopeOfWorkSave}
                    onCancel={() => setIsEditingScopeOfWork(false)}
                    onEditToggle={() =>
                      setIsEditingScopeOfWork(!isEditingScopeOfWork)
                    }
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
                <CustomerDetails
                  customerData={customerData}
                  handleChange={handleCustomerChange}
                  isEditing={isEditingCustomerDetails}
                  onSave={handleCustomerDetailsSave}
                  onCancel={() => setIsEditingCustomerDetails(false)}
                  onEditToggle={() =>
                    setIsEditingCustomerDetails(!isEditingCustomerDetails)
                  }
                />
                {/* Include FileUploader under the Overview tab */}
                <FileUploader projectId={editableData.id} />
              </>
            )}
            {selectedTab === "Step 1. Wood Preparation" && (
              <Step1WoodPreparation
                stepData={editableData.woodPreparation}
                relatedData={{
                  woodSpecies: editableData.woodSpecies,
                  thickness: editableData.thickness,
                  bearingEdge: editableData.bearingEdge,
                }}
                onToggleChecklist={(field, value) =>
                  setEditableData((prev) => ({
                    ...prev,
                    woodPreparation: {
                      ...prev.woodPreparation,
                      [field]: value,
                    },
                  }))
                }
                onStart={(startTime) => {
                  setEditableData((prev) => ({
                    ...prev,
                    woodPreparation: {
                      ...prev.woodPreparation,
                      startTime,
                    },
                  }));
                  saveToFirestore({ woodPreparation: { ...editableData.woodPreparation, startTime } });
                }}
                onComplete={(completeTime) => {
                  setEditableData((prev) => ({
                    ...prev,
                    woodPreparation: {
                      ...prev.woodPreparation,
                      completeTime,
                    },
                  }));
                  saveToFirestore({ woodPreparation: { ...editableData.woodPreparation, completeTime } });
                }}
                onSaveToFirestore={saveToFirestore}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ManageProjectModal;