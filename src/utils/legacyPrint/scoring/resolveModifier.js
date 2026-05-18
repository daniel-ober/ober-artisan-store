import { MODIFIER_REGISTRY, UNKNOWN_MODIFIER_FALLBACK } from './modifierRegistry.js';

const normalize = (value = "") =>

  String(value)

    .toLowerCase()

    .replace(/[-_/]/g, " ")

    .replace(/\s+/g, " ")

    .trim();

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

  const match = records.find((record) => {

    const candidates = [record.label, record.id, ...(record.aliases || [])].map(normalize);

    return candidates.some((candidate) => candidate === normalizedValue || normalizedValue.includes(candidate));

  });

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

