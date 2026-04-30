// src/utils/legacyPrint/buildHeritageVoiceRead.js

import { scoreSpiderProfile } from '../spider/scoreSpiderProfile.js';

import HERITAGE_REFERENCE_PROFILE from './heritageReferenceProfile.js';

import LEGACYPRINT_BENCHMARK_CATALOG from '../../data/legacyPrint/benchmarkCatalog.js';

import { BENCHMARK_DEFINITIONS } from '../../data/legacyPrint/benchmarkDefinitions.js';

const AXES = [
  'attack',

  'brightness',

  'projection',

  'sustain',

  'warmth',

  'sensitivity',

  'control',
];

const clamp = (value, min = 1, max = 10) => {
  const num = Number(value);

  if (!Number.isFinite(num)) return min;

  return Math.max(min, Math.min(max, num));
};

const round2 = (n) => Math.round(n * 100) / 100;

function normalizeDepth(value) {
  const num = Number(value);

  if (!Number.isFinite(num)) return 5.5;

  return Number(num.toFixed(1));
}

function parseStaveOption(staveOption = '') {
  const raw = String(staveOption || '').trim();

  const staveMatch = raw.match(/^(\d+)/);

  const thicknessMatch = raw.match(/-\s*(\d+(?:\.\d+)?)mm/i);

  const hasReRings =
    raw.toLowerCase().includes('re-rings') || raw.includes('+ $150');

  const staveCount = staveMatch ? Number(staveMatch[1]) : null;

  const shellThicknessMm = thicknessMatch ? Number(thicknessMatch[1]) : null;

  return {
    staveCount,

    shellThicknessMm,

    hasReRings,
  };
}

function getShellThicknessBucket(mm) {
  const value = Number(mm);

  if (!Number.isFinite(value)) return 'medium';

  if (value <= 9) return 'thin';

  if (value <= 12) return 'medium';

  return 'thick';
}

function parseSizeId(sizeId = '') {
  const normalized = String(sizeId).replace(/_/g, '.').trim();

  const match = normalized.match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/i);

  if (!match) {
    return { width: 14, depth: 5.5 };
  }

  return {
    width: Number(match[1]),

    depth: Number(match[2]),
  };
}

function buildNeutralBenchmarkSpecFromCatalog({
  familyId,

  typeId,

  sizeId,
}) {
  const familyDefinition =
    Object.values(BENCHMARK_DEFINITIONS).find(
      (family) => family.familyId === familyId
    ) || Object.values(BENCHMARK_DEFINITIONS)[0];

  const typeDefinition =
    Object.values(familyDefinition?.types || {}).find(
      (type) => type.typeId === typeId
    ) || Object.values(familyDefinition?.types || {})[0];

  const resolvedSizeId =
    sizeId ||
    typeDefinition?.defaultSizeId ||
    typeDefinition?.sizes?.[0]?.sizeId ||
    '14x5_5';

  const sizeDefinition =
    typeDefinition?.sizes?.find((size) => size.sizeId === resolvedSizeId) ||
    typeDefinition?.sizes?.[0] ||
    null;

  const parsedFallbackSize = parseSizeId(resolvedSizeId);

  const resolvedSpec = sizeDefinition?.spec || {};

  const width = Number(
    resolvedSpec.width ??
      sizeDefinition?.spec?.width ??
      parsedFallbackSize.width
  );

  const depth = Number(
    resolvedSpec.depth ??
      sizeDefinition?.spec?.depth ??
      parsedFallbackSize.depth
  );

  const shellThicknessMm = Number(
    resolvedSpec.shellThicknessMm ??
      resolvedSpec.thicknessMm ??
      resolvedSpec.shellThickness ??
      resolvedSpec.thickness ??
      10
  );

  const benchmarkSpec = {
    scoringIntent: resolvedSpec.scoringIntent || 'shell_first',

    legacyPrintMode: resolvedSpec.legacyPrintMode || 'shell_first',

    benchmarkMode: resolvedSpec.benchmarkMode || 'heritage_shell_first',

    benchmarkFamilyId: familyDefinition?.familyId || familyId,

    benchmarkTypeId: typeDefinition?.typeId || typeId,

    benchmarkSizeId: sizeDefinition?.sizeId || resolvedSizeId,

    width,

    depth,

    lugQuantity: Number(resolvedSpec.lugQuantity ?? 8),

    staveCount:
      resolvedSpec.staveCount == null ? null : Number(resolvedSpec.staveCount),

    shellThicknessMm,

    thicknessMm: shellThicknessMm,

    shellThickness: shellThicknessMm,

    thickness: shellThicknessMm,

    shellThicknessBucket:
      resolvedSpec.shellThicknessBucket ||
      getShellThicknessBucket(shellThicknessMm),

    shellFamily: resolvedSpec.shellFamily || 'wood',

    construction: resolvedSpec.construction || 'stave',

    primarySpecies: resolvedSpec.primarySpecies || '',

    secondarySpecies: resolvedSpec.secondarySpecies || '',

    woodSpeciesLabel: resolvedSpec.woodSpeciesLabel || '',

    metalMaterial: resolvedSpec.metalMaterial || '',

    acrylicType: resolvedSpec.acrylicType || '',

    hoopType: resolvedSpec.hoopType || 'Triple Flange',

    hardwareType: resolvedSpec.hardwareType || 'Tube Lugs',

    hardwareFinish: resolvedSpec.hardwareFinish || 'Chrome',

    bearingEdge:
      resolvedSpec.bearingEdge || '45 Inner / Strong Outer Roundover',

    snareBedDepth: resolvedSpec.snareBedDepth || 'Standard',

    finish: resolvedSpec.finish || 'Medium Torch',

    drumhead: resolvedSpec.drumhead || 'Coated Single Ply',

    tension: resolvedSpec.tension || 'Medium',

    snareSideHead: resolvedSpec.snareSideHead || 'Standard 3mil',

    snareWireCount: Number(resolvedSpec.snareWireCount ?? 20),

    snareWireStyle: resolvedSpec.snareWireStyle || 'Standard',

    snareWireMaterial: resolvedSpec.snareWireMaterial || 'Steel',

    reRings: resolvedSpec.reRings || 'None',
  };

  return benchmarkSpec;
}

