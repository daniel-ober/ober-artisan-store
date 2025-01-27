import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Sidebar from "./Sidebar";
import TabContent from "./TabContent";
import CustomerDetails from "./CustomerDetails"; // Import the new component
import { db } from "../../firebaseConfig"; // Adjust to your Firebase config file path
import "./ManageProjectModal.css";

const ManageProjectModal = ({ isOpen, onClose, projectData, onSave }) => {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [editableData, setEditableData] = useState({});
  const [customerData, setCustomerData] = useState({});
  const [isEditing, setIsEditing] = useState(false);

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

  const handleEditToggle = () => setIsEditing((prev) => !prev);

  const handleSave = async () => {
    try {
      const projectRef = doc(db, "projects", editableData.id);
      await updateDoc(projectRef, {
        ...editableData,
        customer: customerData,
      });

      console.log("Project updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating project:", error);
    }
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
          <Sidebar selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
          <main>
            {selectedTab === "overview" && (
              <>
                <TabContent
                  selectedTab={selectedTab}
                  editableData={editableData}
                  setEditableData={setEditableData}
                  customerData={customerData}
                  isEditing={isEditing}
                  handleChange={handleChange}
                  handleCustomerChange={handleCustomerChange}
                />
              </>
            )}
            <div className="modal-actions">
              {isEditing ? (
                <button onClick={handleSave} className="save-button">
                  Save
                </button>
              ) : (
                <button onClick={handleEditToggle} className="edit-button">
                  Edit
                </button>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ManageProjectModal;