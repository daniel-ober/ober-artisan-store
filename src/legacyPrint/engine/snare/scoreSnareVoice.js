
const {

  SNARE_NODE_KEYS,

  SNARE_BASELINE_PROFILE,

  SNARE_ENGINE_DOCTRINE

} = require('./snareEngineConstants');

const {

  COMPONENT_WEIGHTS,

  SHELL_MATERIAL_EFFECTS,

  SHELL_CONSTRUCTION_EFFECTS,

  SHELL_LAYUP_EFFECTS,

  REINFORCEMENT_RING_EFFECTS,

  PLY_COUNT_EFFECTS,

  FINISH_TREATMENT_EFFECTS,

  BEARING_EDGE_EFFECTS,

  HOOP_EFFECTS,

  BATTER_HEAD_EFFECTS,

  RESO_HEAD_EFFECTS,

  SNARE_WIRE_EFFECTS,

  SNARE_BED_EFFECTS,

  makeProfile

} = require('./snareAcousticPrinciples');

const { adaptSnareReferenceRecord } = require('./snareInputAdapter');

const cloneBaseline = () =>

  Object.fromEntries(SNARE_NODE_KEYS.map(key => [key, SNARE_BASELINE_PROFILE[key]]));

const clampScore = value => Math.max(1, Math.min(10, Number(value.toFixed(2))));

const addEffect = ({ score, effect, weight, source, drivers }) => {

  if (!effect || !weight) return;

  for (const node of SNARE_NODE_KEYS) {

    const delta = Number(((effect[node] || 0) * weight).toFixed(4));

    if (!delta) continue;

    score[node] += delta;

    drivers.push({

      node,

      source,

      delta,

      direction: delta > 0 ? 'up' : 'down'

    });

  }

};

const diameterEffect = diameter => {

  if (!diameter) return makeProfile({});

  if (diameter <= 10) {

    return makeProfile({

      attack: 0.55,

      brightness: 0.48,

      projection: -0.38,

      sustain: -0.22,

      warmth: -0.35,

      sensitivity: 0.58,

      control: 0.38

    });

  }

  if (diameter <= 12) {

    return makeProfile({

      attack: 0.38,

      brightness: 0.32,

      projection: -0.18,

      sustain: -0.08,

      warmth: -0.22,

      sensitivity: 0.42,

      control: 0.25

    });

  }

  if (diameter <= 13) {

    return makeProfile({

      attack: 0.22,

      brightness: 0.18,

      projection: -0.05,

      sustain: 0,

      warmth: -0.08,

      sensitivity: 0.24,

      control: 0.15

    });

  }

  if (diameter === 14) {

    return makeProfile({

      projection: 0.1,

      sustain: 0.12,

      warmth: 0.16

    });

  }

  return makeProfile({

    attack: -0.12,

    brightness: -0.18,

    projection: 0.12,

    sustain: 0.22,

    warmth: 0.34,

    sensitivity: -0.12,

    control: -0.05

  });

};

const depthEffect = depth => {

  if (!depth) return makeProfile({});

  if (depth <= 3.75) {

    return makeProfile({

      attack: 0.45,

      brightness: 0.34,

      projection: -0.28,

      sustain: -0.35,

      warmth: -0.35,

      sensitivity: 0.34,

      control: 0.28

    });

  }

  if (depth <= 4.75) {

    return makeProfile({

      attack: 0.32,

      brightness: 0.22,

      projection: -0.12,

      sustain: -0.18,

      warmth: -0.18,

      sensitivity: 0.25,

      control: 0.2

    });

  }

  if (depth <= 5.75) {

    return makeProfile({

      attack: 0.12,

      brightness: 0.08,

      sustain: 0.08,

      warmth: 0.08,

      sensitivity: 0.1,

      control: 0.05

    });

  }

  if (depth <= 6.75) {

    return makeProfile({

      brightness: -0.02,

      projection: 0.22,

      sustain: 0.34,

      warmth: 0.38,

      sensitivity: -0.05,

      control: -0.02

    });

  }

  if (depth <= 8.25) {

    return makeProfile({

      attack: -0.12,

      brightness: -0.08,

      projection: 0.32,

      sustain: 0.58,

      warmth: 0.68,

      sensitivity: -0.16,

      control: -0.08

    });

  }

  return makeProfile({

    attack: -0.2,

    brightness: -0.12,

    projection: 0.24,

    sustain: 0.65,

    warmth: 0.78,

    sensitivity: -0.22,

    control: -0.12

  });

};

