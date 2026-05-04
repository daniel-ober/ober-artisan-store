// src/utils/legacyPrint/core/buildLegacyPrintRead.js

import buildGenericVoiceProfile from './buildGenericVoiceProfile.js';

import {

  LEGACYPRINT_AXIS_KEYS,

  getLegacyPrintAxisDelta,

  getLegacyPrintProfileMovement,

  getLegacyPrintProfileSpread,

  getSortedLegacyPrintAxes,

  roundLegacyPrintScore,

} from './legacyPrintAxes.js';

function capitalize(value = '') {

  const text = String(value || '').trim();

  if (!text) return '';

  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

}

function formatSpecLine(spec = {}) {

  const material =

    spec.woodSpeciesLabel ||

    spec.material ||

    spec.primarySpecies ||

    spec.metalMaterial ||

    spec.acrylicType ||

    'Shell material';

  const thickness = spec.shellThicknessMm

    ? ` • ${spec.shellThicknessMm}mm shell`

    : '';

  const staveText = spec.staveCount ? ` • ${spec.staveCount} staves` : '';

  return `${spec.width}" x ${spec.depth}" • ${spec.lugQuantity} lugs${staveText}${thickness} • ${capitalize(

    String(material)

  )} • ${spec.hoopType}`;

}

function buildDominantAxisSummary(profile = {}) {

  const sortedAxes = getSortedLegacyPrintAxes(profile);

  const topAxes = sortedAxes.slice(0, 3);

  return topAxes;

}

function buildGenericPlayingSituation(spec = {}, profile = {}) {

  const attackDelta = getLegacyPrintAxisDelta(profile, 'attack');

  const brightnessDelta = getLegacyPrintAxisDelta(profile, 'brightness');

  const projectionDelta = getLegacyPrintAxisDelta(profile, 'projection');

  const sustainDelta = getLegacyPrintAxisDelta(profile, 'sustain');

  const warmthDelta = getLegacyPrintAxisDelta(profile, 'warmth');

  const sensitivityDelta = getLegacyPrintAxisDelta(profile, 'sensitivity');

  const controlDelta = getLegacyPrintAxisDelta(profile, 'control');

  const family = String(spec.shellFamily || '').toLowerCase();

  const construction = String(spec.constructionType || spec.construction || '')

    .toLowerCase()

    .replace(/-/g, ' ');

  if (family === 'metal' && brightnessDelta >= 0.35 && projectionDelta >= 0.35) {

    return 'A forward metal-shell read with stronger cut, clearer top-end, and more room throw than a centered wood reference.';

  }

  if (family === 'acrylic' && projectionDelta >= 0.35) {

    return 'A modern acrylic read with immediate presence, strong projection, and a clearer, less wood-heavy center.';

  }

  if (construction.includes('steam') && sustainDelta >= 0.35) {

    return 'An open steam-bent read with more continuous shell bloom, touch response, and organic note length.';

  }

  if (construction.includes('stave') && warmthDelta >= 0.25 && controlDelta >= 0.15) {

    return 'A shell-forward stave read with firm body, clear structure, and a grounded note center.';

  }

  if (controlDelta >= 0.35 && attackDelta >= 0.25) {

    return 'A focused read with cleaner front edge, firmer note shape, and stronger built-in control.';

  }

  if (warmthDelta >= 0.35 && sustainDelta >= 0.25) {

    return 'A warmer, more body-forward read with broader bloom and a rounder shell response.';

  }

  if (sensitivityDelta >= 0.35) {

    return 'A touch-friendly read that should respond well to lighter hands and dynamic playing.';

  }

  if (brightnessDelta >= 0.35) {

    return 'A clearer, brighter read with more top-edge definition and articulation.';

  }

  return 'A balanced projected voice read that stays close to the center while reflecting the selected shell recipe and hardware.';

}

function buildHighlightedCharacteristics(spec = {}, profile = {}) {

  const parts = [];

  const movement = getLegacyPrintProfileMovement(profile);

  const spread = getLegacyPrintProfileSpread(profile);

  const topAxes = buildDominantAxisSummary(profile);

  if (movement < 0.75 || spread < 0.3) {

    parts.push('close to the centered LegacyPrint reference posture');

  } else {

    parts.push(`strongest movement around ${topAxes.join(', ')}`);

  }

  if (getLegacyPrintAxisDelta(profile, 'attack') >= 0.3) {

    parts.push('more immediate front edge');

  }

  if (getLegacyPrintAxisDelta(profile, 'brightness') >= 0.3) {

    parts.push('clearer upper-edge definition');

  }

  if (getLegacyPrintAxisDelta(profile, 'projection') >= 0.3) {

    parts.push('stronger outward throw');

  }

  if (getLegacyPrintAxisDelta(profile, 'sustain') >= 0.3) {

    parts.push('longer note bloom');

  }

  if (getLegacyPrintAxisDelta(profile, 'warmth') >= 0.3) {

    parts.push('more body-forward warmth');

  }

  if (getLegacyPrintAxisDelta(profile, 'sensitivity') >= 0.3) {

    parts.push('more touch-friendly response');

  }

  if (getLegacyPrintAxisDelta(profile, 'control') >= 0.3) {

    parts.push('more composed note shape');

  }

  if (String(spec.hoopType || '').toLowerCase().includes('die')) {

    parts.push('Die-Cast hoops add focus and containment');

  }

  if (String(spec.hoopType || '').toLowerCase().includes('triple')) {

    parts.push('Triple Flange hoops preserve openness and air');

  }

  return `${capitalize(parts.slice(0, 5).join('; '))}.`;

}

