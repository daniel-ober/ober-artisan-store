import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import ProjectProgress from './ProjectProgress';
import ScopeOfWork from './ScopeOfWork';
import Attachments from './Attachments';
import CustomerInfo from './CustomerInfo';
import Billing from './Billing';
import PrioritySupport from './PrioritySupport';
import './SoundLegendPortal.css';

const TABS = [
  { key: 'progress', label: 'Progress' },
  { key: 'scope', label: 'Custom Build Details' },
  { key: 'info', label: 'Customer Info' },
  { key: 'billing', label: 'Billing' },
  { key: 'attachments', label: 'Attachments' },
  { key: 'support', label: 'Priority Support' },
];

const SoundLegendPortal = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('progress');

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
        console.error('❌ Error fetching project:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId, navigate]);

  if (loading) return <div className="scope-section">Loading...</div>;
  if (!project) return <div className="scope-section">Project not found.</div>;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'progress':
        return <ProjectProgress project={project} />;
      case 'scope':
        return <ScopeOfWork />;
      case 'info':
        return <CustomerInfo project={project} />;
      case 'billing':
        return <Billing />;
      case 'attachments':
        return <Attachments project={project} />;
      case 'support':
        return <PrioritySupport />;
      default:
        return null;
    }
  };

  return (
    <div className="soundlegend-portal">
      <h1 className="portal-title">SoundLegend Client Portal</h1>

      <div className="portal-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`portal-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="portal-content">{renderTabContent()}</div>
    </div>
  );
};

export default SoundLegendPortal;