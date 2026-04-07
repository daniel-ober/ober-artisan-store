// src/data/schemas/referenceCatalogItem.schema.js

export const REFERENCE_CATEGORIES = Object.freeze({
  STICK: 'stick',
  HEAD_SNARE_BATTER: 'head_snare_batter',
  HEAD_SNARE_RESO: 'head_snare_reso',
  HEAD_TOM_BATTER: 'head_tom_batter',
  HEAD_TOM_RESO: 'head_tom_reso',
  HEAD_BASS_BATTER: 'head_bass_batter',
  HEAD_BASS_RESO: 'head_bass_reso',
  WOOD: 'wood',
  BEARING_EDGE: 'bearing_edge',
  SHELL_CONSTRUCTION: 'shell_construction',
  SHELL_DIAMETER: 'shell_diameter',
  SHELL_DEPTH: 'shell_depth',
  SHELL_THICKNESS: 'shell_thickness',
  HOOP: 'hoop',
  HARDWARE: 'hardware',
  HEAD_TENSION: 'head_tension',
  FINISH: 'finish',
  ENVIRONMENT: 'environment',
  SNARE_WIRE: 'snare_wire',
});

export const SOURCE_TYPES = Object.freeze({
  MANUFACTURER: 'manufacturer',
  MATERIAL_DATABASE: 'material_database',
  OBER_INTERNAL: 'ober_internal',
  DERIVED: 'derived',
  RETAILER: 'retailer',
  EDITORIAL: 'editorial',
  UNKNOWN: 'unknown',
});

export const FACT_CONFIDENCE = Object.freeze({
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
});

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function createEvidenceSource({
  label = '',
  url = '',
  sourceType = SOURCE_TYPES.UNKNOWN,
  accessedAt = null,
  confidence = FACT_CONFIDENCE.MEDIUM,
  notes = '',
} = {}) {
  return {
    label,
    url,
    sourceType,
    accessedAt,
    confidence,
    notes,
  };
}

export function createCatalogFact({
  value = null,
  unit = '',
  confidence = FACT_CONFIDENCE.HIGH,
  sourceIds = [],
  notes = '',
} = {}) {
  return {
    value,
    unit,
    confidence,
    sourceIds,
    notes,
  };
}

/**
 * Canonical reference item for factual catalog data.
 *
 * sections:
 * - facts: hard specs / published info
 * - physicalProperties: density, hardness, etc.
 * - tonalDescriptors: ONLY cautious, labeled descriptors
 * - compatibility: pairings, tags, fitment
 * - sourceMeta: traceable evidence list
 */
export function createReferenceCatalogItem({
  id,
  category,
  label,
  brand = '',
  model = '',
  aliases = [],
  facts = {},
  physicalProperties = {},
  tonalDescriptors = {},
  compatibility = {},
  sourceMeta = [],
  tags = [],
  notes = '',
  isActive = true,
  version = '1.0.0',
} = {}) {
  if (!id || typeof id !== 'string') {
    throw new Error('createReferenceCatalogItem: "id" is required and must be a string.');
  }

  if (!category || typeof category !== 'string') {
    throw new Error('createReferenceCatalogItem: "category" is required and must be a string.');
  }

  if (!label || typeof label !== 'string') {
    throw new Error('createReferenceCatalogItem: "label" is required and must be a string.');
  }

  if (!isPlainObject(facts)) {
    throw new Error('createReferenceCatalogItem: "facts" must be a plain object.');
  }

  if (!isPlainObject(physicalProperties)) {
    throw new Error('createReferenceCatalogItem: "physicalProperties" must be a plain object.');
  }

  if (!isPlainObject(tonalDescriptors)) {
    throw new Error('createReferenceCatalogItem: "tonalDescriptors" must be a plain object.');
  }

  if (!isPlainObject(compatibility)) {
    throw new Error('createReferenceCatalogItem: "compatibility" must be a plain object.');
  }

  return {
    id,
    category,
    label,
    brand,
    model,
    aliases,
    facts,
    physicalProperties,
    tonalDescriptors,
    compatibility,
    sourceMeta,
    tags,
    notes,
    isActive,
    version,
  };
}

export function withCatalogMeta(item, meta = {}) {
  return {
    ...item,
    ...meta,
  };
}

export function getFactValue(item, key, fallback = null) {
  return item?.facts?.[key]?.value ?? fallback;
}

export function getPhysicalPropertyValue(item, key, fallback = null) {
  return item?.physicalProperties?.[key]?.value ?? fallback;
}

export function hasTag(item, tag) {
  return Array.isArray(item?.tags) && item.tags.includes(tag);
}