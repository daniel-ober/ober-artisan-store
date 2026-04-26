// src/data/legacyPrint/buildFeuzonVoiceRead.js

import FEUZON_BASELINE from './feuzonBaseline.js';

import { buildSpecContributors } from '../../utils/aiToneEngine/buildSpecContributors.js';

import { generateCraftsmanSummary } from '../../utils/craftsmanEngine/generateCraftsmanSummary.js';

import { explainBuildContributors } from '../../utils/craftsmanEngine/explainBuildContributors.js';

import buildFeuzonReferenceProfile from '../../utils/legacyPrint/feuzonReferenceProfile.js';

const AXES = [
  'attack',

  'sustain',

  'warmth',

  'projection',

  'brightness',

  'sensitivity',

  'control',
];

const DEFAULT_WEIGHTS = {
  shellConstruction: 1.2,

  shellMaterial: 1.2,

  woodSpecies: 1.15,

  depth: 1.0,

  diameter: 0.95,

  shellThickness: 0.95,

  lugQuantity: 0.72,

  staveCount: 0.7,

  hoopType: 1.0,

  hardwareType: 0.0,

  finishType: 0.28,

  bearingEdge: 1.15,

  snareBedDepth: 0.5,

  snareSideHead: 0.24,

  snareWireCount: 0.18,

  snareWireStyle: 0.16,

  snareWireMaterial: 0.12,

  snareResponse: 0.72,

  headType: 0.25,

  headTension: 0.28,

  reRings: 0.12,
};

const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

function clamp(value, min = 0, max = 10) {
  const num = Number(value);

  if (!Number.isFinite(num)) return min;

  return Math.max(min, Math.min(max, num));
}

function clampAbsoluteVoiceValue(value) {
  return clamp(value, 4, 10);
}

function clampChartValue(value) {
  return clamp(value, 0, 10);
}

function normalizeString(value) {
  return String(value || '').trim();
}

function normalizeDepth(value) {
  const num = Number(value);

  return Number.isFinite(num) ? Number(num.toFixed(1)) : 6.0;
}

function parseStaveCount(staveOption = '') {
  const match = String(staveOption).match(/^(\d+)/);

  return match ? Number(match[1]) : 16;
}

function parseShellThicknessMm(staveOption = '') {
  const match = String(staveOption).match(/-\s*(\d+(?:\.\d+)?)mm/i);

  return match ? Number(match[1]) : 13;
}

function splitInnerStave(innerStave = '') {
  const parts = String(innerStave)
    .split('+')

    .map((item) => item.trim())

    .filter(Boolean);

  return {
    innerSpecies: parts[0] || '',

    secondarySpecies: parts[1] || '',
  };
}

function toSpecs(input = {}) {
  const {
    size = 14,

    depth = 6.0,

    lugs = 8,

    staveOption = '16 - 13mm',

    outerShell = 'Maple',

    innerStave = 'Walnut + Birch',

    hardwareColor = 'Chrome',

    hoopType = 'Die-Cast',

    snareBed = 'Standard',

    bearingEdge = 'Balanced Hybrid Edge',

    finishSystem = 'Natural Gloss',

    scorchStyle = 'scorched',

    stainStyle = 'natural',

    stainColor = 'none',
  } = input;

  const splitInner = splitInnerStave(innerStave);

  const finishLabel =
    finishSystem === 'Natural Gloss' || finishSystem === 'Natural Satin'
      ? `${
          scorchStyle === 'scorched' ? 'Natural Scorched' : 'Non-Scorched'
        } • ${finishSystem}`
      : `${
          scorchStyle === 'scorched' ? 'Natural Scorched' : 'Non-Scorched'
        } • ${stainColor} • ${stainStyle} • ${finishSystem}`;

  return {
    shellFamily: 'wood',

    construction: 'Hybrid',

    width: Number(size),

    depth: normalizeDepth(depth),

    lugQuantity: Number(lugs),

    staveCount: parseStaveCount(staveOption),

    shellThicknessMm: parseShellThicknessMm(staveOption),

    outerSpecies: normalizeString(outerShell),

    innerSpecies: normalizeString(splitInner.innerSpecies),

    secondarySpecies: normalizeString(splitInner.secondarySpecies),

    hoopType: normalizeString(hoopType),

    hardwareType: normalizeString(hardwareColor),

    finish: finishLabel,

    bearingEdge: normalizeString(bearingEdge),

    snareBedDepth: normalizeString(snareBed),

    drumhead: 'Coated',

    tension: 'Medium',

    snareSideHead: 'Standard — 3mil',

    snareWireCount: 20,

    snareWireStyle: 'Standard',

    snareWireMaterial: 'Steel',

    rawSelections: {
      size,

      depth,

      lugs,

      staveOption,

      outerShell,

      innerStave,

      hardwareColor,

      hoopType,

      snareBed,

      bearingEdge,

      finishSystem,

      scorchStyle,

      stainStyle,

      stainColor,
    },
  };
}

