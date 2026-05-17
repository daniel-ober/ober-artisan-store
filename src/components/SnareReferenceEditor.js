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

  modelNum: ['identification.modelNumber'],

  imgUrl: ['imgUrl', 'sources.imageUrl'],

  drumType: ['shell.drumType'],

  diameter: ['shell.dimensions.diameterInches'],

  depth: ['shell.dimensions.depthInches'],

  shellConstruction: ['shell.construction.shellConstruction'],

  shellMaterial1: ['shell.construction.shellMaterialPrimary'],

  shellMaterial2: ['shell.construction.shellMaterialSecondary'],

  shellMaterial3: ['shell.construction.shellMaterialTertiary'],

  plyCount: ['shell.construction.plyCount'],

  layupDescription: ['shell.construction.layupDescription'],

  shellThicknessMm: ['shell.construction.shellThicknessMm'],

  thicknessClass: ['shell.construction.thicknessClass'],

  reinforcementRings: ['shell.construction.reinforcementRings'],

  reinforcementRingMaterial: ['shell.construction.reinforcementRingMaterial'],

  reinforcementRingThicknessMm: ['shell.construction.reinforcementRingThicknessMm'],

  bearingEdgeBatter: ['shell.bearingEdges.batterSideProfile'],

  bearingEdgeSnare: ['shell.bearingEdges.snareSideProfile'],

  bearingEdgeRoundover: ['shell.bearingEdges.roundover'],

  bearingEdgeEvidenceLevel: ['shell.bearingEdges.evidenceLevel'],

  bearingEdgeConfidence: ['shell.bearingEdges.confidence'],

  bearingEdgeNotes: ['shell.bearingEdges.notes'],

  snareBedsPresent: ['shell.snareBeds.present'],

  snareBedDepthBucket: ['shell.snareBeds.depthBucket'],

  snareBedWidthBucket: ['shell.snareBeds.widthBucket'],

  snareBedStyle: ['shell.snareBeds.bedStyle'],

  snareBedEvidenceLevel: ['shell.snareBeds.evidenceLevel'],

  snareBedConfidence: ['shell.snareBeds.confidence'],

  snareBedNotes: ['shell.snareBeds.notes'],

  finishName: ['shell.finish.finishName'],

  finishType: ['shell.finish.finishType'],

  exteriorTreatment: ['shell.finish.exteriorTreatment'],

  interiorTreatment: ['shell.finish.interiorTreatment'],

  finishAcousticImpact: ['shell.finish.acousticImpact'],

  finishNotes: ['shell.finish.notes'],

  batterHoopType: ['stockHardware.hoops.batterHoopType'],

  resonantHoopType: ['stockHardware.hoops.resonantHoopType'],

  hoopMaterial: ['stockHardware.hoops.hoopMaterial'],

  hoopThicknessMm: ['stockHardware.hoops.hoopThicknessMm'],

  hoopMassClass: ['stockHardware.hoops.hoopMassClass'],

  hoopFinish: ['stockHardware.hoops.hoopFinish'],

  lugCount: ['stockHardware.lugs.lugCount'],

  lugType: ['stockHardware.lugs.lugType'],

  lugMaterial: ['stockHardware.lugs.lugMaterial'],

  lugMassClass: ['stockHardware.lugs.lugMassClass'],

  lugMountingStyle: ['stockHardware.lugs.lugMountingStyle'],

  hardwareFinish: ['stockHardware.lugs.hardwareFinish'],

  throwOffMake: ['stockHardware.throwOff.make'],

  throwOffModel: ['stockHardware.throwOff.model'],

  throwOffStyle: ['stockHardware.throwOff.style'],

  throwOffNotes: ['stockHardware.throwOff.notes'],

  buttPlateMake: ['stockHardware.buttPlate.make'],

  buttPlateModel: ['stockHardware.buttPlate.model'],

  buttPlateStyle: ['stockHardware.buttPlate.style'],

  snareWireMake: ['stockSnareSystem.snareWires.make'],

  snareWireModel: ['stockSnareSystem.snareWires.model'],

  snareWireStrandCount: ['stockSnareSystem.snareWires.strandCount'],

  snareWireMaterial: ['stockSnareSystem.snareWires.material'],

  snareWireLengthInches: ['stockSnareSystem.snareWires.lengthInches'],

  snareWireStock: ['stockSnareSystem.snareWires.stock'],

  stockBatterHead: ['stockSnareSystem.heads.batterHead'],

  stockResoHead: ['stockSnareSystem.heads.resonantHead'],

  stockHeadsKnown: ['stockSnareSystem.heads.stockHeadsKnown'],

  currentlyInProduction: ['identification.currentlyInProduction'],

  artistSignatureLine: ['identification.artistSignature'],

  productionStatus: ['identification.productionStatus'],

  rareCollectible: ['identification.rareCollectible'],

  badgeStyle: ['identification.badgeStyle'],

  yearIntroduced: ['collectorMetadata.yearIntroduced'],

  yearDiscontinued: ['collectorMetadata.yearDiscontinued'],

  limitedRun: ['collectorMetadata.limitedRun'],

  limitedRunCount: ['collectorMetadata.limitedRunCount'],

  countryOfOrigin: ['collectorMetadata.countryOfOrigin'],

  productionNotes: ['collectorMetadata.productionNotes'],

  sourceConfidence: ['sources.sourceConfidence'],

  primarySourceUrl: ['sources.primarySourceUrl'],

  secondarySourceUrl: ['sources.secondarySourceUrl'],

  secondarySourceUrls: ['sources.secondarySourceUrls'],

  imageUrls: ['sources.imageUrls'],

  notesOnMissingData: ['sources.notesOnMissingData'],

  conflictingSourceNotes: ['sources.conflictingSourceNotes'],

  priceNotes: ['pricing.priceNotes'],

  lastUpdated: ['pricing.lastUpdated'],

  currentNewPrice: ['pricing.currentNewPrice'],

  originalMsrp: ['pricing.originalMsrp'],

  originalRetailPrice: ['pricing.originalRetailPrice'],

  currentUsedPriceLow: ['pricing.currentUsedPriceRange.low'],

  currentUsedPriceHigh: ['pricing.currentUsedPriceRange.high'],

  currentUsedPriceCurrency: ['pricing.currentUsedPriceRange.currency'],

  overallAttackOberScore: ['oberScores.attack'],

  overallBrightnessOberScore: ['oberScores.brightness'],

  overallProjectionOberScore: ['oberScores.projection'],

  overallSustainOberScore: ['oberScores.sustain'],

  overallWarmthOberScore: ['oberScores.warmth'],

  overallSensitivityOberScore: ['oberScores.sensitivity'],

  overallControlOberScore: ['oberScores.control'],

  voiceScoreConfidence: ['oberScores.confidence'],

  scoringBasis: ['oberScores.scoringBasis'],

  projectedShellFundamentalPitch: ['tuning.projectedShellFundamentalPitch'],

  recommendedBatter: ['tuning.recommendedBatter'],

  recommendedReso: ['tuning.recommendedReso'],

  snareFacts: ['snareFacts'],

  shortDescription: ['summary.shortDescription'],

  drumSummaryNotes: ['summary.drumSummaryNotes'],

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

      if (Array.isArray(value)) {

        return value

          .map((item) => {

            if (typeof item === 'string') return item;

            return JSON.stringify(item, null, 2);

          })

          .join('\n');

      }

      return value;

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

    if (!cursor[key] || typeof cursor[key] !== 'object' || Array.isArray(cursor[key])) {

      cursor[key] = {};

    }

    cursor = cursor[key];

  });

};

