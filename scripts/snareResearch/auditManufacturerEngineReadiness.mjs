
import fs from 'fs';

import path from 'path';

const manufacturers = process.argv.slice(2);

if (!manufacturers.length) {

  console.error('Usage: node scripts/snareResearch/auditManufacturerEngineReadiness.mjs "Tama" "Ludwig"');

  process.exit(1);

}

const EXPORT_DIR = 'data/snareResearchExports';

const OUT_PATH = path.join(EXPORT_DIR, 'manufacturer-engine-readiness-audit.json');

const allowedConfidence = new Set(['high', 'medium', 'low']);

function normalizeString(value) {

  if (value === null || value === undefined) return '';

  return String(value).trim();

}

function normalizeConfidence(value) {

  return normalizeString(value).toLowerCase();

}

function isPresent(value) {

  if (value === null || value === undefined) return false;

  if (typeof value === 'string') {

    const clean = value.trim().toLowerCase();

    return clean !== '' && clean !== 'unknown' && clean !== 'researchrequired';

  }

  if (typeof value === 'number') return Number.isFinite(value);

  if (typeof value === 'boolean') return true;

  if (Array.isArray(value)) return value.length > 0;

  if (typeof value === 'object') return Object.keys(value).length > 0;

  return true;

}

function pick(...values) {

  for (const value of values) {

    if (isPresent(value)) return value;

  }

  return undefined;

}

function toNumber(value) {

  if (typeof value === 'number' && Number.isFinite(value)) return value;

  if (typeof value === 'string') {

    const match = value.match(/-?\d+(\.\d+)?/);

    if (match) return Number(match[0]);

  }

  return undefined;

}

function inferBearingEdgeFromText(record, shellConstruction) {

  const text = [

    record.scoringBasis,

    record.drumSummaryNotes,

    record.notesOnMissingData,

    record.summary?.shortDescription,

    record.summary?.drumSummaryNotes,

    record.resolvedCore?.scoringBasis,

    record.resolvedCore?.notesOnMissingData

  ]

    .filter(Boolean)

    .join(' ')

    .toLowerCase();

  const construction = String(shellConstruction || '').toLowerCase();

  if (text.includes('formed metal bearing edge')) return 'formed metal bearing edge';

  if (text.includes('formed wood bearing edge')) return 'formed wood bearing edge; exact profile not published';

  if (text.includes('rolled collar')) return 'rolled collar bearing edge';

  if (

    construction.includes('metal') ||

    construction.includes('brass') ||

    construction.includes('steel') ||

    construction.includes('aluminum') ||

    construction.includes('bronze') ||

    construction.includes('copper')

  ) {

    return 'formed metal bearing edge';

  }

  if (

    construction.includes('ply') ||

    construction.includes('wood') ||

    construction.includes('maple') ||

    construction.includes('poplar') ||

    construction.includes('mahogany') ||

    construction.includes('walnut') ||

    construction.includes('beech') ||

    construction.includes('cherry')

  ) {

    return 'formed wood bearing edge; exact profile not published';

  }

  if (construction.includes('acrylic')) {

    return 'formed acrylic bearing edge; exact profile not published';

  }

  if (text.includes('bearing edge')) {

    return 'formed bearing edge; exact profile not published';

  }

  return undefined;

}

function inferSnareBedsFromText(record) {

  const text = [

    record.scoringBasis,

    record.drumSummaryNotes,

    record.notesOnMissingData,

    record.summary?.shortDescription,

    record.summary?.drumSummaryNotes,

    record.resolvedCore?.scoringBasis,

    record.resolvedCore?.notesOnMissingData

  ]

    .filter(Boolean)

    .join(' ')

    .toLowerCase();

  if (

    text.includes('snare bed presence') ||

    text.includes('snare beds') ||

    text.includes('snare bed')

  ) {

    return true;

  }

  return undefined;

}