const FEUZON_STANDARD_REFERENCE_INPUT = {
  size: 14,

  depth: 6.0,

  lugs: 8,

  staveOption: '16 - 13mm',

  outerShell: 'Maple',

  innerStave: 'Walnut + Birch',

  hardwareColor: 'Chrome',

  hoopType: 'Die-Cast',

  snareBed: 'Standard',

  bearingEdge: 'Balanced Hybrid Edge',

  finishSystem: 'Natural Gloss',

  scorchStyle: 'scorched',

  stainStyle: 'natural',

  stainColor: 'none',
};

function buildStandardReferenceAbsoluteProfile() {
  const standardSpecs = toSpecs(FEUZON_STANDARD_REFERENCE_INPUT);

  const standardContributors = buildSpecContributors(standardSpecs);

  const rawStandardProfile = blendContributorProfiles(
    standardContributors,

    DEFAULT_WEIGHTS
  );

  return applyFeuzonBuilderCalibration(rawStandardProfile, standardSpecs);
}

function shouldUseLockedFeuzonStandardReference(input = {}) {
  return (
    input.benchmarkTypeId === 'feuzon-hybrid-reference' ||
    !input.benchmarkTypeId
  );
}

function blendContributorProfiles(
  contributors = {},
  weights = DEFAULT_WEIGHTS
) {
  const keys = Object.keys(contributors || {}).filter(
    (key) => contributors[key]
  );

  if (!keys.length) {
    return FEUZON_BASELINE.profile;
  }

  return AXES.reduce((acc, axis) => {
    let weightedTotal = 0;

    let weightTotal = 0;

    keys.forEach((key) => {
      const weight = Number(weights[key] ?? 1);

      const axisValue = Number(contributors[key]?.[axis] ?? 5);

      weightedTotal += axisValue * weight;

      weightTotal += weight;
    });

    acc[axis] = round2(
      clampAbsoluteVoiceValue(weightedTotal / (weightTotal || 1))
    );

    return acc;
  }, {});
}

function buildProfileDelta(profile = {}, reference = {}) {
  return AXES.reduce((acc, axis) => {
    acc[axis] = round2(
      Number(profile?.[axis] ?? 0) - Number(reference?.[axis] ?? 0)
    );

    return acc;
  }, {});
}

function getReferenceProfileObject(referenceProfileResult = {}) {
  return (
    referenceProfileResult?.referenceProfile ||
    referenceProfileResult?.profile ||
    referenceProfileResult?.scores ||
    FEUZON_BASELINE.profile
  );
}

function buildReferenceRelativeProfile(
  absoluteProfile = {},

  referenceProfile = {}
) {
  const RELATIVE_MOVEMENT_MULTIPLIER = 1.65;

  const SOFT_CAP_START = 1.35;

  const SOFT_CAP_RATE = 0.38;

  const HARD_CAP = 1.95;

  return AXES.reduce((acc, axis) => {
    const currentValue = Number(absoluteProfile?.[axis] ?? 5);

    const referenceValue = Number(referenceProfile?.[axis] ?? currentValue);

    const rawDelta =
      (currentValue - referenceValue) * RELATIVE_MOVEMENT_MULTIPLIER;

    const absDelta = Math.abs(rawDelta);

    let displayDelta = rawDelta;

    if (absDelta > SOFT_CAP_START) {
      const softened =
        SOFT_CAP_START + (absDelta - SOFT_CAP_START) * SOFT_CAP_RATE;

      displayDelta = Math.sign(rawDelta) * Math.min(softened, HARD_CAP);
    }

    acc[axis] = round2(clampChartValue(5 + displayDelta));

    return acc;
  }, {});
}

