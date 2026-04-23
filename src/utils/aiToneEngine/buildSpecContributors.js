// src/utils/aiToneEngine/buildSpecContributors.js

import {

  deriveWoodHeuristicProfile,

  blendWoodProfiles,

} from './woodsHeuristics.js';

import { deriveConstructionHeuristicProfile } from './constructionHeuristics.js';

import { deriveHoopHeuristicProfile } from './hoopHeuristics.js';

import { deriveHardwareHeuristicProfile } from './hardwareHeuristics.js';

import { deriveFinishHeuristicProfile } from './finishHeuristics.js';

const DEFAULT_SPIDER_PROFILE = {

  attack: 5,

  sustain: 5,

  warmth: 5,

  projection: 5,

  brightness: 5,

  sensitivity: 5,

  control: 5,

};

function normalizeString(value) {

  return String(value || '').trim().toLowerCase();

}

function round2(n) {

  return Math.round(n * 100) / 100;

}

function blendProfiles(profiles = [], weights = null) {

  const valid = profiles.filter(Boolean);

  if (!valid.length) return DEFAULT_SPIDER_PROFILE;

  const axes = Object.keys(DEFAULT_SPIDER_PROFILE);

  if (!Array.isArray(weights) || weights.length !== valid.length) {

    return axes.reduce((acc, axis) => {

      const avg =

        valid.reduce((sum, profile) => sum + Number(profile?.[axis] || 5), 0) /

        valid.length;

      acc[axis] = round2(avg);

      return acc;

    }, {});

  }

  const safeWeights = weights.map((weight) =>

    Number.isFinite(Number(weight)) ? Number(weight) : 0

  );

  const totalWeight = safeWeights.reduce((sum, weight) => sum + weight, 0) || 1;

  return axes.reduce((acc, axis) => {

    const weighted =

      valid.reduce((sum, profile, index) => {

        return sum + Number(profile?.[axis] || 5) * safeWeights[index];

      }, 0) / totalWeight;

    acc[axis] = round2(weighted);

    return acc;

  }, {});

}

function scoreHeadTension(value) {

  const v = normalizeString(value);

  if (v.includes('high')) {

    return {

      attack: 8.7,

      sustain: 4.8,

      warmth: 4.8,

      projection: 7.0,

      brightness: 8.8,

      sensitivity: 6.3,

      control: 7.1,

    };

  }

  if (v.includes('low')) {

    return {

      attack: 5.3,

      sustain: 8.2,

      warmth: 8.1,

      projection: 6.1,

      brightness: 4.9,

      sensitivity: 7.2,

      control: 4.8,

    };

  }

  return {

    attack: 7.0,

    sustain: 6.5,

    warmth: 6.5,

    projection: 6.8,

    brightness: 6.9,

    sensitivity: 6.9,

    control: 6.0,

  };

}

function scoreHeadType(value) {

  const v = normalizeString(value);

  if (v.includes('hydraulic') || v.includes('oil')) {

    return {

      attack: 5.7,

      sustain: 3.6,

      warmth: 7.0,

      projection: 5.5,

      brightness: 3.4,

      sensitivity: 4.0,

      control: 9.2,

    };

  }

  if (v.includes('clear')) {

    return {

      attack: 8.0,

      sustain: 6.2,

      warmth: 5.1,

      projection: 7.2,

      brightness: 8.0,

      sensitivity: 6.3,

      control: 5.6,

    };

  }

  if (v.includes('hybrid')) {

    return {

      attack: 7.3,

      sustain: 6.4,

      warmth: 6.3,

      projection: 7.0,

      brightness: 6.8,

      sensitivity: 6.2,

      control: 6.8,

    };

  }

  return {

    attack: 7.0,

    sustain: 6.8,

    warmth: 7.4,

    projection: 6.5,

    brightness: 5.7,

    sensitivity: 7.1,

    control: 6.4,

  };

}

