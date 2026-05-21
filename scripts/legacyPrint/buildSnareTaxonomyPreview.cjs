
const fs = require('fs');

const IN_JSON = 'src/legacyPrint/reviewPlans/snare-config-option-inventory.json';

const OUT_JSON = 'src/legacyPrint/reviewPlans/snare-taxonomy-preview.json';

const OUT_MD = 'src/legacyPrint/reviewPlans/snare-taxonomy-preview.md';

const inventory = JSON.parse(fs.readFileSync(IN_JSON, 'utf8'));

const normalize = value => {

  if (value === null || value === undefined) return '';

  return String(value)

    .trim()

    .toLowerCase()

    .replace(/[“”]/g, '"')

    .replace(/[’]/g, "'")

    .replace(/\s+/g, ' ');

};

const groupMaterial = value => {

  const v = normalize(value);

  if (!v || v === 'unknown_or_missing') return 'unknownMaterial';

  if (v.includes('bell brass')) return 'bellBrass';

  if (v.includes('chrome over brass')) return 'brass';

  if (v.includes('brass')) return 'brass';

  if (v.includes('stainless steel')) return 'stainlessSteel';

  if (v.includes('steel')) return 'steel';

  if (v.includes('aluminum') || v.includes('aluminium')) return 'aluminum';

  if (v.includes('bronze')) return 'bronze';

  if (v.includes('copper')) return 'copper';

  if (v.includes('titanium')) return 'titanium';

  if (v.includes('maple') && v.includes('poplar')) return 'maplePoplar';

  if (v.includes('maple') && v.includes('walnut')) return 'mapleWalnut';

  if (v.includes('mahogany') && v.includes('poplar')) return 'mahoganyPoplar';

  if (v.includes('maple')) return 'maple';

  if (v.includes('birch')) return 'birch';

  if (v.includes('beech')) return 'beech';

  if (v.includes('mahogany')) return 'mahogany';

  if (v.includes('walnut')) return 'walnut';

  if (v.includes('oak')) return 'oak';

  if (v.includes('cherry')) return 'cherry';

  if (v.includes('bubinga')) return 'bubinga';

  if (v.includes('poplar')) return 'poplar';

  if (v.includes('gum')) return 'gum';

  if (v.includes('jarrah')) return 'jarrah';

  if (v.includes('marri')) return 'marri';

  if (v.includes('wandoo')) return 'wandoo';

  if (v.includes('ash')) return 'ash';

  if (v.includes('purpleheart')) return 'purpleheart';

  if (v.includes('rosewood')) return 'rosewood';

  if (v.includes('cordia')) return 'cordia';

  if (v.includes('spruce')) return 'spruce';

  if (v.includes('zelkova')) return 'zelkova';

  if (v.includes('acrylic')) return 'acrylic';

  if (v === 'wood') return 'genericWood';

  return 'otherMaterial';

};

const groupConstruction = value => {

  const v = normalize(value);

  if (!v || v === 'unknown_or_missing') return 'unknownConstruction';

  if (v.includes('cast metal')) return 'castMetal';

  if (v.includes('seamless metal')) return 'seamlessMetal';

  if (v.includes('beaded metal')) return 'beadedMetal';

  if (v.includes('metal')) return 'metal';

  if (v.includes('ply with reinforcement')) return 'plyWithReinforcementRings';

  if (v.includes('ply / resonator')) return 'plyResonator';

  if (v.includes('ply')) return 'ply';

  if (v.includes('steam bent')) return 'steamBent';

  if (v.includes('solid')) return 'solidShell';

  if (v.includes('block')) return 'block';

  if (v.includes('stave')) return 'stave';

  if (v.includes('acrylic')) return 'acrylic';

  if (v.includes('composite')) return 'composite';

  if (v.includes('hybrid')) return 'hybrid';

  return 'otherConstruction';

};

const groupBearingEdge = value => {

  const v = normalize(value);

  if (!v || v === 'unknown_or_missing') return 'unknownBearingEdge';

  if (v.includes('[object object]')) return 'objectBearingEdgeNeedsFlattening';

  if (v.includes('rolled collar')) return 'rolledCollar';

  if (v.includes('rolled') || v.includes('flanged') || v.includes('folded') || v.includes('formed metal')) return 'rolledOrFormedMetal';

  if (v.includes('machined') && v.includes('metal')) return 'machinedMetal';

  if (v.includes('cast metal')) return 'machinedCastMetal';

  if (v.includes('30-degree') || v.includes('30°')) return 'rounder30Degree';

  if (v.includes('45-degree') || v.includes('45°') || v.includes('45 degree')) return 'sharper45Degree';

  if (v.includes('rounded') || v.includes('round-over') || v.includes('baseball-bat')) return 'roundedVintage';

  if (v.includes('soniclear')) return 'mapexSonicClear';

  if (v.includes('starclassic')) return 'tamaStarclassicEdge';

  if (v.includes('canopus')) return 'canopusPrecisionEdge';

  if (v.includes('ludwig')) return 'ludwigFamilyEdge';

  if (v.includes('tama')) return 'tamaWoodEdge';

  if (v.includes('yamaha')) return 'yamahaFamilyEdge';

  if (v.includes('customer-selected')) return 'customerSelectedEdge';

  if (v.includes('acrylic')) return 'acrylicEdge';

  return 'otherBearingEdge';

};

