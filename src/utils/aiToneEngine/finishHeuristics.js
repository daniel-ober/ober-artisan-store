// src/utils/aiToneEngine/finishHeuristics.js

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
        : ['Finish profile estimated from Ober heuristic assumptions.'],
  };
}

export function deriveFinishHeuristicProfile(input) {
  const value = normalizeString(input);

  if (!value) {
    return buildResult({
      id: 'default',
      label: 'Default',
      profile: DEFAULT_PROFILE,
      confidence01: 0.42,
      reasons: [
        'No finish type was provided, so a neutral fallback finish profile was used.',
      ],
    });
  }

  if (
    value.includes('raw') ||
    value.includes('unfinished') ||
    value.includes('natural oil') ||
    value.includes('oil finish') ||
    value.includes('hand-rubbed oil')
  ) {
    return buildResult({
      id: 'raw-oil-finish',
      label: 'Raw / Oil Finish',
      profile: {
        attack: 6.7,
        sustain: 7.2,
        warmth: 7.0,
        projection: 6.7,
        brightness: 5.9,
        sensitivity: 6.9,
        control: 5.8,
      },
      confidence01: 0.66,
      reasons: [
        'Thinner, less built-up finishes are treated as allowing the shell to stay a little more open and lively.',
        'They usually lean slightly warmer and more resonant than heavier film-style finishes.',
      ],
    });
  }

  if (
    value.includes('wax') ||
    value.includes('satin oil') ||
    value.includes('matte oil')
  ) {
    return buildResult({
      id: 'wax-oil-finish',
      label: 'Wax / Satin Oil Finish',
      profile: {
        attack: 6.8,
        sustain: 7.0,
        warmth: 6.9,
        projection: 6.8,
        brightness: 6.0,
        sensitivity: 6.8,
        control: 5.9,
      },
      confidence01: 0.64,
      reasons: [
        'Wax and light oil finishes are treated as slightly open and organic in response.',
        'They usually preserve shell character without pushing the sound toward an overly hard top end.',
      ],
    });
  }

  if (
    value.includes('lacquer') ||
    value.includes('lacquered') ||
    value.includes('nitro')
  ) {
    return buildResult({
      id: 'lacquer-finish',
      label: 'Lacquer Finish',
      profile: {
        attack: 7.0,
        sustain: 6.7,
        warmth: 6.5,
        projection: 6.9,
        brightness: 6.3,
        sensitivity: 6.5,
        control: 6.1,
      },
      confidence01: 0.72,
      reasons: [
        'Lacquer is treated as a balanced middle-ground finish in Ober voicing logic.',
        'It usually supports a polished, controlled shell response without sounding as damped as thicker coatings.',
      ],
    });
  }

  if (
    value.includes('gloss') ||
    value.includes('poly') ||
    value.includes('polyurethane') ||
    value.includes('high gloss')
  ) {
    return buildResult({
      id: 'gloss-poly-finish',
      label: 'Gloss / Poly Finish',
      profile: {
        attack: 7.3,
        sustain: 6.2,
        warmth: 6.0,
        projection: 7.1,
        brightness: 6.7,
        sensitivity: 6.1,
        control: 6.6,
      },
      confidence01: 0.7,
      reasons: [
        'Heavier gloss-style finishes are treated as slightly firmer and more controlled than thinner finishes.',
        'They tend to support a cleaner front edge and a subtly more polished, contained response.',
      ],
    });
  }

  if (
    value.includes('matte') ||
    value.includes('satin')
  ) {
    return buildResult({
      id: 'matte-satin-finish',
      label: 'Matte / Satin Finish',
      profile: {
        attack: 6.9,
        sustain: 6.8,
        warmth: 6.7,
        projection: 6.8,
        brightness: 6.1,
        sensitivity: 6.6,
        control: 6.0,
      },
      confidence01: 0.67,
      reasons: [
        'Matte and satin finishes are treated as living near the middle between raw openness and gloss-style firmness.',
        'They usually preserve balance without strongly exaggerating either warmth or edge.',
      ],
    });
  }

  return buildResult({
    id: 'default',
    label: input || 'Unknown',
    profile: DEFAULT_PROFILE,
    confidence01: 0.5,
    reasons: [
      `Finish type "${input}" does not yet have a dedicated heuristic profile, so a neutral fallback was used.`,
    ],
  });
}

export default deriveFinishHeuristicProfile;