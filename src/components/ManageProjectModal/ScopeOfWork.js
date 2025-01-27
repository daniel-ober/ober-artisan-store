import React from "react";

const ScopeOfWork = ({ scopeData, handleChange, isEditing, woodSpeciesOptions }) => {
  return (
    <div className="scope-of-work-container">
      <h3>Scope of Work</h3>
      <div className="scope-of-work">
        <p>
          <strong>Artisan Line:</strong>{" "}
          {isEditing ? (
            <select
              value={scopeData?.artisanLine || ""}
              onChange={(e) => handleChange("artisanLine", e.target.value)}
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
              value={scopeData?.shellDepth || ""}
              onChange={(e) => handleChange("shellDepth", e.target.value)}
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
              value={scopeData?.width || ""}
              onChange={(e) => handleChange("width", e.target.value)}
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
              value={scopeData?.weight || ""}
              onChange={(e) => handleChange("weight", e.target.value)}
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
              value={scopeData?.thickness || ""}
              onChange={(e) => handleChange("thickness", e.target.value)}
            />
          ) : (
            scopeData?.thickness || "N/A"
          )}
        </p>
        <p>
          <strong>Bearing Edge:</strong>{" "}
          {isEditing ? (
            <select
              value={scopeData?.bearingEdge || ""}
              onChange={(e) => handleChange("bearingEdge", e.target.value)}
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
              value={scopeData?.woodSpecies || ""}
              onChange={(e) => handleChange("woodSpecies", e.target.value)}
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
              value={scopeData?.customWoodSpecies || ""}
              onChange={(e) => handleChange("customWoodSpecies", e.target.value)}
            />
          ) : (
            scopeData?.customWoodSpecies || "N/A"
          )}
        </p>
        {/* Artisan Comments Section */}
        <p>
          <strong>Artisan Comments:</strong>{" "}
          {isEditing ? (
            <textarea
              value={scopeData?.artisanComments || ""}
              onChange={(e) => handleChange("artisanComments", e.target.value)}
              rows="4"
              style={{ width: "100%" }}
            />
          ) : (
            scopeData?.artisanComments || "N/A"
          )}
        </p>
      </div>
    </div>
  );
};

export default ScopeOfWork;