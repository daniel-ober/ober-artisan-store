// // src/components/ManageProjectModal.js

// import React, { useState, useEffect } from "react";
// import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
// import Step1WoodPreparation from './Step1WoodPreparation';
// import { storage } from "../firebaseConfig";
// import { doc, setDoc } from "firebase/firestore";
// import { db } from "../firebaseConfig";
// import "./ManageProjectModal.css";

// const buildPhases = [
//     { key: "overview", label: "Overview" },
//     { key: "Step 1. Wood Preparation", label: "Step 1. Wood Preparation" },
//     { key: "Step 2. Shell Construction", label: "Step 2. Shell Construction" },
//     { key: "Step 3. Fine-Tuning", label: "Step 3. Fine-Tuning" },
//     { key: "Step 4. Shell Exterior Finish", label: "Step 4. Shell Exterior Finish" },
//     { key: "Step 5. Bearing Edges", label: "Step 5. Bearing Edges" },
//     { key: "Step 6. Snare Bed Cutting", label: "Step 6. Snare Bed Cutting" },
//     { key: "Step 7. Hardware Drilling", label: "Step 7. Hardware Drilling" },
//     { key: "Step 8. Hardware Assembly", label: "Step 8. Hardware Assembly" },
//     { key: "Step 9. Tuning and Detailing", label: "Step 9. Tuning and Detailing" },
//     { key: "Step 10. Quality Check", label: "Step 10. Quality Check" },
//   ];

// const woodSpeciesOptions = [
//   "Ash",
//   "Beech",
//   "Birch",
//   "Bubinga",
//   "Cherry",
//   "Jatoba",
//   "Kapur",
//   "Leopardwood",
//   "Mahogany",
//   "Mango",
//   "Maple",
//   "Oak",
//   "Padauk",
//   "Poplar",
//   "Purpleheart",
//   "Sapele",
//   "Walnut",
//   "Other",
// ];

// const ManageProjectModal = ({ isOpen, onClose, projectData, onSave }) => {
//     const [selectedTab, setSelectedTab] = useState("overview");
//     const [editableData, setEditableData] = useState({});
//     const [highResMockups, setHighResMockups] = useState([]);
//     const [uploadedDocuments, setUploadedDocuments] = useState([]);
//     const [isEditing, setIsEditing] = useState(false);

    
// useEffect(() => {
//   console.log("Initial projectData:", projectData);
//   if (projectData) {
//     const updatedData = {
//       ...projectData,
//       customer: {
//         name: projectData?.customerName || "N/A",
//         email: projectData?.customer?.email || "N/A",
//         phone: projectData?.customer?.phone || "N/A",
//         address: projectData?.customer?.address || {
//           street: "N/A",
//           city: "N/A",
//           state: "N/A",
//           zip: "N/A",
//         },
//       },
//       woodPreparation: projectData?.woodPreparation || {
//         checklist: [
//           { task: "Verify wood species and grade.", completed: false },
//           { task: "Inspect the wood for defects (knots, cracks, warping).", completed: false },
//           { task: "Moisture content testing (ensure wood is within acceptable moisture range).", completed: false },
//           { task: "Measure and cut wood to required dimensions.", completed: false },
//           { task: "Label and sort wood for specific parts (e.g., shell, staves).", completed: false },
//           { task: "Sand and smooth surfaces for bonding or assembly.", completed: false },
//           { task: "Seal or stabilize wood, if required (optional for some projects).", completed: false },
//         ],
//         notes: "",
//         startTime: null,
//         completeTime: null,
//       },
//     };

//     console.log("Updated Editable Data with woodPreparation:", updatedData);
//     setEditableData(updatedData);
//   }
// }, [projectData]);



//   const handleEditToggle = () => {
//     setIsEditing(!isEditing);
//   };

//   const handleChange = (field, value) => {
//     setEditableData((prev) => ({
//       ...prev,
//       [field]: value,
//     }));
//   };

//   const handleFileUpload = async (files, folder) => {
//     const projectId = projectData.id;
//     const uploadPromises = Array.from(files).map((file) => {
//       const storageRef = ref(storage, `projects/${projectId}/${folder}/${file.name}`);
//       return uploadBytesResumable(storageRef, file).then((snapshot) =>
//         getDownloadURL(snapshot.ref)
//       );
//     });

