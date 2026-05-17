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

const SCORE_KEYS = [

  "attack",

  "brightness",

  "projection",

  "sustain",

  "warmth",

  "sensitivity",

  "control",

];

const VALID_SHELL_CONSTRUCTIONS = [

  "Ply",

  "Stave",

  "Block",

  "Steam Bent",

  "Solid Shell",

  "Metal",

  "Acrylic",

  "Carbon Fiber",

  "Hybrid",

  "Ply / Resonator",

  "Composite",

  "Other / Needs Research",

];

function initFirebase() {

  if (admin.apps.length) return;

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

function normalizeSearchText(...values) {

  return values

    .flat()

    .filter((value) => value !== undefined && value !== null)

    .map((value) => {

      if (Array.isArray(value)) return value.join(" ");

      if (typeof value === "object") return Object.values(value).join(" ");

      return String(value);

    })

    .join(" ")

    .toLowerCase()

    .replace(/[øØ]/g, "o")

    .replace(/[^a-z0-9.]+/g, " ")

    .replace(/\s+/g, " ")

    .trim();

}

function normalizeMaterial(value) {

  const rawValue = cleanString(value);

  const text = normalizeSearchText(value);

  if (!text) return null;

  const materialMatches = [

    ["black nickel over brass", "Black Nickel over Brass"],

    ["chrome over brass", "Chrome over Brass"],

    ["nickel over brass", "Nickel over Brass"],

    ["bell brass", "Bell Brass"],

    ["cast bell brass", "Cast Bell Brass"],

    ["hammered brass", "Hammered Brass"],

    ["raw brass", "Raw Brass"],

    ["brass", "Brass"],

    ["phosphor bronze", "Phosphor Bronze"],

    ["bronze", "Bronze"],

    ["copper", "Copper"],

    ["aluminum", "Aluminum"],

    ["aluminium", "Aluminum"],

    ["stainless steel", "Stainless Steel"],

    ["raw steel", "Raw Steel"],

    ["steel", "Steel"],

    ["titanium", "Titanium"],

    ["iron", "Iron"],

    ["carbon fiber", "Carbon Fiber"],

    ["concrete composite", "Concrete Composite"],

    ["maple gum", "Maple / Gum"],

    ["maple/gum", "Maple / Gum"],

    ["maple poplar", "Maple / Poplar"],

    ["maple/poplar", "Maple / Poplar"],

    ["maple mahogany", "Maple / Mahogany"],

    ["maple/mahogany", "Maple / Mahogany"],

    ["mahogany poplar", "Mahogany / Poplar"],

    ["mahogany/poplar", "Mahogany / Poplar"],

    ["birch bubinga", "Birch / Bubinga"],

    ["birch/bubinga", "Birch / Bubinga"],

    ["walnut birch", "Walnut / Birch"],

    ["walnut/birch", "Walnut / Birch"],

    ["maple walnut", "Maple / Walnut"],

    ["maple/walnut", "Maple / Walnut"],

    ["northern red oak", "Northern Red Oak"],

    ["tasmanian blackwood", "Tasmanian Blackwood"],

    ["jarrah", "Jarrah"],

    ["maple", "Maple"],

    ["walnut", "Walnut"],

    ["mahogany", "Mahogany"],

    ["oak", "Oak"],

    ["birch", "Birch"],

    ["cherry", "Cherry"],

    ["beech", "Beech"],

    ["poplar", "Poplar"],

    ["bubinga", "Bubinga"],

    ["kapur", "Kapur"],

    ["spruce", "Spruce"],

    ["sassafras", "Sassafras"],

    ["ash", "Ash"],

    ["rose gum", "Rose Gum"],

    ["gum", "Gum"],

    ["acrylic", "Acrylic"],

    ["exotic hardwood", "Exotic Hardwood"],

    ["wood", "Wood"],

  ];

  const match = materialMatches.find(([needle]) => {

    return text.includes(normalizeSearchText(needle));

  });

  if (match?.[1]) return match[1];

  /**

   * Important:

   * If the value is long notes/source text, do NOT save it as material.

   * This prevents ugly outputs like:

   * "canopus others 12top 6bottom lugs..."

   */

  const looksLikeNotesText =

    text.length > 80 ||

    text.includes("catalog incomplete") ||

    text.includes("shell first score") ||

    text.includes("listed in official") ||

    text.includes("requires deeper") ||

    text.includes("source") ||

    text.includes("http") ||

    text.includes("www");

  if (looksLikeNotesText) return null;

  return rawValue;

}

function inferMaterialFromDocFields({

  companyName,

  lineSeries,

  modelName,

  shellConstruction,

  material1,

  material2,

  material3,

  plyCountLayup,

  scoringBasis,

  notesMissingData,

  notesSummary,

  primarySourceUrl,

  secondarySourceUrl,

}) {

  const directMaterial = normalizeMaterial(material1);

  if (directMaterial) return directMaterial;

  const text = normalizeSearchText(

    companyName,

    lineSeries,

    modelName,

    shellConstruction,

    material1,

    material2,

    material3,

    plyCountLayup,

    scoringBasis,

    notesMissingData,

    notesSummary,

    primarySourceUrl,

    secondarySourceUrl

  );

  return normalizeMaterial(text);

}

function normalizeShellConstruction(value) {

  const text = normalizeSearchText(value);

  if (!text) return null;

  const constructionMatches = [

    ["ply / resonator", "Ply / Resonator"],

    ["inner resonator shell", "Ply / Resonator"],

    ["resonator", "Ply / Resonator"],

    ["carbon fiber", "Carbon Fiber"],

    ["composite shell", "Composite"],

    ["cast composite", "Composite"],

    ["concrete composite", "Composite"],

    ["cast/composite", "Composite"],

    ["steam bent", "Steam Bent"],

    ["steambent", "Steam Bent"],

    ["steam-bent", "Steam Bent"],

    ["single ply", "Steam Bent"],

    ["1 ply", "Steam Bent"],

    ["one ply", "Steam Bent"],

    ["solid shell", "Solid Shell"],

    ["solid", "Solid Shell"],

    ["one piece", "Solid Shell"],

    ["single piece", "Solid Shell"],

    ["block shell", "Block"],

    ["block", "Block"],

    ["segment", "Block"],

    ["segmented", "Block"],

    ["stave", "Stave"],

    ["hybrid wood metal", "Hybrid"],

    ["hybrid wood/metal", "Hybrid"],

    ["wood metal edge", "Hybrid"],

    ["wood/metal edge", "Hybrid"],

    ["maple metal", "Hybrid"],

    ["maple/metal", "Hybrid"],

    ["top edge", "Hybrid"],

    ["edge maple metal", "Hybrid"],

    ["metal auxiliary shell", "Metal"],

    ["metal/unknown shell", "Metal"],

    ["seamed metal", "Metal"],

    ["hammered metal", "Metal"],

    ["bell brass", "Metal"],

    ["cast bell brass", "Metal"],

    ["black nickel over brass", "Metal"],

    ["chrome over brass", "Metal"],

    ["brass", "Metal"],

    ["bronze", "Metal"],

    ["copper", "Metal"],

    ["aluminum", "Metal"],

    ["aluminium", "Metal"],

    ["steel", "Metal"],

    ["stainless", "Metal"],

    ["titanium", "Metal"],

    ["iron", "Metal"],

    ["seamless", "Metal"],

    ["spun", "Metal"],

    ["rolled", "Metal"],

    ["cast metal", "Metal"],

    ["metal shell", "Metal"],

    ["acrylic", "Acrylic"],

    ["plexiglass", "Acrylic"],

    ["maple shell / limited", "Ply"],

    ["maple shell", "Ply"],

    ["wood shell", "Ply"],

    ["piccolo thin depth rogers shell family", "Ply"],

    ["marching field snare shell", "Ply"],

    ["ltd custom dyna sonic shell family", "Ply"],

    ["covington kit snare shell family", "Ply"],

    ["ply shell", "Ply"],

    ["ply", "Ply"],

    ["plies", "Ply"],

    ["laminated", "Ply"],

    ["unknown special project shell", "Other / Needs Research"],

    ["unknown artist reference", "Other / Needs Research"],

    ["unknown likely metal or wood signature build", "Other / Needs Research"],

  ];

  const match = constructionMatches.find(([needle]) => {

    return text.includes(normalizeSearchText(needle));

  });

  return match?.[1] || null;

}

function inferShellConstructionFromDocFields({

  companyName,

  lineSeries,

  modelName,

  shellConstruction,

  material1,

  material2,

  material3,

  plyCountLayup,

  scoringBasis,

  notesMissingData,

  notesSummary,

  primarySourceUrl,

  secondarySourceUrl,

}) {

  const directConstruction = normalizeShellConstruction(shellConstruction);

  if (directConstruction) return directConstruction;

  const text = normalizeSearchText(

    companyName,

    lineSeries,

    modelName,

    shellConstruction,

    material1,

    material2,

    material3,

    plyCountLayup,

    scoringBasis,

    notesMissingData,

    notesSummary,

    primarySourceUrl,

    secondarySourceUrl

  );

  if (!text) return null;

  /**

   * Specific known cleanup rules from current dry-run warnings.

   */

  if (text.includes("metalworks effect")) return "Metal";

  if (text.includes("dw edge") || text.includes("dw top edge")) {

    return "Hybrid";

  }

  if (text.includes("dw concrete")) return "Composite";

  if (text.includes("pdp ace") || text.includes("pdp woody")) {

    return "Ply";

  }

  if (text.includes("pdp concept limited maple walnut")) {

    return "Ply";

  }

  if (text.includes("dw carbon fiber") || text.includes("carbon fiber")) {

    return "Carbon Fiber";

  }

  if (text.includes("premier") && text.includes("resonator")) {

    return "Ply / Resonator";

  }

  if (text.includes("brady") && text.includes("block shell")) {

    return "Block";

  }

  if (text.includes("jarrah block") || text.includes("blackwood block")) {

    return "Block";

  }

  if (text.includes("rogers") && text.includes("skinny drum")) {

    return "Ply";

  }

  if (text.includes("marching") && text.includes("maple poplar")) {

    return "Ply";

  }

  if (text.includes("ltd custom dyna sonic")) {

    return "Ply";

  }

  if (text.includes("covington kit snare")) {

    return "Ply";

  }

  if (text.includes("catalog era wood shell family")) {

    return "Ply";

  }

  if (text.includes("worldmax") && text.includes("wood snare")) {

    return "Ply";

  }

  if (text.includes("joyful noise") && text.includes("personal reserve")) {

    return "Steam Bent";

  }

  if (text.includes("canopus") && text.includes("unknown special project")) {

    return "Other / Needs Research";

  }

  if (

    text.includes("artist reference") ||

    text.includes("endorser reference") ||

    text.includes("exact model specs need manual confirmation")

  ) {

    return "Other / Needs Research";

  }

  if (text.includes("unknown likely metal or wood signature build")) {

    return "Other / Needs Research";

  }

  /**

   * General rules.

   */

  if (text.includes("steam bent") || text.includes("steambent")) {

    return "Steam Bent";

  }

  if (text.includes("single ply") || text.includes("one ply")) {

    return "Steam Bent";

  }

  if (text.includes("solid shell") || text.includes("one piece shell")) {

    return "Solid Shell";

  }

  if (text.includes("block shell")) {

    return "Block";

  }

  if (text.includes("stave")) {

    return "Stave";

  }

  if (

    text.includes("hybrid") &&

    (text.includes("wood metal") ||

      text.includes("wood/metal") ||

      text.includes("wood and metal") ||

      text.includes("feuzon") ||

      text.includes("edge"))

  ) {

    return "Hybrid";

  }

  if (

    text.includes("seamless") ||

    text.includes("beaded") ||

    text.includes("spun") ||

    text.includes("rolled") ||

    text.includes("cast metal") ||

    text.includes("metal shell") ||

    text.includes("metal auxiliary") ||

    text.includes("seamed metal") ||

    text.includes("hammered metal") ||

    text.includes("bell brass") ||

    text.includes("brass") ||

    text.includes("bronze") ||

    text.includes("copper") ||

    text.includes("aluminum") ||

    text.includes("aluminium") ||

    text.includes("steel") ||

    text.includes("titanium")

  ) {

    return "Metal";

  }

  if (text.includes("carbon fiber")) {

    return "Carbon Fiber";

  }

  if (

    text.includes("composite") ||

    text.includes("concrete")

  ) {

    return "Composite";

  }

  if (text.includes("acrylic") || text.includes("plexiglass")) {

    return "Acrylic";

  }

  if (

    text.includes("ply") ||

    text.includes("plies") ||

    text.includes("laminated") ||

    text.includes("wood shell") ||

    text.includes("maple") ||

    text.includes("birch") ||

    text.includes("mahogany") ||

    text.includes("poplar") ||

    text.includes("walnut") ||

    text.includes("oak") ||

    text.includes("beech") ||

    text.includes("bubinga") ||

    text.includes("jarrah") ||

    text.includes("blackwood") ||

    text.includes("wood")

  ) {

    return "Ply";

  }

  return "Other / Needs Research";

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

function hasCompleteScores(oberScores = {}) {

  return SCORE_KEYS.every((key) => {

    const value = oberScores[key];

    return value !== null && value !== undefined && Number.isFinite(Number(value));

  });

}

function buildBaseDoc(row, importBatchId, sourceWorkbookType) {

  const companyName = cleanString(getValue(row, "COMPANY NAME"));

  const companyType = cleanString(getValue(row, "COMPANY TYPE"));

  const lineSeries = cleanString(getValue(row, "LINE/SERIES"));

  const modelName = cleanString(getValue(row, "MODEL NAME"));

  const drumType = cleanString(getValue(row, "DRUM TYPE")) || "Snare";

  const diameter = toNumber(getValue(row, "DIAMETER"));

  const depth = toNumber(getValue(row, "DEPTH"));

  const sizeKey = makeSizeKey(diameter, depth);

  const rawShellConstruction = getValue(row, "SHELL CONSTRUCTION");

  const rawMaterial1 = getValue(row, "SHELL MATERIAL 1");

  const rawMaterial2 = getValue(row, "SHELL MATERIAL 2");

  const rawMaterial3 = getValue(row, "SHELL MATERIAL 3");

  const rawPlyCountLayup = getValue(row, "PLY COUNT / LAYUP");

  const rawScoringBasis = getValue(row, "SCORING BASIS");

  const rawNotesMissingData = getValue(row, "NOTES ON MISSING DATA");

  const rawNotesSummary = getValue(row, "DRUM SUMMARY NOTES");

  const rawPrimarySourceUrl = getValue(row, "PRIMARY SOURCE URL");

  const rawSecondarySourceUrl = getValue(row, "SECONDARY SOURCE URL");

  const material1 =

    normalizeMaterial(rawMaterial1) ||

    inferMaterialFromDocFields({

      companyName,

      lineSeries,

      modelName,

      shellConstruction: rawShellConstruction,

      material1: rawMaterial1,

      material2: rawMaterial2,

      material3: rawMaterial3,

      plyCountLayup: rawPlyCountLayup,

      scoringBasis: rawScoringBasis,

      notesMissingData: rawNotesMissingData,

      notesSummary: rawNotesSummary,

      primarySourceUrl: rawPrimarySourceUrl,

      secondarySourceUrl: rawSecondarySourceUrl,

    });

  const material2 = normalizeMaterial(rawMaterial2);

  const material3 = normalizeMaterial(rawMaterial3);

  const shellConstruction = inferShellConstructionFromDocFields({

    companyName,

    lineSeries,

    modelName,

    shellConstruction: rawShellConstruction,

    material1,

    material2,

    material3,

    plyCountLayup: rawPlyCountLayup,

    scoringBasis: rawScoringBasis,

    notesMissingData: rawNotesMissingData,

    notesSummary: rawNotesSummary,

    primarySourceUrl: rawPrimarySourceUrl,

    secondarySourceUrl: rawSecondarySourceUrl,

  });

  const oberScores = {

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

    scoringBasis: cleanString(rawScoringBasis),

  };

  const isPublicVisible =

    hasCompleteScores(oberScores) && Boolean(material1) && Boolean(shellConstruction);

  const needsReview = !isPublicVisible;

  const doc = {

    companyName,

    companyType,

    lineSeries,

    modelName,

    drumType,

    diameter,

    depth,

    sizeKey,

    shellConstruction,

    shellMaterial1: material1,

    shellMaterial2: material2,

    shellMaterial3: material3,

    plyCountLayup: cleanString(rawPlyCountLayup),

    shellThicknessMm: toNumber(getValue(row, "SHELL THICKNESS (in mm)")),

    reinforcementRings: cleanString(getValue(row, "REINFORCEMENT RINGS")),

    bearingEdge: cleanString(getValue(row, "BEARING EDGE")),

    snareBedType: cleanString(getValue(row, "SNARE BED TYPE")),

    finishType: cleanString(getValue(row, "FINISH TYPE")),

    hoopRimType: cleanString(getValue(row, "HOOP/RIM TYPE")),

    lugCount: toNumber(getValue(row, "LUG COUNT")),

    lugType: cleanString(getValue(row, "LUG TYPE")),

    hardwareFinish: cleanString(getValue(row, "HARDWARE FINISH")),

    snareThrowMakeAndModel: cleanString(

      getValue(row, "SNARE THROW MAKE AND MODEL")

    ),

    stockSnareWires: cleanString(getValue(row, "STOCK SNARE WIRES")),

    stockBatterHead: cleanString(getValue(row, "STOCK BATTER HEAD")),

    stockResoHead: cleanString(getValue(row, "STOCK RESO HEAD")),

    shell: {

      construction: shellConstruction,

      material1,

      material2,

      material3,

      plyCountLayup: cleanString(rawPlyCountLayup),

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

    oberScores,

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

      primarySourceUrl: cleanString(rawPrimarySourceUrl),

      secondarySourceUrl: cleanString(rawSecondarySourceUrl),

      sourceConfidence: cleanString(getValue(row, "SOURCE CONFIDENCE")),

      imageUrl: cleanString(getValue(row, "IMG URL OF THE SPECIFIC DRUM")),

    },

    notes: {

      missingData: cleanString(rawNotesMissingData),

      summary: cleanString(rawNotesSummary),

    },

    public: {

      isVisible: isPublicVisible,

      needsReview,

      hasCompleteScores: hasCompleteScores(oberScores),

    },

    search: {

      companyKey: toKey(companyName),

      lineKey: toKey(lineSeries),

      modelKey: toKey(modelName),

      sizeKey,

      materialKeys: [material1, material2, material3].filter(Boolean).map(toKey),

      constructionKey: toKey(shellConstruction),

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

function inferScorchDepth(finishType, modelName) {

  const text = `${finishType || ""} ${modelName || ""}`.toLowerCase();

  if (text.includes("blackened")) return "Blackened";

  if (text.includes("medium scorch")) return "Medium Scorch";

  if (text.includes("light scorch")) return "Light Scorch";

  if (text.includes("scorch")) return "Scorched";

  return null;

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

function validateDoc(doc, rowIndex) {

  const issues = [];

  const warnings = [];

  if (!doc.companyName) issues.push("Missing companyName");

  if (!doc.modelName) issues.push("Missing modelName");

  if (!doc.lineSeries) issues.push("Missing lineSeries");

  if (doc.diameter === null) issues.push("Missing diameter");

  if (doc.depth === null) issues.push("Missing depth");

  SCORE_KEYS.forEach((key) => {

    const value = doc.oberScores?.[key];

    if (value === null || value === undefined) {

      issues.push(`Missing score: ${key}`);

    } else if (value < 1 || value > 10) {

      issues.push(`Score out of range: ${key}=${value}`);

    }

  });

  if (!doc.shell?.material1) {

    warnings.push("Missing shellMaterial1");

  }

  if (!doc.shell?.construction) {

    warnings.push("Missing shellConstruction");

  }

  if (

    doc.shell?.construction &&

    !VALID_SHELL_CONSTRUCTIONS.includes(doc.shell.construction)

  ) {

    warnings.push(`Non-standard shellConstruction: ${doc.shell.construction}`);

  }

  if (!doc.public?.isVisible) {

    warnings.push("Public visibility disabled because required data is incomplete");

  }

  return {

    rowIndex,

    issues,

    warnings,

    docPreview: {

      companyName: doc.companyName,

      lineSeries: doc.lineSeries,

      modelName: doc.modelName,

      sizeKey: doc.sizeKey,

      shellConstruction: doc.shell?.construction,

      shellMaterial1: doc.shell?.material1,

      shellMaterial2: doc.shell?.material2,

      shellMaterial3: doc.shell?.material3,

      hasCompleteScores: doc.public?.hasCompleteScores,

      isPublicVisible: doc.public?.isVisible,

      needsReview: doc.public?.needsReview,

    },

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

  const validationWarnings = [];

  const duplicateIds = new Map();

  let missingMaterials = 0;

  let missingConstruction = 0;

  let publicVisible = 0;

  let needsReview = 0;

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

    if (!doc.shell?.material1) missingMaterials += 1;

    if (!doc.shell?.construction) missingConstruction += 1;

    if (doc.public?.isVisible) publicVisible += 1;

    if (doc.public?.needsReview) needsReview += 1;

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

    if (validation.warnings.length) {

      validationWarnings.push(validation);

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

    validationWarnings,

    missingMaterials,

    missingConstruction,

    publicVisible,

    needsReview,

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

      rowsRead: masterReport.rowsRead + oberReport.rowsRead,

      docsPrepared: masterReport.docsPrepared + oberReport.docsPrepared,

      docsWritten: masterReport.docsWritten + oberReport.docsWritten,

      validationIssues:

        masterReport.validationIssues.length + oberReport.validationIssues.length,

      validationWarnings:

        masterReport.validationWarnings.length +

        oberReport.validationWarnings.length,

      missingMaterials:

        masterReport.missingMaterials + oberReport.missingMaterials,

      missingConstruction:

        masterReport.missingConstruction + oberReport.missingConstruction,

      publicVisible: masterReport.publicVisible + oberReport.publicVisible,

      needsReview: masterReport.needsReview + oberReport.needsReview,

      duplicates: masterReport.duplicateList.length + oberReport.duplicateList.length,

      skipped: masterReport.skipped.length + oberReport.skipped.length,

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

  console.log(`  Validation warning rows: ${report.totals.validationWarnings}`);

  console.log(`  Missing materials: ${report.totals.missingMaterials}`);

  console.log(`  Missing construction: ${report.totals.missingConstruction}`);

  console.log(`  Public visible: ${report.totals.publicVisible}`);

  console.log(`  Needs review: ${report.totals.needsReview}`);

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