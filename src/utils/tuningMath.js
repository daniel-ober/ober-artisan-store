// Null-safe helpers + a *public* showroom fallback for tuning bands.
// This WON'T expose your secret-sauce; it just makes the UI robust.

function num(x, fb = null) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fb;
}

function parseFundamentalHz(maybe) {
  if (typeof maybe === "number" && Number.isFinite(maybe)) return maybe;
  const s = String(maybe || "");
  // matches: "110", "110.5", "110 Hz", "A2 (110 Hz)"
  const m = s.match(/(\d+(?:\.\d+)?)\s*hz/i);
  return m ? num(m[1], null) : null;
}

function parseSize(sizeStr, dfltDiameter = 14, dfltDepth = 6.5) {
  const s = String(sizeStr || "").toLowerCase();
  const m = s.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/);
  const diameterIn = m ? parseFloat(m[1]) : dfltDiameter;
  const depthIn    = m ? parseFloat(m[2]) : dfltDepth;
  return { diameterIn, depthIn };
}

// Public/UI axis helper (kept simple by design)
function makeAxis(fundHz, padLow = 0.6, padHigh = 5, tickHz = 10) {
  let lo = 40, hi = 500;
  if (Number.isFinite(fundHz) && fundHz > 0) {
    lo = Math.max(20, Math.floor(fundHz * padLow));
    hi = Math.min(2000, Math.ceil(fundHz * padHigh));
  }
  if (hi <= lo) hi = lo + 200;
  return { loHz: lo, hiHz: hi, tickHz };
}

/**
 * computeBandsFromSpec(specs?, drumData?)
 *
 * Safe, presentation-only result for your showroom.
 * Returns fields your page already expects:
 *  - legacyLowHz, legacyHighHz
 *  - lowestHz, highestHz
 *  - centerHz            (the harmonic center we display)
 *  - shellFundHz         (echo of the base fundamental, if present)
 *  - legacyTuningNotes   (pass-through if you want to surface text later)
 *
 * It will NEVER throw if specs/drumData are missing or partial.
 */
export function computeBandsFromSpec(specs = {}, drumData = {}) {
  // ---- Parse inputs defensively
  const s = specs || {};
  const sizeObj = parseSize(s.size, 14, 6.5);
  const diameterIn = sizeObj.diameterIn;
  const depthIn    = sizeObj.depthIn;

  // Prefer explicit Hz, then text like "A2 (110 Hz)"
  const explicitFund =
    num(s.fundamentalHz) ??
    parseFundamentalHz(s.fundamentalPitch) ??
    null;

  // Optionally pick up “shellFundHz” if you’re saving it separately some day
  const shellFundHz = num(s.shellFundHz) ?? explicitFund;

  // Axis (not used by this page, but harmless to include)
  const axis = makeAxis(shellFundHz);

  // If we have a fundamental, generate a reasonable "legacy" window around ~2.4×
  // Width scales lightly with depth and hoop type; this is *not* the secret model.
  let legacyLowHz = null;
  let legacyHighHz = null;
  let centerHz = null;

  if (Number.isFinite(shellFundHz) && shellFundHz > 0) {
    const depthFactor = Math.max(0.8, Math.min(1.3, depthIn / 6.5));
    const hoopTighten = String(s.hoops || "").toLowerCase().includes("die")
      ? 0.9
      : 1.0;

    centerHz = shellFundHz * 2.4;         // where the drum tends to “bloom”
    const halfWidth = centerHz * 0.11 * depthFactor * hoopTighten; // ~11% window

    legacyLowHz  = Math.max(axis.loHz, centerHz - halfWidth);
    legacyHighHz = Math.min(axis.hiHz, centerHz + halfWidth);
  }

  // Boundaries the UI shows around the legacy band. Use spec overrides if present.
  let lowestHz  = num(s.lowestHz);
  let highestHz = num(s.highestHz);

  if (!Number.isFinite(lowestHz)) {
    if (Number.isFinite(legacyLowHz)) lowestHz = Math.max(140, legacyLowHz - 60);
    else lowestHz = 150; // safe floor
  }
  if (!Number.isFinite(highestHz)) {
    if (Number.isFinite(legacyHighHz)) highestHz = Math.min(320, legacyHighHz + 100);
    else highestHz = 350; // safe ceiling
  }

  // Text pass-through (if you want it later)
  const legacyTuningNotes = String(s.legacyTuningNotes || drumData?.legacyTuningNotes || "").trim();

  return {
    diameterIn,
    depthIn,
    axis,

    // what LegacyTuning expects / your page uses:
    legacyLowHz,
    legacyHighHz,
    lowestHz,
    highestHz,
    centerHz,
    shellFundHz,
    legacyTuningNotes,
  };
}