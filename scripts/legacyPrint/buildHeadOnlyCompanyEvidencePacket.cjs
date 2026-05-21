
const fs = require('fs');

const path = require('path');

const reviewDir = 'src/legacyPrint/reviewPlans';

const packetPath = 'src/legacyPrint/reviewPlans/head-only-stock-readiness-review-packet.json';

const companyArg = process.argv[2];

if (!companyArg) {

  throw new Error('Usage: node scripts/legacyPrint/buildHeadOnlyCompanyEvidencePacket.cjs "Ludwig"');

}

const packet = JSON.parse(fs.readFileSync(packetPath, 'utf8'));

const candidates = (packet.candidates || []).filter((row) => row.companyName === companyArg);

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

function stripHtml(html) {

  return String(html || '')

    .replace(/<script[\s\S]*?<\/script>/gi, ' ')

    .replace(/<style[\s\S]*?<\/style>/gi, ' ')

    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')

    .replace(/<[^>]+>/g, ' ')

    .replace(/&nbsp;/g, ' ')

    .replace(/&amp;/g, '&')

    .replace(/&#039;/g, "'")

    .replace(/&quot;/g, '"')

    .replace(/\s+/g, ' ')

    .trim();

}

function titleFromHtml(html) {

  const match = String(html || '').match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  return match ? stripHtml(match[1]).slice(0, 240) : '';

}

const HEAD_TERMS = [

  'remo',

  'evans',

  'aquarian',

  'ambassador',

  'emperor',

  'diplomat',

  'powerstroke',

  'controlled sound',

  'coated',

  'clear',

  'hazy',

  'snare side',

  'resonant',

  'resonance',

  'batter',

  'drumhead',

  'drum head',

  'head',

  'heads',

  'ludwig weather master',

  'weathermaster',

  'weather master',

  'heavy coated',

  'medium coated',

  'x-thin snare'

];

function snippetsForTerms(text, terms) {

  const lower = text.toLowerCase();

  const snippets = [];

  for (const term of terms) {

    let index = lower.indexOf(term);

    while (index !== -1 && snippets.length < 30) {

      const start = Math.max(0, index - 180);

      const end = Math.min(text.length, index + term.length + 260);

      const snippet = text.slice(start, end).replace(/\s+/g, ' ').trim();

      if (!snippets.some((item) => item.snippet === snippet)) {

        snippets.push({ term, snippet });

      }

      index = lower.indexOf(term, index + term.length);

    }

  }

  return snippets;

}

function classifyEvidence(snippets) {

  const text = snippets.map((item) => item.snippet).join(' ').toLowerCase();

  const hasBrand = /\b(remo|evans|aquarian|ludwig)\b/.test(text);

  const hasSpecificModel =

    /ambassador|emperor|diplomat|powerstroke|controlled sound|hazy|snare side|weather master|weathermaster|heavy coated|medium coated|x-thin snare/.test(text);

  const hasBatterLanguage =

    /batter|top head|coated|controlled sound|powerstroke|emperor|heavy coated|medium coated/.test(text);

  const hasResoLanguage =

    /reso|resonant|snare side|hazy|bottom head|diplomat|x-thin snare/.test(text);

  if (hasBrand && hasSpecificModel && hasBatterLanguage && hasResoLanguage) {

    return 'SOURCE_PAGE_HAS_BATTER_AND_RESO_HEAD_EVIDENCE';

  }

  if (hasBrand && hasSpecificModel) {

    return 'SOURCE_PAGE_HAS_SPECIFIC_HEAD_EVIDENCE';

  }

  if (hasBrand || hasSpecificModel) {

    return 'SOURCE_PAGE_HAS_PARTIAL_HEAD_EVIDENCE';

  }

  if (snippets.length) {

    return 'SOURCE_PAGE_HAS_HEAD_TERMS_ONLY';

  }

  return 'NO_SOURCE_PAGE_HEAD_EVIDENCE';

}

async function fetchWithTimeout(url, timeoutMs = 14000) {

  const controller = new AbortController();

  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {

    const response = await fetch(url, {

      signal: controller.signal,

      headers: {

        'user-agent': 'Mozilla/5.0 LegacyPrintResearchBot/1.0 source-audit non-commercial'

      }

    });

    const html = await response.text();

    return {

      ok: response.ok,

      status: response.status,

      finalUrl: response.url,

      html

    };

  } finally {

    clearTimeout(timeout);

  }

}

(async () => {

  const uniqueSourceMap = new Map();

  for (const row of candidates) {

    if (!row.primarySourceUrl) continue;

    if (!uniqueSourceMap.has(row.primarySourceUrl)) {

      uniqueSourceMap.set(row.primarySourceUrl, {

        primarySourceUrl: row.primarySourceUrl,

        sourceHost: hostFromUrl(row.primarySourceUrl),

        candidates: []

      });

    }

    uniqueSourceMap.get(row.primarySourceUrl).candidates.push({

      id: row.id,

      lineSeries: row.lineSeries,

      modelName: row.modelName,

      diameter: row.diameter,

      depth: row.depth,

      missingForStock: row.missingForStock

    });

  }

  const sourceResults = [];

  for (const source of uniqueSourceMap.values()) {

    try {

      const fetched = await fetchWithTimeout(source.primarySourceUrl);

      const text = stripHtml(fetched.html);

      const snippets = snippetsForTerms(text, HEAD_TERMS);

      const evidenceTier = classifyEvidence(snippets);

      sourceResults.push({

        primarySourceUrl: source.primarySourceUrl,

        sourceHost: source.sourceHost,

        fetchOk: fetched.ok,

        httpStatus: fetched.status,

        finalUrl: fetched.finalUrl,

        title: titleFromHtml(fetched.html),

        evidenceTier,

        matchedSnippetCount: snippets.length,

        snippets,

        candidateCount: source.candidates.length,

        candidates: source.candidates

      });

    } catch (error) {

      sourceResults.push({

        primarySourceUrl: source.primarySourceUrl,

        sourceHost: source.sourceHost,

        fetchOk: false,

        httpStatus: null,

        finalUrl: null,

        title: '',

        evidenceTier: 'SOURCE_FETCH_FAILED',

        error: error.message,

        matchedSnippetCount: 0,

        snippets: [],

        candidateCount: source.candidates.length,

        candidates: source.candidates

      });

    }

  }

  const byEvidenceTier = sourceResults.reduce((acc, row) => {

    acc[row.evidenceTier] = (acc[row.evidenceTier] || 0) + row.candidateCount;

    return acc;

  }, {});

  const groups = [];

  const groupMap = new Map();

  for (const row of candidates) {

    const relatedSources = sourceResults.filter((source) =>

      (source.candidates || []).some((candidate) => candidate.id === row.id)

    );

    const bestSource = relatedSources

      .slice()

      .sort((a, b) => (b.matchedSnippetCount || 0) - (a.matchedSnippetCount || 0))[0];

    const key = [

      row.lineSeries || 'Unknown Line',

      bestSource?.evidenceTier || 'NO_SOURCE'

    ].join(' || ');

    if (!groupMap.has(key)) {

      groupMap.set(key, {

        companyName: companyArg,

        lineSeries: row.lineSeries || 'Unknown Line',

        evidenceTier: bestSource?.evidenceTier || 'NO_SOURCE',

        candidateCount: 0,

        sourceHosts: {},

        sampleCandidates: [],

        candidateIds: []

      });

    }

    const group = groupMap.get(key);

    group.candidateCount += 1;

    group.candidateIds.push(row.id);

    group.sourceHosts[row.sourceHost || hostFromUrl(row.primarySourceUrl)] =

      (group.sourceHosts[row.sourceHost || hostFromUrl(row.primarySourceUrl)] || 0) + 1;

    if (group.sampleCandidates.length < 15) {

      group.sampleCandidates.push({

        id: row.id,

        modelName: row.modelName,

        diameter: row.diameter,

        depth: row.depth,

        primarySourceUrl: row.primarySourceUrl,

        evidenceTier: bestSource?.evidenceTier || 'NO_SOURCE',

        snippets: (bestSource?.snippets || []).slice(0, 8)

      });

    }

  }

  groups.push(...Array.from(groupMap.values()).sort((a, b) => b.candidateCount - a.candidateCount));

  const slug = companyArg.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const outFile = path.join(reviewDir, `head-only-${slug}-source-evidence-packet.json`);

  const mdFile = path.join(reviewDir, `head-only-${slug}-source-evidence-packet.md`);

  const output = {

    status: 'HEAD_ONLY_COMPANY_SOURCE_EVIDENCE_PACKET_NO_FIRESTORE_WRITES',

    generatedAt: new Date().toISOString(),

    sourcePacketFile: packetPath,

    companyName: companyArg,

    collectionName: 'snareReferenceDrums',

    noFirestoreWrites: true,

    summary: {

      candidateCount: candidates.length,

      uniqueSourceUrlCount: uniqueSourceMap.size,

      fetchedSourceCount: sourceResults.filter((row) => row.fetchOk).length,

      failedSourceCount: sourceResults.filter((row) => !row.fetchOk).length,

      byEvidenceTier,

      groupCount: groups.length,

      firestoreWrites: 0

    },

    rules: [

      'No Firestore writes are performed.',

      'This packet mines source-page text for one company head-only records.',

      'Exact stock head values must be approved before patch plans.'

    ],

    sourceResults,

    groups

  };

  const lines = [

    `# Head-Only ${companyArg} Source Evidence Packet`,

    '',

    `Candidates: ${output.summary.candidateCount}`,

    `Source URLs: ${output.summary.uniqueSourceUrlCount}`,

    `Fetched: ${output.summary.fetchedSourceCount}`,

    `Failed: ${output.summary.failedSourceCount}`,

    '',

    '## Evidence Summary',

    '',

    '```json',

    JSON.stringify(byEvidenceTier, null, 2),

    '```',

    '',

    '## Groups',

    ''

  ];

  for (const group of groups) {

    lines.push(`### ${group.lineSeries} — ${group.evidenceTier}`);

    lines.push('');

    lines.push(`Candidates: ${group.candidateCount}`);

    lines.push('');

    for (const sample of group.sampleCandidates.slice(0, 8)) {

      lines.push(`- ${sample.modelName} (${sample.diameter}x${sample.depth})`);

    }

    lines.push('');

  }

  fs.writeFileSync(outFile, `${JSON.stringify(output, null, 2)}\n`);

  fs.writeFileSync(mdFile, `${lines.join('\n')}\n`);

  console.log(JSON.stringify({

    outFile,

    mdFile,

    status: output.status,

    companyName: companyArg,

    candidateCount: output.summary.candidateCount,

    uniqueSourceUrlCount: output.summary.uniqueSourceUrlCount,

    fetchedSourceCount: output.summary.fetchedSourceCount,

    failedSourceCount: output.summary.failedSourceCount,

    byEvidenceTier: output.summary.byEvidenceTier,

    groupCount: output.summary.groupCount,

    firestoreWrites: output.summary.firestoreWrites

  }, null, 2));

})().catch((error) => {

  console.error(error);

  process.exit(1);

});

