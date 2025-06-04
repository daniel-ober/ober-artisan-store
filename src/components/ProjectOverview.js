import React, { useEffect, useState } from 'react';
import './ProjectOverview.css';

const ProjectOverview = ({
  editableData,
  isEditing,
  onEditToggle,
  handleChange,
  onSave,
  onCancel,
}) => {
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

  const getDateInputValue = (val) => {
    if (!val) return '';
    try {
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val))
        return val;

      let d;
      if (val.toDate) d = val.toDate();
      else if (val.seconds) d = new Date(val.seconds * 1000);
      else d = new Date(val);

      if (isNaN(d)) return '';
      return d.toISOString().split('T')[0]; // returns YYYY-MM-DD
    } catch {
      return '';
    }
  };

  const formatDate = (value) => {
    if (!value) return 'N/A';

    let date;

    if (value.toDate) {
      // Firestore Timestamp
      date = value.toDate();
    } else if (value.seconds) {
      // Firestore Timestamp (alternate)
      date = new Date(value.seconds * 1000);
    } else if (typeof value === 'string') {
      const parsed = new Date(value);
      if (isNaN(parsed)) return 'N/A';
      date = parsed;
    } else if (value instanceof Date) {
      date = value;
    } else {
      return 'N/A';
    }

    // ✅ Local browser timezone rendering
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateStatus = (data) => {
    if (!data || !data.currentPhase) return 'Unknown';

    const phases = [
      'Step 1. Wood Preparation',
      'Step 2. Shell Construction',
      'Step 3. Fine-Tuning',
      'Step 4. Shell Exterior Finish',
      'Step 5. Bearing Edges',
      'Step 6. Snare Bed Cutting',
      'Step 7. Hardware Drilling',
      'Step 8. Hardware Assembly',
      'Step 9. Tuning and Detailing',
      'Step 10. Quality Check',
    ];

    const currentIndex = phases.indexOf(data.currentPhase);

    if (currentIndex === -1) return 'Unknown';
    if (currentIndex === phases.length - 1) return 'Final Check';
    if (currentIndex >= 0 && currentIndex < phases.length - 1)
      return 'In Progress';

    return 'Unknown';
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
            <option key={opt} value={opt}>
              {opt}
            </option>
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
              value={getDateInputValue(editableData?.startDate)}
              onChange={(e) => handleChange('startDate', e.target.value)}
            />
          ) : (
            <span className="project-value">
              {formatDate(editableData?.startDate)}
            </span>
          )}
        </div>

        <div className="project-field-row">
          <label className="project-label">Target Completion:</label>
          {isEditing ? (
            <>
              <input
                className="project-input"
                type="date"
                value={getDateInputValue(editableData?.targetCompletion)}
                onChange={(e) =>
                  handleChange('targetCompletion', e.target.value)
                }
              />
              <span className="project-value" style={{ marginLeft: '1rem' }}>
                →
                {editableData?.targetCompletion
                  ? ` ${new Date(
                      new Date(
                        getDateInputValue(editableData.targetCompletion)
                      ).getTime() +
                        14 * 24 * 60 * 60 * 1000
                    ).toLocaleDateString()}`
                  : ' N/A'}{' '}
                (2-week buffer)
              </span>
            </>
          ) : (
            <span className="project-value">
              {formatDate(editableData?.targetCompletion)} →
              {editableData?.targetCompletion
                ? ` ${new Date(
                    new Date(
                      getDateInputValue(editableData.targetCompletion)
                    ).getTime() +
                      14 * 24 * 60 * 60 * 1000
                  ).toLocaleDateString()}`
                : ' N/A'}{' '}
              (2-week buffer)
            </span>
          )}
        </div>

        {renderDropdownField('Artisan Line', 'artisanLine', [
          'Soundlegend',
          'Heritage',
          'Feuzon Hybrid',
        ])}

        {renderDropdownField('Bearing Edge', 'bearingEdge', [
          'Double 45',
          'Double Rounded',
          '45 Inner + Rounded Outer',
        ])}

        {renderDropdownField('Shell Construction', 'shellConstructionName', [
          'Stave',
          'Hybrid',
          'Steam-bent',
        ])}

        {editableData?.shellConstruction === 'stave' ||
        editableData?.shellConstruction === 'hybrid' ? (
          <>
            {renderDropdownField('Quantity Staves', 'staveCount', [
              '8',
              '10',
              '12',
              '16',
              '20',
            ])}
            {renderDropdownField(
              'Primary Wood Species',
              'woodPrimary',
              woodSpeciesOptions
            )}
            {isEditing && (
              <>
                <label className="project-label">
                  Add Second Wood Species?
                </label>
                <input
                  type="checkbox"
                  checked={secondWood}
                  onChange={() => setSecondWood(!secondWood)}
                />
                {secondWood && (
                  <>
                    {renderDropdownField(
                      'Secondary Wood Species',
                      'woodSecondary',
                      woodSpeciesOptions
                    )}
                    {renderTextField(
                      '% of Secondary Wood',
                      'woodSecondaryPercent'
                    )}
                  </>
                )}
              </>
            )}
            {editableData?.shellConstruction === 'hybrid' &&
              renderDropdownField(
                'Steam Bent Wood Species',
                'hybridSteamBentSpecies',
                woodSpeciesOptions
              )}
          </>
        ) : null}

        {editableData?.shellConstruction === 'steam bent' &&
          renderDropdownField(
            'Steam Bent Wood Species',
            'woodPrimary',
            woodSpeciesOptions
          )}

        {renderDropdownField('Width (Diameter)', 'width', [
          '10"',
          '12"',
          '13"',
          '14"',
          '15"',
        ])}
        {renderDropdownField('Depth', 'shellDepth', [
          '5"',
          '5.5"',
          '6"',
          '6.5"',
          '7"',
          '7.5"',
          '8"',
        ])}
        {renderDropdownField('Lug Count', 'lugCount', ['5', '6', '8', '10'])}
        {renderDropdownField('Lug Type', 'lugType', [
          'Single-end point bullet',
          'Single-end point tube',
          'Double-end tube',
          'Other',
        ])}
        {renderDropdownField('Hardware Color', 'hardwareColor', [
          'Chrome',
          'Brass/Gold',
          'Black Nickel',
          'Other',
        ])}
        {renderDropdownField('Hoops', 'hoops', [
          'Die-Cast',
          '2.3mm Triple Flange',
          '3.0mm Triple Flange',
        ])}
        {renderDropdownField('Reinforcement Rings', 'reinforcementRings', [
          'Yes',
          'None',
        ])}

        {editableData?.reinforcementRings === 'Yes' &&
          renderDropdownField(
            'Re-Rings Wood Species',
            'reringsSpecies',
            woodSpeciesOptions
          )}

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
        {renderDropdownField('Snare Bed Depth', 'snareBedDepth', [
          'Low',
          'Medium',
          'Deep',
          'None',
        ])}
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
                <button className="save-btn" onClick={onSave}>
                  Save Changes
                </button>
                <button className="edit-toggle-btn" onClick={onCancel}>
                  Cancel Edit
                </button>
              </>
            ) : (
              <button className="edit-toggle-btn" onClick={onEditToggle}>
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectOverview;