//     return Promise.all(uploadPromises);
//   };

//   const handleMockupUpload = async (e) => {
//     const files = e.target.files;
//     const urls = await handleFileUpload(files, "mockups");
//     setHighResMockups((prev) => [...prev, ...urls]);
//   };

//   const handleDocumentUpload = async (e) => {
//     const files = e.target.files;
//     const urls = await handleFileUpload(files, "documents");
//     setUploadedDocuments((prev) => [...prev, ...urls]);
//   };

//   const handleSave = async () => {
//     try {
//       const projectRef = doc(db, "projects", projectData.id);
//       await setDoc(projectRef, editableData, { merge: true }); // Save entire editableData object to Firestore
//       console.log("Data saved successfully!");
//       setIsEditing(false); // Set editing mode to false after saving
//     } catch (error) {
//       console.error("Error saving data to Firestore:", error);
//     }
//   };

//   const handleChecklistToggle = (stepKey, itemIndex) => {
//     const updatedChecklist = editableData[stepKey]?.checklist.map((item, index) =>
//       index === itemIndex ? { ...item, completed: !item.completed } : item
//     );

//     setEditableData((prev) => ({
//       ...prev,
//       [stepKey]: {
//         ...prev[stepKey],
//         checklist: updatedChecklist,
//       },
//     }));

//     saveData({ [stepKey]: { ...editableData[stepKey], checklist: updatedChecklist } });
//   };
  

//   const handleStepNotes = (stepKey, notes) => {
//     setEditableData((prev) => ({
//       ...prev,
//       [stepKey]: {
//         ...prev[stepKey],
//         notes,
//       },
//     }));
//   };
  
//   const handleStepTimestamp = (stepKey, type) => {
//     const currentTime = new Date().toISOString();

//     setEditableData((prev) => ({
//       ...prev,
//       [stepKey]: {
//         ...prev[stepKey],
//         [`${type}Time`]: currentTime,
//       },
//     }));

//     saveData({ [stepKey]: { ...editableData[stepKey], [`${type}Time`]: currentTime } });
//   };
  
//   const saveData = async (updatedFields) => {
//     try {
//       await setDoc(doc(db, "projects", projectData.id), updatedFields, { merge: true });
//     } catch (error) {
//       console.error("Error saving data:", error);
//     }
//   };


//   if (!isOpen) return null;

