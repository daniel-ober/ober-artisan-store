const NODES = [

  'attack',

  'brightness',

  'projection',

  'sustain',

  'warmth',

  'sensitivity',

  'control',

];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const normalizeConstructionType = (value = '') =>

  String(value)

    .toLowerCase()

    .trim()

    .replace(/[_\s]+/g, '-');

const CONSTRUCTION_DELTAS = {

  stave: {

    attack: 0.18,

    brightness: 0.06,

    projection: 0.28,

    sustain: 0.12,

    warmth: 0.06,

    sensitivity: 0.26,

    control: -0.16,

  },

  ply: {

    attack: -0.04,

    brightness: -0.02,

    projection: -0.08,

    sustain: -0.08,

    warmth: 0.02,

    sensitivity: -0.08,

    control: 0.26,

  },

  'segmented-block': {

    attack: 0.16,

    brightness: 0.02,

    projection: 0.12,

    sustain: -0.06,

    warmth: -0.02,

    sensitivity: 0.04,

    control: 0.22,

  },

  segmented: {

    attack: 0.16,

    brightness: 0.02,

    projection: 0.12,

    sustain: -0.06,

    warmth: -0.02,

    sensitivity: 0.04,

    control: 0.22,

  },

  block: {

    attack: 0.16,

    brightness: 0.02,

    projection: 0.12,

    sustain: -0.06,

    warmth: -0.02,

    sensitivity: 0.04,

    control: 0.22,

  },

  'steam-bent': {

    attack: 0.04,

    brightness: -0.02,

    projection: 0.08,

    sustain: 0.24,

    warmth: 0.22,

    sensitivity: 0.10,

    control: -0.08,

  },

  solid: {

    attack: 0.04,

    brightness: -0.02,

    projection: 0.08,

    sustain: 0.24,

    warmth: 0.22,

    sensitivity: 0.10,

    control: -0.08,

  },

  acrylic: {

    attack: 0.02,

    brightness: 0.02,

    projection: 0.04,

    sustain: 0.04,

    warmth: -0.02,

    sensitivity: 0,

    control: -0.02,

  },

  'seamless-metal': {

    attack: 0.04,

    brightness: 0.04,

    projection: 0.06,

    sustain: 0.04,

    warmth: -0.02,

    sensitivity: 0.02,

    control: 0,

  },

  'spun-metal': {

    attack: 0.04,

    brightness: 0.04,

    projection: 0.06,

    sustain: 0.04,

    warmth: -0.02,

    sensitivity: 0.02,

    control: 0,

  },

  welded: {

    attack: 0,

    brightness: 0,

    projection: 0,

    sustain: 0,

    warmth: 0,

    sensitivity: 0,

    control: 0,

  },

};

const ALIASES = {

  'stave-shell': 'stave',

  'ply-shell': 'ply',

  'plywood': 'ply',

  'steam-bent-solid': 'steam-bent',

  'solid-shell': 'solid',

  'single-ply': 'steam-bent',

  'segmented-shell': 'segmented',

  'block-shell': 'block',

  'segmented/block': 'segmented-block',

  'seamless': 'seamless-metal',

  'spun': 'spun-metal',

};

export const resolveConstructionTypeKey = (constructionType) => {

  const normalized = normalizeConstructionType(constructionType);

  return ALIASES[normalized] || normalized;

};

const getDeltaSet = (constructionType) => {

  const key = resolveConstructionTypeKey(constructionType);

  return CONSTRUCTION_DELTAS[key] || null;

};

const getAverageAbsoluteDelta = (deltas) => {

  const total = NODES.reduce((sum, node) => sum + Math.abs(deltas[node] || 0), 0);

  return total / NODES.length;

};

export const applyConstructionModifierLayer = ({

  baseNodes,

  constructionType,

  constructionStrength = 1,

  constructionInfluenceCap = 0.18,

  maxPerNodeMovement = 0.42,

  hybridExteriorConstructionType,

  hybridExteriorShare = 0,

} = {}) => {

  if (!baseNodes || typeof baseNodes !== 'object') {

    return {

      nodes: baseNodes || {},

      constructionMeta: {

        applied: false,

        reason: 'missing-base-nodes',

      },

    };

  }

  const primaryDeltas = getDeltaSet(constructionType);

  if (!primaryDeltas) {

    return {

      nodes: { ...baseNodes },

      constructionMeta: {

        applied: false,

        reason: 'unknown-construction-type',

        constructionType,

      },

    };

  }

  const safeStrength = clamp(Number(constructionStrength) || 1, 0, 1);

  const safeInfluenceCap = clamp(Number(constructionInfluenceCap) || 0.18, 0, 0.2);

  const safeMaxPerNodeMovement = clamp(Number(maxPerNodeMovement) || 0.42, 0, 0.5);

  const exteriorDeltas = getDeltaSet(hybridExteriorConstructionType);

  const safeExteriorShare = clamp(Number(hybridExteriorShare) || 0, 0, 0.25);

  const rawCombinedDeltas = {};

  NODES.forEach((node) => {

    const primaryDelta = primaryDeltas[node] || 0;

    const exteriorDelta = exteriorDeltas ? (exteriorDeltas[node] || 0) * safeExteriorShare : 0;

    rawCombinedDeltas[node] = (primaryDelta + exteriorDelta) * safeStrength;

  });

  const avgAbsDelta = getAverageAbsoluteDelta(rawCombinedDeltas);

  const maxAverageMovement = safeInfluenceCap * 2.6;

  const scale =

    avgAbsDelta > maxAverageMovement && avgAbsDelta > 0

      ? maxAverageMovement / avgAbsDelta

      : 1;

  const appliedDeltas = {};

  const nodes = { ...baseNodes };

  NODES.forEach((node) => {

    const delta = clamp(

      rawCombinedDeltas[node] * scale,

      -safeMaxPerNodeMovement,

      safeMaxPerNodeMovement

    );

    appliedDeltas[node] = Number(delta.toFixed(3));

    if (typeof baseNodes[node] === 'number') {

      nodes[node] = Number(clamp(baseNodes[node] + delta, 0, 10).toFixed(2));

    }

  });

  return {

    nodes,

    constructionMeta: {

      applied: true,

      constructionType,

      resolvedConstructionType: resolveConstructionTypeKey(constructionType),

      constructionStrength: safeStrength,

      constructionInfluenceCap: safeInfluenceCap,

      maxPerNodeMovement: safeMaxPerNodeMovement,

      hybridExteriorConstructionType: hybridExteriorConstructionType || null,

      hybridExteriorShare: safeExteriorShare,

      appliedDeltas,

      averageAbsoluteConstructionMovement: Number(

        getAverageAbsoluteDelta(appliedDeltas).toFixed(3)

      ),

      note:

        'Construction applied as capped secondary layer only. Material, grain, thickness, rings, edges, beds, hoops, heads, and wires remain separate modifiers.',

    },

  };

};

export default applyConstructionModifierLayer;