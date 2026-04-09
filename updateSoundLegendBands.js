/**
 * Update SoundLegend Firestore docs with computed tuning ranges
 *
 * Usage:
 *   node updateSoundLegendBands.js SL-002           // dry run (single doc)
 *   node updateSoundLegendBands.js SL-002 --write   // update Firestore
 *   node updateSoundLegendBands.js --all            // dry run for all docs
 *   node updateSoundLegendBands.js --all --write    // update all docs
 */

const admin = require("firebase-admin");
const path = require("path");
const serviceAccount = require(path.resolve(__dirname, "serviceAccountKey.json"));

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

/* ---------------- Helpers ---------------- */

const PITCHES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

function hzToNote(hz) {
  if (!hz || hz <= 0) return "";
  const n = Math.round(12 * (Math.log2(hz / 440)));
  const midi = n + 69;
  const name = PITCHES[(midi % 12 + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}

function parseSize(sizeStr = "") {
  const m = sizeStr.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/i);
  return m
    ? { diameterIn: Number(m[1]), depthIn: Number(m[2]) }
    : { diameterIn: 14, depthIn: 5.5 };
}

function parseHzText(text = "") {
  const m = text && String(text).match(/(\d+(?:\.\d+)?)\s*hz/i);
  return m ? Number(m[1]) : null;
}

/** Prefer existing "200–220 Hz" type text in specs.legacyTuningNotes */
function parseLegacyHzRange(txt = "") {
  if (!txt) return null;
  const clean = String(txt).replace(/[–—]/g, "-");
  const m = clean.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/i);
  if (!m) return null;
  return { low: Number(m[1]), high: Number(m[2]) };
}

// 14" baseline multiplier to convert shell fund -> top-head “legacy center”
function ratioForDiameter(d = 14) {
  if (d >= 15) return 2.30;
  if (d >= 14.5) return 2.38;
  if (d >= 14) return 2.45;
  if (d >= 13) return 2.60;
  if (d >= 12) return 2.80;
  if (d >= 10) return 3.10;
  return 2.45;
}

/**
 * computeBands(specs, rootData)
 * - searches both root and specs for fields:
 *   - fundamental:  fundamentalHz / fundamentalPitch
 *   - shell fund:   shellFundHz / resonanceFundHz
 *   - size:         size "14x8"
 */
function computeBands(specs = {}, root = {}) {
  // size can be at root or specs; prefer specs
  const sizeStr = (specs.size || root.size || "").trim();
  const { diameterIn, depthIn } = parseSize(sizeStr);

  // explicit shell fund (prefer specs)
  let shellFundHz =
    Number(specs.shellFundHz) ||
    Number(specs.resonanceFundHz) ||
    Number(root.shellFundHz) ||
    Number(root.resonanceFundHz) ||
    null;

  // displayed fundamental (top-head or otherwise) – search both locations
  const displayedFundHz =
    Number(specs.fundamentalHz) ||
    parseHzText(specs.fundamentalPitch) ||
    Number(root.fundamentalHz) ||
    parseHzText(root.fundamentalPitch) ||
    null;

  // If no explicit shell fund but displayed fundamental looks like a low shell value on a 14",
  // treat it as shell fund (e.g., SL-002: 81.5 Hz E2).
  if (!shellFundHz && displayedFundHz && diameterIn >= 12 && displayedFundHz < 120) {
    shellFundHz = displayedFundHz;
  }

  let center = null;
  let used = "";

  if (shellFundHz) {
    // compute center from shell fund
    const k = ratioForDiameter(diameterIn);
    center = shellFundHz * k;
    const depthAdj = 1 - 0.01 * (depthIn - 5.5); // deeper => slightly lower center
    center *= depthAdj;
    used = `shellFundHz=${shellFundHz.toFixed(1)} via ratio ${k} & depthAdj ${depthAdj.toFixed(2)}`;
  } else if (displayedFundHz) {
    // fallback: use displayed fundamental directly
    center = displayedFundHz;
    used = `displayedFundHz=${displayedFundHz.toFixed(1)} (fallback)`;
  } else {
    return { ok: false, reason: "missing fundamental at both root/specs" };
  }

  // global bounds for 14"
  let lowestHz = 140;
  let highestHz = 320;

  // legacy window: ±10 Hz, then clamp & keep at least 15 Hz width
  let legacyLow = center - 10;
  let legacyHigh = center + 10;

  legacyLow = Math.max(lowestHz, Math.min(legacyLow, highestHz - 40));
  legacyHigh = Math.max(legacyLow + 15, Math.min(legacyHigh, highestHz));

  const legacyTuningNotes =
    `${Math.round(legacyLow)}–${Math.round(legacyHigh)} Hz (${hzToNote(legacyLow)}–${hzToNote(legacyHigh)})`;

  return {
    ok: true,
    debug: used,
    lowestHz,
    highestHz,
    legacyLowHz: Math.round(legacyLow),
    legacyHighHz: Math.round(legacyHigh),
    legacyTuningNotes,
    inferredShellFundHz: shellFundHz || null,
  };
}

