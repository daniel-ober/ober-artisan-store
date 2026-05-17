import React, { useEffect, useMemo, useState } from 'react';

import './SnareReferenceEditor.css';

const VOICE_SCORE_FIELDS = [

  { key: 'overallAttackOberScore', label: 'Attack' },

  { key: 'overallBrightnessOberScore', label: 'Brightness' },

  { key: 'overallProjectionOberScore', label: 'Projection' },

  { key: 'overallSustainOberScore', label: 'Sustain' },

  { key: 'overallWarmthOberScore', label: 'Warmth' },

  { key: 'overallSensitivityOberScore', label: 'Sensitivity' },

  { key: 'overallControlOberScore', label: 'Control' },

];

const FIELD_PATHS = {

  companyName: ['companyName'],

  companyType: ['companyType'],

  lineSeries: ['lineSeries'],

  modelName: ['modelName'],

  title: ['title'],

  modelNum: ['identification.modelNumber', 'production.modelNum', 'modelNum'],

  imgUrl: ['imgUrl', 'sources.imageUrl'],

  drumType: ['shell.drumType', 'drumType'],

  diameter: ['shell.dimensions.diameterInches', 'diameter', 'diameterInches'],

  depth: ['shell.dimensions.depthInches', 'depth', 'depthInches'],

  shellConstruction: [

    'shell.construction.shellConstruction',

    'shell.construction',

    'shellConstruction',

  ],

  normalizedShellConstruction: [

    'shell.construction.shellConstruction',

    'shell.normalizedConstruction',

    'shell.normalizedShellConstruction',

    'normalizedShellConstruction',

  ],

  shellMaterial1: [

    'shell.construction.shellMaterialPrimary',

    'shell.material1',

    'shellMaterial1',

  ],

  shellMaterial2: [

    'shell.construction.shellMaterialSecondary',

    'shell.material2',

    'shellMaterial2',

  ],

  shellMaterial3: [

    'shell.construction.shellMaterialTertiary',

    'shell.material3',

    'shellMaterial3',

  ],

  plyCountLayup: [

    'shell.construction.layupDescription',

    'shell.plyCountLayup',

    'plyCountLayup',

  ],

  shellThicknessMm: [

    'shell.construction.shellThicknessMm',

    'shell.thicknessMm',

    'shellThicknessMm',

  ],

  reinforcementRings: [

    'shell.construction.reinforcementRings',

    'shell.reinforcementRings',

    'reinforcementRings',

  ],

  bearingEdge: [

    'shell.bearingEdges.batterSideProfile',

    'shell.bearingEdge',

    'bearingEdge',

  ],

  snareBedType: [

    'shell.snareBeds.depthBucket',

    'shell.snareBeds.bedStyle',

    'shell.snareBedType',

    'snareBedType',

  ],

  finishType: ['shell.finish.finishType', 'shell.finishType', 'finishType'],

  hoopRimType: [

    'stockHardware.hoops.batterHoopType',

    'hardware.hoopRimType',

    'shell.hoopRimType',

    'hoopRimType',

  ],

  lugCount: ['stockHardware.lugs.lugCount', 'hardware.lugCount', 'lugCount'],

  lugType: ['stockHardware.lugs.lugType', 'hardware.lugType', 'lugType'],

  hardwareFinish: [

    'stockHardware.lugs.hardwareFinish',

    'hardware.hardwareFinish',

    'hardwareFinish',

  ],

  snareThrowMakeModel: [

    'stockHardware.throwOff.model',

    'stockHardware.throwOff.make',

    'hardware.snareThrowMakeAndModel',

    'hardware.snareThrowMakeModel',

    'snareThrowMakeAndModel',

    'snareThrowMakeModel',

  ],

  stockSnareWires: [

    'stockSnareSystem.snareWires.model',

    'stockSnareSystem.snareWires.make',

    'hardware.stockSnareWires',

    'stockSnareWires',

  ],

  stockBatterHead: [

    'stockSnareSystem.heads.batterHead',

    'hardware.stockBatterHead',

    'stockBatterHead',

  ],

  stockResoHead: [

    'stockSnareSystem.heads.resonantHead',

    'hardware.stockResoHead',

    'stockResoHead',

  ],

  currentlyInProduction: [

    'identification.currentlyInProduction',

    'production.currentlyInProduction',

    'currentlyInProduction',

  ],

  artistSignatureLine: [

    'identification.artistSignature',

    'production.artistSignatureLine',

    'artistSignatureLine',

  ],

  discontinued: [

    'identification.discontinued',

    'production.discontinued',

    'discontinued',

  ],

  rareCollectible: [

    'identification.rareCollectible',

    'production.rareCollectible',

    'rareCollectible',

  ],

  yearInProduction: [

    'collectorMetadata.yearIntroduced',

    'production.yearInProduction',

    'yearInProduction',

  ],

  yearDiscontinued: [

    'collectorMetadata.yearDiscontinued',

    'production.yearDiscontinued',

    'yearDiscontinued',

  ],

  voiceScoreConfidence: [

    'sourceAudit.voiceScoreConfidence',

    'oberScores.confidence',

    'voiceScoreConfidence',

  ],

  sourceConfidence: ['sources.sourceConfidence', 'sourceConfidence'],

  primarySourceUrl: ['sources.primarySourceUrl', 'primarySourceUrl'],

  secondarySourceUrl: [

    'secondarySourceUrl',

    'sources.secondarySourceUrl',

  ],

  overallAttackOberScore: ['oberScores.attack', 'overallAttackOberScore'],

  overallBrightnessOberScore: [

    'oberScores.brightness',

    'overallBrightnessOberScore',

  ],

  overallProjectionOberScore: [

    'oberScores.projection',

    'overallProjectionOberScore',

  ],

  overallSustainOberScore: ['oberScores.sustain', 'overallSustainOberScore'],

  overallWarmthOberScore: ['oberScores.warmth', 'overallWarmthOberScore'],

  overallSensitivityOberScore: [

    'oberScores.sensitivity',

    'overallSensitivityOberScore',

  ],

  overallControlOberScore: ['oberScores.control', 'overallControlOberScore'],

  projectedShellFundamentalPitch: [

    'tuning.projectedShellFundamentalPitch',

    'projectedShellFundamentalPitch',

  ],

  projectedShellFundamentalHz: [

    'tuning.projectedShellFundamentalHz',

    'projectedShellFundamentalHz',

  ],

  recommendedBatterHz: ['tuning.recommendedBatterHz', 'recommendedBatterHz'],

  recommendedBatterNote: ['tuning.recommendedBatterNote', 'recommendedBatterNote'],

  recommendedResoHz: ['tuning.recommendedResoHz', 'recommendedResoHz'],

  recommendedResoNote: ['tuning.recommendedResoNote', 'recommendedResoNote'],

  scoringBasis: ['summary.drumSummaryNotes', 'oberScores.scoringBasis', 'scoringBasis'],

  notesOnMissingData: ['sources.notesOnMissingData', 'notes.missingData', 'notesOnMissingData'],

  drumSummaryNotes: ['summary.shortDescription', 'notes.summary', 'drumSummaryNotes'],

  description: ['description'],

};

