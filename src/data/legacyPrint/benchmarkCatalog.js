// src/data/legacyPrint/benchmarkCatalog.js

import { BENCHMARK_DEFINITIONS } from './benchmarkDefinitions.js';

const TYPE_IMAGE_PATHS = {

  'ober-custom': {

    'heritage-oak-reference':

      '/legacyprint-benchmarks/ober-custom/ober-heritage-oak.png',

    'feuzon-hybrid-reference':

      '/legacyprint-benchmarks/ober-custom/ober-feuzon-maple.png',

  },

  ply: {

    'maple-ply-reference': '/legacyprint-benchmarks/ply/ply-maple.png',

    'birch-ply-reference': '/legacyprint-benchmarks/ply/ply-birch.png',

    'oak-ply-reference': '/legacyprint-benchmarks/ply/ply-oak.png',

    'walnut-ply-reference': '/legacyprint-benchmarks/ply/ply-walnut.png',

    'mahogany-ply-reference': '/legacyprint-benchmarks/ply/ply-mahogany.png',

  },

  metal: {

    'brass-reference': '/legacyprint-benchmarks/metal/metal-brass.png',

    'steel-reference': '/legacyprint-benchmarks/metal/metal-steel.png',

    'copper-reference': '/legacyprint-benchmarks/metal/metal-copper.png',

  },

  acrylic: {

    'thin-acrylic-reference':

      '/legacyprint-benchmarks/acrylic/acrylic-clear.png',

    'medium-acrylic-reference':

      '/legacyprint-benchmarks/acrylic/acrylic-clear.png',

    'thick-acrylic-reference':

      '/legacyprint-benchmarks/acrylic/acrylic-clear.png',

  },

  'solid-steambent': {

    'steam-bent-maple-reference':

      '/legacyprint-benchmarks/solid-steambent/solid-steam-cherry.png',

    'steam-bent-mahogany-reference':

      '/legacyprint-benchmarks/solid-steambent/solid-steam-mahogany.png',

    'solid-maple-reference':

      '/legacyprint-benchmarks/solid-steambent/solid-steam-oak.png',

  },

};

const FEUZON_STANDARD_SIZE_OPTION = {

  sizeId: '14x6_0',

  label: '14" x 6.0"',

  imagePath: '/legacyprint-benchmarks/ober-custom/ober-feuzon-maple.png',

  profile: {

    attack: 7.4,

    sustain: 7.0,

    warmth: 6.9,

    projection: 7.5,

    brightness: 6.5,

    sensitivity: 6.8,

    control: 6.8,

  },

};

const FEUZON_SIZE_PROFILE_OVERRIDES = {

  '12x5_0': {

    attack: 7.7,

    sustain: 6.5,

    warmth: 6.3,

    projection: 6.7,

    brightness: 7.1,

    sensitivity: 7.2,

    control: 7.2,

  },

  '13x6_0': {

    attack: 7.5,

    sustain: 6.8,

    warmth: 6.6,

    projection: 7.0,

    brightness: 6.9,

    sensitivity: 7.0,

    control: 7.0,

  },

  '14x6_0': {

    attack: 7.4,

    sustain: 7.0,

    warmth: 6.9,

    projection: 7.5,

    brightness: 6.5,

    sensitivity: 6.8,

    control: 6.8,

  },

  '14x6_5': {

    attack: 7.3,

    sustain: 7.2,

    warmth: 7.1,

    projection: 7.7,

    brightness: 6.4,

    sensitivity: 6.8,

    control: 6.7,

  },

  '14x7_0': {

    attack: 7.1,

    sustain: 7.4,

    warmth: 7.3,

    projection: 7.8,

    brightness: 6.2,

    sensitivity: 6.6,

    control: 6.5,

  },

  '14x8_0': {

    attack: 6.9,

    sustain: 7.7,

    warmth: 7.6,

    projection: 8.0,

    brightness: 6.0,

    sensitivity: 6.4,

    control: 6.3,

  },

};

const normalizeFeuzonSizeOptions = (type, familyId) => {

  const existingSizes = Array.isArray(type.sizes) ? type.sizes : [];

  const hasStandardSize = existingSizes.some(

    (size) => size.sizeId === FEUZON_STANDARD_SIZE_OPTION.sizeId

  );

  const normalizedSizes = hasStandardSize

    ? existingSizes

    : [FEUZON_STANDARD_SIZE_OPTION, ...existingSizes];

  const dedupedSizes = normalizedSizes.reduce((acc, size) => {

    if (!size?.sizeId) return acc;

    if (acc.some((item) => item.sizeId === size.sizeId)) return acc;

    acc.push(size);

    return acc;

  }, []);

  return dedupedSizes.map((size) => ({

    sizeId: size.sizeId,

    label: size.label,

    imagePath:

      size.imagePath ||

      TYPE_IMAGE_PATHS[familyId]?.[type.typeId] ||

      FEUZON_STANDARD_SIZE_OPTION.imagePath,

    profile:

      size.profile ||

      size.voiceProfile ||

      size.scores ||

      FEUZON_SIZE_PROFILE_OVERRIDES[size.sizeId] ||

      null,

  }));

};

export const LEGACYPRINT_BENCHMARK_CATALOG = Object.values(

  BENCHMARK_DEFINITIONS

).map((family) => ({

  familyId: family.familyId,

  familyLabel: family.familyLabel,

  familyDescription: family.familyDescription,

  defaultTypeId: family.defaultTypeId,

  benchmarkTypes: Object.values(family.types).map((type) => {

    const isFeuzonReference = type.typeId === 'feuzon-hybrid-reference';

    const presetSizeOptions = isFeuzonReference

      ? normalizeFeuzonSizeOptions(type, family.familyId)

      : type.sizes.map((size) => ({

          sizeId: size.sizeId,

          label: size.label,

          imagePath:

            size.imagePath ||

            TYPE_IMAGE_PATHS[family.familyId]?.[type.typeId] ||

            '/legacyprint-benchmarks/ply/ply-maple.png',

          profile: size.profile || size.voiceProfile || size.scores || null,

        }));

    return {

      typeId: type.typeId,

      typeLabel: type.typeLabel,

      shortLabel: type.shortLabel,

      shortDescription: type.benchmarkNotes,

      defaultSizeId: isFeuzonReference

        ? FEUZON_STANDARD_SIZE_OPTION.sizeId

        : type.defaultSizeId,

      imageBasePath: `/legacyprint-benchmarks/${family.familyId}/${type.typeId}`,

      imagePath:

        TYPE_IMAGE_PATHS[family.familyId]?.[type.typeId] ||

        '/legacyprint-benchmarks/ply/ply-maple.png',

      presetSizes: presetSizeOptions.map((size) => size.sizeId),

      presetSizeOptions,

    };

  }),

}));

export default LEGACYPRINT_BENCHMARK_CATALOG;