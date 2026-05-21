import fs from 'fs';

import path from 'path';

const RULES_PATH = 'src/legacyPrint/reviewPlans/stock-head-fallback-rules-draft.json';

const AUDIT_DIR = 'tmp/legacyPrint-audits';

const OUTPUT_PREFIX = 'stock-head-fallback-rule-validation';

function isNonEmptyString(value) {

  return typeof value === 'string' && value.trim().length > 0;

}

function isDraft(rule) {

  return String(rule.status || '').toUpperCase() === 'DRAFT';

}

function isApproved(rule) {

  return String(rule.status || '').toUpperCase() === 'APPROVED';

}

function validateRule(rule) {

  const errors = [];

  const warnings = [];

  if (!isNonEmptyString(rule.ruleKey)) errors.push('missing ruleKey');

  if (!isNonEmptyString(rule.status)) errors.push('missing status');

  if (!isNonEmptyString(rule.companyName)) errors.push('missing companyName');

  if (!Array.isArray(rule.lineSeriesIncludes)) {

    errors.push('lineSeriesIncludes must be an array');

  }

  if (!isNonEmptyString(rule.fallbackType)) {

    errors.push('missing fallbackType');

  }

  if (!isNonEmptyString(rule.sourceUrl)) {

    warnings.push('missing sourceUrl');

  }

  if (!isNonEmptyString(rule.sourceConfidence)) {

    warnings.push('missing sourceConfidence');

  }

  if (!isNonEmptyString(rule.stockBatterHead)) {

    warnings.push('missing stockBatterHead');

  }

  if (!isNonEmptyString(rule.stockResoHead)) {

    warnings.push('missing stockResoHead');

  }

  if (isApproved(rule)) {

    if (!isNonEmptyString(rule.stockBatterHead)) errors.push('APPROVED rule missing stockBatterHead');

    if (!isNonEmptyString(rule.stockResoHead)) errors.push('APPROVED rule missing stockResoHead');

    if (!isNonEmptyString(rule.sourceUrl)) errors.push('APPROVED rule missing sourceUrl');

    if (

      !isNonEmptyString(rule.sourceConfidence) ||

      ['needsverification', 'unknown', 'low', 'draft'].includes(String(rule.sourceConfidence).trim().toLowerCase())

    ) {

      errors.push('APPROVED rule must have usable sourceConfidence');

    }

  }

  if (!isDraft(rule) && !isApproved(rule)) {

    warnings.push('status is neither DRAFT nor APPROVED');

  }

  return {

    ruleKey: rule.ruleKey || '',

    status: rule.status || '',

    companyName: rule.companyName || '',

    lineSeriesIncludes: rule.lineSeriesIncludes || [],

    errors,

    warnings,

    approvalReady: errors.length === 0 && isApproved(rule)

  };

}

function main() {

  const rules = JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));

  const list = Array.isArray(rules.rules) ? rules.rules : [];

  const validations = list.map(validateRule);

  const summary = {

    totalRules: validations.length,

    draftRules: validations.filter((rule) => String(rule.status).toUpperCase() === 'DRAFT').length,

    approvedRules: validations.filter((rule) => String(rule.status).toUpperCase() === 'APPROVED').length,

    approvalReadyRules: validations.filter((rule) => rule.approvalReady).length,

    rulesWithErrors: validations.filter((rule) => rule.errors.length > 0).length,

    rulesWithWarnings: validations.filter((rule) => rule.warnings.length > 0).length

  };

  const output = {

    generatedAt: new Date().toISOString(),

    rulesPath: RULES_PATH,

    summary,

    validations

  };

  fs.mkdirSync(AUDIT_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  const outputPath = path.join(AUDIT_DIR, OUTPUT_PREFIX + '-' + timestamp + '.json');

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log('\nSTOCK HEAD FALLBACK RULE VALIDATION COMPLETE');

  console.log(JSON.stringify(summary, null, 2));

  const blocking = validations.filter((rule) => rule.errors.length > 0);

  if (blocking.length) {

    console.log('\nBLOCKING ERRORS');

    console.table(blocking.map((rule) => ({

      ruleKey: rule.ruleKey,

      status: rule.status,

      errors: rule.errors.join('; ')

    })));

  }

  console.log('\nJSON report written to: ' + outputPath);

}

main();

