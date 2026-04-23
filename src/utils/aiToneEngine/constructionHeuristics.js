// src/utils/aiToneEngine/constructionHeuristics.js

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
    confidence01: round2(Math.max(0.35, Math.min(0.9, confidence01))),
    confidencePercent: Math.round(
      Math.max(0.35, Math.min(0.9, confidence01)) * 100
    ),
    reasons:
      reasons.length > 0
        ? reasons
        : [
            'Construction profile estimated from Ober heuristic assumptions.',
          ],
  };
}

export function deriveConstructionHeuristicProfile(input) {
  const value = normalizeString(input);

  if (!value) {
    return buildResult({
      id: 'default',
      label: 'Default',
      profile: DEFAULT_PROFILE,
      confidence01: 0.42,
      reasons: [
        'No shell construction was provided, so a neutral fallback construction profile was used.',
      ],
    });
  }

  if (value.includes('hybrid')) {
    return buildResult({
      id: 'hybrid',
      label: 'Hybrid',
      profile: {
        attack: 7.5,
        sustain: 7.1,
        warmth: 6.9,
        projection: 7.7,
        brightness: 6.6,
        sensitivity: 6.5,
        control: 6.5,
      },
      confidence01: 0.78,
      reasons: [
        'Hybrid shells are treated in Ober voicing as a deliberate blend of projection, complexity, and tonal balance.',
        'They often preserve some stave-like authority while allowing the outer shell choice to shape feel and response.',
      ],
    });
  }

  if (value.includes('ply')) {
    return buildResult({
      id: 'ply',
      label: 'Ply',
      profile: {
        attack: 6.8,
        sustain: 6.8,
        warmth: 6.6,
        projection: 6.9,
        brightness: 6.4,
        sensitivity: 6.7,
        control: 6.2,
      },
      confidence01: 0.74,
      reasons: [
        'Ply construction is treated as a balanced, familiar baseline with relatively even behavior.',
        'It tends to sit in a dependable middle area rather than pushing to the extremes of openness or authority.',
      ],
    });
  }

  if (value.includes('steam')) {
    return buildResult({
      id: 'steam-bent',
      label: 'Steam Bent',
      profile: {
        attack: 6.2,
        sustain: 8.0,
        warmth: 7.8,
        projection: 6.6,
        brightness: 5.6,
        sensitivity: 7.2,
        control: 5.6,
      },
      confidence01: 0.76,
      reasons: [
        'Steam-bent shells are treated as more open and resonant, often with added warmth and length of note.',
        'They usually lean less rigid than stave shells and more toward flow, body, and openness.',
      ],
    });
  }

  if (value.includes('stave')) {

    return buildResult({

      id: 'stave',

      label: 'Stave',

      profile: {

        attack: 7.1,

        sustain: 6.7,

        warmth: 6.6,

        projection: 6.9,

        brightness: 6.0,

        sensitivity: 6.2,

        control: 6.4,

      },

      confidence01: 0.8,

      reasons: [

        'Stave construction in the Heritage context is treated as solid and articulate, but not exaggeratedly aggressive.',

        'It supports shell identity, note shape, and body without automatically forcing the read too modern, too bright, or too projection-heavy.',

      ],

    });

  }

  return buildResult({
    id: 'default',
    label: input || 'Unknown',
    profile: DEFAULT_PROFILE,
    confidence01: 0.5,
    reasons: [
      `Construction "${input}" does not yet have a dedicated heuristic profile, so a neutral fallback was used.`,
    ],
  });
}

export default deriveConstructionHeuristicProfile;