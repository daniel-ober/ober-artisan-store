
const { SNARE_NODE_KEYS } = require('./snareEngineConstants');

const clamp01 = value => Math.max(0, Math.min(1, Number(value.toFixed(4))));

const normalizeScore = value => clamp01((Number(value || 0) - 1) / 9);

const getNodeRank = scoredRecord =>

  Object.entries(scoredRecord.voiceProfile || {})

    .sort((a, b) => b[1] - a[1])

    .map(([node, value], index) => ({

      node,

      value,

      rank: index + 1,

      normalized: normalizeScore(value)

    }));

const getDriverStrengthByNode = scoredRecord => {

  const byNode = {};

  for (const node of SNARE_NODE_KEYS) {

    const drivers = scoredRecord?.drivers?.byNode?.[node] || [];

    const total = drivers.reduce((sum, driver) => sum + Math.abs(driver.delta || 0), 0);

    byNode[node] = Number(total.toFixed(4));

  }

  return byNode;

};

const normalizeDriverStrengths = driverStrengthByNode => {

  const values = Object.values(driverStrengthByNode);

  const max = Math.max(...values, 0.0001);

  return Object.fromEntries(

    Object.entries(driverStrengthByNode).map(([node, value]) => [

      node,

      clamp01(value / max)

    ])

  );

};

const resolveFirstListenMap = scoredRecord => {

  const nodeRank = getNodeRank(scoredRecord);

  const driverStrength = normalizeDriverStrengths(getDriverStrengthByNode(scoredRecord));

  const candidates = nodeRank.map(item => {

    const rankWeight =

      item.rank === 1 ? 1 :

      item.rank === 2 ? 0.82 :

      item.rank === 3 ? 0.68 :

      item.rank === 4 ? 0.48 :

      item.rank === 5 ? 0.32 :

      0.18;

    const firstListenScore = clamp01(

      item.normalized * 0.62 +

      driverStrength[item.node] * 0.28 +

      rankWeight * 0.1

    );

    return {

      ...item,

      driverStrength: driverStrength[item.node],

      firstListenScore

    };

  });

  candidates.sort((a, b) => b.firstListenScore - a.firstListenScore);

  return {

    readoutType: 'firstListen',

    title: 'First Listen',

    purpose:

      'Ranks the traits most likely to be noticed immediately when the snare is struck.',

    nodes: candidates.slice(0, 3),

    allCandidates: candidates

  };

};

const resolvePlayerAnalysisMap = scoredRecord => {

  const nodeRank = getNodeRank(scoredRecord);

  const driverStrength = normalizeDriverStrengths(getDriverStrengthByNode(scoredRecord));

  const feelWeights = {

    attack: 0.95,

    brightness: 0.72,

    projection: 0.62,

    sustain: 0.7,

    warmth: 0.82,

    sensitivity: 1,

    control: 0.95

  };

  const candidates = nodeRank.map(item => {

    const playerScore = clamp01(

      item.normalized * 0.58 +

      driverStrength[item.node] * 0.22 +

      (feelWeights[item.node] || 0.7) * 0.2

    );

    return {

      ...item,

      driverStrength: driverStrength[item.node],

      playerScore

    };

  });

  candidates.sort((a, b) => b.playerScore - a.playerScore);

  return {

    readoutType: 'playerAnalysis',

    title: 'Player Analysis',

    purpose:

      'Emphasizes how the snare is likely to feel under the sticks: response, control, body, and touch range.',

    nodes: candidates.slice(0, 7),

    allCandidates: candidates

  };

};

const resolveLegacyPrintIdentityMap = scoredRecord => {

  const nodeRank = getNodeRank(scoredRecord);

  const driverStrength = normalizeDriverStrengths(getDriverStrengthByNode(scoredRecord));

  const identityWeights = {

    attack: 0.85,

    brightness: 0.76,

    projection: 0.78,

    sustain: 0.9,

    warmth: 0.95,

    sensitivity: 0.84,

    control: 0.88

  };

  const candidates = nodeRank.map(item => {

    const identityScore = clamp01(

      item.normalized * 0.5 +

      driverStrength[item.node] * 0.34 +

      (identityWeights[item.node] || 0.8) * 0.16

    );

    return {

      ...item,

      driverStrength: driverStrength[item.node],

      identityScore

    };

  });

  candidates.sort((a, b) => b.identityScore - a.identityScore);

  return {

    readoutType: 'legacyPrintIdentity',

    title: 'LegacyPrint Identity',

    purpose:

      'Captures the snare’s most defining acoustic fingerprint using score strength and physical-driver strength.',

    nodes: candidates.slice(0, 4),

    allCandidates: candidates,

    strongestPhysicalDrivers: scoredRecord?.drivers?.strongestSources || []

  };

};

const resolveSnareReadoutMaps = scoredRecord => ({

  engineVersion: scoredRecord?.doctrine?.version || 'legacyprint-snare-engine-v0.1',

  drum: {

    id: scoredRecord.id,

    company: scoredRecord.company,

    model: scoredRecord.model,

    size: scoredRecord.size

  },

  firstListen: resolveFirstListenMap(scoredRecord),

  playerAnalysis: resolvePlayerAnalysisMap(scoredRecord),

  legacyPrintIdentity: resolveLegacyPrintIdentityMap(scoredRecord)

});

module.exports = {

  resolveSnareReadoutMaps,

  resolveFirstListenMap,

  resolvePlayerAnalysisMap,

  resolveLegacyPrintIdentityMap

};