function scoreBearingEdge(value) {

  const v = normalizeString(value);

  if (v.includes('full roundover') || v.includes('vintage wide round')) {

    return {

      attack: 5.1,

      sustain: 8.1,

      warmth: 8.8,

      projection: 5.7,

      brightness: 4.0,

      sensitivity: 7.0,

      control: 5.0,

    };

  }

  if (v.includes('baseball bat')) {

    return {

      attack: 5.7,

      sustain: 7.3,

      warmth: 8.0,

      projection: 6.2,

      brightness: 4.9,

      sensitivity: 6.7,

      control: 5.7,

    };

  }

  if (v.includes('slight roundover')) {

    return {

      attack: 6.2,

      sustain: 7.5,

      warmth: 7.8,

      projection: 6.6,

      brightness: 5.4,

      sensitivity: 7.0,

      control: 5.8,

    };

  }

  if (

    v.includes('45 / roundover hybrid') ||

    (v.includes('45') && v.includes('roundover'))

  ) {

    return {

      attack: 7.5,

      sustain: 6.6,

      warmth: 6.7,

      projection: 7.4,

      brightness: 6.7,

      sensitivity: 7.0,

      control: 6.4,

    };

  }

  if (v.includes('30') && v.includes('double')) {

    return {

      attack: 6.5,

      sustain: 7.4,

      warmth: 7.5,

      projection: 6.9,

      brightness: 5.9,

      sensitivity: 7.1,

      control: 5.8,

    };

  }

  if (v.includes('30') && v.includes('inner')) {

    return {

      attack: 6.8,

      sustain: 7.2,

      warmth: 7.4,

      projection: 7.0,

      brightness: 6.1,

      sensitivity: 7.0,

      control: 5.9,

    };

  }

  if (v.includes('45') && v.includes('double')) {

    return {

      attack: 8.2,

      sustain: 6.0,

      warmth: 5.3,

      projection: 7.9,

      brightness: 7.7,

      sensitivity: 6.8,

      control: 6.8,

    };

  }

  if (v.includes('45') && v.includes('inner')) {

    return {

      attack: 8.0,

      sustain: 6.2,

      warmth: 5.5,

      projection: 7.7,

      brightness: 7.4,

      sensitivity: 6.9,

      control: 6.6,

    };

  }

  if (v.includes('sharp') || v.includes('acute')) {

    return {

      attack: 8.5,

      sustain: 5.8,

      warmth: 4.9,

      projection: 8.0,

      brightness: 8.1,

      sensitivity: 6.8,

      control: 6.9,

    };

  }

  if (v.includes('round')) {

    return {

      attack: 5.8,

      sustain: 7.8,

      warmth: 8.3,

      projection: 6.2,

      brightness: 4.8,

      sensitivity: 7.0,

      control: 5.4,

    };

  }

  if (v.includes('30')) {

    return {

      attack: 6.8,

      sustain: 7.2,

      warmth: 7.4,

      projection: 7.0,

      brightness: 6.1,

      sensitivity: 7.0,

      control: 5.9,

    };

  }

  if (v.includes('45')) {

    return {

      attack: 8.4,

      sustain: 6.0,

      warmth: 5.2,

      projection: 7.8,

      brightness: 7.8,

      sensitivity: 6.9,

      control: 6.8,

    };

  }

  return DEFAULT_SPIDER_PROFILE;

}

function scoreDepth(value) {

  const depth = Number(value);

  if (!Number.isFinite(depth)) return DEFAULT_SPIDER_PROFILE;

  const points = [

    {

      depth: 5.0,

      profile: {

        attack: 8.7,

        sustain: 5.1,

        warmth: 4.8,

        projection: 7.2,

        brightness: 8.2,

        sensitivity: 6.8,

        control: 6.8,

      },

    },

    {

      depth: 6.0,

      profile: {

        attack: 8.0,

        sustain: 6.0,

        warmth: 5.8,

        projection: 7.3,

        brightness: 7.3,

        sensitivity: 6.8,

        control: 6.3,

      },

    },

    {

      depth: 6.5,

      profile: {

        attack: 7.2,

        sustain: 6.8,

        warmth: 6.9,

        projection: 7.0,

        brightness: 6.4,

        sensitivity: 6.6,

        control: 6.0,

      },

    },

    {

      depth: 7.5,

      profile: {

        attack: 6.5,

        sustain: 7.7,

        warmth: 7.8,

        projection: 6.9,

        brightness: 5.6,

        sensitivity: 6.2,

        control: 5.7,

      },

    },

    {

      depth: 8.0,

      profile: {

        attack: 5.9,

        sustain: 8.1,

        warmth: 8.4,

        projection: 6.4,

        brightness: 5.0,

        sensitivity: 5.8,

        control: 5.5,

      },

    },

  ];

  const axes = Object.keys(DEFAULT_SPIDER_PROFILE);

  if (depth <= points[0].depth) return points[0].profile;

  if (depth >= points[points.length - 1].depth) {

    return points[points.length - 1].profile;

  }

  for (let i = 0; i < points.length - 1; i += 1) {

    const left = points[i];

    const right = points[i + 1];

    if (depth >= left.depth && depth <= right.depth) {

      const range = right.depth - left.depth;

      const t = range === 0 ? 0 : (depth - left.depth) / range;

      return axes.reduce((acc, axis) => {

        const start = Number(left.profile[axis]) || 5;

        const end = Number(right.profile[axis]) || 5;

        acc[axis] = round2(start + (end - start) * t);

        return acc;

      }, {});

    }

  }

  return DEFAULT_SPIDER_PROFILE;

}

