export function buildPatchAuditWrite({

  recordId,

  patch,

  reason = "initial legacy snare migration",

  actor = "migration-runner",

  nowIso,

}) {

  return {

    recordId,

    patch,

    reason,

    actor,

    createdAt: nowIso,

  };

}