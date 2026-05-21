import admin from 'firebase-admin'

import fs from 'fs'

import path from 'path'

const SERVICE_ACCOUNT_PATH = 'backend/serviceAccountKey-prod.json'

const COLLECTION_NAME = 'snareReferenceDrums'

function parseMaybeJson(value) {

  if (!value) return null

  if (typeof value === 'object') return value

  if (typeof value !== 'string') return null

  try {

    return JSON.parse(value)

  } catch {

    return null

  }

}

function normalize(value) {

  return String(value || '').trim().toLowerCase()

}

function includesAny(value, terms) {

  const text = normalize(value)

  return terms.some((term) => text.includes(term))

}

function getShellConstruction(doc) {

  const shellConstruction = parseMaybeJson(doc.shellConstruction) || {}

  const shell = parseMaybeJson(doc.shell) || {}

  return {

    shellConstruction:

      doc.shellConstructionType ||

      shellConstruction.shellConstruction ||

      shell.shellConstruction ||

      shell.construction ||

      doc['SHELL CONSTRUCTION'] ||

      '',

    shellMaterial:

      doc.shellMaterial ||

      shellConstruction.shellMaterialPrimary ||

      shell.shellMaterialPrimary ||

      shell.material ||

      doc['SHELL MATERIAL 1'] ||

      ''

  }

}

function getShellThickness(doc) {

  const shellConstruction = parseMaybeJson(doc.shellConstruction) || {}

  const shell = parseMaybeJson(doc.shell) || {}

  const raw =

    doc.shellThickness ||

    doc.shellThicknessMm ||

    shellConstruction.shellThicknessMm ||

    shell.shellThicknessMm ||

    doc['SHELL THICKNESS (mm)'] ||

    ''

  const num = Number(raw)

  return {

    raw,

    num,

    isValid: Number.isFinite(num) && num > 0

  }

}

function getBearingEdge(doc) {

  return parseMaybeJson(doc.bearingEdge) || doc.bearingEdge || null

}

function isFallbackBearingEdge(edge) {

  if (!edge || typeof edge !== 'object') return false

  return (

    edge.evidenceLevel === 'metalShellFallback' ||

    edge.confidence === 'fallback' ||

    edge.needsVerification === true

  )

}

function getEngineAssumptions(doc) {

  return parseMaybeJson(doc.engineAssumptions) || doc.engineAssumptions || {}

}

function isMetalShell(doc) {

  const { shellConstruction, shellMaterial } = getShellConstruction(doc)

  const metalTerms = [

    'metal',

    'steel',

    'brass',

    'bronze',

    'copper',

    'aluminum',

    'aluminium',

    'titanium',

    'magnesium',

    'bell brass',

    'stainless',

    'nickel',

    'cobalt'

  ]

  const constructionTerms = [

    'metal',

    'cast metal',

    'cast',

    'spun',

    'rolled',

    'seamless',

    'welded',

    'solid shell'

  ]

  return includesAny(shellMaterial, metalTerms) || includesAny(shellConstruction, constructionTerms)

}

