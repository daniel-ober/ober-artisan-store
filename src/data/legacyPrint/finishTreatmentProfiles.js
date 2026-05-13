// src/data/legacyPrint/finishTreatmentProfiles.js

import { LEGACYPRINT_NODE_ORDER } from './voiceEngineTaxonomy.js';

/**

 * LegacyPrint finish + treatment profiles

 *

 * Finish is usually a secondary tone factor compared with:

 * - shell material

 * - construction

 * - thickness

 * - bearing edge

 * - heads

 * - tuning

 *

 * But finish/treatment still matters because it can change:

 * - surface stiffness

 * - damping

 * - shell openness

 * - dryness

 * - attack focus

 * - sustain behavior

 */

export const FINISH_TREATMENT_PROFILES = {

  rawNatural: {

    id: 'rawNatural',

    label: 'Raw / Natural',

    userFacingLabel: 'Raw / Natural',

    category: 'openNatural',

    description:

      'A raw or very lightly treated shell keeps the surface more open and touch-responsive.',

    surfaceBuild: 0.08,

    damping: 0.08,

    stiffnessShift: 0.04,

    openness: 0.88,

    nodeBias: {

      attack: -0.02,

      brightness: 0.01,

      projection: -0.01,

      sustain: 0.06,

      warmth: 0.04,

      sensitivity: 0.05,

      control: -0.04,

    },

  },

  oilWax: {

    id: 'oilWax',

    label: 'Oil / Wax',

    userFacingLabel: 'Oil / Wax Finish',

    category: 'thinNatural',

    description:

      'Oil and wax finishes usually preserve the shell’s natural movement while adding a slightly warmer surface feel.',

    surfaceBuild: 0.14,

    damping: 0.12,

    stiffnessShift: 0.06,

    openness: 0.82,

    nodeBias: {

      attack: -0.01,

      brightness: -0.02,

      projection: 0,

      sustain: 0.04,

      warmth: 0.05,

      sensitivity: 0.04,

      control: -0.02,

    },

  },

  thinLacquer: {

    id: 'thinLacquer',

    label: 'Thin Lacquer',

    userFacingLabel: 'Thin Lacquer',

    category: 'lightFilm',

    description:

      'A thin lacquer adds a light surface film without heavily muting the shell.',

    surfaceBuild: 0.26,

    damping: 0.18,

    stiffnessShift: 0.12,

    openness: 0.72,

    nodeBias: {

      attack: 0.01,

      brightness: 0.02,

      projection: 0.01,

      sustain: 0.01,

      warmth: 0,

      sensitivity: -0.01,

      control: 0.01,

    },

  },

  glossLacquer: {

    id: 'glossLacquer',

    label: 'Gloss Lacquer',

    userFacingLabel: 'Gloss Lacquer',

    category: 'builtFilm',

    description:

      'A heavier gloss lacquer can add surface stiffness and polish while slightly reducing raw shell openness.',

    surfaceBuild: 0.46,

    damping: 0.3,

    stiffnessShift: 0.28,

    openness: 0.56,

    nodeBias: {

      attack: 0.03,

      brightness: 0.04,

      projection: 0.02,

      sustain: -0.03,

      warmth: -0.02,

      sensitivity: -0.04,

      control: 0.04,

    },

  },

  wrap: {

    id: 'wrap',

    label: 'Wrap',

    userFacingLabel: 'Wrapped Finish',

    category: 'externalLayer',

    description:

      'A wrap adds an outer layer that can slightly dampen shell movement and tighten the response.',

    surfaceBuild: 0.62,

    damping: 0.46,

    stiffnessShift: 0.28,

    openness: 0.42,

    nodeBias: {

      attack: 0.03,

      brightness: -0.01,

      projection: 0.01,

      sustain: -0.06,

      warmth: -0.02,

      sensitivity: -0.05,

      control: 0.06,

    },

  },

  heavyPoly: {

    id: 'heavyPoly',

    label: 'Heavy Poly / Thick Clear',

    userFacingLabel: 'Heavy Clear Coat',

    category: 'heavyFilm',

    description:

      'A thick clear coat or heavy poly finish can add noticeable surface build, increasing control while reducing openness.',

    surfaceBuild: 0.72,

    damping: 0.52,

    stiffnessShift: 0.4,

    openness: 0.36,

    nodeBias: {

      attack: 0.04,

      brightness: 0.02,

      projection: 0.02,

      sustain: -0.07,

      warmth: -0.03,

      sensitivity: -0.06,

      control: 0.08,

    },

  },

  stainOnly: {

    id: 'stainOnly',

    label: 'Stain Only',

    userFacingLabel: 'Stain Only',

    category: 'colorMinimal',

    description:

      'A stain-only treatment is mostly visual and keeps the shell close to its natural acoustic behavior.',

    surfaceBuild: 0.12,

    damping: 0.1,

    stiffnessShift: 0.04,

    openness: 0.82,

    nodeBias: {

      attack: 0,

      brightness: 0,

      projection: 0,

      sustain: 0.02,

      warmth: 0.01,

      sensitivity: 0.02,

      control: -0.01,

    },

  },

  torchedLight: {

    id: 'torchedLight',

    label: 'Light Torch',

    userFacingLabel: 'Light Torch',

    category: 'oberTorchTune',

    description:

      'Light Torch keeps the Ober Heritage shell more open, lively, and touch-friendly.',

    surfaceBuild: 0.18,

    damping: 0.16,

    stiffnessShift: 0.1,

    openness: 0.76,

    torchIntensity: 0.25,

    nodeBias: {

      attack: -0.01,

      brightness: 0.01,

      projection: 0,

      sustain: 0.04,

      warmth: 0.03,

      sensitivity: 0.05,

      control: -0.03,

    },

  },

  torchedMedium: {

    id: 'torchedMedium',

    label: 'Medium Torch',

    userFacingLabel: 'Medium Torch',

    category: 'oberTorchTune',

    description:

      'Medium Torch is the Ober Heritage reference center between openness, warmth, and control.',

    surfaceBuild: 0.28,

    damping: 0.24,

    stiffnessShift: 0.18,

    openness: 0.64,

    torchIntensity: 0.5,

    nodeBias: {

      attack: 0,

      brightness: 0,

      projection: 0,

      sustain: 0,

      warmth: 0.01,

      sensitivity: 0,

      control: 0.01,

    },

  },

  torchedBlackened: {

    id: 'torchedBlackened',

    label: 'Blackened Torch',

    userFacingLabel: 'Blackened Torch',

    category: 'oberTorchTune',

    description:

      'Blackened Torch pushes the shell drier, darker, more settled, and more controlled.',

    surfaceBuild: 0.44,

    damping: 0.42,

    stiffnessShift: 0.26,

    openness: 0.44,

    torchIntensity: 0.86,

    nodeBias: {

      attack: 0.02,

      brightness: -0.05,

      projection: 0.01,

      sustain: -0.06,

      warmth: 0.02,

      sensitivity: -0.07,

      control: 0.08,

    },

  },

  paintedOpaque: {

    id: 'paintedOpaque',

    label: 'Painted / Opaque',

    userFacingLabel: 'Painted Finish',

    category: 'paintFilm',

    description:

      'Opaque paint usually behaves like a built finish layer, adding some damping and reducing raw shell openness.',

    surfaceBuild: 0.48,

    damping: 0.36,

    stiffnessShift: 0.26,

    openness: 0.5,

    nodeBias: {

      attack: 0.02,

      brightness: 0,

      projection: 0.01,

      sustain: -0.04,

      warmth: -0.01,

      sensitivity: -0.04,

      control: 0.05,

    },

  },

  acrylicResinAccent: {

    id: 'acrylicResinAccent',

    label: 'Acrylic / Resin Accent',

    userFacingLabel: 'Acrylic Resin Accent',

    category: 'localizedResin',

    description:

      'Resin accents are mostly visual when localized, but heavier resin fill can add small pockets of density and control.',

    surfaceBuild: 0.34,

    damping: 0.28,

    stiffnessShift: 0.26,

    openness: 0.58,

    nodeBias: {

      attack: 0.01,

      brightness: 0.01,

      projection: 0.01,

      sustain: -0.02,

      warmth: 0,

      sensitivity: -0.02,

      control: 0.03,

    },

  },

};