const getNestedValue = (source = {}, path = '') => {

  if (!path) return '';

  return path.split('.').reduce((acc, key) => {

    if (acc === undefined || acc === null) return '';

    return acc[key];

  }, source);

};

const getFieldValue = (source = {}, key = '') => {

  const paths = FIELD_PATHS[key] || [key];

  for (const path of paths) {

    const value = getNestedValue(source, path);

    if (value !== undefined && value !== null && value !== '') {

      return Array.isArray(value) ? value.join('\n') : value;

    }

  }

  return '';

};

const setNestedValue = (target = {}, path = '', value = '') => {

  const keys = path.split('.');

  if (keys.length === 1) {

    target[path] = value;

    return;

  }

  let cursor = target;

  keys.forEach((key, index) => {

    const isLast = index === keys.length - 1;

    if (isLast) {

      cursor[key] = value;

      return;

    }

    if (!cursor[key] || typeof cursor[key] !== 'object') {

      cursor[key] = {};

    }

    cursor = cursor[key];

  });

};

const setPayloadField = (payload = {}, key = '', value = '') => {

  const primaryPath = FIELD_PATHS[key]?.[0] || key;

  setNestedValue(payload, primaryPath, value);

};

const TEXT_FIELD_GROUPS = [

  {

    title: 'Basic Info',

    fields: [

      { key: 'companyName', label: 'Company Name' },

      { key: 'companyType', label: 'Company Type' },

      { key: 'lineSeries', label: 'Line / Series' },

      { key: 'modelName', label: 'Model Name' },

      { key: 'title', label: 'Title' },

      { key: 'drumType', label: 'Drum Type' },

      { key: 'modelNum', label: 'Model Number' },

      { key: 'imgUrl', label: 'Image URL' },

    ],

  },

  {

    title: 'Size & Shell Specs',

    fields: [

      { key: 'diameter', label: 'Diameter', type: 'number', step: '0.1' },

      { key: 'depth', label: 'Depth', type: 'number', step: '0.1' },

      { key: 'shellConstruction', label: 'Shell Construction' },

      { key: 'normalizedShellConstruction', label: 'Normalized Shell Construction' },

      { key: 'shellMaterial1', label: 'Shell Material 1' },

      { key: 'shellMaterial2', label: 'Shell Material 2' },

      { key: 'shellMaterial3', label: 'Shell Material 3' },

      { key: 'plyCountLayup', label: 'Ply Count / Layup' },

      { key: 'shellThicknessMm', label: 'Shell Thickness mm', type: 'number', step: '0.1' },

      { key: 'reinforcementRings', label: 'Reinforcement Rings' },

      { key: 'bearingEdge', label: 'Bearing Edge' },

      { key: 'snareBedType', label: 'Snare Bed Type' },

      { key: 'finishType', label: 'Finish Type' },

    ],

  },

  {

    title: 'Hardware & Stock Setup',

    fields: [

      { key: 'hoopRimType', label: 'Hoop / Rim Type' },

      { key: 'lugCount', label: 'Lug Count', type: 'number', step: '1' },

      { key: 'lugType', label: 'Lug Type' },

      { key: 'hardwareFinish', label: 'Hardware Finish' },

      { key: 'snareThrowMakeModel', label: 'Snare Throw Make / Model' },

      { key: 'stockSnareWires', label: 'Stock Snare Wires' },

      { key: 'stockBatterHead', label: 'Stock Batter Head' },

      { key: 'stockResoHead', label: 'Stock Reso Head' },

    ],

  },

  {

    title: 'Production / Source Metadata',

    fields: [

      { key: 'currentlyInProduction', label: 'Currently In Production' },

      { key: 'artistSignatureLine', label: 'Artist / Signature Line' },

      { key: 'discontinued', label: 'Discontinued' },

      { key: 'rareCollectible', label: 'Rare / Collectible' },

      { key: 'yearInProduction', label: 'Year In Production' },

      { key: 'yearDiscontinued', label: 'Year Discontinued' },

      { key: 'voiceScoreConfidence', label: 'Voice Score Confidence' },

      { key: 'sourceConfidence', label: 'Source Confidence' },

      { key: 'primarySourceUrl', label: 'Primary Source URL' },

      { key: 'secondarySourceUrl', label: 'Secondary Source URL' },

    ],

  },

];