function getSelectedBenchmarkMeta({
  benchmarkFamilyId,

  benchmarkTypeId,

  benchmarkSizeId,
}) {
  const family =
    LEGACYPRINT_BENCHMARK_CATALOG.find(
      (item) => item.familyId === benchmarkFamilyId
    ) || LEGACYPRINT_BENCHMARK_CATALOG[0];

  const type =
    family?.benchmarkTypes?.find((item) => item.typeId === benchmarkTypeId) ||
    family?.benchmarkTypes?.[0] ||
    null;

  const resolvedSizeId =
    benchmarkSizeId ||
    type?.defaultSizeId ||
    type?.presetSizes?.[0] ||
    '14x5.5';

  const sizeOption =
    type?.presetSizeOptions?.find((item) => item.sizeId === resolvedSizeId) ||
    null;

  return {
    family,

    type,

    sizeId: resolvedSizeId,

    sizeOption,
  };
}

function buildHeritageSpec({
  size,

  depth,

  lugs,

  staveOption,

  hoopType,

  hardwareColor,

  scorchDepth,

  benchmarkFamilyId,

  benchmarkTypeId,

  benchmarkSizeId,
}) {
  const parsed = parseStaveOption(staveOption);

  return {
    scoringIntent: 'shell_first',

    legacyPrintMode: 'shell_first',

    benchmarkMode: 'heritage_shell_first',

    benchmarkFamilyId,

    benchmarkTypeId,

    benchmarkSizeId,

    shellFamily: 'wood',

    construction: 'stave',

    primarySpecies: 'oak',

    woodSpeciesLabel: 'Northern Red Oak',

    width: Number(size),

    depth: normalizeDepth(depth),

    lugQuantity: Number(lugs),

    staveCount: parsed.staveCount ?? 16,

    shellThicknessMm: parsed.shellThicknessMm ?? 10,

    thicknessMm: parsed.shellThicknessMm ?? 10,

    shellThickness: parsed.shellThicknessMm ?? 10,

    thickness: parsed.shellThicknessMm ?? 10,

    shellThicknessBucket: getShellThicknessBucket(
      parsed.shellThicknessMm ?? 10
    ),

    hoopType: hoopType || 'Triple Flange',

    hardwareType: 'Tube Lugs',

    hardwareFinish: hardwareColor || 'Chrome',

    bearingEdge: '45 Inner / Strong Outer Roundover',

    snareBedDepth: 'Standard',

    finish: scorchDepth || 'Medium Torch',

    reRings: parsed.hasReRings ? 'Standard' : 'None',

    drumhead: 'Coated Single Ply',

    tension: 'Medium',

    snareSideHead: 'Standard 3mil',

    snareWireCount: 20,

    snareWireStyle: 'Standard',

    snareWireMaterial: 'Steel',
  };
}

