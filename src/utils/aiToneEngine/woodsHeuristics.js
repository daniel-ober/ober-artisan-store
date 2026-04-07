// src/utils/aiToneEngine/woodsHeuristics.js

import WOODS_CATALOG, {
  getWoodById,
  getWoodByLabel,
  getWoodPhysicalProperty,
} from '../../data/catalog/woods.catalog';

/**
 * IMPORTANT
 * ----------
 * These are Ober heuristics.
 * They are not lab-grade acoustic truths.
 *
 * They translate:
 * - physical properties
 * - common builder tendencies
 * - Ober voicing assumptions
 *
 * into normalized 1..10 tonal tendencies with confidence.
 */

const clamp = (value, min = 1, max = 10) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return min;
  return Math.max(min, Math.min(max, num));
};

const lerpToScale = (value01, min = 1, max = 10) => {
  const v = Math.max(0, Math.min(1, Number(value01) || 0));
  return min + (max - min) * v;
};

const round2 = (n) => Math.round(n * 100) / 100;

function normalizeDensity(weightLbsFt3) {
  const min = 30;
  const max = 60;
  if (!Number.isFinite(weightLbsFt3)) return 0.5;
  return Math.max(0, Math.min(1, (weightLbsFt3 - min) / (max - min)));
}

function normalizeHardness(jankaLbf) {
  const min = 800;
  const max = 2600;
  if (!Number.isFinite(jankaLbf)) return 0.5;
  return Math.max(0, Math.min(1, (jankaLbf - min) / (max - min)));
}

function confidenceFromWood(wood) {
  const weight = getWoodPhysicalProperty(wood, 'averageDriedWeightLbsFt3', null);
  const sg = getWoodPhysicalProperty(wood, 'specificGravity', null);
  const janka = getWoodPhysicalProperty(wood, 'jankaLbf', null);

  let score = 0.35;

  if (Number.isFinite(weight)) score += 0.18;
  if (Number.isFinite(sg)) score += 0.18;
  if (Number.isFinite(janka)) score += 0.16;

  const steamBending = wood?.facts?.steamBending?.value;
  const workability = wood?.facts?.workability?.value;
  const stability = wood?.facts?.stability?.value;

  if (steamBending) score += 0.04;
  if (workability) score += 0.04;
  if (stability) score += 0.05;

  return Math.max(0.35, Math.min(0.9, round2(score)));
}

function buildBaseProfileFromPhysicals(wood) {
  const weight = getWoodPhysicalProperty(wood, 'averageDriedWeightLbsFt3', null);
  const janka = getWoodPhysicalProperty(wood, 'jankaLbf', null);

  const densityNorm = normalizeDensity(weight);
  const hardnessNorm = normalizeHardness(janka);

  // Base heuristics:
  // - denser / harder woods tend to push attack, projection, control
  // - lighter / softer woods tend to lean warmer / more open
  const attack = clamp(lerpToScale(0.35 + densityNorm * 0.35 + hardnessNorm * 0.2));
  const projection = clamp(lerpToScale(0.35 + densityNorm * 0.4 + hardnessNorm * 0.15));
  const brightness = clamp(lerpToScale(0.4 + densityNorm * 0.22 + hardnessNorm * 0.15));
  const control = clamp(lerpToScale(0.35 + densityNorm * 0.28 + hardnessNorm * 0.18));
  const sustain = clamp(lerpToScale(0.42 + densityNorm * 0.15));
  const warmth = clamp(lerpToScale(0.62 - densityNorm * 0.18 - hardnessNorm * 0.08));
  const sensitivity = clamp(lerpToScale(0.52 - densityNorm * 0.05 + (1 - hardnessNorm) * 0.05));

  return {
    attack: round2(attack),
    sustain: round2(sustain),
    warmth: round2(warmth),
    projection: round2(projection),
    brightness: round2(brightness),
    sensitivity: round2(sensitivity),
    control: round2(control),
  };
}

