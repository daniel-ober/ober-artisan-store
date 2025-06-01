import React from 'react';
import './ProjectOverview.css';

const ProjectOverview = ({
  editableData,
  isEditing,
  handleChange,
  handleMockupUpload,
  handleDocumentUpload,
}) => {
  const formatDate = (value) => {
    if (!value) return 'N/A';
    if (typeof value === 'string') return new Date(value).toLocaleString();
    if (value?.seconds) return new Date(value.seconds * 1000).toLocaleString();
    if (value instanceof Date) return value.toLocaleString();
    return 'Invalid date';
  };

  const woodSpeciesOptions = [
    'Ash', 'Beech', 'Birch', 'Bubinga', 'Cherry', 'Jatoba', 'Kapur', 'Leopardwood',
    'Mahogany', 'Mango', 'Maple', 'Oak', 'Padauk', 'Poplar', 'Purpleheart',
    'Sapele', 'Walnut', 'Other',
  ];

  return (
    <div className="project-overview-content">
      <h3>Project Details</h3>
      <div className="project-details">
        <p><strong>Project ID:</strong> {editableData?.id || 'N/A'}</p>
        <p>
          <strong>Parent Order ID:</strong>{' '}
          {isEditing ? (
            <input
              type="text"
              value={editableData?.orderId || ''}
              onChange={(e) => handleChange('orderId', e.target.value)}
            />
          ) : (
            <a href={`/orders/${editableData?.orderId}`} target="_blank" rel="noopener noreferrer">
              {editableData?.orderId || 'N/A'}
            </a>
          )}
        </p>
        <p><strong>Start Date:</strong> {formatDate(editableData?.startDate)}</p>
        <p><strong>Target Completion:</strong> {formatDate(editableData?.targetCompletion)}</p>
      </div>

      <h3>Artisan Notes</h3>
      <div className="artisan-notes">
        {/* Same artisan fields like artisanLine, shellDepth, woodSpecies, etc. */}
        {/* Use same structure for isEditing logic and editable fields */}
      </div>

      <h3>Customer Details</h3>
      <div className="customer-details">
        {/* Same structure for editable name, email, phone, address */}
      </div>

      <div className="uploads">
        <h3>Uploads</h3>
        <label>
          High Resolution Mockups:
          <input type="file" multiple accept="image/*" onChange={handleMockupUpload} />
        </label>
        <label>
          Documents:
          <input type="file" multiple onChange={handleDocumentUpload} />
        </label>
      </div>
    </div>
  );
};

export default ProjectOverview;