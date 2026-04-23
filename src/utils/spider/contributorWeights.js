// src/utils/spider/contributorWeights.js

import { INTERNAL_SPIDER_AXES } from './axes.js';

/**

 * This file replaces the old "distributions" idea with a cleaner model:

 * - weight: how much a contributor matters to an axis

 * - confidence: how confident Ober is in that weighting

 * - sourceType: where the weighting mainly comes from

 *

 * IMPORTANT:

 * These are not "objective acoustic truths."

 * They are Ober weighted heuristics used to estimate tonal character.

 */

export const SPIDER_SOURCE_TYPES = Object.freeze({
  PHYSICAL_PLUS_OBER: 'physical_plus_ober',

  OBER_INTERNAL: 'ober_internal',

  USER_CONTEXTUAL: 'user_contextual',

  HYBRID: 'hybrid',
});

function contributor({
  id,

  axis,

  contributorKey,

  weight,

  confidence,

  sourceType,

  rationale,
}) {
  return {
    id,

    axis,

    contributorKey,

    weight,

    confidence,

    sourceType,

    rationale,
  };
}

export const SPIDER_CONTRIBUTOR_WEIGHTS = [
  // ATTACK

  contributor({
    id: 'attack-head-tension',

    axis: 'attack',

    contributorKey: 'headTension',

    weight: 0.09,

    confidence: 0.8,

    sourceType: SPIDER_SOURCE_TYPES.HYBRID,

    rationale:
      'Functional tension strongly affects immediacy and perceived snap.',
  }),

  contributor({
    id: 'attack-head-type',

    axis: 'attack',

    contributorKey: 'headType',

    weight: 0.07,

    confidence: 0.75,

    sourceType: SPIDER_SOURCE_TYPES.HYBRID,

    rationale:
      'Head construction changes the sharpness and firmness of the initial strike.',
  }),

  contributor({
    id: 'attack-bearing-edge',

    axis: 'attack',

    contributorKey: 'bearingEdge',

    weight: 0.11,

    confidence: 0.68,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Edge geometry materially affects how directly the head presents articulation.',
  }),

  contributor({
    id: 'attack-shell-construction',

    axis: 'attack',

    contributorKey: 'shellConstruction',

    weight: 0.08,

    confidence: 0.64,

    sourceType: SPIDER_SOURCE_TYPES.PHYSICAL_PLUS_OBER,

    rationale:
      'Shell rigidity and construction style influence how quickly energy presents.',
  }),

  contributor({
    id: 'attack-shell-material',

    axis: 'attack',

    contributorKey: 'shellMaterial',

    weight: 0.09,

    confidence: 0.61,

    sourceType: SPIDER_SOURCE_TYPES.PHYSICAL_PLUS_OBER,

    rationale:
      'Shell material or species family meaningfully affects attack character, especially across wood, metal, and acrylic.',
  }),

  contributor({
    id: 'attack-depth',

    axis: 'attack',

    contributorKey: 'depth',

    weight: 0.1,

    confidence: 0.62,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale: 'Shallower drums often feel quicker and more immediate.',
  }),

  contributor({
    id: 'attack-diameter',

    axis: 'attack',

    contributorKey: 'diameter',

    weight: 0.07,

    confidence: 0.58,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Smaller diameters usually feel quicker and more compact, while larger diameters tend to soften immediacy.',
  }),

  contributor({
    id: 'attack-shell-thickness',

    axis: 'attack',

    contributorKey: 'shellThickness',

    weight: 0.08,

    confidence: 0.55,

    sourceType: SPIDER_SOURCE_TYPES.PHYSICAL_PLUS_OBER,

    rationale: 'Thickness and stiffness influence directness of response.',
  }),

  contributor({
    id: 'attack-lug-quantity',

    axis: 'attack',

    contributorKey: 'lugQuantity',

    weight: 0.04,

    confidence: 0.66,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Lug count changes tensioning density and overall firmness of the note front.',
  }),

  contributor({
    id: 'attack-stave-count',

    axis: 'attack',

    contributorKey: 'staveCount',

    weight: 0.04,

    confidence: 0.63,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Stave count can subtly shift articulation, resonance behavior, and shell firmness even within related thickness zones.',
  }),

  contributor({
    id: 'attack-hoop-type',

    axis: 'attack',

    contributorKey: 'hoopType',

    weight: 0.07,

    confidence: 0.65,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale: 'Hoop family changes focus, rebound feel, and edge response.',
  }),

  contributor({
    id: 'attack-snare-response',

    axis: 'attack',

    contributorKey: 'snareResponse',

    weight: 0.07,

    confidence: 0.71,

    sourceType: SPIDER_SOURCE_TYPES.HYBRID,

    rationale:
      'The total snare-response system changes how crisp and immediate the drum feels under the stick.',
  }),

  contributor({
    id: 'attack-snare-wire-style',

    axis: 'attack',

    contributorKey: 'snareWireStyle',

    weight: 0.02,

    confidence: 0.62,

    sourceType: SPIDER_SOURCE_TYPES.HYBRID,

    rationale:
      'Wire style can make the response feel drier, crisper, or more open at the moment of impact.',
  }),

  contributor({
    id: 'attack-snare-side-head',

    axis: 'attack',

    contributorKey: 'snareSideHead',

    weight: 0.02,

    confidence: 0.68,

    sourceType: SPIDER_SOURCE_TYPES.HYBRID,

    rationale:
      'Snare-side head thickness contributes to how quickly the snare system reacts.',
  }),

  contributor({
    id: 'attack-hardware-type',

    axis: 'attack',

    contributorKey: 'hardwareType',

    weight: 0.02,

    confidence: 0.48,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Hardware mass and lug style can slightly tighten or soften the initial feel.',
  }),

  contributor({
    id: 'attack-rerings',

    axis: 'attack',

    contributorKey: 'reRings',

    weight: 0.02,

    confidence: 0.52,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Re-rings can add a little structural focus and firmness to the front of the note.',
  }),

  contributor({
    id: 'attack-finish-type',

    axis: 'attack',

    contributorKey: 'finishType',

    weight: 0.01,

    confidence: 0.38,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Finish build can subtly affect liveliness, but usually with modest tonal impact.',
  }),

  // SUSTAIN

  contributor({
    id: 'sustain-shell-construction',

    axis: 'sustain',

    contributorKey: 'shellConstruction',

    weight: 0.11,

    confidence: 0.68,

    sourceType: SPIDER_SOURCE_TYPES.PHYSICAL_PLUS_OBER,

    rationale:
      'Construction style materially affects how long the shell/head system keeps speaking.',
  }),

  contributor({
    id: 'sustain-shell-material',

    axis: 'sustain',

    contributorKey: 'shellMaterial',

    weight: 0.1,

    confidence: 0.6,

    sourceType: SPIDER_SOURCE_TYPES.PHYSICAL_PLUS_OBER,

    rationale:
      'Material family influences how long the shell tends to keep energy alive.',
  }),

  contributor({
    id: 'sustain-depth',

    axis: 'sustain',

    contributorKey: 'depth',

    weight: 0.12,

    confidence: 0.66,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale: 'Depth often changes decay feel and body length.',
  }),

  contributor({
    id: 'sustain-diameter',

    axis: 'sustain',

    contributorKey: 'diameter',

    weight: 0.08,

    confidence: 0.58,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Diameter meaningfully affects decay length, with larger drums usually feeling broader and longer in sustain.',
  }),

  contributor({
    id: 'sustain-head-type',

    axis: 'sustain',

    contributorKey: 'headType',

    weight: 0.07,

    confidence: 0.74,

    sourceType: SPIDER_SOURCE_TYPES.HYBRID,

    rationale:
      'Head construction is one of the most immediate sustain shapers.',
  }),

  contributor({
    id: 'sustain-bearing-edge',

    axis: 'sustain',

    contributorKey: 'bearingEdge',

    weight: 0.08,

    confidence: 0.62,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale: 'Edge geometry changes freedom of vibration.',
  }),

  contributor({
    id: 'sustain-shell-thickness',

    axis: 'sustain',

    contributorKey: 'shellThickness',

    weight: 0.08,

    confidence: 0.54,

    sourceType: SPIDER_SOURCE_TYPES.PHYSICAL_PLUS_OBER,

    rationale: 'Shell stiffness and mass meaningfully shape decay character.',
  }),

  contributor({
    id: 'sustain-lug-quantity',

    axis: 'sustain',

    contributorKey: 'lugQuantity',

    weight: 0.08,

    confidence: 0.66,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Lug count can tighten or relax overall tension density, changing how freely the drum blooms.',
  }),

  contributor({
    id: 'sustain-stave-count',

    axis: 'sustain',

    contributorKey: 'staveCount',

    weight: 0.09,

    confidence: 0.63,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Stave count can meaningfully shape note bloom and sustain behavior beyond raw thickness alone.',
  }),

  contributor({
    id: 'sustain-head-tension',

    axis: 'sustain',

    contributorKey: 'headTension',

    weight: 0.05,

    confidence: 0.72,

    sourceType: SPIDER_SOURCE_TYPES.HYBRID,

    rationale:
      'Lower functional tension often supports longer-feeling sustain.',
  }),

  contributor({
    id: 'sustain-hoop-type',

    axis: 'sustain',

    contributorKey: 'hoopType',

    weight: 0.05,

    confidence: 0.62,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale: 'Hoops influence decay and focus behavior at the edge.',
  }),

  contributor({
    id: 'sustain-snare-response',

    axis: 'sustain',

    contributorKey: 'snareResponse',

    weight: 0.04,

    confidence: 0.66,

    sourceType: SPIDER_SOURCE_TYPES.HYBRID,

    rationale:
      'A more active snare system can change how long the drum seems to keep speaking.',
  }),

  contributor({
    id: 'sustain-snare-wire-count',

    axis: 'sustain',

    contributorKey: 'snareWireCount',

    weight: 0.03,

    confidence: 0.61,

    sourceType: SPIDER_SOURCE_TYPES.HYBRID,

    rationale:
      'Wire count affects how broad and saturated the snare response feels through the decay.',
  }),

  contributor({
    id: 'sustain-hardware-type',

    axis: 'sustain',

    contributorKey: 'hardwareType',

    weight: 0.02,

    confidence: 0.44,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Hardware mass can modestly affect shell freedom and decay shape.',
  }),

  contributor({
    id: 'sustain-rerings',

    axis: 'sustain',

    contributorKey: 'reRings',

    weight: 0.02,

    confidence: 0.52,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Re-rings can slightly tighten or shorten the way the shell sustains.',
  }),

  contributor({
    id: 'sustain-finish-type',

    axis: 'sustain',

    contributorKey: 'finishType',

    weight: 0.01,

    confidence: 0.4,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Finish thickness may subtly change shell liveliness and decay behavior.',
  }),

  // WARMTH

  contributor({
    id: 'warmth-shell-material',

    axis: 'warmth',

    contributorKey: 'shellMaterial',

    weight: 0.18,

    confidence: 0.62,

    sourceType: SPIDER_SOURCE_TYPES.PHYSICAL_PLUS_OBER,

    rationale:
      'Shell material or species family is one of the strongest warmth shapers in the model.',
  }),

  contributor({
    id: 'warmth-shell-construction',

    axis: 'warmth',

    contributorKey: 'shellConstruction',

    weight: 0.09,

    confidence: 0.6,

    sourceType: SPIDER_SOURCE_TYPES.PHYSICAL_PLUS_OBER,

    rationale: 'Construction changes how body and low-mid emphasis present.',
  }),

  contributor({
    id: 'warmth-head-type',

    axis: 'warmth',

    contributorKey: 'headType',

    weight: 0.06,

    confidence: 0.76,

    sourceType: SPIDER_SOURCE_TYPES.HYBRID,

    rationale:
      'Head choice is one of the fastest ways to shift perceived warmth.',
  }),

  contributor({
    id: 'warmth-shell-thickness',

    axis: 'warmth',

    contributorKey: 'shellThickness',

    weight: 0.08,

    confidence: 0.53,

    sourceType: SPIDER_SOURCE_TYPES.PHYSICAL_PLUS_OBER,

    rationale: 'Thickness influences the stiffness/body relationship.',
  }),

  contributor({
    id: 'warmth-lug-quantity',

    axis: 'warmth',

    contributorKey: 'lugQuantity',

    weight: 0.07,

    confidence: 0.64,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Lower lug density often feels a bit more open and warmer, while higher lug density can firm up the read.',
  }),

  contributor({
    id: 'warmth-stave-count',

    axis: 'warmth',

    contributorKey: 'staveCount',

    weight: 0.09,

    confidence: 0.63,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Stave count can shape how broad, warm, and organically the shell speaks even when construction stays within the same line.',
  }),

  contributor({
    id: 'warmth-depth',

    axis: 'warmth',

    contributorKey: 'depth',

    weight: 0.1,

    confidence: 0.66,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale: 'Depth often contributes to body and lower-register presence.',
  }),

  contributor({
    id: 'warmth-diameter',

    axis: 'warmth',

    contributorKey: 'diameter',

    weight: 0.08,

    confidence: 0.58,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Larger diameters usually broaden the body of the note and push the read slightly warmer.',
  }),

  contributor({
    id: 'warmth-bearing-edge',

    axis: 'warmth',

    contributorKey: 'bearingEdge',

    weight: 0.07,

    confidence: 0.61,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Rounder contact concepts generally lean warmer in Ober voicing language.',
  }),

  contributor({
    id: 'warmth-hoop-type',

    axis: 'warmth',

    contributorKey: 'hoopType',

    weight: 0.04,

    confidence: 0.58,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale: 'Hoop family can either tighten or relax perceived body.',
  }),

  contributor({
    id: 'warmth-snare-wire-material',

    axis: 'warmth',

    contributorKey: 'snareWireMaterial',

    weight: 0.04,

    confidence: 0.63,

    sourceType: SPIDER_SOURCE_TYPES.HYBRID,

    rationale:
      'Wire material can nudge the read warmer or cooler in the snare response.',
  }),

  contributor({
    id: 'warmth-snare-response',

    axis: 'warmth',

    contributorKey: 'snareResponse',

    weight: 0.03,

    confidence: 0.64,

    sourceType: SPIDER_SOURCE_TYPES.HYBRID,

    rationale:
      'The snare system can subtly shape how broad or lean the total voice feels.',
  }),

  contributor({
    id: 'warmth-head-tension',

    axis: 'warmth',

    contributorKey: 'headTension',

    weight: 0.02,

    confidence: 0.7,

    sourceType: SPIDER_SOURCE_TYPES.HYBRID,

    rationale: 'Lower functional tension often supports a warmer presentation.',
  }),

  contributor({
    id: 'warmth-hardware-type',

    axis: 'warmth',

    contributorKey: 'hardwareType',

    weight: 0.01,

    confidence: 0.42,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Heavier or more rigid hardware can slightly change the perceived body and softness.',
  }),

  contributor({
    id: 'warmth-rerings',

    axis: 'warmth',

    contributorKey: 'reRings',

    weight: 0.01,

    confidence: 0.49,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Re-rings can subtly shift the shell away from openness and toward a slightly tighter warmth.',
  }),

  contributor({
    id: 'warmth-finish-type',

    axis: 'warmth',

    contributorKey: 'finishType',

    weight: 0.01,

    confidence: 0.38,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Finish style can make a subtle difference in openness vs containment.',
  }),

  // PROJECTION

  contributor({
    id: 'projection-shell-construction',

    axis: 'projection',

    contributorKey: 'shellConstruction',

    weight: 0.1,

    confidence: 0.66,

    sourceType: SPIDER_SOURCE_TYPES.PHYSICAL_PLUS_OBER,

    rationale:
      'Construction style strongly affects how directly the drum throws sound.',
  }),

  contributor({
    id: 'projection-shell-material',

    axis: 'projection',

    contributorKey: 'shellMaterial',

    weight: 0.11,

    confidence: 0.62,

    sourceType: SPIDER_SOURCE_TYPES.PHYSICAL_PLUS_OBER,

    rationale:
      'Material family materially affects cut, throw, and perceived strength in the room.',
  }),

  contributor({
    id: 'projection-depth',

    axis: 'projection',

    contributorKey: 'depth',

    weight: 0.1,

    confidence: 0.62,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale: 'Depth materially shapes room-filling character.',
  }),

  contributor({
    id: 'projection-diameter',

    axis: 'projection',

    contributorKey: 'diameter',

    weight: 0.08,

    confidence: 0.6,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Diameter meaningfully changes whether the drum feels compact and pointed or broader in the room.',
  }),

  contributor({
    id: 'projection-shell-thickness',

    axis: 'projection',

    contributorKey: 'shellThickness',

    weight: 0.09,

    confidence: 0.56,

    sourceType: SPIDER_SOURCE_TYPES.PHYSICAL_PLUS_OBER,

    rationale: 'Mass and stiffness influence directness and throw.',
  }),

  contributor({
    id: 'projection-lug-quantity',

    axis: 'projection',

    contributorKey: 'lugQuantity',

    weight: 0.08,

    confidence: 0.64,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Higher lug density can increase firmness and throw, while lower lug density often feels broader and softer.',
  }),

  contributor({
    id: 'projection-stave-count',

    axis: 'projection',

    contributorKey: 'staveCount',

    weight: 0.1,

    confidence: 0.63,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Stave count can shift how tightly the shell projects and how forward the note presents.',
  }),

  contributor({
    id: 'projection-bearing-edge',

    axis: 'projection',

    contributorKey: 'bearingEdge',

    weight: 0.07,

    confidence: 0.58,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Sharper and more focused edge concepts often present with stronger cut.',
  }),

  contributor({
    id: 'projection-head-tension',

    axis: 'projection',

    contributorKey: 'headTension',

    weight: 0.04,

    confidence: 0.71,

    sourceType: SPIDER_SOURCE_TYPES.HYBRID,

    rationale:
      'Tighter functional setups often feel more direct and projecting.',
  }),

  contributor({
    id: 'projection-head-type',

    axis: 'projection',

    contributorKey: 'headType',

    weight: 0.03,

    confidence: 0.69,

    sourceType: SPIDER_SOURCE_TYPES.HYBRID,

    rationale: 'Head choice meaningfully changes cut and presence.',
  }),

  contributor({
    id: 'projection-hoop-type',

    axis: 'projection',

    contributorKey: 'hoopType',

    weight: 0.05,

    confidence: 0.61,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale: 'Hoops influence focus, projection, and edge definition.',
  }),

  contributor({
    id: 'projection-snare-response',

    axis: 'projection',

    contributorKey: 'snareResponse',

    weight: 0.04,

    confidence: 0.66,

    sourceType: SPIDER_SOURCE_TYPES.HYBRID,

    rationale:
      'The snare system affects how assertively the response projects outward.',
  }),

  contributor({
    id: 'projection-snare-wire-count',

    axis: 'projection',

    contributorKey: 'snareWireCount',

    weight: 0.02,

    confidence: 0.59,

    sourceType: SPIDER_SOURCE_TYPES.HYBRID,

    rationale:
      'Wire count changes how saturated and broad the projected snare response feels.',
  }),

  contributor({
    id: 'projection-hardware-type',

    axis: 'projection',

    contributorKey: 'hardwareType',

    weight: 0.01,

    confidence: 0.45,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Hardware rigidity and mass can slightly affect perceived throw and firmness.',
  }),

  contributor({
    id: 'projection-rerings',

    axis: 'projection',

    contributorKey: 'reRings',

    weight: 0.01,

    confidence: 0.5,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Re-rings can add a little structural focus and outward firmness.',
  }),

  contributor({
    id: 'projection-finish-type',

    axis: 'projection',

    contributorKey: 'finishType',

    weight: 0.01,

    confidence: 0.37,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Finish can subtly influence openness, but rarely dominates projection character.',
  }),

  // BRIGHTNESS

  contributor({
    id: 'brightness-head-type',

    axis: 'brightness',

    contributorKey: 'headType',

    weight: 0.08,

    confidence: 0.79,

    sourceType: SPIDER_SOURCE_TYPES.HYBRID,

    rationale: 'Head choice strongly changes top-end emphasis.',
  }),

  contributor({
    id: 'brightness-bearing-edge',

    axis: 'brightness',

    contributorKey: 'bearingEdge',

    weight: 0.11,

    confidence: 0.65,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Bearing edge geometry affects articulation and upper-frequency presentation.',
  }),

  contributor({
    id: 'brightness-shell-material',

    axis: 'brightness',

    contributorKey: 'shellMaterial',

    weight: 0.1,

    confidence: 0.62,

    sourceType: SPIDER_SOURCE_TYPES.PHYSICAL_PLUS_OBER,

    rationale:
      'Shell material or species family materially affects top-end emphasis and bite.',
  }),

  contributor({
    id: 'brightness-shell-construction',

    axis: 'brightness',

    contributorKey: 'shellConstruction',

    weight: 0.07,

    confidence: 0.58,

    sourceType: SPIDER_SOURCE_TYPES.PHYSICAL_PLUS_OBER,

    rationale: 'Construction influences overtone shape and clarity.',
  }),

  contributor({
    id: 'brightness-shell-thickness',

    axis: 'brightness',

    contributorKey: 'shellThickness',

    weight: 0.08,

    confidence: 0.52,

    sourceType: SPIDER_SOURCE_TYPES.PHYSICAL_PLUS_OBER,

    rationale:
      'Thickness and stiffness influence how much upper articulation emerges.',
  }),

  contributor({
    id: 'brightness-lug-quantity',

    axis: 'brightness',

    contributorKey: 'lugQuantity',

    weight: 0.07,

    confidence: 0.63,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Higher lug density can increase perceived firmness and top-end definition.',
  }),

  contributor({
    id: 'brightness-stave-count',

    axis: 'brightness',

    contributorKey: 'staveCount',

    weight: 0.08,

    confidence: 0.62,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Stave count can subtly affect upper clarity and articulation within a shell family.',
  }),

  contributor({
    id: 'brightness-head-tension',

    axis: 'brightness',

    contributorKey: 'headTension',

    weight: 0.07,

    confidence: 0.75,

    sourceType: SPIDER_SOURCE_TYPES.HYBRID,

    rationale: 'Higher functional tension often raises perceived brightness.',
  }),

  contributor({
    id: 'brightness-depth',

    axis: 'brightness',

    contributorKey: 'depth',

    weight: 0.09,

    confidence: 0.57,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale: 'Shallower drums often present with more immediate brightness.',
  }),

  contributor({
    id: 'brightness-diameter',

    axis: 'brightness',

    contributorKey: 'diameter',

    weight: 0.07,

    confidence: 0.57,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Smaller diameters often read brighter and quicker, while larger diameters tend to lean less top-forward.',
  }),

  contributor({
    id: 'brightness-hoop-type',

    axis: 'brightness',

    contributorKey: 'hoopType',

    weight: 0.05,

    confidence: 0.59,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale: 'Hoops can shape top-end focus and edge clarity.',
  }),

  contributor({
    id: 'brightness-snare-side-head',

    axis: 'brightness',

    contributorKey: 'snareSideHead',

    weight: 0.03,

    confidence: 0.68,

    sourceType: SPIDER_SOURCE_TYPES.HYBRID,

    rationale:
      'Snare-side head thickness directly affects top-end snare response and crispness.',
  }),

  contributor({
    id: 'brightness-snare-wire-material',

    axis: 'brightness',

    contributorKey: 'snareWireMaterial',

    weight: 0.02,

    confidence: 0.61,

    sourceType: SPIDER_SOURCE_TYPES.HYBRID,

    rationale:
      'Wire material nudges the response brighter or darker at the edge.',
  }),

  contributor({
    id: 'brightness-snare-response',

    axis: 'brightness',

    contributorKey: 'snareResponse',

    weight: 0.02,

    confidence: 0.63,

    sourceType: SPIDER_SOURCE_TYPES.HYBRID,

    rationale:
      'The overall snare system influences how much top-end crispness makes it into the total read.',
  }),

  contributor({
    id: 'brightness-hardware-type',

    axis: 'brightness',

    contributorKey: 'hardwareType',

    weight: 0.01,

    confidence: 0.42,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale: 'Hardware style can subtly tighten or soften upper presence.',
  }),

  contributor({
    id: 'brightness-finish-type',

    axis: 'brightness',

    contributorKey: 'finishType',

    weight: 0.01,

    confidence: 0.36,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Finish may slightly influence resonance and perceived top-end, though usually modestly.',
  }),

  // SENSITIVITY

  contributor({
    id: 'sensitivity-snare-response',

    axis: 'sensitivity',

    contributorKey: 'snareResponse',

    weight: 0.16,

    confidence: 0.8,

    sourceType: SPIDER_SOURCE_TYPES.HYBRID,

    rationale:
      'The full snare-response system is one of the biggest drivers of sensitivity in a snare drum.',
  }),

  contributor({
    id: 'sensitivity-head-type',

    axis: 'sensitivity',

    contributorKey: 'headType',

    weight: 0.09,

    confidence: 0.82,

    sourceType: SPIDER_SOURCE_TYPES.HYBRID,

    rationale: 'Head construction is one of the biggest sensitivity levers.',
  }),

  contributor({
    id: 'sensitivity-head-tension',

    axis: 'sensitivity',

    contributorKey: 'headTension',

    weight: 0.08,

    confidence: 0.78,

    sourceType: SPIDER_SOURCE_TYPES.HYBRID,

    rationale:
      'Functional tension changes how easily the instrument speaks under light touch.',
  }),

  contributor({
    id: 'sensitivity-bearing-edge',

    axis: 'sensitivity',

    contributorKey: 'bearingEdge',

    weight: 0.09,

    confidence: 0.66,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale: 'Edge geometry materially affects response to lighter dynamics.',
  }),

  contributor({
    id: 'sensitivity-snare-bed-depth',

    axis: 'sensitivity',

    contributorKey: 'snareBedDepth',

    weight: 0.08,

    confidence: 0.72,

    sourceType: SPIDER_SOURCE_TYPES.HYBRID,

    rationale:
      'Snare bed depth directly affects how easily the wires engage and respond.',
  }),

  contributor({
    id: 'sensitivity-snare-side-head',

    axis: 'sensitivity',

    contributorKey: 'snareSideHead',

    weight: 0.08,

    confidence: 0.74,

    sourceType: SPIDER_SOURCE_TYPES.HYBRID,

    rationale:
      'Snare-side head thickness is a direct sensitivity control on a snare.',
  }),

  contributor({
    id: 'sensitivity-snare-wire-count',

    axis: 'sensitivity',

    contributorKey: 'snareWireCount',

    weight: 0.07,

    confidence: 0.69,

    sourceType: SPIDER_SOURCE_TYPES.HYBRID,

    rationale:
      'Wire count substantially changes how eager the snare response feels.',
  }),

  contributor({
    id: 'sensitivity-snare-wire-style',

    axis: 'sensitivity',

    contributorKey: 'snareWireStyle',

    weight: 0.06,

    confidence: 0.68,

    sourceType: SPIDER_SOURCE_TYPES.HYBRID,

    rationale:
      'Wire style changes how open, dry, or reactive the snare response feels.',
  }),

  contributor({
    id: 'sensitivity-hoop-type',

    axis: 'sensitivity',

    contributorKey: 'hoopType',

    weight: 0.06,

    confidence: 0.58,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale: 'Hoop family affects edge response and rebound feel.',
  }),

  contributor({
    id: 'sensitivity-shell-construction',

    axis: 'sensitivity',

    contributorKey: 'shellConstruction',

    weight: 0.03,

    confidence: 0.57,

    sourceType: SPIDER_SOURCE_TYPES.PHYSICAL_PLUS_OBER,

    rationale:
      'Construction changes how responsive the shell/head system feels.',
  }),

  contributor({
    id: 'sensitivity-depth',

    axis: 'sensitivity',

    contributorKey: 'depth',

    weight: 0.05,

    confidence: 0.52,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Depth changes how nimble or broad the drum feels under the hands.',
  }),

  contributor({
    id: 'sensitivity-shell-thickness',

    axis: 'sensitivity',

    contributorKey: 'shellThickness',

    weight: 0.04,

    confidence: 0.48,

    sourceType: SPIDER_SOURCE_TYPES.PHYSICAL_PLUS_OBER,

    rationale:
      'Thickness influences how readily the shell joins the conversation.',
  }),

  contributor({
    id: 'sensitivity-lug-quantity',

    axis: 'sensitivity',

    contributorKey: 'lugQuantity',

    weight: 0.06,

    confidence: 0.64,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Lower lug density often preserves a more touch-friendly, open-feeling response.',
  }),

  contributor({
    id: 'sensitivity-stave-count',

    axis: 'sensitivity',

    contributorKey: 'staveCount',

    weight: 0.06,

    confidence: 0.62,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Stave count can influence how easily the shell feels alive under lighter playing.',
  }),

  contributor({
    id: 'sensitivity-diameter',

    axis: 'sensitivity',

    contributorKey: 'diameter',

    weight: 0.03,

    confidence: 0.52,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Diameter affects under-the-stick feel and response, though less directly than heads, edges, tension, and the snare system.',
  }),

  contributor({
    id: 'sensitivity-hardware-type',

    axis: 'sensitivity',

    contributorKey: 'hardwareType',

    weight: 0.01,

    confidence: 0.46,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Hardware mass can slightly alter how free the drum feels under lighter playing.',
  }),

  contributor({
    id: 'sensitivity-finish-type',

    axis: 'sensitivity',

    contributorKey: 'finishType',

    weight: 0.01,

    confidence: 0.35,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Finish may slightly affect responsiveness, though it is a lower-order contributor.',
  }),

  // CONTROL

  contributor({
    id: 'control-head-type',

    axis: 'control',

    contributorKey: 'headType',

    weight: 0.1,

    confidence: 0.83,

    sourceType: SPIDER_SOURCE_TYPES.HYBRID,

    rationale:
      'Head construction is the fastest way to add or remove control and dryness.',
  }),

  contributor({
    id: 'control-hoop-type',

    axis: 'control',

    contributorKey: 'hoopType',

    weight: 0.1,

    confidence: 0.65,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Hoop families materially affect focus and overtone containment.',
  }),

  contributor({
    id: 'control-snare-response',

    axis: 'control',

    contributorKey: 'snareResponse',

    weight: 0.1,

    confidence: 0.74,

    sourceType: SPIDER_SOURCE_TYPES.HYBRID,

    rationale:
      'The snare-response system meaningfully affects how dry, controlled, or saturated the drum feels.',
  }),

  contributor({
    id: 'control-snare-wire-style',

    axis: 'control',

    contributorKey: 'snareWireStyle',

    weight: 0.07,

    confidence: 0.72,

    sourceType: SPIDER_SOURCE_TYPES.HYBRID,

    rationale:
      'Wire style is a major dryness/control lever inside the snare system.',
  }),

  contributor({
    id: 'control-bearing-edge',

    axis: 'control',

    contributorKey: 'bearingEdge',

    weight: 0.1,

    confidence: 0.61,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale: 'Edge geometry changes how freely the head blooms.',
  }),

  contributor({
    id: 'control-head-tension',

    axis: 'control',

    contributorKey: 'headTension',

    weight: 0.06,

    confidence: 0.72,

    sourceType: SPIDER_SOURCE_TYPES.HYBRID,

    rationale: 'Tension shifts openness versus containment.',
  }),

  contributor({
    id: 'control-shell-construction',

    axis: 'control',

    contributorKey: 'shellConstruction',

    weight: 0.06,

    confidence: 0.56,

    sourceType: SPIDER_SOURCE_TYPES.PHYSICAL_PLUS_OBER,

    rationale: 'Construction affects how broad or contained the shell feels.',
  }),

  contributor({
    id: 'control-shell-thickness',

    axis: 'control',

    contributorKey: 'shellThickness',

    weight: 0.08,

    confidence: 0.52,

    sourceType: SPIDER_SOURCE_TYPES.PHYSICAL_PLUS_OBER,

    rationale: 'Mass and stiffness materially shape containment and focus.',
  }),

  contributor({
    id: 'control-lug-quantity',

    axis: 'control',

    contributorKey: 'lugQuantity',

    weight: 0.09,

    confidence: 0.65,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Higher lug density tends to push the shell toward a tighter, more controlled note shape.',
  }),

  contributor({
    id: 'control-stave-count',

    axis: 'control',

    contributorKey: 'staveCount',

    weight: 0.09,

    confidence: 0.63,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Stave count can meaningfully shift containment and shell firmness even when overall construction stays in-family.',
  }),

  contributor({
    id: 'control-rerings',

    axis: 'control',

    contributorKey: 'reRings',

    weight: 0.02,

    confidence: 0.58,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Re-rings can add structural containment and slightly tighten the shell feel.',
  }),

  contributor({
    id: 'control-snare-side-head',

    axis: 'control',

    contributorKey: 'snareSideHead',

    weight: 0.03,

    confidence: 0.67,

    sourceType: SPIDER_SOURCE_TYPES.HYBRID,

    rationale:
      'Snare-side head thickness can make the response drier or more tightly managed.',
  }),

  contributor({
    id: 'control-depth',

    axis: 'control',

    contributorKey: 'depth',

    weight: 0.04,

    confidence: 0.54,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale: 'Depth affects how broad or concise the body feels.',
  }),

  contributor({
    id: 'control-shell-material',

    axis: 'control',

    contributorKey: 'shellMaterial',

    weight: 0.03,

    confidence: 0.49,

    sourceType: SPIDER_SOURCE_TYPES.PHYSICAL_PLUS_OBER,

    rationale:
      'Material family can subtly influence dryness and containment character.',
  }),

  contributor({
    id: 'control-hardware-type',

    axis: 'control',

    contributorKey: 'hardwareType',

    weight: 0.02,

    confidence: 0.47,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Hardware style and mass can slightly tighten the perceived focus of the shell.',
  }),

  contributor({
    id: 'control-diameter',

    axis: 'control',

    contributorKey: 'diameter',

    weight: 0.02,

    confidence: 0.5,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Diameter can slightly affect how contained or spread the voice feels, though it is not a top control driver.',
  }),

  contributor({
    id: 'control-finish-type',

    axis: 'control',

    contributorKey: 'finishType',

    weight: 0.01,

    confidence: 0.36,

    sourceType: SPIDER_SOURCE_TYPES.OBER_INTERNAL,

    rationale:
      'Finish may slightly affect openness vs containment, but rarely dominates control.',
  }),
];

export function getWeightsForAxis(axis) {
  return SPIDER_CONTRIBUTOR_WEIGHTS.filter((item) => item.axis === axis);
}

export function getWeightsForContributor(contributorKey) {
  return SPIDER_CONTRIBUTOR_WEIGHTS.filter(
    (item) => item.contributorKey === contributorKey
  );
}

export function validateSpiderWeights() {
  return INTERNAL_SPIDER_AXES.map((axis) => {
    const items = getWeightsForAxis(axis);

    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);

    return {
      axis,

      contributorCount: items.length,

      totalWeight: Number(totalWeight.toFixed(4)),
    };
  });
}

export default SPIDER_CONTRIBUTOR_WEIGHTS;
