
const fs = require('fs');

const path = require('path');

const reviewDir = 'src/legacyPrint/reviewPlans';

const sourcePacketPath = 'src/legacyPrint/reviewPlans/head-only-ludwig-source-evidence-packet.json';

const packet = JSON.parse(fs.readFileSync(sourcePacketPath, 'utf8'));

const groups = packet.groups || [];

function uniq(values) {

  return Array.from(new Set(values.filter(Boolean)));

}

function snippetText(sample) {

  return (sample.snippets || [])

    .map((snippet) => `${snippet.term} ${snippet.snippet}`)

    .join(' ')

    .replace(/\s+/g, ' ')

    .trim();

}

const HEAD_PATTERNS = [

  {

    label: 'Ludwig Weather Master Heavy Coated',

    batter: [/weather master heavy coated/i, /weathermaster heavy coated/i, /heavy coated/i],

    reso: []

  },

  {

    label: 'Ludwig Weather Master Medium Coated',

    batter: [/weather master medium coated/i, /weathermaster medium coated/i, /medium coated/i],

    reso: []

  },

  {

    label: 'Ludwig Weather Master X-Thin Snare Side',

    batter: [],

    reso: [/x-thin snare/i, /x thin snare/i, /weather master.*snare side/i, /weathermaster.*snare side/i]

  },

  {

    label: 'Remo Coated Ambassador',

    batter: [/coated ambassador/i, /ambassador coated/i],

    reso: []

  },

  {

    label: 'Remo Ambassador Snare Side',

    batter: [],

    reso: [/ambassador snare side/i, /snare side ambassador/i]

  },

  {

    label: 'Remo Hazy Ambassador',

    batter: [],

    reso: [/hazy ambassador/i, /ambassador hazy/i]

  }

];

function extractHeads(text) {

  const batter = [];

  const reso = [];

  const matched = [];

  for (const pattern of HEAD_PATTERNS) {

    if (pattern.batter.some((regex) => regex.test(text))) {

      batter.push(pattern.label);

      matched.push(`${pattern.label}:batter`);

    }

    if (pattern.reso.some((regex) => regex.test(text))) {

      reso.push(pattern.label);

      matched.push(`${pattern.label}:reso`);

    }

  }

  return {

    batter: uniq(batter),

    reso: uniq(reso),

    matched: uniq(matched)

  };

}

const strongGroups = groups.filter(

  (group) => group.evidenceTier === 'SOURCE_PAGE_HAS_BATTER_AND_RESO_HEAD_EVIDENCE'

);

const decisions = [];

for (const group of strongGroups) {

  for (const sample of group.sampleCandidates || []) {

    const text = snippetText(sample);

    const extracted = extractHeads(text);

    let extractionDecision = 'NEEDS_MANUAL_EXACT_HEAD_REVIEW';

    if (extracted.batter.length === 1 && extracted.reso.length === 1) {

      extractionDecision = 'AUTO_PATCHABLE_EXACT_BATTER_AND_RESO';

    } else if (extracted.batter.length || extracted.reso.length) {

      extractionDecision = 'PARTIAL_OR_AMBIGUOUS_HEAD_MATCH';

    }

    decisions.push({

      id: sample.id,

      companyName: 'Ludwig',

      lineSeries: group.lineSeries,

      modelName: sample.modelName,

      diameter: sample.diameter,

      depth: sample.depth,

      primarySourceUrl: sample.primarySourceUrl,

      evidenceTier: sample.evidenceTier,

      extractedStockBatterHead: extracted.batter.length === 1 ? extracted.batter[0] : null,

      extractedStockResoHead: extracted.reso.length === 1 ? extracted.reso[0] : null,

      extractedBatterCandidates: extracted.batter,

      extractedResoCandidates: extracted.reso,

      extractionMatchedKeys: extracted.matched,

      extractionDecision,

      snippets: sample.snippets || [],

      approvedForFirestoreWrite: false

    });

  }

}

const patchable = decisions.filter(

  (row) => row.extractionDecision === 'AUTO_PATCHABLE_EXACT_BATTER_AND_RESO'

);

const ambiguous = decisions.filter(

  (row) => row.extractionDecision !== 'AUTO_PATCHABLE_EXACT_BATTER_AND_RESO'

);

