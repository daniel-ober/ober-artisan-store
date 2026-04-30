
import buildHeritageVoiceRead from '../src/utils/legacyPrint/buildHeritageVoiceRead.js';

import buildKeyRelationships from '../src/utils/legacyPrint/heritageKeyRelationships.js';

const format = (n) => Number(n ?? 0).toFixed(2);

const configs = [

  {

    label: 'Screenshot A — 13x8 Medium Torch Triple Flange',

    input: {

      size: '13',

      depth: '8.0',

      lugCount: '8',

      lugs: '8',

      staveOption: '16 - 10mm',

      hoopType: 'Triple Flange',

      hardwareColor: 'Chrome',

      scorchDepth: 'Medium Torch',

    },

  },

  {

    label: 'Screenshot B — 12x8 Medium Torch Triple Flange',

    input: {

      size: '12',

      depth: '8.0',

      lugCount: '8',

      lugs: '8',

      staveOption: '16 - 10mm',

      hoopType: 'Triple Flange',

      hardwareColor: 'Chrome',

      scorchDepth: 'Medium Torch',

    },

  },

];

const rows = configs.map(({ label, input }) => {

  const read = buildHeritageVoiceRead(input);

  const profile = read.profile || {};

  const threads = buildKeyRelationships(read).slice(0, 3);

  return {

    label,

    topThread: threads[0]?.title || '',

    cardStack: threads.map((thread) => thread.title).join(' > '),

    attack: format(profile.attack),

    brightness: format(profile.brightness),

    projection: format(profile.projection),

    sustain: format(profile.sustain),

    warmth: format(profile.warmth),

    sensitivity: format(profile.sensitivity),

    control: format(profile.control),

    read: read.sourceBuildRead || read.summary || '',

  };

});

const [a, b] = rows;

const axisDiffs = ['attack', 'brightness', 'projection', 'sustain', 'warmth', 'sensitivity', 'control']

  .map((axis) => ({

    axis,

    diff: Number(a[axis]) - Number(b[axis]),

    abs: Math.abs(Number(a[axis]) - Number(b[axis])),

  }))

  .sort((x, y) => y.abs - x.abs);

const voiceShift = axisDiffs

  .filter((item) => item.abs >= 0.1)

  .map((item) => `${item.axis} ${item.diff > 0 ? '+' : ''}${item.diff.toFixed(2)}`)

  .join(' • ');

console.log('\nSELECTED CONFIG COMPARISON\n');

console.table(rows);

console.log('\nVOICE SHIFT — A minus B\n');

console.table(axisDiffs.map((item) => ({

  axis: item.axis,

  diff: `${item.diff > 0 ? '+' : ''}${item.diff.toFixed(2)}`,

})));

console.log('\nCUSTOMER-FACING TAKEAWAY\n');

console.log(

  `Both configs land in the same top Voice Thread (${a.topThread}), but they are not identical reads. ` +

    `The 13x8 shifts ${voiceShift || 'very subtly'} compared with the 12x8.`

);

console.log('\nNEXT DECISION');

console.log('Add a small Voice Shift line under the Voice Thread cards so same-thread configs still explain what changed.');

