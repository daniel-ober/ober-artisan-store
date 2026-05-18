import { CONFIDENCE_LEVELS } from '../enums/confidenceEnums.js';

import { SHELL_CONSTRUCTION } from '../enums/shellConstructionEnums.js';

import { SHELL_MATERIALS } from '../enums/shellMaterialEnums.js';

import { BEARING_EDGES } from '../enums/bearingEdgeEnums.js';

import { SNARE_BED_DEPTH } from '../enums/snareBedEnums.js';

import { HOOP_TYPES } from '../enums/hoopEnums.js';

import { validateEnum } from './validateEnum.js';

import { validateRequiredFields } from './validateRequiredFields.js';

export const DRUM_REFERENCE_REQUIRED_FIELDS = [

  'id',

  'schemaVersion',

  'companyId',

  'companyName',

  'modelName',

  'drumType',

  'dimensions.diameterInches',

  'dimensions.depthInches',

  'shell.construction',

  'shell.materialPrimary',

  'shell.bearingEdge',

  'shell.snareBeds.hasSnareBeds',

  'shell.snareBeds.depth',

  'referenceLayer.baseConfigSource',

  'referenceLayer.sourceConfidence',

  'referenceLayer.voiceScoreConfidence'

];

export function validateDrumReference(drumReference = {}) {

  const missingRequiredFields = validateRequiredFields(

    drumReference,

    DRUM_REFERENCE_REQUIRED_FIELDS

  );

  const enumChecks = [

    validateEnum({

      fieldPath: 'shell.construction',

      value: drumReference?.shell?.construction,

      allowedValues: SHELL_CONSTRUCTION

    }),

    validateEnum({

      fieldPath: 'shell.materialPrimary',

      value: drumReference?.shell?.materialPrimary,

      allowedValues: SHELL_MATERIALS

    }),

    validateEnum({

      fieldPath: 'shell.materialSecondary',

      value: drumReference?.shell?.materialSecondary,

      allowedValues: SHELL_MATERIALS

    }),

    validateEnum({

      fieldPath: 'shell.materialTertiary',

      value: drumReference?.shell?.materialTertiary,

      allowedValues: SHELL_MATERIALS

    }),

    validateEnum({

      fieldPath: 'shell.bearingEdge',

      value: drumReference?.shell?.bearingEdge,

      allowedValues: BEARING_EDGES

    }),

    validateEnum({

      fieldPath: 'shell.snareBeds.depth',

      value: drumReference?.shell?.snareBeds?.depth,

      allowedValues: SNARE_BED_DEPTH

    }),

    validateEnum({

      fieldPath: 'stockHardware.hoopType',

      value: drumReference?.stockHardware?.hoopType,

      allowedValues: HOOP_TYPES

    }),

    validateEnum({

      fieldPath: 'referenceLayer.sourceConfidence',

      value: drumReference?.referenceLayer?.sourceConfidence,

      allowedValues: CONFIDENCE_LEVELS

    }),

    validateEnum({

      fieldPath: 'referenceLayer.voiceScoreConfidence',

      value: drumReference?.referenceLayer?.voiceScoreConfidence,

      allowedValues: CONFIDENCE_LEVELS

    })

  ].filter(Boolean);

  const invalidEnums = enumChecks.map((check) => check.message);

  const warnings = [];

  if (Array.isArray(drumReference?.sourceIds) && drumReference.sourceIds.length === 0) {

    warnings.push('NO_SOURCES: Drum reference has no sourceIds.');

  }

  if (

    drumReference?.referenceLayer?.sourceConfidence === 'high' &&

    Array.isArray(drumReference?.sourceIds) &&

    drumReference.sourceIds.length === 0

  ) {

    warnings.push('CONFIDENCE_WARNING: sourceConfidence is high but no sourceIds are attached.');

  }

  const engineReady =

    missingRequiredFields.length === 0 &&

    invalidEnums.length === 0;

  return {

    engineReady,

    needsResearch: !engineReady,

    missingRequiredFields,

    invalidEnums,

    conflicts: [],

    warnings,

    confidenceDowngrades: []

  };

}