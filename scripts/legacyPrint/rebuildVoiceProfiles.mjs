
import fs from 'fs';

import path from 'path';

import { fileURLToPath } from 'url';

import { computeVoiceProfile } from '../../src/utils/legacyPrint/scoring/computeVoiceProfile.js';

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const dryRun = process.argv.includes('--dry-run');

const fixturePath = path.resolve(

  __dirname,

  '../../data/fixtures/legacyPrint/sampleVoiceProfileQueue.json'

);

function loadFixtureQueue() {

  if (!fs.existsSync(fixturePath)) return [];

  return JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

}

function buildScoreComparison(profile) {

  const bare = profile.bareShell?.scores || {};

  const stock = profile.stockConfig?.scores || {};

  const modified = profile.modifiedConfig?.scores || {};

  return Object.keys(bare).reduce((rows, node) => {

    rows[node] = {

      bare: bare[node],

      stock: stock[node],

      stockDelta: Number(((stock[node] || 0) - (bare[node] || 0)).toFixed(2)),

      modified: modified[node],

      modifiedDelta: Number(((modified[node] || 0) - (stock[node] || 0)).toFixed(2)),

    };

    return rows;

  }, {});

}

function printProfilePreview(record, profile) {

  console.log('\nLegacyPrint computed voice profile preview');

  console.log('----------------------------------------');

  console.log({

    id: record.id,

    modelName: record.modelName,

    sourceSchemaVersion: record.schemaVersion,

    profileSchemaVersion: profile.schemaVersion,

  });

  console.log('\nConfidence:');

  console.dir(profile.confidence, { depth: null });

  console.log('\nBare vs Stock vs Modified score comparison:');

  console.table(buildScoreComparison(profile));

  console.log('\nBare shell scores:');

  console.table(profile.bareShell?.scores || {});

  console.log('\nStock config scores:');

  console.table(profile.stockConfig?.scores || {});

  console.log('\nModified config scores:');

  console.table(profile.modifiedConfig?.scores || {});

  console.log('\nApplied bare shell drivers:');

  console.dir(profile.bareShell?.appliedDrivers || [], { depth: null });

  console.log('\nApplied stock config drivers:');

  console.dir(profile.stockConfig?.appliedDrivers || [], { depth: null });

  console.log('\nUnknown stock config components:');

  console.dir(profile.stockConfig?.unknownComponents || [], { depth: null });

  console.log('\nApplied modified config drivers:');

  console.dir(profile.modifiedConfig?.appliedDrivers || [], { depth: null });

  console.log('\nUnknown modified config components:');

  console.dir(profile.modifiedConfig?.unknownComponents || [], { depth: null });

}

function main() {

  console.log('LegacyPrint voice profile rebuild runner');

  console.log({

    dryRun,

    fixturePath,

  });

  const queuedRecords = dryRun ? loadFixtureQueue() : [];

  console.log({

    queuedRecordCount: queuedRecords.length,

  });

  if (queuedRecords.length === 0) {

    console.log('No queued voice profile records found.');

    return;

  }

  queuedRecords.forEach((record) => {

    const computedProfile = computeVoiceProfile(record, {

      modifiedConfig: {

        hoopType: 'triple-flanged',

        batterHead: 'controlled',

        resoHead: 'clear snare side',

        snareWires: '24',

      },

    });

    printProfilePreview(record, computedProfile);

    if (!dryRun) {

      console.log(`Would write computed profile for ${record.id}`);

    }

  });

  console.log('\nVoice profile rebuild check complete.');

}

main();

