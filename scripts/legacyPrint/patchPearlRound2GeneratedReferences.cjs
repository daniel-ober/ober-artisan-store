
const fs = require('fs');

const file = 'src/legacyPrint/data/snareReferenceDrums.generated.json';

const records = JSON.parse(fs.readFileSync(file, 'utf8'));

const now = new Date().toISOString();

const patches = {

  'pearl_reference-one_reference-one-maple-birch-20-ply_13x6-5_ply_maple_birch_mastercast-die-cast_a8eee25c': {

    shellThicknessMm: 25,

    shellThickness: '25mm',

    bearingEdge: '45-degree bearing edge',

    sourceConfidence: 'high',

    shell: {

      construction: {

        shellThicknessMm: 25,

        thicknessClass: 'very thick',

        plyCount: 20,

        layupDescription: '20-ply Maple/Birch shell'

      },

      bearingEdges: {

        batterSideProfile: '45-degree bearing edge',

        snareSideProfile: '45-degree bearing edge',

        roundover: 'minimal / modern precision edge',

        evidenceLevel: 'sourceConfirmed',

        confidence: 'high',

        notes: 'Pearl Reference One Maple/Birch 20-ply shell spec; 45-degree bearing edge listed in existing report.'

      }

    }

  },

  'pearl_reference-one_reference-one-maple-birch-20-ply_14x5_ply_maple_birch_mastercast-die-cast_b9f8afd6': {

    shellThicknessMm: 25,

    shellThickness: '25mm',

    bearingEdge: '45-degree bearing edge',

    sourceConfidence: 'high',

    shell: {

      construction: {

        shellThicknessMm: 25,

        thicknessClass: 'very thick',

        plyCount: 20,

        layupDescription: '20-ply Maple/Birch shell'

      },

      bearingEdges: {

        batterSideProfile: '45-degree bearing edge',

        snareSideProfile: '45-degree bearing edge',

        roundover: 'minimal / modern precision edge',

        evidenceLevel: 'sourceConfirmed',

        confidence: 'high',

        notes: 'Pearl Reference One Maple/Birch 20-ply shell spec; 45-degree bearing edge listed in existing report.'

      }

    }

  },

  'pearl_reference-one_reference-one-maple-birch-20-ply_14x6-5_ply_maple_birch_mastercast-die-cast_8a092209': {

    shellThicknessMm: 25,

    shellThickness: '25mm',

    bearingEdge: '45-degree bearing edge',

    sourceConfidence: 'high',

    shell: {

      construction: {

        shellThicknessMm: 25,

        thicknessClass: 'very thick',

        plyCount: 20,

        layupDescription: '20-ply Maple/Birch shell'

      },

      bearingEdges: {

        batterSideProfile: '45-degree bearing edge',

        snareSideProfile: '45-degree bearing edge',

        roundover: 'minimal / modern precision edge',

        evidenceLevel: 'sourceConfirmed',

        confidence: 'high',

        notes: 'Pearl Reference One Maple/Birch 20-ply shell spec; 45-degree bearing edge listed in existing report.'

      }

    }

  },

  'pearl_reference-one_reference-one-maple-birch-20-ply_14x8_ply_maple_birch_mastercast-die-cast_05cb933d': {

    shellThicknessMm: 25,

    shellThickness: '25mm',

    bearingEdge: '45-degree bearing edge',

    sourceConfidence: 'high',

    shell: {

      construction: {

        shellThicknessMm: 25,

        thicknessClass: 'very thick',

        plyCount: 20,

        layupDescription: '20-ply Maple/Birch shell'

      },

      bearingEdges: {

        batterSideProfile: '45-degree bearing edge',

        snareSideProfile: '45-degree bearing edge',

        roundover: 'minimal / modern precision edge',

        evidenceLevel: 'sourceConfirmed',

        confidence: 'high',

        notes: 'Pearl Reference One Maple/Birch 20-ply shell spec; 45-degree bearing edge listed in existing report.'

      }

    }

  },

  'pearl_masters-custom_masters-custom-maple-snare_14x5-5_ply_maple_die-cast-mastercast_a8374171': {

    shellThicknessMm: 5,

    shellThickness: '5mm',

    bearingEdge: '45-degree inner / 45-degree outer, slightly inset with rounded apex',

    sourceConfidence: 'high',

    shell: {

      construction: {

        shellThicknessMm: 5,

        thicknessClass: 'thin',

        plyCount: 4,

        layupDescription: '4-ply maple shell with maple reinforcement rings',

        reinforcementRings: '4-ply maple reinforcement rings'

      },

      bearingEdges: {

        batterSideProfile: '45-degree inner / 45-degree outer',

        snareSideProfile: '45-degree inner / 45-degree outer',

        roundover: 'slightly rounded apex',

        evidenceLevel: 'sourceConfirmed',

        confidence: 'high',

        notes: 'Pearl Masters Custom catalog family: 5mm 4-ply maple shell; 45-degree in/out edge, slightly inset with rounded apex.'

      }

    }

  },

  'pearl_masters-custom_masters-custom-maple-snare_14x6-5_ply_maple_die-cast-mastercast_639005e7': {

    shellThicknessMm: 5,

    shellThickness: '5mm',

    bearingEdge: '45-degree inner / 45-degree outer, slightly inset with rounded apex',

    sourceConfidence: 'high',

    shell: {

      construction: {

        shellThicknessMm: 5,

        thicknessClass: 'thin',

        plyCount: 4,

        layupDescription: '4-ply maple shell with maple reinforcement rings',

        reinforcementRings: '4-ply maple reinforcement rings'

      },

      bearingEdges: {

        batterSideProfile: '45-degree inner / 45-degree outer',

        snareSideProfile: '45-degree inner / 45-degree outer',

        roundover: 'slightly rounded apex',

        evidenceLevel: 'sourceConfirmed',

        confidence: 'high',

        notes: 'Pearl Masters Custom catalog family: 5mm 4-ply maple shell; 45-degree in/out edge, slightly inset with rounded apex.'

      }

    }

  },

  'pearl_stave-craft_stave-craft-ash_14x6-5_stave_ash_6c64a560': {

    shellThicknessMm: 25,

    shellThickness: '25mm',

    bearingEdge: '45-degree bearing edge',

    sourceConfidence: 'high',

    shell: {

      construction: {

        shellThicknessMm: 25,

        thicknessClass: 'very thick',

        shellConstruction: 'Stave',

        layupDescription: '25mm stave shell'

      },

      bearingEdges: {

        batterSideProfile: '45-degree bearing edge',

        snareSideProfile: '45-degree bearing edge',

        roundover: 'minimal / modern precision edge',

        evidenceLevel: 'sourceConfirmed',

        confidence: 'high',

        notes: 'Pearl Stave Craft family: 25mm stave shell with 45-degree bearing edges.'

      }

    }

  },

  'pearl_stave-craft_stave-craft-maple_14x6-5_stave_maple_2c452b4e': {

    shellThicknessMm: 25,

    shellThickness: '25mm',

    bearingEdge: '45-degree bearing edge',

    sourceConfidence: 'high',

    shell: {

      construction: {

        shellThicknessMm: 25,

        thicknessClass: 'very thick',

        shellConstruction: 'Stave',

        layupDescription: '25mm stave shell'

      },

      bearingEdges: {

        batterSideProfile: '45-degree bearing edge',

        snareSideProfile: '45-degree bearing edge',

        roundover: 'minimal / modern precision edge',

        evidenceLevel: 'sourceConfirmed',

        confidence: 'high',

        notes: 'Pearl Stave Craft family: 25mm stave shell with 45-degree bearing edges.'

      }

    }

  },

  'pearl_stave-craft_stave-craft-walnut_14x6-5_stave_walnut_c1b8c1fd': {

    shellThicknessMm: 25,

    shellThickness: '25mm',

    bearingEdge: '45-degree bearing edge',

    sourceConfidence: 'high',

    shell: {

      construction: {

        shellThicknessMm: 25,

        thicknessClass: 'very thick',

        shellConstruction: 'Stave',

        layupDescription: '25mm stave shell'

      },

      bearingEdges: {

        batterSideProfile: '45-degree bearing edge',

        snareSideProfile: '45-degree bearing edge',

        roundover: 'minimal / modern precision edge',

        evidenceLevel: 'sourceConfirmed',

        confidence: 'high',

        notes: 'Pearl Stave Craft family: 25mm stave shell with 45-degree bearing edges.'

      }

    }

  }

};

