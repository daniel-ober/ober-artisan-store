#!/usr/bin/env node

const fs = require('fs');

const path = require('path');

const PLAN_PATH =

  process.argv.find((arg) => arg.startsWith('--plan='))?.replace('--plan=', '') ||

  'src/legacyPrint/reviewPlans/snare-reference-notes-only-apply-plan-latest.json';

const APPLY = process.argv.includes('--apply');

const COLLECTION = 'snareReferenceDrums';

function fail(message) {

  console.error(`\n❌ ${message}`);

  process.exit(1);

}

function readJson(filePath) {

  if (!fs.existsSync(filePath)) {

    fail(`Missing file: ${filePath}`);

  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));

}

function assertPlanShape(plan) {

  if (!plan || typeof plan !== 'object') fail('Plan is not a valid object.');

  if (plan.mode !== 'NOTES_ONLY_APPLY_PLAN_NO_FIRESTORE_WRITES') {

    fail(`Unexpected plan mode: ${plan.mode}`);

  }

  if (plan.firestoreWrites !== false) {

    fail('Plan firestoreWrites must be false.');

  }

  if (plan.rescoring !== false) {

    fail('Plan rescoring must be false.');

  }

  if (!plan.groups || !Array.isArray(plan.groups.notesOnly)) {

    fail('Plan is missing groups.notesOnly.');

  }

  const allowed = new Set(plan.allowedSetKeys || []);

  if (allowed.size !== 1 || !allowed.has('notesOnMissingData')) {

    fail('Notes-only plan must allow only notesOnMissingData.');

  }

  for (const update of plan.groups.notesOnly) {

    const keys = Object.keys(update.set || {});

    if (keys.length !== 1 || keys[0] !== 'notesOnMissingData') {

      fail(`Non-notes-only update found: ${update.id} keys=${keys.join(', ')}`);

    }

  }

}

function summarize(updates) {

  const byCompany = {};

  const bySourceGroup = {};

  const emptyNotes = [];

  for (const update of updates) {

    byCompany[update.companyName] = (byCompany[update.companyName] || 0) + 1;

    bySourceGroup[update.sourceGroup] = (bySourceGroup[update.sourceGroup] || 0) + 1;

    if (!update.set?.notesOnMissingData || typeof update.set.notesOnMissingData !== 'string') {

      emptyNotes.push(update.id);

    }

  }

  return {

    totalUpdates: updates.length,

    byCompany,

    bySourceGroup,

    emptyNotes

  };

}

const plan = readJson(path.resolve(PLAN_PATH));

assertPlanShape(plan);

const updates = plan.groups.notesOnly;

const summary = summarize(updates);

console.log('\nLEGACYPRINT SNARE REFERENCE NOTES-ONLY APPLY');

console.log('==================================================');

console.log('Plan:', PLAN_PATH);

console.log('Collection:', COLLECTION);

console.log('Apply flag:', APPLY);

console.log('\nSummary:');

console.log(JSON.stringify(summary, null, 2));

if (summary.emptyNotes.length) {

  fail(`Found ${summary.emptyNotes.length} updates with missing/invalid notesOnMissingData.`);

}

if (!APPLY) {

  console.log('\n✅ Dry run only. No Firestore writes were attempted.');

  console.log('\nTo apply later, this script still needs Firebase Admin wiring.');

  process.exit(0);

}

fail('Apply mode is intentionally blocked until Firebase Admin wiring and credentials path are added.');