function scoreDiameter(value) {

  const diameter = Number(value);

  if (!Number.isFinite(diameter)) return DEFAULT_SPIDER_PROFILE;

  const points = [

    {

      diameter: 10,

      profile: {

        attack: 8.9,

        sustain: 5.1,

        warmth: 4.6,

        projection: 7.9,

        brightness: 8.7,

        sensitivity: 7.1,

        control: 7.2,

      },

    },

    {

      diameter: 12,

      profile: {

        attack: 8.3,

        sustain: 5.8,

        warmth: 5.1,

        projection: 7.5,

        brightness: 8.0,

        sensitivity: 6.8,

        control: 6.9,

      },

    },

    {

      diameter: 13,

      profile: {

        attack: 7.8,

        sustain: 6.2,

        warmth: 5.7,

        projection: 7.3,

        brightness: 7.2,

        sensitivity: 6.7,

        control: 6.5,

      },

    },

    {

      diameter: 14,

      profile: {

        attack: 7.0,

        sustain: 6.9,

        warmth: 6.8,

        projection: 7.0,

        brightness: 6.2,

        sensitivity: 6.6,

        control: 6.1,

      },

    },

    {

      diameter: 15,

      profile: {

        attack: 6.2,

        sustain: 7.5,

        warmth: 7.8,

        projection: 6.8,

        brightness: 5.3,

        sensitivity: 6.0,

        control: 5.7,

      },

    },

  ];

  const axes = Object.keys(DEFAULT_SPIDER_PROFILE);

  if (diameter <= points[0].diameter) return points[0].profile;

  if (diameter >= points[points.length - 1].diameter) {

    return points[points.length - 1].profile;

  }

  for (let i = 0; i < points.length - 1; i += 1) {

    const left = points[i];

    const right = points[i + 1];

    if (diameter >= left.diameter && diameter <= right.diameter) {

      const range = right.diameter - left.diameter;

      const t = range === 0 ? 0 : (diameter - left.diameter) / range;

      return axes.reduce((acc, axis) => {

        const start = Number(left.profile[axis]) || 5;

        const end = Number(right.profile[axis]) || 5;

        acc[axis] = round2(start + (end - start) * t);

        return acc;

      }, {});

    }

  }

  return DEFAULT_SPIDER_PROFILE;

}

function parseFirstNumber(value) {

  const raw = String(value || '').toLowerCase();

  const match = raw.match(/(\d+(?:\.\d+)?)/);

  return match ? Number(match[1]) : null;

}

