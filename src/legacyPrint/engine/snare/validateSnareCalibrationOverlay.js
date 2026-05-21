
const { SNARE_NODE_KEYS } = require('./snareEngineConstants');

const ALLOWED_TOP_LEVEL_KEYS = new Set([

  'enabled',

  'version',

  'confidence',

  'firestoreWritesAllowed',

  'globalNodeDeltas',

  'materialFamilyDeltas',

  'constructionFamilyDeltas',

  'hoopFamilyDeltas',

  'bearingEdgeFamilyDeltas',

  'knownDrumDeltas',

  'readoutMapWeights'

]);

const DELTA_BUCKET_KEYS = [

  'globalNodeDeltas',

  'materialFamilyDeltas',

  'constructionFamilyDeltas',

  'hoopFamilyDeltas',

  'bearingEdgeFamilyDeltas'

];

const READOUT_TYPES = [

  'firstListen',

  'playerAnalysis',

  'legacyPrintIdentity'

];

const READOUT_WEIGHT_KEYS = {

  firstListen: ['scoreStrength', 'physicalDriverStrength', 'rankWeight'],

  playerAnalysis: ['scoreStrength', 'physicalDriverStrength', 'feelPriority'],

  legacyPrintIdentity: ['scoreStrength', 'physicalDriverStrength', 'identityPriority']

};

const toNumber = value => {

  const n = Number(value);

  return Number.isFinite(n) ? n : null;

};

const isObject = value =>

  value !== null &&

  typeof value === 'object' &&

  !Array.isArray(value);

const hasText = value =>

  typeof value === 'string' &&

  value.trim().length > 0;

const pushIssue = (issues, severity, code, message, path, extra = {}) => {

  issues.push({

    severity,

    code,

    message,

    path,

    ...extra

  });

};

const validateNodeDeltaMap = ({ issues, map, path, maxAbsDelta = 0.75 }) => {

  if (!isObject(map)) {

    pushIssue(

      issues,

      'error',

      'INVALID_DELTA_MAP',

      'Expected a node delta object.',

      path

    );

    return;

  }

  for (const [node, value] of Object.entries(map)) {

    if (!SNARE_NODE_KEYS.includes(node)) {

      pushIssue(

        issues,

        'error',

        'UNKNOWN_NODE',

        `Unknown node "${node}".`,

        `${path}.${node}`

      );

      continue;

    }

    const n = toNumber(value);

    if (n === null) {

      pushIssue(

        issues,

        'error',

        'NON_NUMERIC_DELTA',

        `Delta for "${node}" must be numeric.`,

        `${path}.${node}`

      );

      continue;

    }

    if (Math.abs(n) > maxAbsDelta) {

      pushIssue(

        issues,

        'error',

        'DELTA_TOO_LARGE',

        `Delta for "${node}" is too large for a calibration overlay.`,

        `${path}.${node}`,

        {

          value: n,

          maxAbsDelta

        }

      );

    } else if (Math.abs(n) > 0.35) {

      pushIssue(

        issues,

        'warning',

        'LARGE_DELTA_REQUIRES_REVIEW',

        `Delta for "${node}" is large and should have strong source justification.`,

        `${path}.${node}`,

        {

          value: n

        }

      );

    }

  }

};

const validateFamilyDeltaBucket = ({ issues, bucket, bucketName }) => {

  if (bucket === undefined) return;

  if (!isObject(bucket)) {

    pushIssue(

      issues,

      'error',

      'INVALID_FAMILY_BUCKET',

      `${bucketName} must be an object keyed by family.`,

      bucketName

    );

    return;

  }

  for (const [family, config] of Object.entries(bucket)) {

    const path = `${bucketName}.${family}`;

    if (!isObject(config)) {

      validateNodeDeltaMap({

        issues,

        map: config,

        path

      });

      continue;

    }

    const deltas = config.deltas || config;

    validateNodeDeltaMap({

      issues,

      map: deltas,

      path: `${path}.deltas`

    });

    if (!hasText(config.reason)) {

      pushIssue(

        issues,

        'warning',

        'MISSING_REASON',

        'Family calibration should include a reason.',

        `${path}.reason`

      );

    }

    if (!hasText(config.confidence)) {

      pushIssue(

        issues,

        'warning',

        'MISSING_CONFIDENCE',

        'Family calibration should include confidence.',

        `${path}.confidence`

      );

    }

  }

};

