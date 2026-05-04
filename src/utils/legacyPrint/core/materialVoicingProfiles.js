// src/utils/legacyPrint/core/materialVoicingProfiles.js

export const MATERIAL_VOICING_PROFILES = Object.freeze({

  maple: {

    materialId: 'maple',

    label: 'Maple',

    family: 'wood',

    profile: {

      attack: 5.35,

      brightness: 5.35,

      projection: 5.35,

      sustain: 5.25,

      warmth: 5.35,

      sensitivity: 5.3,

      control: 5.25,

    },

  },

  birch: {

    materialId: 'birch',

    label: 'Birch',

    family: 'wood',

    profile: {

      attack: 5.45,

      brightness: 5.65,

      projection: 5.55,

      sustain: 5.05,

      warmth: 4.95,

      sensitivity: 5.2,

      control: 5.45,

    },

  },

  oak: {

    materialId: 'oak',

    label: 'Oak',

    family: 'wood',

    profile: {

      attack: 5.45,

      brightness: 5.25,

      projection: 5.6,

      sustain: 5.15,

      warmth: 5.55,

      sensitivity: 5.15,

      control: 5.4,

    },

  },

  'northern-red-oak': {

    materialId: 'northern-red-oak',

    label: 'Northern Red Oak',

    family: 'wood',

    profile: {

      attack: 5.42,

      brightness: 5.18,

      projection: 5.55,

      sustain: 5.12,

      warmth: 5.65,

      sensitivity: 5.12,

      control: 5.42,

    },

  },

  walnut: {

    materialId: 'walnut',

    label: 'Walnut',

    family: 'wood',

    profile: {

      attack: 5.1,

      brightness: 4.85,

      projection: 5.25,

      sustain: 5.35,

      warmth: 5.85,

      sensitivity: 5.35,

      control: 5.15,

    },

  },

  mahogany: {

    materialId: 'mahogany',

    label: 'Mahogany',

    family: 'wood',

    profile: {

      attack: 4.95,

      brightness: 4.75,

      projection: 5.15,

      sustain: 5.45,

      warmth: 5.95,

      sensitivity: 5.4,

      control: 5.0,

    },

  },

  brass: {

    materialId: 'brass',

    label: 'Brass',

    family: 'metal',

    profile: {

      attack: 5.75,

      brightness: 5.7,

      projection: 5.9,

      sustain: 5.35,

      warmth: 5.35,

      sensitivity: 5.35,

      control: 5.35,

    },

  },

  steel: {

    materialId: 'steel',

    label: 'Steel',

    family: 'metal',

    profile: {

      attack: 6.05,

      brightness: 6.25,

      projection: 6.15,

      sustain: 5.15,

      warmth: 4.65,

      sensitivity: 5.25,

      control: 5.45,

    },

  },

  copper: {

    materialId: 'copper',

    label: 'Copper',

    family: 'metal',

    profile: {

      attack: 5.45,

      brightness: 5.25,

      projection: 5.7,

      sustain: 5.35,

      warmth: 5.7,

      sensitivity: 5.35,

      control: 5.25,

    },

  },

  aluminum: {

    materialId: 'aluminum',

    label: 'Aluminum',

    family: 'metal',

    profile: {

      attack: 5.55,

      brightness: 5.65,

      projection: 5.7,

      sustain: 5.15,

      warmth: 4.9,

      sensitivity: 5.55,

      control: 5.35,

    },

  },

  acrylic: {

    materialId: 'acrylic',

    label: 'Acrylic',

    family: 'acrylic',

    profile: {

      attack: 5.75,

      brightness: 5.8,

      projection: 5.9,

      sustain: 5.55,

      warmth: 4.75,

      sensitivity: 5.25,

      control: 5.15,

    },

  },

  'thin-acrylic': {

    materialId: 'thin-acrylic',

    label: 'Thin Acrylic',

    family: 'acrylic',

    profile: {

      attack: 5.65,

      brightness: 5.7,

      projection: 5.75,

      sustain: 5.75,

      warmth: 4.85,

      sensitivity: 5.35,

      control: 4.95,

    },

  },

  'medium-acrylic': {

    materialId: 'medium-acrylic',

    label: 'Medium Acrylic',

    family: 'acrylic',

    profile: {

      attack: 5.75,

      brightness: 5.8,

      projection: 5.9,

      sustain: 5.55,

      warmth: 4.75,

      sensitivity: 5.25,

      control: 5.15,

    },

  },

  'thick-acrylic': {

    materialId: 'thick-acrylic',

    label: 'Thick Acrylic',

    family: 'acrylic',

    profile: {

      attack: 5.95,

      brightness: 5.9,

      projection: 6.05,

      sustain: 5.25,

      warmth: 4.65,

      sensitivity: 5.05,

      control: 5.45,

    },

  },

});

export function normalizeMaterialId(spec = {}) {

  const candidates = [

    spec.material,

    spec.materialId,

    spec.primarySpecies,

    spec.woodSpecies,

    spec.woodSpeciesLabel,

    spec.metalMaterial,

    spec.acrylicType,

    spec.shellMaterial,

  ];

  const raw = candidates.find((value) => String(value || '').trim());

  const text = String(raw || '')

    .trim()

    .toLowerCase()

    .replace(/_/g, '-');

  if (!text) {

    if (spec.shellFamily === 'metal') return 'brass';

    if (spec.shellFamily === 'acrylic') return 'acrylic';

    return 'maple';

  }

  if (text.includes('northern') && text.includes('oak')) {

    return 'northern-red-oak';

  }

  if (text.includes('thin') && text.includes('acrylic')) {

    return 'thin-acrylic';

  }

  if (text.includes('medium') && text.includes('acrylic')) {

    return 'medium-acrylic';

  }

  if (text.includes('thick') && text.includes('acrylic')) {

    return 'thick-acrylic';

  }

  if (text.includes('acrylic')) return 'acrylic';

  if (text.includes('maple')) return 'maple';

  if (text.includes('birch')) return 'birch';

  if (text.includes('oak')) return 'oak';

  if (text.includes('walnut')) return 'walnut';

  if (text.includes('mahogany')) return 'mahogany';

  if (text.includes('brass')) return 'brass';

  if (text.includes('steel')) return 'steel';

  if (text.includes('copper')) return 'copper';

  if (text.includes('aluminum') || text.includes('aluminium')) return 'aluminum';

  return text;

}

export function getMaterialVoicingProfile(spec = {}) {

  const materialId = normalizeMaterialId(spec);

  return (

    MATERIAL_VOICING_PROFILES[materialId] ||

    MATERIAL_VOICING_PROFILES.maple

  );

}

export default MATERIAL_VOICING_PROFILES;