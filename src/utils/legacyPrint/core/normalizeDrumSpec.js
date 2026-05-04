// src/utils/legacyPrint/core/normalizeDrumSpec.js

import { normalizeConstructionType } from './constructionVoicingProfiles.js';

function toNumber(value, fallback = null) {

  const num = Number(value);

  return Number.isFinite(num) ? num : fallback;

}

function normalizeText(value = '') {

  return String(value || '').trim();

}

function normalizeShellFamily(spec = {}) {

  const raw = String(

    spec.shellFamily ||

      spec.family ||

      spec.materialFamily ||

      spec.shellMaterialFamily ||

      ''

  )

    .trim()

    .toLowerCase();

  const materialText = String(

    spec.material ||

      spec.materialId ||

      spec.primarySpecies ||

      spec.woodSpeciesLabel ||

      spec.metalMaterial ||

      spec.acrylicType ||

      ''

  ).toLowerCase();

  if (raw.includes('metal') || materialText.match(/brass|steel|copper|aluminum/)) {

    return 'metal';

  }

  if (raw.includes('acrylic') || materialText.includes('acrylic')) {

    return 'acrylic';

  }

  return 'wood';

}

function normalizeShellThicknessBucket(mm) {

  const value = Number(mm);

  if (!Number.isFinite(value)) return 'medium';

  if (value <= 6) return 'very-thin';

  if (value <= 8) return 'thin';

  if (value <= 11) return 'medium';

  if (value <= 14) return 'firm';

  if (value <= 18) return 'thick';

  return 'heavy';

}

function normalizeDiameter(spec = {}) {

  return toNumber(spec.width ?? spec.diameter ?? spec.size, 14);

}

function normalizeDepth(spec = {}) {

  return toNumber(spec.depth, 5.5);

}

function normalizeThickness(spec = {}) {

  return toNumber(

    spec.shellThicknessMm ??

      spec.thicknessMm ??

      spec.shellThickness ??

      spec.thickness,

    null

  );

}

export function normalizeDrumSpec(spec = {}) {

  const width = normalizeDiameter(spec);

  const depth = normalizeDepth(spec);

  const shellThicknessMm = normalizeThickness(spec);

  const shellFamily = normalizeShellFamily(spec);

  const constructionType = normalizeConstructionType(

    spec.constructionType || spec.construction || spec.shellConstruction

  );

  return {

    ...spec,

    lineId: normalizeText(spec.lineId || spec.productLine || 'generic'),

    lineLabel: normalizeText(spec.lineLabel || spec.productLineLabel || 'Generic'),

    width,

    diameter: width,

    depth,

    shellFamily,

    constructionType,

    construction: constructionType,

    material:

      spec.material ||

      spec.materialId ||

      spec.primarySpecies ||

      spec.woodSpeciesLabel ||

      spec.metalMaterial ||

      spec.acrylicType ||

      'maple',

    primarySpecies: spec.primarySpecies || spec.woodSpecies || '',

    secondarySpecies: spec.secondarySpecies || '',

    metalMaterial: spec.metalMaterial || '',

    acrylicType: spec.acrylicType || '',

    lugQuantity: toNumber(spec.lugQuantity ?? spec.lugs, width <= 12 ? 6 : 10),

    staveCount:

      spec.staveCount == null || spec.staveCount === ''

        ? null

        : toNumber(spec.staveCount, null),

    shellThicknessMm,

    thicknessMm: shellThicknessMm,

    shellThickness: shellThicknessMm,

    shellThicknessBucket:

      spec.shellThicknessBucket || normalizeShellThicknessBucket(shellThicknessMm),

    hoopType: spec.hoopType || 'Triple Flange',

    hardwareType: spec.hardwareType || 'Tube Lugs',

    hardwareFinish: spec.hardwareFinish || spec.hardwareColor || 'Chrome',

    bearingEdge: spec.bearingEdge || 'Standard 45',

    snareBedDepth: spec.snareBedDepth || 'Standard',

    finish: spec.finish || spec.scorchDepth || 'Neutral Satin',

    drumhead: spec.drumhead || spec.batterHead || 'Coated Single Ply',

    tension: spec.tension || spec.tuningRange || 'Medium',

    snareSideHead: spec.snareSideHead || spec.resoHead || 'Standard 3mil',

    snareWireCount: toNumber(spec.snareWireCount, 20),

    snareWireStyle: spec.snareWireStyle || 'Standard',

    snareWireMaterial: spec.snareWireMaterial || 'Steel',

    reRings: spec.reRings || 'None',

  };

}

export default normalizeDrumSpec;