const OBER_WOOD_OVERRIDES = {
  maple: {
    profile: {
      attack: 7.5,
      sustain: 6.8,
      warmth: 6.0,
      projection: 7.4,
      brightness: 6.6,
      sensitivity: 6.4,
      control: 6.2,
    },
    reasons: [
      'Maple is treated by Ober as the balanced benchmark species.',
      'It supports articulate builds without becoming overly hard-edged in normal shell recipes.',
    ],
  },
  walnut: {
    profile: {
      attack: 6.1,
      sustain: 7.3,
      warmth: 8.2,
      projection: 6.4,
      brightness: 5.2,
      sensitivity: 6.9,
      control: 5.9,
    },
    reasons: [
      'Walnut is treated as fuller and richer than maple in Ober voicing language.',
      'It often fits builds where smoothness and body matter more than sharp attack.',
    ],
  },
  cherry: {
    profile: {
      attack: 6.6,
      sustain: 7.1,
      warmth: 7.4,
      projection: 6.7,
      brightness: 5.8,
      sensitivity: 6.7,
      control: 6.0,
    },
    reasons: [
      'Cherry sits in a sweet middle area for refined, warm-but-clear builds.',
      'It is often a tasteful alternative when maple feels too common and walnut too dark.',
    ],
  },
  mahogany: {
    profile: {
      attack: 5.5,
      sustain: 7.7,
      warmth: 8.8,
      projection: 5.7,
      brightness: 4.5,
      sensitivity: 7.1,
      control: 5.7,
    },
    reasons: [
      'Mahogany-leaning woods are treated as warm, deep, and body-forward.',
      'They suit builds where rounded response matters more than fast articulation.',
    ],
  },
  birch: {
    profile: {
      attack: 8.1,
      sustain: 6.2,
      warmth: 5.3,
      projection: 7.9,
      brightness: 7.8,
      sensitivity: 6.0,
      control: 6.7,
    },
    reasons: [
      'Birch is often treated as focused and recording-friendly.',
      'It fits builds where presence and clarity matter more than broad warmth.',
    ],
  },
  oak: {
    profile: {
      attack: 7.9,
      sustain: 6.4,
      warmth: 6.3,
      projection: 8.4,
      brightness: 6.1,
      sensitivity: 5.6,
      control: 7.1,
    },
    reasons: [
      'Oak is treated as strong, authoritative, and durable-feeling.',
      'It tends to fit bolder builds rather than the softest or most delicate ones.',
    ],
  },
  ash: {
    profile: {
      attack: 7.5,
      sustain: 6.9,
      warmth: 6.1,
      projection: 8.0,
      brightness: 7.0,
      sensitivity: 6.1,
      control: 6.2,
    },
    reasons: [
      'Ash is treated as lively and open with strong throw.',
      'It is a good fit when openness and grain character are part of the concept.',
    ],
  },
  bubinga: {
    profile: {
      attack: 8.2,
      sustain: 7.3,
      warmth: 7.4,
      projection: 8.6,
      brightness: 5.8,
      sensitivity: 5.5,
      control: 7.2,
    },
    reasons: [
      'Bubinga is treated as a dense premium species with strong presence and authority.',
      'It suits builds where body and premium seriousness are central to the brief.',
    ],
  },
  purpleheart: {
    profile: {
      attack: 8.4,
      sustain: 6.7,
      warmth: 5.7,
      projection: 8.5,
      brightness: 7.4,
      sensitivity: 5.5,
      control: 7.2,
    },
    reasons: [
      'Purpleheart is treated as a dense, assertive, articulate species.',
      'It is often best as a deliberate accent or a strong design statement.',
    ],
  },
  wenge: {
    profile: {
      attack: 7.9,
      sustain: 7.1,
      warmth: 7.7,
      projection: 8.1,
      brightness: 6.0,
      sensitivity: 5.7,
      control: 7.1,
    },
    reasons: [
      'Wenge is treated as rich, premium, and structurally serious.',
      'It often supports low-mid authority without becoming sonically dull.',
    ],
  },
  padauk: {
    profile: {
      attack: 7.4,
      sustain: 6.8,
      warmth: 7.0,
      projection: 7.9,
      brightness: 6.4,
      sensitivity: 6.0,
      control: 6.5,
    },
    reasons: [
      'Padauk is treated as bold and present while still carrying warmth.',
      'It works when the build wants both visual drama and confident tone.',
    ],
  },
  sapele: {
    profile: {
      attack: 6.6,
      sustain: 7.2,
      warmth: 7.6,
      projection: 6.6,
      brightness: 5.5,
      sensitivity: 6.7,
      control: 6.0,
    },
    reasons: [
      'Sapele is treated as warm and balanced with a little more definition than darker expectations might suggest.',
      'It is a strong candidate for balanced warmth rather than extreme softness.',
    ],
  },
  acacia: {
    profile: {
      attack: 7.3,
      sustain: 6.8,
      warmth: 6.3,
      projection: 7.7,
      brightness: 6.8,
      sensitivity: 6.2,
      control: 6.3,
    },
    reasons: [
      'Acacia is treated as lively and balanced with a confident but not overly harsh response.',
      'It fits builds that want visual richness with a strong all-around tonal posture.',
    ],
  },
  beech: {
    profile: {
      attack: 7.2,
      sustain: 6.9,
      warmth: 6.6,
      projection: 7.5,
      brightness: 6.5,
      sensitivity: 6.2,
      control: 6.5,
    },
    reasons: [
      'Beech is treated as balanced, punchy, and dependable with good structural consistency.',
      'It suits builds that want controlled strength without sounding overly aggressive.',
    ],
  },
  jatoba: {
    profile: {
      attack: 8.3,
      sustain: 7.2,
      warmth: 6.1,
      projection: 8.6,
      brightness: 6.8,
      sensitivity: 5.4,
      control: 7.3,
    },
    reasons: [
      'Jatoba is treated as dense, stiff, and serious with strong projection and sustain.',
      'It fits builds that want authority and a more forceful tonal profile.',
    ],
  },
  kapur: {
    profile: {
      attack: 7.3,
      sustain: 6.9,
      warmth: 6.7,
      projection: 7.8,
      brightness: 6.1,
      sensitivity: 6.0,
      control: 6.6,
    },
    reasons: [
      'Kapur is treated as a balanced but firm hardwood with good tonal backbone.',
      'It is a useful less-common choice when projection and structure both matter.',
    ],
  },
  leopardwood: {
    profile: {
      attack: 7.4,
      sustain: 6.5,
      warmth: 6.6,
      projection: 7.5,
      brightness: 6.9,
      sensitivity: 5.9,
      control: 6.5,
    },
    reasons: [
      'Leopardwood is treated as present and articulate with strong visual identity.',
      'It works well when a specialty wood should still feel musically balanced and usable.',
    ],
  },
  mango: {
    profile: {
      attack: 6.2,
      sustain: 7.4,
      warmth: 7.8,
      projection: 6.1,
      brightness: 5.4,
      sensitivity: 6.9,
      control: 5.7,
    },
    reasons: [
      'Mango is treated as warm-leaning and resonant with a slightly softer overall posture.',
      'It suits builds that want openness, body, and a more organic feel.',
    ],
  },
  poplar: {
    profile: {
      attack: 5.4,
      sustain: 6.9,
      warmth: 7.8,
      projection: 5.4,
      brightness: 4.8,
      sensitivity: 7.0,
      control: 5.3,
    },
    reasons: [
      'Poplar is treated as softer, warmer, and less forceful than denser hardwood shell choices.',
      'It is most useful in lighter-weight or blended directions rather than maximum projection builds.',
    ],
  },
};

