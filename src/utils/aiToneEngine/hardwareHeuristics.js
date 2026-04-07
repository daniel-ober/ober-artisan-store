// src/utils/aiToneEngine/hardwareHeuristics.js

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
  const safeConfidence = Math.max(
    0.35,
    Math.min(0.9, Number(confidence01) || 0.6)
  );

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
        : ['Hardware profile estimated from Ober heuristic assumptions.'],
  };
}

export function deriveHardwareHeuristicProfile(input) {
  const value = normalizeString(input);

  if (!value) {
    return buildResult({
      id: 'default',
      label: 'Default',
      profile: DEFAULT_PROFILE,
      confidence01: 0.42,
      reasons: [
        'No hardware type was provided, so a neutral fallback hardware profile was used.',
      ],
    });
  }

  if (
    value.includes('tube') ||
    value.includes('single-point') ||
    value.includes('single point')
  ) {
    return buildResult({
      id: 'tube-lugs',
      label: 'Tube Lugs',
      profile: {
        attack: 6.9,
        sustain: 7.2,
        warmth: 6.8,
        projection: 6.7,
        brightness: 6.0,
        sensitivity: 6.9,
        control: 5.8,
      },
      confidence01: 0.72,
      reasons: [
        'Tube-style hardware is treated as slightly more open and resonant because of reduced shell contact.',
        'It generally supports a lively, less damped response compared with bulkier lug formats.',
      ],
    });
  }

  if (
    value.includes('standard') ||
    value.includes('classic') ||
    value.includes('lug')
  ) {
    return buildResult({
      id: 'standard-lugs',
      label: 'Standard Lugs',
      profile: {
        attack: 7.0,
        sustain: 6.6,
        warmth: 6.4,
        projection: 6.9,
        brightness: 6.3,
        sensitivity: 6.5,
        control: 6.2,
      },
      confidence01: 0.74,
      reasons: [
        'Standard lug hardware is treated as the baseline reference point for neutral snare behavior.',
        'It usually supports a balanced mix of response, control, and projection without strongly biasing the shell.',
      ],
    });
  }

  if (
    value.includes('low-mass') ||
    value.includes('low mass') ||
    value.includes('mini')
  ) {
    return buildResult({
      id: 'low-mass-hardware',
      label: 'Low-Mass Hardware',
      profile: {
        attack: 6.8,
        sustain: 7.4,
        warmth: 6.7,
        projection: 6.6,
        brightness: 6.2,
        sensitivity: 7.1,
        control: 5.7,
      },
      confidence01: 0.7,
      reasons: [
        'Low-mass hardware is treated as allowing a little more shell movement and openness.',
        'It often nudges the feel toward resonance and touch response rather than maximum control.',
      ],
    });
  }

  if (
    value.includes('heavy') ||
    value.includes('high-mass') ||
    value.includes('high mass')
  ) {
    return buildResult({
      id: 'high-mass-hardware',
      label: 'High-Mass Hardware',
      profile: {
        attack: 7.5,
        sustain: 6.0,
        warmth: 6.1,
        projection: 7.3,
        brightness: 6.4,
        sensitivity: 6.0,
        control: 7.0,
      },
      confidence01: 0.71,
      reasons: [
        'Heavier hardware is treated as pushing the drum toward a firmer, more controlled response.',
        'It generally supports a stronger front edge and a slightly more contained note shape.',
      ],
    });
  }

  return buildResult({
    id: 'default',
    label: input || 'Unknown',
    profile: DEFAULT_PROFILE,
    confidence01: 0.5,
    reasons: [
      `Hardware type "${input}" does not yet have a dedicated heuristic profile, so a neutral fallback was used.`,
    ],
  });
}

export default deriveHardwareHeuristicProfile;