//   const renderContent = () => {
//     if (selectedTab === "overview") {
//       return (
//         <>
//           <div className="project-overview-content">
//             <h3>Project Details</h3>
//             <div className="project-details">
//               <p>
//                 <strong>Project ID:</strong> {editableData?.id || "N/A"}
//               </p>
//               <p>
//                 <strong>Parent Order ID:</strong>{" "}
//                 {isEditing ? (
//                   <input
//                     type="text"
//                     value={editableData?.orderId || ""}
//                     onChange={(e) => handleChange("orderId", e.target.value)}
//                   />
//                 ) : (
//                   <a
//                     href={`/orders/${editableData?.orderId}`}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                   >
//                     {editableData?.orderId || "N/A"}
//                   </a>
//                 )}
//               </p>
//               <p>
//                 <strong>Start Date:</strong> {editableData?.startDate || "N/A"}
//               </p>
//               <p>
//                 <strong>Target Completion:</strong>{" "}
//                 {editableData?.targetCompletion || "N/A"}
//               </p>
//             </div>
  
            // <h3>Artisan Notes</h3>
            // <div className="artisan-notes">
            //   <p>
            //     <strong>Artisan Line:</strong>{" "}
            //     {isEditing ? (
            //       <select
            //         value={editableData?.artisanLine || ""}
            //         onChange={(e) => handleChange("artisanLine", e.target.value)}
            //       >
            //         <option value="">Select Artisan Line</option>
            //         <option value="Heritage">Heritage</option>
            //         <option value="Heritage+">Heritage+</option>
            //         <option value="FEUZON">FEUZON</option>
            //         <option value="ONE">ONE</option>
            //         <option value="DREAMFEATHER">DREAMFEATHER</option>
            //         <option value="Custom Shop">Custom Shop</option>
            //       </select>
            //     ) : (
            //       editableData?.artisanLine || "N/A"
            //     )}
            //   </p>
            //   <p>
            //     <strong>Shell Depth:</strong>{" "}
            //     {isEditing ? (
            //       <select
            //         value={editableData?.shellDepth || ""}
            //         onChange={(e) => handleChange("shellDepth", e.target.value)}
            //       >
            //         {[...Array(18).keys()].map((i) => (
            //           <option key={i + 3} value={`${i + 3}"`}>
            //             {i + 3}&quot;
            //           </option>
            //         ))}
            //       </select>
            //     ) : (
            //       editableData?.shellDepth || "N/A"
            //     )}
            //   </p>
            //   <p>
            //     <strong>Width:</strong>{" "}
            //     {isEditing ? (
            //       <select
            //         value={editableData?.width || ""}
            //         onChange={(e) => handleChange("width", e.target.value)}
            //       >
            //         {[...Array(19).keys()].map((i) => (
            //           <option key={i + 6} value={`${i + 6}"`}>
            //             {i + 6}&quot;
            //           </option>
            //         ))}
            //       </select>
            //     ) : (
            //       editableData?.width || "N/A"
            //     )}
            //   </p>
            //   <p>
            //     <strong>Weight:</strong>{" "}
            //     {isEditing ? (
            //       <input
            //         type="text"
            //         value={editableData?.weight || ""}
            //         onChange={(e) => handleChange("weight", e.target.value)}
            //       />
            //     ) : (
            //       editableData?.weight || "N/A"
            //     )}
            //   </p>
            //   <p>
            //     <strong>Thickness:</strong>{" "}
            //     {isEditing ? (
            //       <input
            //         type="text"
            //         value={editableData?.thickness || ""}
            //         onChange={(e) => handleChange("thickness", e.target.value)}
            //       />
            //     ) : (
            //       editableData?.thickness || "N/A"
            //     )}
            //   </p>
            //   <p>
            //     <strong>Bearing Edge:</strong>{" "}
            //     {isEditing ? (
            //       <select
            //         value={editableData?.bearingEdge || ""}
            //         onChange={(e) => handleChange("bearingEdge", e.target.value)}
            //       >
            //         <option value="">Select Edge</option>
            //         <option value="30 degrees">30 degrees</option>
            //         <option value="45 degrees">45 degrees</option>
            //         <option value="60 degrees">60 degrees</option>
            //         <option value="Round Over">Round Over</option>
            //         <option value="Double 45 degrees">Double 45 degrees</option>
            //         <option value="Other">Other</option>
            //       </select>
            //     ) : (
            //       editableData?.bearingEdge || "N/A"
            //     )}
            //   </p>
            //   <p>
            //     <strong>Wood Species:</strong>{" "}
            //     {isEditing ? (
            //       <select
            //         value={editableData?.woodSpecies || ""}
            //         onChange={(e) => handleChange("woodSpecies", e.target.value)}
            //       >
            //         {woodSpeciesOptions.map((wood) => (
            //           <option key={wood} value={wood}>
            //             {wood}
            //           </option>
            //         ))}
            //       </select>
            //     ) : (
            //       editableData?.woodSpecies || "N/A"
            //     )}
            //   </p>
            //   <p>
            //     <strong>Custom Wood Species:</strong>{" "}
            //     {isEditing ? (
            //       <input
            //         type="text"
            //         value={editableData?.customWoodSpecies || ""}
            //         onChange={(e) => handleChange("customWoodSpecies", e.target.value)}
            //       />
            //     ) : (
            //       editableData?.customWoodSpecies || "N/A"
            //     )}
            //   </p>
            // </div>
  