const validateKnownDrumDeltas = ({ issues, knownDrumDeltas }) => {

  if (knownDrumDeltas === undefined) return;

  if (!Array.isArray(knownDrumDeltas)) {

    pushIssue(

      issues,

      'error',

      'INVALID_KNOWN_DRUM_DELTAS',

      'knownDrumDeltas must be an array.',

      'knownDrumDeltas'

    );

    return;

  }

  knownDrumDeltas.forEach((overlay, index) => {

    const path = `knownDrumDeltas.${index}`;

    if (!isObject(overlay)) {

      pushIssue(

        issues,

        'error',

        'INVALID_KNOWN_DRUM_OVERLAY',

        'Known drum overlay must be an object.',

        path

      );

      return;

    }

    if (overlay.enabled === false) {

      pushIssue(

        issues,

        'info',

        'DISABLED_KNOWN_DRUM_OVERLAY',

        'Known drum overlay is disabled.',

        `${path}.enabled`

      );

    }

    if (!hasText(overlay.company) && !hasText(overlay.model) && !hasText(overlay.modelRegex)) {

      pushIssue(

        issues,

        'error',

        'KNOWN_DRUM_OVERLAY_HAS_NO_MATCH_CRITERIA',

        'Known drum overlay needs company, model, or modelRegex match criteria.',

        path

      );

    }

    if (hasText(overlay.modelRegex)) {

      try {

        new RegExp(overlay.modelRegex, 'i');

      } catch (error) {

        pushIssue(

          issues,

          'error',

          'INVALID_MODEL_REGEX',

          `Invalid modelRegex: ${error.message}`,

          `${path}.modelRegex`

        );

      }

    }

    validateNodeDeltaMap({

      issues,

      map: overlay.deltas || {},

      path: `${path}.deltas`,

      maxAbsDelta: 0.85

    });

    if (!hasText(overlay.reason)) {

      pushIssue(

        issues,

        'warning',

        'MISSING_REASON',

        'Known drum overlay should include a reason.',

        `${path}.reason`

      );

    }

    if (!hasText(overlay.confidence)) {

      pushIssue(

        issues,

        'warning',

        'MISSING_CONFIDENCE',

        'Known drum overlay should include confidence.',

        `${path}.confidence`

      );

    }

  });

};