function deepMerge(target, patch) {

  for (const [key, value] of Object.entries(patch)) {

    if (

      value &&

      typeof value === 'object' &&

      !Array.isArray(value) &&

      target[key] &&

      typeof target[key] === 'object' &&

      !Array.isArray(target[key])

    ) {

      deepMerge(target[key], value);

    } else {

      target[key] = value;

    }

  }

  return target;

}

let patched = 0;

let missing = 0;

for (const [id, patch] of Object.entries(patches)) {

  const record = records.find(item => item.id === id || item.patchName === id);

  if (!record) {

    console.warn(`MISSING: ${id}`);

    missing += 1;

    continue;

  }

  deepMerge(record, {

    ...patch,

    legacyPrintEnginePromotable: true,

    legacyPrintEngineReadinessTier: 'PROMOTE_NOW_FULL_REFERENCE_READY',

    legacyPrintEnginePromotionStatus: 'promoted',

    legacyPrintEnginePromotionRule: 'pearlRound2SourceBackedShellFields',

    legacyPrintLastResearchSession: 'pearl-wood-shell-research-round-2',

    legacyPrintLastResearchUpdatedAt: now

  });

  patched += 1;

}

fs.writeFileSync(file, JSON.stringify(records, null, 2) + '\n');

console.log(JSON.stringify({

  status: 'PEARL_ROUND_2_GENERATED_REFERENCES_PATCHED',

  file,

  patched,

  missing

}, null, 2));

