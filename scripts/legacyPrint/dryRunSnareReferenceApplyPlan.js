#!/usr/bin/env node

const fs = require('fs');

const path = require('path');

const PLAN_PATH =

  process.argv.find((arg) => arg.startsWith('--plan='))?.replace('--plan=', '') ||

  'src/legacyPrint/reviewPlans/snare-reference-consolidated-apply-plan-latest.json';

const APPLY = process.argv.includes('--apply');

const GROUP_ARG = process.argv.find((arg) => arg.startsWith('--group='))?.replace('--group=', '') || 'all';

const VALID_GROUPS = [

  'metalEdgeFallbackCorePromotions',

  'stockPromotions',

  'enrichmentOnlyReady',

  'holdNeedsMoreResearch'

];

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

  if (plan.mode !== 'CONSOLIDATED_REVIEW_PLAN_NO_FIRESTORE_WRITES') {

    fail(`Unexpected plan mode: ${plan.mode}`);

  }

  if (plan.firestoreWrites !== false) {

    fail('Plan firestoreWrites must be false.');

  }

  if (plan.rescoring !== false) {

    fail('Plan rescoring must be false.');

  }

  if (!plan.groups || typeof plan.groups !== 'object') {

    fail('Plan is missing groups.');

  }

  for (const group of VALID_GROUPS) {

    if (!Array.isArray(plan.groups[group])) {

      fail(`Plan group is missing or invalid: ${group}`);

    }

  }

  if (Array.isArray(plan.warnings) && plan.warnings.length > 0) {

    fail(`Plan has warnings. Resolve warnings before applying. Count: ${plan.warnings.length}`);

  }

}

function getSelectedGroups(plan) {

  if (GROUP_ARG === 'all') {

    return VALID_GROUPS.map((groupName) => ({

      groupName,

      updates: plan.groups[groupName]

    }));

  }

  if (!VALID_GROUPS.includes(GROUP_ARG)) {

    fail(`Invalid --group value: ${GROUP_ARG}. Valid: all, ${VALID_GROUPS.join(', ')}`);

  }

  return [

    {

      groupName: GROUP_ARG,

      updates: plan.groups[GROUP_ARG]

    }

  ];

}

function validateUpdates(selectedGroups) {

  const seenIds = new Map();

  const issues = [];

  for (const { groupName, updates } of selectedGroups) {

    for (const update of updates) {

      if (!update.id) {

        issues.push({ groupName, type: 'MISSING_ID', label: update.label });

        continue;

      }

      if (!update.label) {

        issues.push({ groupName, type: 'MISSING_LABEL', id: update.id });

      }

      if (!update.companyName) {

        issues.push({ groupName, type: 'MISSING_COMPANY_NAME', id: update.id });

      }

      if (!update.sourcePatchFile) {

        issues.push({ groupName, type: 'MISSING_SOURCE_PATCH_FILE', id: update.id });

      }

      if (!update.set || typeof update.set !== 'object') {

        issues.push({ groupName, type: 'MISSING_SET_OBJECT', id: update.id });

      }

      if (seenIds.has(update.id)) {

        issues.push({

          groupName,

          type: 'DUPLICATE_ID_IN_SELECTED_GROUPS',

          id: update.id,

          firstSeenIn: seenIds.get(update.id)

        });

      } else {

        seenIds.set(update.id, groupName);

      }

    }

  }

  return issues;

}

function summarizeGroup(groupName, updates) {

  const byCompany = {};

  const setKeys = {};

  const updateTypes = {};

  for (const update of updates) {

    const company = update.companyName || 'Unknown';

    byCompany[company] = (byCompany[company] || 0) + 1;

    const type = update.updateType || 'unknown';

    updateTypes[type] = (updateTypes[type] || 0) + 1;

    for (const key of Object.keys(update.set || {})) {

      setKeys[key] = (setKeys[key] || 0) + 1;

    }

  }

  return {

    groupName,

    count: updates.length,

    byCompany,

    updateTypes,

    setKeys

  };

}

const absolutePlanPath = path.resolve(PLAN_PATH);

const plan = readJson(absolutePlanPath);

assertPlanShape(plan);

const selectedGroups = getSelectedGroups(plan);

const issues = validateUpdates(selectedGroups);

console.log('\nLEGACYPRINT SNARE REFERENCE APPLY PLAN — DRY RUN');

console.log('==================================================');

console.log('Plan:', PLAN_PATH);

console.log('Apply flag:', APPLY);

console.log('Selected group:', GROUP_ARG);

console.log('Generated at:', plan.generatedAt);

console.log('\nPlan summary:');

console.log(JSON.stringify(plan.summary, null, 2));

console.log('\nSelected group summaries:');

for (const { groupName, updates } of selectedGroups) {

  console.log('\n--------------------------------------------------');

  console.log(JSON.stringify(summarizeGroup(groupName, updates), null, 2));

}

if (issues.length) {

  console.log('\nValidation issues:');

  console.log(JSON.stringify(issues, null, 2));

  fail(`Validation failed with ${issues.length} issue(s).`);

}

console.log('\nValidation: PASS');

if (!APPLY) {

  console.log('\n✅ Dry run only. No Firestore writes were attempted.');

  console.log('\nAvailable groups:');

  for (const group of VALID_GROUPS) {

    console.log(`- ${group}: ${plan.groups[group].length}`);

  }

  process.exit(0);

}

fail(

  'Apply mode is intentionally blocked in this first script. Next step is wiring Firebase Admin behind a second explicit approval gate.'

);

