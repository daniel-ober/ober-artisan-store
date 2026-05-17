// src/components/SnareReferenceResourceManager.js

import React, { useMemo, useState } from 'react';

import SnareReferenceEditor from './SnareReferenceEditor';

import {
  LEGACYPRINT_NODE_LABELS,
  LEGACYPRINT_NODE_ORDER,
} from '../data/legacyPrintCalibrationSeed';

const normalizeText = (value = '') => {
  return String(value || '')
    .toLowerCase()

    .replace(/[øØ]/g, 'o')

    .replace(/[^a-z0-9.]+/g, ' ')

    .trim();
};

const getNumberValue = (value) => {
  const parsed = Number.parseFloat(String(value || '').replace(/[^\d.]/g, ''));

  return Number.isFinite(parsed) ? parsed : '';
};

const flattenReadableValue = (value = '') => {
  if (value === undefined || value === null) return '';

  if (Array.isArray(value)) {
    return value

      .map((item) => flattenReadableValue(item))

      .filter(Boolean)

      .join(' / ');
  }

  if (typeof value === 'object') {
    const preferredKeys = [
      'label',

      'name',

      'value',

      'material',

      'shellMaterial',

      'shellMaterial1',

      'primaryShellMaterial',

      'wood',

      'metal',

      'type',

      'text',

      'description',
    ];

    for (const key of preferredKeys) {
      if (
        value[key] !== undefined &&
        value[key] !== null &&
        String(value[key]).trim() !== ''
      ) {
        return flattenReadableValue(value[key]);
      }
    }

    return Object.values(value)

      .map((item) => flattenReadableValue(item))

      .filter(Boolean)

      .join(' / ');
  }

  return String(value || '').trim();
};

const getFieldValue = (drum = {}, field = '') => {
  if (!field) return '';

  if (!field.includes('.')) {
    return drum[field] ?? '';
  }

  return (
    field.split('.').reduce((acc, key) => {
      if (acc === undefined || acc === null) return '';

      return acc[key];
    }, drum) ?? ''
  );
};

const getFirstPresentValue = (drum = {}, fields = []) => {
  for (const field of fields) {
    const value = getFieldValue(drum, field);

    const cleanValue = flattenReadableValue(value);

    if (cleanValue !== '') {
      return value;
    }
  }

  return '';
};

const CANONICAL_COMPANY_TYPE_LABELS = [
  {
    label: 'Major Manufacturer',

    matches: [
      'major manufacturer',

      'major manufactuer',

      'mass market manufacturer',

      'corporate manufacturer',

      'historic revived american drum manufacturer',

      'historic vintage american drum manufacturer',

      'historic american manufacturer',

      'pdp dw sub brand',

      'accessory drum product manufacturer',
    ],
  },

  {
    label: 'Boutique Builder',

    matches: [
      'boutique builder',

      'custom builder',

      'boutique custom builder',

      'boutique custom drum builder',

      'boutique specialty manufacturer',

      'independent boutique builder',

      'independent boutique production',

      'custom drum builder',

      'custom shop',

      'artisan builder',
    ],
  },

  {
    label: 'Independent Builder',

    matches: [
      'independent builder',

      'small builder',

      'small shop builder',

      'independent drum builder',

      'custom independent builder',
    ],
  },

  {
    label: 'OEM / Parts Supplier',

    matches: [
      'oem parts supplier',

      'oem supplier',

      'parts supplier',

      'production snare brand',

      'hardware supplier',
    ],
  },

  {
    label: 'Generic / Baseline Reference',

    matches: [
      'generic baseline reference',

      'generic reference',

      'baseline reference',
    ],
  },
];

const canonicalizeCompanyType = (value = '') => {
  const readableValue = flattenReadableValue(value);

  const normalized = normalizeText(readableValue);

  if (!normalized) return '';

  const match = CANONICAL_COMPANY_TYPE_LABELS.find((group) =>
    group.matches.some((item) => normalized.includes(normalizeText(item)))
  );

  return match?.label || readableValue;
};

const canonicalizeDrumType = (value = '') => {
  const readableValue = flattenReadableValue(value);

  const normalized = normalizeText(readableValue);

  if (!normalized) return 'Snare';

  if (
    normalized.includes('snare') ||
    normalized.includes('concert snare') ||
    normalized.includes('field drum') ||
    normalized.includes('piccolo')
  ) {
    return 'Snare';
  }

  if (normalized.includes('rack tom')) return 'Rack Tom';

  if (normalized.includes('floor tom')) return 'Floor Tom';

  if (normalized.includes('bass drum') || normalized.includes('kick')) {
    return 'Bass Drum';
  }

  return readableValue;
};

const canonicalizeBooleanish = (value = '') => {
  const readableValue = flattenReadableValue(value);

  const normalized = normalizeText(readableValue);

  if (!normalized) return '';

  if (
    [
      'yes',

      'true',

      'y',

      'current',

      'in production',

      'currently in production',
    ].includes(normalized)
  ) {
    return 'Yes';
  }

  if (
    [
      'no',

      'false',

      'n',

      'not current',

      'not in production',

      'not currently in production',
    ].includes(normalized)
  ) {
    return 'No';
  }

  return readableValue;
};

const canonicalizeMaterial = (value = '', options = {}) => {
  const { allowFallback = true } = options;

  const readableValue = flattenReadableValue(value);

  const normalized = normalizeText(readableValue);

  if (!normalized) return '';

  const materialMatches = [
    ['black nickel over brass', 'Black Nickel over Brass'],

    ['chrome over brass', 'Chrome over Brass'],

    ['nickel over brass', 'Nickel over Brass'],

    ['bell brass', 'Bell Brass'],

    ['hammered brass', 'Hammered Brass'],

    ['raw brass', 'Raw Brass'],

    ['brass', 'Brass'],

    ['phosphor bronze', 'Phosphor Bronze'],

    ['bronze', 'Bronze'],

    ['copper', 'Copper'],

    ['aluminum', 'Aluminum'],

    ['aluminium', 'Aluminum'],

    ['stainless steel', 'Stainless Steel'],

    ['steel', 'Steel'],

    ['titanium', 'Titanium'],

    ['iron', 'Iron'],

    ['maple gum', 'Maple / Gum'],

    ['maple/gum', 'Maple / Gum'],

    ['maple poplar', 'Maple / Poplar'],

    ['maple/poplar', 'Maple / Poplar'],

    ['maple mahogany', 'Maple / Mahogany'],

    ['maple/mahogany', 'Maple / Mahogany'],

    ['mahogany poplar', 'Mahogany / Poplar'],

    ['mahogany/poplar', 'Mahogany / Poplar'],

    ['birch bubinga', 'Birch / Bubinga'],

    ['birch/bubinga', 'Birch / Bubinga'],

    ['walnut birch', 'Walnut / Birch'],

    ['walnut/birch', 'Walnut / Birch'],

    ['maple walnut', 'Maple / Walnut'],

    ['maple/walnut', 'Maple / Walnut'],

    ['raw brass raw steel wood', 'Raw Brass / Raw Steel / Wood'],

    ['raw brass raw steel', 'Raw Brass / Raw Steel'],

    ['brass steel wood', 'Brass / Steel / Wood'],

    ['brass steel', 'Brass / Steel'],

    ['maple', 'Maple'],

    ['walnut', 'Walnut'],

    ['mahogany', 'Mahogany'],

    ['oak', 'Oak'],

    ['birch', 'Birch'],

    ['cherry', 'Cherry'],

    ['beech', 'Beech'],

    ['poplar', 'Poplar'],

    ['bubinga', 'Bubinga'],

    ['kapur', 'Kapur'],

    ['spruce', 'Spruce'],

    ['sassafras', 'Sassafras'],

    ['ash', 'Ash'],

    ['rose gum', 'Rose Gum'],

    ['gum', 'Gum'],

    ['acrylic', 'Acrylic'],

    ['carbon fiber', 'Carbon Fiber'],
  ];

  const match = materialMatches.find(([needle]) =>
    normalized.includes(normalizeText(needle))
  );

  if (match?.[1]) return match[1];

  return allowFallback ? readableValue : '';
};

