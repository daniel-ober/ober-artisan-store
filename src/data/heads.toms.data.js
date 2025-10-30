// Toms (rack + floor) head catalog — normalized to the same schema.

const VEND = (q) => ({
  "Sweetwater": `https://www.sweetwater.com/store/search.php?s=${encodeURIComponent(q)}`,
  "Guitar Center": `https://www.guitarcenter.com/Search/Default.aspx?Ntt=${encodeURIComponent(q)}`,
  "Amazon": `https://www.amazon.com/s?k=${encodeURIComponent(q)}`
});

// -------------------- BATTER (Top) --------------------
const BATTER = [
  /* ========== REMO ========== */
  { id:"REMO-AMB-CLR", brand:"Remo", model:"Ambassador Clear",
    ply:1, mil_total:10, finish:"Clear", dot:"None", control_ring:false, dry_vents:false,
    feel:"Open & bright", vibe:"Classic tom tone with long sustain",
    dryness:2, durability:3, tuningRange:"Wide",
    notes:"Great as batter or reso; bright attack and singing decay.",
    vendors: VEND("Remo Ambassador Clear tom 12 13 16")
  },
  { id:"REMO-AMB-COAT", brand:"Remo", model:"Ambassador Coated",
    ply:1, mil_total:10, finish:"Coated", dot:"None", control_ring:false, dry_vents:false,
    feel:"Open & warm", vibe:"Warmer top end; great stick feel",
    dryness:2, durability:3, tuningRange:"Wide",
    notes:"Coated single-ply for classic warmth and brushable texture.",
    vendors: VEND("Remo Ambassador Coated tom 12 13 16")
  },
  { id:"REMO-EMP-CLR", brand:"Remo", model:"Emperor Clear",
    ply:2, mil_total:14, finish:"Clear", dot:"None", control_ring:false, dry_vents:false,
    feel:"Punchy", vibe:"Controlled overtones, strong projection",
    dryness:3, durability:4, tuningRange:"Low–Mid",
    notes:"Live rock staple with focused, modern attack.",
    vendors: VEND("Remo Emperor Clear tom")
  },
  { id:"REMO-EMP-COAT", brand:"Remo", model:"Emperor Coated",
    ply:2, mil_total:14, finish:"Coated", dot:"None", control_ring:false, dry_vents:false,
    feel:"Fat & warm", vibe:"Controlled ring with rounder highs",
    dryness:3, durability:4, tuningRange:"Low–Mid",
    notes:"Great when you want thicker tone without choking the drum.",
    vendors: VEND("Remo Emperor Coated tom")
  },
  { id:"REMO-PINSTRIPE-CLR", brand:"Remo", model:"Pinstripe Clear",
    ply:2, mil_total:14, finish:"Clear", dot:"None", control_ring:"internal", dry_vents:false,
    feel:"Short & deep", vibe:"Very controlled decay; easy to tune ‘mix-ready’",
    dryness:4, durability:4, tuningRange:"Low",
    notes:"Built-in muffling makes them quick to dial on loud stages.",
    vendors: VEND("Remo Pinstripe Clear tom")
  },

  /* ========== EVANS ========== */
  { id:"EV-G1-CLR", brand:"Evans", model:"G1 Clear",
    ply:1, mil_total:10, finish:"Clear", dot:"None", control_ring:false, dry_vents:false,
    feel:"Open & lively", vibe:"Classic single-ply clarity",
    dryness:2, durability:3, tuningRange:"Wide",
    notes:"Great as batter or resonant; very versatile.",
    vendors: VEND("Evans G1 Clear tom")
  },
  { id:"EV-G2-CLR", brand:"Evans", model:"G2 Clear",
    ply:2, mil_total:14, finish:"Clear", dot:"None", control_ring:false, dry_vents:false,
    feel:"Controlled punch", vibe:"Modern focused tom sound",
    dryness:3, durability:4, tuningRange:"Low–Mid",
    notes:"Even sustain with reduced high overtones.",
    vendors: VEND("Evans G2 Clear tom")
  },
  { id:"EV-G2-COAT", brand:"Evans", model:"G2 Coated",
    ply:2, mil_total:14, finish:"Coated", dot:"None", control_ring:false, dry_vents:false,
    feel:"Fat & smooth", vibe:"Controlled with warmer attack",
    dryness:3, durability:4, tuningRange:"Low–Mid",
    notes:"Popular coated 2-ply for thick tom tone.",
    vendors: VEND("Evans G2 Coated tom")
  },
  { id:"EV-EC2-CLR", brand:"Evans", model:"EC2 SST Clear",
    ply:2, mil_total:14, finish:"Clear", dot:"None", control_ring:"internal", dry_vents:false,
    feel:"Pre-damped", vibe:"Shorter sustain; tight modern thump",
    dryness:4, durability:4, tuningRange:"Low",
    notes:"Built-in damping ring; very ‘finished’ sound.",
    vendors: VEND("Evans EC2 Clear tom")
  },
  { id:"EV-HYD-BLK", brand:"Evans", model:"Hydraulic Black",
    ply:2, mil_total:14, finish:"Hybrid", dot:"None", control_ring:false, dry_vents:false,
    feel:"Very soft & short", vibe:"Vintage-dead, 70s thud",
    dryness:5, durability:4, tuningRange:"Low",
    notes:"Oil-filled; dramatic overtone control for specific vibes.",
    vendors: VEND("Evans Hydraulic Black tom")
  },

  /* ========== AQUARIAN ========== */
  { id:"AQ-RESPONSE2-CLR", brand:"Aquarian", model:"Response 2 Clear",
    ply:2, mil_total:14, finish:"Clear", dot:"None", control_ring:false, dry_vents:false,
    feel:"Punchy & controlled", vibe:"Rock-friendly projection",
    dryness:3, durability:4, tuningRange:"Low–Mid",
    notes:"A classic 2-ply Aquarian choice for tom batters.",
    vendors: VEND("Aquarian Response 2 tom")
  },
  { id:"AQ-SUPER2-COAT", brand:"Aquarian", model:"Super 2 Coated",
    ply:2, mil_total:14, finish:"Coated", dot:"None", control_ring:false, dry_vents:false,
    feel:"Smooth & warm", vibe:"Controlled but still expressive",
    dryness:3, durability:4, tuningRange:"Low–Mid",
    notes:"Sits between single-ply openness and pin-drop control.",
    vendors: VEND("Aquarian Super 2 Coated tom")
  },
  { id:"AQ-STUDIOX", brand:"Aquarian", model:"Studio-X (internal ring)",
    ply:1, mil_total:10, finish:"Coated-Control", dot:"None", control_ring:"internal", dry_vents:false,
    feel:"Polished control", vibe:"Tamed top with clean decay",
    dryness:4, durability:4, tuningRange:"Mid",
    notes:"Great for quick dialed studio-style toms.",
    vendors: VEND("Aquarian Studio X tom")
  }
];

