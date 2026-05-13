// src/data/legacyPrint/shellThicknessProfiles.js

import { LEGACYPRINT_NODE_ORDER } from './voiceEngineTaxonomy.js';

/**

 * Shell thickness profiles describe how wall thickness changes the drum voice.

 *

 * Important:

 * - Exact mm values should always win over generic labels.

 * - Wood thickness behavior should NOT be reused blindly for metal/acrylic/composite.

 * - A thin wood shell usually means warmth, bloom, and sensitivity.

 * - A thin metal shell usually means liveliness, brightness, ring, and response.

 * - A thin acrylic shell usually means fast attack, brightness, projection, and punch — not woody warmth.

 */

export const SHELL_THICKNESS_CLASSES = {

  veryThin: {

    label: 'Very Thin',

    mmRange: [3, 5.99],

    inchRange: [0.118, 0.236],

    generalCharacter:

      'Very open, highly responsive, resonant, and sensitive, but less focused and less naturally controlled.',

    nodeBias: {

      attack: -0.07,

      brightness: -0.02,

      projection: -0.04,

      sustain: 0.1,

      warmth: 0.08,

      sensitivity: 0.11,

      control: -0.1,

    },

    notes:

      'Very thin wood shells usually need construction support, careful bearing edges, or reinforcement to avoid feeling too loose or unstable.',

  },

  thin: {

    label: 'Thin',

    mmRange: [6, 8.99],

    inchRange: [0.236, 0.354],

    generalCharacter:

      'Open, warm, resonant, and touch-sensitive with more shell movement and a softer front edge.',

    nodeBias: {

      attack: -0.04,

      brightness: -0.01,

      projection: -0.02,

      sustain: 0.08,

      warmth: 0.08,

      sensitivity: 0.08,

      control: -0.07,

    },

    notes:

      'Thin wood shells often feel more expressive and woody, but less locked-in than medium or thick shells.',

  },

  mediumThin: {

    label: 'Medium-Thin',

    mmRange: [9, 10.99],

    inchRange: [0.354, 0.433],

    generalCharacter:

      'Balanced and open with a natural mix of body, response, sustain, and control.',

    nodeBias: {

      attack: -0.01,

      brightness: 0,

      projection: 0,

      sustain: 0.04,

      warmth: 0.04,

      sensitivity: 0.04,

      control: -0.02,

    },

    notes:

      'Medium-thin is often a versatile wood-shell zone, especially for players who want warmth without losing response.',

  },

  medium: {

    label: 'Medium',

    mmRange: [11, 12.99],

    inchRange: [0.433, 0.512],

    generalCharacter:

      'Balanced, stable, articulate, and versatile with an even relationship between attack, warmth, sustain, and control.',

    nodeBias: {

      attack: 0.02,

      brightness: 0.01,

      projection: 0.02,

      sustain: 0,

      warmth: 0.01,

      sensitivity: 0,

      control: 0.02,

    },

    notes:

      'Medium shells should read as the general center: neither especially loose nor especially rigid.',

  },

  mediumThick: {

    label: 'Medium-Thick',

    mmRange: [13, 15.99],

    inchRange: [0.512, 0.63],

    generalCharacter:

      'More focused, projecting, articulate, and controlled, with less loose shell bloom.',

    nodeBias: {

      attack: 0.05,

      brightness: 0.03,

      projection: 0.06,

      sustain: -0.04,

      warmth: -0.01,

      sensitivity: -0.04,

      control: 0.07,

    },

    notes:

      'Medium-thick shells begin shifting the voice toward crack, projection, and note shape.',

  },

  thick: {

    label: 'Thick',

    mmRange: [16, 19.99],

    inchRange: [0.63, 0.787],

    generalCharacter:

      'Focused, loud, controlled, and attack-forward with stronger projection and shorter loose bloom.',

    nodeBias: {

      attack: 0.08,

      brightness: 0.04,

      projection: 0.09,

      sustain: -0.07,

      warmth: -0.03,

      sensitivity: -0.07,

      control: 0.1,

    },

    notes:

      'Thick shells usually feel more immediate and controlled, but can give up touch sensitivity and low-effort resonance.',

  },

  veryThick: {

    label: 'Very Thick',

    mmRange: [20, 30],

    inchRange: [0.787, 1.181],

    generalCharacter:

      'Very focused, powerful, dense, and controlled with strong attack and projection but reduced openness.',

    nodeBias: {

      attack: 0.11,

      brightness: 0.05,

      projection: 0.12,

      sustain: -0.1,

      warmth: -0.05,

      sensitivity: -0.1,

      control: 0.13,

    },

    notes:

      'Very thick shells should feel authoritative and controlled, but not naturally open or touch-soft.',

  },

};