function getFinishVoicingProfile(finish = '') {
  const value = String(finish || '').toLowerCase();

  if (value.includes('light')) {
    return {
      finishLevel: 'light',

      tonalShift: -1,

      // Lighter scorch keeps the shell more open and lively,

      // with less manual correction needed between sections.

      torchTuneDemand: -1,

      sectionVarianceRisk: -1,
    };
  }

  if (
    value.includes('blackened') ||
    value.includes('black stain') ||
    value.includes('black stained') ||
    value.includes('blacked')
  ) {
    return {
      finishLevel: 'blackened',

      tonalShift: 1,

      // Heavier scorch is treated as requiring more TorchTune correction

      // to keep the shell response cohesive across stave sections.

      torchTuneDemand: 1,

      sectionVarianceRisk: 1,
    };
  }

  return {
    finishLevel: 'medium',

    tonalShift: 0,

    // Medium Torch stays the center reference point for Heritage.

    torchTuneDemand: 0,

    sectionVarianceRisk: 0,
  };
}

function rebaseAgainstBenchmark(currentProfile = {}, benchmarkProfile = {}) {
  const AXIS_BASE_MULTIPLIERS = {
    attack: 0.85,

    sustain: 0.95,

    warmth: 0.9,

    projection: 0.88,

    brightness: 0.82,

    sensitivity: 0.82,

    control: 0.84,
  };

  const rebased = {};

  AXES.forEach((axis) => {
    const current = Number(currentProfile?.[axis] ?? 5);

    const benchmark = Number(benchmarkProfile?.[axis] ?? 5);

    const delta = current - benchmark;

    const axisBase = AXIS_BASE_MULTIPLIERS[axis] ?? 0.85;

    // Compress negative movement more than positive movement

    // so deep / warm / open Heritage builds do not crater.

    const directionalMultiplier = delta < 0 ? 0.72 : 0.9;

    const scaled = 5 + delta * axisBase * directionalMultiplier;

    rebased[axis] = round2(clamp(scaled, 1, 10));
  });

  return rebased;
}
function axisDelta(profile = {}, axis) {
  return Number(profile?.[axis] ?? 5) - 5;
}

function applyAxisDelta(profile, axis, amount) {
  profile[axis] = round2(clamp(Number(profile?.[axis] ?? 5) + amount));
}

function normalizeFinishLevel(finish = '') {
  const value = String(finish || '').toLowerCase();

  if (
    value.includes('blackened') ||
    value.includes('black stain') ||
    value.includes('black stained') ||
    value.includes('blacked')
  ) {
    return 1;
  }

  if (value.includes('light')) return -1;

  return 0;
}

