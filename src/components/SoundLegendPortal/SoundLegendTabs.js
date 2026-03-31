import React, { useEffect, useMemo, useState } from 'react';
import ProjectProgress from './ProjectProgress';
import ScopeOfWork from './ScopeOfWork';
import CustomerInfo from './CustomerInfo';
import Attachments from './Attachments';
import Billing from './Billing';
import PrioritySupport from './PrioritySupport';
import { useAuth } from '../../context/AuthContext';
import './SoundLegendTabs.css';

const TAB_CATALOG = [
  {
    key: 'progress',
    label: 'Build Progress',
    shortLabel: 'Progress',
    alwaysVisible: false,
  },
  {
    key: 'scope',
    label: 'Scope of Work',
    shortLabel: 'Scope',
    alwaysVisible: false,
  },
  {
    key: 'customer',
    label: 'Vault Preferences',
    shortLabel: 'Vault',
    alwaysVisible: false,
  },
  {
    key: 'attachments',
    label: 'Media',
    shortLabel: 'Media',
    alwaysVisible: false,
  },
  {
    key: 'billing',
    label: 'Payment History',
    shortLabel: 'Billing',
    alwaysVisible: true,
  },
  {
    key: 'support',
    label: 'Account Settings',
    shortLabel: 'Account',
    alwaysVisible: true,
  },
];

const normalizeBoolean = (value, fallback = true) => {
  if (typeof value === 'boolean') return value;
  return fallback;
};

const getProjectId = (project = {}) =>
  String(
    project?.id ||
      project?.projectId ||
      project?.docId ||
      project?.serial ||
      project?.snareSerial ||
      project?.lineSerial ||
      ''
  ).trim();

const getProjectOwnerUid = (project = {}) =>
  String(
    project?.ownerUid ||
      project?.userId ||
      project?.uid ||
      project?.customerUid ||
      ''
  ).trim();

const hasRealProject = (project = null) => !!getProjectId(project);

const deriveAreaToggles = (project = {}, userProfile = {}) => {
  const projectAreas =
    project?.soundlegendPortal?.enabledAreas ||
    project?.soundlegendPortal?.areas ||
    project?.portalAreas ||
    project?.portalAccess?.areas ||
    project?.portalSettings?.areas ||
    project?.soundlegendAreas ||
    {};

  const userAreas =
    userProfile?.soundlegendPortal?.enabledAreas ||
    userProfile?.soundlegendPortal?.areas ||
    userProfile?.portalAreas ||
    userProfile?.portalAccess?.areas ||
    userProfile?.portalSettings?.areas ||
    {};

  const projectExists = hasRealProject(project);

  return {
    progress: normalizeBoolean(
      projectAreas.progress ?? userAreas.progress,
      projectExists
    ),
    scope: normalizeBoolean(
      projectAreas.scope ?? userAreas.scope,
      projectExists
    ),
    customer: normalizeBoolean(
      projectAreas.customer ??
        projectAreas.vault ??
        projectAreas.vaultPreferences ??
        userAreas.customer ??
        userAreas.vault ??
        userAreas.vaultPreferences,
      projectExists
    ),
    attachments: normalizeBoolean(
      projectAreas.attachments ??
        projectAreas.media ??
        userAreas.attachments ??
        userAreas.media,
      projectExists
    ),
  };
};

const getPortalAccessState = ({
  project,
  user,
  isAdmin,
  slPortalLocked,
  slPortalExpired,
  hasAssignedProject,
  assignedProjectIds,
}) => {
  if (isAdmin) {
    return {
      portalLockedOrExpired: false,
      projectAssignedToUser: true,
      hasAccessibleProject: hasRealProject(project),
      accessMode: 'admin',
      lockReason: '',
      projectExists: hasRealProject(project),
    };
  }

  const projectId = getProjectId(project);
  const ownerUid = getProjectOwnerUid(project);
  const projectExists = !!projectId;

  const normalizedAssignedIds = Array.isArray(assignedProjectIds)
    ? assignedProjectIds.map((id) => String(id).trim()).filter(Boolean)
    : [];

  const assignedViaList = projectExists && normalizedAssignedIds.includes(projectId);
  const assignedViaOwner = projectExists && !!ownerUid && !!user?.uid && ownerUid === user.uid;

  const projectAssignedToUser =
    projectExists && (assignedViaOwner || assignedViaList || (!ownerUid && hasAssignedProject));

  const portalLockedOrExpired = slPortalLocked || slPortalExpired;

  const hasAccessibleProject =
    projectExists && !portalLockedOrExpired && projectAssignedToUser;

  let lockReason = '';

  if (slPortalExpired) {
    lockReason =
      'Your SoundLegend artist portal access has expired. Payment History and Account Settings are still available.';
  } else if (slPortalLocked) {
    lockReason =
      'Your SoundLegend artist portal is currently locked. Payment History and Account Settings remain available.';
  } else if (!projectExists) {
    lockReason =
      'Your build workspace is not available yet because a project has not been created for your account.';
  } else if (!projectAssignedToUser) {
    lockReason =
      'Your project-specific SoundLegend portal areas are not available yet. They will appear once your paid project is assigned to your account.';
  }

  return {
    portalLockedOrExpired,
    projectAssignedToUser,
    hasAccessibleProject,
    accessMode: hasAccessibleProject ? 'full' : 'limited',
    lockReason,
    projectExists,
  };
};

