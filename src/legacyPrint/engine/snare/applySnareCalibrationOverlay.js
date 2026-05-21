
const { SNARE_NODE_KEYS } = require('./snareEngineConstants');

const clone = value => JSON.parse(JSON.stringify(value || {}));

const toNumber = value => {

  const n = Number(value);

  return Number.isFinite(n) ? n : null;

};

const clampScore = value => Math.max(1, Math.min(10, Number(value.toFixed(2))));

const normalizeNodeDeltaMap = deltas => {

  const out = {};

  for (const node of SNARE_NODE_KEYS) {

    const delta = toNumber(deltas?.[node]);

    if (delta !== null && delta !== 0) out[node] = delta;

  }

  return out;

};

const getMatchingKnownDrumOverlay = (scoredRecord, knownDrumOverlays = []) => {

  return knownDrumOverlays.find(overlay => {

    if (!overlay || overlay.enabled === false) return false;

    const companyOk = overlay.company

      ? String(scoredRecord.company || '').toLowerCase() === String(overlay.company).toLowerCase()

      : true;

    const modelOk = overlay.modelRegex

      ? new RegExp(overlay.modelRegex, 'i').test(scoredRecord.model || '')

      : overlay.model

        ? String(scoredRecord.model || '').toLowerCase() === String(overlay.model).toLowerCase()

        : true;

    const sizeOk = overlay.size

      ? String(scoredRecord.size || '').toLowerCase() === String(overlay.size).toLowerCase()

      : true;

    return companyOk && modelOk && sizeOk;

  });

};

const addCalibrationDriver = ({ drivers, node, source, delta, reason, confidence }) => {

  if (!drivers.byNode) drivers.byNode = {};

  if (!drivers.byNode[node]) drivers.byNode[node] = [];

  drivers.byNode[node].push({

    node,

    source,

    delta: Number(delta.toFixed(4)),

    direction: delta > 0 ? 'up' : 'down',

    reason,

    confidence,

    calibrationOverlay: true

  });

  if (!drivers.strongestSources) drivers.strongestSources = [];

  const existing = drivers.strongestSources.find(item => item.source === source);

  if (existing) {

    existing.totalMovement = Number((existing.totalMovement + Math.abs(delta)).toFixed(3));

  } else {

    drivers.strongestSources.push({

      source,

      totalMovement: Number(Math.abs(delta).toFixed(3)),

      calibrationOverlay: true

    });

  }

  drivers.strongestSources.sort((a, b) => b.totalMovement - a.totalMovement);

};

const applyNodeDeltas = ({ scoredRecord, deltas, source, reason, confidence }) => {

  const normalized = normalizeNodeDeltaMap(deltas);

  for (const [node, delta] of Object.entries(normalized)) {

    scoredRecord.voiceProfile[node] = clampScore((scoredRecord.voiceProfile[node] || 5) + delta);

    addCalibrationDriver({

      drivers: scoredRecord.drivers,

      node,

      source,

      delta,

      reason,

      confidence

    });

  }

};

const rerankTopNodes = scoredRecord => {

  scoredRecord.topNodes = Object.entries(scoredRecord.voiceProfile)

    .sort((a, b) => b[1] - a[1])

    .slice(0, 3)

    .map(([key, value]) => ({ key, value }));

};

