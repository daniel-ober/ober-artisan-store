import buildHeritageVoiceRead from '../src/utils/legacyPrint/buildHeritageVoiceRead.js';

import { buildKeyRelationships } from '../src/utils/legacyPrint/heritageKeyRelationships.js';

const AXIS_COLOR_BY_KEY = {

  attack: '#ff7448',

  brightness: '#e7d98f',

  projection: '#ffb53a',

  sustain: '#4d86ff',

  warmth: '#c1682e',

  sensitivity: '#68d9df',

  control: '#9e8bff',

};

const sizes = ['12', '13', '14'];

const depthPrices = {

  12: ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0'],

  13: ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0'],

  14: ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0'],

};

const lugOptions = {

  12: ['8', '6'],

  13: ['8'],

  14: ['8', '10'],

};

const staveOptions = {

  12: {

    6: ['12 - 8mm + $150 (Re-Rings Required)'],

    8: ['16 - 10mm'],

  },

  13: {

    8: ['16 - 10mm'],

  },

  14: {

    8: ['16 - 10mm'],

    10: ['20 - 12mm', '10 - 7mm + $150 (Re-Rings Required)'],

  },

};

const hoopTypes = ['Triple Flange', 'Die-Cast'];

const hardwareColors = ['Chrome', 'Black Nickel', 'Brass/Gold'];

const scorchDepths = ['Light Torch', 'Medium Torch', 'Blackened'];

const THREAD_NODE_ORDER = [

  'attack',

  'brightness',

  'projection',

  'sustain',

  'warmth',

  'sensitivity',

  'control',

];

const getAxisValue = (profile = {}, axisKey) => {

  const value = Number(profile?.[axisKey] ?? 5);

  return Number.isFinite(value) ? value : 5;

};

const getAxisDelta = (profile = {}, axisKey) => {

  return getAxisValue(profile, axisKey) - 5;

};

const getNodeVoiceWeight = (profile = {}, nodeKey) => {

  const rawValue = getAxisValue(profile, nodeKey);

  const delta = Math.abs(rawValue - 5);

  return Math.max(0.28, Math.min(1, 0.28 + delta / 2.25));

};

const getExpectedThreadColor = ({

  relationship = {},

  profile = {},

}) => {

  const threadNodes = Array.isArray(relationship?.nodes)

    ? relationship.nodes.filter(Boolean)

    : [];

  let candidateNodes = threadNodes;

  if (!candidateNodes.length) {

    candidateNodes = THREAD_NODE_ORDER;

  }

  const topContributor =

    candidateNodes

      .map((nodeKey) => ({

        nodeKey,

        weight: getNodeVoiceWeight(profile, nodeKey),

        delta: Math.abs(getAxisDelta(profile, nodeKey)),

      }))

      .sort((a, b) => {

        if (b.weight !== a.weight) return b.weight - a.weight;

        return b.delta - a.delta;

      })[0]?.nodeKey || 'attack';

  return {

    topContributor,

    expectedColor: AXIS_COLOR_BY_KEY[topContributor] || '#d6b277',

  };

};

const failures = [];

const rows = [];

let totalReads = 0;

let totalConfigs = 0;

for (const size of sizes) {

  for (const depth of depthPrices[size]) {

    for (const lugs of lugOptions[size]) {

      for (const staveOption of staveOptions[size]?.[lugs] || []) {

        for (const hoopType of hoopTypes) {

          for (const hardwareColor of hardwareColors) {

            for (const scorchDepth of scorchDepths) {

              totalConfigs += 1;

              const summary = buildHeritageVoiceRead({

                size,

                depth,

                lugs,

                staveOption,

                hardwareColor,

                hoopType,

                scorchDepth,

              });

              const relationships = buildKeyRelationships(summary);

              const topThree = relationships.slice(0, 3);

              for (const relationship of topThree) {

                totalReads += 1;

               const { topContributor, expectedColor } =

  getExpectedThreadColor({

    relationship,

    profile: summary.profile || {},

  });

                const isValidTopContributor =

                  Boolean(topContributor) &&

                  Object.prototype.hasOwnProperty.call(

                    AXIS_COLOR_BY_KEY,

                    topContributor

                  );

                const isValidColor =

                  typeof expectedColor === 'string' &&

                  expectedColor.startsWith('#') &&

                  expectedColor.length === 7;

                const row = {

                  config: `${size}x${depth} / ${lugs} lugs / ${staveOption} / ${hoopType} / ${hardwareColor} / ${scorchDepth}`,

                  slot: relationship.slotKey,

                  title: relationship.title,

                  nodes: relationship.nodes?.join(' / ') || '',

                  topContributor,

                  expectedColor,

                  score: Number(relationship.score || 0).toFixed(2),

                };

                rows.push(row);

                if (!isValidTopContributor || !isValidColor) {

                  failures.push({

                    ...row,

                    issue: !isValidTopContributor

                      ? 'Invalid top contributor'

                      : 'Invalid expected color',

                  });

                }

              }

            }

          }

        }

      }

    }

  }

}

const uniqueTopContributorCounts = rows.reduce((acc, row) => {

  acc[row.topContributor] = (acc[row.topContributor] || 0) + 1;

  return acc;

}, {});

const uniqueColorCounts = rows.reduce((acc, row) => {

  acc[row.expectedColor] = (acc[row.expectedColor] || 0) + 1;

  return acc;

}, {});

console.log('\nHeritage Voice Thread color validation\n');

console.log(`Configs tested: ${totalConfigs}`);

console.log(`Read cards tested: ${totalReads}`);

console.log(`Failures: ${failures.length}`);

console.log('\nTop contributor distribution');

console.table(uniqueTopContributorCounts);

console.log('\nColor distribution');

console.table(uniqueColorCounts);

console.log('\nSample reads');

console.table(rows.slice(0, 24));

if (failures.length) {

  console.log('\nFailures');

  console.table(failures.slice(0, 50));

  process.exit(1);

}

console.log('\n✅ All Voice Thread colors resolve from the strongest node inside each relationship.nodes set.\n');