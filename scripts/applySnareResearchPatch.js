// scripts/applySnareResearchPatch.js

const fs = require('fs');

const path = require('path');

const admin = require('firebase-admin');

const SERVICE_ACCOUNT_PATH = path.resolve(__dirname, '../serviceAccountKey.json');

const REPORT_DIR = path.resolve(__dirname, '../snarePatchApplyReports');

const args = process.argv.slice(2);

const patchPathArg = args.find((arg) => !arg.startsWith('--'));

const SHOULD_WRITE = args.includes('--write');

const FORCE = args.includes('--force');

function usage() {

  console.log(`

Usage:

  node scripts/applySnareResearchPatch.js data/snareResearchPatches/tama-starclassic-reviewed-patch.json

Dry run is default.

To actually write:

  node scripts/applySnareResearchPatch.js data/snareResearchPatches/tama-starclassic-reviewed-patch.json --write --force

Flags:

  --write   Actually update Firestore. Without this, dry-run only.

  --force   Required when patch.doNotApplyAutomatically is true.

`);

}

function getNestedValue(obj, dottedPath) {

  return dottedPath.split('.').reduce((acc, key) => {

    if (!acc || typeof acc !== 'object') return undefined;

    return acc[key];

  }, obj);

}

function setNestedValue(obj, dottedPath, value) {

  const parts = dottedPath.split('.');

  let cursor = obj;

  parts.forEach((part, index) => {

    if (index === parts.length - 1) {

      cursor[part] = value;

      return;

    }

    if (!cursor[part] || typeof cursor[part] !== 'object' || Array.isArray(cursor[part])) {

      cursor[part] = {};

    }

    cursor = cursor[part];

  });

}

function normalize(value = '') {

  return String(value).trim().toLowerCase().replace(/\s+/g, ' ');

}

function loadJson(filePath) {

  if (!fs.existsSync(filePath)) {

    throw new Error(`File not found: ${filePath}`);

  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));

}

function initFirebase() {

  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {

    throw new Error(`Missing service account key: ${SERVICE_ACCOUNT_PATH}`);

  }

  if (admin.apps.length) return admin.firestore();

  const serviceAccount = require(SERVICE_ACCOUNT_PATH);

  admin.initializeApp({

    credential: admin.credential.cert(serviceAccount),

    projectId: serviceAccount.project_id,

  });

  return admin.firestore();

}

function buildPatchTargetsFromGroups(patch) {

  if (!Array.isArray(patch.patchGroups)) {

    throw new Error('Patch does not contain patchGroups array.');

  }

  const targets = [];

  patch.patchGroups.forEach((group) => {

    const matchModelNames = Array.isArray(group.matchModelNames)

      ? group.matchModelNames

      : [];

    const updates = group.updates && typeof group.updates === 'object'

      ? group.updates

      : {};

    if (!matchModelNames.length) {

      return;

    }

    if (!Object.keys(updates).length) {

      return;

    }

    matchModelNames.forEach((modelName) => {

      targets.push({

        groupName: group.groupName || 'Unnamed Patch Group',

        companyName: patch.companyName,

        lineSeries: patch.lineSeries,

        modelName,

        updates,

        doNotUpdateYet: group.doNotUpdateYet || [],

      });

    });

  });

  return targets;

}

async function findMatchingDrum(db, target) {

  const snapshot = await db

    .collection('snareReferenceDrums')

    .where('companyName', '==', target.companyName)

    .where('lineSeries', '==', target.lineSeries)

    .get();

  const matches = [];

  snapshot.forEach((doc) => {

    const data = doc.data();

    if (normalize(data.modelName) === normalize(target.modelName)) {

      matches.push({

        id: doc.id,

        ref: doc.ref,

        data,

      });

    }

  });

  return matches;

}

function buildUpdatePreview(existingData, updates) {

  const preview = [];

  Object.entries(updates).forEach(([fieldPath, nextValue]) => {

    const currentValue = getNestedValue(existingData, fieldPath);

    preview.push({

      fieldPath,

      currentValue: currentValue === undefined ? null : currentValue,

      nextValue,

      willChange: currentValue !== nextValue,

    });

  });

  return preview;

}

function buildFirestoreUpdateObject(updates) {

  const updateObject = {};

  Object.entries(updates).forEach(([fieldPath, value]) => {

    updateObject[fieldPath] = value;

  });

  updateObject.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  updateObject['researchMeta.lastPatchAppliedAt'] = admin.firestore.FieldValue.serverTimestamp();

  updateObject['researchMeta.lastPatchAppliedBy'] = 'scripts/applySnareResearchPatch.js';

  return updateObject;

}