const TEXTAREA_FIELDS = [

  { key: 'description', label: 'Description' },

  { key: 'scoringBasis', label: 'Scoring Basis' },

  { key: 'notesOnMissingData', label: 'Notes On Missing Data' },

  { key: 'drumSummaryNotes', label: 'Drum Summary Notes' },

];

const TUNING_FIELDS = [

  { key: 'projectedShellFundamentalPitch', label: 'Projected Shell Fundamental Pitch' },

  { key: 'projectedShellFundamentalHz', label: 'Projected Shell Fundamental Hz', type: 'number', step: '1' },

  { key: 'recommendedBatterHz', label: 'Recommended Batter Hz', type: 'number', step: '1' },

  { key: 'recommendedBatterNote', label: 'Recommended Batter Note' },

  { key: 'recommendedResoHz', label: 'Recommended Reso Hz', type: 'number', step: '1' },

  { key: 'recommendedResoNote', label: 'Recommended Reso Note' },

];

const getInitialForm = (drum = {}) => {

  const form = {};

  TEXT_FIELD_GROUPS.forEach((group) => {

    group.fields.forEach((field) => {

      form[field.key] = getFieldValue(drum, field.key);

    });

  });

  TEXTAREA_FIELDS.forEach((field) => {

    form[field.key] = getFieldValue(drum, field.key);

  });

  TUNING_FIELDS.forEach((field) => {

    form[field.key] = getFieldValue(drum, field.key);

  });

  VOICE_SCORE_FIELDS.forEach((field) => {

    form[field.key] = getFieldValue(drum, field.key);

  });

  return form;

};

