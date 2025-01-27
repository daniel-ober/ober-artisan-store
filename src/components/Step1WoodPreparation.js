// import React from "react";
// import "./Step1WoodPreparation.css";

// const Step1WoodPreparation = ({
//   stepData = {}, // Default empty object to avoid null/undefined errors
//   onToggleChecklist,
//   onSaveNotes,
//   onUpdateTimestamp,
// }) => {
//     const handleChecklistToggle = (index) => {
//         onToggleChecklist(index); // Ensure this calls the parent's function
//       };

//   const handleNotesChange = (e) => {
//     onSaveNotes(e.target.value); // Call the parent's function
//   };

//   const handleTimestampUpdate = (type) => {
//     onUpdateTimestamp(type); // Call the parent's function
//   };

//   return (
//     <div className="step-content">
//       <h3>Step 1: Wood Preparation</h3>

//       {/* Start and Complete Buttons */}
//       <div className="step-timestamps">
//         <button
//           onClick={() => handleTimestampUpdate("start")}
//           disabled={!!stepData?.startTime} // Disable if startTime exists
//         >
//           Start
//         </button>
//         <span>
//           {stepData?.startTime
//             ? `Start: ${new Date(stepData.startTime).toLocaleString()}`
//             : "-"}
//         </span>
//         <button
//           onClick={() => handleTimestampUpdate("complete")}
//           disabled={!stepData?.startTime || !!stepData?.completeTime} // Disable if no startTime or completeTime exists
//         >
//           Complete
//         </button>
//         <span>
//           {stepData?.completeTime
//             ? `Complete: ${new Date(stepData.completeTime).toLocaleString()}`
//             : "-"}
//         </span>
//       </div>

//       {/* Checklist */}
//       <ul className="checklist">
//         {(stepData?.checklist || []).map((item, index) => (
//           <li key={index}>
//             <label>
//               <input
//                 type="checkbox"
//                 checked={item?.completed || false}
//                 onChange={() => handleChecklistToggle(index)}
//               />
//               {item?.task || "Unknown Task"}
//             </label>
//           </li>
//         ))}
//       </ul>

//       {/* Artisan Notes */}
//       <div className="artisan-notes">
//         <label>
//           Artisan Notes:
//           <textarea
//             value={stepData?.notes || ""}
//             onChange={handleNotesChange}
//             placeholder="Enter notes here..."
//           />
//         </label>
//       </div>
//     </div>
//   );
// };

// export default Step1WoodPreparation;