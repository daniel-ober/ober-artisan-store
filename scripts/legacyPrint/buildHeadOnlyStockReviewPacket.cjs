
const fs = require('fs');

const path = require('path');

const auditDir = 'tmp/legacyPrint-audits';

const reviewDir = 'src/legacyPrint/reviewPlans';

function latestAudit(prefix) {

  const file = fs.readdirSync(auditDir)

    .filter((name) => name.startsWith(prefix) && name.endsWith('.json'))

    .sort()

    .reverse()[0];

  return file ? path.join(auditDir, file) : null;

}

function hostFromUrl(url) {

  try {

    return new URL(url).hostname.replace(/^www\./, '');

  } catch {

    return 'unknown';

  }

}

function clean(value) {

  if (value === undefined || value === null) return '';

  if (typeof value === 'string') return value.trim();

  return JSON.stringify(value);

}

function countBy(rows, keyFn) {

  return rows.reduce((acc, row) => {

    const key = keyFn(row) || 'Unknown';

    acc[key] = (acc[key] || 0) + 1;

    return acc;

  }, {});

}

const latestPassablePath = latestAudit('strict-passable-readiness-');

if (!latestPassablePath) throw new Error('Missing latest strict passable audit.');

const audit = JSON.parse(fs.readFileSync(latestPassablePath, 'utf8'));

const rows = Array.isArray(audit.allRows) ? audit.allRows : [];

const headOnly = rows

  .filter((row) => row.stockTier === 'NEARLY_PASSABLE_STOCK')

  .filter((row) => {

    const missing = row.missingForStock || [];

    return missing.length > 0 && missing.every((field) =>

      ['stock batter head', 'stock reso head'].includes(field)

    );

  })

  .sort((a, b) => {

    const company = clean(a.companyName).localeCompare(clean(b.companyName));

    if (company !== 0) return company;

    const line = clean(a.lineSeries).localeCompare(clean(b.lineSeries));

    if (line !== 0) return line;

    return clean(a.modelName).localeCompare(clean(b.modelName));

  });

const groupsMap = new Map();

for (const row of headOnly) {

  const key = [

    row.companyName || 'Unknown',

    row.lineSeries || 'Unknown Line',

    (row.missingForStock || []).join(' + ')

  ].join(' || ');

  if (!groupsMap.has(key)) {

    groupsMap.set(key, {

      companyName: row.companyName || 'Unknown',

      lineSeries: row.lineSeries || 'Unknown Line',

      missingCombo: (row.missingForStock || []).join(' + '),

      candidateCount: 0,

      sourceHosts: {},

      sourceConfidenceValues: {},

      candidateIds: [],

      sampleCandidates: [],

      manualApprovalFields: {

        approvedStockBatterHead: '',

        approvedStockResoHead: '',

        approvedFallbackKey: '',

        approvedFallbackReason: '',

        reviewerNotes: '',

        approvedForFirestoreWrite: false

      }

    });

  }

  const group = groupsMap.get(key);

  group.candidateCount += 1;

  group.sourceHosts[hostFromUrl(row.primarySourceUrl)] =

    (group.sourceHosts[hostFromUrl(row.primarySourceUrl)] || 0) + 1;

  group.sourceConfidenceValues[row.sourceConfidence || ''] =

    (group.sourceConfidenceValues[row.sourceConfidence || ''] || 0) + 1;

  group.candidateIds.push(row.id);

  if (group.sampleCandidates.length < 15) {

    group.sampleCandidates.push({

      id: row.id,

      label: row.label,

      modelName: row.modelName,

      diameter: row.diameter,

      depth: row.depth,

      stockBatterHead: row.stockBatterHead,

      stockResoHead: row.stockResoHead,

      stockSnareWires: row.stockSnareWires,

      hoopType: row.hoopType,

      productionStatus: row.productionStatus,

      primarySourceUrl: row.primarySourceUrl,

      sourceHost: hostFromUrl(row.primarySourceUrl),

      sourceConfidence: row.sourceConfidence

    });

  }

}

