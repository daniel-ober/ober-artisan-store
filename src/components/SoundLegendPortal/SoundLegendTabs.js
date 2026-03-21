import React, { useMemo, useState } from 'react';
import ProjectProgress from './ProjectProgress';
import ScopeOfWork from './ScopeOfWork';
import CustomerInfo from './CustomerInfo';
import Attachments from './Attachments';
import Billing from './Billing';
import PrioritySupport from './PrioritySupport';
import './SoundLegendTabs.css';

const TABS = [
  { key: 'progress', label: 'Build Progress', shortLabel: 'Progress' },
  { key: 'scope', label: 'Scope of Work', shortLabel: 'Scope' },
  { key: 'customer', label: 'Vault Preferences', shortLabel: 'Vault' },
  { key: 'attachments', label: 'Media', shortLabel: 'Media' },
  { key: 'billing', label: 'Payment History', shortLabel: 'Billing' },
  { key: 'support', label: 'Account Settings', shortLabel: 'Support' },
];

const SoundLegendTabs = ({ project }) => {
  const [activeTab, setActiveTab] = useState('progress');

  const activeTabMeta = useMemo(
    () => TABS.find((tab) => tab.key === activeTab) || TABS[0],
    [activeTab]
  );

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
    <section className="slt-shell" data-component="SoundLegendTabs">
      <div className="slt-header">
        <div className="slt-project-badge">SoundLegend</div>

        <div className="slt-header-copy">
          <div className="slt-eyebrow">Artist Portal</div>
          <h2 className="slt-title">{activeTabMeta.label}</h2>
        </div>
      </div>

      <div className="slt-tabbar" role="tablist" aria-label="SoundLegend tabs">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`slt-tab ${isActive ? 'is-active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span className="slt-tab-label slt-tab-label--desktop">
                {tab.label}
              </span>
              <span className="slt-tab-label slt-tab-label--mobile">
                {tab.shortLabel}
              </span>
            </button>
          );
        })}
      </div>

      <div className="slt-content">{renderTab()}</div>
    </section>
  );
};

export default SoundLegendTabs;