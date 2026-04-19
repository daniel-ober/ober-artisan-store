import React from 'react';
import {
  deriveCustomerEmail,
  deriveCustomerName,
  formatFullTime,
  val,
} from '../shared/stepHelpers';

const ProjectDetailsSection = ({
  projectData,
  editableData,
  storyEngineData,
  status,
  currentPhaseLabel,
  weightedProgress,
  projectReadiness,
  topbarPortalLabel,
  linkedUserStatus,
  calculateProjectTotalTime,
}) => {
  const customerName =
    deriveCustomerName({
      ...(projectData || {}),
      ...(editableData || {}),
    }) || '—';

  const customerEmail =
    deriveCustomerEmail({
      ...(projectData || {}),
      ...(editableData || {}),
    }) || '—';

  const customerPhone =
    val(
      editableData?.customerPhone,
      projectData?.customerPhone,
      editableData?.phone,
      projectData?.phone,
      editableData?.customerInfo?.phone,
      projectData?.customerInfo?.phone
    ) || '—';

  const shippingAddressParts = [
    val(
      editableData?.shippingAddress?.line1,
      projectData?.shippingAddress?.line1,
      editableData?.addressLine1,
      projectData?.addressLine1,
      editableData?.customerInfo?.addressLine1,
      projectData?.customerInfo?.addressLine1
    ),
    val(
      editableData?.shippingAddress?.line2,
      projectData?.shippingAddress?.line2,
      editableData?.addressLine2,
      projectData?.addressLine2,
      editableData?.customerInfo?.addressLine2,
      projectData?.customerInfo?.addressLine2
    ),
    val(
      editableData?.shippingAddress?.city,
      projectData?.shippingAddress?.city,
      editableData?.city,
      projectData?.city,
      editableData?.customerInfo?.city,
      projectData?.customerInfo?.city
    ),
    val(
      editableData?.shippingAddress?.state,
      projectData?.shippingAddress?.state,
      editableData?.state,
      projectData?.state,
      editableData?.customerInfo?.state,
      projectData?.customerInfo?.state
    ),
    val(
      editableData?.shippingAddress?.postalCode,
      projectData?.shippingAddress?.postalCode,
      editableData?.zip,
      projectData?.zip,
      editableData?.postalCode,
      projectData?.postalCode,
      editableData?.customerInfo?.postalCode,
      projectData?.customerInfo?.postalCode
    ),
    val(
      editableData?.shippingAddress?.country,
      projectData?.shippingAddress?.country,
      editableData?.country,
      projectData?.country,
      editableData?.customerInfo?.country,
      projectData?.customerInfo?.country
    ),
  ].filter(Boolean);

  const shippingAddress = shippingAddressParts.length
    ? shippingAddressParts.join(', ')
    : '—';

  const contactPreference =
    val(
      storyEngineData?.questionnaireMapped?.consultationContactMethod,
      editableData?.consultationContactMethod,
      projectData?.consultationContactMethod,
      editableData?.preferredContactMethod,
      projectData?.preferredContactMethod
    ) || '—';

  const projectSummaryItems = [
    { label: 'Project ID', value: projectData?.id || '—' },
    {
      label: 'Artisan Line',
      value:
        val(
          editableData?.artisanLine,
          projectData?.artisanLine,
          editableData?.series,
          projectData?.series,
          editableData?.line,
          projectData?.line
        ) || '—',
    },
    {
      label: 'Serial',
      value:
        val(
          editableData?.lineSerial,
          projectData?.lineSerial,
          editableData?.serial,
          projectData?.serial,
          editableData?.serialNumber,
          projectData?.serialNumber
        ) || '—',
    },
    { label: 'Status', value: status || '—' },
    { label: 'Current Chapter', value: currentPhaseLabel || '—' },
    { label: 'Progress', value: `${weightedProgress || 0}%` },
    {
      label: 'Workflow Readiness',
      value: projectReadiness.buildWorkflowUnlocked ? 'Ready' : 'Locked',
    },
    { label: 'Portal Status', value: topbarPortalLabel || '—' },
    {
      label: 'Total Logged Time',
      value: formatFullTime(calculateProjectTotalTime(editableData)),
    },
  ];

  const customerDetailItems = [
    { label: 'Customer Name', value: customerName },
    { label: 'Customer Email', value: customerEmail },
    { label: 'Phone', value: customerPhone },
    { label: 'Contact Preference', value: contactPreference },
    { label: 'Linked User', value: linkedUserStatus || 'Not linked' },
    { label: 'Shipping Address', value: shippingAddress, wide: true },
  ];

  return (
    <section className="mpm-surface mpm-tab-shell mpm-project-details-shell">
      <div className="mpm-tab-section-header mpm-project-details-header">
        <div>
          <div className="mpm-tab-kicker">Overview</div>
          <h3 className="mpm-tab-title">Project details</h3>
          <p className="mpm-tab-subtitle">
            Keep project status and build-facing details separate from customer
            identity and contact information.
          </p>
        </div>
      </div>

      <div className="mpm-project-details-grid">
        <div className="mpm-project-details-panel">
          <div className="mpm-project-details-panel-head">
            <div className="mpm-project-details-panel-kicker">
              Project Summary
            </div>
            <h4 className="mpm-project-details-panel-title">
              Build and workflow details
            </h4>
            <p className="mpm-project-details-panel-copy">
              Core project identity, status, progress, and portal readiness.
            </p>
          </div>

          <div className="mpm-project-details-stats-grid">
            {projectSummaryItems.map((item) => (
              <div
                key={item.label}
                className={`mpm-project-stat-card ${
                  item.wide ? 'mpm-project-stat-card-wide' : ''
                }`}
              >
                <span className="mpm-project-stat-label">{item.label}</span>
                <strong className="mpm-project-stat-value">
                  {item.value || '—'}
                </strong>
              </div>
            ))}
          </div>
        </div>

        <div className="mpm-project-details-panel">
          <div className="mpm-project-details-panel-head">
            <div className="mpm-project-details-panel-kicker">
              Customer Details
            </div>
            <h4 className="mpm-project-details-panel-title">
              Contact and portal access
            </h4>
            <p className="mpm-project-details-panel-copy">
              Customer-facing identity, contact details, and linked account
              info.
            </p>
          </div>

          <div className="mpm-project-details-stats-grid mpm-project-details-stats-grid-customer">
            {customerDetailItems.map((item) => (
              <div
                key={item.label}
                className={`mpm-project-stat-card ${
                  item.wide ? 'mpm-project-stat-card-wide' : ''
                }`}
              >
                <span className="mpm-project-stat-label">{item.label}</span>
                <strong className="mpm-project-stat-value">
                  {item.value || '—'}
                </strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {!!projectReadiness.blockers.length && (
        <div className="mpm-project-details-blockers">
          <div className="mpm-tab-kicker">Current Blockers</div>
          <h4 className="mpm-tab-title">What still needs attention</h4>
          <div className="mpm-build-locked-list" style={{ marginTop: 12 }}>
            {projectReadiness.blockers.map((blocker) => (
              <div key={blocker} className="mpm-build-locked-item">
                {blocker}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default ProjectDetailsSection;