import React from "react";

const ProjectDetails = ({ data, handleChange, isEditing, handleSave, onEditToggle }) => {
  const determineStatus = () => {
    const today = new Date();
    const startDate = new Date(data.startDate || null);
    const completionDate = new Date(data.targetCompletion || null);

    if (completionDate && today > completionDate) return { text: "Overdue", color: "red" };
    if (completionDate && today > new Date(completionDate.setDate(completionDate.getDate() - 7))) return { text: "Nearing Overdue", color: "yellow" };
    return { text: "On Track", color: "green" };
  };

  const { text: statusText, color: statusColor } = determineStatus();

  return (
    <div className="project-details-container">
      <h3>Project Details</h3>
      <div className="project-details">
        <p>
          <strong>Project ID:</strong> {data?.id || "N/A"}
        </p>
        <p>
          <strong>Order ID:</strong>{" "}
          {isEditing ? (
            <input
              type="text"
              value={data?.orderId || ""}
              onChange={(e) => handleChange("orderId", e.target.value)}
            />
          ) : (
            data?.orderId || "N/A"
          )}
        </p>
        <p>
          <strong>Project Start Date:</strong>{" "}
          {isEditing ? (
            <input
              type="date"
              value={data?.startDate || ""}
              onChange={(e) => handleChange("startDate", e.target.value)}
            />
          ) : (
            data?.startDate || "N/A"
          )}
        </p>
        <p>
          <strong>Target Completion:</strong>{" "}
          {isEditing ? (
            <input
              type="date"
              value={data?.targetCompletion || ""}
              onChange={(e) => handleChange("targetCompletion", e.target.value)}
            />
          ) : (
            data?.targetCompletion || "N/A"
          )}
        </p>
        <p>
          <strong>Current Phase:</strong>{" "}
          {isEditing ? (
            <input
              type="text"
              value={data?.currentPhase || ""}
              onChange={(e) => handleChange("currentPhase", e.target.value)}
            />
          ) : (
            data?.currentPhase || "N/A"
          )}
        </p>
        <p>
          <strong>Status:</strong>{" "}
          <span className="status-indicator">
            <span
              className="status-dot"
              style={{ backgroundColor: statusColor }}
            ></span>
            {statusText}
          </span>
        </p>
      </div>
      {isEditing ? (
        <>
          <button className="save-button" onClick={handleSave}>
            Save
          </button>
          <button className="cancel-button" onClick={onEditToggle}>
            Cancel
          </button>
        </>
      ) : (
        <button className="edit-button" onClick={onEditToggle}>
          Edit
        </button>
      )}
    </div>
  );
};

export default ProjectDetails;