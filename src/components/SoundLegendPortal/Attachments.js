// import React, { useEffect, useState } from 'react';
// import { useParams } from 'react-router-dom';
// import { doc, getDoc } from 'firebase/firestore';
// import { db } from '../../firebaseConfig';
// import './Attachments.css';

// const Attachments = () => {
//   const { projectId } = useParams();
//   const [project, setProject] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [modalPreview, setModalPreview] = useState(null);
//   const [isPreviewLoaded, setIsPreviewLoaded] = useState(false);

//   useEffect(() => {
//     const fetchProject = async () => {
//       const ref = doc(db, 'projects', projectId);
//       const snap = await getDoc(ref);
//       if (snap.exists()) setProject({ id: snap.id, ...snap.data() });
//       setLoading(false);
//     };
//     fetchProject();
//   }, [projectId]);

//   const uploadedFiles = project?.uploadedFiles || {};

//   const allFileSections = [
//     'build_proposal',
//     'wood_selection',
//     'early_mockups',
//     'stave_pre_milling',
//     'stave_post_milling',
//     'final_mockups',
//     'media_files',
//     'other',
//   ];

//   if (loading) return <div className="scope-section">Loading...</div>;
//   if (!project) return <div className="scope-section">Project not found.</div>;

//   return (
//     <div className="scope-section">
//       <h2>Attachments</h2>
//       {allFileSections.map((sectionKey) => {
//         const files = uploadedFiles?.[sectionKey] || [];
//         if (!files.length) return null;

//         const sectionTitle = sectionKey
//           .replace(/_/g, ' ')
//           .replace(/\b\w/g, (l) => l.toUpperCase());

//         return (
//           <section className="project-section" key={sectionKey}>
//             <h3>{sectionTitle}</h3>
//             <div className="file-preview-grid">
//               {files.map((file, i) => {
//                 const fileObj = typeof file === 'string' ? { url: file } : file;
//                 const { url } = fileObj;
//                 if (!url || typeof url !== 'string') return null;

//                 const fileName = decodeURIComponent(
//                   url.split('/').pop().split('?')[0].split('%2F').pop()
//                 );
//                 const ext = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
//                 const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
//                 const isPDF = ext === 'pdf';
//                 const isAudio = ['mp3', 'wav', 'ogg'].includes(ext);
//                 const isVideo = ['mp4', 'webm', 'mov'].includes(ext);

//                 return (
//                   <div
//                     key={i}
//                     className="file-preview-item"
//                     onClick={() => {
//                       setIsPreviewLoaded(false);
//                       setModalPreview({ url, ext });
//                     }}
//                     style={{ cursor: 'pointer' }}
//                   >
//                     {isImage ? (
//                       <img
//                         src={url}
//                         alt={fileName}
//                         className="file-preview-image"
//                         style={{ height: '160px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #444' }}
//                       />
//                     ) : (
//                       <div className="file-preview-thumbnail">
//                         {isPDF && <img src="/icons/pdf-icon.png" alt="PDF" className="pdf-icon" />}
//                         <span className="file-label">{fileName}</span>
//                         <span className="file-format">
//                           {isPDF ? 'PDF' : isAudio ? 'Audio' : isVideo ? 'Video' : 'File'}
//                         </span>
//                       </div>
//                     )}
//                   </div>
//                 );
//               })}
//             </div>
//           </section>
//         );
//       })}

//       {modalPreview && (
//         <div className="file-preview-modal" onClick={() => setModalPreview(null)}>
//           <div className="file-preview-modal-content" onClick={(e) => e.stopPropagation()}>
//             <button className="modal-close-button" onClick={() => setModalPreview(null)}>✕</button>
//             <a
//               href={modalPreview.url}
//               download
//               target="_blank"
//               rel="noopener noreferrer"
//               className="modal-download-button"
//             >⬇ Download</a>

//             {!isPreviewLoaded && <div className="preview-loading-spinner">Loading...</div>}

//             {modalPreview.ext === 'pdf' ? (
//               <iframe
//                 src={modalPreview.url}
//                 title="PDF Preview"
//                 className="file-preview-pdf"
//                 style={{ visibility: isPreviewLoaded ? 'visible' : 'hidden', opacity: isPreviewLoaded ? 1 : 0, transition: 'opacity 0.4s ease' }}
//                 onLoad={() => setIsPreviewLoaded(true)}
//               />
//             ) : modalPreview.ext === 'mp4' || modalPreview.ext === 'webm' || modalPreview.ext === 'mov' ? (
//               <video
//                 controls
//                 autoPlay
//                 loop
//                 className="file-preview-video"
//                 style={{ visibility: isPreviewLoaded ? 'visible' : 'hidden', opacity: isPreviewLoaded ? 1 : 0, transition: 'opacity 0.4s ease' }}
//                 onLoadedData={() => setIsPreviewLoaded(true)}
//               >
//                 <source src={modalPreview.url} />
//               </video>
//             ) : modalPreview.ext === 'mp3' || modalPreview.ext === 'wav' || modalPreview.ext === 'ogg' ? (
//               <audio
//                 controls
//                 className="file-preview-audio"
//                 style={{ visibility: isPreviewLoaded ? 'visible' : 'hidden', opacity: isPreviewLoaded ? 1 : 0, transition: 'opacity 0.4s ease' }}
//                 onLoadedData={() => setIsPreviewLoaded(true)}
//               >
//                 <source src={modalPreview.url} />
//               </audio>
//             ) : (
//               <img
//                 src={modalPreview.url}
//                 alt="Preview"
//                 className="file-preview-image"
//                 style={{ visibility: isPreviewLoaded ? 'visible' : 'hidden', opacity: isPreviewLoaded ? 1 : 0, transition: 'opacity 0.4s ease' }}
//                 onLoad={() => setIsPreviewLoaded(true)}
//               />
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Attachments;