export const INTERIOR_TREATMENT_PROFILES = {

  none: {

    id: 'none',

    label: 'None',

    userFacingLabel: 'No Interior Treatment',

    description:

      'No interior treatment keeps the inside of the shell closest to its raw construction voice.',

    damping: 0,

    surfaceHardness: 0,

    nodeBias: {

      attack: 0,

      brightness: 0,

      projection: 0,

      sustain: 0,

      warmth: 0,

      sensitivity: 0,

      control: 0,

    },

  },

  sealed: {

    id: 'sealed',

    label: 'Sealed Interior',

    userFacingLabel: 'Sealed Interior',

    description:

      'A sealed interior can slightly firm up the response and reduce raw absorption.',

    damping: 0.12,

    surfaceHardness: 0.22,

    nodeBias: {

      attack: 0.02,

      brightness: 0.02,

      projection: 0.01,

      sustain: -0.01,

      warmth: -0.01,

      sensitivity: -0.01,

      control: 0.02,

    },

  },

  hardSealed: {

    id: 'hardSealed',

    label: 'Hard-Sealed Interior',

    userFacingLabel: 'Hard-Sealed Interior',

    description:

      'A harder sealed interior can add reflectivity, cleaner attack, and a slightly more controlled response.',

    damping: 0.2,

    surfaceHardness: 0.46,

    nodeBias: {

      attack: 0.04,

      brightness: 0.04,

      projection: 0.03,

      sustain: -0.03,

      warmth: -0.02,

      sensitivity: -0.03,

      control: 0.05,

    },

  },

  roughInterior: {

    id: 'roughInterior',

    label: 'Rough / Raw Interior',

    userFacingLabel: 'Rough Raw Interior',

    description:

      'A rougher interior may absorb and scatter some energy, softening brightness and adding a more complex, less polished response.',

    damping: 0.28,

    surfaceHardness: 0.08,

    nodeBias: {

      attack: -0.03,

      brightness: -0.05,

      projection: -0.02,

      sustain: 0.02,

      warmth: 0.04,

      sensitivity: 0.01,

      control: -0.02,

    },

  },

};

