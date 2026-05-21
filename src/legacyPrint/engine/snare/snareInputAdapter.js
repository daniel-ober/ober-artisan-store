
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

  'undefined',

  'none'

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

const combineTexts = (...values) =>

  values

    .filter(hasMeaningfulValue)

    .map(normalizeText)

    .join(' ');

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

const groupShellLayup = value => {

  const text = normalizeText(value);

  if (!text) return 'unknownLayup';

  if (text.includes('maple/poplar/maple') || (text.includes('maple') && text.includes('poplar'))) return 'maplePoplarMapleLayup';

  if (text.includes('mahogany/poplar/mahogany') || (text.includes('mahogany') && text.includes('poplar'))) return 'mahoganyPoplarMahoganyLayup';

  if (text.includes('all-maple') || text.includes('all maple') || text.includes('maple')) return 'allMapleLayup';

  if (text.includes('hybrid')) return 'hybridLayup';

  return 'otherLayup';

};

const groupReinforcementRings = value => {

  const text = normalizeText(value);

  if (!text) return 'noReinforcementRings';

  if (text === 'true') return 'reinforcementRings';

  if (text.includes('sound focus')) return 'soundFocusRings';

  if (text.includes('reinforcement') || text.includes('re-ring') || text.includes('rerings') || text.includes('ring')) return 'reinforcementRings';

  return 'otherRings';

};

const groupFinishTreatment = value => {

  const text = normalizeText(value);

  if (!text) return 'unknownFinishTreatment';

  if (text.includes('lacquer') || text.includes('urethane')) return 'lacquerOrUrethaneFinish';

  if (text.includes('oil') || text.includes('wax')) return 'oilWaxFinish';

  if (text.includes('paint') || text.includes('wrap') || text.includes('sparkle')) return 'sealedDecorativeFinish';

  if (text.includes('raw') || text.includes('natural')) return 'lightNaturalFinish';

  return 'otherFinishTreatment';

};

const groupPlyCount = value => {

  const count = toNumber(value);

  if (!count) return 'unknownPlyCount';

  if (count <= 3) return 'threePlyOrLess';

  if (count <= 5) return 'fourToFivePly';

  if (count <= 7) return 'sixToSevenPly';

  if (count <= 10) return 'eightToTenPly';

  return 'elevenPlusPly';

};

const resolveShellConstructionFamily = ({ shellConstruction, reinforcementRings }) => {

  const constructionFamily = groupShellConstruction(shellConstruction);

  const ringFamily = groupReinforcementRings(reinforcementRings);

  if (constructionFamily === 'ply' && ['reinforcementRings', 'soundFocusRings', 'otherRings'].includes(ringFamily)) {

    return 'plyWithReinforcementRings';

  }

  return constructionFamily;

};

const getShellFamily = value => {

  const family = groupShellMaterial(value);

  return family;

};

const getDefaultBearingEdgeFamily = ({ shellMaterial, shellConstruction }) => {

  const materialFamily = getShellFamily(shellMaterial);

  const constructionFamily = groupShellConstruction(shellConstruction);

  if (

    ['bellBrass', 'brass', 'bronze', 'copper', 'steel', 'stainlessSteel', 'aluminum', 'titanium'].includes(materialFamily) ||

    String(constructionFamily || '').includes('metal')

  ) {

    return 'rolledCollar';

  }

  return 'sharper45Degree';

};

const getDefaultHoopFamily = ({ company }) => {

  const brand = normalizeText(company);

  if (brand.includes('gretsch')) return 'gretsch302';

  return 'tripleFlanged';

};

const getDefaultSnareBedFamily = ({ shellMaterial, shellConstruction }) => {

  const materialFamily = getShellFamily(shellMaterial);

  const constructionFamily = groupShellConstruction(shellConstruction);

  if (

    ['bellBrass', 'brass', 'bronze', 'copper', 'steel', 'stainlessSteel', 'aluminum', 'titanium'].includes(materialFamily) ||

    String(constructionFamily || '').includes('metal')

  ) {

    return 'minimalSnareBed';

  }

  return 'mediumSnareBed';

};