const FEUZON_STANDARD_CHART_PROFILE = {
  attack: 5,

  sustain: 5,

  warmth: 5,

  projection: 5,

  brightness: 5,

  sensitivity: 5,

  control: 5,
};

function isFeuzonStandardBuild(specs = {}) {
  const raw = specs.rawSelections || {};

  return (
    String(raw.size) === '14' &&
    normalizeDepth(raw.depth) === 6.0 &&
    String(raw.lugs) === '8' &&
    parseStaveCount(raw.staveOption) === 16 &&
    parseShellThicknessMm(raw.staveOption) === 13 &&
    normalizeString(raw.outerShell) === 'Maple' &&
    normalizeString(raw.innerStave) === 'Walnut + Birch' &&
    normalizeString(raw.hoopType) === 'Die-Cast' &&
    normalizeString(raw.snareBed) === 'Standard' &&
    normalizeString(raw.bearingEdge) === 'Balanced Hybrid Edge' &&
    normalizeString(raw.finishSystem) === 'Natural Gloss' &&
    normalizeString(raw.scorchStyle) === 'scorched'
  );
}

function applyFeuzonBuilderCalibration(profile = {}, specs = {}) {
  const calibrated = { ...profile };

  const width = Number(specs.width || 14);

  const depth = Number(specs.depth || 6);

  const lugs = Number(specs.lugQuantity || 8);

  const staveCount = Number(specs.staveCount || 16);

  const shellThicknessMm = Number(specs.shellThicknessMm || 13);

  const hoopType = normalizeString(specs.hoopType).toLowerCase();

  const bearingEdge = normalizeString(specs.bearingEdge).toLowerCase();

  const snareBedDepth = normalizeString(specs.snareBedDepth).toLowerCase();

  const finish = normalizeString(specs.finish).toLowerCase();

  const outerShell = normalizeString(specs.outerSpecies).toLowerCase();

  const innerSpecies = normalizeString(specs.innerSpecies).toLowerCase();

  const secondarySpecies = normalizeString(
    specs.secondarySpecies
  ).toLowerCase();

  const shellText = `${outerShell} ${innerSpecies} ${secondarySpecies}`;

  const apply = (axis, amount) => {
    calibrated[axis] = round2(
      clampAbsoluteVoiceValue(Number(calibrated[axis] ?? 7) + amount)
    );
  };

  /*

    FEUZØN Standard center:

    14" x 6.0" • 8 lugs • 16 staves • 13mm

    Maple / Walnut + Birch

    Die-Cast hoops

    Balanced Hybrid Edge

    Standard snare bed

    Natural Scorched Gloss

    Hardware finish intentionally has NO tonal effect.

  */

  // Diameter: smaller = tighter/quicker/less body. Larger = broader/more body.

  if (width <= 12) {
    apply('attack', 0.28);

    apply('brightness', 0.22);

    apply('sensitivity', 0.16);

    apply('control', 0.06);

    apply('warmth', -0.26);

    apply('projection', -0.3);

    apply('sustain', -0.16);
  } else if (width === 13) {
    apply('attack', 0.12);

    apply('brightness', 0.08);

    apply('sensitivity', 0.06);

    apply('warmth', -0.1);

    apply('projection', -0.12);

    apply('sustain', -0.06);
  } else if (width >= 15) {
    apply('attack', -0.16);

    apply('brightness', -0.12);

    apply('warmth', 0.2);

    apply('projection', 0.22);

    apply('sustain', 0.14);
  }

  // Depth: shallower = quicker/shorter/less body. Deeper = fuller/longer.

  if (depth <= 5) {
    apply('attack', 0.24);

    apply('brightness', 0.18);

    apply('sensitivity', 0.12);

    apply('control', 0.08);

    apply('warmth', -0.24);

    apply('projection', -0.24);

    apply('sustain', -0.26);
  } else if (depth === 5.5) {
    apply('attack', 0.12);

    apply('brightness', 0.08);

    apply('sensitivity', 0.06);

    apply('warmth', -0.1);

    apply('projection', -0.08);

    apply('sustain', -0.12);
  } else if (depth === 6.5) {
    apply('attack', -0.06);

    apply('brightness', -0.04);

    apply('warmth', 0.1);

    apply('projection', 0.12);

    apply('sustain', 0.1);
  } else if (depth >= 7) {
    apply('attack', -0.18);

    apply('brightness', -0.12);

    apply('sensitivity', -0.08);

    apply('control', -0.08);

    apply('warmth', 0.28);

    apply('projection', 0.28);

    apply('sustain', 0.26);
  }

  // Lug count: fewer = more open. More = more controlled/focused.

  if (lugs <= 6) {
    apply('sustain', 0.12);

    apply('warmth', 0.08);

    apply('control', -0.14);

    apply('attack', -0.08);
  } else if (lugs >= 10) {
    apply('attack', 0.12);

    apply('control', 0.2);

    apply('projection', 0.1);

    apply('sustain', -0.1);
  }

  // Stave count / shell thickness.

  if (staveCount <= 12 || shellThicknessMm <= 10) {
    apply('attack', 0.14);

    apply('sensitivity', 0.12);

    apply('brightness', 0.08);

    apply('control', -0.06);

    apply('warmth', -0.08);

    apply('projection', -0.04);
  } else if (staveCount >= 20 || shellThicknessMm >= 14) {
    apply('attack', 0.08);

    apply('projection', 0.14);

    apply('control', 0.12);

    apply('sustain', -0.08);
  }

  // Hoops: audible, but not cartoon-level.

  if (hoopType.includes('triple')) {
    apply('sustain', 0.28);

    apply('warmth', 0.16);

    apply('sensitivity', 0.1);

    apply('control', -0.34);

    apply('attack', -0.16);

    apply('brightness', -0.08);
  } else if (hoopType.includes('die-cast')) {
    apply('attack', 0.12);

    apply('control', 0.22);

    apply('projection', 0.08);

    apply('sustain', -0.1);
  }

  // Shell material pairing — FEUZØN hybrid voicing.

  if (shellText.includes('walnut') && shellText.includes('mahogany')) {
    apply('warmth', 0.34);

    apply('brightness', -0.22);

    apply('attack', -0.12);

    apply('projection', -0.08);

    apply('sensitivity', 0.08);
  }

  if (shellText.includes('walnut') && shellText.includes('wenge')) {
    apply('warmth', 0.22);

    apply('control', 0.18);

    apply('brightness', -0.14);

    apply('projection', 0.08);
  }

  if (shellText.includes('maple') && shellText.includes('bubinga')) {
    apply('attack', 0.22);

    apply('projection', 0.24);

    apply('control', 0.18);

    apply('warmth', -0.08);
  }

  if (shellText.includes('cherry') && shellText.includes('birch')) {
    apply('attack', 0.18);

    apply('brightness', 0.18);

    apply('projection', 0.14);

    apply('warmth', -0.14);
  }

  if (shellText.includes('padauk') || shellText.includes('ash')) {
    apply('projection', 0.2);

    apply('attack', 0.14);

    apply('brightness', 0.1);

    apply('control', 0.08);
  }

  if (shellText.includes('oak') && shellText.includes('cherry')) {
    apply('control', 0.16);

    apply('attack', 0.1);

    apply('sustain', -0.08);
  }

  // Bearing edge.

  if (bearingEdge.includes('warm')) {
    apply('warmth', 0.5);

    apply('sustain', 0.34);

    apply('sensitivity', 0.14);

    apply('attack', -0.38);

    apply('brightness', -0.38);

    apply('control', -0.14);

    apply('projection', -0.06);
  } else if (
    bearingEdge.includes('modern') ||
    bearingEdge.includes('double 45')
  ) {
    apply('attack', 0.52);

    apply('brightness', 0.46);

    apply('control', 0.24);

    apply('projection', 0.08);

    apply('warmth', -0.34);

    apply('sustain', -0.24);

    apply('sensitivity', -0.08);
  }

  // Snare bed.

  if (snareBedDepth.includes('shallow')) {
    apply('control', 0.14);

    apply('sensitivity', -0.2);

    apply('sustain', -0.08);
  } else if (snareBedDepth.includes('deep')) {
    apply('sensitivity', 0.28);

    apply('sustain', 0.08);

    apply('control', -0.1);
  }

  // Finish: very subtle.

  if (finish.includes('non-scorched')) {
    apply('warmth', 0.06);

    apply('brightness', -0.06);
  }

  if (finish.includes('stained gloss')) {
    apply('brightness', 0.06);

    apply('projection', 0.04);
  }

  if (finish.includes('stained satin')) {
    apply('warmth', 0.06);

    apply('brightness', -0.04);
  }

  return calibrated;
}

