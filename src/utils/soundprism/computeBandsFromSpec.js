// Null-safe helpers and a minimal, stable band calculator used by the public showroom.
// If you keep your "secret sauce" on Cloud Functions, this remains a *display-only*
// fallback that produces reasonable ranges without exposing your full method.
// src/utils/soundprism/computeBandsFromSpec.js
function num(x, fb = null) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fb;
}

export function parseFundamentalHz(maybe) {
  if (typeof maybe === "number" && Number.isFinite(maybe)) return maybe;
  const s = String(maybe || "");
  // matches "110", "110.5", "110 Hz", "A2 (110 Hz)", etc.
  const m = s.match(/(\d+(?:\.\d+)?)\s*hz/i);
  return m ? num(m[1], null) : null;
}

export function parseSize(sizeStr, dfltDiameter = 14, dfltDepth = 6.5) {
  const s = String(sizeStr || "").toLowerCase();
  const m = s.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/);
  const diameterIn = m ? parseFloat(m[1]) : dfltDiameter;
  const depthIn    = m ? parseFloat(m[2]) : dfltDepth;
  return { diameterIn, depthIn };
}

// A safe, visible axis for the linear frequency ruler.
// You can tweak these without exposing proprietary bits.
export function makeAxis(fundHz, padLow = 0.6, padHigh = 5, tickHz = 10) {
  let lo = 40, hi = 500;  // decent defaults if fund is missing
  if (Number.isFinite(fundHz) && fundHz > 0) {
    lo = Math.max(20, Math.floor(fundHz * padLow));
    hi = Math.min(2000, Math.ceil(fundHz * padHigh));
  }
  // Ensure axis makes sense
  if (hi <= lo) {
    hi = lo + 200;
  }
  return { loHz: lo, hiHz: hi, tickHz: tickHz };
}

// *** This is a simple PUBLIC showroom calculator ***
// It’s intentionally conservative and NOT your Cloud Function logic.
// It derives presentable "bands" that won't crash when inputs are partial.
//
// Inputs can be a Firestore "specs" object or a custom object with:
// { size, fundamentalHz | fundamentalPitch }
export function computeBandsFromSpec(spec = {}) {
  const { diameterIn, depthIn } = parseSize(spec.size, 14, 6.5);
  const fundamentalHz =
    parseFundamentalHz(spec.fundamentalHz) ??
    parseFundamentalHz(spec.fundamentalPitch);

  // Axis for the ruler
  const axis = makeAxis(fundamentalHz);

  // If we have a fundamental, create simple sweet-spot bands around rough multiples.
  // This is *not* the proprietary model—just a UI-safe fallback.
  const bands = [];

  if (Number.isFinite(fundamentalHz) && fundamentalHz > 0) {
    // dial width scaled a bit by depth and hoop “feel”
    const depthFactor = Math.max(0.8, Math.min(1.3, depthIn / 6.5));
    const hoopTighten = String(spec.hoops || "").toLowerCase().includes("die")
      ? 0.9
      : 1.0;

    const widthPct = 0.11 * depthFactor * hoopTighten; // ~11% of center as half-width
    const mkBand = (id, label, centerHz, colorKey) => {
      const half = centerHz * widthPct;
      return {
        id,
        label,
        colorKey, // optional: UI can pick a color from a legend/palette
        loHz: Math.max(axis.loHz, centerHz - half),
        hiHz: Math.min(axis.hiHz, centerHz + half),
      };
    };

    // Low “fat” sweet spot (around ~1.6×–2.0× fundamental)
    bands.push(mkBand("low", "Low Sweet Spot", fundamentalHz * 1.8, "low"));

    // Legacy / “natural character” (around ~2.2×–2.6×)
    bands.push(mkBand("legacy", "LegacyPrint™", fundamentalHz * 2.4, "legacy"));

    // High “cutting” (around ~2.8×–3.2×)
    bands.push(mkBand("high", "High Sweet Spot", fundamentalHz * 3.0, "high"));
  }

  return {
    axis,                 // { loHz, hiHz, tickHz }
    diameterIn,
    depthIn,
    fundamentalHz: Number.isFinite(fundamentalHz) ? fundamentalHz : null,
    sweetSpots: bands,    // array of { id, label, loHz, hiHz, colorKey? }
  };
}