function scoreShellThickness(value, specs = {}) {

  const shellFamily = normalizeString(specs.shellFamily || 'wood');

  const directMm =

    Number(specs.shellThicknessMm) ||

    Number(specs.thicknessMm) ||

    Number(specs.shellThickness);

  const n = Number.isFinite(directMm) ? directMm : parseFirstNumber(value);

  if (!Number.isFinite(n)) return DEFAULT_SPIDER_PROFILE;

  if (shellFamily === 'metal') {

    if (n <= 1.0) {

      return {

        attack: 7.9,

        sustain: 7.0,

        warmth: 5.2,

        projection: 7.6,

        brightness: 7.9,

        sensitivity: 6.7,

        control: 6.0,

      };

    }

    if (n <= 1.2) {

      return {

        attack: 8.0,

        sustain: 6.8,

        warmth: 5.4,

        projection: 7.7,

        brightness: 7.7,

        sensitivity: 6.4,

        control: 6.3,

      };

    }

    if (n <= 1.5) {

      return {

        attack: 8.4,

        sustain: 6.2,

        warmth: 5.2,

        projection: 8.2,

        brightness: 7.4,

        sensitivity: 5.9,

        control: 7.0,

      };

    }

    return {

      attack: 8.9,

      sustain: 5.5,

      warmth: 5.7,

      projection: 8.8,

      brightness: 6.9,

      sensitivity: 5.2,

      control: 8.2,

    };

  }

  if (shellFamily === 'acrylic') {

    if (n <= 6) {

      return {

        attack: 7.8,

        sustain: 6.4,

        warmth: 5.1,

        projection: 7.7,

        brightness: 7.6,

        sensitivity: 6.1,

        control: 6.5,

      };

    }

    if (n <= 10) {

      return {

        attack: 8.3,

        sustain: 5.8,

        warmth: 4.8,

        projection: 8.2,

        brightness: 7.9,

        sensitivity: 5.6,

        control: 7.3,

      };

    }

    return {

      attack: 8.8,

      sustain: 5.1,

      warmth: 4.5,

      projection: 8.7,

      brightness: 8.1,

      sensitivity: 5.0,

      control: 8.1,

    };

  }

  if (n <= 7) {

    return {

      attack: 6.2,

      sustain: 8.1,

      warmth: 7.4,

      projection: 6.0,

      brightness: 6.9,

      sensitivity: 7.8,

      control: 5.0,

    };

  }

  if (n <= 9) {

    return {

      attack: 6.8,

      sustain: 7.5,

      warmth: 7.2,

      projection: 6.5,

      brightness: 6.5,

      sensitivity: 7.2,

      control: 5.6,

    };

  }

  if (n <= 11) {

    return {

      attack: 7.5,

      sustain: 6.7,

      warmth: 6.8,

      projection: 7.4,

      brightness: 6.0,

      sensitivity: 6.3,

      control: 6.7,

    };

  }

  if (n <= 13) {

    return {

      attack: 8.0,

      sustain: 6.1,

      warmth: 6.4,

      projection: 7.9,

      brightness: 5.7,

      sensitivity: 5.8,

      control: 7.3,

    };

  }

  return {

    attack: 8.4,

    sustain: 5.6,

    warmth: 6.0,

    projection: 8.2,

    brightness: 5.4,

    sensitivity: 5.3,

    control: 7.8,

  };

}

function scoreLugQuantity(value, specs = {}) {

  const lugCount = Number(value ?? specs.lugQuantity);

  if (!Number.isFinite(lugCount)) return DEFAULT_SPIDER_PROFILE;

  if (lugCount <= 6) {

    return {

      attack: 6.2,

      sustain: 7.8,

      warmth: 7.1,

      projection: 6.2,

      brightness: 5.8,

      sensitivity: 7.4,

      control: 5.2,

    };

  }

  if (lugCount <= 8) {

    return {

      attack: 6.9,

      sustain: 6.9,

      warmth: 6.8,

      projection: 6.9,

      brightness: 6.0,

      sensitivity: 6.8,

      control: 6.0,

    };

  }

  return {

    attack: 7.7,

    sustain: 6.1,

    warmth: 6.3,

    projection: 7.6,

    brightness: 6.1,

    sensitivity: 6.0,

    control: 7.0,

  };

}

function scoreStaveCount(value, specs = {}) {

  const staveCount = Number(value ?? specs.staveCount);

  if (!Number.isFinite(staveCount)) return DEFAULT_SPIDER_PROFILE;

  if (staveCount <= 12) {

    return {

      attack: 6.0,

      sustain: 8.0,

      warmth: 7.6,

      projection: 6.2,

      brightness: 5.6,

      sensitivity: 7.5,

      control: 5.0,

    };

  }

  if (staveCount <= 16) {

    return {

      attack: 6.9,

      sustain: 7.0,

      warmth: 6.9,

      projection: 7.0,

      brightness: 6.0,

      sensitivity: 6.8,

      control: 6.0,

    };

  }

  return {

    attack: 7.8,

    sustain: 6.0,

    warmth: 6.2,

    projection: 7.8,

    brightness: 6.3,

    sensitivity: 5.9,

    control: 7.0,

  };

}

