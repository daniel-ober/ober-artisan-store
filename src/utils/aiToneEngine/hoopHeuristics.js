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
        attack: 8.0,
        sustain: 6.1,
        warmth: 5.8,
        projection: 7.8,
        brightness: 7.0,
        sensitivity: 6.0,
        control: 7.2,
      },
      confidence01: 0.8,
      reasons: [
        'Die-cast hoops are treated as more focused and controlled, with stronger attack definition.',
        'They usually support a tighter-feeling response with added rim rigidity and cleaner note shape.',
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
        attack: 6.8,
        sustain: 7.3,
        warmth: 6.9,
        projection: 6.8,
        brightness: 6.0,
        sensitivity: 6.8,
        control: 5.8,
      },
      confidence01: 0.78,
      reasons: [
        'Triple-flanged hoops are treated as a more open and flexible-feeling option than die-cast.',
        'They generally allow a little more give, openness, and ring while retaining familiar snare behavior.',
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