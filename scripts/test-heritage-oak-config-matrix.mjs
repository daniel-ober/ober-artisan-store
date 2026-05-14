// scripts/test-heritage-oak-config-matrix.mjs

import { buildHeritageVoiceRead } from '../src/utils/legacyPrint/buildHeritageVoiceRead.js';

const AXES = [

  'attack',

  'brightness',

  'projection',

  'sustain',

  'warmth',

  'sensitivity',

  'control',

];

const BASE_SPEC = {

  size: 13,

  diameter: 13,

  depth: 6,

  width: 13,

  lugs: 8,

  lugQuantity: 8,

  lugCount: 8,

  woodSpecies: 'Oak',

  shellMaterial: 'Oak',

  material: 'Oak',

  shellConstruction: 'Stave',

  construction: 'Stave',

  staveOption: 'medium',

  shellThickness: 10,

  shellThicknessMm: 10,

  hasReRings: false,

  reRings: false,

  hoopType: 'tripleFlange',

  scorchDepth: 'medium',

  finish: 'Medium Torch',

  finishTreatment: 'Medium Torch',

};

const TEST_GROUPS = [

  {

    label: 'DIAMETER SHIFT',

    specs: [

      {

        label: '12x6',

        overrides: { size: 12, diameter: 12, width: 12, depth: 6 },

      },

      {

        label: '13x6',

        overrides: { size: 13, diameter: 13, width: 13, depth: 6 },

      },

      {

        label: '14x6',

        overrides: { size: 14, diameter: 14, width: 14, depth: 6 },

      },

    ],

  },

  {

    label: 'DEPTH SHIFT',

    specs: [

      { label: '13x5.0', overrides: { depth: 5 } },

      { label: '13x5.5', overrides: { depth: 5.5 } },

      { label: '13x6.0', overrides: { depth: 6 } },

      { label: '13x6.5', overrides: { depth: 6.5 } },

      { label: '13x7.0', overrides: { depth: 7 } },

      { label: '13x7.5', overrides: { depth: 7.5 } },

      { label: '13x8.0', overrides: { depth: 8 } },

    ],

  },

  {

    label: 'SHELL THICKNESS / STAVE OPTION SHIFT',

    specs: [

      {

        label: 'Thin / open shell',

        overrides: {

          staveOption: 'thin',

          shellThickness: 8,

          shellThicknessMm: 8,

        },

      },

      {

        label: 'Medium / reference shell',

        overrides: {

          staveOption: 'medium',

          shellThickness: 10,

          shellThicknessMm: 10,

        },

      },

      {

        label: 'Thick / focused shell',

        overrides: {

          staveOption: 'thick',

          shellThickness: 12,

          shellThicknessMm: 12,

        },

      },

    ],

  },

  {

    label: 'RE-RING SHIFT',

    specs: [

      {

        label: 'No re-rings',

        overrides: {

          hasReRings: false,

          reRings: false,

        },

      },

      {

        label: 'With re-rings',

        overrides: {

          hasReRings: true,

          reRings: true,

        },

      },

    ],

  },

  {

    label: 'SCORCH DEPTH SHIFT',

    specs: [

      {

        label: 'Light Torch',

        overrides: {

          scorchDepth: 'light',

          finish: 'Light Torch',

          finishTreatment: 'Light Torch',

        },

      },

      {

        label: 'Medium Torch',

        overrides: {

          scorchDepth: 'medium',

          finish: 'Medium Torch',

          finishTreatment: 'Medium Torch',

        },

      },

      {

        label: 'Blackened',

        overrides: {

          scorchDepth: 'blackened',

          finish: 'Blackened',

          finishTreatment: 'Blackened',

        },

      },

    ],

  },

  {

    label: 'HOOP TYPE SHIFT',

    specs: [

      {

        label: 'Triple Flange',

        overrides: {

          hoopType: 'tripleFlange',

        },

      },

      {

        label: 'Die Cast',

        overrides: {

          hoopType: 'dieCast',

        },

      },

    ],

  },

  {

    label: 'REALISTIC COMBO PATHS',

    specs: [

      {

        label: 'Open / articulate side snare',

        overrides: {

          size: 12,

          diameter: 12,

          width: 12,

          depth: 5,

          staveOption: 'thin',

          shellThickness: 8,

          shellThicknessMm: 8,

          hasReRings: false,

          reRings: false,

          hoopType: 'tripleFlange',

          scorchDepth: 'light',

          finish: 'Light Torch',

          finishTreatment: 'Light Torch',

        },

      },

      {

        label: 'Balanced Heritage center',

        overrides: {

          size: 13,

          diameter: 13,

          width: 13,

          depth: 6,

          staveOption: 'medium',

          shellThickness: 10,

          shellThicknessMm: 10,

          hasReRings: false,

          reRings: false,

          hoopType: 'tripleFlange',

          scorchDepth: 'medium',

          finish: 'Medium Torch',

          finishTreatment: 'Medium Torch',

        },

      },

      {

        label: 'Focused studio shell',

        overrides: {

          size: 14,

          diameter: 14,

          width: 14,

          depth: 6.5,

          staveOption: 'thick',

          shellThickness: 12,

          shellThicknessMm: 12,

          hasReRings: true,

          reRings: true,

          hoopType: 'dieCast',

          scorchDepth: 'blackened',

          finish: 'Blackened',

          finishTreatment: 'Blackened',

        },

      },

      {

        label: 'Deep bloom build',

        overrides: {

          size: 14,

          diameter: 14,

          width: 14,

          depth: 8,

          staveOption: 'medium',

          shellThickness: 10,

          shellThicknessMm: 10,

          hasReRings: false,

          reRings: false,

          hoopType: 'tripleFlange',

          scorchDepth: 'medium',

          finish: 'Medium Torch',

          finishTreatment: 'Medium Torch',

        },

      },

    ],

  },

];