const groupBatterHead = value => {

  const text = normalizeText(value);

  if (!text) return 'defaultCoatedSinglePlyBatter';

  if (text.includes('controlled sound') || text.includes('cs ')) return 'controlledDotBatter';

  if (text.includes('emperor') || text.includes('g2')) return 'coatedTwoPlyBatter';

  if (text.includes('ambassador') || text.includes('g1') || text.includes('single')) return 'coatedSinglePlyBatter';

  if (text.includes('clear')) return 'clearSinglePlyBatter';

  return 'defaultCoatedSinglePlyBatter';

};

const groupResoHead = value => {

  const text = normalizeText(value);

  if (!text) return 'defaultClearSnareSideReso';

  if (text.includes('hazy') || text.includes('snare side') || text.includes('ambassador')) return 'clearSnareSideReso';

  return 'defaultClearSnareSideReso';

};

const groupSnareWires = value => {

  const text = normalizeText(value);

  if (!text) return 'defaultTwentyStrandSteelWires';

  if (text.includes('42')) return 'wideFortyTwoStrandWires';

  if (text.includes('30')) return 'wideThirtyStrandWires';

  if (text.includes('20')) return 'twentyStrandSteelWires';

  if (text.includes('brass')) return 'brassSnareWires';

  return 'defaultTwentyStrandSteelWires';

};