const thicknessEffect = thicknessMm => {

  if (!thicknessMm) return makeProfile({});

  if (thicknessMm < 1.2) {

    return makeProfile({

      attack: 0.05,

      brightness: 0.12,

      projection: -0.18,

      sustain: 0.42,

      warmth: 0.16,

      sensitivity: 0.78,

      control: -0.18

    });

  }

  if (thicknessMm < 2.5) {

    return makeProfile({

      attack: 0.12,

      brightness: 0.16,

      projection: -0.05,

      sustain: 0.34,

      warmth: 0.12,

      sensitivity: 0.62,

      control: -0.05

    });

  }

  if (thicknessMm < 5) {

    return makeProfile({

      attack: 0.28,

      brightness: 0.18,

      projection: 0.14,

      sustain: 0.22,

      warmth: 0.18,

      sensitivity: 0.38,

      control: 0.18

    });

  }

  if (thicknessMm < 8) {

    return makeProfile({

      attack: 0.36,

      brightness: 0.16,

      projection: 0.32,

      sustain: 0.06,

      warmth: 0.24,

      sensitivity: 0.08,

      control: 0.42

    });

  }

  if (thicknessMm < 12) {

    return makeProfile({

      attack: 0.48,

      brightness: 0.12,

      projection: 0.5,

      sustain: -0.12,

      warmth: 0.12,

      sensitivity: -0.18,

      control: 0.7

    });

  }

  return makeProfile({

    attack: 0.62,

    brightness: 0.08,

    projection: 0.62,

    sustain: -0.22,

    warmth: 0.08,

    sensitivity: -0.32,

    control: 0.9

  });

};

const lugCountEffect = lugCount => {

  if (!lugCount) return makeProfile({});

  if (lugCount >= 12) {

    return makeProfile({

      attack: 0.14,

      projection: 0.08,

      sustain: -0.08,

      sensitivity: 0.06,

      control: 0.32

    });

  }

  if (lugCount >= 10) {

    return makeProfile({

      attack: 0.1,

      projection: 0.04,

      sustain: -0.04,

      sensitivity: 0.04,

      control: 0.24

    });

  }

  if (lugCount <= 6) {

    return makeProfile({

      attack: -0.05,

      projection: -0.03,

      sustain: 0.08,

      warmth: 0.03,

      sensitivity: -0.03,

      control: -0.08

    });

  }

  return makeProfile({

    attack: 0.02,

    sustain: 0.02,

    control: 0.02

  });

};

const getConfidence = input => {

  let score = 0;

  const reasons = [];

  if (!input.families.shellMaterial.includes('unknown')) score += 20;

  else reasons.push('missing shell material family');

  if (!input.families.shellConstruction.includes('unknown')) score += 18;

  else reasons.push('missing shell construction family');

  if (input.numeric.diameter) score += 10;

  else reasons.push('missing diameter');

  if (input.numeric.depth) score += 10;

  else reasons.push('missing depth');

  if (input.numeric.shellThicknessMm) score += 16;

  else reasons.push('missing shell thickness');

  if (!input.families.bearingEdge.includes('unknown')) score += 14;

  else reasons.push('missing bearing edge family');

  if (!input.families.hoopType.includes('unknown')) score += 8;

  else reasons.push('missing hoop family');

  if (input.numeric.lugCount) score += 4;

  else reasons.push('missing lug count');

  return {

    score,

    label: score >= 85 ? 'high' : score >= 70 ? 'mediumHigh' : score >= 55 ? 'medium' : 'low',

    reasons

  };

};

const topNodes = profile =>

  Object.entries(profile)

    .sort((a, b) => b[1] - a[1])

    .slice(0, 3)

    .map(([key, value]) => ({ key, value }));

const summarizeDrivers = drivers => {

  const byNode = {};

  const bySource = {};

  for (const driver of drivers) {

    byNode[driver.node] = byNode[driver.node] || [];

    byNode[driver.node].push(driver);

    bySource[driver.source] = bySource[driver.source] || 0;

    bySource[driver.source] += Math.abs(driver.delta);

  }

  for (const node of Object.keys(byNode)) {

    byNode[node].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  }

  return {

    byNode,

    strongestSources: Object.entries(bySource)

      .sort((a, b) => b[1] - a[1])

      .slice(0, 12)

      .map(([source, totalMovement]) => ({

        source,

        totalMovement: Number(totalMovement.toFixed(3))

      }))

  };

};

