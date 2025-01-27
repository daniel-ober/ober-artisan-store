import React from "react";
import ProjectDetails from "./ProjectDetails";
import CustomerDetails from "./CustomerDetails";
import Step1WoodPreparation from "./Step1WoodPreparation";

const TabContent = ({
  selectedTab,
  editableData,
  setEditableData,
  customerData,
  handleChange,
  handleCustomerChange,
  isEditing,
}) => {
  if (selectedTab === "overview") {
    return (
      <>
        {/* Pass handleChange to ProjectDetails */}
        <ProjectDetails
          data={editableData}
          handleChange={handleChange}
          isEditing={isEditing}
        />
        {/* Pass handleCustomerChange to CustomerDetails */}
        <CustomerDetails
          customerData={customerData}
          handleChange={handleCustomerChange}
          isEditing={isEditing}
        />
      </>
    );
  }

  if (selectedTab === "Step 1. Wood Preparation") {
    return (
      <Step1WoodPreparation
        stepData={editableData?.woodPreparation || {}}
        onToggleChecklist={(index) =>
          handleChange("woodPreparation.checklist", index)
        }
      />
    );
  }

  return <div>Other tab content...</div>;
};

export default TabContent;