async function main() {

  if (!patchPathArg) {

    usage();

    process.exit(1);

  }

  const patchPath = path.resolve(process.cwd(), patchPathArg);

  const patch = loadJson(patchPath);

  if (patch.doNotApplyAutomatically && !FORCE) {

    throw new Error(

      'Patch has doNotApplyAutomatically: true. Re-run with --force after review.'

    );

  }

  const targets = buildPatchTargetsFromGroups(patch);

  if (!targets.length) {

    throw new Error('Patch has no usable patchGroups with matchModelNames + updates.');

  }

  const db = initFirebase();

  const report = {

    patchFile: patchPathArg,

    companyName: patch.companyName,

    lineSeries: patch.lineSeries,

    dryRun: !SHOULD_WRITE,

    forced: FORCE,

    generatedAt: new Date().toISOString(),

    totalTargets: targets.length,

    matchedDocuments: 0,

    unmatchedTargets: [],

    duplicateMatches: [],

    plannedUpdates: [],

    writtenUpdates: [],

    skippedNoChanges: [],

  };

  console.log('\nSnare research patch apply');

  console.log(`Patch: ${patchPathArg}`);

  console.log(`Company: ${patch.companyName}`);

  console.log(`Line: ${patch.lineSeries}`);

  console.log(`Mode: ${SHOULD_WRITE ? 'WRITE' : 'DRY RUN'}`);

  console.log(`Targets from patch groups: ${targets.length}\n`);

  for (const target of targets) {

    const matches = await findMatchingDrum(db, target);

    if (!matches.length) {

      report.unmatchedTargets.push(target);

      console.log(`No match: ${target.modelName}`);

      continue;

    }

    if (matches.length > 1) {

      report.duplicateMatches.push({

        target,

        matches: matches.map((match) => ({

          id: match.id,

          modelName: match.data.modelName,

        })),

      });

      console.log(`Duplicate matches skipped: ${target.modelName}`);

      continue;

    }

    const match = matches[0];

    report.matchedDocuments += 1;

    const preview = buildUpdatePreview(match.data, target.updates);

    const changes = preview.filter((item) => item.willChange);

    const planned = {

      groupName: target.groupName,

      documentId: match.id,

      modelName: match.data.modelName,

      updates: preview,

      doNotUpdateYet: target.doNotUpdateYet,

    };

    report.plannedUpdates.push(planned);

    if (!changes.length) {

      report.skippedNoChanges.push(planned);

      console.log(`No changes needed: ${match.data.modelName}`);

      continue;

    }

    console.log(`\n${SHOULD_WRITE ? 'Updating' : 'Would update'}: ${match.data.modelName}`);

    changes.forEach((change) => {

      console.log(`- ${change.fieldPath}`);

      console.log(`  current: ${change.currentValue === null ? 'null' : change.currentValue}`);

      console.log(`  next:    ${change.nextValue}`);

    });

    if (SHOULD_WRITE) {

      const updateObject = buildFirestoreUpdateObject(target.updates);

      await match.ref.update(updateObject);

      report.writtenUpdates.push({

        documentId: match.id,

        modelName: match.data.modelName,

        changedFields: changes.map((change) => change.fieldPath),

      });

    }

  }

  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const safeName = `${normalize(patch.companyName).replace(/[^a-z0-9]+/g, '-')}-${normalize(

    patch.lineSeries

  ).replace(/[^a-z0-9]+/g, '-')}-${SHOULD_WRITE ? 'write' : 'dry-run'}-${Date.now()}.json`;

  const reportPath = path.join(REPORT_DIR, safeName);

  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log('\nPatch apply complete.');

  console.log(`Matched documents: ${report.matchedDocuments}/${report.totalTargets}`);

  console.log(`Unmatched targets: ${report.unmatchedTargets.length}`);

  console.log(`Duplicate matches skipped: ${report.duplicateMatches.length}`);

  console.log(`Written updates: ${report.writtenUpdates.length}`);

  console.log(`Report: ${reportPath}`);

  if (!SHOULD_WRITE) {

    console.log('\nDry run only. No Firestore documents were changed.');

    console.log('To write after reviewing the report:');

    console.log(`node scripts/applySnareResearchPatch.js ${patchPathArg} --write --force`);

  }

}

main().catch((error) => {

  console.error('\nPatch apply failed:');

  console.error(error);

  process.exit(1);

});