const WOOD_MATERIAL_TERMS = [
  'maple',

  'birch',

  'mahogany',

  'poplar',

  'walnut',

  'oak',

  'cherry',

  'beech',

  'bubinga',

  'kapur',

  'spruce',

  'sassafras',

  'ash',

  'gum',

  'rose gum',
];

const METAL_MATERIAL_TERMS = [
  'brass',

  'bell brass',

  'bronze',

  'copper',

  'aluminum',

  'aluminium',

  'steel',

  'stainless steel',

  'titanium',

  'iron',
];

const isWoodMaterialText = (value = '') => {
  const normalized = normalizeText(value);

  return WOOD_MATERIAL_TERMS.some((term) =>
    normalized.includes(normalizeText(term))
  );
};

const isMetalMaterialText = (value = '') => {
  const normalized = normalizeText(value);

  return METAL_MATERIAL_TERMS.some((term) =>
    normalized.includes(normalizeText(term))
  );
};

const canonicalizeShellConstruction = (value = '', options = {}) => {
  const { allowLooseHybrid = false } = options;

  const readableValue = flattenReadableValue(value);

  const normalized = normalizeText(readableValue);

  if (!normalized) return '';

  if (
    normalized.includes('steam bent') ||
    normalized.includes('steambent') ||
    normalized.includes('steam-bent') ||
    normalized.includes('single ply') ||
    normalized.includes('1 ply') ||
    normalized.includes('one ply')
  ) {
    return 'Steam Bent';
  }

  if (
    normalized.includes('solid shell') ||
    normalized.includes('one piece') ||
    normalized.includes('single piece') ||
    normalized === 'solid'
  ) {
    return 'Solid Shell';
  }

  if (normalized.includes('stave')) {
    return 'Stave';
  }

  if (
    allowLooseHybrid &&
    (normalized.includes('hybrid shell') ||
      normalized.includes('hybrid construction') ||
      normalized.includes('wood metal') ||
      normalized.includes('wood/metal') ||
      normalized.includes('wood and metal'))
  ) {
    return 'Hybrid';
  }

  if (
    normalized.includes('acrylic') ||
    normalized.includes('plexiglass') ||
    normalized.includes('vistalite')
  ) {
    return 'Acrylic';
  }

  if (
    normalized.includes('seamless') ||
    normalized.includes('spun') ||
    normalized.includes('rolled') ||
    normalized.includes('cast') ||
    normalized.includes('beaded metal') ||
    normalized.includes('metal shell')
  ) {
    return 'Metal';
  }

  if (isMetalMaterialText(normalized)) {
    return 'Metal';
  }

  if (
    normalized.includes('ply shell') ||
    normalized.includes('plies') ||
    normalized.includes('laminated') ||
    normalized.includes('cross laminated') ||
    normalized.includes('cross-laminated')
  ) {
    return 'Ply';
  }

  if (isWoodMaterialText(normalized)) {
    return 'Ply';
  }

  return '';
};

const canonicalizeHoop = (value = '') => {
  const readableValue = flattenReadableValue(value);

  const normalized = normalizeText(readableValue);

  if (!normalized) return '';

  if (normalized.includes('die cast') || normalized.includes('diecast')) {
    return 'Die-Cast';
  }

  if (normalized.includes('single flange')) return 'Single Flange';

  if (normalized.includes('triple') || normalized.includes('flange')) {
    if (normalized.includes('1.6')) return 'Triple Flange 1.6mm';

    if (normalized.includes('3.0') || normalized.includes('3mm')) {
      return 'Triple Flange 3.0mm';
    }

    return 'Triple Flange 2.3mm';
  }

  if (normalized.includes('wood')) return 'Wood Hoop';

  if (normalized.includes('s hoop') || normalized.includes('s-hoop')) {
    return 'S-Hoop';
  }

  return readableValue;
};

const canonicalizeReinforcementRings = (value = '') => {
  const readableValue = flattenReadableValue(value);

  const normalized = normalizeText(readableValue);

  if (!normalized) return '';

  if (
    normalized === 'no' ||
    normalized === 'none' ||
    normalized.includes('without') ||
    normalized.includes('no reinforcement') ||
    normalized.includes('no re ring')
  ) {
    return 'No Reinforcement Rings';
  }

  if (
    normalized === 'yes' ||
    normalized.includes('with reinforcement') ||
    normalized.includes('re rings') ||
    normalized.includes('reinforcement rings')
  ) {
    return 'Reinforcement Rings';
  }

  return readableValue;
};

const inferMaterialFromText = (drum = {}) => {
  const searchableText = [
    drum.modelName,

    drum.model,

    drum.modelNumber,

    drum.lineSeries,

    drum.line,

    drum.series,

    drum.shellConstruction,

    drum.normalizedShellConstruction,

    drum.scoringBasis,

    drum.drumSummaryNotes,

    drum.notesOnMissingData,

    drum.notes,

    drum.description,

    drum.shellNotes,

    drum.primarySourceUrl,

    drum.secondarySourceUrl,
  ]

    .filter(Boolean)

    .map((value) => flattenReadableValue(value))

    .join(' ');

  return canonicalizeMaterial(searchableText, { allowFallback: false });
};

const inferShellConstructionFromText = (drum = {}) => {
  const explicitConstructionText = [
    drum.shellConstruction,

    drum.normalizedShellConstruction,

    drum.construction,

    drum.shellType,

    drum.shell_construction,

    drum.shellNotes,

    drum.scoringBasis,

    drum.drumSummaryNotes,

    drum.notesOnMissingData,

    drum.notes,

    drum.description,
  ]

    .filter(Boolean)

    .map((value) => flattenReadableValue(value))

    .join(' ');

  const explicitConstruction = canonicalizeShellConstruction(
    explicitConstructionText,

    {
      allowLooseHybrid: true,
    }
  );

  if (explicitConstruction) return explicitConstruction;

  const materialText = [
    drum.shellMaterial1,

    drum.shellMaterial2,

    drum.shellMaterial3,

    drum.primaryShellMaterial,

    drum.secondaryShellMaterial,

    drum.tertiaryShellMaterial,

    drum.shellMaterial,

    drum.material,

    drum.normalizedShellMaterial,

    drum.normalizedMaterial,

    getDrumShellMaterial1(drum),

    getDrumShellMaterial2(drum),

    getDrumShellMaterial3(drum),
  ]

    .filter(Boolean)

    .map((value) => flattenReadableValue(value))

    .join(' ');

  const materialBasedConstruction = canonicalizeShellConstruction(
    materialText,
    {
      allowLooseHybrid: false,
    }
  );

  if (materialBasedConstruction) return materialBasedConstruction;

  const modelFallbackText = [
    drum.modelName,

    drum.model,

    drum.modelNumber,

    drum.lineSeries,

    drum.line,

    drum.series,
  ]

    .filter(Boolean)

    .map((value) => flattenReadableValue(value))

    .join(' ');

  const normalizedModelFallback = normalizeText(modelFallbackText);

  if (
    normalizedModelFallback.includes('bell brass') ||
    normalizedModelFallback.includes('brass') ||
    normalizedModelFallback.includes('bronze') ||
    normalizedModelFallback.includes('copper') ||
    normalizedModelFallback.includes('aluminum') ||
    normalizedModelFallback.includes('aluminium') ||
    normalizedModelFallback.includes('steel') ||
    normalizedModelFallback.includes('titanium')
  ) {
    return 'Metal';
  }

  if (
    normalizedModelFallback.includes('acrylic') ||
    normalizedModelFallback.includes('vistalite')
  ) {
    return 'Acrylic';
  }

  return '';
};

