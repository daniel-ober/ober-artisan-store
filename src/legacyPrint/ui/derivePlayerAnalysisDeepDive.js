
const NODE_KEYS = ['attack', 'brightness', 'projection', 'sustain', 'warmth', 'sensitivity', 'control'];

const NODE_LABELS = {

  attack: 'Attack',

  brightness: 'Brightness',

  projection: 'Projection',

  sustain: 'Sustain',

  warmth: 'Warmth',

  sensitivity: 'Sensitivity',

  control: 'Control',

};

function clamp(value, min = 0, max = 100) {

  const n = Number(value);

  if (!Number.isFinite(n)) return min;

  return Math.max(min, Math.min(max, n));

}

function normalizeNodeKey(node) {

  if (!node) return '';

  if (typeof node === 'string') return node;

  return node.key || node.label?.toLowerCase?.() || '';

}

function getNodeValue(read, key) {

  const direct =

    read?.nodes?.[key] ??

    read?.voice?.[key] ??

    read?.scores?.[key] ??

    read?.values?.[key] ??

    read?.nodeValues?.[key];

  if (Number.isFinite(Number(direct))) {

    const n = Number(direct);

    return n <= 1 ? n * 100 : n * 10;

  }

  const dominantNodes = Array.isArray(read?.dominantNodes) ? read.dominantNodes : [];

  const index = dominantNodes.findIndex((node) => normalizeNodeKey(node) === key);

  if (index === 0) return 78;

  if (index === 1) return 70;

  if (index === 2) return 63;

  return 50;

}

function getTopKeys(read) {

  const dominantNodes = Array.isArray(read?.dominantNodes) ? read.dominantNodes : [];

  const fromDominant = dominantNodes.map(normalizeNodeKey).filter(Boolean);

  if (fromDominant.length) return fromDominant.slice(0, 4);

  return NODE_KEYS

    .map((key) => ({ key, value: getNodeValue(read, key) }))

    .sort((a, b) => b.value - a.value)

    .map((item) => item.key)

    .slice(0, 4);

}

function getConfig(read) {

  return read?.config || read?.referenceConfig || read?.referenceIdentity || {};

}

function getModifiers(read) {

  return read?.modifiers || read?.referenceModifiers || {};

}

function includesText(value, needle) {

  return String(value || '').toLowerCase().includes(needle);

}

