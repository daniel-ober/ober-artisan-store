export function compareVoices(voiceA = {}, voiceB = {}) {

  const nodes = [

    'attack',

    'brightness',

    'projection',

    'sustain',

    'warmth',

    'sensitivity',

    'control'

  ];

  const deltas = {};

  let totalDistance = 0;

  for (const node of nodes) {

    const a = voiceA[node] || 0;

    const b = voiceB[node] || 0;

    const diff = b - a;

    const absDiff = Math.abs(diff);

    deltas[node] = {

      a: round(a),

      b: round(b),

      delta: round(diff),

      distance: round(absDiff)

    };

    totalDistance += absDiff;

  }

  const similarityScore = clamp(1 - totalDistance / nodes.length);

  return {

    similarityScore: round(similarityScore),

    totalDistance: round(totalDistance),

    deltas,

    summary: buildSummary(deltas)

  };

}

function buildSummary(deltas) {

  const strongest = Object.entries(deltas)

    .sort((a, b) => Math.abs(b[1].delta) - Math.abs(a[1].delta))

    .slice(0, 3)

    .map(([key, val]) => `${key} (${val.delta > 0 ? '+' : ''}${val.delta})`);

  return `Primary differences in ${strongest.join(', ')}`;

}

function round(n) {

  return Math.round(n * 1000) / 1000;

}

function clamp(n) {

  return Math.max(0, Math.min(1, n));

}