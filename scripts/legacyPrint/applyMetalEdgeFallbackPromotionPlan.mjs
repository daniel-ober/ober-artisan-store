import admin from 'firebase-admin';

import fs from 'fs';

import path from 'path';

const DEFAULT_PLAN = 'src/legacyPrint/reviewPlans/snare-reference-metal-edge-fallback-promotion-plan-latest.json';

const EXPECTED_PLAN = 'SNARE_REFERENCE_METAL_EDGE_FALLBACK_PROMOTION_PLAN';

const EXPECTED_COLLECTION = 'snareReferenceDrums';

const EXPECTED_TIER = 'MEANINGFUL_CORE_SHELL_PASS_WITH_METAL_EDGE_FALLBACK';

const CONFIRM = 'APPLY_METAL_EDGE_FALLBACK';

const ALLOWED_KEYS = [

  'bearingEdge',

  'bearingEdgeNeedsVerification',

  'coreShellTier',

  'engineAssumptions',

  'fieldQualityTier',

  'notesOnMissingData'

].sort();

function arg(prefix) {

  const found = process.argv.find((value) => value.startsWith(prefix));

  return found ? found.slice(prefix.length) : '';

}

function has(flag) {

  return process.argv.includes(flag);

}

function readJson(filePath) {

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));

}

function text(value) {

  if (value === null || value === undefined) return '';

  if (typeof value === 'string') return value.trim();

  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  try {

    return JSON.stringify(value);

  } catch {

    return String(value);

  }

}

function getLimit() {

  const raw = arg('--limit=');

  if (!raw) return null;

  const limit = Number(raw);

  if (!Number.isInteger(limit) || limit <= 0) {

    throw new Error('Invalid --limit=' + raw);

  }

  return limit;

}

function initDb() {

  const serviceAccountPath = arg('--serviceAccount=');

  if (!serviceAccountPath) {

    throw new Error('Missing --serviceAccount=backend/serviceAccountKey-prod.json');

  }

  const serviceAccount = readJson(path.resolve(serviceAccountPath));

  admin.initializeApp({

    credential: admin.credential.cert(serviceAccount),

    projectId: serviceAccount.project_id

  });

  console.log('Firebase Admin initialized:');

  console.log(JSON.stringify({

    projectId: serviceAccount.project_id,

    clientEmail: serviceAccount.client_email,

    serviceAccountPath

  }, null, 2));

  return admin.firestore();

}

function assertPlan(plan) {

  if (plan.planName !== EXPECTED_PLAN) throw new Error('Wrong planName: ' + plan.planName);

  if (plan.mode !== 'DRY_RUN_PLAN_NO_FIRESTORE_WRITES') throw new Error('Wrong mode: ' + plan.mode);

  if (plan.collectionName !== EXPECTED_COLLECTION) throw new Error('Wrong collection: ' + plan.collectionName);

  if (plan.firestoreWrites !== false) throw new Error('Plan firestoreWrites must be false.');

  if (plan.rescoring !== false) throw new Error('Plan rescoring must be false.');

  if (plan.readinessTier !== EXPECTED_TIER) throw new Error('Wrong readinessTier: ' + plan.readinessTier);

  if (!Array.isArray(plan.updates) || !plan.updates.length) throw new Error('Plan has no updates.');

  const allowed = [...(plan.allowedSetKeys || [])].sort();

  if (JSON.stringify(allowed) !== JSON.stringify(ALLOWED_KEYS)) {

    throw new Error('Unsafe allowedSetKeys: ' + JSON.stringify(plan.allowedSetKeys));

  }

}