export const CONSTRUCTION_THICKNESS_CONTEXT = {

  stave: {

    label: 'Stave Thickness Context',

    typicalMmRange: [6, 20],

    referenceMm: 10,

    notes:

      'Stave shells can support a wide range of exact thicknesses. Thinner stave shells usually become warmer and more open; thicker stave shells become more focused, projecting, and controlled.',

  },

  ply: {

    label: 'Ply Thickness Context',

    typicalMmRange: [5, 12],

    referenceMm: 7.5,

    notes:

      'Ply shells often use thinner wall thickness than stave shells because the cross-laminated structure adds stability and consistency.',

  },

  steamBent: {

    label: 'Steam-Bent Thickness Context',

    typicalMmRange: [5, 9],

    referenceMm: 6.5,

    notes:

      'Steam-bent shells are usually thinner single-ply wood shells. They often rely on re-rings and tend to read open, warm, and resonant.',

  },

  solid: {

    label: 'Solid Shell Thickness Context',

    typicalMmRange: [8, 18],

    referenceMm: 12,

    notes:

      'Solid carved shells can behave differently from steam-bent shells because the grain is not bent into shape. Density, wall thickness, and carving style matter heavily.',

  },

  feuzonHybrid: {

    label: 'FEUZØN Hybrid Thickness Context',

    typicalMmRange: [10, 18],

    referenceMm: 13,

    notes:

      'Ober FEUZØN construction combines a voiced stave interior with a steam-bent exterior. The inner stave core and outer wrap should be scored as an interacting hybrid, not as normal ply or normal stave.',

  },

  metal: {

    label: 'Metal Thickness Context',

    typicalMmRange: [1, 5],

    referenceMm: 1.2,

    notes:

      'Metal shell thickness should not be interpreted the same way as wood shell thickness. Alloy, forming method, bead pattern, and shell stiffness matter heavily.',

  },

  acrylic: {

    label: 'Acrylic Thickness Context',

    typicalMmRange: [4, 8],

    referenceMm: 6,

    notes:

      'Acrylic thickness changes stiffness, attack, projection, and control, but acrylic should remain its own material behavior rather than borrowing wood-shell assumptions.',

  },

  composite: {

    label: 'Composite Thickness Context',

    typicalMmRange: [3, 10],

    referenceMm: 6,

    notes:

      'Composite shell thickness depends heavily on the material system. Carbon fiber, fiberglass, and resin composites should each apply material-specific modifiers.',

  },

};

/**

 * Construction-aware thickness classes.

 *

 * These replace the wood-only class read when construction is metal/acrylic/composite.

 * This prevents 1.2mm brass or 6mm acrylic from inheriting "thin wood shell" warmth/bloom behavior.

 */

