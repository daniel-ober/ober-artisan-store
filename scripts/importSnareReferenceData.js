/* eslint-disable no-console */

const fs = require("fs");

const path = require("path");

const crypto = require("crypto");

const xlsx = require("xlsx");

const admin = require("firebase-admin");

const ALL_MANUFACTURERS_FILE =

  "/Users/danober/Desktop/batch data/Ober_LegacyPrint_Master_Snare_Reference_Dataset_ALL_MANUFACTURERS.xlsx";

const OBER_ARTISAN_FILE =

  "/Users/danober/Desktop/batch data/Ober_LegacyPrint_Master_Snare_Reference_Dataset_OBER_ARTISAN.xlsx";

const MASTER_COLLECTION = "snareReferenceDrums";

const OBER_COLLECTION = "oberArtisanSnareVariants";

const REPORT_DIR = path.join(process.cwd(), "import-reports");

const args = process.argv.slice(2);

const isDryRun = args.includes("--dry-run");

const isCommit = args.includes("--commit");

if (!isDryRun && !isCommit) {

  console.error("Missing mode. Use one:");

  console.error("  node scripts/importSnareReferenceData.js --dry-run");

  console.error("  node scripts/importSnareReferenceData.js --commit");

  process.exit(1);

}

if (isDryRun && isCommit) {

  console.error("Use only one mode: --dry-run OR --commit");

  process.exit(1);

}

function initFirebase() {

  if (admin.apps.length) return;

  /**

   * This uses your normal Firebase Admin credentials.

   *

   * Best local option:

   * export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/serviceAccountKey.json"

   *

   * Optional:

   * export FIREBASE_PROJECT_ID="your-project-id"

   */

  admin.initializeApp({

    credential: admin.credential.applicationDefault(),

    projectId: process.env.FIREBASE_PROJECT_ID || undefined,

  });

}

function normalizeHeader(header) {

  return String(header || "")

    .trim()

    .replace(/\s+/g, " ")

    .toUpperCase();

}

function getValue(row, header) {

  return row[normalizeHeader(header)];

}

function cleanString(value) {

  if (value === undefined || value === null) return null;

  const str = String(value).trim();

  if (!str) return null;

  const lowered = str.toLowerCase();

  if (

    lowered === "unknown" ||

    lowered === "n/a" ||

    lowered === "na" ||

    lowered === "null" ||

    lowered === "undefined"

  ) {

    return null;

  }

  return str;

}

function keepString(value) {

  if (value === undefined || value === null) return "";

  return String(value).trim();

}

function toNumber(value) {

  const cleaned = cleanString(value);

  if (cleaned === null) return null;

  const normalized = String(cleaned).replace(/[^0-9.-]/g, "");

  if (!normalized) return null;

  const number = Number(normalized);

  return Number.isFinite(number) ? number : null;

}

function toBoolean(value) {

  const cleaned = cleanString(value);

  if (cleaned === null) return null;

  const lowered = cleaned.toLowerCase();

  if (["yes", "y", "true", "current"].includes(lowered)) return true;

  if (["no", "n", "false"].includes(lowered)) return false;

  return null;

}

function toKey(value) {

  const cleaned = cleanString(value);

  if (!cleaned) return "unknown";

  return cleaned

    .toLowerCase()

    .replace(/ø/g, "o")

    .replace(/&/g, "and")

    .replace(/[^a-z0-9]+/g, "-")

    .replace(/^-+|-+$/g, "");

}

function makeSizeKey(diameter, depth) {

  const d = diameter === null ? "unknown" : String(diameter).replace(".", "-");

  const dep = depth === null ? "unknown" : String(depth).replace(".", "-");

  return `${d}x${dep}`;

}

function makeDocId(parts) {

  const base = parts

    .filter(Boolean)

    .map(toKey)

    .join("_")

    .replace(/_+/g, "_")

    .slice(0, 120);

  const hash = crypto

    .createHash("sha1")

    .update(parts.join("|"))

    .digest("hex")

    .slice(0, 8);

  return `${base}_${hash}`;

}

function readSheetRows(filePath, preferredSheetNames = []) {

  if (!fs.existsSync(filePath)) {

    throw new Error(`File not found: ${filePath}`);

  }

  const workbook = xlsx.readFile(filePath);

  const availableSheets = workbook.SheetNames;

  const sheetName =

    preferredSheetNames.find((name) => availableSheets.includes(name)) ||

    availableSheets[0];

  if (!sheetName) {

    throw new Error(`No sheets found in ${filePath}`);

  }

  const sheet = workbook.Sheets[sheetName];

  const rawRows = xlsx.utils.sheet_to_json(sheet, {

    defval: "",

    raw: false,

  });

  const rows = rawRows.map((raw) => {

    const normalized = {};

    Object.entries(raw).forEach(([key, value]) => {

      normalized[normalizeHeader(key)] = value;

    });

    return normalized;

  });

  return {

    sheetName,

    rows,

    availableSheets,

  };

}