function buildToneSummary(profile = {}) {

  const descriptors = [];

  if ((profile.attack || 5) >= 5.5) descriptors.push('a quicker front edge');

  else if ((profile.attack || 5) <= 4.5)

    descriptors.push('a rounder front edge');

  if ((profile.warmth || 5) >= 5.5) descriptors.push('a fuller center');

  else if ((profile.warmth || 5) <= 4.5) descriptors.push('a leaner center');

  if ((profile.brightness || 5) >= 5.5) descriptors.push('more top-end edge');

  else if ((profile.brightness || 5) <= 4.5)

    descriptors.push('a smoother top end');

  if ((profile.sustain || 5) >= 5.5) descriptors.push('a longer note tail');

  else if ((profile.sustain || 5) <= 4.5)

    descriptors.push('a shorter note tail');

  if ((profile.control || 5) >= 5.5) descriptors.push('more focus');

  else if ((profile.control || 5) <= 4.5) descriptors.push('a more open feel');

  if (!descriptors.length) {

    return 'Your current FEUZØN selections sit very close to the selected reference, keeping the overall hybrid response balanced, modern, and centered.';

  }

  if (descriptors.length === 1) {

    return `Your current FEUZØN selections point toward ${descriptors[0]} compared with the selected reference, while keeping the overall shell response layered and modern.`;

  }

  if (descriptors.length === 2) {

    return `Your current FEUZØN selections point toward ${descriptors[0]} and ${descriptors[1]} compared with the selected reference, while keeping the overall shell response layered and modern.`;

  }

  return `Your current FEUZØN selections point toward ${descriptors[0]}, ${descriptors[1]}, and ${descriptors[2]} compared with the selected reference, while keeping the overall shell response layered and modern.`;

}

