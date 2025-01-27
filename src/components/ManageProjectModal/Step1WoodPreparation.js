import React from "react";

const Step1WoodPreparation = ({ stepData, onToggleChecklist }) => (
  <div>
    <h3>Step 1: Wood Preparation</h3>
    <ul>
      {stepData.checklist?.map((item, index) => (
        <li key={index}>
          <label>
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => onToggleChecklist(index)}
            />
            {item.task}
          </label>
        </li>
      ))}
    </ul>
    <textarea
      placeholder="Notes"
      value={stepData.notes || ""}
      onChange={(e) => onToggleChecklist("notes", e.target.value)}
    />
  </div>
);

export default Step1WoodPreparation;