function buildBaseDoc(row, importBatchId, sourceWorkbookType) {

  const companyName = cleanString(getValue(row, "COMPANY NAME"));

  const companyType = cleanString(getValue(row, "COMPANY TYPE"));

  const lineSeries = cleanString(getValue(row, "LINE/SERIES"));

  const modelName = cleanString(getValue(row, "MODEL NAME"));

  const drumType = cleanString(getValue(row, "DRUM TYPE"));

  const diameter = toNumber(getValue(row, "DIAMETER"));

  const depth = toNumber(getValue(row, "DEPTH"));

  const sizeKey = makeSizeKey(diameter, depth);

  const material1 = cleanString(getValue(row, "SHELL MATERIAL 1"));

  const material2 = cleanString(getValue(row, "SHELL MATERIAL 2"));

  const material3 = cleanString(getValue(row, "SHELL MATERIAL 3"));

  const doc = {

    companyName,

    companyType,

    lineSeries,

    modelName,

    drumType,

    diameter,

    depth,

    sizeKey,

    shell: {

      construction: cleanString(getValue(row, "SHELL CONSTRUCTION")),

      material1,

      material2,

      material3,

      plyCountLayup: cleanString(getValue(row, "PLY COUNT / LAYUP")),

      thicknessMm: toNumber(getValue(row, "SHELL THICKNESS (in mm)")),

      reinforcementRings: cleanString(getValue(row, "REINFORCEMENT RINGS")),

      bearingEdge: cleanString(getValue(row, "BEARING EDGE")),

      snareBedType: cleanString(getValue(row, "SNARE BED TYPE")),

      finishType: cleanString(getValue(row, "FINISH TYPE")),

      hoopRimType: cleanString(getValue(row, "HOOP/RIM TYPE")),

    },

    hardware: {

      lugCount: toNumber(getValue(row, "LUG COUNT")),

      lugType: cleanString(getValue(row, "LUG TYPE")),

      hardwareFinish: cleanString(getValue(row, "HARDWARE FINISH")),

      snareThrowMakeAndModel: cleanString(

        getValue(row, "SNARE THROW MAKE AND MODEL")

      ),

      stockSnareWires: cleanString(getValue(row, "STOCK SNARE WIRES")),

      stockBatterHead: cleanString(getValue(row, "STOCK BATTER HEAD")),

      stockResoHead: cleanString(getValue(row, "STOCK RESO HEAD")),

    },

    production: {

      currentlyInProduction: toBoolean(

        getValue(row, "CURRENTLY IN PRODUCTION (YES/NO)")

      ),

      artistSignatureLine: toBoolean(

        getValue(row, "ARTIST/SIGNATURE LINE (YES/NO)")

      ),

      discontinued: toBoolean(getValue(row, "DISCONTINUED (YES/NO)")),

      rareCollectible: toBoolean(getValue(row, "RARE/COLLECTIBLE (YES/NO)")),

      yearInProduction: cleanString(getValue(row, "YEAR IN PRODUCTION")),

      yearDiscontinued: cleanString(getValue(row, "YEAR DISCONTINUED")),

      modelNum: cleanString(getValue(row, "MODEL NUM.")),

    },

    oberScores: {

      attack: toNumber(getValue(row, "OVERALL ATTACK OBER SCORE (1-10)")),

      brightness: toNumber(

        getValue(row, "OVERALL BRIGHTNESS OBER SCORE (1-10)")

      ),

      projection: toNumber(

        getValue(row, "OVERALL PROJECTION OBER SCORE (1-10)")

      ),

      sustain: toNumber(getValue(row, "OVERALL SUSTAIN OBER SCORE (1-10)")),

      warmth: toNumber(getValue(row, "OVERALL WARMTH OBER SCORE (1-10)")),

      sensitivity: toNumber(

        getValue(row, "OVERALL SENSITIVITY OBER SCORE (1-10)")

      ),

      control: toNumber(getValue(row, "OVERALL CONTROL OBER SCORE (1-10)")),

      confidence: cleanString(getValue(row, "VOICE SCORE CONFIDENCE")),

      scoringBasis: cleanString(getValue(row, "SCORING BASIS")),

    },

    tuning: {

      projectedShellFundamentalPitch: cleanString(

        getValue(row, "PROJECTED SHELL FUNDAMENTAL PITCH")

      ),

      recommendedBatter: cleanString(

        getValue(row, "RECOMMENDED TUNING -- BATTER (HZ AND NEAREST NOTE)")

      ),

      recommendedReso: cleanString(

        getValue(row, "RECOMMENDED TUNING -- RESO (HZ AND NEAREST NOTE)")

      ),

    },

    sources: {

      primarySourceUrl: cleanString(getValue(row, "PRIMARY SOURCE URL")),

      secondarySourceUrl: cleanString(getValue(row, "SECONDARY SOURCE URL")),

      sourceConfidence: cleanString(getValue(row, "SOURCE CONFIDENCE")),

      imageUrl: cleanString(getValue(row, "IMG URL OF THE SPECIFIC DRUM")),

    },

    notes: {

      missingData: cleanString(getValue(row, "NOTES ON MISSING DATA")),

      summary: cleanString(getValue(row, "DRUM SUMMARY NOTES")),

    },

    search: {

      companyKey: toKey(companyName),

      lineKey: toKey(lineSeries),

      modelKey: toKey(modelName),

      sizeKey,

      materialKeys: [material1, material2, material3].filter(Boolean).map(toKey),

      constructionKey: toKey(getValue(row, "SHELL CONSTRUCTION")),

      hoopKey: toKey(getValue(row, "HOOP/RIM TYPE")),

      finishKey: toKey(getValue(row, "FINISH TYPE")),

      edgeKey: toKey(getValue(row, "BEARING EDGE")),

      snareBedKey: toKey(getValue(row, "SNARE BED TYPE")),

    },

    importMeta: {

      importBatchId,

      sourceWorkbookType,

      importedAt: admin.firestore.FieldValue.serverTimestamp(),

      updatedAt: admin.firestore.FieldValue.serverTimestamp(),

    },

  };

  return doc;

}

