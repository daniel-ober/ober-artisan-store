
// scripts/diagnose-heritage-thickness-parsing.mjs

import fs from 'fs';

import path from 'path';

import process from 'process';

import { pathToFileURL } from 'url';

const ROOT = process.cwd();

const FILE_CANDIDATES = {

  buildHeritageVoiceRead: [

    'src/utils/legacyPrint/buildHeritageVoiceRead.js',

    'src/utils/legacyPrint/buildHeritageVoiceRead.mjs',

  ],

};

const exists = (relativePath) => fs.existsSync(path.join(ROOT, relativePath));

const resolveFirstExisting = (candidates = []) => {

  return candidates.find((candidate) => exists(candidate)) || null;

};

const importProjectModule = async (relativePath) => {

  const absolutePath = path.join(ROOT, relativePath);

  const url = pathToFileURL(absolutePath).href;

  return import(url);

};

const round = (value, places = 4) => {

  const num = Number(value);

  if (!Number.isFinite(num)) return null;

  return Number(num.toFixed(places));

};

const pickProfile = (profile = {}) => ({

  attack: round(profile.attack),

  brightness: round(profile.brightness),

  projection: round(profile.projection),

  sustain: round(profile.sustain),

  warmth: round(profile.warmth),

  sensitivity: round(profile.sensitivity),

  control: round(profile.control),

});

const BASE_CONFIG = {

  size: '13',

  depth: '6.5',

  lugs: 8,

  scorchDepth: 'Medium Torch',

  hardwareColor: 'Chrome',

  hoopType: 'Triple Flange',

  benchmarkFamilyId: 'heritage',

  benchmarkTypeId: 'center',

  benchmarkSizeId: '13',

};

const TEST_INPUTS = [

  {

    label: 'Current UI-style staveOption 8mm',

    input: {

      ...BASE_CONFIG,

      staveOption: '16 staves • 8mm',

    },

  },

  {

    label: 'Current UI-style staveOption 10mm',

    input: {

      ...BASE_CONFIG,

      staveOption: '16 staves • 10mm',

    },

  },

  {

    label: 'Current UI-style staveOption 13mm',

    input: {

      ...BASE_CONFIG,

      staveOption: '16 staves • 13mm',

    },

  },

  {

    label: 'Explicit shellThicknessMm 8',

    input: {

      ...BASE_CONFIG,

      staveOption: '16 staves • 10mm',

      shellThicknessMm: 8,

    },

  },

  {

    label: 'Explicit shellThicknessMm 10',

    input: {

      ...BASE_CONFIG,

      staveOption: '16 staves • 10mm',

      shellThicknessMm: 10,

    },

  },

  {

    label: 'Explicit shellThicknessMm 13',

    input: {

      ...BASE_CONFIG,

      staveOption: '16 staves • 10mm',

      shellThicknessMm: 13,

    },

  },

  {

    label: 'Explicit shellThickness string 8mm',

    input: {

      ...BASE_CONFIG,

      staveOption: '16 staves • 10mm',

      shellThickness: '8mm',

    },

  },

  {

    label: 'Explicit shellThickness string 10mm',

    input: {

      ...BASE_CONFIG,

      staveOption: '16 staves • 10mm',

      shellThickness: '10mm',

    },

  },

  {

    label: 'Explicit shellThickness string 13mm',

    input: {

      ...BASE_CONFIG,

      staveOption: '16 staves • 10mm',

      shellThickness: '13mm',

    },

  },

  {

    label: 'Legacy fields staveQuantity + shellThickness 8mm',

    input: {

      ...BASE_CONFIG,

      staveQuantity: '16',

      shellThickness: '8mm',

    },

  },

  {

    label: 'Legacy fields staveQuantity + shellThickness 10mm',

    input: {

      ...BASE_CONFIG,

      staveQuantity: '16',

      shellThickness: '10mm',

    },

  },

  {

    label: 'Legacy fields staveQuantity + shellThickness 13mm',

    input: {

      ...BASE_CONFIG,

      staveQuantity: '16',

      shellThickness: '13mm',

    },

  },

];

const main = async () => {

  const buildHeritageVoiceReadPath = resolveFirstExisting(

    FILE_CANDIDATES.buildHeritageVoiceRead

  );

  if (!buildHeritageVoiceReadPath) {

    console.error('Could not find buildHeritageVoiceRead file.');

    process.exit(1);

  }

  const voiceReadModule = await importProjectModule(buildHeritageVoiceReadPath);

  const buildHeritageVoiceRead =

    voiceReadModule.buildHeritageVoiceRead || voiceReadModule.default;

  if (typeof buildHeritageVoiceRead !== 'function') {

    console.error('buildHeritageVoiceRead export not found.');

    process.exit(1);

  }

  const rows = TEST_INPUTS.map(({ label, input }) => {

    const read = buildHeritageVoiceRead(input);

    const spec = read.currentSpec || {};

    return {

      label,

      inputStaveOption: input.staveOption || '',

      inputShellThicknessMm: input.shellThicknessMm ?? '',

      inputShellThickness: input.shellThickness ?? '',

      inputStaveQuantity: input.staveQuantity ?? '',

      specStaveCount: spec.staveCount ?? '',

      specShellThicknessMm: spec.shellThicknessMm ?? '',

      specThicknessMm: spec.thicknessMm ?? '',

      specShellThickness: spec.shellThickness ?? '',

      specThickness: spec.thickness ?? '',

      specShellThicknessBucket: spec.shellThicknessBucket ?? '',

      simpleRead:

        read.sourceBuildRead?.title ||

        read.sourceBuildRead?.summary ||

        read.sourceBuildRead ||

        '',

      profile: JSON.stringify(pickProfile(read.profile || {})),

    };

  });

  console.log('\nHeritage Thickness Parsing Diagnosis');

  console.log('\nThis checks which input field actually changes currentSpec shell thickness.\n');

  console.table(rows);

  const uiStyleRows = rows.filter((row) =>

    row.label.startsWith('Current UI-style')

  );

  const uiStyleUniqueSpecThickness = new Set(

    uiStyleRows.map((row) => String(row.specShellThicknessMm))

  );

  const uiStyleUniqueProfiles = new Set(uiStyleRows.map((row) => row.profile));

  console.log('\nDiagnosis Summary');

  console.table([

    {

      check: 'UI-style staveOption should produce multiple spec shellThicknessMm values',

      actualUniqueValues: [...uiStyleUniqueSpecThickness].join(' / '),

      passed: uiStyleUniqueSpecThickness.size > 1,

    },

    {

      check: 'UI-style staveOption should produce multiple profiles',

      actualUniqueProfiles: uiStyleUniqueProfiles.size,

      passed: uiStyleUniqueProfiles.size > 1,

    },

  ]);

  if (uiStyleUniqueSpecThickness.size <= 1 || uiStyleUniqueProfiles.size <= 1) {

    console.error('\nDIAGNOSIS: thickness is not being parsed from staveOption correctly.');

    console.error(

      'Next fix should be inside src/utils/legacyPrint/buildHeritageVoiceRead.js, likely buildHeritageSpec() / parse staveOption logic.'

    );

    process.exit(1);

  }

  console.log('\nPASS: UI-style staveOption thickness parsing is working.\n');

};

main().catch((error) => {

  console.error('\nFAILED TO RUN HERITAGE THICKNESS PARSING DIAGNOSIS\n');

  console.error(error);

  process.exit(1);

});

