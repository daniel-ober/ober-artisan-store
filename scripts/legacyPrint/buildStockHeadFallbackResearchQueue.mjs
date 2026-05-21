import fs from 'fs';

import path from 'path';

const RULES_PATH = 'src/legacyPrint/reviewPlans/stock-head-fallback-rules-draft.json';

const COVERAGE_DIR = 'tmp/legacyPrint-audits';

const OUTPUT_DIR = 'src/legacyPrint/reviewPlans';

const COVERAGE_PREFIX = 'stock-head-fallback-rule-coverage-';

const OUTPUT_PREFIX = 'stock-head-fallback-research-queue';

function latestJsonFile(dir, prefix) {

  const matches = fs.readdirSync(dir)

    .filter((name) => name.startsWith(prefix) && name.endsWith('.json'))

    .map((name) => path.join(dir, name))

    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

  if (!matches.length) {

    throw new Error('No JSON files found for prefix: ' + prefix);

  }

  return matches[0];

}

function normalize(value) {

  return String(value || '').trim().toLowerCase();

}

function priorityTier(count) {

  if (count >= 25) return 'P0';

  if (count >= 10) return 'P1';

  if (count >= 4) return 'P2';

  return 'P3';

}

function sourceRisk(rule) {

  const url = String(rule.sourceUrl || '').toLowerCase();

  if (!url) return 'missing-source';

  if (url.includes('wikipedia.org')) return 'weak-source';

  if (url.includes('equipboard.com')) return 'weak-source';

  if (url.includes('guitarcenter.com')) return 'dealer-source';

  if (url.includes('memphisdrumshop.com')) return 'dealer-source';

  if (url.includes('musicradar.com')) return 'editorial-source';

  if (url.includes('sonormuseum.com')) return 'museum-or-archive-source';

  if (url.includes('vintagedrumguide.com')) return 'catalog-archive-source';

  return 'manufacturer-or-primary-source';

}

function main() {

  const coveragePath = latestJsonFile(COVERAGE_DIR, COVERAGE_PREFIX);

  const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));

  const rulesFile = JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));

  const rules = Array.isArray(rulesFile.rules) ? rulesFile.rules : [];

  const byRule = new Map((coverage.byRule || []).map((row) => [row.ruleKey, row]));

  const queue = rules

    .map((rule) => {

      const coverageRow = byRule.get(rule.ruleKey) || {};

      const candidateCount = coverageRow.count || 0;

      return {

        priority: priorityTier(candidateCount),

        ruleKey: rule.ruleKey,

        status: rule.status,

        companyName: rule.companyName,

        lineSeriesIncludes: rule.lineSeriesIncludes || [],

        candidateCount,

        sourceUrl: rule.sourceUrl || '',

        sourceRisk: sourceRisk(rule),

        sourceConfidence: rule.sourceConfidence || '',

        currentStockBatterHead: rule.stockBatterHead || '',

        currentStockResoHead: rule.stockResoHead || '',

        researchNeeded: [

          'Confirm exact stock batter head brand/model.',

          'Confirm exact stock resonant/snare-side head brand/model.',

          'Confirm whether source applies to every matched line/model, or split this rule.',

          'Replace weak/dealer/editorial source with official manufacturer or catalog source when possible.',

          'Only then change status to APPROVED.'

        ],

        notes: rule.notes || ''

      };

    })

    .sort((a, b) => {

      const tierCompare = a.priority.localeCompare(b.priority);

      if (tierCompare !== 0) return tierCompare;

      return b.candidateCount - a.candidateCount || a.companyName.localeCompare(b.companyName);

    });

  const summary = {

    totalRules: queue.length,

    totalCandidatesCoveredByRules: queue.reduce((sum, row) => sum + row.candidateCount, 0),

    p0Rules: queue.filter((row) => row.priority === 'P0').length,

    p1Rules: queue.filter((row) => row.priority === 'P1').length,

    p2Rules: queue.filter((row) => row.priority === 'P2').length,

    p3Rules: queue.filter((row) => row.priority === 'P3').length,

    weakOrNonPrimarySourceRules: queue.filter((row) => row.sourceRisk !== 'manufacturer-or-primary-source').length

  };

  const output = {

    generatedAt: new Date().toISOString(),

    mode: 'RESEARCH_QUEUE_NO_FIRESTORE_WRITES',

    rulesPath: RULES_PATH,

    coveragePath,

    summary,

    queue

  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  const outputPath = path.join(OUTPUT_DIR, OUTPUT_PREFIX + '-' + timestamp + '.json');

  const latestPath = path.join(OUTPUT_DIR, OUTPUT_PREFIX + '-latest.json');

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  fs.writeFileSync(latestPath, JSON.stringify(output, null, 2));

  console.log('\nSTOCK HEAD FALLBACK RESEARCH QUEUE COMPLETE');

  console.log(JSON.stringify(summary, null, 2));

  console.log('\nTOP 12 RESEARCH TARGETS');

  console.table(queue.slice(0, 12).map((row) => ({

    priority: row.priority,

    ruleKey: row.ruleKey,

    companyName: row.companyName,

    candidateCount: row.candidateCount,

    sourceRisk: row.sourceRisk

  })));

  console.log('\nJSON report written to: ' + outputPath);

  console.log('Latest report written to: ' + latestPath);

}

main();