function resolveCore(record) {

  const resolved = record.resolvedCore && typeof record.resolvedCore === 'object'

    ? record.resolvedCore

    : {};

  const shell = record.shell && typeof record.shell === 'object' ? record.shell : {};

  const dimensions = shell.dimensions && typeof shell.dimensions === 'object' ? shell.dimensions : {};

  const construction = shell.construction && typeof shell.construction === 'object' ? shell.construction : {};

  const bearingEdges = shell.bearingEdges && typeof shell.bearingEdges === 'object' ? shell.bearingEdges : {};

  const snareBedsObj = shell.snareBeds && typeof shell.snareBeds === 'object' ? shell.snareBeds : {};

  const stockHardware = record.stockHardware && typeof record.stockHardware === 'object' ? record.stockHardware : {};

  const hoops = stockHardware.hoops && typeof stockHardware.hoops === 'object' ? stockHardware.hoops : {};

  const sources = record.sources && typeof record.sources === 'object' ? record.sources : {};

  const summary = record.summary && typeof record.summary === 'object' ? record.summary : {};

  const shellConstructionValue = pick(

    resolved.shellConstruction,

    record.shellConstruction,

    construction.shellConstruction

  );

  const shellConstruction =

    typeof shellConstructionValue === 'object'

      ? pick(shellConstructionValue.shellConstruction, shellConstructionValue.shellMaterialPrimary)

      : shellConstructionValue;

  const shellMaterial1 = pick(

    resolved.shellMaterial1,

    record.shellMaterial1,

    record.shellMaterialPrimary,

    record.shellMaterial,

    construction.shellMaterialPrimary,

    construction.material

  );

  const shellMaterial2 = pick(

    resolved.shellMaterial2,

    record.shellMaterial2,

    record.shellMaterialSecondary,

    construction.shellMaterialSecondary

  );

  const bearingEdge = pick(

    resolved.bearingEdge,

    record.bearingEdge,

    record.bearingEdgeShape,

    bearingEdges.batterSideProfile,

    bearingEdges.snareSideProfile,

    inferBearingEdgeFromText(record, shellConstruction)

  );

  const hoopType = pick(

    resolved.hoopType,

    record.hoopType,

    hoops.batterHoopType,

    hoops.resonantHoopType

  );

  const snareBeds = pick(

    resolved.snareBeds,

    record.snareBeds,

    snareBedsObj.present,

    inferSnareBedsFromText(record)

  );

  return {

    id: record.id,

    companyName: pick(resolved.companyName, record.companyName),

    lineSeries: pick(resolved.lineSeries, record.lineSeries),

    modelName: pick(resolved.modelName, record.modelName),

    drumType: pick(resolved.drumType, record.drumType, shell.drumType, 'Snare Drum'),

    diameter: toNumber(pick(resolved.diameter, record.diameter, dimensions.diameterInches)),

    depth: toNumber(pick(resolved.depth, record.depth, dimensions.depthInches)),

    shellConstruction,

    shellMaterial1,

    shellMaterial2: pick(shellMaterial2, 'unknown'),

    shellThicknessMm: toNumber(pick(resolved.shellThicknessMm, record.shellThicknessMm, record.shellThickness, construction.shellThicknessMm)),

    plyCountLayup: pick(resolved.plyCountLayup, record.plyCountLayup, record.plyLayup, construction.layupDescription, record.plyCount, construction.plyCount),

    bearingEdge,

    snareBeds,

    hoopType,

    sourceConfidence: normalizeConfidence(pick(resolved.sourceConfidence, record.sourceConfidence, sources.sourceConfidence)),

    voiceScoreConfidence: normalizeConfidence(pick(resolved.voiceScoreConfidence, record.voiceScoreConfidence)),

    needsResearch: Boolean(pick(resolved.needsResearch, record.needsResearch, false)),

    scoringBasis: pick(resolved.scoringBasis, record.scoringBasis),

    drumSummaryNotes: pick(resolved.drumSummaryNotes, record.drumSummaryNotes, summary.drumSummaryNotes, summary.shortDescription),

    notesOnMissingData: pick(resolved.notesOnMissingData, record.notesOnMissingData, sources.notesOnMissingData)

  };

}

function auditRecord(record) {

  const core = resolveCore(record);

  const requiredChecks = {

    id: core.id,

    companyName: core.companyName,

    lineSeries: core.lineSeries,

    modelName: core.modelName,

    drumType: core.drumType,

    diameter: core.diameter,

    depth: core.depth,

    shellConstruction: core.shellConstruction,

    shellMaterial1: core.shellMaterial1,

    bearingEdge: core.bearingEdge,

    snareBeds: core.snareBeds,

    hoopType: core.hoopType,

    sourceConfidence: core.sourceConfidence,

    voiceScoreConfidence: core.voiceScoreConfidence,

    needsResearch: core.needsResearch,

    scoringBasis: core.scoringBasis,

    drumSummaryNotes: core.drumSummaryNotes

  };

  const missingRequired = Object.entries(requiredChecks)

    .filter(([key, value]) => {

      if (key === 'needsResearch') return value !== true && value !== false;

      return !isPresent(value);

    })

    .map(([key]) => key);

  const conflicts = [];

  if (!allowedConfidence.has(core.sourceConfidence)) {

    conflicts.push('INVALID: sourceConfidence must be high, medium, or low');

  }

  if (!allowedConfidence.has(core.voiceScoreConfidence)) {

    conflicts.push('INVALID: voiceScoreConfidence must be high, medium, or low');

  }

  if (!Number.isFinite(core.diameter)) {

    conflicts.push('INVALID: diameter must be numeric');

  }

  if (!Number.isFinite(core.depth)) {

    conflicts.push('INVALID: depth must be numeric');

  }

  const shellConstruction = normalizeString(core.shellConstruction).toLowerCase();

  const shellMaterial1 = normalizeString(core.shellMaterial1).toLowerCase();

  if (shellConstruction.includes('metal') && ['maple', 'poplar', 'birch', 'mahogany', 'walnut', 'beech', 'oak'].some((wood) => shellMaterial1.includes(wood))) {

    conflicts.push('WARN: shellConstruction is metal but shellMaterial1 appears to be wood');

  }

  if ((shellConstruction.includes('ply') || shellConstruction.includes('wood')) && ['steel', 'brass', 'aluminum', 'bronze', 'copper'].some((metal) => shellMaterial1.includes(metal))) {

    conflicts.push('WARN: shellConstruction is wood/ply but shellMaterial1 appears to be metal');

  }

  // Scores are intentionally not required here.

  // Engine-ready means the physical core can feed the scoring engine.

  const missingScores = [];

  const engineReady =

    missingRequired.length === 0 &&

    missingScores.length === 0 &&

    conflicts.filter((item) => item.startsWith('INVALID')).length === 0;

  return {

    id: record.id,

    companyName: core.companyName,

    lineSeries: core.lineSeries,

    modelName: core.modelName,

    sourceConfidence: core.sourceConfidence,

    voiceScoreConfidence: core.voiceScoreConfidence,

    needsResearch: core.needsResearch,

    engineReady,

    missingRequired,

    missingScores,

    conflicts,

    resolvedCore: core

  };

}

