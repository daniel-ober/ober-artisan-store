export function createRebuildQueueEntry({

  targetDrumReferenceId,

  rebuildReason,

  engineVersion = '0.1.0',

  calibrationProfileId = 'snare_default_v1',

  requestedBy = 'system'

}) {

  return {

    id: `rebuild_${Date.now()}`,

    targetDrumReferenceId,

    rebuildReason,

    status: 'queued',

    engineVersion,

    calibrationProfileId,

    requestedBy,

    queuedAt: new Date().toISOString(),

    startedAt: null,

    completedAt: null,

    failedAt: null,

    errorMessage: null

  };

}