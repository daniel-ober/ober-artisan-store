// src/data/heads.snare.data.js
// Snare-only head catalog for the Ober Selector.
// Vendors helper + rich metadata so you can score intelligently.

const VEND = (q) => ({
  "Sweetwater": `https://www.sweetwater.com/store/search.php?s=${encodeURIComponent(q)}`,
  "Guitar Center": `https://www.guitarcenter.com/Search/Default.aspx?Ntt=${encodeURIComponent(q)}`,
  "Amazon": `https://www.amazon.com/s?k=${encodeURIComponent(q)}`
});

/**
 * Normalized fields (batter):
 * - id, brand, model
 * - ply: 1|2|hybrid
 * - mil_total: Number (approx overall film thickness, ignoring dot/ring)
 * - finish: "Coated" | "Clear" | "Coated-Dry" | "Textured" | "Hybrid" | "Coated-Black" | "Coated-Control"
 * - dot: "None" | "Top" | "Bottom" | "Center"
 * - control_ring: false | true | "internal" (internal muffling ring)
 * - dry_vents: boolean (vent holes around perimeter)
 * - feel: short descriptor
 * - vibe: tonal/usage description
 * - dryness: 1–5 (1=open, 5=very dry/controlled)
 * - durability: 1–5
 * - tuningRange: "Low" | "Low–Mid" | "Mid" | "Mid–High" | "Wide"
 * - notes
 * - vendors
 *
 * (reso):
 * - ply (always 1)
 * - mil_total: 2 | 3 | 5
 * - finish: "Hazy"
 * - sensitivity: 1–5 (snare wire response/airiness)
 * - durability: 1–5
 * - tuningRange
 */