const groups = Array.from(groupsMap.values()).sort((a, b) => {

  const count = b.candidateCount - a.candidateCount;

  if (count !== 0) return count;

  const company = a.companyName.localeCompare(b.companyName);

  if (company !== 0) return company;

  return a.lineSeries.localeCompare(b.lineSeries);

});

const byCompany = countBy(headOnly, (row) => row.companyName);

const byMissingCombo = countBy(headOnly, (row) => (row.missingForStock || []).join(' + '));

const bySourceHost = countBy(headOnly, (row) => hostFromUrl(row.primarySourceUrl));

const outFile = path.join(reviewDir, 'head-only-stock-readiness-review-packet.json');

const mdFile = path.join(reviewDir, 'head-only-stock-readiness-review-packet.md');

const output = {

  status: 'HEAD_ONLY_STOCK_READINESS_REVIEW_PACKET_NO_FIRESTORE_WRITES',

  generatedAt: new Date().toISOString(),

  sourceAuditFile: latestPassablePath,

  collectionName: 'snareReferenceDrums',

  noFirestoreWrites: true,

  summary: {

    candidateCount: headOnly.length,

    groupCount: groups.length,

    byCompany,

    byMissingCombo,

    bySourceHost,

    firestoreWrites: 0

  },

  rules: [

    'No Firestore writes are performed.',

    'These rows are missing only stock batter/reso head fields.',

    'Production status is not a blocker for this lane.',

    'Exact stock head values must be approved before patch plans.',

    'Future writes must use stock-head fallback metadata and a distinct readiness tier.'

  ],

  groups,

  candidates: headOnly.map((row) => ({

    id: row.id,

    label: row.label,

    companyName: row.companyName,

    lineSeries: row.lineSeries,

    modelName: row.modelName,

    diameter: row.diameter,

    depth: row.depth,

    stockTier: row.stockTier,

    coreShellTier: row.coreShellTier,

    missingForStock: row.missingForStock,

    stockBatterHead: row.stockBatterHead,

    stockResoHead: row.stockResoHead,

    stockSnareWires: row.stockSnareWires,

    hoopType: row.hoopType,

    productionStatus: row.productionStatus,

    primarySourceUrl: row.primarySourceUrl,

    sourceHost: hostFromUrl(row.primarySourceUrl),

    sourceConfidence: row.sourceConfidence

  }))

};

const lines = [

  '# Head-Only Stock Readiness Review Packet',

  '',

  `Generated: ${output.generatedAt}`,

  '',

  `Candidates: ${output.summary.candidateCount}`,

  `Groups: ${output.summary.groupCount}`,

  '',

  '## By Company',

  '',

  '```json',

  JSON.stringify(byCompany, null, 2),

  '```',

  '',

  '## Groups',

  ''

];

for (const group of groups) {

  lines.push(`### ${group.companyName} — ${group.lineSeries}`);

  lines.push('');

  lines.push(`Candidates: ${group.candidateCount}`);

  lines.push('');

  lines.push(`Missing: ${group.missingCombo}`);

  lines.push('');

  lines.push('Source hosts:');

  lines.push('');

  lines.push('```json');

  lines.push(JSON.stringify(group.sourceHosts, null, 2));

  lines.push('```');

  lines.push('');

  lines.push('Manual approval fields:');

  lines.push('');

  lines.push('- approvedStockBatterHead: ');

  lines.push('- approvedStockResoHead: ');

  lines.push('- approvedFallbackKey: ');

  lines.push('- approvedFallbackReason: ');

  lines.push('- reviewerNotes: ');

  lines.push('- approvedForFirestoreWrite: false');

  lines.push('');

}

fs.writeFileSync(outFile, `${JSON.stringify(output, null, 2)}\n`);

fs.writeFileSync(mdFile, `${lines.join('\n')}\n`);

console.log(JSON.stringify({

  outFile,

  mdFile,

  status: output.status,

  candidateCount: output.summary.candidateCount,

  groupCount: output.summary.groupCount,

  byCompany: output.summary.byCompany,

  byMissingCombo: output.summary.byMissingCombo,

  firestoreWrites: output.summary.firestoreWrites

}, null, 2));

