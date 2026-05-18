export function resolveVoiceConfidence(record = {}, computedLayers = {}) {

  const downgrades = [];

  const sourceConfidence = record.sourceConfidence || 'low';

  const voiceScoreConfidence = record.voiceScoreConfidence || 'low';

  if (!record.shellConstruction) downgrades.push('missing-shell-construction');

  if (!record.shellMaterial1) downgrades.push('missing-primary-shell-material');

  if (!record.shellThicknessMm) downgrades.push('missing-shell-thickness');

  if (!record.bearingEdge) downgrades.push('missing-bearing-edge');

  if (!record.snareBedType) downgrades.push('missing-snare-bed-type');

  const hasComputedBareShell = Boolean(computedLayers?.bareShell?.scores);

  if (!hasComputedBareShell) {

    downgrades.push('missing-computed-bare-shell-profile');

  }

  let resolved = 'high';

  if (sourceConfidence === 'low' || voiceScoreConfidence === 'low') {

    resolved = 'low';

  } else if (

    sourceConfidence === 'medium' ||

    voiceScoreConfidence === 'medium' ||

    downgrades.length > 0

  ) {

    resolved = 'medium';

  }

  if (downgrades.length >= 3) {

    resolved = 'low';

  }

  return {

    resolved,

    sourceConfidence,

    voiceScoreConfidence,

    downgrades,

  };

}