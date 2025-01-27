import React from "react";

const HardwareAssembly = ({ stepData, onToggleChecklist, onSaveNotes, onUpdateTimestamp }) => {
  return (
    <div>
      <h4>Hardware Assembly</h4>

      {/* Timestamps */}
      <div className="step-timestamps">
        <button
          onClick={() => onUpdateTimestamp("hardwareAssembly", "start")}
          disabled={stepData?.startTime}
        >
          Start
        </button>
        <span>
          {stepData?.startTime
            ? `Start: ${new Date(stepData.startTime).toLocaleString()}`
            : "-"}
        </span>
        <button
          onClick={() => onUpdateTimestamp("hardwareAssembly", "complete")}
          disabled={!stepData?.startTime || stepData?.completeTime}
        >
          Complete
        </button>
        <span>
          {stepData?.completeTime
            ? `Complete: ${new Date(stepData.completeTime).toLocaleString()}`
            : "-"}
        </span>
      </div>

      {/* Checklist */}
      <ul className="checklist">
        {stepData?.checklist?.map((item, index) => (
          <li key={index}>
            <label>
              <input
                type="checkbox"
                checked={item?.completed || false}
                onChange={() => onToggleChecklist(index)}
              />
              {item?.task || "Task"}
            </label>
          </li>
        ))}
      </ul>

      {/* Notes */}
      <div className="artisan-notes">
        <label>
          Assembly Notes:
          <textarea
            value={stepData?.notes || ""}
            onChange={(e) => onSaveNotes(e.target.value)}
            placeholder="Enter notes here..."
          />
        </label>
      </div>
    </div>
  );
};

export default HardwareAssembly;