function diffSpecs(oldSpecs = {}, proposed = {}) {
  const out = {};
  for (const k of Object.keys(proposed)) {
    if (JSON.stringify(oldSpecs[k]) !== JSON.stringify(proposed[k])) {
      out[k] = { from: oldSpecs[k], to: proposed[k] };
    }
  }
  return out;
}

async function processOne(serial, doWrite = false) {
  const ref = db.collection("soundlegend_showroom").doc(serial);
  const snap = await ref.get();
  if (!snap.exists) {
    console.error(`❌ No doc for ${serial}`);
    return;
  }

  const data = snap.data() || {};
  const specs = data.specs || {};
  const comp = computeBands(specs, data);

  if (!comp.ok) {
    console.error(`❌ ${serial}: could not compute bands (${comp.reason}).`);
    return;
  }

  // console.log(`ℹ️  ${serial} center source: ${comp.debug}`);

  // If Firestore already has a human-voiced "200–220 Hz" string, honor it
  const parsedLegacy = parseLegacyHzRange(specs.legacyTuningNotes);

  const proposed = { ...specs };

  // Prefer existing legacyTuningNotes for low/high if present; else use computed
  if (parsedLegacy) {
    if (!("legacyLowHz" in specs))  proposed.legacyLowHz  = Math.round(parsedLegacy.low);
    if (!("legacyHighHz" in specs)) proposed.legacyHighHz = Math.round(parsedLegacy.high);
  } else {
    if (!("legacyLowHz" in specs))  proposed.legacyLowHz  = comp.legacyLowHz;
    if (!("legacyHighHz" in specs)) proposed.legacyHighHz = comp.legacyHighHz;
  }

  // Bounds (only if missing)
  if (!("lowestHz" in specs))  proposed.lowestHz  = comp.lowestHz;
  if (!("highestHz" in specs)) proposed.highestHz = comp.highestHz;

  // Pretty notes (only if missing)
  if (!(specs.legacyTuningNotes || "").trim()) {
    proposed.legacyTuningNotes = comp.legacyTuningNotes;
  }

  // Backfill inferred shell fund if we computed it
  if (!("shellFundHz" in specs) && comp.inferredShellFundHz) {
    proposed.shellFundHz = comp.inferredShellFundHz;
  }

  const d = diffSpecs(specs, proposed);
  if (!Object.keys(d).length) {
    // console.log(`✅ ${serial}: already up to date`);
    return;
  }

  // console.log(`\n🔎 Proposed updates for ${serial}:`);
  console.table(
    Object.entries(d).map(([k, v]) => ({ field: k, from: v.from, to: v.to }))
  );

  if (!doWrite) {
    // console.log("DRY RUN (no write). Add --write to commit.");
    return;
  }

  await ref.update({ specs: proposed });
  // console.log(`✅ Wrote updates for ${serial}`);
}

async function processAll(doWrite = false) {
  const qs = await db.collection("soundlegend_showroom").get();
  if (qs.empty) {
    // console.log("No docs found in soundlegend_showroom.");
    return;
  }
  for (const doc of qs.docs) {
    await processOne(doc.id, doWrite);
  }
}

/* ---------------- Entry ---------------- */

const args = process.argv.slice(2);
const doAll = args.includes("--all");
const doWrite = args.includes("--write");

(async () => {
  if (doAll) {
    await processAll(doWrite);
  } else {
    const serial = args.find(a => !a.startsWith("--"));
    if (!serial) {
      console.error("❌ Usage: node updateSoundLegendBands.js <serial> [--write] | --all [--write]");
      process.exit(1);
    }
    await processOne(serial.toUpperCase(), doWrite);
  }
  process.exit(0);
})();