// -------------------- RESONANT (Bottom) --------------------
const RESO = [
  /* ========== REMO ========== */
  { id:"REMO-AMB-CLR-RESO", brand:"Remo", model:"Ambassador Clear (Reso)",
    ply:1, mil_total:10, finish:"Clear", sensitivity:4, durability:3, tuningRange:"Wide",
    notes:"Standard tom resonant—clear, responsive, tunes wide.",
    vendors: VEND("Remo Ambassador Clear tom resonant")
  },
  { id:"REMO-DIP-CLR-RESO", brand:"Remo", model:"Diplomat Clear (Reso)",
    ply:1, mil_total:7.5, finish:"Clear", sensitivity:5, durability:2, tuningRange:"Mid–High",
    notes:"Thinner reso for extra air and sustain.",
    vendors: VEND("Remo Diplomat Clear tom resonant")
  },

  /* ========== EVANS ========== */
  { id:"EV-G1-CLR-RESO", brand:"Evans", model:"G1 Clear (Reso)",
    ply:1, mil_total:10, finish:"Clear", sensitivity:4, durability:3, tuningRange:"Wide",
    notes:"Evans’ go-to tom reso.",
    vendors: VEND("Evans G1 Clear tom resonant")
  },

  /* ========== AQUARIAN ========== */
  { id:"AQ-CLASSIC-CLR-RESO", brand:"Aquarian", model:"Classic Clear (Reso)",
    ply:1, mil_total:10, finish:"Clear", sensitivity:4, durability:3, tuningRange:"Wide",
    notes:"Dependable tom resonant with strong fundamental.",
    vendors: VEND("Aquarian Classic Clear resonant")
  }
];

export const HEADS_TOMS = { batter: BATTER, reso: RESO };
export default HEADS_TOMS;