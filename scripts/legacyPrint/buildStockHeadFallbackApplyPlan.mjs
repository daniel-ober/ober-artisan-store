import fs from 'fs';

import path from 'path';

const RULES_PATH = 'src/legacyPrint/reviewPlans/stock-head-fallback-rules-draft.json';

const AUDIT_DIR = 'tmp/legacyPrint-audits';

const PLAN_DIR = 'src/legacyPrint/reviewPlans';

const CANDIDATE_PREFIX = 'stock-head-fallback-candidates-';

const OUTPUT_PREFIX = 'stock-head-fallback-apply-plan';

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

function isUsableString(value) {

  return typeof value === 'string' && value.trim().length > 0;

}

function isApprovedRule(rule) {

  return normalize(rule.status) === 'approved';

}

function isUsableSourceConfidence(value) {

  const normalized = normalize(value);

  return normalized && !['needsverification', 'unknown', 'low', 'draft'].includes(normalized);

}

function validateApprovedRule(rule) {

  const errors = [];

  if (!isUsableString(rule.ruleKey)) errors.push('missing ruleKey');

  if (!isUsableString(rule.companyName)) errors.push('missing companyName');

  if (!Array.isArray(rule.lineSeriesIncludes)) errors.push('lineSeriesIncludes must be an array');

  if (!isUsableString(rule.stockBatterHead)) errors.push('missing stockBatterHead');

  if (!isUsableString(rule.stockResoHead)) errors.push('missing stockResoHead');

  if (!isUsableString(rule.sourceUrl)) errors.push('missing sourceUrl');

  if (!isUsableSourceConfidence(rule.sourceConfidence)) errors.push('sourceConfidence is not approval-safe');

  return errors;

}

function ruleMatchesCandidate(rule, candidate) {

  if (normalize(rule.companyName) !== normalize(candidate.companyName)) {

    return false;

  }

  if (!Array.isArray(rule.lineSeriesIncludes) || rule.lineSeriesIncludes.length === 0) {

    return true;

  }

  const candidateLine = normalize(candidate.lineSeries);

  return rule.lineSeriesIncludes.some((line) => normalize(line) === candidateLine);

}

function buildUpdate(rule, candidate) {

  return {

    id: candidate.id,

    label: candidate.label,

    companyName: candidate.companyName,

    lineSeries: candidate.lineSeries,

    modelName: candidate.modelName,

    matchedRuleKey: rule.ruleKey,

    set: {

      stockBatterHead: rule.stockBatterHead,

      stockResoHead: rule.stockResoHead,

      stockHeadNeedsVerification: true,

      engineAssumptions: {

        stockHeadFallbackApplied: true,

        stockHeadFallbackKey: rule.ruleKey,

        stockHeadFallbackType: rule.fallbackType || 'stock-head-fallback',

        stockHeadFallbackReason: rule.notes || '',

        stockHeadNeedsVerification: true,

        stockHeadFallbackSourceUrl: rule.sourceUrl,

        stockHeadFallbackSourceConfidence: rule.sourceConfidence

      },

      notesOnMissingData: [

        candidate.notesOnMissingData || '',

        'Stock batter/reso heads populated by approved stock-head fallback rule: ' + rule.ruleKey + '.'

      ].filter(Boolean).join(' ')

    },

    source: {

      ruleSourceUrl: rule.sourceUrl,

      ruleSourceConfidence: rule.sourceConfidence,

      candidatePrimarySourceUrl: candidate.primarySourceUrl || '',

      candidateSourceConfidence: candidate.sourceConfidence || ''

    }

  };

}

function compactCandidate(row) {

  return {

    id: row.id,

    label: row.label,

    companyName: row.companyName,

    lineSeries: row.lineSeries,

    modelName: row.modelName,

    fieldQualityTier: row.fieldQualityTier,

    missingForStock: row.missingForStock,

    stockBatterHead: row.stockBatterHead,

    stockResoHead: row.stockResoHead,

    primarySourceUrl: row.primarySourceUrl,

    sourceConfidence: row.sourceConfidence,

    priorityScore: row.priorityScore

  };

}

function main() {

  const candidatePath = latestJsonFile(AUDIT_DIR, CANDIDATE_PREFIX);

  const candidateAudit = JSON.parse(fs.readFileSync(candidatePath, 'utf8'));

  const candidates = candidateAudit.allCandidates || candidateAudit.topPriorityCandidates || [];

  const rulesFile = JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));

  const rules = Array.isArray(rulesFile.rules) ? rulesFile.rules : [];

  const approvedRules = rules.filter(isApprovedRule);

  const draftRules = rules.filter((rule) => normalize(rule.status) === 'draft');

  const approvedRuleErrors = approvedRules

    .map((rule) => ({

      ruleKey: rule.ruleKey,

      errors: validateApprovedRule(rule)

    }))

    .filter((result) => result.errors.length > 0);

  if (approvedRuleErrors.length) {

    throw new Error(

      'Approved stock-head fallback rules failed validation: ' +

      JSON.stringify(approvedRuleErrors, null, 2)

    );

  }

  const updates = [];

  const unmatchedApprovedCandidates = [];

  const skippedDraftCandidates = [];

  for (const candidate of candidates) {

    const approvedMatch = approvedRules.find((rule) => ruleMatchesCandidate(rule, candidate));

    if (approvedMatch) {

      updates.push(buildUpdate(approvedMatch, candidate));

      continue;

    }

    const draftMatch = draftRules.find((rule) => ruleMatchesCandidate(rule, candidate));

    if (draftMatch) {

      skippedDraftCandidates.push({

        ...compactCandidate(candidate),

        matchedDraftRuleKey: draftMatch.ruleKey

      });

      continue;

    }

    unmatchedApprovedCandidates.push(compactCandidate(candidate));

  }

  const summary = {

    candidatesChecked: candidates.length,

    totalRules: rules.length,

    approvedRules: approvedRules.length,

    draftRules: draftRules.length,

    plannedUpdates: updates.length,

    skippedDraftCandidates: skippedDraftCandidates.length,

    unmatchedApprovedCandidates: unmatchedApprovedCandidates.length

  };

  const output = {

    generatedAt: new Date().toISOString(),

    mode: 'PLAN_ONLY_NO_FIRESTORE_WRITES',

    candidatePath,

    rulesPath: RULES_PATH,

    summary,

    updates,

    skippedDraftCandidates,

    unmatchedApprovedCandidates

  };

  fs.mkdirSync(PLAN_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  const outputPath = path.join(PLAN_DIR, OUTPUT_PREFIX + '-' + timestamp + '.json');

  const latestPath = path.join(PLAN_DIR, OUTPUT_PREFIX + '-latest.json');

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  fs.writeFileSync(latestPath, JSON.stringify(output, null, 2));

  console.log('\nSTOCK HEAD FALLBACK APPLY PLAN COMPLETE');

  console.log(JSON.stringify(summary, null, 2));

  console.log('\nJSON report written to: ' + outputPath);

  console.log('Latest report written to: ' + latestPath);

}

main();