function getDepth(config) {

  const raw = config.depth || config.size || config.dimensions || '';

  const match = String(raw).match(/(?:x|×)\s*(\d+(?:\.\d+)?)/i) || String(raw).match(/(\d+(?:\.\d+)?)\s*"?\s*deep/i);

  return match ? Number(match[1]) : Number(config.depthInches || config.shellDepth || 6.5);

}

function getDiameter(config) {

  const raw = config.diameter || config.size || config.dimensions || '';

  const match = String(raw).match(/(\d+(?:\.\d+)?)\s*(?:x|×)/i);

  return match ? Number(match[1]) : Number(config.diameterInches || config.shellDiameter || 14);

}

function deriveFeelResponse(read) {

  const attack = getNodeValue(read, 'attack');

  const brightness = getNodeValue(read, 'brightness');

  const projection = getNodeValue(read, 'projection');

  const sustain = getNodeValue(read, 'sustain');

  const warmth = getNodeValue(read, 'warmth');

  const sensitivity = getNodeValue(read, 'sensitivity');

  const control = getNodeValue(read, 'control');

  return {

    immediacy: clamp((attack * 0.56) + (brightness * 0.24) + (sensitivity * 0.2)),

    openness: clamp((sustain * 0.58) + (warmth * 0.22) + ((100 - control) * 0.2)),

    warmthLean: clamp((warmth * 0.68) + (sustain * 0.16) + ((100 - brightness) * 0.16)),

    forwardness: clamp((projection * 0.56) + (attack * 0.27) + (brightness * 0.17)),

    brightness: clamp((brightness * 0.72) + (attack * 0.14) + ((100 - warmth) * 0.14)),

    responsiveness: clamp((sensitivity * 0.58) + (attack * 0.24) + (control * 0.18)),

    composure: clamp((control * 0.64) + (attack * 0.18) + ((100 - sustain) * 0.18)),

  };

}

function deriveLegacyTuning(read) {

  const config = getConfig(read);

  const modifiers = getModifiers(read);

  const depth = getDepth(config);

  const diameter = getDiameter(config);

  const warmth = getNodeValue(read, 'warmth');

  const sustain = getNodeValue(read, 'sustain');

  const attack = getNodeValue(read, 'attack');

  const brightness = getNodeValue(read, 'brightness');

  const control = getNodeValue(read, 'control');

  const sensitivity = getNodeValue(read, 'sensitivity');

  const material = `${config.material || config.shellMaterial || ''}`;

  const construction = `${config.construction || config.shellConstruction || ''}`;

  const hoopType = `${modifiers.hoopType || modifiers.hoops || config.hoops || ''}`;

  const dampening = `${modifiers.dampening || modifiers.damping || ''}`;

  const batterHead = `${modifiers.batterHead || ''}`;

  let centerHz = 220;

  centerHz += (diameter - 14) * -10;

  centerHz += (depth - 6.5) * -7;

  centerHz += (attack - 55) * 0.45;

  centerHz += (brightness - 55) * 0.35;

  centerHz += (warmth - 55) * -0.42;

  centerHz += (sustain - 55) * -0.18;

  centerHz += (control - 55) * 0.22;

  if (includesText(material, 'brass')) centerHz -= 4;

  if (includesText(material, 'copper')) centerHz -= 8;

  if (includesText(material, 'aluminum')) centerHz += 5;

  if (includesText(material, 'steel')) centerHz += 7;

  if (includesText(material, 'maple')) centerHz -= 2;

  if (includesText(material, 'oak')) centerHz += 2;

  if (includesText(construction, 'stave')) centerHz += 3;

  if (includesText(construction, 'steam') || includesText(construction, 'solid')) centerHz -= 4;

  if (includesText(hoopType, 'die')) centerHz += 6;

  if (includesText(hoopType, 'wood')) centerHz -= 8;

  if (includesText(hoopType, 'triple')) centerHz -= 2;

  if (includesText(dampening, 'gel') || includesText(dampening, 'wallet') || includesText(dampening, 'ring')) centerHz += 3;

  if (includesText(batterHead, '2ply') || includesText(batterHead, 'controlled')) centerHz -= 4;

  centerHz = Math.round(clamp(centerHz, 150, 330));

  const flexibility =

    42 +

    (sensitivity - 50) * 0.22 +

    (sustain - 50) * 0.2 +

    (control - 50) * 0.16 -

    Math.abs(depth - 6.5) * 2;

  const halfWidth = Math.round(clamp(flexibility, 28, 62));

  const lowHz = Math.max(120, centerHz - halfWidth);

  const highHz = centerHz + halfWidth;

  const lowBias = warmth + sustain - brightness;

  const highBias = attack + brightness + control - warmth;

  let naturalHome = 'Medium / Balanced';

  if (lowBias > highBias + 24) naturalHome = 'Low-to-medium';

  if (highBias > lowBias + 24) naturalHome = 'Medium-to-high';

  if (warmth > 68 && sustain > 60) naturalHome = 'Low-to-medium';

  if (attack > 70 && brightness > 66 && control > 64) naturalHome = 'Medium-to-high';

  let usableRange = 'Moderate';

  if (halfWidth >= 54) usableRange = 'Wide';

  if (halfWidth >= 60) usableRange = 'Very wide';

  if (halfWidth <= 34) usableRange = 'Focused';

  let chokeRisk = 'Low-to-moderate';

  if (control > 72 && sustain < 48) chokeRisk = 'Moderate at higher tunings';

  if (sustain > 62 && sensitivity > 62) chokeRisk = 'Low';

  if (attack > 76 && brightness > 72 && sustain < 44) chokeRisk = 'Moderate';

  return {

    currentRangeHz: [lowHz, highHz],

    nearestNoteWindow: estimateNoteWindow(lowHz, highHz),

    naturalHome,

    usableRange,

    sweetSpot: naturalHome === 'Low-to-medium' ? 'Lower side of medium' : naturalHome === 'Medium-to-high' ? 'Upper side of medium' : 'Center of medium',

    chokeRisk,

    lowBehavior:

      naturalHome === 'Low-to-medium'

        ? 'Fuller, wider, and more comfortable in a lower lane without immediately flattening out.'

        : 'Usable for body and softer response, though not the strongest natural voice of this setup.',

    mediumBehavior:

      'The most balanced zone for comparing attack, body, response, projection, and control.',

    highBehavior:

      naturalHome === 'Medium-to-high'

        ? 'Tighter, quicker, and more articulate with strong front-edge definition.'

        : 'Clearer and more focused, but likely gives up some of the drum’s natural body.',

  };

}

function estimateNoteWindow(lowHz, highHz) {

  const notes = [

    ['D3', 146.83],

    ['D#3', 155.56],

    ['E3', 164.81],

    ['F3', 174.61],

    ['F#3', 185.0],

    ['G3', 196.0],

    ['G#3', 207.65],

    ['A3', 220.0],

    ['A#3', 233.08],

    ['B3', 246.94],

    ['C4', 261.63],

    ['C#4', 277.18],

    ['D4', 293.66],

    ['D#4', 311.13],

    ['E4', 329.63],

  ];

  const nearestLow = notes.reduce((best, note) =>

    Math.abs(note[1] - lowHz) < Math.abs(best[1] - lowHz) ? note : best

  );

  const nearestHigh = notes.reduce((best, note) =>

    Math.abs(note[1] - highHz) < Math.abs(best[1] - highHz) ? note : best

  );

  return `${nearestLow[0]}–${nearestHigh[0]}`;

}

function deriveNodeRelationships(read) {

  const topKeys = getTopKeys(read);

  const pairs = [];

  const has = (a, b) => topKeys.includes(a) && topKeys.includes(b);

  if (has('attack', 'brightness')) {

    pairs.push({

      label: 'Snap with clarity',

      nodes: ['Attack', 'Brightness'],

      summary: 'Fast front-edge response with enough upper detail to read clearly in a mix.',

    });

  }

  if (has('attack', 'control')) {

    pairs.push({

      label: 'Focused crack',

      nodes: ['Attack', 'Control'],

      summary: 'A defined hit shape that stays contained instead of spreading too wide.',

    });

  }

  if (has('warmth', 'sustain')) {

    pairs.push({

      label: 'Body with bloom',

      nodes: ['Warmth', 'Sustain'],

      summary: 'Rounder shell body with a note that keeps breathing after the initial strike.',

    });

  }

  if (has('sensitivity', 'control')) {

    pairs.push({

      label: 'Responsive precision',

      nodes: ['Sensitivity', 'Control'],

      summary: 'Ghost-note detail and light touch remain readable without the voice getting messy.',

    });

  }

  if (has('projection', 'control')) {

    pairs.push({

      label: 'Power with focus',

      nodes: ['Projection', 'Control'],

      summary: 'The drum carries forward while keeping the note shape easy to place.',

    });

  }

  if (has('warmth', 'control')) {

    pairs.push({

      label: 'Warmth without mud',

      nodes: ['Warmth', 'Control'],

      summary: 'Low-mid body is present, but the drum keeps enough focus to stay usable.',

    });

  }

  if (pairs.length) return pairs.slice(0, 5);

  return topKeys.slice(0, 3).map((key, index) => ({

    label: `${NODE_LABELS[key] || key} driver`,

    nodes: [NODE_LABELS[key] || key],

    summary:

      index === 0

        ? 'This is the strongest player-facing trait in the current configuration.'

        : 'This secondary trait helps shape how the drum responds under the stick.',

  }));

}

function deriveSetupImpact(read) {

  const config = getConfig(read);

  const modifiers = getModifiers(read);

  const rows = [];

  const construction = config.construction || config.shellConstruction;

  const material = config.material || config.shellMaterial;

  const hoopType = modifiers.hoopType || modifiers.hoops || config.hoops;

  const batterHead = modifiers.batterHead;

  const resoHead = modifiers.resoHead;

  const snareWires = modifiers.snareWires;

  const dampening = modifiers.dampening || modifiers.damping;

  if (construction || material) {

    rows.push({

      label: 'Core shell voice',

      value: [material, construction].filter(Boolean).join(' · ') || 'Physical shell data is shaping the base response.',

    });

  }

  if (hoopType) {

    rows.push({

      label: 'Hoop behavior',

      value: describeHoops(hoopType),

    });

  }

  if (batterHead || resoHead) {

    rows.push({

      label: 'Head setup',

      value: [describeBatterHead(batterHead), describeResoHead(resoHead)].filter(Boolean).join(' '),

    });

  }

  if (snareWires) {

    rows.push({

      label: 'Wire response',

      value: describeWires(snareWires),

    });

  }

  if (dampening && !includesText(dampening, 'none')) {

    rows.push({

      label: 'Damping behavior',

      value: 'Damping increases control and shortens bloom, shifting the read toward a more contained response.',

    });

  }

  if (!rows.length) {

    rows.push({

      label: 'Reference setup',

      value: 'Using available physical build data and default setup assumptions until stock setup details are verified.',

    });

  }

  return rows;

}

function describeHoops(value) {

  if (includesText(value, 'die')) return 'Die-cast hoops increase focus, control, and attack definition while reducing some open spread.';

  if (includesText(value, 'wood')) return 'Wood hoops soften the front edge, add body, and shift the feel toward a warmer response.';

  if (includesText(value, 'triple')) return 'Triple-flanged hoops leave more openness and ring while keeping the drum familiar and flexible.';

  return 'Hoop choice is contributing to the balance of attack, openness, sustain, and control.';

}

function describeBatterHead(value) {

  if (!value) return '';

  if (includesText(value, '2ply') || includesText(value, 'controlled')) return 'The batter head adds control and weight while reducing some open sustain.';

  if (includesText(value, 'coated')) return 'The coated batter supports a balanced stick feel with familiar warmth and articulation.';

  if (includesText(value, 'clear')) return 'The clear batter leans brighter and more open.';

  return 'The batter head is shaping attack, warmth, and openness.';

}

function describeResoHead(value) {

  if (!value) return '';

  return 'The resonant head affects snare response, sensitivity, and how quickly the bottom side speaks.';

}

function describeWires(value) {

  if (includesText(value, '42') || includesText(value, 'wide')) return 'Wider wire coverage adds snare presence and sensitivity but can reduce shell purity.';

  if (includesText(value, '16') || includesText(value, 'narrow')) return 'Narrower wire coverage leaves more shell tone and a cleaner center note.';

  return 'Wire choice affects snap, sensitivity, snare spread, and how much shell tone remains forward.';

}

export function derivePlayerAnalysisDeepDive(read = {}) {

  return {

    feelResponse: deriveFeelResponse(read),

    legacyTuning: deriveLegacyTuning(read),

    nodeRelationships: deriveNodeRelationships(read),

    setupImpact: deriveSetupImpact(read),

  };

}

export default derivePlayerAnalysisDeepDive;

