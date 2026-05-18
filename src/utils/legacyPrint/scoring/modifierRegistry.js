export const MODIFIER_REGISTRY = {

  batterHeads: [

    {

      id: 'head_batter_clear_single_ply_medium',

      type: 'head',

      category: 'batterHead',

      label: 'Clear single-ply batter head',

      aliases: [

        'clear',

        'clear single ply',

        'single ply clear',

        'remo ambassador clear',

        'evans g1 clear',

      ],

      nodeDeltas: {

        attack: 0.15,

        brightness: 0.25,

        projection: 0.05,

        sustain: 0.25,

        warmth: -0.15,

        sensitivity: 0.2,

        control: -0.2,

      },

      confidence: {

        matchConfidence: 'medium',

        deltaConfidence: 'medium',

        physicalConfidence: 'medium',

      },

    },

    {

  id: 'head_batter_clear_two_ply_open',

  type: 'head',

  category: 'batterHead',

  label: 'Clear two-ply open batter head',

  aliases: ['clear two ply', 'two ply clear', 'emperor clear', 'g2 clear'],

  nodeDeltas: {

    attack: 0.2,

    brightness: 0.05,

    projection: 0.15,

    sustain: -0.15,

    warmth: 0.05,

    sensitivity: -0.15,

    control: 0.2,

  },

  confidence: { matchConfidence: 'medium', deltaConfidence: 'medium', physicalConfidence: 'medium' },

},

{

  id: 'head_batter_center_dot_controlled',

  type: 'head',

  category: 'batterHead',

  label: 'Center-dot controlled batter head',

  aliases: ['dot', 'center dot', 'black dot', 'controlled sound', 'cs coated', 'cs clear'],

  nodeDeltas: {

    attack: 0.25,

    brightness: 0,

    projection: 0.1,

    sustain: -0.25,

    warmth: 0,

    sensitivity: -0.1,

    control: 0.35,

  },

  confidence: { matchConfidence: 'medium', deltaConfidence: 'medium', physicalConfidence: 'medium' },

},

{

  id: 'head_batter_hydraulic_dead_control',

  type: 'head',

  category: 'batterHead',

  label: 'Hydraulic/dead-control batter head',

  aliases: ['hydraulic', 'evans hydraulic', 'dead control', 'oil filled'],

  nodeDeltas: {

    attack: 0.1,

    brightness: -0.35,

    projection: -0.1,

    sustain: -0.6,

    warmth: 0.25,

    sensitivity: -0.35,

    control: 0.55,

  },

  confidence: { matchConfidence: 'medium', deltaConfidence: 'medium', physicalConfidence: 'medium' },

},

{

  id: 'head_batter_dry_vented_controlled',

  type: 'head',

  category: 'batterHead',

  label: 'Dry/vented controlled batter head',

  aliases: ['dry', 'vented', 'hd dry', 'genera dry', 'powerstroke dry'],

  nodeDeltas: {

    attack: 0.2,

    brightness: -0.1,

    projection: 0,

    sustain: -0.45,

    warmth: 0.05,

    sensitivity: -0.2,

    control: 0.5,

  },

  confidence: { matchConfidence: 'medium', deltaConfidence: 'medium', physicalConfidence: 'medium' },

},

    {

      id: 'head_batter_coated_single_ply_medium',

      type: 'head',

      category: 'batterHead',

      label: 'Coated single-ply batter head',

      aliases: [

        'coated',

        'coated single ply',

        'single ply coated',

        'remo ambassador coated',

        'evans g1 coated',

      ],

      nodeDeltas: {

        attack: 0.1,

        brightness: -0.15,

        projection: 0,

        sustain: 0.15,

        warmth: 0.25,

        sensitivity: 0.2,

        control: -0.05,

      },

      confidence: {

        matchConfidence: 'medium',

        deltaConfidence: 'medium',

        physicalConfidence: 'medium',

      },

    },

    {

      id: 'head_batter_coated_two_ply_controlled',

      type: 'head',

      category: 'batterHead',

      label: 'Coated two-ply controlled batter head',

      aliases: [

        'controlled',

        'controlled sound',

        'coated controlled',

        'coated two ply',

        'two ply coated',

        'remo controlled sound',

        'remo emperor coated',

        'evans g2 coated',

      ],

      nodeDeltas: {

        attack: 0.2,

        brightness: -0.2,

        projection: 0.1,

        sustain: -0.35,

        warmth: 0.25,

        sensitivity: -0.2,

        control: 0.35,

      },

      confidence: {

        matchConfidence: 'medium',

        deltaConfidence: 'medium',

        physicalConfidence: 'medium',

      },

    },

  ],

  resoHeads: [

    {

      id: 'head_reso_clear_snare_side_standard',

      type: 'head',

      category: 'resoHead',

      label: 'Standard clear snare-side head',

      aliases: [

        'clear snare side',

        'snare side',

        'standard snare side',

        'ambassador snare side',

        'remo ambassador snare side',

        'evans hazy 300',

        'hazy 300',

      ],

      nodeDeltas: {

        attack: 0.05,

        brightness: 0.15,

        projection: 0,

        sustain: 0.1,

        warmth: -0.05,

        sensitivity: 0.25,

        control: 0,

      },

      confidence: {

        matchConfidence: 'medium',

        deltaConfidence: 'medium',

        physicalConfidence: 'medium',

      },

    },

    {

  id: 'head_reso_heavy_snare_side_controlled',

  type: 'head',

  category: 'resoHead',

  label: 'Heavy controlled snare-side head',

  aliases: ['heavy snare side', 'hazy 500', 'evans hazy 500', 'emperor snare side'],

  nodeDeltas: {

    attack: 0,

    brightness: 0.05,

    projection: 0.05,

    sustain: -0.1,

    warmth: 0,

    sensitivity: -0.25,

    control: 0.25,

  },

  confidence: { matchConfidence: 'medium', deltaConfidence: 'medium', physicalConfidence: 'medium' },

},

    {

      id: 'head_reso_thin_snare_side_sensitive',

      type: 'head',

      category: 'resoHead',

      label: 'Thin sensitive snare-side head',

      aliases: [

        'thin snare side',

        'thin clear snare side',

        'remo diplomat snare side',

        'evans hazy 200',

        'hazy 200',

      ],

      nodeDeltas: {

        attack: 0.1,

        brightness: 0.2,

        projection: -0.05,

        sustain: 0.15,

        warmth: -0.1,

        sensitivity: 0.4,

        control: -0.15,

      },

      confidence: {

        matchConfidence: 'medium',

        deltaConfidence: 'medium',

        physicalConfidence: 'medium',

      },

    },

  ],

  snareWires: [

    {

      id: 'wires_20_strand_standard_steel',

      type: 'snareWire',

      category: 'snareWires',

      label: '20-strand standard steel snare wires',

      aliases: [

        '20',

        '20 strand',

        '20-strand',

        '20 strand steel',

        'standard wires',

        'steel 20',

      ],

      nodeDeltas: {

        attack: 0.1,

        brightness: 0.1,

        projection: 0,

        sustain: -0.05,

        warmth: -0.05,

        sensitivity: 0.15,

        control: 0.05,

      },

      confidence: {

        matchConfidence: 'medium',

        deltaConfidence: 'medium',

        physicalConfidence: 'medium',

      },

    },

    {

  id: 'wires_30_plus_wide_high_contact',

  type: 'snareWire',

  category: 'snareWires',

  label: '30+ strand wide high-contact snare wires',

  aliases: ['30', '30 strand', '30-strand', '42', '42 strand', '42-strand', 'wide wires'],

  nodeDeltas: {

    attack: 0.15,

    brightness: 0.2,

    projection: 0.05,

    sustain: -0.3,

    warmth: -0.15,

    sensitivity: 0.25,

    control: 0.25,

  },

  confidence: { matchConfidence: 'medium', deltaConfidence: 'medium', physicalConfidence: 'medium' },

},

{

  id: 'wires_brass_dark_response',

  type: 'snareWire',

  category: 'snareWires',

  label: 'Brass/darker-response snare wires',

  aliases: ['brass wires', 'brass snare wires', 'dark wires', 'warmer wires'],

  nodeDeltas: {

    attack: -0.05,

    brightness: -0.15,

    projection: 0,

    sustain: 0,

    warmth: 0.15,

    sensitivity: 0.1,

    control: 0.05,

  },

  confidence: { matchConfidence: 'medium', deltaConfidence: 'medium', physicalConfidence: 'medium' },

},

    {

      id: 'wires_24_strand_wide_response',

      type: 'snareWire',

      category: 'snareWires',

      label: '24-strand wider-response snare wires',

      aliases: [

        '24',

        '24 strand',

        '24-strand',

        '24 strand steel',

        'wide response',

      ],

      nodeDeltas: {

        attack: 0.15,

        brightness: 0.15,

        projection: 0.05,

        sustain: -0.15,

        warmth: -0.1,

        sensitivity: 0.2,

        control: 0.15,

      },

      confidence: {

        matchConfidence: 'medium',

        deltaConfidence: 'medium',

        physicalConfidence: 'medium',

      },

    },

    {

      id: 'wires_16_strand_open_response',

      type: 'snareWire',

      category: 'snareWires',

      label: '16-strand open-response snare wires',

      aliases: [

        '16',

        '16 strand',

        '16-strand',

        '16 strand steel',

        'open response',

      ],

      nodeDeltas: {

        attack: -0.05,

        brightness: -0.05,

        projection: -0.05,

        sustain: 0.15,

        warmth: 0.1,

        sensitivity: 0.05,

        control: -0.15,

      },

      confidence: {

        matchConfidence: 'medium',

        deltaConfidence: 'medium',

        physicalConfidence: 'medium',

      },

    },

  ],

  hoops: [

    {

      id: 'hoop_triple_flanged_steel',

      type: 'hoop',

      category: 'hoopType',

      label: 'Triple-flanged steel hoops',

      aliases: [

        'triple flanged',

        'triple-flanged',

        'triple flange',

        'steel triple flange',

      ],

      nodeDeltas: {

        attack: 0,

        brightness: 0.1,

        projection: 0,

        sustain: 0.15,

        warmth: 0,

        sensitivity: 0.1,

        control: -0.15,

      },

      confidence: {

        matchConfidence: 'medium',

        deltaConfidence: 'medium',

        physicalConfidence: 'medium',

      },

    },

    {

      id: 'hoop_die_cast',

      type: 'hoop',

      category: 'hoopType',

      label: 'Die-cast hoops',

      aliases: [

        'die cast',

        'die-cast',

        'diecast',

        'die cast hoops',

        'die-cast hoops',

      ],

      nodeDeltas: {

        attack: 0.25,

        brightness: 0.1,

        projection: 0.2,

        sustain: -0.25,

        warmth: -0.05,

        sensitivity: -0.1,

        control: 0.35,

      },

      confidence: {

        matchConfidence: 'medium',

        deltaConfidence: 'medium',

        physicalConfidence: 'medium',

      },

    },

    {

  id: 'hoop_single_flanged_clip',

  type: 'hoop',

  category: 'hoopType',

  label: 'Single-flanged hoops with clips',

  aliases: ['single flanged', 'single-flanged', 'single flange', 'clip hoops'],

  nodeDeltas: {

    attack: -0.05,

    brightness: -0.05,

    projection: -0.05,

    sustain: 0.25,

    warmth: 0.1,

    sensitivity: 0.15,

    control: -0.2,

  },

  confidence: { matchConfidence: 'medium', deltaConfidence: 'medium', physicalConfidence: 'medium' },

},

{

  id: 'hoop_inward_flange_controlled',

  type: 'hoop',

  category: 'hoopType',

  label: 'Inward-flanged controlled steel hoops',

  aliases: ['s hoop', 's-hoop', 'safe hoop', 'inward flange', 'inward-flanged'],

  nodeDeltas: {

    attack: 0.1,

    brightness: 0.05,

    projection: 0.05,

    sustain: 0,

    warmth: 0,

    sensitivity: 0.05,

    control: 0.15,

  },

  confidence: { matchConfidence: 'medium', deltaConfidence: 'medium', physicalConfidence: 'medium' },

},

    {

      id: 'hoop_wood',

      type: 'hoop',

      category: 'hoopType',

      label: 'Wood hoops',

      aliases: [

        'wood',

        'wood hoop',

        'wood hoops',

        'maple hoop',

        'maple hoops',

      ],

      nodeDeltas: {

        attack: -0.1,

        brightness: -0.25,

        projection: -0.05,

        sustain: 0.05,

        warmth: 0.35,

        sensitivity: 0,

        control: 0.1,

      },

      confidence: {

        matchConfidence: 'medium',

        deltaConfidence: 'medium',

        physicalConfidence: 'medium',

      },

    },

  ],

};

export const UNKNOWN_MODIFIER_FALLBACK = {

  id: 'unknown_modifier',

  nodeDeltas: {

    attack: 0,

    brightness: 0,

    projection: 0,

    sustain: 0,

    warmth: 0,

    sensitivity: 0,

    control: 0,

  },

  confidence: {

    matchConfidence: 'unknown',

    deltaConfidence: 'unknown',

    physicalConfidence: 'unknown',

  },

};