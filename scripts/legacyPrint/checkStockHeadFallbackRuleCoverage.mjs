import fs from 'fs';

import path from 'path';

const AUDIT_DIR = 'tmp/legacyPrint-audits';

const RULES_PATH = 'src/legacyPrint/reviewPlans/stock-head-fallback-rules-draft.json';

function readJson(filePath) {

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));

}

function latestCandidateAuditPath() {

  const files = fs.readdirSync(AUDIT_DIR)

    .filter((name) => name.startsWith('stock-head-fallback-candidates-') && name.endsWith('.json'))

    .map((name) => path.join(AUDIT_DIR, name))

    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

  if (!files.length) {

    throw new Error('No stock-head fallback candidate audit found.');

  }

  return files[0];

}

function includesAny(value, terms) {

  if (!terms || !terms.length) return true;

  const lower = String(value || '').toLowerCase();

  return terms.some((term) => lower.includes(String(term).toLowerCase()));

}

function ruleMatches(row, rule) {

  if ((row.companyName || '') !== rule.companyName) return false;

  return includesAny(row.lineSeries || '', rule.lineSeriesIncludes || []);

}

function compact(row) {

  return {

    id: row.id,

    companyName: row.companyName,

    lineSeries: row.lineSeries,

    modelName: row.modelName,

    fieldQualityTier: row.fieldQualityTier,

    missingForStock: row.missingForStock,

    primarySourceUrl: row.primarySourceUrl,

    sourceConfidence: row.sourceConfidence,

    priorityScore: row.priorityScore

  };

}

function main() {

  const candidatePath = latestCandidateAuditPath();

  const audit = readJson(candidatePath);

  const rulesDoc = readJson(RULES_PATH);

  const rules = rulesDoc.rules || [];

  const candidates = (audit.allCandidates || audit.topPriorityCandidates || []);

  const matched = [];

  const unmatched = [];

  for (const row of candidates) {

    const matchingRules = rules.filter((rule) => ruleMatches(row, rule));

    if (matchingRules.length) {

      matched.push({

        ...compact(row),

        matchingRuleKeys: matchingRules.map((rule) => rule.ruleKey),

        matchingRuleStatuses: matchingRules.map((rule) => rule.status)

      });

    } else {

      unmatched.push(compact(row));

    }

  }

  const byRule = rules.map((rule) => {

    const records = candidates.filter((row) => ruleMatches(row, rule));

    return {

      ruleKey: rule.ruleKey,

      status: rule.status,

      companyName: rule.companyName,

      lineSeriesIncludes: rule.lineSeriesIncludes,

      count: records.length,

      sample: records.slice(0, 10).map(compact)

    };

  });

  const output = {

    reportName: 'OBER LEGACYPRINT™ STOCK HEAD FALLBACK RULE COVERAGE',

    mode: 'READ_ONLY',

    generatedAt: new Date().toISOString(),

    candidateAuditFile: candidatePath,

    rulesFile: RULES_PATH,

    summary: {

      candidatesChecked: candidates.length,

      rules: rules.length,

      matched: matched.length,

      unmatched: unmatched.length,

      approvedRules: rules.filter((rule) => rule.status === 'APPROVED').length,

      draftRules: rules.filter((rule) => rule.status === 'DRAFT').length

    },

    byRule,

    unmatched,

    matched

  };

  const outputPath = path.join(AUDIT_DIR, 'stock-head-fallback-rule-coverage-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json');

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log('\nSTOCK HEAD FALLBACK RULE COVERAGE COMPLETE');

  console.log(JSON.stringify(output.summary, null, 2));

  console.log('\nBY RULE');

  console.table(byRule.map((rule) => ({

    ruleKey: rule.ruleKey,

    status: rule.status,

    companyName: rule.companyName,

    count: rule.count

  })));

  console.log('\nJSON report written to: ' + outputPath);

}

main();

