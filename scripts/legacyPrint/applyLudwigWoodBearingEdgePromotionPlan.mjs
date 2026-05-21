import admin from 'firebase-admin'

import fs from 'fs'

import path from 'path'

const SERVICE_ACCOUNT_PATH = 'backend/serviceAccountKey-prod.json'

const COLLECTION_NAME = 'snareReferenceDrums'

const PLAN_FILE = 'src/legacyPrint/reviewPlans/ludwig-wood-bearing-edge-promotion-plan.json'

const APPLY_FLAG = '--apply'

const CONFIRM_FLAG = '--confirm=APPLY_LUDWIG_WOOD_BEARING_EDGE_PROMOTION'

const isApply = process.argv.includes(APPLY_FLAG)

const isConfirmed = process.argv.includes(CONFIRM_FLAG)

const nowIso = new Date().toISOString()

const safeNow = nowIso.replaceAll(':', '-').replaceAll('.', '-')

const ensureDir = (filePath) => {

  fs.mkdirSync(path.dirname(filePath), { recursive: true })

}

const normalize = (value) =>

  String(value || '')

    .trim()

    .toLowerCase()

    .replace(/\s+/g, ' ')

const loadJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'))

const serviceAccount = loadJson(SERVICE_ACCOUNT_PATH)

if (!admin.apps.length) {

  admin.initializeApp({

    credential: admin.credential.cert(serviceAccount)

  })

}

const db = admin.firestore()

const FieldValue = admin.firestore.FieldValue

const plan = loadJson(PLAN_FILE)

if (isApply && !isConfirmed) {

  console.error(`Refusing to apply without ${CONFIRM_FLAG}`)

  process.exit(1)

}

const promotionRows = plan.promotionRows || []

const expectedModels = promotionRows.flatMap((row) =>

  (row.models || []).map((modelName) => ({

    companyName: row.companyName,

    lineSeries: row.lineSeries,

    shellMaterial: row.shellMaterial,

    modelName,

    confirmedBearingEdge: row.confirmedBearingEdge,

    promotion: row.promotion

  }))

)

const expectedKeys = new Set(

  expectedModels.map((item) =>

    [

      normalize(item.companyName),

      normalize(item.lineSeries),

      normalize(item.modelName)

    ].join('||')

  )

)

const snapshot = await db.collection(COLLECTION_NAME).get()

const matchedDocs = []

const duplicateMatches = []

const unmatchedExpected = new Map(

  expectedModels.map((item) => [

    [

      normalize(item.companyName),

      normalize(item.lineSeries),

      normalize(item.modelName)

    ].join('||'),

    item

  ])

)

const seenDocKeys = new Map()

for (const doc of snapshot.docs) {

  const data = doc.data()

  const docKey = [

    normalize(data.companyName),

    normalize(data.lineSeries),

    normalize(data.modelName)

  ].join('||')

  if (!expectedKeys.has(docKey)) continue

  if (seenDocKeys.has(docKey)) {

    duplicateMatches.push({

      key: docKey,

      firstDocId: seenDocKeys.get(docKey),

      duplicateDocId: doc.id

    })

    continue

  }

  seenDocKeys.set(docKey, doc.id)

  const expected = unmatchedExpected.get(docKey)

  unmatchedExpected.delete(docKey)

  matchedDocs.push({

    docId: doc.id,

    key: docKey,

    current: {

      companyName: data.companyName || null,

      lineSeries: data.lineSeries || null,

      modelName: data.modelName || null,

      shellMaterial: data.shellMaterial || null,

      shellThicknessMm: data.shellThicknessMm ?? data.shellThicknessMM ?? null,

      bearingEdge: data.bearingEdge || null,

      fieldQualityTier: data.fieldQualityTier || null,

      bearingEdgeNeedsVerification: data.bearingEdgeNeedsVerification ?? null

    },

    update: {

      bearingEdge: expected.confirmedBearingEdge,

      fieldQualityTier: expected.promotion.fieldQualityTier,

      bearingEdgeNeedsVerification: expected.promotion.bearingEdgeNeedsVerification,

      engineAssumptions: expected.promotion.engineAssumptions

    }

  })

}

const report = {

  generatedAt: nowIso,

  mode: isApply ? 'APPLY' : 'DRY_RUN',

  collectionName: COLLECTION_NAME,

  planFile: PLAN_FILE,

  expectedModelCount: expectedModels.length,

  matchedDocCount: matchedDocs.length,

  unmatchedExpectedCount: unmatchedExpected.size,

  duplicateMatchCount: duplicateMatches.length,

  duplicateMatches,

  unmatchedExpected: [...unmatchedExpected.values()].map((item) => ({

    companyName: item.companyName,

    lineSeries: item.lineSeries,

    modelName: item.modelName

  })),

  matchedDocs

}

if (duplicateMatches.length > 0) {

  report.status = 'BLOCKED_DUPLICATE_MATCHES'

} else if (unmatchedExpected.size > 0) {

  report.status = 'BLOCKED_UNMATCHED_EXPECTED_MODELS'

} else if (!isApply) {

  report.status = 'DRY_RUN_READY_TO_APPLY'

} else {

  report.status = 'APPLIED'

}

if (isApply && report.status !== 'APPLIED') {

  const blockedFile = `tmp/legacyPrint-audits/ludwig-wood-bearing-edge-promotion-blocked-${safeNow}.json`

  ensureDir(blockedFile)

  fs.writeFileSync(blockedFile, JSON.stringify(report, null, 2) + '\n')

  console.log(JSON.stringify({

    status: report.status,

    blockedFile,

    expectedModelCount: report.expectedModelCount,

    matchedDocCount: report.matchedDocCount,

    unmatchedExpectedCount: report.unmatchedExpectedCount,

    duplicateMatchCount: report.duplicateMatchCount

  }, null, 2))

  process.exit(1)

}

if (isApply) {

  const batch = db.batch()

  for (const row of matchedDocs) {

    const ref = db.collection(COLLECTION_NAME).doc(row.docId)

    batch.set(ref, {

      bearingEdge: row.update.bearingEdge,

      fieldQualityTier: row.update.fieldQualityTier,

      bearingEdgeNeedsVerification: row.update.bearingEdgeNeedsVerification,

      engineAssumptions: {

        ...(row.update.engineAssumptions || {}),

        bearingEdgeSourceConfirmedAt: FieldValue.serverTimestamp()

      },

      updatedAt: FieldValue.serverTimestamp()

    }, { merge: true })

  }

  await batch.commit()

}

const outFile = isApply

  ? `tmp/legacyPrint-audits/ludwig-wood-bearing-edge-promotion-apply-${safeNow}.json`

  : `tmp/legacyPrint-audits/ludwig-wood-bearing-edge-promotion-dry-run-${safeNow}.json`

ensureDir(outFile)

fs.writeFileSync(outFile, JSON.stringify(report, null, 2) + '\n')

console.log(JSON.stringify({

  status: report.status,

  mode: report.mode,

  outFile,

  expectedModelCount: report.expectedModelCount,

  matchedDocCount: report.matchedDocCount,

  unmatchedExpectedCount: report.unmatchedExpectedCount,

  duplicateMatchCount: report.duplicateMatchCount

}, null, 2))