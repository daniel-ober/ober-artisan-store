import fs from 'fs'

import admin from 'firebase-admin'

const PLAN_FILE = 'src/legacyPrint/reviewPlans/second-pass-metal-edge-fallback-promotion-plan.json'

const COLLECTION = 'snareReferenceDrums'

const CONFIRM_FLAG = '--confirm=APPLY_SECOND_PASS_METAL_EDGE_FALLBACK'

const APPLY_FLAG = '--apply'

const shouldApply = process.argv.includes(APPLY_FLAG)

const hasConfirm = process.argv.includes(CONFIRM_FLAG)

if (shouldApply && !hasConfirm) {

  throw new Error(`Refusing to write. Re-run with ${APPLY_FLAG} ${CONFIRM_FLAG}`)

}

if (!fs.existsSync(PLAN_FILE)) {

  throw new Error(`Missing plan file: ${PLAN_FILE}`)

}

const plan = JSON.parse(fs.readFileSync(PLAN_FILE, 'utf8'))

const promote = Array.isArray(plan.promote) ? plan.promote : []

if (!promote.length) {

  throw new Error('No promote rows found in promotion plan.')

}

const serviceAccountPath = 'backend/serviceAccountKey-prod.json'

if (!fs.existsSync(serviceAccountPath)) {

  throw new Error(`Missing Firebase service account file: ${serviceAccountPath}`)

}

if (!admin.apps.length) {

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))

  admin.initializeApp({

    credential: admin.credential.cert(serviceAccount)

  })

}

const db = admin.firestore()

function mergeEngineAssumptions(existing, patch) {

  const existingAssumptions =

    existing && typeof existing.engineAssumptions === 'object' && !Array.isArray(existing.engineAssumptions)

      ? existing.engineAssumptions

      : {}

  return {

    ...existingAssumptions,

    ...patch

  }

}

async function main() {

  const results = []

  const missingDocs = []

  for (const row of promote) {

    const ref = db.collection(COLLECTION).doc(row.id)

    const snap = await ref.get()

    if (!snap.exists) {

      missingDocs.push({

        id: row.id,

        label: row.label

      })

      continue

    }

    const data = snap.data() || {}

    const updates = row.updates || {}

    const writePayload = {

      fieldQualityTier: updates.fieldQualityTier,

      bearingEdgeNeedsVerification: true,

      engineAssumptions: mergeEngineAssumptions(

        data,

        updates.engineAssumptions || {

          bearingEdgeFallbackApplied: true,

          bearingEdgeFallbackKey: 'metal-shell-generic-machined-or-formed-edge-needs-verification',

          bearingEdgeFallbackReason: 'Second-pass metal-shell fallback: valid numeric shell thickness, confirmed metal shell, source URL/confidence present, and bearing edge remains unknown/placeholder.',

          bearingEdgeNeedsVerification: true

        }

      ),

      updatedAt: admin.firestore.FieldValue.serverTimestamp()

    }

    results.push({

      id: row.id,

      label: row.label,

      previousFieldQualityTier: data.fieldQualityTier || null,

      nextFieldQualityTier: writePayload.fieldQualityTier,

      previousBearingEdgeNeedsVerification: data.bearingEdgeNeedsVerification ?? null,

      nextBearingEdgeNeedsVerification: true,

      sourceConfidence: row.sourceConfidence,

      primarySourceUrl: row.primarySourceUrl

    })

    if (shouldApply) {

      await ref.set(writePayload, { merge: true })

    }

  }

  const report = {

    generatedAt: new Date().toISOString(),

    mode: shouldApply ? 'APPLY_WRITES_COMPLETED' : 'DRY_RUN_NO_WRITES',

    sourcePlanFile: PLAN_FILE,

    collection: COLLECTION,

    promoteRowsInPlan: promote.length,

    docsFound: results.length,

    missingDocs: missingDocs.length,

    missingDocsList: missingDocs,

    results

  }

  const outFile = shouldApply

    ? 'tmp/legacyPrint-audits/second-pass-metal-edge-fallback-apply-report-latest.json'

    : 'tmp/legacyPrint-audits/second-pass-metal-edge-fallback-dry-run-latest.json'

  fs.mkdirSync('tmp/legacyPrint-audits', { recursive: true })

  fs.writeFileSync(outFile, JSON.stringify(report, null, 2) + '\n')

  console.log(JSON.stringify({

    mode: report.mode,

    promoteRowsInPlan: report.promoteRowsInPlan,

    docsFound: report.docsFound,

    missingDocs: report.missingDocs,

    wrote: outFile

  }, null, 2))

}

main()

  .then(() => process.exit(0))

  .catch((error) => {

    console.error(error)

    process.exit(1)

  })