const patchPlan = {

  status: 'LUDWIG_HEAD_ONLY_EXACT_HEAD_PATCH_PLAN_REQUIRES_APPROVAL',

  generatedAt: new Date().toISOString(),

  sourcePacketFile: sourcePacketPath,

  collectionName: 'snareReferenceDrums',

  approvedForFirestoreWrite: false,

  requiredEnvApproval: `LEGACYPRINT_APPROVE_FIRESTORE_WRITE=ludwig-head-only-exact-${patchable.length}`,

  summary: {

    patchCount: patchable.length,

    ambiguousCount: ambiguous.length,

    firestoreWritesIfApproved: patchable.length,

    firestoreWritesPerformed: 0

  },

  safetyRules: [

    'No Firestore writes are performed by this plan.',

    'Only rows with one exact batter and one exact reso extraction are patchable.',

    'Writes must mark stock heads as fallback/source-page extracted, not source-confirmed catalog fields.'

  ],

  patches: patchable.map((row) => ({

    id: row.id,

    companyName: row.companyName,

    lineSeries: row.lineSeries,

    modelName: row.modelName,

    diameter: row.diameter,

    depth: row.depth,

    primarySourceUrl: row.primarySourceUrl,

    extractedStockBatterHead: row.extractedStockBatterHead,

    extractedStockResoHead: row.extractedStockResoHead,

    extractionMatchedKeys: row.extractionMatchedKeys,

    evidenceSnippets: row.snippets.slice(0, 8),

    updates: {

      stockBatterHead: row.extractedStockBatterHead,

      stockBatterHeadConfidence: 'Fallback / Source-page extracted',

      stockResoHead: row.extractedStockResoHead,

      stockResoHeadConfidence: 'Fallback / Source-page extracted',

      stockHeadFallbackApplied: true,

      stockHeadFallbackKey: 'LUDWIG_HEAD_ONLY_SOURCE_PAGE_EXACT_EXTRACTION',

      stockHeadFallbackReason:

        'Exact Ludwig stock batter and resonant/snare-side head values were extracted from source-page evidence snippets in the head-only review lane.',

      stockHeadNeedsVerification: true,

      stockHeadSourceConfirmed: false,

      stockReadinessTier: 'MEANINGFUL_STOCK_PASS_WITH_HEAD_FALLBACK',

      legacyPrintStockReadinessUpdateSource:

        'ludwig-head-only-exact-head-patch-plan.json',

      legacyPrintStockReadinessUpdateType:

        'LUDWIG_HEAD_ONLY_EXACT_SOURCE_BACKED_FALLBACK_PATCH'

    }

  }))

};

const extractionPacket = {

  status: 'LUDWIG_HEAD_ONLY_EXACT_EXTRACTION_PACKET_NO_FIRESTORE_WRITES',

  generatedAt: new Date().toISOString(),

  sourcePacketFile: sourcePacketPath,

  collectionName: 'snareReferenceDrums',

  noFirestoreWrites: true,

  summary: {

    candidateCount: decisions.length,

    patchableCount: patchable.length,

    ambiguousCount: ambiguous.length,

    byExtractionDecision: decisions.reduce((acc, row) => {

      acc[row.extractionDecision] = (acc[row.extractionDecision] || 0) + 1;

      return acc;

    }, {}),

    firestoreWrites: 0

  },

  patchable,

  ambiguous,

  decisions

};

const extractionFile = path.join(reviewDir, 'ludwig-head-only-exact-extraction-packet.json');

const patchPlanFile = path.join(reviewDir, 'ludwig-head-only-exact-head-patch-plan.json');

fs.writeFileSync(extractionFile, `${JSON.stringify(extractionPacket, null, 2)}\n`);

fs.writeFileSync(patchPlanFile, `${JSON.stringify(patchPlan, null, 2)}\n`);

console.log(JSON.stringify({

  extractionFile,

  patchPlanFile,

  extractionStatus: extractionPacket.status,

  patchPlanStatus: patchPlan.status,

  candidateCount: extractionPacket.summary.candidateCount,

  patchableCount: extractionPacket.summary.patchableCount,

  ambiguousCount: extractionPacket.summary.ambiguousCount,

  requiredEnvApproval: patchPlan.requiredEnvApproval,

  firestoreWrites: 0

}, null, 2));

