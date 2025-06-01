import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import './ProjectDetailPage.css';

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

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

        // ✅ Admins bypass ownership check
        if (isAdmin || data.ownerUid === user.uid) {
          setProject({ id: snap.id, ...data });
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
        <p>
          <strong>Project ID:</strong> {project.id}
        </p>
        <p>
          <strong>Order ID:</strong> {orderId || 'N/A'}
        </p>
        <p>
          <strong>Start Date:</strong>{' '}
          {startDate?.seconds
            ? new Date(startDate.seconds * 1000).toLocaleString()
            : startDate || 'N/A'}
        </p>
        <p>
          <strong>Target Completion:</strong> {targetCompletion || 'N/A'}
        </p>
        <p>
          <strong>Current Phase:</strong> {currentPhase || 'N/A'}
        </p>
        <p>
          <strong>Status:</strong> {status || 'N/A'}
        </p>
      </section>

      <section className="project-section">
        <h3>Scope of Work</h3>
        <p>
          <strong>Artisan Line:</strong> {artisanLine || 'N/A'}
        </p>
        <p>
          <strong>Wood Species:</strong> {woodSpecies || 'N/A'}
        </p>
        <p>
          <strong>Bearing Edge:</strong> {bearingEdge || 'N/A'}
        </p>
      </section>

      <section className="project-section">
        <h3>Customer</h3>
        <p>
          <strong>Name:</strong> {customer.name || 'N/A'}
        </p>
        <p>
          <strong>Email:</strong> {customer.email || 'N/A'}
        </p>
        <p>
          <strong>Phone:</strong> {customer.phone || 'N/A'}
        </p>
        <p>
          <strong>Shipping Address:</strong>{' '}
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
        <h3>Attachments</h3>
        <p>
          Coming soon — download links, mockups, and files will appear here.
        </p>
      </section>
    </div>
  );
};

export default ProjectDetailPage;