function applyHeritageReferenceShaping(
  rebasedProfile = {},

  spec = {},

  benchmarkSpec = {},

  finishVoicing = getFinishVoicingProfile(spec.finish)
) {
  const next = { ...rebasedProfile };

  const widthDelta =
    Number(spec.width || 14) - Number(benchmarkSpec.width || 14);

  const depthDelta =
    Number(spec.depth || 5.5) - Number(benchmarkSpec.depth || 5.5);

  const lugDelta =
    Number(spec.lugQuantity || 8) - Number(benchmarkSpec.lugQuantity || 8);

  const staveDelta =
    Number(spec.staveCount || 16) - Number(benchmarkSpec.staveCount || 16);

  const thicknessDelta =
    Number(spec.shellThicknessMm || 10) -
    Number(benchmarkSpec.shellThicknessMm || 10);

  const currentHasReRings =
    String(spec.reRings || '').toLowerCase() !== 'none' &&
    String(spec.reRings || '').trim() !== '';

  const benchmarkHasReRings =
    String(benchmarkSpec.reRings || '').toLowerCase() !== 'none' &&
    String(benchmarkSpec.reRings || '').trim() !== '';

  const reRingDelta = Number(currentHasReRings) - Number(benchmarkHasReRings);

  const hoop = String(spec.hoopType || '').toLowerCase();

  const benchmarkHoop = String(benchmarkSpec.hoopType || '').toLowerCase();

  const currentIsDieCast = hoop.includes('die');

  const benchmarkIsDieCast = benchmarkHoop.includes('die');

  const dieCastDelta = Number(currentIsDieCast) - Number(benchmarkIsDieCast);

  const currentIsTriple = hoop.includes('triple');

  const benchmarkIsTriple = benchmarkHoop.includes('triple');

  const tripleFlangeDelta = Number(currentIsTriple) - Number(benchmarkIsTriple);

  const finishDelta =
    normalizeFinishLevel(spec.finish) -
    normalizeFinishLevel(benchmarkSpec.finish);

  // ATTACK

  applyAxisDelta(next, 'attack', widthDelta * -0.24);

  applyAxisDelta(next, 'attack', depthDelta * -0.14);

  applyAxisDelta(next, 'attack', lugDelta * 0.14);

  applyAxisDelta(next, 'attack', staveDelta * 0.02);

  applyAxisDelta(next, 'attack', thicknessDelta * 0.18);

  applyAxisDelta(next, 'attack', reRingDelta * 0.22);

  applyAxisDelta(next, 'attack', dieCastDelta * 0.2);

  applyAxisDelta(next, 'attack', tripleFlangeDelta * -0.06);

  applyAxisDelta(next, 'attack', finishDelta * 0.14);

  applyAxisDelta(next, 'attack', finishVoicing.torchTuneDemand * 0.04);

  // SUSTAIN

  applyAxisDelta(next, 'sustain', depthDelta * 0.24);

  applyAxisDelta(next, 'sustain', widthDelta * 0.1);

  applyAxisDelta(next, 'sustain', lugDelta * -0.09);

  applyAxisDelta(next, 'sustain', staveDelta * -0.03);

  applyAxisDelta(next, 'sustain', thicknessDelta * -0.12);

  applyAxisDelta(next, 'sustain', reRingDelta * -0.14);

  applyAxisDelta(next, 'sustain', dieCastDelta * -0.16);

  applyAxisDelta(next, 'sustain', tripleFlangeDelta * 0.08);

  applyAxisDelta(next, 'sustain', finishDelta * -0.16);

  applyAxisDelta(next, 'sustain', finishVoicing.sectionVarianceRisk * -0.1);

  // WARMTH

  applyAxisDelta(next, 'warmth', depthDelta * 0.28);

  applyAxisDelta(next, 'warmth', widthDelta * 0.13);

  applyAxisDelta(next, 'warmth', lugDelta * -0.06);

  applyAxisDelta(next, 'warmth', staveDelta * -0.02);

  applyAxisDelta(next, 'warmth', thicknessDelta * -0.05);

  applyAxisDelta(next, 'warmth', reRingDelta * -0.06);

  applyAxisDelta(next, 'warmth', dieCastDelta * -0.1);

  applyAxisDelta(next, 'warmth', tripleFlangeDelta * 0.06);

  applyAxisDelta(next, 'warmth', finishDelta * 0.08);

  // PROJECTION

  applyAxisDelta(next, 'projection', widthDelta * -0.08);

  applyAxisDelta(next, 'projection', depthDelta * 0.14);

  applyAxisDelta(next, 'projection', lugDelta * 0.1);

  applyAxisDelta(next, 'projection', staveDelta * 0.02);

  applyAxisDelta(next, 'projection', thicknessDelta * 0.14);

  applyAxisDelta(next, 'projection', reRingDelta * 0.18);

  applyAxisDelta(next, 'projection', dieCastDelta * 0.12);

  applyAxisDelta(next, 'projection', tripleFlangeDelta * -0.04);

  applyAxisDelta(next, 'projection', finishDelta * -0.02);

  applyAxisDelta(next, 'projection', finishVoicing.sectionVarianceRisk * -0.09);

  // BRIGHTNESS

  applyAxisDelta(next, 'brightness', widthDelta * -0.15);

  applyAxisDelta(next, 'brightness', depthDelta * -0.1);

  applyAxisDelta(next, 'brightness', lugDelta * 0.04);

  applyAxisDelta(next, 'brightness', staveDelta * 0.02);

  applyAxisDelta(next, 'brightness', thicknessDelta * 0.05);

  applyAxisDelta(next, 'brightness', reRingDelta * -0.06);

  applyAxisDelta(next, 'brightness', dieCastDelta * 0.14);

  applyAxisDelta(next, 'brightness', tripleFlangeDelta * -0.04);

  applyAxisDelta(next, 'brightness', finishDelta * -0.18);

  // SENSITIVITY

  applyAxisDelta(next, 'sensitivity', widthDelta * -0.03);

  applyAxisDelta(next, 'sensitivity', depthDelta * -0.06);

  applyAxisDelta(next, 'sensitivity', lugDelta * -0.09);

  applyAxisDelta(next, 'sensitivity', staveDelta * -0.03);

  applyAxisDelta(next, 'sensitivity', thicknessDelta * -0.05);

  applyAxisDelta(next, 'sensitivity', reRingDelta * -0.18);

  applyAxisDelta(next, 'sensitivity', dieCastDelta * -0.08);

  applyAxisDelta(next, 'sensitivity', tripleFlangeDelta * 0.06);

  applyAxisDelta(next, 'sensitivity', finishDelta * -0.16);

  applyAxisDelta(
    next,

    'sensitivity',

    finishVoicing.sectionVarianceRisk * -0.08
  );

  // CONTROL

  applyAxisDelta(next, 'control', widthDelta * 0.03);

  applyAxisDelta(next, 'control', depthDelta * -0.02);

  applyAxisDelta(next, 'control', lugDelta * 0.1);

  applyAxisDelta(next, 'control', staveDelta * 0.02);

  applyAxisDelta(next, 'control', thicknessDelta * 0.11);

  applyAxisDelta(next, 'control', reRingDelta * 0.24);

  applyAxisDelta(next, 'control', dieCastDelta * 0.2);

  applyAxisDelta(next, 'control', tripleFlangeDelta * -0.08);

  applyAxisDelta(next, 'control', finishDelta * 0.2);

  applyAxisDelta(next, 'control', finishVoicing.torchTuneDemand * 0.1);

  return AXES.reduce((acc, axis) => {
    acc[axis] = round2(clamp(next[axis]));

    return acc;
  }, {});
}