function buildProjectedVoiceRange(profile = {}) {

  const warmth = Number(profile.warmth ?? 7);

  const brightness = Number(profile.brightness ?? 7);

  const projection = Number(profile.projection ?? 7);

  const weighted =

    3.05 +

    (warmth - 7) * -0.48 +

    (brightness - 7) * 0.62 +

    (projection - 7) * 0.18;

  return Math.max(1.35, Math.min(5, round2(weighted)));

}

function buildPrimaryGenre(profile = {}, specs = {}) {
  const depth = Number(specs.depth || 6);

  const attack = Number(profile.attack || 7);

  const warmth = Number(profile.warmth || 7);

  if (depth <= 5.5 && attack >= 7.8) return 'Pop / funk / session';

  if (depth >= 6.8 && warmth >= 7.2) return 'Rock / alternative / cinematic';

  if (depth >= 7.0 && Number(specs.lugQuantity || 8) >= 10) {
    return 'Rock / modern worship / cinematic session';
  }

  return 'Alternative / session / modern roots';
}

function buildSecondaryGenres(profile = {}, specs = {}) {
  const depth = Number(specs.depth || 6);

  if (depth <= 5.5) return ['Neo-soul', 'Pop session', 'Funk'];

  if (depth >= 6.8) return ['Alternative rock', 'Modern worship', 'Cinematic'];

  if (Number(profile.warmth || 7) >= 7.8) {
    return ['Modern country', 'Roots rock', 'Studio songwriting'];
  }

  return ['Modern country', 'Session work', 'Alt-pop'];
}

function buildRecordingMic(profile = {}, specs = {}) {
  const depth = Number(specs.depth || 6);

  const attack = Number(profile.attack || 7);

  const warmth = Number(profile.warmth || 7);

  if (depth <= 5.5 && attack >= 7.8) {
    return 'Condenser-forward setup for articulation and snap';
  }

  if (depth >= 6.8 && warmth >= 7.2) {
    return 'Dynamic + fuller condenser pairing for body and note shape';
  }

  return 'Balanced condenser or dynamic / condenser blend';
}