function assertUpdate(update) {

  if (!text(update.id)) throw new Error('Missing update id.');

  if (!text(update.sourceUrl)) throw new Error('Missing sourceUrl for ' + update.id);

  if (!text(update.sourceConfidence)) throw new Error('Missing sourceConfidence for ' + update.id);

  const set = update.set;

  if (!set || typeof set !== 'object' || Array.isArray(set)) {

    throw new Error('Invalid set object for ' + update.id);

  }

  const keys = Object.keys(set).sort();

  if (JSON.stringify(keys) !== JSON.stringify(ALLOWED_KEYS)) {

    throw new Error('Unsafe set keys for ' + update.id + ': ' + JSON.stringify(keys));

  }

  if (set.fieldQualityTier !== EXPECTED_TIER) throw new Error('Bad fieldQualityTier for ' + update.id);

  if (set.coreShellTier !== EXPECTED_TIER) throw new Error('Bad coreShellTier for ' + update.id);

  if (set.bearingEdgeNeedsVerification !== true) throw new Error('bearingEdgeNeedsVerification must be true for ' + update.id);

  if (!set.bearingEdge || set.bearingEdge.evidenceLevel !== 'metalShellFallback') {

    throw new Error('Invalid bearingEdge fallback for ' + update.id);

  }

  if (set.bearingEdge.confidence !== 'fallback') {

    throw new Error('bearingEdge confidence must be fallback for ' + update.id);

  }

  if (set.bearingEdge.needsVerification !== true) {

    throw new Error('bearingEdge needsVerification must be true for ' + update.id);

  }

  if (!set.engineAssumptions || set.engineAssumptions.bearingEdgeFallbackApplied !== true) {

    throw new Error('Missing engineAssumptions fallback flag for ' + update.id);

  }

  if (!text(set.engineAssumptions.bearingEdgeFallbackKey)) {

    throw new Error('Missing fallback key for ' + update.id);

  }

  if (!text(set.engineAssumptions.bearingEdgeFallbackReason)) {

    throw new Error('Missing fallback reason for ' + update.id);

  }

  if (set.engineAssumptions.bearingEdgeNeedsVerification !== true) {

    throw new Error('Missing engine assumption verification flag for ' + update.id);

  }

  if (!text(set.notesOnMissingData)) {

    throw new Error('Missing notesOnMissingData for ' + update.id);

  }

}

async function verifyDocs(db, collection, updates) {

  const missing = [];

  for (let i = 0; i < updates.length; i += 300) {

    const refs = updates.slice(i, i + 300).map((u) => db.collection(collection).doc(u.id));

    const docs = await db.getAll(...refs);

    docs.forEach((doc) => {

      if (!doc.exists) missing.push(doc.id);

    });

  }

  return {

    expected: updates.length,

    existing: updates.length - missing.length,

    missing: missing.length,

    missingSample: missing.slice(0, 20)

  };

}

async function apply(db, collection, updates) {

  let written = 0;

  for (let i = 0; i < updates.length; i += 450) {

    const chunk = updates.slice(i, i + 450);

    const batch = db.batch();

    chunk.forEach((update) => {

      batch.update(db.collection(collection).doc(update.id), update.set);

    });

    await batch.commit();

    written += chunk.length;

    console.log(JSON.stringify({

      batchWritten: chunk.length,

      totalWritten: written,

      remaining: updates.length - written

    }, null, 2));

  }

  return written;

}

async function main() {

  const planPath = arg('--plan=') || DEFAULT_PLAN;

  const shouldApply = has('--apply');

  const confirmation = arg('--confirm=');

  const limit = getLimit();

  const plan = readJson(planPath);

  assertPlan(plan);

  const updates = limit ? plan.updates.slice(0, limit) : plan.updates;

  updates.forEach(assertUpdate);

  console.log('\nMETAL EDGE FALLBACK PLAN VALIDATION PASSED');

  console.log(JSON.stringify({

    planPath,

    collectionName: plan.collectionName,

    totalPlanUpdates: plan.updates.length,

    selectedUpdates: updates.length,

    limit,

    shouldApply,

    confirmationProvided: Boolean(confirmation),

    byCompany: plan.summary?.byCompany || {}

  }, null, 2));

  const db = initDb();

  console.log('\nVerifying Firestore document existence...');

  const existence = await verifyDocs(db, plan.collectionName, updates);

  console.log(JSON.stringify(existence, null, 2));

  if (existence.missing > 0) {

    throw new Error('Missing Firestore docs. Apply blocked.');

  }

  if (!shouldApply) {

    console.log('\n✅ Dry run complete. No Firestore writes were attempted.');

    return;

  }

  if (confirmation !== CONFIRM) {

    throw new Error('Apply blocked. Required --confirm=' + CONFIRM);

  }

  console.log('\nApplying metal edge fallback promotion plan...');

  const written = await apply(db, plan.collectionName, updates);

  console.log('\n✅ Metal edge fallback promotion apply complete.');

  console.log(JSON.stringify({

    collection: plan.collectionName,

    written,

    fieldKeysUpdated: ALLOWED_KEYS

  }, null, 2));

}

main().catch((error) => {

  console.error('\nApply helper failed.');

  console.error(error);

  process.exit(1);

});

