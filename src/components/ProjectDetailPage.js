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
  const [dragging, setDragging] = useState({ mockups: false, documents: false });
  const [uploadedFiles, setUploadedFiles] = useState({ mockups: [], documents: [] });

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

          // ✅ Load attachments from Firestore
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
    if (!file || !projectId) {
      console.warn('No file dropped or projectId missing');
      return;
    }

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
        console.log(`✅ Upload successful [${type}]:`, url);

        const updated = [...uploadedFiles[type], url];

        // Update local state
        setUploadedFiles((prev) => ({ ...prev, [type]: updated }));

        // ✅ Save to Firestore
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
  const handleDragEnter = (type) => setDragging((prev) => ({ ...prev, [type]: true }));
  const handleDragLeave = (type) => setDragging((prev) => ({ ...prev, [type]: false }));

  if (loading) return <div className="project-page">Loading...</div>;
  if (unauthorized)
    return <div className="project-page">You are not authorized to view this project.</div>;
  if (!project) return <div className="project-page">Project not found.</div>;

  const {
    orderId,
    startDate,
    targetCompletion,
    currentPhase,
    status,
    woodSpecies,
    artisanLine,
    bearingEdge,
    customer = {},
  } = project;

  return (
    <div className="project-page">
      <h2>Project Overview</h2>

      <section className="project-section">
        <h3>Project Details</h3>
        <p><strong>Project ID:</strong> {project.id}</p>
        <p><strong>Order ID:</strong> {orderId || 'N/A'}</p>
        <p><strong>Start Date:</strong>{' '}
          {startDate?.seconds
            ? new Date(startDate.seconds * 1000).toLocaleString()
            : startDate || 'N/A'}
        </p>
        <p><strong>Target Completion:</strong> {targetCompletion || 'N/A'}</p>
        <p><strong>Current Phase:</strong> {currentPhase || 'N/A'}</p>
        <p><strong>Status:</strong> {status || 'N/A'}</p>
      </section>

      <section className="project-section">
        <h3>Scope of Work</h3>
        <p><strong>Artisan Line:</strong> {artisanLine || 'N/A'}</p>
        <p><strong>Wood Species:</strong> {woodSpecies || 'N/A'}</p>
        <p><strong>Bearing Edge:</strong> {bearingEdge || 'N/A'}</p>
      </section>

      <section className="project-section">
        <h3>Customer</h3>
        <p><strong>Name:</strong> {customer.name || 'N/A'}</p>
        <p><strong>Email:</strong> {customer.email || 'N/A'}</p>
        <p><strong>Phone:</strong> {customer.phone || 'N/A'}</p>
        <p><strong>Shipping Address:</strong>{' '}
          {customer.address
            ? [
                customer.address.street,
                customer.address.city,
                customer.address.state,
                customer.address.zip,
              ]
                .filter(Boolean)
                .join(', ')
            : 'N/A'}
        </p>
      </section>

      <section className="project-section">
        <h3>Uploads</h3>

        <div
          className={`dropzone ${dragging.mockups ? 'drag-active' : ''}`}
          onDrop={(e) => handleDrop(e, 'mockups')}
          onDragOver={allowDrag}
          onDragEnter={() => handleDragEnter('mockups')}
          onDragLeave={() => handleDragLeave('mockups')}
        >
          <p>Drag & drop high resolution mockups here</p>
          {uploadingZone === 'mockups' && (
            <p className="upload-progress">Uploading... {uploadProgress}%</p>
          )}
        </div>

        {uploadedFiles.mockups.length > 0 && (
          <div className="uploaded-files">
            <p className="upload-list-label">Uploaded Mockups:</p>
            <ul>
              {uploadedFiles.mockups.map((url, index) => (
                <li key={index}>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    {url.split('/').pop().split('?')[0]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div
          className={`dropzone ${dragging.documents ? 'drag-active' : ''}`}
          onDrop={(e) => handleDrop(e, 'documents')}
          onDragOver={allowDrag}
          onDragEnter={() => handleDragEnter('documents')}
          onDragLeave={() => handleDragLeave('documents')}
        >
          <p>Drag & drop documents here</p>
          {uploadingZone === 'documents' && (
            <p className="upload-progress">Uploading... {uploadProgress}%</p>
          )}
        </div>

        {uploadedFiles.documents.length > 0 && (
          <div className="uploaded-files">
            <p className="upload-list-label">Uploaded Documents:</p>
            <ul>
              {uploadedFiles.documents.map((url, index) => (
                <li key={index}>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                  {decodeURIComponent(url.split('/').pop().split('?')[0].split('%2F').pop())}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
};

export default ProjectDetailPage;