const applySnareCalibrationOverlay = (scoredRecord, overlay = {}) => {

  const out = clone(scoredRecord);

  if (!overlay || overlay.enabled === false) {

    out.calibrationOverlay = {

      applied: false,

      reason: 'No enabled calibration overlay supplied.'

    };

    return out;

  }

  const applied = [];

  const globalDeltas = normalizeNodeDeltaMap(overlay.globalNodeDeltas);

  if (Object.keys(globalDeltas).length) {

    applyNodeDeltas({

      scoredRecord: out,

      deltas: globalDeltas,

      source: 'calibration:globalNodeDeltas',

      reason: overlay.globalReason || 'Global snare engine calibration overlay.',

      confidence: overlay.confidence || 'adminCalibrated'

    });

    applied.push({

      type: 'globalNodeDeltas',

      deltas: globalDeltas

    });

  }

  const materialOverlay = overlay.materialFamilyDeltas?.[out.families.shellMaterial];

  if (materialOverlay) {

    applyNodeDeltas({

      scoredRecord: out,

      deltas: materialOverlay.deltas || materialOverlay,

      source: `calibration:material:${out.families.shellMaterial}`,

      reason: materialOverlay.reason || `Material family calibration for ${out.families.shellMaterial}.`,

      confidence: materialOverlay.confidence || overlay.confidence || 'adminCalibrated'

    });

    applied.push({

      type: 'materialFamilyDeltas',

      family: out.families.shellMaterial,

      deltas: normalizeNodeDeltaMap(materialOverlay.deltas || materialOverlay)

    });

  }

  const constructionOverlay = overlay.constructionFamilyDeltas?.[out.families.shellConstruction];

  if (constructionOverlay) {

    applyNodeDeltas({

      scoredRecord: out,

      deltas: constructionOverlay.deltas || constructionOverlay,

      source: `calibration:construction:${out.families.shellConstruction}`,

      reason: constructionOverlay.reason || `Construction family calibration for ${out.families.shellConstruction}.`,

      confidence: constructionOverlay.confidence || overlay.confidence || 'adminCalibrated'

    });

    applied.push({

      type: 'constructionFamilyDeltas',

      family: out.families.shellConstruction,

      deltas: normalizeNodeDeltaMap(constructionOverlay.deltas || constructionOverlay)

    });

  }

  const hoopOverlay = overlay.hoopFamilyDeltas?.[out.families.hoopType];

  if (hoopOverlay) {

    applyNodeDeltas({

      scoredRecord: out,

      deltas: hoopOverlay.deltas || hoopOverlay,

      source: `calibration:hoop:${out.families.hoopType}`,

      reason: hoopOverlay.reason || `Hoop family calibration for ${out.families.hoopType}.`,

      confidence: hoopOverlay.confidence || overlay.confidence || 'adminCalibrated'

    });

    applied.push({

      type: 'hoopFamilyDeltas',

      family: out.families.hoopType,

      deltas: normalizeNodeDeltaMap(hoopOverlay.deltas || hoopOverlay)

    });

  }

  const edgeOverlay = overlay.bearingEdgeFamilyDeltas?.[out.families.bearingEdge];

  if (edgeOverlay) {

    applyNodeDeltas({

      scoredRecord: out,

      deltas: edgeOverlay.deltas || edgeOverlay,

      source: `calibration:bearingEdge:${out.families.bearingEdge}`,

      reason: edgeOverlay.reason || `Bearing edge family calibration for ${out.families.bearingEdge}.`,

      confidence: edgeOverlay.confidence || overlay.confidence || 'adminCalibrated'

    });

    applied.push({

      type: 'bearingEdgeFamilyDeltas',

      family: out.families.bearingEdge,

      deltas: normalizeNodeDeltaMap(edgeOverlay.deltas || edgeOverlay)

    });

  }

  const knownDrumOverlay = getMatchingKnownDrumOverlay(out, overlay.knownDrumDeltas);

  if (knownDrumOverlay) {

    applyNodeDeltas({

      scoredRecord: out,

      deltas: knownDrumOverlay.deltas || {},

      source: `calibration:knownDrum:${knownDrumOverlay.id || out.id || out.model}`,

      reason: knownDrumOverlay.reason || `Known drum calibration for ${out.company} ${out.model}.`,

      confidence: knownDrumOverlay.confidence || overlay.confidence || 'adminCalibrated'

    });

    applied.push({

      type: 'knownDrumDeltas',

      id: knownDrumOverlay.id || '',

      deltas: normalizeNodeDeltaMap(knownDrumOverlay.deltas || {})

    });

  }

  rerankTopNodes(out);

  out.calibrationOverlay = {

    applied: applied.length > 0,

    overlayVersion: overlay.version || 'unversioned-overlay',

    applied

  };

  return out;

};

module.exports = {

  applySnareCalibrationOverlay

};