const getDrumCompanyName = (drum = {}) => {
  return flattenReadableValue(
    getFirstPresentValue(drum, ['companyName', 'company', 'brand'])
  );
};

const getDrumCompanyType = (drum = {}) => {
  return canonicalizeCompanyType(
    getFirstPresentValue(drum, ['companyType', 'builderType'])
  );
};

const getDrumLineSeries = (drum = {}) => {
  return flattenReadableValue(
    getFirstPresentValue(drum, [
      'lineSeries',

      'line',

      'series',

      'productLine',

      'productSeries',
    ])
  );
};

const getDrumModelName = (drum = {}) => {
  return flattenReadableValue(
    getFirstPresentValue(drum, ['modelName', 'model', 'modelNumber'])
  );
};

const getDrumType = (drum = {}) => {
  return canonicalizeDrumType(getFirstPresentValue(drum, ['drumType', 'type']));
};

const getDrumDiameter = (drum = {}) => {

  return flattenReadableValue(

    getFirstPresentValue(drum, [

      'shell.dimensions.diameterInches',

      'diameter',

      'diameterInches',

    ])

  );

};

const getDrumDepth = (drum = {}) => {

  return flattenReadableValue(

    getFirstPresentValue(drum, [

      'shell.dimensions.depthInches',

      'depth',

      'depthInches',

    ])

  );

};

const getDrumShellConstruction = (drum = {}) => {

  const directValue = getFirstPresentValue(drum, [

    'shell.construction.shellConstruction',

    'shell.construction',

    'shell.normalizedConstruction',

    'shell.normalizedShellConstruction',

    'search.constructionKey',

    'shellConstruction',

    'normalizedShellConstruction',

    'construction',

    'shellType',

    'shell_construction',

  ]);

  const directConstruction = canonicalizeShellConstruction(directValue, {

    allowLooseHybrid: true,

  });

  if (directConstruction) return directConstruction;

  return inferShellConstructionFromText(drum);

};

const getDrumShellMaterial1 = (drum = {}) => {

  const directValue = getFirstPresentValue(drum, [

    'shell.construction.shellMaterialPrimary',

    'shell.material1',

    'shell.primaryMaterial',

    'shell.primaryShellMaterial',

    'shell.shellMaterial1',

    'search.materialKey',

    'shellMaterial1',

    'primaryShellMaterial',

    'shellMaterial',

    'material',

    'normalizedShellMaterial',

    'normalizedMaterial',

    'shell_material_1',

    'shell_material',

  ]);

  const canonicalDirectValue = canonicalizeMaterial(directValue, {

    allowFallback: false,

  });

  return canonicalDirectValue || inferMaterialFromText(drum);

};

const getDrumShellMaterial2 = (drum = {}) => {

  return canonicalizeMaterial(

    getFirstPresentValue(drum, [

      'shell.construction.shellMaterialSecondary',

      'shell.material2',

      'shell.secondaryMaterial',

      'shell.secondaryShellMaterial',

      'shellMaterial2',

      'secondaryShellMaterial',

      'shell_material_2',

    ]),

    { allowFallback: false }

  );

};

const getDrumShellMaterial3 = (drum = {}) => {

  return canonicalizeMaterial(

    getFirstPresentValue(drum, [

      'shell.construction.shellMaterialTertiary',

      'shell.material3',

      'shell.tertiaryMaterial',

      'shell.tertiaryShellMaterial',

      'shellMaterial3',

      'tertiaryShellMaterial',

      'shell_material_3',

    ]),

    { allowFallback: false }

  );

};

const getDrumShellThickness = (drum = {}) => {

  return flattenReadableValue(

    getFirstPresentValue(drum, [

      'shell.construction.shellThicknessMm',

      'shell.thicknessMm',

      'shell.shellThicknessMm',

      'shell.thickness',

      'shellThicknessMm',

      'thicknessMm',

      'shellThickness',

      'thickness',

      'shell_thickness_mm',

    ])

  );

};

const getDrumBearingEdge = (drum = {}) => {

  return flattenReadableValue(

    getFirstPresentValue(drum, [

      'shell.bearingEdges.batterSideProfile',

      'shell.bearingEdges.snareSideProfile',

      'shell.bearingEdge',

      'shell.bearingEdges',

      'bearingEdge',

      'bearingEdges',

    ])

  );

};

const getDrumReinforcementRings = (drum = {}) => {

  return canonicalizeReinforcementRings(

    getFirstPresentValue(drum, [

      'shell.construction.reinforcementRings',

      'shell.reinforcementRings',

      'shell.reinforcementRing',

      'shell.reRings',

      'reinforcementRings',

      'reinforcementRing',

      'reRings',

    ])

  );

};

const getDrumFinishType = (drum = {}) => {

  return flattenReadableValue(

    getFirstPresentValue(drum, [

      'shell.finish.finishType',

      'shell.finish.finishName',

      'shell.finishType',

      'shell.finish',

      'shell.finishTreatment',

      'finishType',

      'finish',

      'finishTreatment',

    ])

  );

};

const getDrumSnareBedType = (drum = {}) => {

  return flattenReadableValue(

    getFirstPresentValue(drum, [

      'shell.snareBeds.depthBucket',

      'shell.snareBeds.bedStyle',

      'shell.snareBedType',

      'shell.snareBed',

      'snareBedType',

      'snareBed',

    ])

  );

};

const getDrumHoopRimType = (drum = {}) => {

  return canonicalizeHoop(

    getFirstPresentValue(drum, [

      'stockHardware.hoops.batterHoopType',

      'stockHardware.hoops.resonantHoopType',

      'hardware.hoopRimType',

      'hardware.hoopType',

      'hardware.hoops',

      'hardware.rimType',

      'hardware.stockHoops',

      'hoopRimType',

      'hoopType',

      'hoops',

      'rimType',

      'stockHoops',

    ])

  );

};

const getDrumLugCount = (drum = {}) => {

  return flattenReadableValue(

    getFirstPresentValue(drum, [

      'stockHardware.lugs.lugCount',

      'hardware.lugCount',

      'hardware.lugs',

      'lugCount',

      'lugs',

    ])

  );

};

const getDrumStockBatterHead = (drum = {}) => {

  return flattenReadableValue(

    getFirstPresentValue(drum, [

      'stockSnareSystem.heads.batterHead',

      'hardware.stockBatterHead',

      'hardware.batterHead',

      'stockBatterHead',

      'batterHead',

    ])

  );

};

const getDrumStockResoHead = (drum = {}) => {

  return flattenReadableValue(

    getFirstPresentValue(drum, [

      'stockSnareSystem.heads.resonantHead',

      'hardware.stockResoHead',

      'hardware.resoHead',

      'stockResoHead',

      'resoHead',

    ])

  );

};