//             <h3>Customer Details</h3>
//             <div className="customer-details">
//               <p>
//                 <strong>Name:</strong>{" "}
//                 {isEditing ? (
//                   <input
//                     type="text"
//                     value={editableData?.customer?.name || ""}
//                     onChange={(e) =>
//                       handleChange("customer", {
//                         ...editableData.customer,
//                         name: e.target.value,
//                       })
//                     }
//                   />
//                 ) : (
//                   editableData?.customer?.name || "N/A"
//                 )}
//               </p>
//               <p>
//                 <strong>Email:</strong>{" "}
//                 {isEditing ? (
//                   <input
//                     type="email"
//                     value={editableData?.customer?.email || ""}
//                     onChange={(e) =>
//                       handleChange("customer", {
//                         ...editableData.customer,
//                         email: e.target.value,
//                       })
//                     }
//                   />
//                 ) : (
//                   editableData?.customer?.email || "N/A"
//                 )}
//               </p>
//               <p>
//                 <strong>Phone:</strong>{" "}
//                 {isEditing ? (
//                   <input
//                     type="tel"
//                     value={editableData?.customer?.phone || ""}
//                     onChange={(e) =>
//                       handleChange("customer", {
//                         ...editableData.customer,
//                         phone: e.target.value,
//                       })
//                     }
//                   />
//                 ) : (
//                   editableData?.customer?.phone || "N/A"
//                 )}
//               </p>
//               <p>
//                 <strong>Address:</strong>{" "}
//                 {isEditing ? (
//                   <>
//                     <input
//                       type="text"
//                       placeholder="Street"
//                       value={editableData?.customer?.address?.street || ""}
//                       onChange={(e) =>
//                         handleChange("customer", {
//                           ...editableData.customer,
//                           address: {
//                             ...editableData.customer.address,
//                             street: e.target.value,
//                           },
//                         })
//                       }
//                     />
//                     <input
//                       type="text"
//                       placeholder="City"
//                       value={editableData?.customer?.address?.city || ""}
//                       onChange={(e) =>
//                         handleChange("customer", {
//                           ...editableData.customer,
//                           address: {
//                             ...editableData.customer.address,
//                             city: e.target.value,
//                           },
//                         })
//                       }
//                     />
//                     <input
//                       type="text"
//                       placeholder="State"
//                       value={editableData?.customer?.address?.state || ""}
//                       onChange={(e) =>
//                         handleChange("customer", {
//                           ...editableData.customer,
//                           address: {
//                             ...editableData.customer.address,
//                             state: e.target.value,
//                           },
//                         })
//                       }
//                     />
//                     <input
//                       type="text"
//                       placeholder="Zip"
//                       value={editableData?.customer?.address?.zip || ""}
//                       onChange={(e) =>
//                         handleChange("customer", {
//                           ...editableData.customer,
//                           address: {
//                             ...editableData.customer.address,
//                             zip: e.target.value,
//                           },
//                         })
//                       }
//                     />
//                   </>
//                 ) : (
//                   `${editableData?.customer?.address?.street}, ${editableData?.customer?.address?.city}, ${editableData?.customer?.address?.state} ${editableData?.customer?.address?.zip}`
//                 )}
//               </p>
//             </div>
//           </div>
  
//           <div>
//             <h3>Uploads</h3>
//             <label>
//               High Resolution Mockups:
//               <input type="file" multiple accept="image/*" onChange={handleMockupUpload} />
//             </label>
//             <label>
//               Documents:
//               <input type="file" multiple onChange={handleDocumentUpload} />
//             </label>
//           </div>
//         </>
//       );
//     }
  
//     if (selectedTab === "Step 1. Wood Preparation") {
//         return (
//           <Step1WoodPreparation
//             stepData={editableData?.woodPreparation || {}}
//             onToggleChecklist={(itemIndex) =>
//               handleChecklistToggle("woodPreparation", itemIndex)
//             }
//             onSaveNotes={(notes) => handleStepNotes("woodPreparation", notes)}
//             onUpdateTimestamp={(type) =>
//               handleStepTimestamp("woodPreparation", type)
//             }
//           />
//         );
//       }
  
//     return <div>Other tab content...</div>;
//   };

//   return (
//     <div className="manage-project-modal-overlay">
//       <div className="manage-project-modal-content">
//         <header>
//           <h2>Project Overview</h2>
//           <button onClick={onClose} className="close-modal-btn">
//             &times;
//           </button>
//         </header>
//         <div className="modal-body">
//         <aside className="sidebar">
//   {buildPhases.map((phase) => (
//     <button
//       key={phase.key}
//       className={selectedTab === phase.key ? "active" : ""}
//       onClick={() => setSelectedTab(phase.key)}
//     >
//       {phase.label}
//     </button>
//   ))}
// </aside>
//           <main>
//             {renderContent()}
//             {isEditing && (
//   <button onClick={handleSave} className="save-button">
//     Save
//   </button>
//             )}
//             {!isEditing && (
//               <button onClick={handleEditToggle} className="edit-button">
//                 Edit
//               </button>
//             )}
//           </main>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ManageProjectModal;