function normalizeSpec(overrides = {}) {

  const spec = {

    ...BASE_SPEC,

    ...overrides,

  };

  spec.size = Number(spec.size ?? spec.diameter ?? spec.width ?? 13);

  spec.diameter = Number(spec.diameter ?? spec.size);

  spec.width = Number(spec.width ?? spec.diameter ?? spec.size);

  spec.depth = Number(spec.depth ?? 6);

  spec.shellThickness = Number(spec.shellThickness ?? spec.shellThicknessMm ?? 10);

  spec.shellThicknessMm = Number(spec.shellThicknessMm ?? spec.shellThickness ?? 10);

  spec.finish = spec.finish ?? spec.finishTreatment ?? 'Medium Torch';

  spec.finishTreatment = spec.finishTreatment ?? spec.finish;

  return spec;

}

function getUniversalProfile(read) {

  return (

    read?.universalVoiceRead?.profile ||

    read?.universalProfile ||

    read?.profile ||

    {}

  );

}

function getFirstListen(read) {

  return read?.firstListen || read?.universalVoiceRead?.firstListen || null;

}

function getFirstListenProfile(firstListen) {

  return (

    firstListen?.visualProfile ||

    firstListen?.resolverMeta?.scoredProfile ||

    null

  );

}

function getResolverModifiers(firstListen) {

  return firstListen?.resolverMeta?.specModifiers || null;

}

function formatValue(value) {

  const number = Number(value);

  return Number.isFinite(number) ? number.toFixed(2) : 'n/a';

}

function formatProfile(profile = {}) {

  return AXES.map((key) => `${key}:${formatValue(profile[key])}`).join(' | ');

}

function getTopNodes(profile = {}) {

  return AXES.map((key) => {

    const value = Number(profile[key] ?? 5);

    return {

      key,

      value,

      distance: Math.abs(value - 5),

    };

  })

    .sort((a, b) => {

      if (b.distance !== a.distance) return b.distance - a.distance;

      return b.value - a.value;

    })

    .slice(0, 3);

}

function compareProfiles(previous, current) {

  if (!previous || !current) return [];

  return AXES.map((key) => {

    const before = Number(previous[key] ?? 5);

    const after = Number(current[key] ?? 5);

    const delta = after - before;

    return {

      key,

      delta,

    };

  }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

}

function formatDelta(delta) {

  if (!Number.isFinite(delta)) return 'n/a';

  if (delta > 0) return `+${delta.toFixed(2)}`;

  return delta.toFixed(2);

}

function printGroup(group) {

  console.log('\n============================================================');

  console.log(group.label);

  console.log('============================================================');

  let previousProfile = null;

  let previousLabel = null;

  group.specs.forEach((item) => {

    const spec = normalizeSpec(item.overrides);

    const read = buildHeritageVoiceRead(spec);

    const profile = getUniversalProfile(read);

    const firstListen = getFirstListen(read);

    const firstListenProfile = getFirstListenProfile(firstListen);

    const comparisonProfile = firstListenProfile || profile;

    const resolverModifiers = getResolverModifiers(firstListen);

    const topNodes = getTopNodes(profile);

    console.log('\n------------------------------------------------------------');

    console.log(item.label);

    console.log('------------------------------------------------------------');

    console.log(

      `Spec: ${spec.diameter}x${spec.depth} | ${spec.staveOption} | ${spec.shellThickness}mm | re-rings:${Boolean(

        spec.hasReRings || spec.reRings

      )} | ${spec.scorchDepth} | ${spec.hoopType}`

    );

    console.log(`First Listen Title: ${firstListen?.title || 'n/a'}`);

    console.log(

      `First Listen Nodes: ${(firstListen?.nodes || []).join(' → ') || 'n/a'}`

    );

    console.log(`First Listen Summary: ${firstListen?.summary || 'n/a'}`);

    console.log(`Universal Profile: ${formatProfile(profile)}`);

    if (firstListenProfile) {

      console.log(`First Listen Profile: ${formatProfile(firstListenProfile)}`);

    } else {

      console.log('First Listen Profile: n/a');

    }

    if (resolverModifiers) {

      console.log(`Resolver Modifiers: ${formatProfile(resolverModifiers)}`);

    } else {

      console.log('Resolver Modifiers: n/a');

    }

    console.log(

      `Top Movement Nodes: ${topNodes

        .map((node) => `${node.key}(${formatValue(node.value)})`)

        .join(', ')}`

    );

    if (previousProfile) {

      const deltas = compareProfiles(previousProfile, comparisonProfile);

console.log(`First Listen Delta From Previous: ${previousLabel} → ${item.label}`);

      console.log(

        deltas

          .map((deltaItem) => `${deltaItem.key}:${formatDelta(deltaItem.delta)}`)

          .join(' | ')

      );

      const biggestDelta = deltas[0];

      if (biggestDelta && Math.abs(biggestDelta.delta) < 0.03) {

        console.log('⚠️  WARNING: Very small movement from previous config.');

      }

      if (biggestDelta && Math.abs(biggestDelta.delta) > 0.75) {

        console.log('⚠️  WARNING: Large jump from previous config.');

      }

    }

    previousProfile = comparisonProfile;

    previousLabel = item.label;

  });

}

console.log('\n=== HERITAGE OAK CONFIG MATRIX TEST ===');

TEST_GROUPS.forEach(printGroup);

console.log('\n=== END HERITAGE OAK CONFIG MATRIX TEST ===\n');