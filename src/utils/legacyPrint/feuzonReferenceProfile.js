// src/utils/legacyPrint/feuzonReferenceProfile.js

import FEUZON_BASELINE from '../../data/legacyPrint/feuzonBaseline.js';

const AXES = [

  'attack',

  'sustain',

  'warmth',

  'projection',

  'brightness',

  'sensitivity',

  'control',

];

const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

const clamp = (value, min = 4, max = 10) => {

  const num = Number(value);

  if (!Number.isFinite(num)) return min;

  return Math.max(min, Math.min(max, num));

};

function normalizeString(value) {

  return String(value || '').trim();

}

function averageAxisDelta(profile = {}, baseline = {}) {

  const deltas = AXES.map((axis) =>

    Math.abs(Number(profile?.[axis] ?? 0) - Number(baseline?.[axis] ?? 0))

  ).filter((n) => Number.isFinite(n));

  if (!deltas.length) return 0;

  return round2(deltas.reduce((sum, n) => sum + n, 0) / deltas.length);

}

function buildReferenceLabel(specs = {}) {

  const width = Number(specs.width || 14);

  const depth = Number(specs.depth || 6);

  const outer = normalizeString(specs.outerSpecies || 'Maple');

  const innerParts = [specs.innerSpecies, specs.secondarySpecies]

    .map((item) => normalizeString(item))

    .filter(Boolean);

  const shellBlend = innerParts.length

    ? `${outer} / ${innerParts.join(' + ')}`

    : outer;

  return `FEUZØN ${width}x${depth} • ${shellBlend}`;

}

function buildReferenceDescription(specs = {}, avgDelta = 0) {

  const hoopType = normalizeString(specs.hoopType || 'Die-Cast');

  const bearingEdge = normalizeString(specs.bearingEdge || 'Balanced Hybrid Edge');

  const snareBedDepth = normalizeString(specs.snareBedDepth || 'Standard');

  const closeness =

    avgDelta <= 0.35

      ? 'very close to the FEUZØN balanced center reference'

      : avgDelta <= 0.8

        ? 'moderately shifted from the FEUZØN balanced center reference'

        : 'meaningfully shifted from the FEUZØN balanced center reference';

  return `This reference profile is ${closeness}, shaped by ${hoopType}, ${bearingEdge}, and ${snareBedDepth} snare-bed behavior.`;

}

function buildConfidence(avgDelta = 0) {

  if (avgDelta <= 0.35) return 0.9;

  if (avgDelta <= 0.55) return 0.84;

  if (avgDelta <= 0.8) return 0.78;

  if (avgDelta <= 1.1) return 0.72;

  return 0.66;

}

export function buildFeuzonReferenceProfile(input = {}) {

  const profile = AXES.reduce((acc, axis) => {

    acc[axis] = round2(

      clamp(

        Number(input?.profile?.[axis] ?? FEUZON_BASELINE.profile?.[axis] ?? 5)

      )

    );

    return acc;

  }, {});

  const avgDelta = averageAxisDelta(profile, FEUZON_BASELINE.profile);

  const confidence01 = buildConfidence(avgDelta);

  return {

    id: 'feuzon-live-reference',

    label: buildReferenceLabel(input),

    shortLabel: 'Live FEUZØN Reference',

    description: buildReferenceDescription(input, avgDelta),

    profile,

    baselineId: FEUZON_BASELINE.id,

    deltaFromBaselineAverage: avgDelta,

    confidence01: round2(confidence01),

    confidencePercent: Math.round(confidence01 * 100),

    notes: [

      'This reference is derived from the active FEUZØN configuration, not from a measured lab recording.',

      'It is intended to compare the current build against the Ober FEUZØN baseline center.',

    ],

  };

}

export default buildFeuzonReferenceProfile;