const getDrumStockSnareWires = (drum = {}) => {

  return flattenReadableValue(

    getFirstPresentValue(drum, [

      'stockSnareSystem.snareWires.model',

      'stockSnareSystem.snareWires.make',

      'hardware.stockSnareWires',

      'hardware.snareWires',

      'stockSnareWires',

      'snareWires',

    ])

  );

};

const getDrumCurrentlyInProduction = (drum = {}) => {

  return canonicalizeBooleanish(

    getFirstPresentValue(drum, [

      'identification.currentlyInProduction',

      'production.currentlyInProduction',

      'production.currentProduction',

      'production.inProduction',

      'currentlyInProduction',

      'currentProduction',

      'inProduction',

    ])

  );

};

const getDrumDiscontinued = (drum = {}) => {

  return canonicalizeBooleanish(

    getFirstPresentValue(drum, [

      'identification.discontinued',

      'production.discontinued',

      'production.isDiscontinued',

      'discontinued',

      'isDiscontinued',

    ])

  );

};

const getDrumRareCollectible = (drum = {}) => {

  return canonicalizeBooleanish(

    getFirstPresentValue(drum, [

      'identification.rareCollectible',

      'production.rareCollectible',

      'production.rare',

      'production.collectible',

      'rareCollectible',

      'rare',

      'collectible',

    ])

  );

};

const getDrumArtistSignatureLine = (drum = {}) => {

  return canonicalizeBooleanish(

    getFirstPresentValue(drum, [

      'identification.artistSignature',

      'production.artistSignatureLine',

      'production.artistSignature',

      'production.signatureLine',

      'artistSignatureLine',

      'artistSignature',

      'signatureLine',

    ])

  );

};

const getDrumVoiceConfidence = (drum = {}) => {
  return flattenReadableValue(
    getFirstPresentValue(drum, [
      'oberScores.confidence',

      'voiceScoreConfidence',

      'scoreConfidence',

      'oberScoreConfidence',
    ])
  );
};

const getDrumSourceConfidence = (drum = {}) => {
  return flattenReadableValue(
    getFirstPresentValue(drum, [
      'sources.sourceConfidence',

      'sources.researchConfidence',

      'sourceConfidence',

      'researchConfidence',
    ])
  );
};

const getDrumPrimarySourceUrl = (drum = {}) => {
  return flattenReadableValue(
    getFirstPresentValue(drum, [
      'sources.primarySourceUrl',

      'sources.sourceUrl',

      'sources.sourceURL',

      'sources.url',

      'primarySourceUrl',

      'sourceUrl',

      'sourceURL',

      'url',
    ])
  );
};

const getDrumSecondarySourceUrl = (drum = {}) => {
  return flattenReadableValue(
    getFirstPresentValue(drum, [
      'sources.secondarySourceUrl',

      'sources.secondarySourceURL',

      'secondarySourceUrl',

      'secondarySourceURL',
    ])
  );
};

const getOberScore = (drum = {}, node = '') => {
  const directKey = `overall${node.charAt(0).toUpperCase()}${node.slice(
    1
  )}OberScore`;

  const rawValue =
    drum[directKey] ??
    drum?.oberScores?.[node] ??
    drum?.scores?.[node] ??
    drum?.legacyPrintScores?.[node] ??
    '';

  const number = Number(rawValue);

  return Number.isFinite(number) ? number : '';
};

const getOberScoreCompleteness = (drum = {}) => {
  const completedNodes = LEGACYPRINT_NODE_ORDER.filter((node) => {
    const value = getOberScore(drum, node);

    return value !== '';
  });

  return {
    completed: completedNodes.length,

    total: LEGACYPRINT_NODE_ORDER.length,

    isComplete: completedNodes.length === LEGACYPRINT_NODE_ORDER.length,

    missingNodes: LEGACYPRINT_NODE_ORDER.filter(
      (node) => !completedNodes.includes(node)
    ),
  };
};

const UNKNOWN_VALUE_TERMS = [
  '',

  'unknown',

  'n/a',

  'na',

  'none',

  'null',

  'undefined',

  'tbd',

  'needs review',

  'needs research',

  'not confirmed',

  'unconfirmed',
];

const isMissingResearchValue = (value = '') => {
  const cleanValue = flattenReadableValue(value);

  const normalized = normalizeText(cleanValue);

  if (!normalized) return true;

  return UNKNOWN_VALUE_TERMS.some((term) => {
    return normalized === normalizeText(term);
  });
};

const getNeedsReview = (drum = {}) => {
  const directValue = canonicalizeBooleanish(
    getFirstPresentValue(drum, [
      'public.needsReview',

      'needsReview',

      'reviewNeeded',
    ])
  );

  if (directValue) return directValue;

  const scoreCompleteness = getOberScoreCompleteness(drum);

  if (!scoreCompleteness.isComplete) return 'Yes';

  if (!getDrumShellMaterial1(drum)) return 'Yes';

  if (!getDrumShellConstruction(drum)) return 'Yes';

  return 'No';
};

const getSnareResearchNeeds = (drum = {}) => {
  const scoreCompleteness = getOberScoreCompleteness(drum);

  const checks = [
    {
      key: 'shellMaterial1',

      label: 'Shell Material',

      value: getDrumShellMaterial1(drum),

      reason: 'Primary shell material is missing or unknown.',
    },

    {
      key: 'shellConstruction',

      label: 'Shell Construction',

      value: getDrumShellConstruction(drum),

      reason: 'Shell construction is missing or unknown.',
    },

    {
      key: 'hoopRimType',

      label: 'Hoop / Rim Type',

      value: getDrumHoopRimType(drum),

      reason: 'Hoop/rim type is missing or unknown.',
    },

    {
      key: 'lugCount',

      label: 'Lug Count',

      value: getDrumLugCount(drum),

      reason: 'Lug count is missing or unknown.',
    },

    {
      key: 'bearingEdge',

      label: 'Bearing Edge',

      value: getDrumBearingEdge(drum),

      reason: 'Bearing edge information is missing or unknown.',
    },

    {
      key: 'snareBedType',

      label: 'Snare Bed Type',

      value: getDrumSnareBedType(drum),

      reason: 'Snare bed information is missing or unknown.',
    },

    {
      key: 'primarySourceUrl',

      label: 'Primary Source URL',

      value: getDrumPrimarySourceUrl(drum),

      reason: 'Primary source URL is missing.',
    },
  ];

  const missingFields = checks.filter((check) =>
    isMissingResearchValue(check.value)
  );

  if (!scoreCompleteness.isComplete) {
    missingFields.push({
      key: 'oberScores',

      label: 'Ober Scores',

      value: `${scoreCompleteness.completed}/7`,

      reason: `Missing score nodes: ${scoreCompleteness.missingNodes

        .map((node) => LEGACYPRINT_NODE_LABELS[node] || node)

        .join(', ')}`,
    });
  }

  const needsReviewValue = getNeedsReview(drum);

  const needsReview = normalizeText(needsReviewValue) === 'yes';

  return {
    needsResearch: missingFields.length > 0 || needsReview,

    missingFields,

    missingCount: missingFields.length,

    needsReview,

    primarySourceUrl: getDrumPrimarySourceUrl(drum),

    secondarySourceUrl: getDrumSecondarySourceUrl(drum),
  };
};