function pickPrimaryGenre(spec = {}, profile = {}) {
  if (spec.depth >= 7 && profile.warmth >= 5.5) {
    return 'Americana • Roots Rock • Singer-Songwriter';
  }

  if (spec.depth <= 5.5 && profile.attack >= 5.4) {
    return 'Jazz • Funk • Session';
  }

  if (profile.control >= 5.5 && profile.attack >= 5.4) {
    return 'Pop • Indie • Modern Roots';
  }

  return 'Roots • Soul • Session';
}

function pickSecondaryGenres(spec = {}, profile = {}) {
  if (spec.depth >= 7) {
    return ['Americana', 'Blues Rock', 'Cinematic Session'];
  }

  if (spec.width <= 12) {
    return ['Funk', 'Jazz', 'Percussion-forward Pop'];
  }

  if (profile.warmth >= 5.6) {
    return ['Soul', 'Folk', 'Singer-Songwriter'];
  }

  return ['Indie', 'Country', 'General Session'];
}

function pickRecordingMic(spec = {}, profile = {}) {
  if (spec.width <= 12) {
    return 'Small-diaphragm condenser or articulate dynamic pairing';
  }

  if (spec.depth >= 7 || profile.warmth >= 5.6) {
    return 'Warm condenser or ribbon-forward close pairing';
  }

  if (profile.attack >= 5.5 && profile.control >= 5.4) {
    return 'Dynamic top mic with focused condenser support';
  }

  return 'Balanced dynamic / condenser snare pairing';
}

