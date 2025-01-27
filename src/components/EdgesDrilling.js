import React from "react";
import BearingEdges from "./BearingEdges";
import SnareBedCutting from "./SnareBedCutting";
import HardwareDrilling from "./HardwareDrilling";

const EdgesDrilling = ({ data, onChange, onToggleChecklist, onSaveNotes, onUpdateTimestamp }) => {
  return (
    <div>
      <h3>Edges & Drilling</h3>
      <BearingEdges
        stepData={data.bearingEdges}
        onToggleChecklist={onToggleChecklist}
        onSaveNotes={onSaveNotes}
        onUpdateTimestamp={onUpdateTimestamp}
      />
      <SnareBedCutting
        stepData={data.snareBedCutting}
        onToggleChecklist={onToggleChecklist}
        onSaveNotes={onSaveNotes}
        onUpdateTimestamp={onUpdateTimestamp}
      />
      <HardwareDrilling
        stepData={data.hardwareDrilling}
        onToggleChecklist={onToggleChecklist}
        onSaveNotes={onSaveNotes}
        onUpdateTimestamp={onUpdateTimestamp}
      />
    </div>
  );
};

export default EdgesDrilling;