export const CONSTRUCTION_SPECIFIC_THICKNESS_CLASSES = {

  metal: {

    veryThin: {

      label: 'Thin Metal Gauge',

      mmRange: [0.5, 1.19],

      generalCharacter:

        'Very thin metal gauge feels lively, bright, responsive, and overtone-rich, with less built-in focus than heavier metal shells.',

      nodeBias: {

        attack: 0.04,

        brightness: 0.06,

        projection: 0.04,

        sustain: 0.06,

        warmth: -0.03,

        sensitivity: 0.04,

        control: -0.04,

      },

      notes:

        'Thin metal should not behave like thin wood. It adds liveliness, ring, and sensitivity more than woody warmth.',

    },

    medium: {

      label: 'Standard Metal Gauge',

      mmRange: [1.2, 1.99],

      generalCharacter:

        'Standard metal gauge gives a balanced metal-shell response with clear attack, projection, brightness, and usable sustain.',

      nodeBias: {

        attack: 0.05,

        brightness: 0.06,

        projection: 0.06,

        sustain: 0.03,

        warmth: -0.01,

        sensitivity: 0.02,

        control: 0.01,

      },

      notes:

        'Standard metal gauge keeps the shell lively without becoming as rigid or controlled as heavy cast-style metal.',

    },

    thick: {

      label: 'Heavy Metal Gauge',

      mmRange: [2, 3.99],

      generalCharacter:

        'Heavier metal gauge increases focus, attack, projection, and control while reducing loose ring.',

      nodeBias: {

        attack: 0.08,

        brightness: 0.05,

        projection: 0.09,

        sustain: -0.02,

        warmth: -0.02,

        sensitivity: -0.02,

        control: 0.08,

      },

      notes:

        'Heavy metal gauge pushes toward a more controlled, focused, powerful metal-shell voice.',

    },

    veryThick: {

      label: 'Cast / Very Heavy Metal',

      mmRange: [4, 10],

      generalCharacter:

        'Very heavy or cast-style metal shells feel dense, powerful, loud, and controlled with a strong center.',

      nodeBias: {

        attack: 0.11,

        brightness: 0.06,

        projection: 0.12,

        sustain: -0.04,

        warmth: -0.01,

        sensitivity: -0.05,

        control: 0.12,

      },

      notes:

        'Very heavy metal shell behavior should emphasize density, projection, crack, and control rather than openness.',

    },

  },

  acrylic: {

    thin: {

      label: 'Thin Acrylic',

      mmRange: [3, 4.99],

      generalCharacter:

        'Thin acrylic is fast, bright, projecting, and lively, with less woody warmth and less natural body than wood.',

      nodeBias: {

        attack: 0.08,

        brightness: 0.08,

        projection: 0.08,

        sustain: 0.01,

        warmth: -0.08,

        sensitivity: 0,

        control: 0.01,

      },

      notes:

        'Thin acrylic should not inherit thin wood warmth. It should read as punchy, clear, bright, and modern.',

    },

    medium: {

      label: 'Standard Acrylic',

      mmRange: [5, 6.99],

      generalCharacter:

        'Standard acrylic emphasizes punch, attack, brightness, projection, and a consistent modern shell response.',

      nodeBias: {

        attack: 0.1,

        brightness: 0.09,

        projection: 0.1,

        sustain: -0.01,

        warmth: -0.08,

        sensitivity: -0.01,

        control: 0.04,

      },

      notes:

        'Standard acrylic should feel immediate and projecting without reading as woody or especially warm.',

    },

    thick: {

      label: 'Thick Acrylic',

      mmRange: [7, 10],

      generalCharacter:

        'Thicker acrylic adds more focus, punch, projection, and control, with a shorter and more contained response.',

      nodeBias: {

        attack: 0.12,

        brightness: 0.08,

        projection: 0.12,

        sustain: -0.04,

        warmth: -0.1,

        sensitivity: -0.04,

        control: 0.08,

      },

      notes:

        'Thicker acrylic should become punchier and more controlled, not warmer or more resonant like thin wood.',

    },

  },

  composite: {

    thin: {

      label: 'Thin Composite',

      mmRange: [2, 4.99],

      generalCharacter:

        'Thin composite shells can be lively and fast, but behavior depends heavily on fiber, resin, layup, and stiffness.',

      nodeBias: {

        attack: 0.05,

        brightness: 0.04,

        projection: 0.04,

        sustain: 0.01,

        warmth: -0.05,

        sensitivity: 0.01,

        control: 0.03,

      },

      notes:

        'Thin composite is a conservative fallback until exact composite material and layup data are modeled.',

    },

    medium: {

      label: 'Standard Composite',

      mmRange: [5, 7.99],

      generalCharacter:

        'Standard composite shells usually lean fast, focused, projecting, and controlled with less organic warmth.',

      nodeBias: {

        attack: 0.08,

        brightness: 0.05,

        projection: 0.08,

        sustain: -0.02,

        warmth: -0.07,

        sensitivity: -0.01,

        control: 0.08,

      },

      notes:

        'Composite shells should remain material-specific later. This is a safe universal midpoint.',

    },

    thick: {

      label: 'Thick Composite',

      mmRange: [8, 12],

      generalCharacter:

        'Thick composite shells become more rigid, controlled, projecting, and modern, with reduced warmth and openness.',

      nodeBias: {

        attack: 0.1,

        brightness: 0.06,

        projection: 0.11,

        sustain: -0.05,

        warmth: -0.09,

        sensitivity: -0.04,

        control: 0.12,

      },

      notes:

        'Thick composite should read as focused and controlled rather than warm and breathing.',

    },

  },

};