function buildPlayingSituation(spec = {}, profile = {}) {
  const finish = String(spec.finish || '').toLowerCase();

  const isBlackened =
    finish.includes('blackened') ||
    finish.includes('black stain') ||
    finish.includes('black stained') ||
    finish.includes('blacked');

  const isLight = finish.includes('light');

  if (spec.hoopType === 'Die-Cast') {
    return 'A more focused Heritage read with firmer note shape, cleaner front edge, and tighter overall behavior.';
  }

  if (isBlackened && profile.control >= 5.5) {
    return 'A more TorchTuned-forward Heritage read, where the heavier scorch treatment pushes the shell toward firmer control, a denser center image, and a more intentional note shape across the stave body.';
  }

  if (isLight && profile.sensitivity >= 5.1) {
    return 'A more open Heritage read, where the lighter torch treatment preserves extra liveliness, touch response, and a slightly freer bloom through the shell.';
  }

  if (spec.depth >= 7) {
    return 'A fuller Heritage read with broader body, deeper bloom, and a more grounded voice in the room.';
  }

  if (profile.sensitivity >= 5.5) {
    return 'A touch-friendly Heritage read that stays expressive under lighter hands while keeping its shell identity.';
  }

  return 'A balanced Heritage read with natural openness, grounded body, and classic shell-first response.';
}

function buildFeelRead(spec = {}, profile = {}) {
  const visualParts = [];

  const finish = String(spec.finish || '').toLowerCase();

  const isBlackened =
    finish.includes('blackened') ||
    finish.includes('black stain') ||
    finish.includes('black stained') ||
    finish.includes('blacked');

  const isLight = finish.includes('light');

  if (isBlackened) {
    visualParts.push('darker');
  } else if (isLight) {
    visualParts.push('cleaner');
  } else {
    visualParts.push('seasoned');
  }

  if (spec.hardwareFinish === 'Brass/Gold') {
    visualParts.push('richer');
  } else if (spec.hardwareFinish === 'Black Nickel') {
    visualParts.push('slightly more modern');
  } else {
    visualParts.push('classic');
  }

  let finishLean = 'with a balanced TorchTuned posture';

  if (isBlackened) {
    finishLean =
      'with a stronger TorchTuned imprint that favors firmer note control, slightly lower sensitivity, and a more unified shell response under heavier treatment';
  } else if (isLight) {
    finishLean =
      'with a lighter TorchTuned imprint that preserves more openness, touch response, and a slightly freer shell reaction';
  }

  const soundLean =
    profile.warmth >= 5.7
      ? 'while keeping the emphasis on body, weight, and shell character'
      : profile.attack >= 5.6
        ? 'while keeping the front edge firm and articulate'
        : profile.control >= 5.5
          ? 'while keeping the shell centered and composed'
          : 'while keeping the shell-first balance intact';

  return `A ${visualParts.join(', ')} Heritage presentation ${finishLean}, ${soundLean}.`;
}

function buildHighlightedCharacteristics(spec = {}, profile = {}) {
  const parts = [];

  const finish = String(spec.finish || '').toLowerCase();

  const isBlackened =
    finish.includes('blackened') ||
    finish.includes('black stain') ||
    finish.includes('black stained') ||
    finish.includes('blacked');

  const isLight = finish.includes('light');

if (axisDelta(profile, 'warmth') >= 0.55) {

  parts.push(

    'warmer and more body-forward than the benchmark Heritage build'

  );

} else if (axisDelta(profile, 'warmth') <= -0.55) {

  parts.push(

    'leaner and more controlled through the center than the benchmark Heritage build'

  );

} else {

  parts.push('close to the benchmark Heritage warmth posture');

}

  if (axisDelta(profile, 'attack') >= 0.65) {
    parts.push('with a quicker and more defined front edge');
  } else if (axisDelta(profile, 'attack') <= -0.65) {
    parts.push('with a rounder and less immediate note start');
  }

  if (axisDelta(profile, 'sustain') >= 0.65) {
    parts.push('and a longer, broader note bloom');
  } else if (axisDelta(profile, 'sustain') <= -0.65) {
    parts.push('and a shorter, tighter note shape');
  }

  if (axisDelta(profile, 'projection') >= 0.6) {
    parts.push('with stronger outward throw');
  } else if (axisDelta(profile, 'projection') <= -0.6) {
    parts.push('with a slightly more intimate room presence');
  }

  if (isBlackened) {
    if (axisDelta(profile, 'control') >= 0.45) {
      parts.push(
        'the heavier TorchTune finish pushes the read toward stronger control and a more disciplined shell response'
      );
    }

    if (axisDelta(profile, 'sensitivity') <= -0.45) {
      parts.push(
        'with some touch sensitivity traded for a more locked-in and deliberate note center'
      );
    }
  } else if (isLight) {
    if (axisDelta(profile, 'sensitivity') >= 0.12) {
      parts.push(
        'the lighter TorchTune finish preserves more touch response and a freer shell reaction'
      );
    }

    if (axisDelta(profile, 'control') <= -0.18) {
      parts.push(
        'with slightly less containment than the benchmark in exchange for added openness'
      );
    }
  } else {
    parts.push(
      'the Medium Torch benchmark keeps the line centered between openness and control'
    );
  }

  if (spec.hoopType === 'Die-Cast') {
    parts.push(
      'Die-Cast hoops push the read toward added focus and containment'
    );
  } else {
    parts.push(
      'Triple Flange hoops preserve more of the line’s native openness'
    );
  }

  return `${parts.join(', ')}.`;
}