function buildGenericGenreRead(spec = {}, profile = {}) {

  if (profile.control >= 5.45 && profile.attack >= 5.35) {

    return 'Pop • Indie • Modern Session';

  }

  if (profile.warmth >= 5.45 && profile.sustain >= 5.35) {

    return 'Americana • Soul • Singer-Songwriter';

  }

  if (profile.brightness >= 5.5 && profile.projection >= 5.45) {

    return 'Rock • Funk • Live Session';

  }

  if (profile.sensitivity >= 5.45) {

    return 'Jazz • Funk • Dynamic Session';

  }

  return 'General Session • Roots • Studio';

}

function buildSecondaryGenres(profile = {}) {

  const genres = [];

  if (profile.attack >= 5.35) genres.push('Funk');

  if (profile.warmth >= 5.35) genres.push('Soul');

  if (profile.projection >= 5.35) genres.push('Rock');

  if (profile.sensitivity >= 5.35) genres.push('Jazz');

  if (profile.control >= 5.35) genres.push('Pop');

  if (!genres.length) {

    return ['General Session', 'Indie', 'Singer-Songwriter'];

  }

  return [...new Set(genres)].slice(0, 3);

}

function buildRecordingMic(profile = {}) {

  if (profile.attack >= 5.45 && profile.control >= 5.35) {

    return 'Dynamic top mic with focused condenser support';

  }

  if (profile.warmth >= 5.45 || profile.sustain >= 5.45) {

    return 'Warm condenser or ribbon-forward close pairing';

  }

  if (profile.brightness >= 5.45) {

    return 'Detailed condenser with controlled top-end placement';

  }

  return 'Balanced dynamic / condenser snare pairing';

}

function buildThreadNodes(profile = {}, limit = 3) {

  return LEGACYPRINT_AXIS_KEYS.map((axis) => ({

    axis,

    value: Number(profile?.[axis] ?? 5),

    movement: Math.abs(getLegacyPrintAxisDelta(profile, axis)),

  }))

    .sort((a, b) => b.movement - a.movement)

    .slice(0, limit)

    .map((item) => item.axis);

}

function buildThreadScore(profile = {}, limit = 3) {

  const score = LEGACYPRINT_AXIS_KEYS.map((axis) =>

    Math.abs(getLegacyPrintAxisDelta(profile, axis))

  )

    .sort((a, b) => b - a)

    .slice(0, limit)

    .reduce((sum, value) => sum + value, 0);

  return roundLegacyPrintScore(Math.max(1, Math.min(10, score * 1.65)));

}

export function buildLegacyPrintRead(inputSpec = {}) {

  const result = buildGenericVoiceProfile(inputSpec);

  const { spec, profile } = result;

  const sourceBuildRead = formatSpecLine(spec);

  const simpleThreadNodes = buildThreadNodes(profile, 3);

  const shapedThreadNodes = buildThreadNodes(profile, 3);

  const complexThreadNodes = buildThreadNodes(profile, 4);

  return {

    lineId: spec.lineId || 'generic',

    lineLabel: spec.lineLabel || 'Generic',

    currentSpec: spec,

    profile,

    highlightedCharacteristics: buildHighlightedCharacteristics(spec, profile),

    primaryGenre: buildGenericGenreRead(spec, profile),

    secondaryGenres: buildSecondaryGenres(profile),

    recordingMic: buildRecordingMic(profile),

    playingSituation: buildGenericPlayingSituation(spec, profile),

    feelRead: buildGenericPlayingSituation(spec, profile),

    sourceBuildRead,

    sourceBuildTitle: sourceBuildRead,

    sourceBuildNodes: simpleThreadNodes,

    sourceBuildScore: buildThreadScore(profile, 3),

    simpleThreadTitle: sourceBuildRead,

    simpleThreadNodes,

    simpleThreadScore: buildThreadScore(profile, 3),

    shapedThreadTitle: buildHighlightedCharacteristics(spec, profile),

    shapedThreadNodes,

    shapedThreadScore: buildThreadScore(profile, 3),

    complexThreadTitle: buildGenericPlayingSituation(spec, profile),

    complexThreadNodes,

    complexThreadScore: buildThreadScore(profile, 4),

    benchmark: {

      centerScore: 5,

      meaning:

        'LegacyPrint center represents a balanced projected reference, not a measured acoustic guarantee.',

    },

    meta: {

      ...result.meta,

      confidence01: result.confidence01,

      confidencePercent: result.confidencePercent,

      profileMovement: getLegacyPrintProfileMovement(profile),

      profileSpread: getLegacyPrintProfileSpread(profile),

      voicingSources: result.voicingSources,

      axisBreakdown: result.axisBreakdown,

    },

  };

}

export default buildLegacyPrintRead;