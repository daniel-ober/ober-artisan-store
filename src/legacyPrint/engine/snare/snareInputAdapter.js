
const UNKNOWN_VALUES = new Set([

  '',

  'unknown',

  'unknown_or_missing',

  'n/a',

  'na',

  'not verified',

  'notverified',

  'tbd',

  'null',

  'undefined'

]);

const hasMeaningfulValue = value => {

  if (value === null || value === undefined) return false;

  if (typeof value === 'number') return Number.isFinite(value);

  const text = String(value).trim().toLowerCase();

  return !UNKNOWN_VALUES.has(text);

};

const normalizeText = value => {

  if (value === null || value === undefined) return '';

  if (typeof value === 'object') {

    return JSON.stringify(value)

      .trim()

      .toLowerCase()

      .replace(/[“”]/g, '"')

      .replace(/[’]/g, "'")

      .replace(/\s+/g, ' ');

  }

  return String(value)

    .trim()

    .toLowerCase()

    .replace(/[“”]/g, '"')

    .replace(/[’]/g, "'")

    .replace(/\s+/g, ' ');

};

const firstValue = (row, keys) => {

  for (const key of keys) {

    if (hasMeaningfulValue(row[key])) return row[key];

  }

  return undefined;

};

const toNumber = value => {

  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  if (typeof value === 'string') {

    const normalized = value.replace(/,/g, '.');

    const number = Number(normalized.replace(/[^0-9.]/g, ''));

    return Number.isFinite(number) ? number : null;

  }

  return null;

};

const groupShellMaterial = value => {

  const text = normalizeText(value);

  if (!text) return 'unknownMaterial';

  if (text.includes('bell brass')) return 'bellBrass';

  if (text.includes('chrome over brass')) return 'brass';

  if (text.includes('brass')) return 'brass';

  if (text.includes('stainless steel')) return 'stainlessSteel';

  if (text.includes('steel')) return 'steel';

  if (text.includes('aluminum') || text.includes('aluminium')) return 'aluminum';

  if (text.includes('bronze')) return 'bronze';

  if (text.includes('copper')) return 'copper';

  if (text.includes('titanium')) return 'titanium';

  if (text.includes('maple') && text.includes('poplar')) return 'maplePoplar';

  if (text.includes('maple') && text.includes('walnut')) return 'mapleWalnut';

  if (text.includes('mahogany') && text.includes('poplar')) return 'mahoganyPoplar';

  if (text.includes('maple')) return 'maple';

  if (text.includes('birch')) return 'birch';

  if (text.includes('beech')) return 'beech';

  if (text.includes('mahogany')) return 'mahogany';

  if (text.includes('walnut')) return 'walnut';

  if (text.includes('oak')) return 'oak';

  if (text.includes('cherry')) return 'cherry';

  if (text.includes('bubinga')) return 'bubinga';

  if (text.includes('poplar')) return 'poplar';

  if (text.includes('gum')) return 'gum';

  if (text.includes('jarrah')) return 'jarrah';

  if (text.includes('marri')) return 'marri';

  if (text.includes('wandoo')) return 'wandoo';

  if (text.includes('ash')) return 'ash';

  if (text.includes('purpleheart')) return 'purpleheart';

  if (text.includes('rosewood')) return 'rosewood';

  if (text.includes('cordia')) return 'cordia';

  if (text.includes('spruce')) return 'spruce';

  if (text.includes('zelkova')) return 'zelkova';

  if (text.includes('acrylic')) return 'acrylic';

  if (text === 'wood') return 'genericWood';

  return 'otherMaterial';

};

const groupShellConstruction = value => {

  const text = normalizeText(value);

  if (!text) return 'unknownConstruction';

  if (text.includes('cast metal')) return 'castMetal';

  if (text.includes('seamless metal')) return 'seamlessMetal';

  if (text.includes('beaded metal')) return 'beadedMetal';

  if (text.includes('metal')) return 'metal';

  if (text.includes('ply with reinforcement')) return 'plyWithReinforcementRings';

  if (text.includes('ply / resonator')) return 'plyResonator';

  if (text.includes('ply')) return 'ply';

  if (text.includes('steam bent')) return 'steamBent';

  if (text.includes('solid')) return 'solidShell';

  if (text.includes('block')) return 'block';

  if (text.includes('stave')) return 'stave';

  if (text.includes('acrylic')) return 'acrylic';

  if (text.includes('composite')) return 'composite';

  if (text.includes('hybrid')) return 'hybrid';

  return 'otherConstruction';

};