function validateRecord(doc) {

  const edge = getBearingEdge(doc)

  const assumptions = getEngineAssumptions(doc)

  const thickness = getShellThickness(doc)

  const shellInfo = getShellConstruction(doc)

  const issues = []

  if (!isFallbackBearingEdge(edge)) {

    issues.push('bearingEdge is not marked as metalShellFallback/fallback/needsVerification')

  }

  if (!isMetalShell(doc)) {

    issues.push('record does not appear to be a metal shell')

  }

  if (!thickness.isValid) {

    issues.push('missing valid numeric shell thickness')

  }

  if (!doc.primarySourceUrl) {

    issues.push('missing primarySourceUrl')

  }

  if (!doc.sourceConfidence) {

    issues.push('missing sourceConfidence')

  }

  if (doc.fieldQualityTier !== 'MEANINGFUL_CORE_SHELL_PASS_WITH_METAL_EDGE_FALLBACK') {

    issues.push('fieldQualityTier is not MEANINGFUL_CORE_SHELL_PASS_WITH_METAL_EDGE_FALLBACK')

  }

  if (doc.bearingEdgeQualityTier !== 'PLACEHOLDER_OR_UNKNOWN_BEARING_EDGE') {

    issues.push('bearingEdgeQualityTier is not PLACEHOLDER_OR_UNKNOWN_BEARING_EDGE')

  }

  if (assumptions.bearingEdgeFallbackApplied !== true) {

    issues.push('engineAssumptions.bearingEdgeFallbackApplied is not true')

  }

  if (assumptions.bearingEdgeNeedsVerification !== true) {

    issues.push('engineAssumptions.bearingEdgeNeedsVerification is not true')

  }

  return {

    id: doc.id,

    label: `${doc.companyName || 'Unknown'} — ${doc.lineSeries || 'Unknown'} — ${doc.modelName || 'Unknown'} — ${doc.diameter || '?'}x${doc.depth || '?'}`,

    companyName: doc.companyName || '',

    lineSeries: doc.lineSeries || '',

    modelName: doc.modelName || '',

    diameter: doc.diameter || '',

    depth: doc.depth || '',

    shellMaterial: shellInfo.shellMaterial,

    shellConstruction: shellInfo.shellConstruction,

    shellThickness: thickness.raw,

    primarySourceUrl: doc.primarySourceUrl || '',

    sourceConfidence: doc.sourceConfidence || '',

    fieldQualityTier: doc.fieldQualityTier || '',

    bearingEdgeQualityTier: doc.bearingEdgeQualityTier || '',

    engineAssumptions: assumptions,

    bearingEdge: edge,

    issueCount: issues.length,

    issues

  }

}

async function main() {

  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'))

  if (!admin.apps.length) {

    admin.initializeApp({

      credential: admin.credential.cert(serviceAccount)

    })

  }

  const db = admin.firestore()

  const snapshot = await db.collection(COLLECTION_NAME).get()

  const fallbackRecords = []

  const invalidFallbackRecords = []

  snapshot.forEach((docSnap) => {

    const data = { id: docSnap.id, ...docSnap.data() }

    const edge = getBearingEdge(data)

    const assumptions = getEngineAssumptions(data)

    const isFallback =

      data.fieldQualityTier === 'MEANINGFUL_CORE_SHELL_PASS_WITH_METAL_EDGE_FALLBACK' ||

      isFallbackBearingEdge(edge) ||

      assumptions.bearingEdgeFallbackApplied === true

    if (!isFallback) return

    const result = validateRecord(data)

    fallbackRecords.push(result)

    if (result.issueCount > 0) {

      invalidFallbackRecords.push(result)

    }

  })

  const validFallbackRecords = fallbackRecords.filter((record) => record.issueCount === 0)

  const byCompany = fallbackRecords.reduce((acc, record) => {

    const key = record.companyName || 'Unknown'

    acc[key] ||= {

      companyName: key,

      recordCount: 0,

      invalidRecordCount: 0

    }

    acc[key].recordCount += 1

    if (record.issueCount > 0) acc[key].invalidRecordCount += 1

    return acc

  }, {})

  const output = {

    generatedAt: new Date().toISOString(),

    status: 'METAL_EDGE_FALLBACK_POLICY_VALIDATION_READ_ONLY',

    collection: COLLECTION_NAME,

    summary: {

      fallbackRecordCount: fallbackRecords.length,

      validFallbackRecordCount: validFallbackRecords.length,

      invalidFallbackRecordCount: invalidFallbackRecords.length,

      allFallbackRecordsValid: invalidFallbackRecords.length === 0,

      noFirestoreWrites: true

    },

    byCompany: Object.values(byCompany).sort((a, b) => b.recordCount - a.recordCount),

    invalidFallbackRecords,

    sampleValidFallbackRecords: validFallbackRecords.slice(0, 25)

  }

  const outDir = 'tmp/legacyPrint-audits'

  fs.mkdirSync(outDir, { recursive: true })

  const outFile = path.join(

    outDir,

    `metal-edge-fallback-policy-validation-${new Date().toISOString().replace(/[:.]/g, '-')}.json`

  )

  fs.writeFileSync(outFile, JSON.stringify(output, null, 2) + '\n')

  console.log(JSON.stringify({

    outFile,

    status: output.status,

    summary: output.summary,

    topCompanies: output.byCompany.slice(0, 12)

  }, null, 2))

}

main().catch((error) => {

  console.error(error)

  process.exit(1)

})