const normalizeText = (value = '') =>

  String(value || '')

    .trim()

    .toLowerCase();

const round2 = (value) => Math.round(Number(value || 0) * 100) / 100;

function emptyNodeBias() {

  return LEGACYPRINT_NODE_ORDER.reduce((acc, nodeKey) => {

    acc[nodeKey] = 0;

    return acc;

  }, {});

}

function sumNodeBias(...biasObjects) {

  return LEGACYPRINT_NODE_ORDER.reduce((acc, nodeKey) => {

    acc[nodeKey] = round2(

      biasObjects.reduce((sum, bias) => {

        return sum + Number(bias?.[nodeKey] || 0);

      }, 0)

    );

    return acc;

  }, {});

}

export function getFinishTreatmentKey(value = 'torchedMedium') {

  const normalized = normalizeText(value);

  if (!normalized) return 'torchedMedium';

  if (normalized.includes('blackened') || normalized.includes('black')) {

    return 'torchedBlackened';

  }

  if (normalized.includes('medium') && normalized.includes('torch')) {

    return 'torchedMedium';

  }

  if (normalized.includes('light') && normalized.includes('torch')) {

    return 'torchedLight';

  }

  if (normalized.includes('torch')) return 'torchedMedium';

  if (normalized.includes('raw') || normalized.includes('natural')) {

    return 'rawNatural';

  }

  if (normalized.includes('oil') || normalized.includes('wax')) {

    return 'oilWax';

  }

  if (normalized.includes('thin') && normalized.includes('lacquer')) {

    return 'thinLacquer';

  }

  if (normalized.includes('gloss') || normalized.includes('lacquer')) {

    return 'glossLacquer';

  }

  if (normalized.includes('wrap')) return 'wrap';

  if (normalized.includes('poly') || normalized.includes('heavy clear')) {

    return 'heavyPoly';

  }

  if (normalized.includes('stain')) return 'stainOnly';

  if (normalized.includes('paint')) return 'paintedOpaque';

  if (normalized.includes('resin') || normalized.includes('acrylic accent')) {

    return 'acrylicResinAccent';

  }

  return 'torchedMedium';

}

export function getInteriorTreatmentKey(value = 'none') {

  const normalized = normalizeText(value);

  if (!normalized || normalized === 'none') return 'none';

  if (normalized.includes('hard')) return 'hardSealed';

  if (normalized.includes('seal')) return 'sealed';

  if (normalized.includes('rough') || normalized.includes('raw')) {

    return 'roughInterior';

  }

  return 'none';

}

export function buildFinishTreatmentRead({

  finish = 'Medium Torch',

  interiorTreatment = 'none',

  isOberBuild = false,

} = {}) {

  const finishKey = getFinishTreatmentKey(finish);

  const interiorKey = getInteriorTreatmentKey(interiorTreatment);

  const finishProfile =

    FINISH_TREATMENT_PROFILES[finishKey] ||

    FINISH_TREATMENT_PROFILES.torchedMedium;

  const interiorProfile =

    INTERIOR_TREATMENT_PROFILES[interiorKey] ||

    INTERIOR_TREATMENT_PROFILES.none;

  const nodeBias = sumNodeBias(finishProfile.nodeBias, interiorProfile.nodeBias);

  const totalDamping = round2(

    Number(finishProfile.damping || 0) * 0.72 +

      Number(interiorProfile.damping || 0) * 0.28

  );

  const totalSurfaceBuild = round2(Number(finishProfile.surfaceBuild || 0));

  const totalOpenness = round2(

    Number(finishProfile.openness || 0.5) -

      Number(interiorProfile.damping || 0) * 0.12

  );

  return {

    finishKey,

    finish: finishProfile,

    interiorKey,

    interior: interiorProfile,

    isOberBuild: Boolean(isOberBuild),

    totalDamping,

    totalSurfaceBuild,

    totalOpenness,

    nodeBias,

    summary: `${finishProfile.userFacingLabel}. ${finishProfile.description} ${interiorProfile.description}`,

  };

}

export function buildNeutralFinishTreatmentRead() {

  return {

    finishKey: 'rawNatural',

    finish: FINISH_TREATMENT_PROFILES.rawNatural,

    interiorKey: 'none',

    interior: INTERIOR_TREATMENT_PROFILES.none,

    isOberBuild: false,

    totalDamping: 0,

    totalSurfaceBuild: 0,

    totalOpenness: 0,

    nodeBias: emptyNodeBias(),

    summary:

      'Neutral finish reference: no meaningful finish or interior-treatment shift applied.',

  };

}

export default FINISH_TREATMENT_PROFILES;