function scoreSnareBedDepth(value) {

  const v = normalizeString(value);

  if (v.includes('shallow')) {

    return {

      attack: 7.5,

      sustain: 6.3,

      warmth: 5.7,

      projection: 6.8,

      brightness: 7.1,

      sensitivity: 6.0,

      control: 6.9,

    };

  }

  if (v.includes('deep')) {

    return {

      attack: 6.4,

      sustain: 6.7,

      warmth: 6.6,

      projection: 6.3,

      brightness: 5.9,

      sensitivity: 8.2,

      control: 5.9,

    };

  }

  return {

    attack: 6.9,

    sustain: 6.5,

    warmth: 6.2,

    projection: 6.6,

    brightness: 6.4,

    sensitivity: 7.2,

    control: 6.3,

  };

}

function scoreSnareSideHead(value) {

  const v = normalizeString(value);

  if (v.includes('2mil') || v.includes('thin')) {

    return {

      attack: 7.5,

      sustain: 6.2,

      warmth: 5.4,

      projection: 6.8,

      brightness: 7.2,

      sensitivity: 8.4,

      control: 5.7,

    };

  }

  if (v.includes('5mil') || v.includes('thick')) {

    return {

      attack: 6.3,

      sustain: 6.4,

      warmth: 6.4,

      projection: 6.1,

      brightness: 5.5,

      sensitivity: 5.8,

      control: 7.9,

    };

  }

  return {

    attack: 6.9,

    sustain: 6.3,

    warmth: 5.9,

    projection: 6.4,

    brightness: 6.3,

    sensitivity: 7.3,

    control: 6.6,

  };

}

function scoreSnareWireCount(value) {

  const count = Number(value);

  if (!Number.isFinite(count)) return DEFAULT_SPIDER_PROFILE;

  if (count <= 12) {

    return {

      attack: 7.4,

      sustain: 6.2,

      warmth: 5.7,

      projection: 6.7,

      brightness: 7.0,

      sensitivity: 5.9,

      control: 7.6,

    };

  }

  if (count <= 16) {

    return {

      attack: 7.1,

      sustain: 6.3,

      warmth: 5.9,

      projection: 6.6,

      brightness: 6.7,

      sensitivity: 6.5,

      control: 7.0,

    };

  }

  if (count <= 20) {

    return {

      attack: 6.9,

      sustain: 6.4,

      warmth: 6.1,

      projection: 6.5,

      brightness: 6.3,

      sensitivity: 7.0,

      control: 6.4,

    };

  }

  if (count <= 24) {

    return {

      attack: 6.6,

      sustain: 6.5,

      warmth: 6.2,

      projection: 6.3,

      brightness: 6.0,

      sensitivity: 7.5,

      control: 6.0,

    };

  }

  if (count <= 30) {

    return {

      attack: 6.2,

      sustain: 6.7,

      warmth: 6.4,

      projection: 6.1,

      brightness: 5.8,

      sensitivity: 8.0,

      control: 5.6,

    };

  }

  return {

    attack: 5.8,

    sustain: 6.8,

    warmth: 6.6,

    projection: 5.9,

    brightness: 5.5,

    sensitivity: 8.6,

    control: 5.0,

  };

}

function scoreSnareWireStyle(value) {

  const v = normalizeString(value);

  if (v.includes('dry') || v.includes('controlled')) {

    return {

      attack: 7.4,

      sustain: 5.7,

      warmth: 5.8,

      projection: 6.6,

      brightness: 6.6,

      sensitivity: 6.4,

      control: 8.4,

    };

  }

  if (v.includes('open') || v.includes('sensitive')) {

    return {

      attack: 6.4,

      sustain: 6.8,

      warmth: 6.2,

      projection: 6.1,

      brightness: 5.9,

      sensitivity: 8.4,

      control: 5.5,

    };

  }

  if (v.includes('wide') || v.includes('saturated')) {

    return {

      attack: 6.0,

      sustain: 6.9,

      warmth: 6.8,

      projection: 6.0,

      brightness: 5.7,

      sensitivity: 8.0,

      control: 5.2,

    };

  }

  return {

    attack: 6.9,

    sustain: 6.4,

    warmth: 6.1,

    projection: 6.4,

    brightness: 6.2,

    sensitivity: 7.2,

    control: 6.3,

  };

}

