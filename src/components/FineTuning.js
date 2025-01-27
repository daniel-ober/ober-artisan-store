import React from "react";

const FineTuning = ({ stepData, onToggleChecklist, onSaveNotes, onUpdateTimestamp }) => {
  return (
    <div>
      <h3>Fine Tuning</h3>

      {/* Timestamp */}
      <div className="step-timestamps">
        <button
          onClick={() => onUpdateTimestamp("fineTuning", "start")}
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
          onClick={() => onUpdateTimestamp("fineTuning", "complete")}
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
          Notes:
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

export default FineTuning;