// -------------------- BATTER (Top) --------------------
const BATTER = [
  /* ================= REMO ================= */
  // Open / sensitive
  { id:"REMO-AMB-COAT", brand:"Remo", model:"Ambassador Coated",
    ply:1, mil_total:10, finish:"Coated", dot:"None", control_ring:false, dry_vents:false,
    feel:"Lively, sticks speak", vibe:"Classic open snare sound with crisp fizz",
    dryness:2, durability:3, tuningRange:"Wide",
    notes:"The studio/jazz favorite; takes tuning and tuning changes well.",
    vendors: VEND("Remo Ambassador Coated snare 14")
  },

  { id:"REMO-DIP-COAT", brand:"Remo", model:"Diplomat Coated",
    ply:1, mil_total:7.5, finish:"Coated", dot:"None", control_ring:false, dry_vents:false,
    feel:"Ultra sensitive", vibe:"Feather touch ghost notes, higher overtones",
    dryness:1, durability:2, tuningRange:"Mid–High",
    notes:"For small rooms, brushes, delicate hands. Not for heavy hitters.",
    vendors: VEND("Remo Diplomat Coated snare 14")
  },

  // Controlled / fatter
  { id:"REMO-EMP-COAT", brand:"Remo", model:"Emperor Coated",
    ply:2, mil_total:14, finish:"Coated", dot:"None", control_ring:false, dry_vents:false,
    feel:"Thicker & forgiving", vibe:"Fat backbeat, tame ring",
    dryness:3, durability:4, tuningRange:"Low–Mid",
    notes:"Reliable for live pop/rock; adds weight without choking.",
    vendors: VEND("Remo Emperor Coated snare 14")
  },

  { id:"REMO-CS-BOT", brand:"Remo", model:"Controlled Sound (CS) – Bottom Dot",
    ply:1, mil_total:10, finish:"Coated", dot:"Bottom", control_ring:false, dry_vents:false,
    feel:"Center focus", vibe:"Extra durability/attack in the middle",
    dryness:3, durability:4, tuningRange:"Wide",
    notes:"Classic ‘CS’ feel—open edge, controlled center. Great all-rounder for drummers who dent heads.",
    vendors: VEND("Remo Controlled Sound Coated Bottom Dot snare 14")
  },

  { id:"REMO-CS-TOP", brand:"Remo", model:"Controlled Sound (CS) – Top Dot",
    ply:1, mil_total:10, finish:"Coated", dot:"Top", control_ring:false, dry_vents:false,
    feel:"Stick articulation", vibe:"More defined center attack; slightly drier than bottom dot",
    dryness:3, durability:4, tuningRange:"Mid–High",
    notes:"Top dot brightens stick and stands up to rimshots.",
    vendors: VEND("Remo Controlled Sound Coated Top Dot snare 14")
  },

  { id:"REMO-P77", brand:"Remo", model:"Powerstroke 77 Coated w/Control Dot",
    ply:2, mil_total:14, finish:"Coated-Control", dot:"Top", control_ring:"internal", dry_vents:false,
    feel:"Firm & focused", vibe:"Very controlled, short tail; studio dry",
    dryness:5, durability:5, tuningRange:"Low–Mid",
    notes:"If you fight ring, this gets you punchy ‘thwack’ fast.",
    vendors: VEND("Remo Powerstroke 77 snare 14")
  },

  { id:"REMO-PS3-COAT", brand:"Remo", model:"Powerstroke 3 Coated (Snare)",
    ply:1, mil_total:10, finish:"Coated", dot:"None", control_ring:"internal", dry_vents:false,
    feel:"Controlled open", vibe:"Slightly damped Ambassador feel",
    dryness:3, durability:3, tuningRange:"Wide",
    notes:"Subtle internal ring control without killing sensitivity.",
    vendors: VEND("Remo Powerstroke 3 Coated snare 14")
  },

  /* ================= EVANS ================= */
  // Open / sensitive
  { id:"EV-UV1", brand:"Evans", model:"UV1 Coated",
    ply:1, mil_total:10, finish:"Coated", dot:"None", control_ring:false, dry_vents:false,
    feel:"Consistent & lively", vibe:"Ambassador-like but with durable UV coating",
    dryness:2, durability:4, tuningRange:"Wide",
    notes:"UV coating resists chipping; great for brushes too.",
    vendors: VEND("Evans UV1 snare 14")
  },

  { id:"EV-G1-COAT", brand:"Evans", model:"G1 Coated",
    ply:1, mil_total:10, finish:"Coated", dot:"None", control_ring:false, dry_vents:false,
    feel:"Open classic", vibe:"Crisp, articulate, easy to tune",
    dryness:2, durability:3, tuningRange:"Wide",
    notes:"Evans’ take on the coated single-ply standard.",
    vendors: VEND("Evans G1 Coated snare 14")
  },

  // Controlled / fat
  { id:"EV-UV2", brand:"Evans", model:"UV2 Coated (2-ply)",
    ply:2, mil_total:14, finish:"Coated", dot:"None", control_ring:false, dry_vents:false,
    feel:"Smooth & stout", vibe:"Controlled, modern pop/rock",
    dryness:3, durability:5, tuningRange:"Low–Mid",
    notes:"Two-ply UV for durability without excessive deadness.",
    vendors: VEND("Evans UV2 snare 14")
  },

  { id:"EV-G2-COAT", brand:"Evans", model:"G2 Coated",
    ply:2, mil_total:14, finish:"Coated", dot:"None", control_ring:false, dry_vents:false,
    feel:"Fat & even", vibe:"Punchy, reduced overtones",
    dryness:3, durability:4, tuningRange:"Low–Mid",
    notes:"Live workhorse for louder gigs.",
    vendors: VEND("Evans G2 Coated snare 14")
  },

  // Dotted / Dry control
  { id:"EV-GENERA-DRY", brand:"Evans", model:"Genera Dry",
    ply:1, mil_total:10, finish:"Coated-Dry", dot:"Bottom", control_ring:"internal", dry_vents:true,
    feel:"Surgical control", vibe:"Short, studio dry with centered crack",
    dryness:5, durability:4, tuningRange:"Mid",
    notes:"Micro-vents + underside dot + control ring = minimal ring.",
    vendors: VEND("Evans Genera Dry snare 14")
  },

  { id:"EV-HD-DRY", brand:"Evans", model:"HD Dry",
    ply:2, mil_total:14, finish:"Coated-Dry", dot:"Bottom", control_ring:"internal", dry_vents:true,
    feel:"Firm, super-controlled", vibe:"Thick, punchy backbeat, little overtone",
    dryness:5, durability:5, tuningRange:"Low–Mid",
    notes:"‘Mix-ready’ live or studio when you want short and fat.",
    vendors: VEND("Evans HD Dry snare 14")
  },

  { id:"EV-ST-DRY", brand:"Evans", model:"ST Dry",
    ply:2, mil_total:14, finish:"Coated-Dry", dot:"Bottom", control_ring:false, dry_vents:true,
    feel:"Tight, loud rimshots", vibe:"Extra attack, short decay",
    dryness:5, durability:5, tuningRange:"Low–Mid",
    notes:"Great when you need controlled cut and rimshot authority.",
    vendors: VEND("Evans ST Dry snare 14")
  },

  { id:"EV-GENERA", brand:"Evans", model:"Genera (control ring)",
    ply:1, mil_total:10, finish:"Coated", dot:"Bottom", control_ring:"internal", dry_vents:false,
    feel:"Balanced control", vibe:"Open edge with focused center",
    dryness:4, durability:4, tuningRange:"Mid–High",
    notes:"Similar concept to Remo CS; built-in ring control.",
    vendors: VEND("Evans Genera snare 14")
  },

  /* ================= AQUARIAN ================= */
  { id:"AQ-TC", brand:"Aquarian", model:"Texture Coated",
    ply:1, mil_total:10, finish:"Textured", dot:"None", control_ring:false, dry_vents:false,
    feel:"Open & brush-friendly", vibe:"Classic warmth with durable Z-100 coating",
    dryness:2, durability:4, tuningRange:"Wide",
    notes:"Beloved for brush players; coating wears slowly.",
    vendors: VEND("Aquarian Texture Coated snare 14")
  },

  { id:"AQ-HI-VEL", brand:"Aquarian", model:"Hi-Velocity",
    ply:2, mil_total:14, finish:"Coated", dot:"Top", control_ring:false, dry_vents:false,
    feel:"Solid & focused", vibe:"Controlled punch with strong center",
    dryness:4, durability:5, tuningRange:"Low–Mid",
    notes:"Top dot gives attack and longevity; fat but articulate.",
    vendors: VEND("Aquarian Hi-Velocity snare 14")
  },

  { id:"AQ-FOCUS-X", brand:"Aquarian", model:"Focus-X (w/ vented control)",
    ply:1, mil_total:10, finish:"Coated-Control", dot:"Top", control_ring:"internal", dry_vents:true,
    feel:"Dry & quick", vibe:"Short tail, clean articulation",
    dryness:5, durability:4, tuningRange:"Mid",
    notes:"Internal control ring and vents kill lingering ring.",
    vendors: VEND("Aquarian Focus-X snare 14")
  },

  { id:"AQ-STUDIO-X", brand:"Aquarian", model:"Studio-X",
    ply:1, mil_total:10, finish:"Coated-Control", dot:"None", control_ring:"internal", dry_vents:false,
    feel:"Polished control", vibe:"Tamed highs while keeping sensitivity",
    dryness:4, durability:4, tuningRange:"Mid",
    notes:"Great for moderate damping without dots/vents.",
    vendors: VEND("Aquarian Studio-X snare 14")
  },

  { id:"AQ-TRIPLE-THREAT", brand:"Aquarian", model:"Triple Threat",
    ply:3, mil_total:21, finish:"Coated", dot:"None", control_ring:false, dry_vents:false,
    feel:"Beefy & ultra-durable", vibe:"Very controlled, loud rimshots",
    dryness:4, durability:5, tuningRange:"Low",
    notes:"Three ultra-thin plies; built like a tank for heavy hitters.",
    vendors: VEND("Aquarian Triple Threat snare 14")
  }
];