const scoreSnareVoice = record => {

  const input = adaptSnareReferenceRecord(record);

  const score = cloneBaseline();

  const drivers = [];

  addEffect({

    score,

    effect: SHELL_MATERIAL_EFFECTS[input.families.shellMaterial],

    weight: COMPONENT_WEIGHTS.shellMaterial,

    source: `shellMaterial:${input.families.shellMaterial}`,

    drivers

  });

  addEffect({

    score,

    effect: SHELL_CONSTRUCTION_EFFECTS[input.families.shellConstruction],

    weight: COMPONENT_WEIGHTS.shellConstruction,

    source: `shellConstruction:${input.families.shellConstruction}`,

    drivers

  });

  addEffect({

    score,

    effect: SHELL_LAYUP_EFFECTS[input.families.shellLayup],

    weight: COMPONENT_WEIGHTS.shellLayup,

    source: `shellLayup:${input.families.shellLayup}`,

    drivers

  });

  addEffect({

    score,

    effect: REINFORCEMENT_RING_EFFECTS[input.families.reinforcementRings],

    weight: COMPONENT_WEIGHTS.reinforcementRings,

    source: `reinforcementRings:${input.families.reinforcementRings}`,

    drivers

  });

  addEffect({

    score,

    effect: PLY_COUNT_EFFECTS[input.families.plyCount],

    weight: COMPONENT_WEIGHTS.plyCount,

    source: `plyCount:${input.numeric.plyCount || input.families.plyCount || 'unknown'}`,

    drivers

  });

  addEffect({

    score,

    effect: FINISH_TREATMENT_EFFECTS[input.families.finishTreatment],

    weight: COMPONENT_WEIGHTS.finishTreatment,

    source: `finishTreatment:${input.families.finishTreatment}`,

    drivers

  });

  addEffect({

    score,

    effect: diameterEffect(input.numeric.diameter),

    weight: COMPONENT_WEIGHTS.diameter,

    source: `diameter:${input.numeric.diameter || 'unknown'}`,

    drivers

  });

  addEffect({

    score,

    effect: depthEffect(input.numeric.depth),

    weight: COMPONENT_WEIGHTS.depth,

    source: `depth:${input.numeric.depth || 'unknown'}`,

    drivers

  });

  addEffect({

    score,

    effect: thicknessEffect(input.numeric.shellThicknessMm),

    weight: COMPONENT_WEIGHTS.shellThickness,

    source: `shellThickness:${input.numeric.shellThicknessMm || 'unknown'}mm`,

    drivers

  });

  addEffect({

    score,

    effect: BEARING_EDGE_EFFECTS[input.families.bearingEdge],

    weight: COMPONENT_WEIGHTS.bearingEdge,

    source: `bearingEdge:${input.families.bearingEdge}`,

    drivers

  });

  addEffect({

    score,

    effect: HOOP_EFFECTS[input.families.hoopType],

    weight: COMPONENT_WEIGHTS.hoopType,

    source: `hoopType:${input.families.hoopType}`,

    drivers

  });

  addEffect({

    score,

    effect: lugCountEffect(input.numeric.lugCount),

    weight: COMPONENT_WEIGHTS.lugCount,

    source: `lugCount:${input.numeric.lugCount || 'unknown'}`,

    drivers

  });

  addEffect({

    score,

    effect: SNARE_BED_EFFECTS[input.families.snareBed],

    weight: COMPONENT_WEIGHTS.snareBed,

    source: `snareBed:${input.families.snareBed}`,

    drivers

  });

  addEffect({

    score,

    effect: BATTER_HEAD_EFFECTS[input.families.batterHead],

    weight: COMPONENT_WEIGHTS.batterHead,

    source: `batterHead:${input.families.batterHead}`,

    drivers

  });

  addEffect({

    score,

    effect: RESO_HEAD_EFFECTS[input.families.resoHead],

    weight: COMPONENT_WEIGHTS.resoHead,

    source: `resoHead:${input.families.resoHead}`,

    drivers

  });

  addEffect({

    score,

    effect: SNARE_WIRE_EFFECTS[input.families.snareWires],

    weight: COMPONENT_WEIGHTS.stockSnareWires,

    source: `snareWires:${input.families.snareWires}`,

    drivers

  });

  const voiceProfile = Object.fromEntries(

    SNARE_NODE_KEYS.map(key => [key, clampScore(score[key])])

  );

  return {

    id: input.id,

    company: input.company,

    model: input.model,

    lineSeries: input.lineSeries,

    size: `${input.numeric.diameter || '?'}x${input.numeric.depth || '?'}`,

    raw: input.raw,

    numeric: input.numeric,

    families: input.families,

    fallbackAssumptions: input.fallbackAssumptions || {},

    voiceProfile,

    topNodes: topNodes(voiceProfile),

    confidence: getConfidence(input),

    drivers: summarizeDrivers(drivers),

    doctrine: SNARE_ENGINE_DOCTRINE

  };

};

module.exports = {

  scoreSnareVoice,

  diameterEffect,

  depthEffect,

  thicknessEffect,

  lugCountEffect

};