const groupHoop = value => {

  const v = normalize(value);

  if (!v || v === 'unknown_or_missing') return 'unknownHoop';

  if (v.includes('die-cast') || v.includes('die cast') || v.includes('diecast') || v.includes('mastercast') || v.includes('true-cast')) return 'dieCast';

  if (v.includes('s-hoop') || v.includes('sonic saver') || v.includes('sound arc')) return 'inwardFlangedControlHoop';

  if (v.includes('302')) return 'gretsch302';

  if (v.includes('triple') || v.includes('mighty hoop') || v.includes('power hoop') || v.includes('superhoop') || v.includes('true hoop')) return 'tripleFlanged';

  if (v.includes('double-flanged')) return 'doubleFlanged';

  if (v.includes('wood')) return 'woodHoop';

  if (v.includes('nickel-over-brass')) return 'brassHoop';

  if (v.includes('aluminum hoop')) return 'aluminumHoop';

  if (v.includes('grooved')) return 'tamaGroovedHoop';

  if (v.includes('stick saver') || v.includes('stick chopper')) return 'vintageFlangedHoop';

  if (v.includes('configurable')) return 'configurableHoop';

  return 'otherHoop';

};

const tallyGrouped = rawObj => {

  const grouped = {};

  const examples = {};

  for (const [raw, count] of Object.entries(rawObj || {})) {

    const family = rawObj === inventory.rawPromotedRecordsInventory.shellMaterials || rawObj === inventory.rawAllRecordsInventory.shellMaterials

      ? groupMaterial(raw)

      : 'unknown';

    grouped[family] = (grouped[family] || 0) + count;

    examples[family] = examples[family] || [];

    examples[family].push({ raw, count });

  }

  return { grouped, examples };

};

const tallyWithGrouper = (rawObj, grouper) => {

  const grouped = {};

  const examples = {};

  for (const [raw, count] of Object.entries(rawObj || {})) {

    const family = grouper(raw);

    grouped[family] = (grouped[family] || 0) + count;

    examples[family] = examples[family] || [];

    examples[family].push({ raw, count });

  }

  return {

    grouped: Object.fromEntries(Object.entries(grouped).sort((a, b) => b[1] - a[1])),

    examples: Object.fromEntries(

      Object.entries(examples).map(([family, list]) => [

        family,

        list.sort((a, b) => b.count - a.count).slice(0, 12)

      ])

    )

  };

};

const promotedRaw = inventory.rawPromotedRecordsInventory;

const allRaw = inventory.rawAllRecordsInventory;

const packet = {

  status: 'SNARE_TAXONOMY_PREVIEW_NO_FIRESTORE_WRITES',

  generatedAt: new Date().toISOString(),

  firestoreWrites: 0,

  summary: {

    totalFirestoreRecords: inventory.summary.totalFirestoreRecords,

    enginePromotedRecords: inventory.summary.enginePromotedRecords

  },

  promotedTaxonomy: {

    shellMaterialFamilies: tallyWithGrouper(promotedRaw.shellMaterials, groupMaterial),

    shellConstructionFamilies: tallyWithGrouper(promotedRaw.shellConstructions, groupConstruction),

    bearingEdgeFamilies: tallyWithGrouper(promotedRaw.bearingEdges, groupBearingEdge),

    hoopFamilies: tallyWithGrouper(promotedRaw.hoopTypes, groupHoop)

  },

  allRecordTaxonomy: {

    shellMaterialFamilies: tallyWithGrouper(allRaw.shellMaterials, groupMaterial),

    shellConstructionFamilies: tallyWithGrouper(allRaw.shellConstructions, groupConstruction),

    bearingEdgeFamilies: tallyWithGrouper(allRaw.bearingEdges, groupBearingEdge),

    hoopFamilies: tallyWithGrouper(allRaw.hoopTypes, groupHoop)

  }

};

fs.writeFileSync(OUT_JSON, JSON.stringify(packet, null, 2));

const table = obj => [

  '| Family | Count |',

  '|---|---:|',

  ...Object.entries(obj.grouped).map(([family, count]) => `| ${family} | ${count} |`)

].join('\n');

const md = [

  '# LegacyPrint Snare Taxonomy Preview',

  '',

  `Generated: ${packet.generatedAt}`,

  '',

  '## Summary',

  '',

  `- Total Firestore records: ${packet.summary.totalFirestoreRecords}`,

  `- Engine-promoted records: ${packet.summary.enginePromotedRecords}`,

  '- Firestore writes: 0',

  '',

  '# Promoted Record Taxonomy',

  '',

  '## Shell Material Families',

  table(packet.promotedTaxonomy.shellMaterialFamilies),

  '',

  '## Shell Construction Families',

  table(packet.promotedTaxonomy.shellConstructionFamilies),

  '',

  '## Bearing Edge Families',

  table(packet.promotedTaxonomy.bearingEdgeFamilies),

  '',

  '## Hoop Families',

  table(packet.promotedTaxonomy.hoopFamilies),

  '',

  '# Full Collection Taxonomy',

  '',

  '## Shell Material Families',

  table(packet.allRecordTaxonomy.shellMaterialFamilies),

  '',

  '## Shell Construction Families',

  table(packet.allRecordTaxonomy.shellConstructionFamilies),

  '',

  '## Bearing Edge Families',

  table(packet.allRecordTaxonomy.bearingEdgeFamilies),

  '',

  '## Hoop Families',

  table(packet.allRecordTaxonomy.hoopFamilies)

].join('\n');

fs.writeFileSync(OUT_MD, md);

console.log(JSON.stringify({

  outJson: OUT_JSON,

  outMd: OUT_MD,

  status: packet.status,

  firestoreWrites: 0,

  summary: packet.summary

}, null, 2));