const getUniqueOptions = (drums = [], getter) => {
  const optionMap = new Map();

  drums.forEach((drum) => {
    const rawValue = getter(drum);

    const cleanValue = flattenReadableValue(rawValue);

    if (!cleanValue) return;

    const normalizedKey = normalizeText(cleanValue);

    if (!normalizedKey) return;

    if (!optionMap.has(normalizedKey)) {
      optionMap.set(normalizedKey, cleanValue);
    }
  });

  return Array.from(optionMap.values()).sort((a, b) => {
    const aNumber = Number.parseFloat(a);

    const bNumber = Number.parseFloat(b);

    if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) {
      return aNumber - bNumber;
    }

    return a.localeCompare(b);
  });
};

const filterByExactOrEmpty = ({ value, selected }) => {
  if (!selected || selected === 'All') return true;

  return normalizeText(value) === normalizeText(selected);
};

const filterByNumberOrEmpty = ({ value, selected }) => {
  if (!selected || selected === 'All') return true;

  const valueNumber = getNumberValue(value);

  const selectedNumber = getNumberValue(selected);

  if (valueNumber === '' || selectedNumber === '') {
    return normalizeText(value) === normalizeText(selected);
  }

  return valueNumber === selectedNumber;
};

const INITIAL_FILTERS = {
  keyword: '',

  companyName: 'All',

  modelName: 'All',

  companyType: 'All',

  lineSeries: 'All',

  drumType: 'All',

  diameter: 'All',

  depth: 'All',

  shellConstruction: 'All',

  shellMaterial1: 'All',

  shellMaterial2: 'All',

  shellMaterial3: 'All',

  shellThickness: 'All',

  bearingEdge: 'All',

  reinforcementRings: 'All',

  finishType: 'All',

  snareBedType: 'All',

  hoopRimType: 'All',

  lugCount: 'All',

  stockBatterHead: 'All',

  stockResoHead: 'All',

  stockSnareWires: 'All',

  currentlyInProduction: 'All',

  discontinued: 'All',

  rareCollectible: 'All',

  artistSignatureLine: 'All',

  voiceScoreConfidence: 'All',

  sourceConfidence: 'All',

  needsReview: 'All',

  scoreStatus: 'All',
};

const FILTER_FIELDS = [
  {
    key: 'companyName',

    label: 'Company / Brand',

    getter: getDrumCompanyName,

    bucket: 'Shop Lookup',
  },

  {
    key: 'modelName',

    label: 'Model Name',

    getter: getDrumModelName,

    bucket: 'Shop Lookup',
  },

  {
    key: 'lineSeries',

    label: 'Line / Series',

    getter: getDrumLineSeries,

    bucket: 'Shop Lookup',
  },

  {
    key: 'companyType',

    label: 'Company Type',

    getter: getDrumCompanyType,

    bucket: 'Shop Lookup',
  },

  {
    key: 'drumType',

    label: 'Drum Type',

    getter: getDrumType,

    bucket: 'Size',
  },

  {
    key: 'diameter',

    label: 'Diameter',

    getter: getDrumDiameter,

    isNumber: true,

    bucket: 'Size',
  },

  {
    key: 'depth',

    label: 'Depth',

    getter: getDrumDepth,

    isNumber: true,

    bucket: 'Size',
  },

  {
    key: 'shellConstruction',

    label: 'Shell Construction',

    getter: getDrumShellConstruction,

    bucket: 'Shell / Material',
  },

  {
    key: 'shellMaterial1',

    label: 'Shell Material 1',

    getter: getDrumShellMaterial1,

    bucket: 'Shell / Material',
  },

  {
    key: 'shellMaterial2',

    label: 'Shell Material 2',

    getter: getDrumShellMaterial2,

    bucket: 'Shell / Material',
  },

  {
    key: 'shellMaterial3',

    label: 'Shell Material 3',

    getter: getDrumShellMaterial3,

    bucket: 'Shell / Material',
  },

  {
    key: 'shellThickness',

    label: 'Shell Thickness',

    getter: getDrumShellThickness,

    bucket: 'Shell / Material',
  },

  {
    key: 'reinforcementRings',

    label: 'Reinforcement Rings',

    getter: getDrumReinforcementRings,

    bucket: 'Shell / Material',
  },

  {
    key: 'bearingEdge',

    label: 'Bearing Edge',

    getter: getDrumBearingEdge,

    bucket: 'Head / Setup',
  },

  {
    key: 'snareBedType',

    label: 'Snare Bed Type',

    getter: getDrumSnareBedType,

    bucket: 'Head / Setup',
  },

  {
    key: 'stockBatterHead',

    label: 'Stock Batter Head',

    getter: getDrumStockBatterHead,

    bucket: 'Head / Setup',
  },

  {
    key: 'stockResoHead',

    label: 'Stock Reso Head',

    getter: getDrumStockResoHead,

    bucket: 'Head / Setup',
  },

  {
    key: 'hoopRimType',

    label: 'Hoop / Rim Type',

    getter: getDrumHoopRimType,

    bucket: 'Hardware',
  },

  {
    key: 'lugCount',

    label: 'Lug Count',

    getter: getDrumLugCount,

    isNumber: true,

    bucket: 'Hardware',
  },

  {
    key: 'stockSnareWires',

    label: 'Stock Snare Wires',

    getter: getDrumStockSnareWires,

    bucket: 'Hardware',
  },

  {
    key: 'currentlyInProduction',

    label: 'Currently In Production',

    getter: getDrumCurrentlyInProduction,

    bucket: 'Availability / Status',
  },

  {
    key: 'discontinued',

    label: 'Discontinued',

    getter: getDrumDiscontinued,

    bucket: 'Availability / Status',
  },

  {
    key: 'rareCollectible',

    label: 'Rare / Collectible',

    getter: getDrumRareCollectible,

    bucket: 'Availability / Status',
  },

  {
    key: 'artistSignatureLine',

    label: 'Artist / Signature',

    getter: getDrumArtistSignatureLine,

    bucket: 'Availability / Status',
  },

  {
    key: 'voiceScoreConfidence',

    label: 'Voice Score Confidence',

    getter: getDrumVoiceConfidence,

    bucket: 'Data Quality',
  },

  {
    key: 'sourceConfidence',

    label: 'Source Confidence',

    getter: getDrumSourceConfidence,

    bucket: 'Data Quality',
  },

  {
    key: 'needsReview',

    label: 'Needs Review',

    getter: getNeedsReview,

    bucket: 'Data Quality',
  },
];

const FILTER_BUCKETS = [
  {
    key: 'Shop Lookup',

    title: 'Shop Lookup',

    description: 'Brand, line, model, and broad keyword lookup.',

    defaultOpen: true,
  },

  {
    key: 'Size',

    title: 'Size',

    description: 'Common shop-floor size filters.',

    defaultOpen: true,
  },

  {
    key: 'Shell / Material',

    title: 'Shell / Material',

    description: 'Main acoustic identity filters.',

    defaultOpen: true,
  },

  {
    key: 'Hardware',

    title: 'Hardware',

    description: 'Hoops, lugs, throw-off, wires, and finish.',

    defaultOpen: false,
  },

  {
    key: 'Head / Setup',

    title: 'Head / Setup',

    description: 'Stock batter, resonant head, edges, and beds.',

    defaultOpen: false,
  },

  {
    key: 'Sound / Voice',

    title: 'Sound / Voice',

    description: 'Minimum Ober score filters for the 7 voice nodes.',

    defaultOpen: false,
  },

  {
    key: 'Availability / Status',

    title: 'Availability / Status',

    description: 'Production, discontinued, rare, and signature flags.',

    defaultOpen: false,
  },

  {
    key: 'Data Quality',

    title: 'Data Quality',

    description: 'Research confidence and cleanup workflow filters.',

    defaultOpen: false,
  },
];

