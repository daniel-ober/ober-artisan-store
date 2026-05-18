
import { MODIFIER_REGISTRY, UNKNOWN_MODIFIER_FALLBACK } from './modifierRegistry.js';

const normalize = (value = "") =>

  String(value)

    .toLowerCase()

    .replace(/[-_/]/g, " ")

    .replace(/\s+/g, " ")

    .trim();

const getCandidates = (record) =>

  [record.label, record.id, ...(record.aliases || [])].map(normalize);

export function resolveModifier(category, rawValue) {

  if (!rawValue) {

    return {

      matched: false,

      rawValue,

      category,

      ...UNKNOWN_MODIFIER_FALLBACK,

    };

  }

  const normalizedValue = normalize(rawValue);

  const records = MODIFIER_REGISTRY[category] || [];

  const exactMatch = records.find((record) =>

    getCandidates(record).some((candidate) => candidate === normalizedValue)

  );

  const partialMatch =

    exactMatch ||

    records.find((record) =>

      getCandidates(record).some(

        (candidate) =>

          candidate.length > 3 &&

          normalizedValue.includes(candidate)

      )

    );

  const match = exactMatch || partialMatch;

  if (!match) {

    return {

      matched: false,

      rawValue,

      category,

      ...UNKNOWN_MODIFIER_FALLBACK,

    };

  }

  return {

    matched: true,

    rawValue,

    category,

    ...match,

  };

}

