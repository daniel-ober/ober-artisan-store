const buildHeritageVoiceReadModule = await import('../src/utils/legacyPrint/buildHeritageVoiceRead.js');

const relationshipsModule = await import('../src/utils/legacyPrint/heritageKeyRelationships.js');

const buildHeritageVoiceRead = buildHeritageVoiceReadModule.default;

const { buildKeyRelationships } = relationshipsModule;

const sizes = ['12', '13', '14'];

const depths = ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0'];

const lugOptions = {

  '12': ['8', '6'],

  '13': ['8'],

  '14': ['8', '10'],

};

const staveOptions = {

  '12|8': ['16 - 10mm'],

  '12|6': ['12 - 8mm + $150 (Re-Rings Required)'],

  '13|8': ['16 - 10mm'],

  '14|8': ['16 - 10mm'],

  '14|10': ['20 - 12mm', '10 - 7mm + $150 (Re-Rings Required)'],

};

const hoopTypes = ['Triple Flange', 'Die-Cast'];

const finishes = ['Light Torch', 'Medium Torch', 'Blackened'];

const rows = [];

for (const size of sizes) {

  for (const depth of depths) {

    for (const lugs of lugOptions[size]) {

      for (const staveOption of staveOptions[`${size}|${lugs}`] || []) {

        for (const hoopType of hoopTypes) {

          for (const scorchDepth of finishes) {

            const read = buildHeritageVoiceRead({

              size,

              depth,

              lugs,

              staveOption,

              hardwareColor: 'Chrome',

              hoopType,

              scorchDepth,

              benchmarkFamilyId: 'ober-custom',

              benchmarkTypeId: 'heritage-oak-reference',

              benchmarkSizeId: '14x5_5',

            });

            const cards = buildKeyRelationships(read).slice(0, 3).map((r) => r.title);

            rows.push({

              config: `${size}x${depth} • ${lugs} lugs • ${staveOption} • ${hoopType} • ${scorchDepth}`,

              cardStack: cards.join(' > '),

              topThread: cards[0],

              card2: cards[1],

              card3: cards[2],

              attack: read.profile.attack,

              brightness: read.profile.brightness,

              projection: read.profile.projection,

              sustain: read.profile.sustain,

              warmth: read.profile.warmth,

              sensitivity: read.profile.sensitivity,

              control: read.profile.control,

            });

          }

        }

      }

    }

  }

}

const groups = rows.reduce((acc, row) => {

  acc[row.cardStack] = acc[row.cardStack] || [];

  acc[row.cardStack].push(row);

  return acc;

}, {});

const repeatedStacks = Object.entries(groups)

  .map(([cardStack, configs]) => ({

    cardStack,

    count: configs.length,

    percent: `${((configs.length / rows.length) * 100).toFixed(1)}%`,

    sample1: configs[0]?.config,

    sample2: configs[1]?.config || '',

    sample3: configs[2]?.config || '',

  }))

  .sort((a, b) => b.count - a.count);

console.log('\nHERITAGE VOICE THREAD AUDIT');

console.log(`Total configs tested: ${rows.length}`);

console.log(`Unique 3-card stacks: ${repeatedStacks.length}`);

console.log('\nMOST REPEATED 3-CARD STACKS');

console.table(repeatedStacks.slice(0, 20));

console.log('\nSCREENSHOT-LIKE 8-INCH MEDIUM TORCH CONFIGS');

console.table(

  rows.filter((row) =>

    row.config.includes('8.0') &&

    row.config.includes('8 lugs') &&

    row.config.includes('16 - 10mm') &&

    row.config.includes('Medium Torch')

  )

);

console.log('\nDONE');

