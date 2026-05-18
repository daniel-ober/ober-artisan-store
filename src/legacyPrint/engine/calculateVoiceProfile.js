export function calculateVoiceProfile(drum = {}) {

  const shell = drum.shell || {};

  const hardware = drum.stockHardware || {};

  const dims = drum.dimensions || {};

  // -----------------------------

  // BASE MATERIAL WEIGHTS

  // -----------------------------

  const materialMap = {

    brass: { brightness: 0.9, sustain: 0.7, control: 0.4 },

    steel: { brightness: 1.0, sustain: 0.8, control: 0.5 },

    maple: { warmth: 0.9, attack: 0.6, sustain: 0.7 },

    birch: { attack: 0.9, brightness: 0.7, sustain: 0.5 },

    mahogany: { warmth: 1.0, sustain: 0.9, brightness: 0.4 },

    walnut: { warmth: 0.95, sustain: 0.8, brightness: 0.5 }

  };

  const material = shell.materialPrimary || 'unknown';

  const mat = materialMap[material] || {

    attack: 0.6,

    brightness: 0.6,

    sustain: 0.6,

    warmth: 0.6,

    sensitivity: 0.6,

    control: 0.6,

    projection: 0.6

  };

  // -----------------------------

  // SHELL CONSTRUCTION EFFECTS

  // -----------------------------

  const construction = shell.construction;

  let constructionMod = {

    attack: 0,

    brightness: 0,

    sustain: 0,

    warmth: 0,

    sensitivity: 0,

    control: 0,

    projection: 0

  };

  if (construction === 'metalRolled') {

    constructionMod.brightness += 0.2;

    constructionMod.control += 0.1;

  }

  if (construction === 'ply') {

    constructionMod.control += 0.2;

    constructionMod.sustain += 0.1;

  }

  if (construction === 'stave') {

    constructionMod.attack += 0.2;

    constructionMod.projection += 0.2;

  }

  // -----------------------------

  // SIZE SCALING (physics proxy)

  // -----------------------------

  const diameter = dims.diameterInches || 14;

  const depth = dims.depthInches || 5.5;

  const sizeFactor = (diameter * depth) / 100;

  const sizeMod = {

    attack: -sizeFactor * 0.2,

    brightness: -sizeFactor * 0.1,

    sustain: sizeFactor * 0.3,

    warmth: sizeFactor * 0.2,

    projection: sizeFactor * 0.25,

    sensitivity: -sizeFactor * 0.1,

    control: sizeFactor * 0.1

  };

  // -----------------------------

  // HARDWARE DAMPING MODEL

  // -----------------------------

  const lugCount = hardware.lugCount || 8;

  const hardwareMod = {

    control: lugCount > 10 ? 0.2 : -0.1,

    sustain: lugCount > 10 ? -0.1 : 0.1,

    sensitivity: lugCount < 8 ? 0.2 : 0

  };

  // -----------------------------

  // FINAL COMPOSITE

  // -----------------------------

  const clamp = (v) => Math.max(0, Math.min(1, v));

  const voice = {

    attack: clamp((mat.attack || 0.6) + constructionMod.attack + sizeMod.attack),

    brightness: clamp((mat.brightness || 0.6) + constructionMod.brightness + sizeMod.brightness),

    projection: clamp((0.6 + constructionMod.projection + sizeMod.projection)),

    sustain: clamp((mat.sustain || 0.6) + constructionMod.sustain + sizeMod.sustain + hardwareMod.sustain),

    warmth: clamp((mat.warmth || 0.6) + constructionMod.warmth + sizeMod.warmth),

    sensitivity: clamp((mat.sensitivity || 0.6) + sizeMod.sensitivity + hardwareMod.sensitivity),

    control: clamp((mat.control || 0.6) + constructionMod.control + hardwareMod.control)

  };

  return {

    voice,

    metadata: {

      material,

      construction,

      diameter,

      depth,

      lugCount,

      sizeFactor

    }

  };

}