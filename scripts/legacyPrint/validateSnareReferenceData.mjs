
// scripts/legacyPrint/validateSnareReferenceData.mjs

import fs from 'fs';

import path from 'path';

import process from 'process';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '../..');

const REPORT_DIR = path.resolve(ROOT_DIR, 'snareValidationReports');

const REQUIRED_SHELL_CORE_FIELDS = [

  'company',

  'lineSeries',

  'modelName',

  'diameter',

  'depth',

  'shellConstruction',

  'shellMaterialPrimary',

  'shellMaterialSecondary',

  'shellMaterialTertiary',

  'plyCountLayup',

  'shellThicknessMm',

  'bearingEdgeType',

  'bearingEdgeInnerAngle',

  'bearingEdgeOuterRoundover',

  'snareBeds',

  'snareBedDepth',

  'reinforcementRings',

  'reinforcementRingMaterial',

  'reinforcementRingThicknessMm',

  'shellFinishType',

  'shellFinishInterior',

  'shellFinishExterior',

  'grainOrientation',

  'shellOrientationNotes',

  'ventingType',

  'ventHoleCount',

  'shellHardwareMountType',

  'lugMountStyle',

  'roundedShellOvertones',

  'knownConstructionNotes',

  'allStockCaptured',

];

const ENUMS = {

  snareBedDepth: ['none', 'shallow', 'medium', 'deep', 'unknown'],

  shellFinishType: ['gloss', 'satin', 'matte', 'natural', 'lacquer', 'wrap', 'oil', 'wax', 'unknown'],

  bearingEdgeOuterRoundover: ['none', 'slight', 'medium', 'full', 'unknown'],

  grainOrientation: ['vertical', 'horizontal', 'cross-laminated', 'hybrid', 'unknown'],

  ventingType: ['standard', 'multi-vent', 'open-air', 'unknown'],

};

const args = process.argv.slice(2);

const inputPathArg = args.find((arg) => !arg.startsWith('--'));

const inputPath = inputPathArg

  ? path.resolve(ROOT_DIR, inputPathArg)

  : path.resolve(ROOT_DIR, 'data/snareReferenceDrums.json');

function readJson(filePath) {

  if (!fs.existsSync(filePath)) {

    throw new Error(`Input file not found: ${filePath}`);

  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));

}

function getValue(record, key) {

  return key.split('.').reduce((acc, part) => {

    if (!acc || typeof acc !== 'object') return undefined;

    return acc[part];

  }, record);

}

function isMissing(value) {

  return (

    value === undefined ||

    value === null ||

    value === '' ||

    value === 'unknown'

  );

}

function validateShellCoreRecord(record, index) {

  const issues = [];

  REQUIRED_SHELL_CORE_FIELDS.forEach((field) => {

    const value = getValue(record, field);

    if (value === undefined) {

      issues.push({

        severity: 'error',

        field,

        message: 'Missing required shell-core field.',

      });

    }

  });

  Object.entries(ENUMS).forEach(([field, allowedValues]) => {

    const value = getValue(record, field);

    if (value !== undefined && value !== null && !allowedValues.includes(value)) {

      issues.push({

        severity: 'warning',

        field,

        value,

        message: `Value is outside normalized enum: ${allowedValues.join(', ')}`,

      });

    }

  });

  ['diameter', 'depth', 'shellThicknessMm', 'bearingEdgeInnerAngle', 'reinforcementRingThicknessMm', 'ventHoleCount'].forEach((field) => {

    const value = getValue(record, field);

    if (value !== null && value !== undefined && typeof value !== 'number') {

      issues.push({

        severity: 'warning',

        field,

        value,

        message: 'Expected number or null.',

      });

    }

  });

  ['snareBeds', 'reinforcementRings', 'allStockCaptured'].forEach((field) => {

    const value = getValue(record, field);

    if (value !== undefined && typeof value !== 'boolean') {

      issues.push({

        severity: 'warning',

        field,

        value,

        message: 'Expected boolean.',

      });

    }

  });

  const missingPriorityFields = REQUIRED_SHELL_CORE_FIELDS.filter((field) => {

    return isMissing(getValue(record, field));

  });

  return {

    index,

    id: record.id || null,

    company: record.company || record.companyName || 'unknown',

    lineSeries: record.lineSeries || 'unknown',

    modelName: record.modelName || 'unknown',

    missingPriorityFields,

    issues,

  };

}

function normalizeInputData(data) {

  if (Array.isArray(data)) return data;

  if (Array.isArray(data.drums)) return data.drums;

  if (Array.isArray(data.records)) return data.records;

  if (data && typeof data === 'object') {

    return Object.entries(data).map(([id, record]) => ({

      id,

      ...record,

    }));

  }

  throw new Error('Unsupported input shape. Expected array, { drums: [] }, { records: [] }, or object map.');

}

function main() {

  const raw = readJson(inputPath);

  const records = normalizeInputData(raw);

  const validations = records.map((record, index) => validateShellCoreRecord(record, index));

  const recordsWithIssues = validations.filter((item) => item.issues.length);

  const recordsWithMissingPriorityFields = validations.filter(

    (item) => item.missingPriorityFields.length

  );

  const issueCounts = validations.reduce(

    (acc, item) => {

      item.issues.forEach((issue) => {

        acc[issue.severity] = (acc[issue.severity] || 0) + 1;

      });

      return acc;

    },

    { error: 0, warning: 0 }

  );

  const missingFieldCounts = {};

  validations.forEach((item) => {

    item.missingPriorityFields.forEach((field) => {

      missingFieldCounts[field] = (missingFieldCounts[field] || 0) + 1;

    });

  });

  const report = {

    generatedAt: new Date().toISOString(),

    inputPath,

    totalRecords: records.length,

    recordsWithIssues: recordsWithIssues.length,

    recordsWithMissingPriorityFields: recordsWithMissingPriorityFields.length,

    issueCounts,

    missingFieldCounts,

    validations,

  };

  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const reportPath = path.resolve(

    REPORT_DIR,

    `snare-shell-core-validation-${Date.now()}.json`

  );

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('');

  console.log('LegacyPrint snare shell-core validation');

  console.log(`Input: ${inputPath}`);

  console.log(`Total records: ${records.length}`);

  console.log(`Records with issues: ${recordsWithIssues.length}`);

  console.log(`Records with missing priority fields: ${recordsWithMissingPriorityFields.length}`);

  console.log(`Errors: ${issueCounts.error || 0}`);

  console.log(`Warnings: ${issueCounts.warning || 0}`);

  console.log('');

  console.log('Most common missing fields:');

  Object.entries(missingFieldCounts)

    .sort((a, b) => b[1] - a[1])

    .slice(0, 20)

    .forEach(([field, count]) => {

      console.log(`- ${field}: ${count}`);

    });

  console.log('');

  console.log(`Report: ${reportPath}`);

}

main();

