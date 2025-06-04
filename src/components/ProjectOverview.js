import React, { useEffect, useState } from 'react';
import './ProjectOverview.css';

const ProjectOverview = ({ editableData, isEditing, onEditToggle, handleChange, onSave, onCancel }) => {
  const [overallStatus, setOverallStatus] = useState('Unknown');
  const [secondWood, setSecondWood] = useState(false);

  const woodSpeciesOptions = [
    'Maple',
    'Walnut',
    'Cherry',
    'Birch',
    'Oak',
    'Ash',
    'Mahogany',
    'Bubinga',
    'Purpleheart',
    'Rosewood',
  ];

  const formatDate = (value) => {
    if (!value) return 'N/A';
    if (typeof value === 'string') return new Date(value).toLocaleDateString();
    if (value?.seconds) return new Date(value.seconds * 1000).toLocaleDateString();
    if (value instanceof Date) return value.toLocaleDateString();
    return 'Invalid date';
  };

  const calculateStatus = (data) => {
    const allChecklists = Object.values(data || {}).flatMap((section) =>
      Array.isArray(section?.checklist) ? section.checklist : []
    );
    const total = allChecklists.length;
    const completed = allChecklists.filter((t) => t.completed).length;

    if (total === 0) return 'Unknown';
    if (completed === 0) return 'Initial Planning';
    if (completed === total) return 'Finished';
    return 'In Production';
  };

  useEffect(() => {
    if (editableData) {
      setOverallStatus(calculateStatus(editableData));
    }
  }, [editableData]);

  const renderDropdownField = (label, key, options) => (
    <div className="project-field-row" key={key}>
      <label className="project-label">{label}:</label>
      {isEditing ? (
        <select
          className="project-input"
          value={editableData?.[key] || ''}
          onChange={(e) => handleChange(key, e.target.value)}
        >
          <option value="">-- Select --</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <span className="project-value">
  {typeof editableData?.[key] === 'object'
    ? JSON.stringify(editableData[key])
    : editableData?.[key] || 'N/A'}
</span>
      )}
    </div>
  );

  const renderTextField = (label, key) => (
    <div className="project-field-row" key={key}>
      <label className="project-label">{label}:</label>
      {isEditing ? (
        <input
          className="project-input"
          type="text"
          value={editableData?.[key] || ''}
          onChange={(e) => handleChange(key, e.target.value)}
        />
      ) : (
        <span className="project-value">
  {typeof editableData?.[key] === 'object'
    ? JSON.stringify(editableData[key])
    : editableData?.[key] || 'N/A'}
</span>
      )}
    </div>
  );

  return (
    <div className="project-overview-content">
      <h3 className="project-title">Project Details</h3>
      <div className="project-details">
        <div className="project-field-row">
          {editableData?.id && (
            <p>
              <strong>View as Customer: </strong>
              <a
                href={`/projects/${editableData.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="customer-view-link"
              >
                Open Project View ↗
              </a>
            </p>
          )}
          <label className="project-label">Project ID:</label>
          <span className="project-value">{editableData?.id || 'N/A'}</span>
        </div>

        <div className="project-field-row">
          <label className="project-label">Parent Order ID:</label>
          <a
            className="project-link"
            href={`/orders/${editableData?.orderId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {editableData?.orderId || 'N/A'}
          </a>
        </div>

        <div className="project-field-row">
  <label className="project-label">Start Date:</label>
  {isEditing ? (
    <input
      className="project-input"
      type="date"
      value={
        editableData?.startDate
          ? new Date(editableData.startDate).toISOString().split('T')[0]
          : ''
      }
      onChange={(e) => handleChange('startDate', e.target.value)}
    />
  ) : (
    <span className="project-value">{formatDate(editableData?.startDate)}</span>
  )}
</div>

<div className="project-field-row">
  <label className="project-label">Target Completion:</label>
  {isEditing ? (
    <>
      <input
        className="project-input"
        type="date"
        value={
          editableData?.targetCompletion
            ? new Date(editableData.targetCompletion).toISOString().split('T')[0]
            : ''
        }
        onChange={(e) => handleChange('targetCompletion', e.target.value)}
      />
      <span className="project-value" style={{ marginLeft: '1rem' }}>
        →
        {editableData?.targetCompletion
          ? ` ${new Date(
              new Date(editableData.targetCompletion).getTime() + 14 * 24 * 60 * 60 * 1000
            ).toLocaleDateString()}`
          : ' N/A'}
        {' '} (2-week buffer)
      </span>
    </>
  ) : (
    <span className="project-value">
      {formatDate(editableData?.targetCompletion)} →
      {editableData?.targetCompletion
        ? ` ${new Date(
            new Date(editableData.targetCompletion).getTime() + 14 * 24 * 60 * 60 * 1000
          ).toLocaleDateString()}`
        : ' N/A'}
      {' '} (2-week buffer)
    </span>
  )}
</div>

        {renderDropdownField('Shell Construction', 'shellConstruction', ['stave', 'hybrid', 'steam bent'])}

        {editableData?.shellConstruction === 'stave' || editableData?.shellConstruction === 'hybrid' ? (
          <>
            {renderDropdownField('Quantity Staves', 'staveCount', ['8', '10', '12', '16', '20'])}
            {renderDropdownField('Primary Wood Species', 'woodPrimary', woodSpeciesOptions)}
            {isEditing && (
              <>
                <label className="project-label">Add Second Wood Species?</label>
                <input
                  type="checkbox"
                  checked={secondWood}
                  onChange={() => setSecondWood(!secondWood)}
                />
                {secondWood && (
                  <>
                    {renderDropdownField('Secondary Wood Species', 'woodSecondary', woodSpeciesOptions)}
                    {renderTextField('% of Secondary Wood', 'woodSecondaryPercent')}
                  </>
                )}
              </>
            )}
            {editableData?.shellConstruction === 'hybrid' && renderDropdownField('Steam Bent Wood Species', 'hybridSteamBentSpecies', woodSpeciesOptions)}
          </>
        ) : null}

        {editableData?.shellConstruction === 'steam bent' &&
          renderDropdownField('Steam Bent Wood Species', 'woodPrimary', woodSpeciesOptions)}

        {renderDropdownField('Width (Diameter)', 'width', ['10"', '12"', '13"', '14"', '15"'])}
        {renderDropdownField('Depth', 'shellDepth', ['5"', '5.5"', '6"', '6.5"', '7"', '7.5"', '8"'])}
        {renderDropdownField('Lug Count', 'lugCount', ['5', '6', '8', '10'])}
        {renderDropdownField('Lug Type', 'lugType', ['Single-end point bullet', 'Single-end point tube', 'Double-end tube', 'Other'])}
        {renderDropdownField('Hardware Color', 'hardwareColor', ['Chrome', 'Brass/Gold', 'Black Nickel', 'Other'])}
        {renderDropdownField('Hoops', 'hoops', ['Die-Cast', '2.3mm Triple Flange', '3.0mm Triple Flange'])}
        {renderDropdownField('Reinforcement Rings', 'reinforcementRings', ['Re-Rings', 'None'])}

        {editableData?.reinforcementRings === 'Re-Rings' &&
          renderDropdownField('Re-Rings Wood Species', 'reringsSpecies', woodSpeciesOptions)}

        {renderDropdownField('Throw-off', 'snareThrowOff', [
          'Trick Percussion GS007AM (Multi-Step)',
          'Trick Percussion GS007AS (Single-Step)',
          'Dunnett R5 Swivel',
          'Gibraltar Dunnett R7',
          'Gibraltar George Way Beer Tap',
          'DW MAG',
        ])}
        {renderDropdownField('Snare Wires', 'snareWires', [
          'Puresound Custom',
          'Puresound Custom Pro (Steel)',
          'Puresound Custom Pro (Brass)',
          'Puresound Super 30',
          'Puresound Equalizer',
          'Puresound Blaster',
          'Puresound Twisted',
          'Puresound Concert',
        ])}
        {renderDropdownField('Snare Bed Depth', 'snareBedDepth', ['Low', 'Medium', 'Deep', 'None'])}
        {renderDropdownField('Finish Details', 'finishDetails', [
          'Natural',
          'Veneer (Standard)',
          'Veneer (Exotic)',
          'Stained',
          'Spray',
          'Epoxy',
          'Wrap',
        ])}
        {renderTextField('Additional Notes', 'additionalNotes')}

        <div className="project-buttons">
        <div className="project-buttons">
  {isEditing ? (
    <>
      <button className="save-btn" onClick={onSave}>Save Changes</button>
      <button className="edit-toggle-btn" onClick={onCancel}>Cancel Edit</button>
    </>
  ) : (
    <button className="edit-toggle-btn" onClick={onEditToggle}>Edit</button>
  )}
</div>
        </div>
      </div>
    </div>
  );
};

export default ProjectOverview;