// -------------------- RESONANT (Bottom) --------------------
const RESO = [
  /* ================= REMO ================= */
  { id:"REMO-SS300", brand:"Remo", model:"Hazy Ambassador Snare Side 300",
    ply:1, mil_total:3, finish:"Hazy", sensitivity:5, durability:3, tuningRange:"Wide",
    notes:"Industry-standard 3mil snare side—crisp response and range.",
    vendors: VEND("Remo Hazy Ambassador Snare Side 300 14")
  },
  { id:"REMO-SS200", brand:"Remo", model:"Hazy Diplomat Snare Side 200",
    ply:1, mil_total:2, finish:"Hazy", sensitivity:5, durability:2, tuningRange:"Mid–High",
    notes:"Ultra-sensitive, airy; great for delicate snares and higher tunings.",
    vendors: VEND("Remo Snare Side 200 14")
  },
  { id:"REMO-SS500", brand:"Remo", model:"Hazy Emperor Snare Side 500",
    ply:1, mil_total:5, finish:"Hazy", sensitivity:3, durability:5, tuningRange:"Low–Mid",
    notes:"Thicker reso to tame buzz and add body; very robust.",
    vendors: VEND("Remo Snare Side 500 14")
  },

  /* ================= EVANS ================= */
  { id:"EV-HAZY-300", brand:"Evans", model:"Hazy 300",
    ply:1, mil_total:3, finish:"Hazy", sensitivity:5, durability:3, tuningRange:"Wide",
    notes:"Evans’ standard snare-side—fast, crisp wire response.",
    vendors: VEND("Evans Hazy 300 snare side 14")
  },
  { id:"EV-HAZY-200", brand:"Evans", model:"Hazy 200",
    ply:1, mil_total:2, finish:"Hazy", sensitivity:5, durability:2, tuningRange:"Mid–High",
    notes:"Great for delicate/dynamic snares and light buzz.",
    vendors: VEND("Evans Hazy 200 snare side 14")
  },
  { id:"EV-HAZY-500", brand:"Evans", model:"Hazy 500",
    ply:1, mil_total:5, finish:"Hazy", sensitivity:3, durability:5, tuningRange:"Low–Mid",
    notes:"Helps reduce sympathetic buzz and adds meat.",
    vendors: VEND("Evans Hazy 500 snare side 14")
  },

  /* ================= AQUARIAN ================= */
  { id:"AQ-SNARE-SIDE", brand:"Aquarian", model:"Snare Side",
    ply:1, mil_total:3, finish:"Hazy", sensitivity:5, durability:3, tuningRange:"Wide",
    notes:"Consistent 3mil reso—reliable pairing with Texture Coated or Hi-Velocity.",
    vendors: VEND("Aquarian Snare Side 14")
  }
];

