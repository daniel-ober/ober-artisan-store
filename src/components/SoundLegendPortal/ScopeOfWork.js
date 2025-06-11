// src/components/SoundLegendPortal/ScopeOfWork.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import './ScopeOfWork.css';

const ScopeOfWork = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const ref = doc(db, 'projects', projectId);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          navigate('/not-found');
          return;
        }
        setProject({ id: snap.id, ...snap.data() });
      } catch (err) {
        console.error('Error fetching project:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId, navigate]);

  if (loading) return <div className="scope-section">Loading...</div>;
  if (!project) return <div className="scope-section">Project not found.</div>;

  return (
    <div className="scope-section">
      <h2>Scope of Work</h2>
      <p><strong>Artisan Line:</strong> {project.artisanLine || 'N/A'}</p>
      <p><strong>Shell Construction:</strong> {project.shellConstructionName || 'N/A'}</p>
      {['Stave', 'Hybrid'].includes(project.shellConstructionName) && (
        <p><strong>Stave Quantity:</strong> {project.staveCount || 'N/A'}</p>
      )}
      <p><strong>Diameter:</strong> {project.width || 'N/A'}</p>
      <p><strong>Depth:</strong> {project.shellDepth || 'N/A'}</p>
      <p><strong>Wood Species:</strong> {project.woodPrimary || 'N/A'}</p>
      <p><strong>Target Shell Thickness:</strong> {project.targetShellThickness ? `${project.targetShellThickness} mm` : 'N/A'}</p>
      <p><strong>Bearing Edge:</strong> {project.bearingEdge || 'N/A'}</p>
      <p><strong>Quantity Lugs:</strong> {project.lugCount || 'N/A'}</p>
      <p><strong>Lug Type:</strong> {project.lugType || 'N/A'}</p>
      <p><strong>Hardware Color:</strong> {project.hardwareColor || 'N/A'}</p>
      <p><strong>Hoops:</strong> {project.hoops || 'N/A'}</p>
      <p><strong>Reinforcement Rings:</strong> {project.reinforcementRings || 'N/A'}</p>
      {project.reinforcementRings !== 'None' && (
        <p><strong>Re-Rings Wood Species:</strong> {project.reringsSpecies || 'N/A'}</p>
      )}
      <p><strong>Throw-off:</strong> {project.snareThrowOff || 'N/A'}</p>
      <p><strong>Snare Wires:</strong> {project.snareWires || 'N/A'}</p>
      <p><strong>Snare Bed Depth:</strong> {project.snareBedDepth || 'N/A'}</p>
      <p><strong>Finish Details:</strong> {project.finishDetails || 'N/A'}</p>
      <p><strong>Additional Notes:</strong> {project.additionalNotes || 'N/A'}</p>
    </div>
  );
};

export default ScopeOfWork;