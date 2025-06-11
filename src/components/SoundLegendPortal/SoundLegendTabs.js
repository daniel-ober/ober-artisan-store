import React, { useState } from 'react';
import ProjectProgress from './ProjectProgress';
import ScopeOfWork from './ScopeOfWork';
import CustomerInfo from './CustomerInfo';
import Attachments from './Attachments';
import Billing from './Billing';
import PrioritySupport from './PrioritySupport';
import './SoundLegendTabs.css';

const TABS = [
  { key: 'progress', label: 'Progress' },
  { key: 'scope', label: 'Custom Build Details' },
  { key: 'customer', label: 'Customer Info' },
  { key: 'attachments', label: 'Attachments' },
  { key: 'billing', label: 'Billing' },
  { key: 'support', label: 'Priority Support' },
];

const SoundLegendTabs = ({ project }) => {
  const [activeTab, setActiveTab] = useState('progress');

  const renderTab = () => {
    switch (activeTab) {
      case 'progress':
        return <ProjectProgress project={project} />;
      case 'scope':
        return <ScopeOfWork project={project} />;
      case 'customer':
        return <CustomerInfo project={project} />;
      case 'attachments':
        return <Attachments project={project} />;
      case 'billing':
        return <Billing project={project} />;
      case 'support':
        return <PrioritySupport project={project} />;
      default:
        return null;
    }
  };

  return (
    <div className="customer-soundlegend-container">
      <div className="soundlegend-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="soundlegend-content">{renderTab()}</div>
    </div>
  );
};

export default SoundLegendTabs;