function buildOberFields(doc) {

  const line = doc.lineSeries || "";

  const isFeuzon = line.toLowerCase().includes("feuz");

  const isHeritage = line.toLowerCase().includes("heritage");

  return {

    ...doc,

    oberBuild: {

      productLine: doc.lineSeries,

      isHeritage,

      isFeuzon,

      isReferenceVariant: true,

      scorchDepth: inferScorchDepth(doc.shell.finishType, doc.modelName),

      steamBentExteriorWood: isFeuzon ? doc.shell.material1 : null,

      coreStaveWoodSpecies1: isFeuzon ? doc.shell.material2 : doc.shell.material1,

      coreStaveWoodSpecies2: isFeuzon ? doc.shell.material3 : null,

    },

  };

}

function inferScorchDepth(finishType, modelName) {

  const text = `${finishType || ""} ${modelName || ""}`.toLowerCase();

  if (text.includes("blackened")) return "Blackened";

  if (text.includes("medium scorch")) return "Medium Scorch";

  if (text.includes("light scorch")) return "Light Scorch";

  if (text.includes("scorch")) return "Scorched";

  return null;

}

function validateDoc(doc, rowIndex) {

  const issues = [];

  if (!doc.companyName) issues.push("Missing companyName");

  if (!doc.modelName) issues.push("Missing modelName");

  if (!doc.lineSeries) issues.push("Missing lineSeries");

  if (doc.diameter === null) issues.push("Missing diameter");

  if (doc.depth === null) issues.push("Missing depth");

  const scores = doc.oberScores || {};

  const scoreKeys = [

    "attack",

    "brightness",

    "projection",

    "sustain",

    "warmth",

    "sensitivity",

    "control",

  ];

  scoreKeys.forEach((key) => {

    const value = scores[key];

    if (value === null) {

      issues.push(`Missing score: ${key}`);

    } else if (value < 1 || value > 10) {

      issues.push(`Score out of range: ${key}=${value}`);

    }

  });

  return {

    rowIndex,

    issues,

  };

}

async function commitDocs(collectionName, docs) {

  const db = admin.firestore();

  const chunks = [];

  for (let i = 0; i < docs.length; i += 450) {

    chunks.push(docs.slice(i, i + 450));

  }

  let written = 0;

  for (const chunk of chunks) {

    const batch = db.batch();

    chunk.forEach(({ docId, data }) => {

      const ref = db.collection(collectionName).doc(docId);

      batch.set(ref, data, { merge: true });

    });

    await batch.commit();

    written += chunk.length;

    console.log(`Committed ${written}/${docs.length} to ${collectionName}`);

  }

  return written;

}

