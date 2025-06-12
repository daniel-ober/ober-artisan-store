import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import './ProjectDetailPage.css';
import {
  FaTree,
  FaTools,
  FaSlidersH,
  FaPaintBrush,
  FaCircleNotch,
  FaCut,
  FaWrench,
  FaCogs,
  FaDrum,
  FaClipboardCheck,
} from 'react-icons/fa';
import {
  Hammer,
  Flame,
  Scissors,
  Droplet,
  Settings,
  Wrench,
  Beaker,
  Hand,
} from 'lucide-react';

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPreviewLoaded, setIsPreviewLoaded] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [uploadingZone, setUploadingZone] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [modalPreview, setModalPreview] = useState(null);
  const [dragging, setDragging] = useState({
    mockups: false,
    documents: false,
  });
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [editableCustomer, setEditableCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
    },
  });

  const stepIcons = {
    woodPreparation: <FaTree />,
    shellConstruction: <FaTools />,
    fineTuning: <FaSlidersH />,
    shellExteriorFinish: <FaPaintBrush />,
    bearingEdges: <FaCircleNotch />,
    snareBedCutting: <FaCut />,
    hardwareDrilling: <FaWrench />,
    hardwareAssembly: <FaCogs />,
    tuningAndDetailing: <FaDrum />,
    qualityCheck: <FaClipboardCheck />,
  };

  const allFileSections = [
    'build_proposal',
    'wood_selection',
    'early_mockups_(pre-production)',
    'stave_construction_(pre-milling)',
    'stave_construction_(post-milling)',
    'final_mockups_(mid-production)',
    'media_files_(audio/video)',
    'other',
  ];

  const stepWeights = {
    woodPreparation: 0.05,
    shellConstruction: 0.2,
    fineTuning: 0.1,
    shellExteriorFinish: 0.2,
    bearingEdges: 0.1,
    snareBedCutting: 0.1,
    hardwareDrilling: 0.1,
    hardwareAssembly: 0.05,
    tuningAndDetailing: 0.05,
    qualityCheck: 0.05,
  };

  const calculateProjectProgress = (project) => {
    let total = 0;
    for (const [key, weight] of Object.entries(stepWeights)) {
      const checklist = project[key]?.checklist;
      if (!checklist?.length) continue;
      const completed = checklist.filter((item) => item.completed).length;
      total += (completed / checklist.length) * weight;
    }
    return Math.round(total * 100);
  };

  useEffect(() => {
    const fetchProject = async () => {
      if (!user) {
        navigate('/signin');
        return;
      }

      try {
        const ref = doc(db, 'projects', projectId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          navigate('/not-found');
          return;
        }

        const data = snap.data();

        if (isAdmin || data.ownerUid === user.uid) {
          setProject({ id: snap.id, ...data });

          // ✅ Correct file extraction logic
          const rawAttachments = data.attachments || {};
          const groupedVisible = {};

          Object.entries(rawAttachments).forEach(([key, files]) => {
            if (!Array.isArray(files)) return;
            files.forEach((file) => {
              const fileObj =
                typeof file === 'string'
                  ? { url: file, hidden: false, category: key }
                  : file;

              if (!fileObj?.url || fileObj.hidden) return;

              const cat = fileObj.category || key || 'other';
              if (!groupedVisible[cat]) groupedVisible[cat] = [];
              groupedVisible[cat].push(fileObj);
            });
          });

          setUploadedFiles(groupedVisible);
          console.log('✅ Grouped visible attachments:', groupedVisible);
        } else {
          setUnauthorized(true);
        }
      } catch (err) {
        console.error('❌ Error loading project:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [user, isAdmin, projectId, navigate]);

  // ✅ Separate hook: Sync editableCustomer
  useEffect(() => {
    if (project?.customer) {
      setEditableCustomer({
        name: project.customer.name || '',
        phone: project.customer.phone || '',
        email: project.customer.email || '',
        address: {
          street: project.customer.address?.street || '',
          city: project.customer.address?.city || '',
          state: project.customer.address?.state || '',
          zip: project.customer.address?.zip || '',
        },
      });
    }
  }, [project]);

  const handleDrop = async (e, type) => {
    e.preventDefault();
    setDragging((prev) => ({ ...prev, [type]: false }));

    const file = e.dataTransfer?.files?.[0];
    if (!file || !projectId) return;

    const path = `projects/${projectId}/${type}/${file.name}`;
    const fileRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(fileRef, file);

    setUploadingZone(type);
    setUploadProgress(0);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(pct.toFixed(0));
      },
      (error) => {
        console.error(`Upload to ${type} failed:`, error);
        setUploadingZone(null);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        const updated = [...uploadedFiles[type], url];

        setUploadedFiles((prev) => ({ ...prev, [type]: updated }));

        try {
          await updateDoc(doc(db, 'projects', projectId), {
            [`attachments.${type}`]: updated,
          });
        } catch (err) {
          console.error(`❌ Failed to save ${type} URL to Firestore:`, err);
        }

        setUploadingZone(null);
        setUploadProgress(0);
      }
    );
  };

  const allowDrag = (e) => e.preventDefault();
  const handleDragEnter = (type) =>
    setDragging((prev) => ({ ...prev, [type]: true }));
  const handleDragLeave = (type) =>
    setDragging((prev) => ({ ...prev, [type]: false }));

  if (loading) return <div className="project-page">Loading...</div>;
  if (unauthorized)
    return (
      <div className="project-page">
        You are not authorized to view this project.
      </div>
    );
  if (!project) return <div className="project-page">Project not found.</div>;

  const {
    orderId,
    startDate,
    targetCompletion,
    currentPhase,
    status,
    woodPrimary,
    artisanLine,
    bearingEdge,
    width,
    depth,
    shellConstructionName,
    lugCount,
    lugType,
    hardwareColor,
    hoops,
    reinforcementRings,
    throwOff,
    snareWires,
    snareBedDepth,
    finishDetails,
    additionalNotes,
    customer = {},
  } = project;

  const formatDate = (value) => {
    if (!value) return 'N/A';
    let date;

    if (value?.seconds) {
      date = new Date(value.seconds * 1000);
    } else if (typeof value === 'string') {
      date = new Date(value);
    } else {
      date = new Date(value);
    }

    return isNaN(date.getTime())
      ? 'N/A'
      : date.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
  };

  const getBufferedDate = (original) => {
    try {
      const base =
        original?.seconds && typeof original.seconds === 'number'
          ? new Date(original.seconds * 1000)
          : typeof original === 'string'
            ? new Date(original)
            : null;

      if (!base || isNaN(base.getTime())) return 'N/A';

      const buffered = new Date(base);
      buffered.setDate(buffered.getDate() + 14);
      return buffered.toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="project-page">
      {!isAdmin && (
        <div className="soundlegend-banner">
          <p>
            You’re viewing your custom SoundLegend drum build in progress. This
            page is read-only. Questions? Contact us at{' '}
            <a href="mailto:support@oberdrums.com">soundlegend@oberartisandrums.com</a>.
          </p>
        </div>
      )}

      <h2>Project Overview</h2>

      <section className="project-section">
        <h3>Progress</h3>

        <p>
          <strong>Project Completion:</strong>{' '}
          {calculateProjectProgress(project)}%
        </p>
        <p>
          <strong>Current Step:</strong> {currentPhase || 'N/A'}
        </p>

        <div className="customer-progress-container">
          <div className="customer-progress-track">
            <div
              className="customer-progress-fill"
              style={{ width: `${calculateProjectProgress(project)}%` }}
            />
            <div
              className="customer-current-indicator"
              style={{ left: `${calculateProjectProgress(project)}%` }}
            />
          </div>

          <div className="customer-progress-timeline">
            {Object.entries(stepWeights).map(([key, weight], index) => {
              const step = project[key];
              const completed =
                step?.checklist?.filter((i) => i.completed).length || 0;
              const total = step?.checklist?.length || 0;

              let status = 'Not Started';
              let className = '';
              if (completed === total && total > 0) {
                status = 'Completed';
                className = 'complete';
              } else if (completed > 0) {
                status = 'In Progress';
                className = 'in-progress';
              }

              const left =
                Object.values(stepWeights)
                  .slice(0, index)
                  .reduce((sum, w) => sum + w, 0) * 100;

              const readable = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, (c) => c.toUpperCase());

              return (
                <div
                  key={key}
                  className={`customer-timeline-step ${className}`}
                  style={{ left: `${left}%` }}
                  data-tooltip={`${readable} — ${status}`}
                >
                  <div className="step-pill">{index + 1}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="project-section">
        <h3>Customer</h3>
        <p>
          <strong>Name:</strong> {project?.customer?.name || 'N/A'}
        </p>
        <p>
          <strong>Phone:</strong> {project?.customer?.phone || 'N/A'}
        </p>
        <p>
          <strong>Email:</strong> {project?.customer?.email || 'N/A'}
        </p>
        <p>
          <strong>Shipping Address:</strong>{' '}
          {project?.customer?.address
            ? [
                project.customer.address.street,
                project.customer.address.city,
                project.customer.address.state,
                project.customer.address.zip,
              ]
                .filter(Boolean)
                .join(', ')
            : 'N/A'}
        </p>

        {!isAdmin && (
          <button
            className="edit-button"
            onClick={() =>
              window.open(
                'mailto:support@oberdrums.com?subject=Request to update customer info',
                '_blank'
              )
            }
          >
            Request Changes
          </button>
        )}
      </section>

      <section className="project-section">
        <h3>Scope of Work</h3>
        <p>
          <strong>Artisan Line:</strong>{' '}
          {project?.artisanLine?.trim() ? project.artisanLine : 'N/A'}
        </p>
        <p>
          <strong>Shell Construction:</strong>{' '}
          {project?.shellConstructionName?.trim()
            ? project.shellConstructionName
            : 'N/A'}
        </p>

        {['Stave', 'Hybrid'].includes(project?.shellConstructionName) && (
          <>
            <p>
              <strong>Stave Quantity:</strong>{' '}
              {project?.staveCount ? project.staveCount : 'N/A'}
            </p>
          </>
        )}
        <p>
          <strong>Diameter:</strong> {project?.width ? project.width : 'N/A'}
        </p>
        <p>
          <strong>Depth:</strong>{' '}
          {project?.shellDepth ? project.shellDepth : 'N/A'}
        </p>
        <p>
          <strong>Wood Species:</strong>{' '}
          {project?.woodPrimary?.trim() ? project.woodPrimary : 'N/A'}
        </p>
        <p>
          <strong>Target Shell Thickness:</strong>{' '}
          {project?.targetShellThickness?.trim()
            ? `${project.targetShellThickness} mm`
            : 'N/A'}
        </p>
        <p>
          <strong>Bearing Edge:</strong>{' '}
          {project?.bearingEdge?.trim() ? project.bearingEdge : 'N/A'}
        </p>
        <p>
          <strong>Quantity Lugs:</strong>{' '}
          {project?.lugCount ? project.lugCount : 'N/A'}
        </p>
        <p>
          <strong>Lug Type:</strong>{' '}
          {project?.lugType?.trim() ? project.lugType : 'N/A'}
        </p>
        <p>
          <strong>Hardware Color:</strong>{' '}
          {project?.hardwareColor?.trim() ? project.hardwareColor : 'N/A'}
        </p>
        <p>
          <strong>Hoops:</strong>{' '}
          {project?.hoops?.trim() ? project.hoops : 'N/A'}
        </p>
        <p>
          <strong>Reinforcement Rings:</strong>{' '}
          {project?.reinforcementRings?.trim()
            ? project.reinforcementRings
            : 'N/A'}
        </p>
        <p>
          {project?.reinforcementRings !== 'None' && (
            <p>
              <strong>Re-Rings Wood Species:</strong>{' '}
              {project?.reringsSpecies && project.reringsSpecies !== 'None'
                ? project.reringsSpecies
                : 'N/A'}
            </p>
          )}
        </p>
        <p>
          <strong>Throw-off:</strong>{' '}
          {project?.snareThrowOff?.trim() ? project.snareThrowOff : 'N/A'}
        </p>
        <p>
          <strong>Snare Wires:</strong>{' '}
          {project?.snareWires?.trim() ? project.snareWires : 'N/A'}
        </p>
        <p>
          <strong>Snare Bed Depth:</strong>{' '}
          {project?.snareBedDepth ? project.snareBedDepth : 'N/A'}
        </p>
        <p>
          <strong>Finish Details:</strong>{' '}
          {project?.finishDetails?.trim() ? project.finishDetails : 'N/A'}
        </p>
        <p>
          <strong>Additional Notes:</strong>{' '}
          {project?.additionalNotes?.trim() ? project.additionalNotes : 'N/A'}
        </p>
      </section>

      {allFileSections.map((sectionKey) => {
        const files = uploadedFiles?.[sectionKey] || [];
        if (!files.length) return null;

        const sectionTitle = sectionKey
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());

        return (
          <section className="project-section" key={sectionKey}>
            <h3>{sectionTitle}</h3>
            <div className="file-preview-grid">
              {files.map((file, i) => {
                const fileObj =
                  typeof file === 'string'
                    ? { url: file, hidden: false }
                    : file;

                const { url } = fileObj;
                if (!url || typeof url !== 'string') return null;

                const fileName = decodeURIComponent(
                  url.split('/').pop().split('?')[0].split('%2F').pop()
                );
                const ext = fileName.includes('.')
                  ? fileName.split('.').pop().toLowerCase()
                  : '';
                const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(
                  ext
                );
                const isPDF = ext === 'pdf';
                const isAudio = ['mp3', 'wav', 'ogg'].includes(ext);
                const isVideo = ['mp4', 'webm', 'mov'].includes(ext);

                return (
                  <div
                    key={i}
                    className="file-preview-item"
                    onClick={() => {
                      setIsPreviewLoaded(false); // <-- reset loading state BEFORE opening modal
                      setModalPreview({ url, ext });
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {isImage ? (
                      <img
                        src={url}
                        alt={fileName}
                        className="file-preview-image"
                        style={{
                          height: '160px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1px solid #444',
                        }}
                      />
                    ) : (
                      <div className="file-preview-thumbnail">
                        {isPDF && (
                          <img
                            src="/icons/pdf-icon.png"
                            alt="PDF"
                            className="pdf-icon"
                          />
                        )}
                        <span className="file-label">{fileName}</span>
                        <span className="file-format">
                          {isPDF
                            ? 'PDF'
                            : isAudio
                              ? 'Audio'
                              : isVideo
                                ? 'Video'
                                : 'File'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {modalPreview && (
        <div
          className="file-preview-modal"
          onClick={() => setModalPreview(null)}
        >
          <div
            className="file-preview-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close-button"
              onClick={() => setModalPreview(null)}
            >
              ✕
            </button>

            <a
              href={modalPreview.url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="modal-download-button"
            >
              ⬇ Download
            </a>

            {!isPreviewLoaded && (
              <div className="preview-loading-spinner">Loading...</div>
            )}

            {modalPreview.ext === 'pdf' ? (
              <iframe
                src={modalPreview.url}
                title="PDF Preview"
                className="file-preview-pdf"
                style={{
                  visibility: isPreviewLoaded ? 'visible' : 'hidden',
                  opacity: isPreviewLoaded ? 1 : 0,
                  transition: 'opacity 0.4s ease',
                }}
                onLoad={() => setIsPreviewLoaded(true)}
              />
            ) : modalPreview.ext === 'mp4' ||
              modalPreview.ext === 'webm' ||
              modalPreview.ext === 'mov' ? (
              <video
                controls
                autoPlay
                loop
                className="file-preview-video"
                style={{
                  visibility: isPreviewLoaded ? 'visible' : 'hidden',
                  opacity: isPreviewLoaded ? 1 : 0,
                  transition: 'opacity 0.4s ease',
                }}
                onLoadedData={() => setIsPreviewLoaded(true)}
              >
                <source src={modalPreview.url} />
              </video>
            ) : modalPreview.ext === 'mp3' ||
              modalPreview.ext === 'wav' ||
              modalPreview.ext === 'ogg' ? (
              <audio
                controls
                className="file-preview-audio"
                style={{
                  visibility: isPreviewLoaded ? 'visible' : 'hidden',
                  opacity: isPreviewLoaded ? 1 : 0,
                  transition: 'opacity 0.4s ease',
                }}
                onLoadedData={() => setIsPreviewLoaded(true)}
              >
                <source src={modalPreview.url} />
              </audio>
            ) : (
              <img
                src={modalPreview.url}
                alt="Preview"
                className="file-preview-image"
                style={{
                  visibility: isPreviewLoaded ? 'visible' : 'hidden',
                  opacity: isPreviewLoaded ? 1 : 0,
                  transition: 'opacity 0.4s ease',
                }}
                onLoad={() => setIsPreviewLoaded(true)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailPage;