// -------------------- QUICK CONSTANTS --------------------
export const HEADS_SNARE = { batter: BATTER, reso: RESO };

// Helpful facets if you want chips/filters
export const BRANDS_BATTER = [...new Set(BATTER.map(h => h.brand))];
export const BRANDS_RESO   = [...new Set(RESO.map(h => h.brand))];
export const FINISHES      = [...new Set(BATTER.map(h => h.finish))];
export const CATEGORIES    = [
  "Coated 1-ply (open)",
  "Coated 2-ply (controlled)",
  "Dotted / CS / Genera",
  "Dry / vented",
  "Control ring (internal)",
  "Hybrid / Specialty"
];

// Simple helper to bucket a batter head if you want category tags in UI
export function categoryForBatter(h) {
  if (h.ply === 1 && String(h.finish).startsWith("Coated") && !h.dot && !h.control_ring && !h.dry_vents) {
    return "Coated 1-ply (open)";
  }
  if (h.ply === 2) return "Coated 2-ply (controlled)";
  if (h.dot && !h.dry_vents) return "Dotted / CS / Genera";
  if (h.dry_vents) return "Dry / vented";
  if (h.control_ring) return "Control ring (internal)";
  if (h.finish === "Hybrid" || h.finish === "Textured") return "Hybrid / Specialty";
  return "Coated 1-ply (open)";
}

export default HEADS_SNARE;