const clamp = (value, min, max) => {

  const num = Number(value);

  if (!Number.isFinite(num)) return min;

  return Math.max(min, Math.min(max, num));

};

const round2 = (value) => Math.round(Number(value || 0) * 100) / 100;

function normalizeConstructionKey(constructionKey = 'stave') {

  if (constructionKey === 'metalShell') return 'metal';

  if (constructionKey === 'acrylicShell') return 'acrylic';

  if (constructionKey === 'compositeOther') return 'composite';

  if (constructionKey === 'genericHybrid') return 'composite';

  return constructionKey || 'stave';

}

function emptyNodeBias() {

  return LEGACYPRINT_NODE_ORDER.reduce((acc, nodeKey) => {

    acc[nodeKey] = 0;

    return acc;

  }, {});

}

function normalizeNodeBias(nodeBias = {}) {

  return LEGACYPRINT_NODE_ORDER.reduce((acc, nodeKey) => {

    acc[nodeKey] = Number(nodeBias?.[nodeKey] || 0);

    return acc;

  }, {});

}

function scaleNodeBias(nodeBias = {}, scalar = 1) {

  return LEGACYPRINT_NODE_ORDER.reduce((acc, nodeKey) => {

    acc[nodeKey] = round2(Number(nodeBias?.[nodeKey] || 0) * scalar);

    return acc;

  }, {});

}

function blendNodeBias(primary = {}, secondary = {}, secondaryAmount = 0) {

  const amount = clamp(secondaryAmount, 0, 1);

  return LEGACYPRINT_NODE_ORDER.reduce((acc, nodeKey) => {

    acc[nodeKey] = round2(

      Number(primary?.[nodeKey] || 0) * (1 - amount) +

        Number(secondary?.[nodeKey] || 0) * amount

    );

    return acc;

  }, {});

}

export function inchesToMm(inches) {

  const num = Number(inches);

  if (!Number.isFinite(num)) return null;

  return Number((num * 25.4).toFixed(2));

}

export function mmToInches(mm) {

  const num = Number(mm);

  if (!Number.isFinite(num)) return null;

  return Number((num / 25.4).toFixed(3));

}

