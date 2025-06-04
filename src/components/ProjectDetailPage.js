import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import './ProjectDetailPage.css';

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [uploadingZone, setUploadingZone] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragging, setDragging] = useState({
    mockups: false,
    documents: false,
  });
  const [uploadedFiles, setUploadedFiles] = useState({
    mockups: [],
    documents: [],
  });

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
          setUploadedFiles({
            mockups: data.attachments?.mockups || [],
            documents: data.attachments?.documents || [],
          });
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
            <a href="mailto:support@oberdrums.com">support@oberdrums.com</a>.
          </p>
        </div>
      )}

      <h2>Project Overview</h2>

      <section className="project-section">
        <h3>Key Details</h3>
        <p>
          <strong>Start Date:</strong> {formatDate(startDate)}
        </p>
        <p>
          <strong>Estimated Completion:</strong>{' '}
          {formatDate(project?.targetCompletion)} –{' '}
          {formatDate(getBufferedDate(project?.targetCompletion))}
        </p>
        <p>
          <strong>Status:</strong> {status || 'N/A'}
        </p>
        {/* <p><strong>Project ID:</strong> {project.id}</p> */}
        {/* <p><strong>Order ID:</strong> {orderId || 'N/A'}</p> */}
        <p>
          <strong>Current Stage:</strong> {currentPhase || 'N/A'}
        </p>
      </section>

      <section className="project-section">
        <h3>Scope of Work</h3>
        <p>
          <strong>Artisan Line:</strong>{' '}
          {project?.artisanLine?.trim() ? project.artisanLine : 'N/A'}
        </p>
        <p>
          <strong>Wood Species:</strong>{' '}
          {project?.woodPrimary?.trim() ? project.woodPrimary : 'N/A'}
        </p>
        <p>
          <strong>Bearing Edge:</strong>{' '}
          {project?.bearingEdge?.trim() ? project.bearingEdge : 'N/A'}
        </p>
        <p>
          <strong>Diameter:</strong> {project?.width ? project.width : 'N/A'}
        </p>
        <p>
          <strong>Depth:</strong>{' '}
          {project?.shellDepth ? project.shellDepth : 'N/A'}
        </p>
        <p>
          <strong>Shell Construction:</strong>{' '}
          {project?.shellConstructionName?.trim()
            ? project.shellConstructionName
            : 'N/A'}
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

      <section className="project-section">
        <h3>Customer </h3>
        <p>
          <strong>Name:</strong> {project?.customer?.name || 'N/A'}
        </p>
        <p>
          <strong>Email:</strong> {project?.customer?.email || 'N/A'}
        </p>
        <p>
          <strong>Phone:</strong> {project?.customer?.phone || 'N/A'}
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
      </section>

      {/* <section className="project-section">
        <h3>Build Progress</h3>
        {[
          'woodPreparation',
          'shellConstruction',
          'fineTuning',
          'shellExteriorFinish',
          'bearingEdges',
          'snareBedCutting',
          'hardwareDrilling',
          'hardwareAssembly',
          'tuningDetailing',
          'qualityCheck',
        ].map((stepKey) => {
          const step = project?.[stepKey];
          if (!step?.checklist || !Array.isArray(step.checklist)) return null;

          const stepLabel =
            typeof stepKey === 'string'
              ? stepKey
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, (c) => c.toUpperCase())
              : '[Invalid Step]';

          return (
            <div key={stepKey} className="build-step-summary">
              <h4>{String(stepLabel)}</h4>
              <ul>
                {step.checklist.map((item, i) => {
                  const safeTask =
                    typeof item.task === 'string'
                      ? item.task
                      : '[Invalid Task]';
                  const minutes = isNaN(item.totalSeconds)
                    ? 0
                    : Math.round(item.totalSeconds / 60);
                  return (
                    <li key={i}>
                      {item.completed ? '✅' : '⬜'} {safeTask} — {minutes} min
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </section> */}

      <section className="project-section">
        <h3>Uploaded Files</h3>

        <div
          className={`dropzone ${dragging.mockups ? 'drag-active' : ''}`}
          onDrop={(e) => handleDrop(e, 'mockups')}
          onDragOver={allowDrag}
          onDragEnter={() => handleDragEnter('mockups')}
          onDragLeave={() => handleDragLeave('mockups')}
        >
          <p>Drag & drop mockups here (admin only)</p>
          {uploadingZone === 'mockups' && (
            <p className="upload-progress">Uploading... {uploadProgress}%</p>
          )}
        </div>

        {uploadedFiles.mockups.length > 0 && (
          <ul>
            {uploadedFiles.mockups.map((url, i) => (
              <li key={i}>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {url.split('/').pop().split('?')[0]}
                </a>
              </li>
            ))}
          </ul>
        )}

        <div
          className={`dropzone ${dragging.documents ? 'drag-active' : ''}`}
          onDrop={(e) => handleDrop(e, 'documents')}
          onDragOver={allowDrag}
          onDragEnter={() => handleDragEnter('documents')}
          onDragLeave={() => handleDragLeave('documents')}
        >
          <p>Drag & drop documents here (admin only)</p>
          {uploadingZone === 'documents' && (
            <p className="upload-progress">Uploading... {uploadProgress}%</p>
          )}
        </div>

        {uploadedFiles.documents.length > 0 && (
          <ul>
            {uploadedFiles.documents.map((url, i) => (
              <li key={i}>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {decodeURIComponent(
                    url.split('/').pop().split('?')[0].split('%2F').pop()
                  )}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default ProjectDetailPage;