const getFieldsForBucket = (bucketKey) => {
  return FILTER_FIELDS.filter((field) => field.bucket === bucketKey);
};

const getFilterFieldLabel = (key = '') => {
  if (key === 'keyword') return 'Keyword';

  if (key === 'scoreStatus') return 'Ober Score Status';

  if (key.startsWith('minScore_')) {
    const node = key.replace('minScore_', '');

    return `Min ${LEGACYPRINT_NODE_LABELS[node] || node}`;
  }

  return FILTER_FIELDS.find((field) => field.key === key)?.label || key;
};

const filterDrumsWithFilters = ({
  drums = [],

  filters = {},

  ignoredFilterKey = '',

  isAdmin = true,
}) => {
  const keyword =
    ignoredFilterKey === 'keyword' ? '' : normalizeText(filters.keyword);

  return drums.filter((drum) => {
    const scoreCompleteness = getOberScoreCompleteness(drum);

    if (!isAdmin && !scoreCompleteness.isComplete) {
      return false;
    }

    if (
      ignoredFilterKey !== 'scoreStatus' &&
      filters.scoreStatus === 'Complete Scores' &&
      !scoreCompleteness.isComplete
    ) {
      return false;
    }

    if (
      ignoredFilterKey !== 'scoreStatus' &&
      filters.scoreStatus === 'Missing Scores' &&
      scoreCompleteness.isComplete
    ) {
      return false;
    }

    if (keyword) {
      const haystack = normalizeText(
        [
          getDrumCompanyName(drum),

          getDrumCompanyType(drum),

          getDrumLineSeries(drum),

          getDrumModelName(drum),

          getDrumType(drum),

          getDrumDiameter(drum),

          getDrumDepth(drum),

          getDrumShellConstruction(drum),

          getDrumShellMaterial1(drum),

          getDrumShellMaterial2(drum),

          getDrumShellMaterial3(drum),

          getDrumShellThickness(drum),

          getDrumBearingEdge(drum),

          getDrumReinforcementRings(drum),

          getDrumFinishType(drum),

          getDrumSnareBedType(drum),

          getDrumHoopRimType(drum),

          getDrumLugCount(drum),

          getDrumStockBatterHead(drum),

          getDrumStockResoHead(drum),

          getDrumStockSnareWires(drum),

          drum.modelNumber,

          drum.drumSummaryNotes,

          drum.notesOnMissingData,

          drum.scoringBasis,

          drum.primarySourceUrl,

          drum.secondarySourceUrl,
        ].join(' ')
      );

      if (!haystack.includes(keyword)) {
        return false;
      }
    }

    const fieldMatches = FILTER_FIELDS.every((field) => {
      if (field.key === ignoredFilterKey) return true;

      const value = field.getter(drum);

      const selected = filters[field.key];

      if (field.isNumber) {
        return filterByNumberOrEmpty({ value, selected });
      }

      return filterByExactOrEmpty({ value, selected });
    });

    if (!fieldMatches) return false;

    const minimumNodeFiltersPass = LEGACYPRINT_NODE_ORDER.every((node) => {
      const filterKey = `minScore_${node}`;

      if (filterKey === ignoredFilterKey) return true;

      const selectedMinimum = filters[filterKey];

      if (!selectedMinimum || selectedMinimum === 'All') return true;

      const score = getOberScore(drum, node);

      const minimum = Number(selectedMinimum);

      if (score === '' || !Number.isFinite(minimum)) return false;

      return Number(score) >= minimum;
    });

    return minimumNodeFiltersPass;
  });
};