async function processWorkbook({

  filePath,

  preferredSheetNames,

  collectionName,

  importBatchId,

  sourceWorkbookType,

  isOber,

}) {

  const { sheetName, rows, availableSheets } = readSheetRows(

    filePath,

    preferredSheetNames

  );

  const docs = [];

  const skipped = [];

  const validationIssues = [];

  const duplicateIds = new Map();

  rows.forEach((row, index) => {

    const companyName = cleanString(getValue(row, "COMPANY NAME"));

    const modelName = cleanString(getValue(row, "MODEL NAME"));

    if (!companyName && !modelName) {

      skipped.push({

        row: index + 2,

        reason: "Blank row",

      });

      return;

    }

    let doc = buildBaseDoc(row, importBatchId, sourceWorkbookType);

    if (isOber) {

      doc = buildOberFields(doc);

    }

    const docId = makeDocId([

      doc.companyName,

      doc.lineSeries,

      doc.modelName,

      doc.sizeKey,

      doc.shell.construction,

      doc.shell.material1,

      doc.shell.material2,

      doc.shell.material3,

      doc.shell.thicknessMm,

      doc.shell.bearingEdge,

      doc.shell.snareBedType,

      doc.shell.finishType,

      doc.shell.hoopRimType,

      doc.production.modelNum,

    ]);

    if (duplicateIds.has(docId)) {

      duplicateIds.set(docId, duplicateIds.get(docId) + 1);

    } else {

      duplicateIds.set(docId, 1);

    }

    const validation = validateDoc(doc, index + 2);

    if (validation.issues.length) {

      validationIssues.push(validation);

    }

    docs.push({

      docId,

      data: doc,

      sourceRow: index + 2,

    });

  });

  const duplicateList = [...duplicateIds.entries()]

    .filter(([, count]) => count > 1)

    .map(([docId, count]) => ({ docId, count }));

  let written = 0;

  if (isCommit) {

    written = await commitDocs(collectionName, docs);

  }

  return {

    filePath,

    sheetName,

    availableSheets,

    collectionName,

    sourceWorkbookType,

    rowsRead: rows.length,

    docsPrepared: docs.length,

    docsWritten: written,

    skipped,

    duplicateList,

    validationIssues,

    sampleDocIds: docs.slice(0, 10).map((doc) => doc.docId),

  };

}

async function main() {

  initFirebase();

  if (!fs.existsSync(REPORT_DIR)) {

    fs.mkdirSync(REPORT_DIR, { recursive: true });

  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  const importBatchId = `snare-import-${timestamp}`;

  const mode = isCommit ? "commit" : "dry-run";

  console.log(`Starting ${mode} import...`);

  console.log(`Import batch: ${importBatchId}`);

  const masterReport = await processWorkbook({

    filePath: ALL_MANUFACTURERS_FILE,

    preferredSheetNames: ["Combined Master Dataset", "Master Dataset"],

    collectionName: MASTER_COLLECTION,

    importBatchId,

    sourceWorkbookType: "all_manufacturers",

    isOber: false,

  });

  const oberReport = await processWorkbook({

    filePath: OBER_ARTISAN_FILE,

    preferredSheetNames: [

      "Ober Artisan Dataset",

      "Ober Artisan Drums",

      "Ober Dataset",

    ],

    collectionName: OBER_COLLECTION,

    importBatchId,

    sourceWorkbookType: "ober_artisan",

    isOber: true,

  });

  const report = {

    mode,

    importBatchId,

    generatedAt: new Date().toISOString(),

    files: {

      allManufacturers: ALL_MANUFACTURERS_FILE,

      oberArtisan: OBER_ARTISAN_FILE,

    },

    collections: {

      allManufacturers: MASTER_COLLECTION,

      oberArtisan: OBER_COLLECTION,

    },

    totals: {

      rowsRead:

        masterReport.rowsRead +

        oberReport.rowsRead,

      docsPrepared:

        masterReport.docsPrepared +

        oberReport.docsPrepared,

      docsWritten:

        masterReport.docsWritten +

        oberReport.docsWritten,

      validationIssues:

        masterReport.validationIssues.length +

        oberReport.validationIssues.length,

      duplicates:

        masterReport.duplicateList.length +

        oberReport.duplicateList.length,

      skipped:

        masterReport.skipped.length +

        oberReport.skipped.length,

    },

    masterReport,

    oberReport,

  };

  const reportPath = path.join(

    REPORT_DIR,

    `snare-reference-import-report-${mode}-${timestamp}.json`

  );

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log("");

  console.log("Import report:");

  console.log(`  ${reportPath}`);

  console.log("");

  console.log("Summary:");

  console.log(`  Mode: ${mode}`);

  console.log(`  Rows read: ${report.totals.rowsRead}`);

  console.log(`  Docs prepared: ${report.totals.docsPrepared}`);

  console.log(`  Docs written: ${report.totals.docsWritten}`);

  console.log(`  Validation issue rows: ${report.totals.validationIssues}`);

  console.log(`  Duplicate doc IDs: ${report.totals.duplicates}`);

  console.log(`  Skipped rows: ${report.totals.skipped}`);

  if (isDryRun) {

    console.log("");

    console.log("Dry run complete. No Firestore writes were made.");

    console.log("Review the JSON report before running --commit.");

  } else {

    console.log("");

    console.log("Commit complete.");

  }

}

main().catch((error) => {

  console.error("Import failed:");

  console.error(error);

  process.exit(1);

});