const groupBearingEdge = value => {

  const text = normalizeText(value);

  if (!text) return 'unknownBearingEdge';

  if (text.includes('45') && text.includes('round')) return 'rounded45Degree';

  if (text.includes('rolled collar')) return 'rolledCollar';

  if (

    text.includes('rolled') ||

    text.includes('flanged') ||

    text.includes('folded') ||

    text.includes('formed metal')

  ) {

    return 'rolledOrFormedMetal';

  }

  if (text.includes('machined') && text.includes('metal')) return 'machinedMetal';

  if (text.includes('cast metal')) return 'machinedCastMetal';

  if (text.includes('30-degree') || text.includes('30°') || text.includes('30 degree')) return 'rounder30Degree';

  if (text.includes('45-degree') || text.includes('45°') || text.includes('45 degree')) return 'sharper45Degree';

  if (text.includes('rounded') || text.includes('round-over') || text.includes('baseball-bat')) return 'roundedVintage';

  if (text.includes('soniclear')) return 'mapexSonicClear';

  if (text.includes('starclassic')) return 'tamaStarclassicEdge';

  if (text.includes('canopus')) return 'canopusPrecisionEdge';

  if (text.includes('ludwig')) return 'ludwigFamilyEdge';

  if (text.includes('tama')) return 'tamaWoodEdge';

  if (text.includes('yamaha')) return 'yamahaFamilyEdge';

  if (text.includes('customer-selected')) return 'customerSelectedEdge';

  if (text.includes('acrylic')) return 'acrylicEdge';

  if (text.includes('{') && text.includes('}')) return 'structuredBearingEdge';

  return 'otherBearingEdge';

};

const groupHoop = value => {

  const text = normalizeText(value);

  if (!text) return 'unknownHoop';

  if (

    text.includes('die-cast') ||

    text.includes('die cast') ||

    text.includes('diecast') ||

    text.includes('mastercast') ||

    text.includes('true-cast')

  ) {

    return 'dieCast';

  }

  if (text.includes('s-hoop') || text.includes('sonic saver') || text.includes('sound arc')) return 'inwardFlangedControlHoop';

  if (text.includes('302')) return 'gretsch302';

  if (

    text.includes('triple') ||

    text.includes('mighty hoop') ||

    text.includes('power hoop') ||

    text.includes('superhoop') ||

    text.includes('true hoop')

  ) {

    return 'tripleFlanged';

  }

  if (text.includes('double-flanged')) return 'doubleFlanged';

  if (text.includes('wood')) return 'woodHoop';

  if (text.includes('nickel-over-brass')) return 'brassHoop';

  if (text.includes('aluminum hoop')) return 'aluminumHoop';

  if (text.includes('grooved')) return 'tamaGroovedHoop';

  if (text.includes('stick saver') || text.includes('stick chopper')) return 'vintageFlangedHoop';

  if (text.includes('configurable')) return 'configurableHoop';

  return 'otherHoop';

};

const groupSnareBed = value => {

  const text = normalizeText(value);

  if (!text) return 'unknownSnareBed';

  if (text.includes('minimal')) return 'minimalSnareBed';

  if (text.includes('shallow')) return 'shallowSnareBed';

  if (text.includes('medium')) return 'mediumSnareBed';

  if (text.includes('deep')) return 'deepSnareBed';

  if (text.includes('2.7')) return 'measuredMediumSnareBed';

  return 'otherSnareBed';

};

const adaptSnareReferenceRecord = row => {

  const shellMaterial = firstValue(row, ['shellMaterial1', 'shellMaterial', 'material']);

  const shellConstruction = firstValue(row, ['shellConstruction', 'construction']);

  const bearingEdge = firstValue(row, [

    'bearingEdge',

    'bearingEdgeType',

    'bearingEdgeProfile',

    'bearingEdgeDetail',

    'bearingEdgeDescription'

  ]);

  const hoopType = firstValue(row, ['hoopType', 'hoops', 'rimType']);

  const snareBed = firstValue(row, ['snareBed', 'snareBedType']);

  const diameter = firstValue(row, ['diameter', 'diameterInches']);

  const depth = firstValue(row, ['depth', 'depthInches']);

  const shellThickness = firstValue(row, ['shellThicknessMm', 'shellThickness', 'thicknessMm']);

  const lugCount = firstValue(row, ['lugCount', 'lugs']);

  return {

    id: row.id || row.referenceId || row.slug || '',

    company: firstValue(row, ['companyName', 'company', 'brand']) || 'Unknown',

    model: firstValue(row, ['modelName', 'model', 'name']) || 'Unknown model',

    lineSeries: firstValue(row, ['lineSeries', 'series', 'line']) || '',

    readinessTier: row.legacyPrintEngineReadinessTier || '',

    promotionRule: row.legacyPrintEnginePromotionRule || '',

    raw: {

      shellMaterial: shellMaterial || '',

      shellConstruction: shellConstruction || '',

      bearingEdge: bearingEdge || '',

      hoopType: hoopType || '',

      snareBed: snareBed || '',

      diameter: diameter || '',

      depth: depth || '',

      shellThickness: shellThickness || '',

      lugCount: lugCount || ''

    },

    numeric: {

      diameter: toNumber(diameter),

      depth: toNumber(depth),

      shellThicknessMm: toNumber(shellThickness),

      lugCount: toNumber(lugCount)

    },

    families: {

      shellMaterial: groupShellMaterial(shellMaterial),

      shellConstruction: groupShellConstruction(shellConstruction),

      bearingEdge: groupBearingEdge(bearingEdge),

      hoopType: groupHoop(hoopType),

      snareBed: groupSnareBed(snareBed)

    }

  };

};

module.exports = {

  hasMeaningfulValue,

  normalizeText,

  firstValue,

  toNumber,

  groupShellMaterial,

  groupShellConstruction,

  groupBearingEdge,

  groupHoop,

  groupSnareBed,

  adaptSnareReferenceRecord

};