const SoundLegendTabs = ({ project }) => {
  const {
    user,
    userProfile,
    isAdmin,
    slPortalLocked,
    slPortalExpired,
    hasAssignedProject,
    assignedProjectIds,
  } = useAuth();

  const areaToggles = useMemo(
    () => deriveAreaToggles(project, userProfile),
    [project, userProfile]
  );

  const portalState = useMemo(
    () =>
      getPortalAccessState({
        project,
        user,
        isAdmin,
        slPortalLocked,
        slPortalExpired,
        hasAssignedProject,
        assignedProjectIds,
      }),
    [
      project,
      user,
      isAdmin,
      slPortalLocked,
      slPortalExpired,
      hasAssignedProject,
      assignedProjectIds,
    ]
  );

  const availableTabs = useMemo(() => {
    return TAB_CATALOG.filter((tab) => {
      if (tab.alwaysVisible) return true;
      if (!portalState.hasAccessibleProject) return false;

      if (tab.key === 'progress') return areaToggles.progress;
      if (tab.key === 'scope') return areaToggles.scope;
      if (tab.key === 'customer') return areaToggles.customer;
      if (tab.key === 'attachments') return areaToggles.attachments;

      return false;
    });
  }, [portalState.hasAccessibleProject, areaToggles]);

  const defaultTabKey = useMemo(() => {
    return availableTabs[0]?.key || 'billing';
  }, [availableTabs]);

  const [activeTab, setActiveTab] = useState(defaultTabKey);

  useEffect(() => {
    const activeStillExists = availableTabs.some((tab) => tab.key === activeTab);
    if (!activeStillExists) {
      setActiveTab(defaultTabKey);
    }
  }, [availableTabs, activeTab, defaultTabKey]);

  const activeTabMeta = useMemo(
    () => availableTabs.find((tab) => tab.key === activeTab) || availableTabs[0],
    [availableTabs, activeTab]
  );

  const renderLimitedAccessNotice = () => {
    if (isAdmin || portalState.hasAccessibleProject) return null;

    return (
      <div className="slt-access-note slt-access-note--limited">
        <div className="slt-access-note-badge">Limited Access</div>
        <div className="slt-access-note-copy">
          <strong>Project areas are not available yet.</strong>
          <p>
            {portalState.lockReason ||
              'Once your paid SoundLegend project is active and assigned, Build Progress, Scope of Work, Vault Preferences, and Media will appear here.'}
          </p>
        </div>
      </div>
    );
  };

  const renderPortalAvailabilitySummary = () => {
    if (isAdmin) return null;
    if (!portalState.hasAccessibleProject) return null;

    const hiddenSections = [];
    if (!areaToggles.progress) hiddenSections.push('Build Progress');
    if (!areaToggles.scope) hiddenSections.push('Scope of Work');
    if (!areaToggles.customer) hiddenSections.push('Vault Preferences');
    if (!areaToggles.attachments) hiddenSections.push('Media');

    if (!hiddenSections.length) return null;

    return (
      <div className="slt-access-note">
        <div className="slt-access-note-badge">Portal Settings</div>
        <div className="slt-access-note-copy">
          <strong>Some artist portal areas are currently disabled.</strong>
          <p>{hiddenSections.join(', ')} are turned off for this project.</p>
        </div>
      </div>
    );
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'progress':
        return <ProjectProgress project={project} isAdmin={isAdmin} />;

      case 'scope':
        return <ScopeOfWork project={project} isAdmin={isAdmin} />;

      case 'customer':
        return <CustomerInfo project={project} isAdmin={isAdmin} />;

      case 'attachments':
        return <Attachments project={project} isAdmin={isAdmin} />;

      case 'billing':
        return <Billing project={project} isAdmin={isAdmin} />;

      case 'support':
        return <PrioritySupport project={project} isAdmin={isAdmin} />;

      default:
        return null;
    }
  };

  return (
    <section className="slt-shell" data-component="SoundLegendTabs">
      <div className="slt-header">
        <div className="slt-project-badge">
          {portalState.hasAccessibleProject || isAdmin
            ? 'SoundLegend'
            : 'Portal Access'}
        </div>

        <div className="slt-header-copy">
          <div className="slt-eyebrow">
            {portalState.hasAccessibleProject || isAdmin
              ? 'Artist Portal'
              : 'Account Center'}
          </div>
          <h2 className="slt-title">
            {activeTabMeta?.label || 'SoundLegend Portal'}
          </h2>
        </div>
      </div>

      {renderLimitedAccessNotice()}
      {renderPortalAvailabilitySummary()}

      <div className="slt-tabbar" role="tablist" aria-label="SoundLegend tabs">
        {availableTabs.map((tab) => {
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