function scoreSnareWireMaterial(value) {

  const v = normalizeString(value);

  if (v.includes('brass')) {

    return {

      attack: 6.3,

      sustain: 6.6,

      warmth: 6.8,

      projection: 6.0,

      brightness: 5.5,

      sensitivity: 7.4,

      control: 6.0,

    };

  }

  return {

    attack: 7.0,

    sustain: 6.3,

    warmth: 5.8,

    projection: 6.5,

    brightness: 6.8,

    sensitivity: 7.1,

    control: 6.4,

  };

}

function scoreReRings(value) {

  const v = normalizeString(value);

  if (v.includes('thin')) {

    return {

      attack: 6.9,

      sustain: 6.8,

      warmth: 6.6,

      projection: 6.9,

      brightness: 6.1,

      sensitivity: 6.4,

      control: 6.4,

    };

  }

  if (v.includes('standard')) {

    return {

      attack: 7.4,

      sustain: 6.2,

      warmth: 6.3,

      projection: 7.3,

      brightness: 6.0,

      sensitivity: 6.0,

      control: 7.0,

    };

  }

  if (v.includes('thick')) {

    return {

      attack: 7.9,

      sustain: 5.7,

      warmth: 6.1,

      projection: 7.8,

      brightness: 5.8,

      sensitivity: 5.7,

      control: 7.7,

    };

  }

  return {

    attack: 6.5,

    sustain: 7.0,

    warmth: 6.8,

    projection: 6.5,

    brightness: 6.2,

    sensitivity: 6.7,

    control: 5.8,

  };

}

function scoreMetalShellMaterial(value) {

  const v = normalizeString(value);

  if (v.includes('brass')) {

    return {

      attack: 7.8,

      sustain: 7.0,

      warmth: 6.9,

      projection: 8.2,

      brightness: 6.7,

      sensitivity: 6.5,

      control: 6.7,

    };

  }

  if (v.includes('aluminum')) {

    return {

      attack: 7.7,

      sustain: 6.1,

      warmth: 5.4,

      projection: 7.7,

      brightness: 7.4,

      sensitivity: 7.1,

      control: 6.6,

    };

  }

  if (v.includes('steel')) {

    return {

      attack: 8.4,

      sustain: 6.2,

      warmth: 4.8,

      projection: 8.5,

      brightness: 8.1,

      sensitivity: 6.0,

      control: 7.1,

    };

  }

  if (v.includes('copper')) {

    return {

      attack: 7.0,

      sustain: 7.1,

      warmth: 7.6,

      projection: 7.5,

      brightness: 5.8,

      sensitivity: 6.8,

      control: 6.2,

    };

  }

  if (v.includes('bronze')) {

    return {

      attack: 7.7,

      sustain: 7.3,

      warmth: 7.1,

      projection: 8.0,

      brightness: 6.5,

      sensitivity: 6.6,

      control: 6.5,

    };

  }

  return DEFAULT_SPIDER_PROFILE;

}

function scoreAcrylicShellType() {

  return {

    attack: 8.4,

    sustain: 6.0,

    warmth: 4.5,

    projection: 8.5,

    brightness: 8.3,

    sensitivity: 5.5,

    control: 7.1,

  };

}

function safeProfile(result) {

  return result?.profile || DEFAULT_SPIDER_PROFILE;

}

function buildWoodContributor(specs = {}) {

  const construction = normalizeString(specs.construction);

  if (construction.includes('hybrid')) {

    const woods = [];

    if (specs.innerSpecies) woods.push({ wood: specs.innerSpecies, ratio: 0.5 });

    if (specs.secondarySpecies) {

      woods.push({ wood: specs.secondarySpecies, ratio: 0.25 });

    }

    if (specs.outerSpecies) {

      woods.push({

        wood: specs.outerSpecies,

        ratio: specs.secondarySpecies ? 0.25 : 0.5,

      });

    }

    if (woods.length > 1) return safeProfile(blendWoodProfiles(woods));

    if (woods.length === 1) {

      return safeProfile(deriveWoodHeuristicProfile(woods[0].wood));

    }

    return DEFAULT_SPIDER_PROFILE;

  }

  const primary =

    specs.primarySpecies ||

    (Array.isArray(specs.species) ? specs.species[0] : specs.species) ||

    '';

  if (primary && specs.secondarySpecies) {

    return safeProfile(

      blendWoodProfiles([

        { wood: primary, ratio: 0.5 },

        { wood: specs.secondarySpecies, ratio: 0.5 },

      ])

    );

  }

  if (primary) return safeProfile(deriveWoodHeuristicProfile(primary));

  return DEFAULT_SPIDER_PROFILE;

}