const normalizeValueForSave = ({ field, value }) => {

  if (field?.type === 'number') {

    if (value === '' || value === null || value === undefined) return '';

    const number = Number(value);

    return Number.isFinite(number) ? number : '';

  }

  return value;

};

const SnareReferenceEditor = ({

  drum,

  isSaving = false,

  onSave,

  onResearch,

  researchNeeds = null,

}) => {

  const [isOpen, setIsOpen] = useState(false);

  const [form, setForm] = useState(() => getInitialForm(drum));

  const [lastSavedSnapshot, setLastSavedSnapshot] = useState(() =>

    getInitialForm(drum)

  );

  useEffect(() => {

    const nextForm = getInitialForm(drum);

    setForm(nextForm);

    setLastSavedSnapshot(nextForm);

    setIsOpen(false);

  }, [drum]);

  const hasChanges = useMemo(() => {

    return JSON.stringify(form) !== JSON.stringify(lastSavedSnapshot);

  }, [form, lastSavedSnapshot]);

  const updateField = (key, value) => {

    setForm((current) => ({

      ...current,

      [key]: value,

    }));

  };

  const buildSavePayload = () => {

    const payload = {};

    TEXT_FIELD_GROUPS.forEach((group) => {

      group.fields.forEach((field) => {

        setPayloadField(

          payload,

          field.key,

          normalizeValueForSave({ field, value: form[field.key] })

        );

      });

    });

    TEXTAREA_FIELDS.forEach((field) => {

      setPayloadField(payload, field.key, form[field.key] || '');

    });

    TUNING_FIELDS.forEach((field) => {

      setPayloadField(

        payload,

        field.key,

        normalizeValueForSave({ field, value: form[field.key] })

      );

    });

    VOICE_SCORE_FIELDS.forEach((field) => {

      const number = Number(form[field.key]);

      setPayloadField(payload, field.key, Number.isFinite(number) ? number : '');

    });

    return payload;

  };

  const handleSave = async () => {

    if (!onSave) return;

    const payload = buildSavePayload();

    await onSave(payload);

    setLastSavedSnapshot(form);

  };

  const handleReset = () => {

    setForm(lastSavedSnapshot);

  };

  if (!drum) return null;

  return (

    <section className="snare-reference-editor">

      <div className="snare-reference-editor__header">

        <div>

          <p className="snare-reference-editor__overline">Firestore editor</p>

          <h4>Edit selected snare reference</h4>

          <span>

            Update specs, source details, image URL, stock setup, and Ober

            seven-node scores for this Firestore document.

          </span>

        </div>

        <div className="snare-reference-editor__actions">

          {hasChanges && (

            <span className="snare-reference-editor__dirty">

              Unsaved changes

            </span>

          )}

          {onResearch && (

            <button

              type="button"

              className="snare-reference-editor__button research"

              onClick={onResearch}

            >

              Research This Drum

            </button>

          )}

          <button

            type="button"

            className="snare-reference-editor__button secondary"

            onClick={() => setIsOpen((current) => !current)}

          >

            {isOpen ? 'Close Editor' : 'Edit Snare Data'}

          </button>

        </div>

      </div>

      {researchNeeds?.needsResearch && (

        <div className="snare-reference-editor__research-panel">

          <div>

            <p className="snare-reference-editor__overline">

              Research Needed

            </p>

            <strong>

              {researchNeeds.missingFields?.length || 0} incomplete fields found

            </strong>

            <span>

              This drum has missing or unknown source/spec data. Use Research

              This Drum to start the confirmation workflow.

            </span>

          </div>

          {!!researchNeeds.missingFields?.length && (

            <div className="snare-reference-editor__research-list">

              {researchNeeds.missingFields.map((field) => (

                <span key={field.key}>

                  <b>{field.label}</b>

                  {field.reason}

                </span>

              ))}

            </div>

          )}

        </div>

      )}

      {isOpen && (

        <div className="snare-reference-editor__body">

          {form.imgUrl && (

            <div className="snare-reference-editor__image-preview">

              <img src={form.imgUrl} alt={form.modelName || 'Snare drum'} />

              <div>

                <strong>{form.modelName || 'Unnamed Snare'}</strong>

                <span>

                  {form.companyName || 'Unknown Company'} · {form.diameter || '?'}

                  x{form.depth || '?'}

                </span>

              </div>

            </div>

          )}

          {TEXT_FIELD_GROUPS.map((group) => (

            <section key={group.title} className="snare-reference-editor__group">

              <div className="snare-reference-editor__group-heading">

                <h5>{group.title}</h5>

              </div>

              <div className="snare-reference-editor__grid">

                {group.fields.map((field) => (

                  <label

                    key={field.key}

                    className="snare-reference-editor__field"

                  >

                    <span>{field.label}</span>

                    <input

                      type={field.type || 'text'}

                      step={field.step}

                      value={form[field.key] ?? ''}

                      onChange={(event) =>

                        updateField(field.key, event.target.value)

                      }

                    />

                  </label>

                ))}

              </div>

            </section>

          ))}

          <section className="snare-reference-editor__group">

            <div className="snare-reference-editor__group-heading">

              <h5>Ober Voice Scores</h5>

              <span>1–10 scale</span>

            </div>

            <div className="snare-reference-editor__score-grid">

              {VOICE_SCORE_FIELDS.map((field) => (

                <label key={field.key} className="snare-reference-editor__score">

                  <span>{field.label}</span>

                  <input

                    type="number"

                    min="1"

                    max="10"

                    step="0.1"

                    value={form[field.key] ?? ''}

                    onChange={(event) =>

                      updateField(field.key, event.target.value)

                    }

                  />

                </label>

              ))}

            </div>

          </section>

          <section className="snare-reference-editor__group">

            <div className="snare-reference-editor__group-heading">

              <h5>LegacyTuning / Frequency</h5>

            </div>

            <div className="snare-reference-editor__grid">

              {TUNING_FIELDS.map((field) => (

                <label

                  key={field.key}

                  className="snare-reference-editor__field"

                >

                  <span>{field.label}</span>

                  <input

                    type={field.type || 'text'}

                    step={field.step}

                    value={form[field.key] ?? ''}

                    onChange={(event) =>

                      updateField(field.key, event.target.value)

                    }

                  />

                </label>

              ))}

            </div>

          </section>

          <section className="snare-reference-editor__group">

            <div className="snare-reference-editor__group-heading">

              <h5>Descriptions & Notes</h5>

            </div>

            <div className="snare-reference-editor__textarea-grid">

              {TEXTAREA_FIELDS.map((field) => (

                <label

                  key={field.key}

                  className="snare-reference-editor__textarea"

                >

                  <span>{field.label}</span>

                  <textarea

                    value={form[field.key] ?? ''}

                    rows={4}

                    onChange={(event) =>

                      updateField(field.key, event.target.value)

                    }

                  />

                </label>

              ))}

            </div>

          </section>

          <div className="snare-reference-editor__footer">

            <button

              type="button"

              className="snare-reference-editor__button secondary"

              onClick={handleReset}

              disabled={!hasChanges || isSaving}

            >

              Reset Changes

            </button>

            <button

              type="button"

              className="snare-reference-editor__button primary"

              onClick={handleSave}

              disabled={!hasChanges || isSaving}

            >

              {isSaving ? 'Saving...' : 'Save Snare Reference'}

            </button>

          </div>

        </div>

      )}

    </section>

  );

};

export default SnareReferenceEditor;