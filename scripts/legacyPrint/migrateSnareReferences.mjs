import fs from "fs";

import path from "path";

import { validateSnareRecord } from "./lib/validateSnareRecord.mjs";

import { buildValidationReportWrite } from "./lib/writeValidationReport.mjs";

import { buildPatchAuditWrite } from "./lib/writePatchAudit.mjs";

import { buildVoiceProfileRebuildQueueWrite } from "./lib/enqueueVoiceProfileRebuild.mjs";

const DRY_RUN = process.argv.includes("--dry-run");

const LIMIT_ARG = process.argv.find((arg) => arg.startsWith("--limit="));

const LIMIT = LIMIT_ARG ? Number(LIMIT_ARG.split("=")[1]) : null;

const inputPath = path.resolve("data/migrations/legacy-snare-migration-manifest.json");

const manifest = JSON.parse(fs.readFileSync(inputPath, "utf8"));

const records = LIMIT ? manifest.records.slice(0, LIMIT) : manifest.records;

const nowIso = new Date().toISOString();

console.log("LegacyPrint snare migration runner");

console.log({

  dryRun: DRY_RUN,

  migrationId: manifest.migrationId,

  schemaVersion: manifest.schemaVersion,

  recordCount: records.length,

});

for (const record of records) {

  const validation = validateSnareRecord(record);

  const validationReport = buildValidationReportWrite({

    recordId: record.id,

    validation,

    nowIso,

  });

  const patchAudit = buildPatchAuditWrite({

    recordId: record.id,

    patch: record,

    nowIso,

  });

  const rebuildQueueItem = buildVoiceProfileRebuildQueueWrite({

    recordId: record.id,

    priority: validation.engineReady ? 8 : 3,

    nowIso,

  });

  console.log({

    id: record.id,

    engineReady: validation.engineReady,

    validationReport,

    patchAudit,

    rebuildQueueItem,

  });

}

console.log("Migration runner check complete.");