const SnareReferenceResourceManager = ({
  referenceDrums = [],

  isLoading = false,

  selectedReferenceDrumId = '',

  onSelectReferenceDrum,

  selectedReferenceDrum = null,

  isSavingReferenceDrum = false,

  onSaveReferenceDrum,

  onResearchReferenceDrum,

  isAdmin = true,
}) => {
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const [viewMode, setViewMode] = useState('Search');

  const [resultLimit, setResultLimit] = useState(50);

  const [openBuckets, setOpenBuckets] = useState(() => {
    return FILTER_BUCKETS.reduce((acc, bucket) => {
      acc[bucket.key] = bucket.defaultOpen;

      return acc;
    }, {});
  });

  const filteredDrums = useMemo(() => {
    return filterDrumsWithFilters({
      drums: referenceDrums,

      filters,

      isAdmin,
    });
  }, [referenceDrums, filters, isAdmin]);

  const filterOptions = useMemo(() => {
    return FILTER_FIELDS.reduce((acc, field) => {
      const contextualDrums = filterDrumsWithFilters({
        drums: referenceDrums,

        filters,

        ignoredFilterKey: field.key,

        isAdmin,
      });

      const contextualOptions = getUniqueOptions(contextualDrums, field.getter);

      const currentValue = filters[field.key];

      if (
        currentValue &&
        currentValue !== 'All' &&
        !contextualOptions.some(
          (option) => normalizeText(option) === normalizeText(currentValue)
        )
      ) {
        acc[field.key] = [currentValue, ...contextualOptions];
      } else {
        acc[field.key] = contextualOptions;
      }

      return acc;
    }, {});
  }, [referenceDrums, filters, isAdmin]);

  const visibleResults = useMemo(() => {
    return filteredDrums.slice(0, resultLimit);
  }, [filteredDrums, resultLimit]);

  const activeFilters = useMemo(() => {
    return Object.entries(filters)

      .filter(([key, value]) => {
        if (key === 'keyword') return String(value || '').trim() !== '';

        return value && value !== 'All';
      })

      .map(([key, value]) => ({
        key,

        label: getFilterFieldLabel(key),

        value,
      }));
  }, [filters]);

  const stats = useMemo(() => {
    const searchableReferenceDrums = isAdmin
      ? referenceDrums
      : referenceDrums.filter(
          (drum) => getOberScoreCompleteness(drum).isComplete
        );

    const companyCount = getUniqueOptions(
      searchableReferenceDrums,

      getDrumCompanyName
    ).length;

    const missingScores = referenceDrums.filter((drum) => {
      return !getOberScoreCompleteness(drum).isComplete;
    }).length;

    const missingMaterials = referenceDrums.filter((drum) => {
      return !getDrumShellMaterial1(drum);
    }).length;

    const needsResearch = referenceDrums.filter((drum) => {
      return getSnareResearchNeeds(drum).needsResearch;
    }).length;

    return {
      total: searchableReferenceDrums.length,

      filtered: filteredDrums.length,

      companies: companyCount,

      missingScores,

      missingMaterials,

      needsResearch,

      selectedFilterCount: activeFilters.length,
    };
  }, [referenceDrums, filteredDrums, activeFilters.length, isAdmin]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({
      ...current,

      [key]: value,
    }));

    setResultLimit(50);
  };

  const removeFilter = (key) => {
    setFilters((current) => ({
      ...current,

      [key]: key === 'keyword' ? '' : 'All',
    }));

    setResultLimit(50);
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);

    setResultLimit(50);
  };

  const applyExampleBrassQuery = () => {
    setFilters((current) => ({
      ...current,

      keyword: '',

      drumType: 'Snare',

      diameter: '14',

      depth: '6.5',

      shellMaterial1: 'Brass',

      lugCount: '10',

      scoreStatus: 'All',
    }));

    setResultLimit(50);
  };

  const toggleBucket = (bucketKey) => {
    setOpenBuckets((current) => ({
      ...current,

      [bucketKey]: !current[bucketKey],
    }));
  };

  const handleResearchReferenceDrum = (drum = {}) => {
    const researchNeeds = getSnareResearchNeeds(drum);

    const researchTarget = {
      id: drum.id,

      companyName: getDrumCompanyName(drum),

      lineSeries: getDrumLineSeries(drum),

      modelName: getDrumModelName(drum),

      diameter: getDrumDiameter(drum),

      depth: getDrumDepth(drum),

      shellConstruction: getDrumShellConstruction(drum),

      shellMaterial1: getDrumShellMaterial1(drum),

      hoopRimType: getDrumHoopRimType(drum),

      lugCount: getDrumLugCount(drum),

      bearingEdge: getDrumBearingEdge(drum),

      snareBedType: getDrumSnareBedType(drum),

      primarySourceUrl: getDrumPrimarySourceUrl(drum),

      secondarySourceUrl: getDrumSecondarySourceUrl(drum),

      researchNeeds,

      rawDrum: drum,
    };

    if (onResearchReferenceDrum) {
      onResearchReferenceDrum(researchTarget);

      return;
    }

    console.log('Snare reference research requested:', researchTarget);
  };

  const renderFilterSelect = (field) => {
    const options = filterOptions[field.key] || [];

    return (
      <label key={field.key}>
        <span>{field.label}</span>

        <select
          value={filters[field.key]}
          onChange={(event) => updateFilter(field.key, event.target.value)}
        >
          <option value="All">All</option>

          {options.map((option) => (
            <option key={`${field.key}-${option}`} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  };

  const renderFilterBucket = (bucket) => {
    const isOpen = openBuckets[bucket.key];

    const bucketFields = getFieldsForBucket(bucket.key);

    return (
      <section
        key={bucket.key}
        className={`snare-resource-filter-bucket ${isOpen ? 'is-open' : ''}`}
      >
        <button
          type="button"
          className="snare-resource-filter-bucket-heading"
          onClick={() => toggleBucket(bucket.key)}
        >
          <span>
            <b>{bucket.title}</b>

            <small>{bucket.description}</small>
          </span>

          <em>{isOpen ? '−' : '+'}</em>
        </button>

        {isOpen && (
          <div className="snare-resource-filter-bucket-body">
            {bucket.key === 'Shop Lookup' && (
              <label className="snare-resource-keyword">
                <span>Keyword Search</span>

                <input
                  type="text"
                  value={filters.keyword}
                  placeholder="Search model, company, material, notes..."
                  onChange={(event) =>
                    updateFilter('keyword', event.target.value)
                  }
                />
              </label>
            )}

            {bucket.key === 'Sound / Voice' && (
              <>
                {isAdmin && (
                  <label>
                    <span>Ober Score Status</span>

                    <select
                      value={filters.scoreStatus}
                      onChange={(event) =>
                        updateFilter('scoreStatus', event.target.value)
                      }
                    >
                      {['All', 'Complete Scores', 'Missing Scores'].map(
                        (option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        )
                      )}
                    </select>
                  </label>
                )}

                {LEGACYPRINT_NODE_ORDER.map((node) => (
                  <label key={`minScore_${node}`}>
                    <span>Min {LEGACYPRINT_NODE_LABELS[node]}</span>

                    <select
                      value={filters[`minScore_${node}`] || 'All'}
                      onChange={(event) =>
                        updateFilter(`minScore_${node}`, event.target.value)
                      }
                    >
                      <option value="All">All</option>

                      {[5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9].map((value) => (
                        <option key={`${node}-${value}`} value={value}>
                          {value}+
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </>
            )}

            {bucketFields.map(renderFilterSelect)}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="snare-resource-manager">
      <div className="snare-resource-heading">
        <div>
          <p className="legacyprint-admin-overline">Engine Resources</p>

          <h3>Snare Reference Database</h3>

          <p>
            Search, filter, inspect, and edit Firestore records from the
            snareReferenceDrums master dataset. Picklist options are generated
            from the loaded dataset, normalized for shop lookup, and narrowed by
            the currently active filters.
          </p>
        </div>

        <div className="snare-resource-actions">
          <button
            type="button"
            className="legacyprint-admin-button secondary legacyprint-admin-button--dark"
            onClick={applyExampleBrassQuery}
          >
            Example: Brass 14x6.5 / 10 Lug
          </button>

          <button
            type="button"
            className="legacyprint-admin-button secondary legacyprint-admin-button--dark"
            onClick={resetFilters}
          >
            Reset Filters
          </button>
        </div>
      </div>

      <div className="snare-resource-view-tabs" role="tablist">
        {['Search', 'Editor'].map((tab) => (
          <button
            key={tab}
            type="button"
            className={viewMode === tab ? 'active' : ''}
            onClick={() => setViewMode(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="snare-resource-stat-grid">
        <div>
          <span>Total Snares</span>

          <strong>{isLoading ? 'Loading' : stats.total}</strong>

          <small>
            {isAdmin
              ? 'Loaded from snareReferenceDrums'
              : 'Public-ready scored snares'}
          </small>
        </div>

        <div>
          <span>Filtered Results</span>

          <strong>{stats.filtered}</strong>

          <small>{stats.selectedFilterCount} active filters</small>
        </div>

        <div>
          <span>Companies</span>

          <strong>{stats.companies}</strong>

          <small>Unique normalized brands</small>
        </div>

        <div>
          <span>Missing Ober Scores</span>

          <strong>{isAdmin ? stats.missingScores : 0}</strong>

          <small>
            {isAdmin ? 'Need all 7 node scores' : 'Hidden from public results'}
          </small>
        </div>

        <div>
          <span>Missing Materials</span>

          <strong>{isAdmin ? stats.missingMaterials : 0}</strong>

          <small>
            {isAdmin
              ? 'Needs shellMaterial1 cleanup'
              : 'Hidden from public results'}
          </small>
        </div>

        <div>
          <span>Needs Research</span>

          <strong>{isAdmin ? stats.needsResearch : 0}</strong>

          <small>
            {isAdmin
              ? 'Missing/unknown source specs'
              : 'Hidden from public results'}
          </small>
        </div>
      </div>

      {viewMode === 'Search' && (
        <>
          <div className="snare-resource-active-filters">
            <div className="snare-resource-active-filters-heading">
              <div>
                <p className="legacyprint-admin-overline">Active Filters</p>

                <strong>
                  {activeFilters.length
                    ? `${activeFilters.length} Applied`
                    : 'None Applied'}
                </strong>
              </div>

              {activeFilters.length > 0 && (
                <button
                  type="button"
                  className="snare-resource-clear-all-button"
                  onClick={resetFilters}
                >
                  Clear All
                </button>
              )}
            </div>

            {activeFilters.length > 0 ? (
              <div className="snare-resource-active-filter-list">
                {activeFilters.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    className="snare-resource-active-filter-chip"
                    onClick={() => removeFilter(filter.key)}
                    title="Remove filter"
                  >
                    <span>{filter.label}</span>

                    <strong>{filter.value}</strong>

                    <em>×</em>
                  </button>
                ))}
              </div>
            ) : (
              <p>
                Select filters on the left to narrow the snare database. Active
                filters will appear here so they are easy to remove.
              </p>
            )}
          </div>

          <div className="snare-resource-layout">
            <aside className="snare-resource-filter-rail">
              <div className="snare-resource-filter-rail-heading">
                <div>
                  <p className="legacyprint-admin-overline">Search Filters</p>

                  <h4>Shop Lookup</h4>
                </div>

                <button type="button" onClick={resetFilters}>
                  Reset
                </button>
              </div>

              {FILTER_BUCKETS.map(renderFilterBucket)}
            </aside>

            <main className="snare-resource-results-panel">
              <div className="snare-resource-results-header">
                <div>
                  <p className="legacyprint-admin-overline">Query Results</p>

                  <h4>
                    Showing {visibleResults.length} of {filteredDrums.length}
                  </h4>
                </div>

                {filteredDrums.length > visibleResults.length && (
                  <button
                    type="button"
                    className="legacyprint-admin-button secondary legacyprint-admin-button--dark"
                    onClick={() => setResultLimit((current) => current + 50)}
                  >
                    Load 50 More
                  </button>
                )}
              </div>

              <div className="snare-resource-result-grid">
                {visibleResults.map((drum) => {
                  const isActive = selectedReferenceDrumId === drum.id;

                  const scoreCompleteness = getOberScoreCompleteness(drum);

                  const researchNeeds = getSnareResearchNeeds(drum);

                  return (
                    <article
                      key={drum.id}
                      className={`snare-resource-result-card ${
                        isActive ? 'active' : ''
                      } ${researchNeeds.needsResearch ? 'needs-research' : ''}`}
                    >
                      <button
                        type="button"
                        className="snare-resource-result-card-main"
                        onClick={() => {
                          if (onSelectReferenceDrum) {
                            onSelectReferenceDrum(drum.id);
                          }

                          setViewMode('Editor');
                        }}
                      >
                        <div className="snare-resource-result-topline">
                          <span>
                            {getDrumCompanyName(drum) || 'Unknown Company'}
                          </span>

                          <div className="snare-resource-result-badges">
                            <em
                              className={`snare-resource-score-pill ${
                                scoreCompleteness.isComplete
                                  ? 'complete'
                                  : 'incomplete'
                              }`}
                            >
                              {scoreCompleteness.completed}/7 Scores
                            </em>

                            {researchNeeds.needsResearch && (
                              <em className="snare-resource-research-pill">
                                Needs Research
                              </em>
                            )}
                          </div>
                        </div>

                        <strong>
                          {getDrumModelName(drum) || 'Unnamed Reference Snare'}
                        </strong>

                        <small>
                          {getDrumLineSeries(drum) || 'Unknown Series'} ·{' '}
                          {getDrumDiameter(drum) || '?'}x
                          {getDrumDepth(drum) || '?'}
                        </small>

                        <div className="snare-resource-result-meta">
                          <span
                            className={
                              isMissingResearchValue(
                                getDrumShellConstruction(drum)
                              )
                                ? 'missing'
                                : ''
                            }
                          >
                            <b>Construction</b>

                            {getDrumShellConstruction(drum) || 'Unknown'}
                          </span>

                          <span
                            className={
                              isMissingResearchValue(
                                getDrumShellMaterial1(drum)
                              )
                                ? 'missing'
                                : ''
                            }
                          >
                            <b>Material</b>

                            {getDrumShellMaterial1(drum) || 'Unknown'}
                          </span>

                          <span
                            className={
                              isMissingResearchValue(getDrumHoopRimType(drum))
                                ? 'missing'
                                : ''
                            }
                          >
                            <b>Hoops</b>

                            {getDrumHoopRimType(drum) || 'Unknown'}
                          </span>

                          <span
                            className={
                              isMissingResearchValue(getDrumLugCount(drum))
                                ? 'missing'
                                : ''
                            }
                          >
                            <b>Lugs</b>

                            {getDrumLugCount(drum) || 'Unknown'}
                          </span>
                        </div>

                        {researchNeeds.needsResearch && (
                          <div className="snare-resource-research-summary">
                            <b>Research Needed</b>

                            <span>
                              {researchNeeds.missingFields.length
                                ? researchNeeds.missingFields

                                    .slice(0, 4)

                                    .map((field) => field.label)

                                    .join(', ')
                                : 'Marked needs review'}

                              {researchNeeds.missingFields.length > 4
                                ? ` +${researchNeeds.missingFields.length - 4} more`
                                : ''}
                            </span>
                          </div>
                        )}

                        <div className="snare-resource-node-strip">
                          {LEGACYPRINT_NODE_ORDER.map((node) => {
                            const value = getOberScore(drum, node);

                            return (
                              <span
                                key={node}
                                className={value === '' ? 'missing' : ''}
                              >
                                <b>{LEGACYPRINT_NODE_LABELS[node]}</b>

                                {value === '' ? '—' : value}
                              </span>
                            );
                          })}
                        </div>
                      </button>

                      {isAdmin && (
                        <div className="snare-resource-card-actions">
                          <button
                            type="button"
                            className="snare-resource-research-button"
                            onClick={() => handleResearchReferenceDrum(drum)}
                          >
                            Research This Drum
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}

                {!visibleResults.length && (
                  <div className="snare-resource-empty">
                    <strong>No matching snares found.</strong>

                    <span>
                      Remove one of the active filter chips above, or use Clear
                      All to reset the query.
                    </span>
                  </div>
                )}
              </div>
            </main>
          </div>
        </>
      )}

      {viewMode === 'Editor' && (
        <div className="snare-resource-editor-layout">
          <div className="snare-resource-editor-sidebar">
            <div className="snare-resource-editor-sidebar-heading">
              <p className="legacyprint-admin-overline">Selected Drum</p>

              <h4>
                {selectedReferenceDrum
                  ? getDrumModelName(selectedReferenceDrum)
                  : 'No Drum Selected'}
              </h4>

              {selectedReferenceDrum && (
                <span>
                  {getDrumCompanyName(selectedReferenceDrum)} /{' '}
                  {getDrumLineSeries(selectedReferenceDrum)}
                </span>
              )}
            </div>

            {selectedReferenceDrum && (
              <div className="snare-resource-selected-summary">
                <span>
                  <b>Size</b>
                  {getDrumDiameter(selectedReferenceDrum) || '?'}x
                  {getDrumDepth(selectedReferenceDrum) || '?'}
                </span>

                <span>
                  <b>Construction</b>

                  {getDrumShellConstruction(selectedReferenceDrum) || 'Unknown'}
                </span>

                <span>
                  <b>Material</b>

                  {getDrumShellMaterial1(selectedReferenceDrum) || 'Unknown'}
                </span>

                <span>
                  <b>Score Completeness</b>
                  {getOberScoreCompleteness(selectedReferenceDrum).completed}/7
                </span>
              </div>
            )}

            <button
              type="button"
              className="legacyprint-admin-button secondary legacyprint-admin-button--dark"
              onClick={() => setViewMode('Search')}
            >
              Back To Search
            </button>
          </div>

          <div className="snare-resource-editor-main">
            {selectedReferenceDrum ? (
              <SnareReferenceEditor
                drum={selectedReferenceDrum}
                isSaving={isSavingReferenceDrum}
                onSave={onSaveReferenceDrum}
                onResearch={() =>
                  handleResearchReferenceDrum(selectedReferenceDrum)
                }
                researchNeeds={getSnareResearchNeeds(selectedReferenceDrum)}
              />
            ) : (
              <div className="snare-resource-empty">
                <strong>Select a snare first.</strong>

                <span>
                  Go back to Search and choose a result to inspect or edit it.
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SnareReferenceResourceManager;
