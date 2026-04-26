// src/utils/spider/scoreLegacyTuningProfile.js

import scoreSpiderProfile from './scoreSpiderProfile.js';
import buildDrumSpecsFromLegacyForm from './buildDrumSpecsFromLegacyForm.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const round2 = (n) => Math.round(n * 100) / 100;

const PITCH = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function hzToMidi(hz) {
  if (!hz || hz <= 0) return null;
  return Math.round(12 * Math.log2(hz / 440) + 69);
}

function midiToNoteName(midi) {
  if (!Number.isFinite(midi)) return '';
  const name = PITCH[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}

function hzToNote(hz) {
  const midi = hzToMidi(hz);
  return midiToNoteName(midi);
}

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeLower(value) {
  return normalizeText(value).toLowerCase();
}

function parseFirstNumber(value) {
  const match = String(value || '').match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function getShellDescriptor(specs = {}) {
  const shellFamily = normalizeLower(specs.shellFamily || 'wood');

  if (shellFamily === 'metal') {
    return normalizeText(specs.metalMaterial) || 'metal';
  }

  if (shellFamily === 'acrylic') {
    return normalizeText(specs.acrylicType) || 'acrylic';
  }

  if (Array.isArray(specs.species) && specs.species.length) {
    return specs.species.join(' + ');
  }

  return (
    normalizeText(specs.primarySpecies) ||
    normalizeText(specs.innerSpecies) ||
    normalizeText(specs.outerSpecies) ||
    'wood'
  );
}

function getShellFundamentalFromSpecs(specs = {}, spiderProfile = {}) {
  const width = Number(specs.width) || 14;
  const depth = Number(specs.depth) || 6.5;
  const tension = normalizeLower(specs.tension || 'medium');
  const construction = normalizeLower(specs.construction || 'stave');
  const shellFamily = normalizeLower(specs.shellFamily || 'wood');
  const thicknessValue = parseFirstNumber(specs.thickness);

  let fundamental = 92;

  // Diameter effect: smaller = higher, larger = lower
  fundamental += (14 - width) * 6.8;

  // Depth effect: deeper = slightly lower
  fundamental += (6.5 - depth) * 3.8;

  if (tension.includes('high')) fundamental += 5;
  if (tension.includes('low')) fundamental -= 5;

  if (shellFamily === 'wood') {
    if (construction.includes('stave')) fundamental += 2.5;
    if (construction.includes('hybrid')) fundamental += 1.8;
    if (construction.includes('steam')) fundamental -= 1.2;
    if (construction.includes('ply')) fundamental -= 1.0;
    if (construction.includes('solid')) fundamental += 0.6;
    if (construction.includes('segmented')) fundamental += 1.0;
  }

  if (shellFamily === 'metal') {
    fundamental += 5.5;

    const metal = normalizeLower(specs.metalMaterial);
    if (metal.includes('steel')) fundamental += 3.2;
    if (metal.includes('aluminum')) fundamental += 1.4;
    if (metal.includes('brass')) fundamental += 1.8;
    if (metal.includes('bronze')) fundamental += 1.2;
    if (metal.includes('copper')) fundamental -= 0.6;
  }

  if (shellFamily === 'acrylic') {
    fundamental += 3.0;
  }

  if (Number.isFinite(thicknessValue)) {
    if (shellFamily === 'metal') {
      if (thicknessValue >= 1.5) fundamental += 1.8;
      if (thicknessValue >= 3.0) fundamental += 2.2;
      if (thicknessValue <= 1.0) fundamental -= 1.0;
    } else if (shellFamily === 'acrylic') {
      if (thicknessValue >= 8) fundamental += 1.3;
      if (thicknessValue >= 12) fundamental += 1.3;
    } else {
      if (thicknessValue <= 6) fundamental -= 1.5;
      if (thicknessValue >= 11) fundamental += 1.6;
      if (thicknessValue >= 15) fundamental += 1.2;
    }
  }

  const attack = Number(spiderProfile.attack) || 5;
  const warmth = Number(spiderProfile.warmth) || 5;
  const projection = Number(spiderProfile.projection) || 5;
  const brightness = Number(spiderProfile.brightness) || 5;
  const control = Number(spiderProfile.control) || 5;

  fundamental += (attack - 5) * 1.8;
  fundamental -= (warmth - 5) * 1.3;
  fundamental += (projection - 5) * 0.9;
  fundamental += (brightness - 5) * 0.5;
  fundamental += (control - 5) * 0.35;

  return round2(clamp(fundamental, 55, 150));
}

function getPlayableRangeFromProfile(
  spiderProfile = {},
  shellFundamentalHz = 92,
  specs = {}
) {
  const attack = Number(spiderProfile.attack) || 5;
  const sustain = Number(spiderProfile.sustain) || 5;
  const warmth = Number(spiderProfile.warmth) || 5;
  const brightness = Number(spiderProfile.brightness) || 5;
  const control = Number(spiderProfile.control) || 5;
  const sensitivity = Number(spiderProfile.sensitivity) || 5;
  const shellFamily = normalizeLower(specs.shellFamily || 'wood');

  let center = shellFundamentalHz * 2.45;

  if (shellFamily === 'metal') center += 4;
  if (shellFamily === 'acrylic') center += 2;

  let lowOffset = 36;
  let highOffset = 54;

  lowOffset += (warmth - 5) * 2.8;
  lowOffset += (sustain - 5) * 1.4;
  lowOffset -= (attack - 5) * 1.8;
  lowOffset -= (brightness - 5) * 0.8;

  highOffset += (brightness - 5) * 3.2;
  highOffset += (attack - 5) * 1.8;
  highOffset += (sensitivity - 5) * 1.0;
  highOffset -= (warmth - 5) * 1.4;
  highOffset -= (control - 5) * 1.2;

  if (shellFamily === 'metal') {
    highOffset += 4;
    lowOffset -= 1;
  }

  if (shellFamily === 'acrylic') {
    highOffset += 2;
  }

  const lowestHz = round2(clamp(center - lowOffset, 140, 340));
  const highestHz = round2(clamp(center + highOffset, lowestHz + 30, 430));

  return {
    lowestHz,
    highestHz,
    centerHz: round2((lowestHz + highestHz) / 2),
  };
}

function getLegacyBandFromPlayableRange(
  playable,
  spiderProfile = {},
  specs = {}
) {
  const attack = Number(spiderProfile.attack) || 5;
  const warmth = Number(spiderProfile.warmth) || 5;
  const control = Number(spiderProfile.control) || 5;
  const brightness = Number(spiderProfile.brightness) || 5;
  const sensitivity = Number(spiderProfile.sensitivity) || 5;
  const sustain = Number(spiderProfile.sustain) || 5;
  const shellFamily = normalizeLower(specs.shellFamily || 'wood');

  const span = playable.highestHz - playable.lowestHz;

  let centerBias01 = 0.5;
  centerBias01 -= (warmth - 5) * 0.025;
  centerBias01 += (brightness - 5) * 0.02;
  centerBias01 += (attack - 5) * 0.015;
  centerBias01 += (control - 5) * 0.01;
  centerBias01 += (sensitivity - 5) * 0.008;

  if (shellFamily === 'metal') centerBias01 += 0.02;
  if (shellFamily === 'acrylic') centerBias01 += 0.015;

  centerBias01 = clamp(centerBias01, 0.35, 0.7);

  const legacyCenter = playable.lowestHz + span * centerBias01;

  let halfWidth = 10;
  halfWidth -= (control - 5) * 0.8;
  halfWidth -= (attack - 5) * 0.35;
  halfWidth += (sustain - 5) * 0.45;
  halfWidth += (sensitivity - 5) * 0.2;

  if (shellFamily === 'metal') halfWidth -= 0.4;
  if (shellFamily === 'wood' && warmth >= 7) halfWidth += 0.4;

  halfWidth = clamp(halfWidth, 7, 15);

  const legacyLowHz = round2(
    clamp(
      legacyCenter - halfWidth,
      playable.lowestHz + 4,
      playable.highestHz - 10
    )
  );
  const legacyHighHz = round2(
    clamp(legacyCenter + halfWidth, legacyLowHz + 8, playable.highestHz - 4)
  );

  return {
    legacyLowHz,
    legacyHighHz,
    legacyCenterHz: round2((legacyLowHz + legacyHighHz) / 2),
  };
}

function getAdjacentBands(playable, legacyBand) {
  const belowBand = {
    belowLowHz: playable.lowestHz,
    belowHighHz: round2(
      Math.max(playable.lowestHz + 8, legacyBand.legacyLowHz - 10)
    ),
  };

  const aboveBand = {
    aboveLowHz: round2(
      Math.min(playable.highestHz - 8, legacyBand.legacyHighHz + 10)
    ),
    aboveHighHz: playable.highestHz,
  };

  return {
    ...belowBand,
    ...aboveBand,
  };
}

function getLegacyWhy(specs = {}, spiderProfile = {}, tuning = {}) {
  const reasons = [];

  const construction = normalizeText(specs.construction || '');
  const shellFamily = normalizeLower(specs.shellFamily || 'wood');
  const shellDescriptor = getShellDescriptor(specs);

  if ((Number(spiderProfile.warmth) || 5) >= 7) {
    reasons.push(
      'The shell recipe leans warm and body-forward, so the LegacyPrint™ center is biased slightly lower for a fuller response.'
    );
  }

  if ((Number(spiderProfile.attack) || 5) >= 7) {
    reasons.push(
      'The build reads as articulate and fast, so the recommended sweet spot stays tight enough to preserve definition.'
    );
  }

  if ((Number(spiderProfile.control) || 5) >= 7) {
    reasons.push(
      'Because this build trends controlled and focused, the LegacyPrint™ window is narrower than a more open shell would be.'
    );
  }

  if ((Number(spiderProfile.sustain) || 5) >= 7) {
    reasons.push(
      'The drum appears capable of holding tone, so the broader playable range stays useful outside the main sweet spot.'
    );
  }

  if (shellFamily === 'metal') {
    reasons.push(
      `The ${shellDescriptor} shell direction slightly raises the working LegacyPrint™ center compared with a neutral wood baseline.`
    );
  } else if (shellFamily === 'acrylic') {
    reasons.push(
      'The acrylic shell direction slightly favors a more present and top-forward LegacyPrint™ center.'
    );
  }

  reasons.push(
    `This estimate is anchored around a shell-fundamental model of ${tuning.shellFundamentalHz} Hz (${hzToNote(tuning.shellFundamentalHz)}), then translated into a practical head-tuning range.`
  );

  if (shellFamily === 'wood') {
    reasons.push(
      `${construction || 'This construction'} with ${shellDescriptor} suggests the strongest repeatable zone will sit near ${tuning.legacyCenterHz} Hz (${hzToNote(tuning.legacyCenterHz)}).`
    );
  } else if (shellFamily === 'metal') {
    reasons.push(
      `This ${shellDescriptor}-shell build suggests the strongest repeatable zone will sit near ${tuning.legacyCenterHz} Hz (${hzToNote(tuning.legacyCenterHz)}).`
    );
  } else if (shellFamily === 'acrylic') {
    reasons.push(
      `This acrylic-shell build suggests the strongest repeatable zone will sit near ${tuning.legacyCenterHz} Hz (${hzToNote(tuning.legacyCenterHz)}).`
    );
  } else {
    reasons.push(
      `This build suggests the strongest repeatable zone will sit near ${tuning.legacyCenterHz} Hz (${hzToNote(tuning.legacyCenterHz)}).`
    );
  }

  return reasons;
}

export function scoreLegacyTuningProfile(inputSpecs = {}) {
  const specs = buildDrumSpecsFromLegacyForm(inputSpecs);
  const spiderResult = scoreSpiderProfile(specs);
  const spiderProfile = spiderResult.profile || {};

  const shellFundamentalHz = getShellFundamentalFromSpecs(specs, spiderProfile);
  const playable = getPlayableRangeFromProfile(
    spiderProfile,
    shellFundamentalHz,
    specs
  );
  const legacyBand = getLegacyBandFromPlayableRange(
    playable,
    spiderProfile,
    specs
  );
  const adjacent = getAdjacentBands(playable, legacyBand);

  const result = {
    shellFundamentalHz,
    shellFundamentalNote: hzToNote(shellFundamentalHz),

    lowestHz: playable.lowestHz,
    highestHz: playable.highestHz,
    centerHz: playable.centerHz,

    legacyLowHz: legacyBand.legacyLowHz,
    legacyHighHz: legacyBand.legacyHighHz,
    legacyCenterHz: legacyBand.legacyCenterHz,
    legacyCenterNote: hzToNote(legacyBand.legacyCenterHz),

    belowLowHz: adjacent.belowLowHz,
    belowHighHz: adjacent.belowHighHz,
    aboveLowHz: adjacent.aboveLowHz,
    aboveHighHz: adjacent.aboveHighHz,

    sweetSpots: [
      {
        id: 'below',
        label: 'Low',
        loHz: adjacent.belowLowHz,
        hiHz: adjacent.belowHighHz,
      },
      {
        id: 'legacy',
        label: 'Legacy',
        loHz: legacyBand.legacyLowHz,
        hiHz: legacyBand.legacyHighHz,
      },
      {
        id: 'above',
        label: 'High',
        loHz: adjacent.aboveLowHz,
        hiHz: adjacent.aboveHighHz,
      },
    ],

    axis: {
      loHz: playable.lowestHz,
      hiHz: playable.highestHz,
      tickHz: 20,
    },

    notes: {
      lowest: hzToNote(playable.lowestHz),
      highest: hzToNote(playable.highestHz),
      legacyLow: hzToNote(legacyBand.legacyLowHz),
      legacyHigh: hzToNote(legacyBand.legacyHighHz),
    },

    confidence01: round2(
      clamp((Number(spiderResult.confidence01) || 0.7) * 0.8 + 0.08, 0.45, 0.92)
    ),
  };

  result.confidencePercent = Math.round(result.confidence01 * 100);
  result.why = getLegacyWhy(specs, spiderProfile, result);

  return result;
}

export default scoreLegacyTuningProfile;
