// src/utils/aiToneEngine/hoopHeuristics.js

const DEFAULT_PROFILE = {
  attack: 5,
  sustain: 5,
  warmth: 5,
  projection: 5,
  brightness: 5,
  sensitivity: 5,
  control: 5,
};

const clamp = (value, min = 1, max = 10) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return min;
  return Math.max(min, Math.min(max, num));
};

const round2 = (n) => Math.round(n * 100) / 100;

function normalizeString(value) {
  return String(value || '').trim().toLowerCase();
}

function buildResult({
  id = 'unknown',
  label = 'Unknown',
  profile = DEFAULT_PROFILE,
  confidence01 = 0.6,
  reasons = [],
}) {
  const safeConfidence = Math.max(0.35, Math.min(0.9, Number(confidence01) || 0.6));

  return {
    id,
    label,
    profile: {
      attack: round2(clamp(profile.attack)),
      sustain: round2(clamp(profile.sustain)),
      warmth: round2(clamp(profile.warmth)),
      projection: round2(clamp(profile.projection)),
      brightness: round2(clamp(profile.brightness)),
      sensitivity: round2(clamp(profile.sensitivity)),
      control: round2(clamp(profile.control)),
    },
    confidence01: round2(safeConfidence),
    confidencePercent: Math.round(safeConfidence * 100),
    reasons:
      reasons.length > 0
        ? reasons
        : ['Hoop profile estimated from Ober heuristic assumptions.'],
  };
}

export function deriveHoopHeuristicProfile(input) {
  const value = normalizeString(input);

  if (!value) {
    return buildResult({
      id: 'default',
      label: 'Default',
      profile: DEFAULT_PROFILE,
      confidence01: 0.42,
      reasons: [
        'No hoop type was provided, so a neutral fallback hoop profile was used.',
      ],
    });
  }

  if (
    value.includes('die-cast') ||
    value.includes('die cast') ||
    value.includes('diecast')
  ) {
    return buildResult({

      id: 'die-cast',

      label: 'Die-Cast',

      profile: {

        attack: 7.4,

        sustain: 5.9,

        warmth: 5.7,

        projection: 7.0,

        brightness: 6.4,

        sensitivity: 5.8,

        control: 7.1,

      },

      confidence01: 0.8,

      reasons: [

        'Die-cast hoops are treated as more focused and controlled, with firmer note shape and a slightly tighter front edge.',

        'They should increase discipline and focus without making the drum feel unnaturally modern or over-hyped.',

      ],

    });
  }

  if (
    value.includes('triple-flanged') ||
    value.includes('triple flanged') ||
    value.includes('flanged') ||
    value.includes('triple')
  ) {
    return buildResult({

      id: 'triple-flanged',

      label: 'Triple-Flanged',

      profile: {

        attack: 6.4,

        sustain: 6.9,

        warmth: 6.6,

        projection: 6.2,

        brightness: 5.6,

        sensitivity: 6.7,

        control: 5.8,

      },

      confidence01: 0.78,

      reasons: [

        'Triple-flanged hoops are treated as the more open and familiar Heritage baseline.',

        'They allow a little more give and bloom, but should stay fairly centered rather than overly warm, overly soft, or dramatically resonant.',

      ],

    });
  }

  if (value.includes('wood')) {
    return buildResult({
      id: 'wood-hoop',
      label: 'Wood Hoop',
      profile: {
        attack: 5.9,
        sustain: 7.8,
        warmth: 8.3,
        projection: 6.1,
        brightness: 4.9,
        sensitivity: 6.9,
        control: 5.4,
      },
      confidence01: 0.72,
      reasons: [
        'Wood hoops are treated as warmer and softer-edged, often with a more organic note shape.',
        'They usually reduce metallic sharpness and shift the feel toward body, tone, and touch response.',
      ],
    });
  }

  return buildResult({
    id: 'default',
    label: input || 'Unknown',
    profile: DEFAULT_PROFILE,
    confidence01: 0.5,
    reasons: [
      `Hoop type "${input}" does not yet have a dedicated heuristic profile, so a neutral fallback was used.`,
    ],
  });
}

export default deriveHoopHeuristicProfile;