const adaptSnareReferenceRecord = row => {

  const shellMaterial1 = firstValue(row, ['shellMaterial1', 'shellMaterial', 'material']);

  const shellMaterial2 = firstValue(row, ['shellMaterial2', 'secondaryShellMaterial', 'material2']);

  const shellMaterial3 = firstValue(row, ['shellMaterial3', 'tertiaryShellMaterial', 'material3']);

  const shellLayup = firstValue(row, ['shellLayup', 'plyLayup', 'layup']);

  const shellMaterial = combineTexts(shellMaterial1, shellMaterial2, shellMaterial3, shellLayup) || shellMaterial1;

  const shellConstruction = firstValue(row, ['shellConstruction', 'construction']);

  const reinforcementRings = firstValue(row, ['reinforcementRings', 'reRings', 'rerings']);

  const finishTreatment = firstValue(row, ['finishTreatment', 'shellTreatment', 'finishType', 'finish']);

  const plyCount = firstValue(row, ['plyCount', 'plies']);

  const bearingEdge = firstValue(row, [

    'bearingEdge',

    'bearingEdgeType',

    'bearingEdgeProfile',

    'bearingEdgeDetail',

    'bearingEdgeDescription'

  ]);

  const hoopType = firstValue(row, ['hoopType', 'hoops', 'rimType']);

  const snareBed = firstValue(row, ['snareBed', 'snareBedType']);

  const stockBatterHead = firstValue(row, [

    'stockBatterHead',

    'stockBatter',

    'batterHead',

    'batter',

    'headBatter'

  ]);

  const stockResoHead = firstValue(row, [

    'stockResoHead',

    'stockResonantHead',

    'resoHead',

    'resonantHead',

    'snareSideHead'

  ]);

  const stockSnareWires = firstValue(row, [

    'stockSnareWires',

    'snareWires',

    'wires'

  ]);

  const diameter = firstValue(row, ['diameter', 'diameterInches']);

  const depth = firstValue(row, ['depth', 'depthInches']);

  const shellThickness = firstValue(row, ['shellThicknessMm', 'shellThickness', 'thicknessMm']);

  const lugCount = firstValue(row, ['lugCount', 'lugs']);

  const bearingEdgeFamily = hasMeaningfulValue(bearingEdge)

    ? groupBearingEdge(bearingEdge)

    : getDefaultBearingEdgeFamily({ shellMaterial, shellConstruction });

  const hoopFamily = hasMeaningfulValue(hoopType)

    ? groupHoop(hoopType)

    : getDefaultHoopFamily({ company: firstValue(row, ['companyName', 'company', 'brand']) });

  const snareBedFamily = hasMeaningfulValue(snareBed)

    ? groupSnareBed(snareBed)

    : getDefaultSnareBedFamily({ shellMaterial, shellConstruction });

  return {

    id: row.id || row.referenceId || row.slug || '',

    company: firstValue(row, ['companyName', 'company', 'brand']) || 'Unknown',

    model: firstValue(row, ['modelName', 'model', 'name']) || 'Unknown model',

    lineSeries: firstValue(row, ['lineSeries', 'series', 'line']) || '',

    readinessTier: row.legacyPrintEngineReadinessTier || '',

    promotionRule: row.legacyPrintEnginePromotionRule || '',

    raw: {

      shellMaterial: shellMaterial || '',

      shellMaterial1: shellMaterial1 || '',

      shellMaterial2: shellMaterial2 || '',

      shellMaterial3: shellMaterial3 || '',

      shellLayup: shellLayup || '',

      shellConstruction: shellConstruction || '',

      reinforcementRings: reinforcementRings || '',

      finishTreatment: finishTreatment || '',

      plyCount: plyCount || '',

      bearingEdge: bearingEdge || '',

      hoopType: hoopType || '',

      snareBed: snareBed || '',

      stockBatterHead: stockBatterHead || '',

      stockResoHead: stockResoHead || '',

      stockSnareWires: stockSnareWires || '',

      diameter: diameter || '',

      depth: depth || '',

      shellThickness: shellThickness || '',

      lugCount: lugCount || ''

    },

    numeric: {

      diameter: toNumber(diameter),

      depth: toNumber(depth),

      shellThicknessMm: toNumber(shellThickness),

      lugCount: toNumber(lugCount),

      plyCount: toNumber(plyCount)

    },

    families: {

      shellMaterial: groupShellMaterial(shellMaterial),

      shellLayup: groupShellLayup(shellLayup || shellMaterial),

      shellConstruction: resolveShellConstructionFamily({ shellConstruction, reinforcementRings }),

      reinforcementRings: groupReinforcementRings(reinforcementRings),

      finishTreatment: groupFinishTreatment(finishTreatment),

      plyCount: groupPlyCount(plyCount),

      bearingEdge: bearingEdgeFamily,

      hoopType: hoopFamily,

      snareBed: snareBedFamily,

      batterHead: groupBatterHead(stockBatterHead),

      resoHead: groupResoHead(stockResoHead),

      snareWires: groupSnareWires(stockSnareWires)

    },

    fallbackAssumptions: {

      bearingEdgeFallbackApplied: !hasMeaningfulValue(bearingEdge),

      bearingEdgeFallbackReason: !hasMeaningfulValue(bearingEdge)

        ? 'No source-confirmed bearing edge was available for this reference record.'

        : '',

      hoopFallbackApplied: !hasMeaningfulValue(hoopType),

      hoopFallbackReason: !hasMeaningfulValue(hoopType)

        ? 'No source-confirmed hoop type was available for this reference record.'

        : '',

      snareBedFallbackApplied: !hasMeaningfulValue(snareBed),

      snareBedFallbackReason: !hasMeaningfulValue(snareBed)

        ? 'No source-confirmed snare bed was available for this reference record.'

        : '',

      batterHeadFallbackApplied: !hasMeaningfulValue(stockBatterHead),

      resoHeadFallbackApplied: !hasMeaningfulValue(stockResoHead),

      snareWireFallbackApplied: !hasMeaningfulValue(stockSnareWires)

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

  groupShellLayup,

  groupReinforcementRings,

  groupFinishTreatment,

  groupPlyCount,

  groupBearingEdge,

  groupHoop,

  groupSnareBed,

  groupBatterHead,

  groupResoHead,

  groupSnareWires,

  adaptSnareReferenceRecord

};

