// src/utils/spider/buildDrumSpecsFromLegacyForm.js

/**
 * Adapter from the current CustomDrumBuilder form state
 * into the normalized spec shape expected by scoreSpiderProfile().
 *
 * Supported normalized fields now include:
 * - shellFamily
 * - construction
 * - species / primarySpecies / secondarySpecies / innerSpecies / outerSpecies
 * - metalMaterial
 * - acrylicType
 * - width
 * - depth
 * - bearingEdge
 * - thickness
 * - hoopType
 * - drumhead
 * - tension
 * - snareBedDepth
 * - snareSideHead
 * - snareWireCount
 * - snareWireStyle
 * - snareWireMaterial
 * - finish
 * - hardwareType
 * - reRings
 */

function normalizeString(value, fallback = '') {
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
}

function normalizeNumber(value, fallback = null) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function isEmptyWoodValue(value) {
  const normalized = normalizeString(value).toLowerCase();

  return (
    !normalized ||
    normalized === 'none' ||
    normalized === '— none —' ||
    normalized === '-- none --' ||
    normalized === 'n/a' ||
    normalized === 'na' ||
    normalized === 'null' ||
    normalized === 'undefined'
  );
}

function cleanWoodValue(value) {
  return isEmptyWoodValue(value) ? '' : normalizeString(value);
}

function pushUniqueWood(list, seen, value) {
  const cleaned = cleanWoodValue(value);
  if (!cleaned) return;

  const key = cleaned.toLowerCase();
  if (seen.has(key)) return;

  seen.add(key);
  list.push(cleaned);
}

function normalizeSpeciesArray(specs = {}) {
  const shellFamily = normalizeString(specs.shellFamily, 'Wood').toLowerCase();
  const construction = normalizeString(specs.construction).toLowerCase();
  const species = [];
  const seen = new Set();

  if (shellFamily !== 'wood') {
    return species;
  }

  if (construction.includes('hybrid')) {
    pushUniqueWood(species, seen, specs.innerSpecies);
    pushUniqueWood(species, seen, specs.secondarySpecies);
    pushUniqueWood(species, seen, specs.outerSpecies);
    return species;
  }

  const explicitPrimary =
    cleanWoodValue(specs.primarySpecies) ||
    (!Array.isArray(specs.species) ? cleanWoodValue(specs.species) : '');

  if (explicitPrimary) {
    pushUniqueWood(species, seen, explicitPrimary);
    pushUniqueWood(species, seen, specs.secondarySpecies);
    return species;
  }

  if (Array.isArray(specs.species)) {
    specs.species.forEach((value) => pushUniqueWood(species, seen, value));
    pushUniqueWood(species, seen, specs.secondarySpecies);
    return species;
  }

  pushUniqueWood(species, seen, specs.secondarySpecies);
  return species;
}

function normalizeShellFamily(value) {
  const v = normalizeString(value, 'Wood').toLowerCase();

  if (v === 'metal') return 'Metal';
  if (v === 'acrylic') return 'Acrylic';
  return 'Wood';
}

function normalizeConstruction(specs = {}, shellFamily = 'Wood') {
  const raw = normalizeString(specs.construction);

  if (shellFamily === 'Metal') return 'Metal';
  if (shellFamily === 'Acrylic') return 'Acrylic';

  return raw || 'Stave';
}

export function buildDrumSpecsFromLegacyForm(legacySpecs = {}) {
  const shellFamily = normalizeShellFamily(legacySpecs.shellFamily);
  const construction = normalizeConstruction(legacySpecs, shellFamily);

  const normalizedSpecies = normalizeSpeciesArray({
    ...legacySpecs,
    shellFamily,
    construction,
  });

  const cleanedInnerSpecies = cleanWoodValue(legacySpecs.innerSpecies);
  const cleanedOuterSpecies = cleanWoodValue(legacySpecs.outerSpecies);
  const cleanedSecondarySpecies = cleanWoodValue(legacySpecs.secondarySpecies);

  const primarySpecies =
    shellFamily === 'Wood' && construction.toLowerCase().includes('hybrid')
      ? cleanedInnerSpecies || cleanedOuterSpecies || normalizedSpecies[0] || ''
      : normalizedSpecies[0] || '';

  return {
    shellFamily,
    construction,

    species: normalizedSpecies,
    primarySpecies,
    secondarySpecies: cleanedSecondarySpecies,
    innerSpecies: cleanedInnerSpecies,
    outerSpecies: cleanedOuterSpecies,

    metalMaterial:
      shellFamily === 'Metal'
        ? normalizeString(legacySpecs.metalMaterial, 'Brass')
        : '',
    acrylicType:
      shellFamily === 'Acrylic'
        ? normalizeString(legacySpecs.acrylicType, 'Simple Acrylic')
        : '',

    width: normalizeNumber(legacySpecs.width, 14),
    depth: normalizeNumber(legacySpecs.depth, 6.5),

    bearingEdge: normalizeString(legacySpecs.bearingEdge, '45 Degree Inner'),
    thickness: normalizeString(
      legacySpecs.thickness,
      shellFamily === 'Metal'
        ? 'Standard — 1.2mm'
        : shellFamily === 'Acrylic'
          ? 'Standard — 5mm–6mm'
          : 'Medium — 8mm–11mm'
    ),

    hoopType: normalizeString(legacySpecs.hoopType, 'Die-Cast'),
    drumhead: normalizeString(legacySpecs.drumhead, 'Coated'),
    tension: normalizeString(legacySpecs.tension, 'Medium'),

    snareBedDepth: normalizeString(
      legacySpecs.snareBedDepth,
      'Standard — ~1/16" to 3/32"'
    ),
    snareSideHead: normalizeString(
      legacySpecs.snareSideHead,
      'Standard — 3mil'
    ),
    snareWireCount: normalizeString(legacySpecs.snareWireCount, '20'),
    snareWireStyle: normalizeString(legacySpecs.snareWireStyle, 'Standard'),
    snareWireMaterial: normalizeString(
      legacySpecs.snareWireMaterial,
      'Steel'
    ),

    finish: normalizeString(
      legacySpecs.finish,
      shellFamily === 'Wood' ? 'Gloss Lacquer' : 'Raw / Unfinished'
    ),
    hardwareType: normalizeString(
      legacySpecs.hardwareType,
      'Standard Lugs'
    ),
    reRings: normalizeString(
      legacySpecs.reRings,
      'No Re-Rings'
    ),
  };
}

export default buildDrumSpecsFromLegacyForm;