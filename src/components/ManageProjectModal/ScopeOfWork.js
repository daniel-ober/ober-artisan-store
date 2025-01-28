import React, { useState } from "react";

const ScopeOfWork = ({
  scopeData,
  handleChange,
  isEditing,
  onSave,
  onEditToggle,
  onCancel,
  woodSpeciesOptions,
}) => {
  const [localData, setLocalData] = useState(scopeData);

  const handleLocalChange = (field, value) => {
    setLocalData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveClick = () => {
    Object.keys(localData).forEach((key) => {
      handleChange(key, localData[key]);
    });
    onSave();
  };

  const handleCancelClick = () => {
    setLocalData(scopeData); // Reset local data to original state
    onCancel();
  };

  return (
    <div className="scope-of-work-container">
      <h3>Scope of Work</h3>
      <div className="scope-of-work">
        <p>
          <strong>Artisan Line:</strong>{" "}
          {isEditing ? (
            <select
              value={localData?.artisanLine || ""}
              onChange={(e) => handleLocalChange("artisanLine", e.target.value)}
            >
              <option value="">Select Artisan Line</option>
              <option value="Heritage">Heritage</option>
              <option value="Heritage+">Heritage+</option>
              <option value="FEUZON">FEUZON</option>
              <option value="ONE">ONE</option>
              <option value="DREAMFEATHER">DREAMFEATHER</option>
              <option value="Custom Shop">Custom Shop</option>
            </select>
          ) : (
            scopeData?.artisanLine || "N/A"
          )}
        </p>
        <p>
          <strong>Shell Depth:</strong>{" "}
          {isEditing ? (
            <select
              value={localData?.shellDepth || ""}
              onChange={(e) => handleLocalChange("shellDepth", e.target.value)}
            >
              {[...Array(18).keys()].map((i) => (
                <option key={i + 3} value={`${i + 3}"`}>
                  {i + 3}&quot;
                </option>
              ))}
            </select>
          ) : (
            scopeData?.shellDepth || "N/A"
          )}
        </p>
        <p>
          <strong>Width:</strong>{" "}
          {isEditing ? (
            <select
              value={localData?.width || ""}
              onChange={(e) => handleLocalChange("width", e.target.value)}
            >
              {[...Array(19).keys()].map((i) => (
                <option key={i + 6} value={`${i + 6}"`}>
                  {i + 6}&quot;
                </option>
              ))}
            </select>
          ) : (
            scopeData?.width || "N/A"
          )}
        </p>
        <p>
          <strong>Weight:</strong>{" "}
          {isEditing ? (
            <input
              type="text"
              value={localData?.weight || ""}
              onChange={(e) => handleLocalChange("weight", e.target.value)}
            />
          ) : (
            scopeData?.weight || "N/A"
          )}
        </p>
        <p>
          <strong>Thickness:</strong>{" "}
          {isEditing ? (
            <input
              type="text"
              value={localData?.thickness || ""}
              onChange={(e) => handleLocalChange("thickness", e.target.value)}
            />
          ) : (
            scopeData?.thickness || "N/A"
          )}
        </p>
        <p>
          <strong>Bearing Edge:</strong>{" "}
          {isEditing ? (
            <select
              value={localData?.bearingEdge || ""}
              onChange={(e) => handleLocalChange("bearingEdge", e.target.value)}
            >
              <option value="">Select Edge</option>
              <option value="30 degrees">30 degrees</option>
              <option value="45 degrees">45 degrees</option>
              <option value="60 degrees">60 degrees</option>
              <option value="Round Over">Round Over</option>
              <option value="Double 45 degrees">Double 45 degrees</option>
              <option value="Other">Other</option>
            </select>
          ) : (
            scopeData?.bearingEdge || "N/A"
          )}
        </p>
        <p>
          <strong>Wood Species:</strong>{" "}
          {isEditing ? (
            <select
              value={localData?.woodSpecies || ""}
              onChange={(e) => handleLocalChange("woodSpecies", e.target.value)}
            >
              {woodSpeciesOptions.map((wood) => (
                <option key={wood} value={wood}>
                  {wood}
                </option>
              ))}
            </select>
          ) : (
            scopeData?.woodSpecies || "N/A"
          )}
        </p>
        <p>
          <strong>Custom Wood Species:</strong>{" "}
          {isEditing ? (
            <input
              type="text"
              value={localData?.customWoodSpecies || ""}
              onChange={(e) =>
                handleLocalChange("customWoodSpecies", e.target.value)
              }
            />
          ) : (
            scopeData?.customWoodSpecies || "N/A"
          )}
        </p>
        <p>
          <strong>Artisan Comments:</strong>{" "}
          {isEditing ? (
            <textarea
              value={localData?.artisanComments || ""}
              onChange={(e) =>
                handleLocalChange("artisanComments", e.target.value)
              }
              rows="4"
              style={{ width: "100%" }}
            />
          ) : (
            scopeData?.artisanComments || "N/A"
          )}
        </p>
      </div>
      <div className="edit-controls">
        {isEditing ? (
          <>
            <button className="save-button" onClick={handleSaveClick}>
              Save
            </button>
            <button className="cancel-button" onClick={handleCancelClick}>
              Cancel
            </button>
          </>
        ) : (
          <button className="edit-button" onClick={onEditToggle}>
            Edit
          </button>
        )}
      </div>
    </div>
  );
};

export default ScopeOfWork;