const setPayloadField = (payload = {}, key = '', value = '') => {

  const primaryPath = FIELD_PATHS[key]?.[0] || key;

  setNestedValue(payload, primaryPath, value);

};

const parseTextareaArray = (value = '') => {

  if (!value) return [];

  return String(value)

    .split('\n')

    .map((line) => line.trim())

    .filter(Boolean);

};

const normalizeValueForSave = ({ field, value }) => {

  if (field?.type === 'number') {

    if (value === '' || value === null || value === undefined) return null;

    const number = Number(value);

    return Number.isFinite(number) ? number : null;

  }

  if (field?.type === 'boolean') {

    if (value === true || value === 'true') return true;

    if (value === false || value === 'false') return false;

    return 'unknown';

  }

  if (field?.type === 'array') {

    return parseTextareaArray(value);

  }

  return value === '' || value === null || value === undefined ? 'unknown' : value;

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

      { key: 'badgeStyle', label: 'Badge Style' },

      { key: 'imgUrl', label: 'Image URL' },

    ],

  },

  {

    title: 'Shell Dimensions',

    fields: [

      { key: 'diameter', label: 'Diameter', type: 'number', step: '0.1' },

      { key: 'depth', label: 'Depth', type: 'number', step: '0.1' },

    ],

  },

  {

    title: 'Shell Construction',

    fields: [

      { key: 'shellConstruction', label: 'Shell Construction' },

      { key: 'shellMaterial1', label: 'Shell Material Primary' },

      { key: 'shellMaterial2', label: 'Shell Material Secondary' },

      { key: 'shellMaterial3', label: 'Shell Material Tertiary' },

      { key: 'plyCount', label: 'Ply Count', type: 'number', step: '1' },

      { key: 'layupDescription', label: 'Layup Description' },

      { key: 'shellThicknessMm', label: 'Shell Thickness mm', type: 'number', step: '0.1' },

      { key: 'thicknessClass', label: 'Thickness Class' },

      { key: 'reinforcementRings', label: 'Reinforcement Rings', type: 'boolean' },

      { key: 'reinforcementRingMaterial', label: 'Re-Ring Material' },

      { key: 'reinforcementRingThicknessMm', label: 'Re-Ring Thickness mm', type: 'number', step: '0.1' },

    ],

  },

  {

    title: 'Bearing Edges',

    fields: [

      { key: 'bearingEdgeBatter', label: 'Batter Side Profile' },

      { key: 'bearingEdgeSnare', label: 'Snare Side Profile' },

      { key: 'bearingEdgeRoundover', label: 'Roundover' },

      { key: 'bearingEdgeEvidenceLevel', label: 'Evidence Level' },

      { key: 'bearingEdgeConfidence', label: 'Confidence' },

    ],

  },

  {

    title: 'Snare Beds',

    fields: [

      { key: 'snareBedsPresent', label: 'Snare Beds Present', type: 'boolean' },

      { key: 'snareBedDepthBucket', label: 'Depth Bucket' },

      { key: 'snareBedWidthBucket', label: 'Width Bucket' },

      { key: 'snareBedStyle', label: 'Bed Style' },

      { key: 'snareBedEvidenceLevel', label: 'Evidence Level' },

      { key: 'snareBedConfidence', label: 'Confidence' },

    ],

  },

  {

    title: 'Finish',

    fields: [

      { key: 'finishName', label: 'Finish Name' },

      { key: 'finishType', label: 'Finish Type' },

      { key: 'exteriorTreatment', label: 'Exterior Treatment' },

      { key: 'interiorTreatment', label: 'Interior Treatment' },

      { key: 'finishAcousticImpact', label: 'Acoustic Impact' },

    ],

  },

  {

    title: 'Hoops',

    fields: [

      { key: 'batterHoopType', label: 'Batter Hoop Type' },

      { key: 'resonantHoopType', label: 'Resonant Hoop Type' },

      { key: 'hoopMaterial', label: 'Hoop Material' },

      { key: 'hoopThicknessMm', label: 'Hoop Thickness mm', type: 'number', step: '0.1' },

      { key: 'hoopMassClass', label: 'Hoop Mass Class' },

      { key: 'hoopFinish', label: 'Hoop Finish' },

    ],

  },

  {

    title: 'Lugs',

    fields: [

      { key: 'lugCount', label: 'Lug Count', type: 'number', step: '1' },

      { key: 'lugType', label: 'Lug Type' },

      { key: 'lugMaterial', label: 'Lug Material' },

      { key: 'lugMassClass', label: 'Lug Mass Class' },

      { key: 'lugMountingStyle', label: 'Lug Mounting Style' },

      { key: 'hardwareFinish', label: 'Hardware Finish' },

    ],

  },

  {

    title: 'Throw-Off / Butt Plate',

    fields: [

      { key: 'throwOffMake', label: 'Throw-Off Make' },

      { key: 'throwOffModel', label: 'Throw-Off Model' },

      { key: 'throwOffStyle', label: 'Throw-Off Style' },

      { key: 'buttPlateMake', label: 'Butt Plate Make' },

      { key: 'buttPlateModel', label: 'Butt Plate Model' },

      { key: 'buttPlateStyle', label: 'Butt Plate Style' },

    ],

  },

  {

    title: 'Stock Snare System',

    fields: [

      { key: 'snareWireMake', label: 'Snare Wire Make' },

      { key: 'snareWireModel', label: 'Snare Wire Model' },

      { key: 'snareWireStrandCount', label: 'Strand Count', type: 'number', step: '1' },

      { key: 'snareWireMaterial', label: 'Wire Material' },

      { key: 'snareWireLengthInches', label: 'Wire Length Inches', type: 'number', step: '0.1' },

      { key: 'snareWireStock', label: 'Stock Wire Status' },

      { key: 'stockBatterHead', label: 'Stock Batter Head' },

      { key: 'stockResoHead', label: 'Stock Reso Head' },

      { key: 'stockHeadsKnown', label: 'Stock Heads Known', type: 'boolean' },

    ],

  },

  {

    title: 'Production / Collector Metadata',

    fields: [

      { key: 'productionStatus', label: 'Production Status' },

      { key: 'currentlyInProduction', label: 'Currently In Production', type: 'boolean' },

      { key: 'artistSignatureLine', label: 'Artist / Signature Line', type: 'boolean' },

      { key: 'rareCollectible', label: 'Rare / Collectible', type: 'boolean' },

      { key: 'yearIntroduced', label: 'Year Introduced' },

      { key: 'yearDiscontinued', label: 'Year Discontinued' },

      { key: 'limitedRun', label: 'Limited Run' },

      { key: 'limitedRunCount', label: 'Limited Run Count' },

      { key: 'countryOfOrigin', label: 'Country Of Origin' },

    ],

  },

  {

    title: 'Pricing',

    fields: [

      { key: 'originalMsrp', label: 'Original MSRP' },

      { key: 'originalRetailPrice', label: 'Original Retail Price' },

      { key: 'currentNewPrice', label: 'Current New Price' },

      { key: 'currentUsedPriceLow', label: 'Used Price Low' },

      { key: 'currentUsedPriceHigh', label: 'Used Price High' },

      { key: 'currentUsedPriceCurrency', label: 'Used Price Currency' },

      { key: 'lastUpdated', label: 'Pricing Last Updated' },

    ],

  },

  {

    title: 'Sources',

    fields: [

      { key: 'sourceConfidence', label: 'Source Confidence' },

      { key: 'primarySourceUrl', label: 'Primary Source URL' },

      { key: 'secondarySourceUrl', label: 'Secondary Source URL' },

    ],

  },

];