export function resolveWood(input) {
  if (!input) return null;
  if (typeof input === 'string') {
    return getWoodById(input) || getWoodByLabel(input);
  }
  if (typeof input === 'object' && input.id) {
    return getWoodById(input.id) || input;
  }
  return null;
}

export function deriveWoodHeuristicProfile(input) {
  const wood = resolveWood(input);
  if (!wood) return null;

  const override = OBER_WOOD_OVERRIDES[wood.id];
  const baseProfile = buildBaseProfileFromPhysicals(wood);

  const profile = {
    attack: round2(
      clamp(
        override?.profile?.attack ?? baseProfile.attack
      )
    ),
    sustain: round2(
      clamp(
        override?.profile?.sustain ?? baseProfile.sustain
      )
    ),
    warmth: round2(
      clamp(
        override?.profile?.warmth ?? baseProfile.warmth
      )
    ),
    projection: round2(
      clamp(
        override?.profile?.projection ?? baseProfile.projection
      )
    ),
    brightness: round2(
      clamp(
        override?.profile?.brightness ?? baseProfile.brightness
      )
    ),
    sensitivity: round2(
      clamp(
        override?.profile?.sensitivity ?? baseProfile.sensitivity
      )
    ),
    control: round2(
      clamp(
        override?.profile?.control ?? baseProfile.control
      )
    ),
  };
  const confidence01 = confidenceFromWood(wood);

  return {
    woodId: wood.id,
    label: wood.label,
    profile,
    confidence01,
    confidencePercent: Math.round(confidence01 * 100),
    reasons: [
      ...(override?.reasons || [
        'This profile was estimated from known physical properties plus Ober heuristic mapping.',
      ]),
      `Confidence reflects available physical property coverage for ${wood.label}.`,
    ],
    evidenceSummary: {
      averageDriedWeightLbsFt3: getWoodPhysicalProperty(wood, 'averageDriedWeightLbsFt3', null),
      specificGravity: getWoodPhysicalProperty(wood, 'specificGravity', null),
      jankaLbf: getWoodPhysicalProperty(wood, 'jankaLbf', null),
    },
  };
}