function buildShellMaterialContributor(specs = {}) {

  const shellFamily = normalizeString(specs.shellFamily || 'wood');

  if (shellFamily === 'metal') return scoreMetalShellMaterial(specs.metalMaterial);

  if (shellFamily === 'acrylic') return scoreAcrylicShellType(specs.acrylicType);

  return buildWoodContributor(specs);

}

function buildShellConstructionContributor(specs = {}) {

  const shellFamily = normalizeString(specs.shellFamily || 'wood');

  if (shellFamily === 'metal') {

    return {

      attack: 8.0,

      sustain: 6.7,

      warmth: 5.8,

      projection: 8.0,

      brightness: 7.2,

      sensitivity: 6.3,

      control: 6.7,

    };

  }

  if (shellFamily === 'acrylic') {

    return {

      attack: 8.0,

      sustain: 6.4,

      warmth: 5.0,

      projection: 8.0,

      brightness: 7.7,

      sensitivity: 5.8,

      control: 6.8,

    };

  }

  return safeProfile(deriveConstructionHeuristicProfile(specs.construction));

}

function buildFinishContributor(specs = {}) {

  const shellFamily = normalizeString(specs.shellFamily || 'wood');

  if (shellFamily !== 'wood') {

    return {

      attack: 5.2,

      sustain: 5.0,

      warmth: 5.0,

      projection: 5.0,

      brightness: 5.0,

      sensitivity: 5.0,

      control: 5.1,

    };

  }

  return safeProfile(deriveFinishHeuristicProfile(specs.finish));

}

function buildReRingContributor(specs = {}) {

  const shellFamily = normalizeString(specs.shellFamily || 'wood');

  if (shellFamily !== 'wood') return DEFAULT_SPIDER_PROFILE;

  return scoreReRings(specs.reRings);

}

function buildCompositeSnareResponseContributor(specs = {}) {

  return blendProfiles([

    scoreSnareBedDepth(specs.snareBedDepth),

    scoreSnareSideHead(specs.snareSideHead),

    scoreSnareWireCount(specs.snareWireCount),

    scoreSnareWireStyle(specs.snareWireStyle),

    scoreSnareWireMaterial(specs.snareWireMaterial),

  ]);

}

function buildHeritageShellThicknessContributor(specs = {}) {

  return scoreShellThickness(

    specs.thickness ??

      specs.shellThicknessMm ??

      specs.thicknessMm ??

      specs.shellThicknessBucket,

    specs

  );

}

export function buildSpecContributors(specs = {}) {

  return {

    headTension: scoreHeadTension(specs.tension),

    headType: scoreHeadType(specs.drumhead),

    bearingEdge: scoreBearingEdge(specs.bearingEdge),

    shellConstruction: buildShellConstructionContributor(specs),

    shellMaterial: buildShellMaterialContributor(specs),

    woodSpecies: buildWoodContributor(specs),

    depth: scoreDepth(specs.depth),

    diameter: scoreDiameter(specs.width),

    shellThickness: buildHeritageShellThicknessContributor(specs),

    lugQuantity: scoreLugQuantity(specs.lugQuantity, specs),

    staveCount: scoreStaveCount(specs.staveCount, specs),

    hoopType: safeProfile(deriveHoopHeuristicProfile(specs.hoopType)),

    hardwareType: safeProfile(

      deriveHardwareHeuristicProfile(specs.hardwareType)

    ),

    finishType: buildFinishContributor(specs),

    reRings: buildReRingContributor(specs),

    snareBedDepth: scoreSnareBedDepth(specs.snareBedDepth),

    snareSideHead: scoreSnareSideHead(specs.snareSideHead),

    snareWireCount: scoreSnareWireCount(specs.snareWireCount),

    snareWireStyle: scoreSnareWireStyle(specs.snareWireStyle),

    snareWireMaterial: scoreSnareWireMaterial(specs.snareWireMaterial),

    snareResponse: buildCompositeSnareResponseContributor(specs),

  };

}

export default buildSpecContributors;