const validateReadoutMapWeights = ({ issues, readoutMapWeights }) => {

  if (readoutMapWeights === undefined) return;

  if (!isObject(readoutMapWeights)) {

    pushIssue(

      issues,

      'error',

      'INVALID_READOUT_MAP_WEIGHTS',

      'readoutMapWeights must be an object.',

      'readoutMapWeights'

    );

    return;

  }

  for (const [readoutType, weights] of Object.entries(readoutMapWeights)) {

    const path = `readoutMapWeights.${readoutType}`;

    if (!READOUT_TYPES.includes(readoutType)) {

      pushIssue(

        issues,

        'error',

        'UNKNOWN_READOUT_TYPE',

        `Unknown readout map type "${readoutType}".`,

        path

      );

      continue;

    }

    if (!isObject(weights)) {

      pushIssue(

        issues,

        'error',

        'INVALID_READOUT_WEIGHT_OBJECT',

        'Readout weights must be an object.',

        path

      );

      continue;

    }

    const allowedKeys = READOUT_WEIGHT_KEYS[readoutType];

    for (const key of Object.keys(weights)) {

      if (!allowedKeys.includes(key)) {

        pushIssue(

          issues,

          'error',

          'UNKNOWN_READOUT_WEIGHT_KEY',

          `Unknown weight key "${key}" for ${readoutType}.`,

          `${path}.${key}`

        );

      }

    }

    const total = allowedKeys.reduce((sum, key) => {

      const value = toNumber(weights[key]);

      return sum + (value === null ? 0 : value);

    }, 0);

    for (const key of allowedKeys) {

      const value = toNumber(weights[key]);

      if (value === null) {

        pushIssue(

          issues,

          'error',

          'NON_NUMERIC_READOUT_WEIGHT',

          `Readout weight "${key}" must be numeric.`,

          `${path}.${key}`

        );

      } else if (value < 0 || value > 1) {

        pushIssue(

          issues,

          'error',

          'READOUT_WEIGHT_OUT_OF_RANGE',

          `Readout weight "${key}" must be between 0 and 1.`,

          `${path}.${key}`,

          { value }

        );

      }

    }

    if (Math.abs(total - 1) > 0.001) {

      pushIssue(

        issues,

        'warning',

        'READOUT_WEIGHTS_DO_NOT_SUM_TO_ONE',

        `${readoutType} weights should sum to 1.`,

        path,

        { total: Number(total.toFixed(4)) }

      );

    }

  }

};

const validateSnareCalibrationOverlay = overlay => {

  const issues = [];

  if (!isObject(overlay)) {

    return {

      valid: false,

      errorCount: 1,

      warningCount: 0,

      infoCount: 0,

      issues: [

        {

          severity: 'error',

          code: 'INVALID_OVERLAY',

          message: 'Calibration overlay must be an object.',

          path: 'overlay'

        }

      ]

    };

  }

  for (const key of Object.keys(overlay)) {

    if (!ALLOWED_TOP_LEVEL_KEYS.has(key)) {

      pushIssue(

        issues,

        'warning',

        'UNKNOWN_TOP_LEVEL_KEY',

        `Unknown top-level overlay key "${key}".`,

        key

      );

    }

  }

  if (overlay.enabled === false) {

    pushIssue(

      issues,

      'info',

      'OVERLAY_DISABLED',

      'Overlay is disabled.',

      'enabled'

    );

  }

  if (!hasText(overlay.version)) {

    pushIssue(

      issues,

      'warning',

      'MISSING_VERSION',

      'Overlay should include a version.',

      'version'

    );

  }

  if (overlay.firestoreWritesAllowed === true) {

    pushIssue(

      issues,

      'error',

      'FIRESTORE_WRITES_NOT_ALLOWED_IN_ENGINE_OVERLAY',

      'Engine calibration overlays must not enable Firestore writes from local preview code.',

      'firestoreWritesAllowed'

    );

  }

  if (overlay.globalNodeDeltas !== undefined) {

    validateNodeDeltaMap({

      issues,

      map: overlay.globalNodeDeltas,

      path: 'globalNodeDeltas'

    });

  }

  for (const bucketName of DELTA_BUCKET_KEYS.filter(key => key !== 'globalNodeDeltas')) {

    validateFamilyDeltaBucket({

      issues,

      bucket: overlay[bucketName],

      bucketName

    });

  }

  validateKnownDrumDeltas({

    issues,

    knownDrumDeltas: overlay.knownDrumDeltas

  });

  validateReadoutMapWeights({

    issues,

    readoutMapWeights: overlay.readoutMapWeights

  });

  const errorCount = issues.filter(issue => issue.severity === 'error').length;

  const warningCount = issues.filter(issue => issue.severity === 'warning').length;

  const infoCount = issues.filter(issue => issue.severity === 'info').length;

  return {

    valid: errorCount === 0,

    errorCount,

    warningCount,

    infoCount,

    issues

  };

};

module.exports = {

  validateSnareCalibrationOverlay

};