export function blendWoodProfiles(woods = []) {
  const resolved = woods
    .map((item) => {
      if (typeof item === 'string') {
        return { wood: resolveWood(item), ratio: null };
      }

      return {
        wood: resolveWood(item?.wood || item?.id || item?.label),
        ratio: Number.isFinite(Number(item?.ratio)) ? Number(item.ratio) : null,
      };
    })
    .filter((entry) => entry.wood);

  if (!resolved.length) return null;

  const defaultRatio = 1 / resolved.length;
  const normalized = resolved.map((entry) => ({
    ...entry,
    ratio: entry.ratio && entry.ratio > 0 ? entry.ratio : defaultRatio,
  }));

  const totalRatio = normalized.reduce((sum, entry) => sum + entry.ratio, 0) || 1;

  const profiles = normalized.map((entry) => ({
    ...entry,
    heuristic: deriveWoodHeuristicProfile(entry.wood),
    normalizedRatio: entry.ratio / totalRatio,
  }));

  const axes = ['attack', 'sustain', 'warmth', 'projection', 'brightness', 'sensitivity', 'control'];

  const blendedProfile = axes.reduce((acc, axis) => {
    acc[axis] = round2(
      profiles.reduce((sum, entry) => {
        const axisValue = entry.heuristic?.profile?.[axis] ?? 5;
        return sum + axisValue * entry.normalizedRatio;
      }, 0)
    );
    return acc;
  }, {});

  const confidence01 = round2(
    profiles.reduce((sum, entry) => {
      return sum + (entry.heuristic?.confidence01 ?? 0.5) * entry.normalizedRatio;
    }, 0)
  );

  return {
    woods: profiles.map((entry) => ({
      woodId: entry.wood.id,
      label: entry.wood.label,
      ratio: round2(entry.normalizedRatio),
    })),
    profile: blendedProfile,
    confidence01,
    confidencePercent: Math.round(confidence01 * 100),
    reasons: [
      'This blended profile is a weighted Ober heuristic from the selected species mix.',
      'It should be treated as a direction signal, not a lab-measured acoustic result.',
    ],
  };
}

export function getAllWoodHeuristicProfiles() {
  return WOODS_CATALOG.map((wood) => deriveWoodHeuristicProfile(wood));
}

export default {
  resolveWood,
  deriveWoodHeuristicProfile,
  blendWoodProfiles,
  getAllWoodHeuristicProfiles,
};