function makeEmptyStats() {

  return {

    total: 0,

    engineReady: 0,

    notEngineReady: 0,

    needsResearch: 0,

    high: 0,

    medium: 0,

    low: 0,

    unknown: 0,

    missingRequired: 0,

    missingScores: 0,

    conflicts: 0

  };

}

function summarize(records) {

  const summary = {

    total: records.length,

    engineReady: 0,

    notEngineReady: 0,

    needsResearch: 0,

    highSourceConfidence: 0,

    mediumSourceConfidence: 0,

    lowSourceConfidence: 0,

    unknownSourceConfidence: 0,

    missingRequiredRecords: 0,

    missingScoreRecords: 0,

    conflictRecords: 0

  };

  const byLine = {};

  for (const item of records) {

    const line = item.lineSeries || 'unknown';

    byLine[line] ||= makeEmptyStats();

    summary.engineReady += item.engineReady ? 1 : 0;

    summary.notEngineReady += item.engineReady ? 0 : 1;

    summary.needsResearch += item.needsResearch ? 1 : 0;

    summary.missingRequiredRecords += item.missingRequired.length ? 1 : 0;

    summary.missingScoreRecords += item.missingScores.length ? 1 : 0;

    summary.conflictRecords += item.conflicts.length ? 1 : 0;

    if (item.sourceConfidence === 'high') summary.highSourceConfidence += 1;

    else if (item.sourceConfidence === 'medium') summary.mediumSourceConfidence += 1;

    else if (item.sourceConfidence === 'low') summary.lowSourceConfidence += 1;

    else summary.unknownSourceConfidence += 1;

    byLine[line].total += 1;

    byLine[line].engineReady += item.engineReady ? 1 : 0;

    byLine[line].notEngineReady += item.engineReady ? 0 : 1;

    byLine[line].needsResearch += item.needsResearch ? 1 : 0;

    byLine[line].missingRequired += item.missingRequired.length ? 1 : 0;

    byLine[line].missingScores += item.missingScores.length ? 1 : 0;

    byLine[line].conflicts += item.conflicts.length ? 1 : 0;

    if (item.sourceConfidence === 'high') byLine[line].high += 1;

    else if (item.sourceConfidence === 'medium') byLine[line].medium += 1;

    else if (item.sourceConfidence === 'low') byLine[line].low += 1;

    else byLine[line].unknown += 1;

  }

  return { summary, byLine };

}

const output = {

  generatedAt: new Date().toISOString(),

  manufacturers: {}

};

for (const manufacturer of manufacturers) {

  const filePath = path.join(EXPORT_DIR, `${manufacturer.toLowerCase()}-firestore-export.json`);

  if (!fs.existsSync(filePath)) {

    console.error(`Missing export for ${manufacturer}: ${filePath}`);

    process.exitCode = 1;

    continue;

  }

  const sourceRecords = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const records = sourceRecords.map(auditRecord);

  const { summary, byLine } = summarize(records);

  output.manufacturers[manufacturer] = {

    filePath,

    summary,

    byLine,

    records,

    failedRecords: records.filter((record) => !record.engineReady)

  };

  console.log(`\n============================================================`);

  console.log(`${manufacturer} ENGINE READINESS`);

  console.log(`============================================================`);

  console.table([summary]);

  const issueLines = Object.entries(byLine)

    .map(([lineSeries, stats]) => ({ lineSeries, ...stats }))

    .filter((row) => row.notEngineReady || row.needsResearch || row.missingRequired || row.conflicts || row.unknown)

    .sort((a, b) =>

      b.notEngineReady - a.notEngineReady ||

      b.missingRequired - a.missingRequired ||

      b.conflicts - a.conflicts ||

      b.total - a.total

    );

  if (issueLines.length) {

    console.log('\nIssue lines:');

    console.table(issueLines);

  } else {

    console.log('\n✅ No issue lines found.');

  }

  if (output.manufacturers[manufacturer].failedRecords.length) {

    console.log('\nFAILED RECORDS');

    console.log(JSON.stringify(output.manufacturers[manufacturer].failedRecords, null, 2));

  } else {

    console.log('\n✅ All records engine-ready.');

  }

}

fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2));

console.log(`\n============================================================`);

console.log(`Audit written: ${OUT_PATH}`);

console.log(`============================================================`);