const TEXTAREA_FIELDS = [

  { key: 'bearingEdgeNotes', label: 'Bearing Edge Notes' },

  { key: 'snareBedNotes', label: 'Snare Bed Notes' },

  { key: 'finishNotes', label: 'Finish Notes' },

  { key: 'throwOffNotes', label: 'Throw-Off Notes' },

  { key: 'productionNotes', label: 'Production Notes' },

  { key: 'priceNotes', label: 'Price Notes' },

  { key: 'notesOnMissingData', label: 'Notes On Missing Data', type: 'array' },

  { key: 'conflictingSourceNotes', label: 'Conflicting Source Notes', type: 'array' },

  { key: 'secondarySourceUrls', label: 'Secondary Source URLs', type: 'array' },

  { key: 'snareFacts', label: 'Snare Facts', type: 'array' },

  { key: 'scoringBasis', label: 'Scoring Basis' },

  { key: 'shortDescription', label: 'Short Description' },

  { key: 'drumSummaryNotes', label: 'Drum Summary Notes' },

  { key: 'description', label: 'Description' },

];

const TUNING_FIELDS = [

  { key: 'projectedShellFundamentalPitch', label: 'Projected Shell Fundamental Pitch' },

  { key: 'recommendedBatter', label: 'Recommended Batter' },

  { key: 'recommendedReso', label: 'Recommended Reso' },

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

const SnareReferenceEditor = ({

  drum,

  isSaving = false,

  onSave,

  onResearch,

  researchNeeds = null,

}) => {

  const [isOpen, setIsOpen] = useState(false);

  const [form, setForm] = useState(() => getInitialForm(drum));

  const [lastSavedSnapshot, setLastSavedSnapshot] = useState(() => getInitialForm(drum));

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

      setPayloadField(

        payload,

        field.key,

        normalizeValueForSave({ field, value: form[field.key] })

      );

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

      setPayloadField(payload, field.key, Number.isFinite(number) ? number : null);

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

                    {field.type === 'boolean' ? (

                      <select

                        value={String(form[field.key] ?? 'unknown')}

                        onChange={(event) =>

                          updateField(field.key, event.target.value)

                        }

                      >

                        <option value="unknown">unknown</option>

                        <option value="true">true</option>

                        <option value="false">false</option>

                      </select>

                    ) : (

                      <input

                        type={field.type || 'text'}

                        step={field.step}

                        value={form[field.key] ?? ''}

                        onChange={(event) =>

                          updateField(field.key, event.target.value)

                        }

                      />

                    )}

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

              <h5>Descriptions, Notes & Arrays</h5>

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