function buildPlayingSituation(profile = {}, specs = {}) {
  const hoopType = normalizeString(specs.hoopType).toLowerCase();

  const snareBedDepth = normalizeString(specs.snareBedDepth).toLowerCase();

  if (hoopType.includes('die-cast')) {
    return 'A more focused FEUZØN response with stronger attack, quicker note shape, and firmer containment.';
  }

  if (snareBedDepth.includes('deep')) {
    return 'A more touch-responsive FEUZØN setup that opens up more easily at lower dynamics while staying defined in the center.';
  }

  return 'A balanced FEUZØN response with layered shell tone, strong center impact, and broad tuning flexibility.';
}

function buildFeelRead(profile = {}, specs = {}) {
  const bearingEdge = normalizeString(specs.bearingEdge).toLowerCase();

  const finish = normalizeString(specs.finish).toLowerCase();

  if (bearingEdge.includes('warm')) {
    return 'A warmer, more wood-forward FEUZØN direction with a broader and more seasoned feel under the stick.';
  }

  if (bearingEdge.includes('modern') || bearingEdge.includes('double 45')) {
    return 'A tighter, more modern FEUZØN direction with quicker articulation and stronger front-end definition.';
  }

  if (finish.includes('stained satin')) {
    return 'A darker, more understated finish direction that leans moodier and more organic.';
  }

  if (finish.includes('stained gloss')) {
    return 'A richer stained presentation with stronger visual depth and a more polished look.';
  }

  return 'A hybrid-shell build that leans modern, articulate, and dimensional without giving up body.';
}

function buildHighlightedCharacteristics(profile = {}, specs = {}) {
  const depth = Number(specs.depth || 6);

  const hoopType = normalizeString(specs.hoopType).toLowerCase();

  const snareBed = normalizeString(specs.snareBedDepth).toLowerCase();

  const bearingEdge = normalizeString(specs.bearingEdge).toLowerCase();

  if (depth <= 5.5 && hoopType.includes('die-cast')) {
    return 'A quicker FEUZØN configuration with strong front-end definition, sharper articulation, and a tighter modern crack.';
  }

  if (depth >= 6.8) {
    return 'A deeper FEUZØN build with broader body, richer shell bloom, and more dimensional weight through the full note.';
  }

  if (snareBed.includes('deep')) {
    return 'A more touch-responsive FEUZØN setup with added snare sensitivity and lively ghost-note behavior without losing center impact.';
  }

  if (bearingEdge.includes('warm')) {
    return 'A warmer, broader FEUZØN direction with more shell note, softer front-edge feel, and a more seasoned response.';
  }

  if (bearingEdge.includes('modern') || bearingEdge.includes('double 45')) {
    return 'A tighter, faster FEUZØN direction with stronger articulation, brighter cut, and a more modern precision feel.';
  }

  return 'A hybrid FEUZØN voice with articulate front-end response, layered body, and a modern note shape that still carries depth under the stick.';
}

function buildSpecRead(specs = {}) {
  const scorchLabel =
    normalizeString(specs.rawSelections?.scorchStyle) === 'scorched'
      ? 'Natural scorched'
      : 'Non-scorched';

  return `${specs.width}" x ${specs.depth}" • ${specs.lugQuantity} lugs • ${
    specs.staveCount
  } staves • ${specs.shellThicknessMm}mm • ${specs.outerSpecies} / ${[
    specs.innerSpecies,

    specs.secondarySpecies,
  ]

    .filter(Boolean)

    .join(' + ')} • ${specs.hardwareType} • ${specs.hoopType} • ${
    specs.snareBedDepth
  } snare bed • ${scorchLabel} exterior • ${
    specs.finish
  } • Trick GS007 • ${specs.bearingEdge} • PureSound wires chosen by craftsman • Remo Controlled Sound Coated batter • Remo Ambassador Snare Side`;
}

