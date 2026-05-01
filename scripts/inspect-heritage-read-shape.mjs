
import buildHeritageVoiceRead from '../src/utils/legacyPrint/buildHeritageVoiceRead.js';

const input = {

  size: '13',

  depth: '6.5',

  lugs: 8,

  staveOption: '16 staves • 13mm',

  scorchDepth: 'Medium Torch',

  hardwareColor: 'Chrome',

  hoopType: 'Triple Flange',

  benchmarkFamilyId: 'heritage',

  benchmarkTypeId: 'center',

  benchmarkSizeId: '13',

};

const read = buildHeritageVoiceRead(input);

console.log('\nTOP LEVEL KEYS\n');

console.log(Object.keys(read));

console.log('\nTHREAD-LIKE TOP LEVEL VALUES\n');

Object.entries(read)

  .filter(([key]) => /thread|score|node|read|summary|visual|relationship/i.test(key))

  .forEach(([key, value]) => {

    console.log(`\n${key}:`);

    console.dir(value, { depth: 8 });

  });

console.log('\nMETA KEYS\n');

console.log(Object.keys(read.meta || {}));

console.log('\nMETA THREAD-LIKE VALUES\n');

Object.entries(read.meta || {})

  .filter(([key]) => /thread|score|node|read|summary|visual|relationship/i.test(key))

  .forEach(([key, value]) => {

    console.log(`\nmeta.${key}:`);

    console.dir(value, { depth: 8 });

  });

console.log('\nFULL READ SHAPE PREVIEW\n');

console.dir(read, { depth: 5 });

