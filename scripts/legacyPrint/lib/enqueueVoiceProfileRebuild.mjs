export function buildVoiceProfileRebuildQueueWrite({

  recordId,

  reason = "snare-reference-migrated",

  priority = 5,

  nowIso,

}) {

  return {

    recordId,

    reason,

    priority,

    status: "queued",

    attempts: 0,

    createdAt: nowIso,

    updatedAt: nowIso,

  };

}