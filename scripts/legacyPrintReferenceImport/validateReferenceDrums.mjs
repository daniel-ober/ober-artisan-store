// scripts/legacyPrintReferenceImport/validateReferenceDrums.mjs

import {

  REQUIRED_NORMALIZED_REFERENCE_FIELDS,

  VALID_COMPANY_TYPES,

  VALID_CONFIDENCE_LEVELS,

  VALID_DRUM_TYPES,

  VALID_SHELL_CONSTRUCTIONS,

} from './referenceDrumSourceSchema.mjs';

const hasValue = (value) => {

  if (Array.isArray(value)) return value.length > 0;

  return String(value || '').trim().length > 0;

};

export const validateReferenceDrumRecord = (record = {}) => {

  const errors = [];

  const warnings = [];

  REQUIRED_NORMALIZED_REFERENCE_FIELDS.forEach((field) => {

    if (!(field in record)) {

      errors.push(`Missing field: ${field}`);

    }

  });

  ['id', 'companyType', 'lineName', 'modelName', 'drumType'].forEach(

    (field) => {

      if (!hasValue(record[field])) {

        errors.push(`Required value is empty: ${field}`);

      }

    }

  );

  if (!VALID_COMPANY_TYPES.includes(record.companyType)) {

    errors.push(`Invalid companyType: ${record.companyType}`);

  }

  if (!VALID_DRUM_TYPES.includes(record.drumType)) {

    errors.push(`Invalid drumType: ${record.drumType}`);

  }

  if (

    record.shellConstruction &&

    !VALID_SHELL_CONSTRUCTIONS.includes(record.shellConstruction)

  ) {

    errors.push(`Invalid shellConstruction: ${record.shellConstruction}`);

  }

  if (!VALID_CONFIDENCE_LEVELS.includes(record.confidence)) {

    errors.push(`Invalid confidence: ${record.confidence}`);

  }

  if (!record.sourceUrls?.length && record.confidence?.startsWith('Confirmed')) {

    warnings.push(

      'Confirmed records should include at least one source URL or catalog reference.'

    );

  }

  if (!record.sizes?.length && record.drumType !== 'Overall Kit / Line Sound') {

    warnings.push('No sizes provided.');

  }

  return {

    id: record.id,

    isValid: errors.length === 0,

    errors,

    warnings,

  };

};

export const validateReferenceDrumRecords = (records = []) => {

  const seenIds = new Set();

  return records.map((record) => {

    const result = validateReferenceDrumRecord(record);

    if (seenIds.has(record.id)) {

      result.isValid = false;

      result.errors.push(`Duplicate id: ${record.id}`);

    }

    seenIds.add(record.id);

    return result;

  });

};