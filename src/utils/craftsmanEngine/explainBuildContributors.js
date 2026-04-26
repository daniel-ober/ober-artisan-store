// src/utils/craftsmanEngine/explainBuildContributors.js

const AXES = [

  'attack',

  'sustain',

  'warmth',

  'projection',

  'brightness',

  'sensitivity',

  'control',

];

const AXIS_LABELS = {

  attack: 'Attack',

  sustain: 'Sustain',

  warmth: 'Warmth',

  projection: 'Projection',

  brightness: 'Brightness',

  sensitivity: 'Sensitivity',

  control: 'Control',

};

const CONTRIBUTOR_LABELS = {

  shellConstruction: 'Shell Construction',

  shellMaterial: 'Shell Material',

  woodSpecies: 'Wood Blend',

  depth: 'Shell Depth',

  diameter: 'Shell Diameter',

  shellThickness: 'Shell Thickness',

  lugQuantity: 'Lug Quantity',

  staveCount: 'Stave Count',

  hoopType: 'Hoop Type',

  hardwareType: 'Hardware Finish',

  finishType: 'Finish Direction',

  bearingEdge: 'Bearing Edge',

  snareBedDepth: 'Snare Bed Depth',

  snareSideHead: 'Snare-Side Head',

  snareWireCount: 'Wire Count',

  snareWireStyle: 'Wire Style',

  snareWireMaterial: 'Wire Material',

  snareResponse: 'Composite Snare Response',

  headType: 'Batter Head Type',

  headTension: 'Head Tension',

  reRings: 'Re-Rings',

};

const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

function getLabel(key) {

  return CONTRIBUTOR_LABELS[key] || key;

}

function scoreInfluence(profile = {}, axis, weight = 1) {

  const axisValue = Number(profile?.[axis] ?? 5);

  return round2((axisValue - 5) * Number(weight || 1));

}

function buildAxisExplanation({ axis, contributors, weights }) {

  const rows = Object.entries(contributors || {})

    .map(([key, profile]) => ({

      key,

      label: getLabel(key),

      rawValue: Number(profile?.[axis] ?? 5),

      influence: scoreInfluence(profile, axis, weights?.[key] ?? 1),

    }))

    .sort((a, b) => Math.abs(b.influence) - Math.abs(a.influence));

  const positive = rows.filter((row) => row.influence > 0.12).slice(0, 3);

  const negative = rows.filter((row) => row.influence < -0.12).slice(0, 3);

  let summary = '';

  if (positive.length && negative.length) {

    summary = `${AXIS_LABELS[axis]} is being pushed upward most by ${positive

      .map((item) => item.label)

      .join(', ')}, while ${negative

      .map((item) => item.label)

      .join(', ')} are keeping it more restrained.`;

  } else if (positive.length) {

    summary = `${AXIS_LABELS[axis]} is being pushed upward most by ${positive

      .map((item) => item.label)

      .join(', ')}.`;

  } else if (negative.length) {

    summary = `${AXIS_LABELS[axis]} is being held back most by ${negative

      .map((item) => item.label)

      .join(', ')}.`;

  } else {

    summary = `${AXIS_LABELS[axis]} is staying relatively centered across the current FEUZØN selection mix.`;

  }

  return {

    axis,

    label: AXIS_LABELS[axis],

    summary,

    positive,

    negative,

    ranked: rows,

  };

}

function buildGlobalSummary(axisExplanations = []) {

  const strongestPositive = axisExplanations

    .flatMap((axis) => axis.positive.map((item) => ({ axis: axis.label, ...item })))

    .sort((a, b) => Math.abs(b.influence) - Math.abs(a.influence))

    .slice(0, 3);

  if (!strongestPositive.length) {

    return 'This FEUZØN build is staying close to center without one contributor overwhelmingly dominating the tonal read.';

  }

  return `The strongest tonal pushes in this FEUZØN build are coming from ${strongestPositive

    .map((item) => `${item.label} on ${item.axis.toLowerCase()}`)

    .join(', ')}.`;

}

export function explainBuildContributors({

  contributors = {},

  weights = {},

} = {}) {

  const byAxis = AXES.reduce((acc, axis) => {

    acc[axis] = buildAxisExplanation({ axis, contributors, weights });

    return acc;

  }, {});

  const axisList = AXES.map((axis) => byAxis[axis]);

  return {

    summary: buildGlobalSummary(axisList),

    byAxis,

    axisList,

  };

}

export default explainBuildContributors;