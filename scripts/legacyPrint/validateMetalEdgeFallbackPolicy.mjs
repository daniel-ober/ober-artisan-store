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

function flattenTextParts(parts) {

  return parts

    .filter((part) => part !== null && part !== undefined)

    .map((part) => {

      if (typeof part === 'object') return JSON.stringify(part)

      return String(part)

    })

    .join(' ')

}

function getShellConstruction(doc) {

  const shellConstruction =

    parseMaybeJson(doc.shellConstruction) ||

    parseMaybeJson(doc.shellConstructionData) ||

    {}

  const shell =

    parseMaybeJson(doc.shell) ||

    parseMaybeJson(doc.shellData) ||

    {}

  return {

    rawShellConstruction: shellConstruction,

    rawShell: shell,

    shellConstructionText: flattenTextParts([

      doc.shellConstructionType,

      doc.shellConstruction,

      doc.shellConstructionData,

      shellConstruction.shellConstruction,

      shellConstruction.construction,

      shell.shellConstruction,

      shell.construction,

      doc['SHELL CONSTRUCTION'],

      doc.modelName,

      doc.lineSeries,

      doc.id

    ]),

    shellMaterialText: flattenTextParts([

      doc.shellMaterial,

      doc.shellMaterialPrimary,

      doc.shellMaterials,

      doc.shellConstruction,

      doc.shellConstructionData,

      shellConstruction.shellMaterialPrimary,

      shellConstruction.shellMaterialSecondary,

      shellConstruction.shellMaterialTertiary,

      shellConstruction.shellMaterial,

      shell.material,

      shell.shellMaterialPrimary,

      doc['SHELL MATERIAL 1'],

      doc['SHELL MATERIAL 2'],

      doc['SHELL MATERIAL 3'],

      doc.modelName,

      doc.lineSeries,

      doc.id

    ])

  }

}

function getShellThickness(doc) {

  const shellConstruction =

    parseMaybeJson(doc.shellConstruction) ||

    parseMaybeJson(doc.shellConstructionData) ||

    {}

  const shell =

    parseMaybeJson(doc.shell) ||

    parseMaybeJson(doc.shellData) ||

    {}

  const raw =

    doc.shellThickness ??

    doc.shellThicknessMm ??

    shellConstruction.shellThicknessMm ??

    shellConstruction.thicknessMm ??

    shell.shellThicknessMm ??

    shell.thicknessMm ??

    doc['SHELL THICKNESS (mm)'] ??

    ''

  const num = Number(raw)

  return {

    raw,

    num,

    isValid: Number.isFinite(num) && num > 0

  }

}

function getBearingEdge(doc) {

  return (

    parseMaybeJson(doc.bearingEdge) ||

    parseMaybeJson(doc.edgeProfile) ||

    doc.bearingEdge ||

    doc.edgeProfile ||

    null

  )

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

function getSourceUrls(doc) {

  const urls = []

  const pushValue = (value) => {

    if (!value) return

    if (typeof value === 'string') {

      if (value.startsWith('http')) urls.push(value)

      return

    }

    if (Array.isArray(value)) {

      value.forEach(pushValue)

      return

    }

    if (typeof value === 'object') {

      Object.values(value).forEach(pushValue)

    }

  }

  pushValue(doc.primarySourceUrl)

  pushValue(doc.primarySourceURL)

  pushValue(doc.sourceUrl)

  pushValue(doc.sourceURL)

  pushValue(doc.sourceUrls)

  pushValue(doc.sourceURLs)

  pushValue(doc.sources)

  pushValue(doc.primarySources)

  pushValue(doc.secondarySourceUrl)

  pushValue(doc.secondarySourceUrls)

  pushValue(doc['PRIMARY SOURCE URL'])

  pushValue(doc['SECONDARY SOURCE URL'])

  return [...new Set(urls)]

}

function isMetalShell(doc) {

  const shellInfo = getShellConstruction(doc)

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

    'cobalt',

    'chrome over brass',

    'cob',

    'black brass'

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

  return (

    includesAny(shellInfo.shellMaterialText, metalTerms) ||

    includesAny(shellInfo.shellConstructionText, constructionTerms)

  )

}

function hasFallbackPolicyMarkers(doc, edge, assumptions) {

  return (

    doc.fieldQualityTier === 'MEANINGFUL_CORE_SHELL_PASS_WITH_METAL_EDGE_FALLBACK' ||

    isFallbackBearingEdge(edge) ||

    assumptions.bearingEdgeFallbackApplied === true

  )

}

function validateRecord(doc) {

  const edge = getBearingEdge(doc)

  const assumptions = getEngineAssumptions(doc)

  const thickness = getShellThickness(doc)

  const shellInfo = getShellConstruction(doc)

  const sourceUrls = getSourceUrls(doc)

  const issues = []

  if (!hasFallbackPolicyMarkers(doc, edge, assumptions)) {

    issues.push('missing fallback policy marker')

  }

  if (!isMetalShell(doc)) {

    issues.push('record does not appear to be a metal shell')

  }

  if (!thickness.isValid) {

    issues.push('missing valid numeric shell thickness')

  }

  if (!sourceUrls.length) {

    issues.push('missing source URL')

  }

  if (!doc.sourceConfidence) {

    issues.push('missing sourceConfidence')

  }

  if (doc.fieldQualityTier !== 'MEANINGFUL_CORE_SHELL_PASS_WITH_METAL_EDGE_FALLBACK') {

    issues.push('fieldQualityTier is not MEANINGFUL_CORE_SHELL_PASS_WITH_METAL_EDGE_FALLBACK')

  }

  return {

    id: doc.id,

    label: `${doc.companyName || 'Unknown'} — ${doc.lineSeries || 'Unknown'} — ${doc.modelName || 'Unknown'} — ${doc.diameter || '?'}x${doc.depth || '?'}`,

    companyName: doc.companyName || '',

    lineSeries: doc.lineSeries || '',

    modelName: doc.modelName || '',

    diameter: doc.diameter || '',

    depth: doc.depth || '',

    shellMaterials: shellInfo.shellMaterialText,

    shellConstruction: shellInfo.rawShellConstruction,

    shellConstructionText: shellInfo.shellConstructionText,

    shellThickness: thickness.raw,

    sourceUrls,

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

  const issueCounts = invalidFallbackRecords.reduce((acc, record) => {

    record.issues.forEach((issue) => {

      acc[issue] = (acc[issue] || 0) + 1

    })

    return acc

  }, {})

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

    issueCounts: Object.entries(issueCounts)

      .map(([issue, count]) => ({ issue, count }))

      .sort((a, b) => b.count - a.count),

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

    issueCounts: output.issueCounts,

    topCompanies: output.byCompany.slice(0, 12)

  }, null, 2))

}

main().catch((error) => {

  console.error(error)

  process.exit(1)

})