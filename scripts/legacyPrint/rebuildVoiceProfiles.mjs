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

function printProfilePreview(record, profile) {

  console.log('\nLegacyPrint computed voice profile preview');

  console.log('----------------------------------------');

  console.log({

    id: record.id,

    modelName: record.modelName,

    sourceSchemaVersion: record.schemaVersion,

    profileSchemaVersion: profile.schemaVersion,

    confidence: profile.confidence,

  });

  console.log('\nBare shell scores:');

  console.table(profile.bareShell?.scores || {});

  console.log('\nStock config scores:');

  console.table(profile.stockConfig?.scores || {});

  console.log('\nModified config scores:');

  console.table(profile.modifiedConfig?.scores || {});

  console.log('\nApplied bare shell drivers:');

  console.dir(profile.bareShell?.appliedDrivers || [], { depth: null });

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