function softenCompoundExtremes(profile = {}, referenceProfile = {}) {
  const MAX_COMPOUND_DELTA = 1.85;

  return AXES.reduce((acc, axis) => {
    const current = Number(profile?.[axis] ?? 7);

    const reference = Number(referenceProfile?.[axis] ?? current);

    const delta = current - reference;

    const absDelta = Math.abs(delta);

    if (absDelta <= MAX_COMPOUND_DELTA) {
      acc[axis] = round2(clampAbsoluteVoiceValue(current));

      return acc;
    }

    const softenedDelta =
      MAX_COMPOUND_DELTA + (absDelta - MAX_COMPOUND_DELTA) * 0.42;

    acc[axis] = round2(
      clampAbsoluteVoiceValue(reference + Math.sign(delta) * softenedDelta)
    );

    return acc;
  }, {});
}

export function buildFeuzonVoiceRead(input = {}) {
  const specs = toSpecs(input);

  const contributorProfiles = buildSpecContributors(specs);

  const rawAbsoluteProfile = blendContributorProfiles(
    contributorProfiles,

    DEFAULT_WEIGHTS
  );

  const calibratedAbsoluteProfile = applyFeuzonBuilderCalibration(
    rawAbsoluteProfile,

    specs
  );

  const craftsmanSummary = generateCraftsmanSummary(specs);

  const contributorExplanation = explainBuildContributors({
    contributors: contributorProfiles,

    weights: DEFAULT_WEIGHTS,
  });

  const referenceProfile = buildFeuzonReferenceProfile({
    ...specs,

    profile: calibratedAbsoluteProfile,
  });

  const selectedReferenceProfile = shouldUseLockedFeuzonStandardReference(input)
    ? buildStandardReferenceAbsoluteProfile()
    : getReferenceProfileObject(referenceProfile);

  const absoluteProfile = softenCompoundExtremes(
    calibratedAbsoluteProfile,

    selectedReferenceProfile
  );

  const isStandardBuild = isFeuzonStandardBuild(specs);

  const profile = isStandardBuild
    ? FEUZON_STANDARD_CHART_PROFILE
    : buildReferenceRelativeProfile(absoluteProfile, selectedReferenceProfile);

  const deltaFromBaseline = buildProfileDelta(
    absoluteProfile,

    FEUZON_BASELINE.profile
  );

  const deltaFromReference = isStandardBuild
    ? {
        attack: 0,

        sustain: 0,

        warmth: 0,

        projection: 0,

        brightness: 0,

        sensitivity: 0,

        control: 0,
      }
    : buildProfileDelta(absoluteProfile, selectedReferenceProfile);

  const confidenceValues = [
    Number(craftsmanSummary?.confidence01),

    Number(referenceProfile?.confidence01),
  ].filter((n) => Number.isFinite(n));

  const confidence01 = round2(
    confidenceValues.length
      ? confidenceValues.reduce((sum, n) => sum + n, 0) /
          confidenceValues.length
      : 0.72
  );

  return {
    profile,

    absoluteProfile,

    referenceRelativeProfile: profile,

    referenceAbsoluteProfile: selectedReferenceProfile,

    deltaFromBaseline,

    deltaFromReference,

    confidence01,

    confidencePercent: Math.round(confidence01 * 100),

    highlightedCharacteristics: buildHighlightedCharacteristics(
      absoluteProfile,

      specs
    ),

    primaryGenre: buildPrimaryGenre(absoluteProfile, specs),

    secondaryGenres: buildSecondaryGenres(absoluteProfile, specs),

    recordingMic: buildRecordingMic(absoluteProfile, specs),

    playingSituation: buildPlayingSituation(absoluteProfile, specs),

    feelRead: buildFeelRead(absoluteProfile, specs),

    toneSummary: buildToneSummary(profile),

    projectedVoiceRangePosition: buildProjectedVoiceRange(absoluteProfile),

    specRead: buildSpecRead(specs),

    baseline: FEUZON_BASELINE,

    referenceProfile,

    contributors: contributorProfiles,

    contributorExplanation,

    contributorWeights: DEFAULT_WEIGHTS,

    craftsmanSummary,

    recommendationMatrix: craftsmanSummary?.recommendationMatrix || {},

    recommendedSpecs: craftsmanSummary?.recommendedSpecs || {},

    inputSelections: input,

    normalizedSpecs: specs,
  };
}

export default buildFeuzonVoiceRead;