export function parseShellThicknessMm(value) {

  if (value == null || value === '') return null;

  const raw = String(value).trim().toLowerCase();

  const mmMatch = raw.match(/(\d+(?:\.\d+)?)\s*mm/);

  if (mmMatch) {

    const parsed = Number(mmMatch[1]);

    return Number.isFinite(parsed) ? parsed : null;

  }

  const inchMatch = raw.match(/(\d+(?:\.\d+)?)\s*(in|inch|inches|")/);

  if (inchMatch) {

    return inchesToMm(Number(inchMatch[1]));

  }

  const numeric = Number(raw);

  if (Number.isFinite(numeric) && numeric > 0) {

    /**

     * Default assumption:

     * - values over 3 are probably mm

     * - values under/equal 1.25 are probably inches

     */

    if (numeric <= 1.25) return numeric;

    return numeric;

  }

  return null;

}

export function getShellThicknessClassByMm(mm) {

  const value = Number(mm);

  if (!Number.isFinite(value)) return 'medium';

  const match = Object.entries(SHELL_THICKNESS_CLASSES).find(([, profile]) => {

    const [min, max] = profile.mmRange;

    return value >= min && value <= max;

  });

  return match?.[0] || (value < 3 ? 'veryThin' : 'veryThick');

}

export function getConstructionSpecificThicknessClassByMm({

  thicknessMm,

  constructionKey = 'stave',

} = {}) {

  const rawValue = Number(thicknessMm);

  const value = Number.isFinite(rawValue)

    ? Number(rawValue.toFixed(3))

    : rawValue;

  const normalizedConstructionKey = normalizeConstructionKey(constructionKey);

  const classSet =

    CONSTRUCTION_SPECIFIC_THICKNESS_CLASSES[normalizedConstructionKey];

  if (!Number.isFinite(value) || !classSet) {

    return null;

  }

  const match = Object.entries(classSet).find(([, profile]) => {

    const [min, max] = profile.mmRange;

    return value >= Number(min) && value <= Number(max);

  });

  if (match) return match[0];

  if (normalizedConstructionKey === 'metal') {

    if (value < 1.2) return 'veryThin';

    if (value < 2) return 'medium';

    if (value < 4) return 'thick';

    return 'veryThick';

  }

  if (normalizedConstructionKey === 'acrylic') {

    if (value < 5) return 'thin';

    if (value < 7) return 'medium';

    return 'thick';

  }

  if (normalizedConstructionKey === 'composite') {

    if (value < 5) return 'thin';

    if (value < 8) return 'medium';

    return 'thick';

  }

  return null;

}

export function getShellThicknessProfile(thicknessValue, fallbackClass = 'medium') {

  const parsedMm = parseShellThicknessMm(thicknessValue);

  const classKey = Number.isFinite(parsedMm)

    ? getShellThicknessClassByMm(parsedMm)

    : fallbackClass;

  return SHELL_THICKNESS_CLASSES[classKey] || SHELL_THICKNESS_CLASSES.medium;

}

export function getConstructionSpecificThicknessProfile({

  thickness,

  constructionKey = 'stave',

} = {}) {

  const parsedMm = parseShellThicknessMm(thickness);

  const normalizedConstructionKey = normalizeConstructionKey(constructionKey);

  const classKey = getConstructionSpecificThicknessClassByMm({

    thicknessMm: parsedMm,

    constructionKey: normalizedConstructionKey,

  });

  if (!classKey) return null;

  return {

    classKey,

    constructionKey: normalizedConstructionKey,

    profile:

      CONSTRUCTION_SPECIFIC_THICKNESS_CLASSES[normalizedConstructionKey]?.[

        classKey

      ] || null,

  };

}

export function normalizeShellThicknessNodeBias(

  thicknessValue,

  fallbackClass = 'medium',

  constructionKey = 'stave'

) {

  const constructionSpecificProfile = getConstructionSpecificThicknessProfile({

    thickness: thicknessValue,

    constructionKey,

  });

  if (constructionSpecificProfile?.profile) {

    return normalizeNodeBias(constructionSpecificProfile.profile.nodeBias);

  }

  const profile = getShellThicknessProfile(thicknessValue, fallbackClass);

  return normalizeNodeBias(profile?.nodeBias || {});

}

/**

 * This produces an exact-thickness scalar for later scoring.

 *

 * - negative values = thinner / more open or lively

 * - positive values = thicker / more focused or rigid

 *

 * Construction context matters because:

 * - 10mm is medium for stave

 * - 10mm is very thick for ply

 * - 1.2mm can be reference for metal

 * - 6mm can be reference for acrylic

 */

export function getConstructionRelativeThicknessFactor({

  thicknessMm,

  constructionKey = 'stave',

}) {

  const parsedMm = parseShellThicknessMm(thicknessMm);

  const normalizedConstructionKey = normalizeConstructionKey(constructionKey);

  const context =

    CONSTRUCTION_THICKNESS_CONTEXT[normalizedConstructionKey] ||

    CONSTRUCTION_THICKNESS_CONTEXT.stave;

  if (!Number.isFinite(parsedMm)) return 0;

  const referenceMm = Number(context.referenceMm || 10);

  const [minTypical, maxTypical] = context.typicalMmRange || [3, 20];

  const lowSpan = Math.max(1, referenceMm - minTypical);

  const highSpan = Math.max(1, maxTypical - referenceMm);

  const raw =

    parsedMm >= referenceMm

      ? (parsedMm - referenceMm) / highSpan

      : (parsedMm - referenceMm) / lowSpan;

  return Number(clamp(raw, -1, 1).toFixed(3));

}

function buildConstructionAwareThicknessBias({

  thickness,

  constructionKey = 'stave',

  fallbackClass = 'medium',

} = {}) {

  const parsedMm = parseShellThicknessMm(thickness);

  const normalizedConstructionKey = normalizeConstructionKey(constructionKey);

  const woodProfile = getShellThicknessProfile(parsedMm, fallbackClass);

  const constructionSpecificProfile = getConstructionSpecificThicknessProfile({

    thickness: parsedMm,

    constructionKey: normalizedConstructionKey,

  });

  if (constructionSpecificProfile?.profile) {

    return {

      classKey: constructionSpecificProfile.classKey,

      label: constructionSpecificProfile.profile.label,

      generalCharacter: constructionSpecificProfile.profile.generalCharacter,

      notes: constructionSpecificProfile.profile.notes,

      nodeBias: normalizeNodeBias(constructionSpecificProfile.profile.nodeBias),

      source: 'constructionSpecific',

    };

  }

  /**

   * FEUZØN is wood-based, but the hybrid structure should slightly reduce the

   * extremes of normal stave thickness behavior because the shell has two

   * interacting layers.

   */

  if (normalizedConstructionKey === 'feuzonHybrid') {

    const relativeFactor = getConstructionRelativeThicknessFactor({

      thicknessMm: parsedMm,

      constructionKey: normalizedConstructionKey,

    });

    const scaledBias = scaleNodeBias(woodProfile.nodeBias, 0.82);

    const structuralBias =

      relativeFactor >= 0.2

        ? {

            attack: 0.02,

            brightness: 0,

            projection: 0.03,

            sustain: -0.01,

            warmth: 0.01,

            sensitivity: -0.02,

            control: 0.03,

          }

        : relativeFactor <= -0.2

          ? {

              attack: -0.01,

              brightness: 0,

              projection: -0.01,

              sustain: 0.03,

              warmth: 0.03,

              sensitivity: 0.03,

              control: -0.02,

            }

          : emptyNodeBias();

    return {

      classKey: getShellThicknessClassByMm(parsedMm),

      label: woodProfile.label,

      generalCharacter: woodProfile.generalCharacter,

      notes:

        'FEUZØN thickness uses moderated wood-shell thickness behavior because the stave core and steam-bent exterior interact as one hybrid shell system.',

      nodeBias: blendNodeBias(scaledBias, structuralBias, 0.35),

      source: 'feuzonHybridAdjusted',

    };

  }

  return {

    classKey: getShellThicknessClassByMm(parsedMm),

    label: woodProfile.label,

    generalCharacter: woodProfile.generalCharacter,

    notes: woodProfile.notes,

    nodeBias: normalizeNodeBias(woodProfile.nodeBias),

    source: 'woodGeneral',

  };

}

export function buildShellThicknessRead({

  thickness,

  constructionKey = 'stave',

  fallbackClass = 'medium',

} = {}) {

  const parsedMm = parseShellThicknessMm(thickness);

  const normalizedConstructionKey = normalizeConstructionKey(constructionKey);

  const constructionContext =

    CONSTRUCTION_THICKNESS_CONTEXT[normalizedConstructionKey] ||

    CONSTRUCTION_THICKNESS_CONTEXT.stave;

  const thicknessBiasRead = buildConstructionAwareThicknessBias({

    thickness,

    constructionKey: normalizedConstructionKey,

    fallbackClass,

  });

  const classKey = thicknessBiasRead.classKey || fallbackClass;

  const fallbackProfile =

    SHELL_THICKNESS_CLASSES[classKey] || SHELL_THICKNESS_CLASSES.medium;

  return {

    thicknessMm: Number.isFinite(parsedMm) ? parsedMm : null,

    thicknessInches: Number.isFinite(parsedMm) ? mmToInches(parsedMm) : null,

    classKey,

    label: thicknessBiasRead.label || fallbackProfile.label,

    mmRange:

      thicknessBiasRead.source === 'constructionSpecific'

        ? CONSTRUCTION_SPECIFIC_THICKNESS_CLASSES[normalizedConstructionKey]?.[

            classKey

          ]?.mmRange || fallbackProfile.mmRange

        : fallbackProfile.mmRange,

    inchRange: fallbackProfile.inchRange,

    constructionKey: normalizedConstructionKey,

    constructionLabel: constructionContext.label,

    constructionReferenceMm: constructionContext.referenceMm,

    constructionRelativeFactor: getConstructionRelativeThicknessFactor({

      thicknessMm: parsedMm,

      constructionKey: normalizedConstructionKey,

    }),

    profileSource: thicknessBiasRead.source,

    generalCharacter:

      thicknessBiasRead.generalCharacter || fallbackProfile.generalCharacter,

    notes: thicknessBiasRead.notes || fallbackProfile.notes,

    constructionNotes: constructionContext.notes,

    nodeBias: normalizeNodeBias(thicknessBiasRead.nodeBias),

  };

}

export default SHELL_THICKNESS_CLASSES;