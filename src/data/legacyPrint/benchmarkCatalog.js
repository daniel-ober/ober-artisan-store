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

    'thin-acrylic-reference': '/legacyprint-benchmarks/acrylic/acrylic-clear.png',

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

export const LEGACYPRINT_BENCHMARK_CATALOG = Object.values(

  BENCHMARK_DEFINITIONS

).map((family) => ({

  familyId: family.familyId,

  familyLabel: family.familyLabel,

  familyDescription: family.familyDescription,

  defaultTypeId: family.defaultTypeId,

  benchmarkTypes: Object.values(family.types).map((type) => ({

    typeId: type.typeId,

    typeLabel: type.typeLabel,

    shortLabel: type.shortLabel,

    shortDescription: type.benchmarkNotes,

    defaultSizeId: type.defaultSizeId,

    imageBasePath: `/legacyprint-benchmarks/${family.familyId}/${type.typeId}`,

    imagePath:

      TYPE_IMAGE_PATHS[family.familyId]?.[type.typeId] ||

      '/legacyprint-benchmarks/ply/ply-maple.png',

    presetSizes: type.sizes.map((size) => size.sizeId),

    presetSizeOptions: type.sizes.map((size) => ({

      sizeId: size.sizeId,

      label: size.label,

      imagePath: size.imagePath,

    })),

  })),

}));

export default LEGACYPRINT_BENCHMARK_CATALOG;