function buildSourceBuildRead(spec = {}) {
  const finishLabel = spec.finish || 'Medium Torch';

  const reRingRead = spec.reRings === 'Standard' ? ' • Re-Rings' : '';

  return `${spec.width}" x ${spec.depth}" • ${spec.lugQuantity} lugs • ${spec.staveCount} staves • ${spec.shellThicknessMm}mm shell • Northern Red Oak • ${spec.hoopType} • ${spec.hardwareFinish} • ${finishLabel} • 45° inner / strong outer roundover • Standard snare bed${reRingRead}`;
}

export function buildHeritageVoiceRead(input = {}) {
  const currentSpec = buildHeritageSpec(input);

  const finishVoicing = getFinishVoicingProfile(currentSpec.finish);

  const benchmarkSpec = buildNeutralBenchmarkSpecFromCatalog({
    familyId: input.benchmarkFamilyId,

    typeId: input.benchmarkTypeId,

    sizeId: input.benchmarkSizeId,
  });

  const benchmarkMeta = getSelectedBenchmarkMeta({
    benchmarkFamilyId: input.benchmarkFamilyId,

    benchmarkTypeId: input.benchmarkTypeId,

    benchmarkSizeId: input.benchmarkSizeId,
  });

  const currentResult = scoreSpiderProfile(currentSpec);

  const benchmarkResult = scoreSpiderProfile(benchmarkSpec);

  const rebasedProfile = rebaseAgainstBenchmark(
    currentResult?.profile,

    benchmarkResult?.profile
  );

  const shapedProfile = applyHeritageReferenceShaping(
    rebasedProfile,

    currentSpec,

    benchmarkSpec,

    finishVoicing
  );

  return {
    lineId: HERITAGE_REFERENCE_PROFILE.lineId,

    lineLabel: HERITAGE_REFERENCE_PROFILE.lineLabel,

    benchmark: {
      ...HERITAGE_REFERENCE_PROFILE.benchmarkMeaning,

      familyId: benchmarkMeta.family?.familyId || null,

      familyLabel: benchmarkMeta.family?.familyLabel || null,

      typeId: benchmarkMeta.type?.typeId || null,

      typeLabel: benchmarkMeta.type?.typeLabel || null,

      sizeId: benchmarkMeta.sizeId || null,

      sizeLabel:
        benchmarkMeta.sizeOption?.label || benchmarkMeta.sizeId || null,

      referenceSpec: benchmarkSpec,

      referenceRawProfile: benchmarkResult?.profile || null,
    },

    currentSpec,

    profile: shapedProfile,

    highlightedCharacteristics: buildHighlightedCharacteristics(
      currentSpec,

      shapedProfile
    ),

    primaryGenre: pickPrimaryGenre(currentSpec, shapedProfile),

    secondaryGenres: pickSecondaryGenres(currentSpec, shapedProfile),

    recordingMic: pickRecordingMic(currentSpec, shapedProfile),

    playingSituation: buildPlayingSituation(currentSpec, shapedProfile),

    feelRead: buildFeelRead(currentSpec, shapedProfile),

    sourceBuildRead: buildSourceBuildRead(currentSpec),

    meta: {
      engineVersion: 'heritage-v1.4',

      scoringMode: 'selected_benchmark_relative',

      benchmarkCenter: 5,

      selectedBenchmarkType: benchmarkMeta.type?.typeId || null,

      finishVoicing,

      note: 'Heritage LegacyPrint scoring is benchmark-relative. 5.0 represents the reference Heritage drum, and scores show movement away from that benchmark.',
    },
  };
}

export default buildHeritageVoiceRead;
