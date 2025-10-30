// Bass drum head catalog — normalized schema.

const VEND = (q) => ({
  "Sweetwater": `https://www.sweetwater.com/store/search.php?s=${encodeURIComponent(q)}`,
  "Guitar Center": `https://www.guitarcenter.com/Search/Default.aspx?Ntt=${encodeURIComponent(q)}`,
  "Amazon": `https://www.amazon.com/s?k=${encodeURIComponent(q)}`
});

// -------------------- BATTER (Beater side) --------------------
const BATTER = [
  /* ========== REMO ========== */
  { id:"REMO-PS3-COAT-BD", brand:"Remo", model:"Powerstroke 3 Coated (BD)",
    ply:1, mil_total:10, finish:"Coated", dot:"None", control_ring:"internal", dry_vents:false,
    feel:"Controlled open", vibe:"Classic ‘finished’ kick with some air",
    dryness:3, durability:4, tuningRange:"Wide",
    notes:"Subtle internal ring; works across genres.",
    vendors: VEND("Remo Powerstroke 3 Coated bass drum")
  },
  { id:"REMO-PS3-CLR-BD", brand:"Remo", model:"Powerstroke 3 Clear (BD)",
    ply:1, mil_total:10, finish:"Clear", dot:"None", control_ring:"internal", dry_vents:false,
    feel:"Punchy & bright", vibe:"More click/attack than coated PS3",
    dryness:3, durability:4, tuningRange:"Wide",
    notes:"Go-to live head with definition.",
    vendors: VEND("Remo Powerstroke 3 Clear bass drum")
  },
  { id:"REMO-P4-COAT-BD", brand:"Remo", model:"Powerstroke 4 Coated (BD)",
    ply:2, mil_total:14, finish:"Coated", dot:"None", control_ring:false, dry_vents:false,
    feel:"Solid & thick", vibe:"Lower, shorter sustain vs PS3",
    dryness:4, durability:5, tuningRange:"Low–Mid",
    notes:"Great for hard hitters needing extra control.",
    vendors: VEND("Remo Powerstroke 4 Coated bass drum")
  },
  { id:"REMO-PINSTRIPE-CLR-BD", brand:"Remo", model:"Pinstripe Clear (BD)",
    ply:2, mil_total:14, finish:"Clear", dot:"None", control_ring:"internal", dry_vents:false,
    feel:"Short & deep", vibe:"Pre-damped thump with fast decay",
    dryness:4, durability:4, tuningRange:"Low",
    notes:"Quick to dial for modern pop/rock.",
    vendors: VEND("Remo Pinstripe Clear bass drum")
  },

  /* ========== EVANS ========== */
  { id:"EV-EMAD", brand:"Evans", model:"EMAD (Single-ply + Extern. Damping)",
    ply:1, mil_total:10, finish:"Clear", dot:"None", control_ring:"internal", dry_vents:false,
    feel:"Tunable thump", vibe:"Swap damp rings for more/less control",
    dryness:4, durability:4, tuningRange:"Wide",
    notes:"Super flexible; easy to get ‘mix-ready’ thud.",
    vendors: VEND("Evans EMAD 22")
  },
  { id:"EV-EMAD2", brand:"Evans", model:"EMAD2 (2-ply + Extern. Damping)",
    ply:2, mil_total:14, finish:"Clear", dot:"None", control_ring:"internal", dry_vents:false,
    feel:"Very solid", vibe:"Lower, punchier and shorter than EMAD",
    dryness:5, durability:5, tuningRange:"Low–Mid",
    notes:"Touring staple for heavy music.",
    vendors: VEND("Evans EMAD2 22")
  },
  { id:"EV-GMAD", brand:"Evans", model:"GMAD (12mil single + EMAD ring)",
    ply:1, mil_total:12, finish:"Clear", dot:"None", control_ring:"internal", dry_vents:false,
    feel:"Firm rebound", vibe:"Between EMAD and EMAD2",
    dryness:4, durability:5, tuningRange:"Mid",
    notes:"Great when you want single-ply feel with more backbone.",
    vendors: VEND("Evans GMAD 22")
  },
  { id:"EV-EQ3-COAT", brand:"Evans", model:"EQ3 Coated (BD)",
    ply:1, mil_total:10, finish:"Coated", dot:"None", control_ring:"internal", dry_vents:false,
    feel:"Controlled open", vibe:"Natural attack with short tail",
    dryness:3, durability:4, tuningRange:"Wide",
    notes:"Classic alternative to PS3.",
    vendors: VEND("Evans EQ3 Coated bass drum")
  },

  /* ========== AQUARIAN ========== */
  { id:"AQ-SUPERKICK1", brand:"Aquarian", model:"Super-Kick I",
    ply:1, mil_total:10, finish:"Coated-Control", dot:"None", control_ring:"internal", dry_vents:false,
    feel:"Pillow-like", vibe:"Big focused thump with short decay",
    dryness:4, durability:4, tuningRange:"Low–Mid",
    notes:"Internal floating muffling—no pillow needed.",
    vendors: VEND("Aquarian Super Kick I 22")
  },
  { id:"AQ-SUPERKICK2", brand:"Aquarian", model:"Super-Kick II",
    ply:2, mil_total:14, finish:"Coated-Control", dot:"None", control_ring:"internal", dry_vents:false,
    feel:"Very controlled", vibe:"Lower, thicker thump",
    dryness:5, durability:5, tuningRange:"Low",
    notes:"Great for loud stages and consistency.",
    vendors: VEND("Aquarian Super Kick II 22")
  },
  { id:"AQ-FORCE1", brand:"Aquarian", model:"Force I (Coated)",
    ply:1, mil_total:10, finish:"Coated", dot:"None", control_ring:false, dry_vents:false,
    feel:"Open & musical", vibe:"More air than Super-Kick family",
    dryness:3, durability:4, tuningRange:"Wide",
    notes:"Good choice for less pre-damped feel.",
    vendors: VEND("Aquarian Force I bass drum")
  }
];

// -------------------- RESONANT (Front) --------------------
const RESO = [
  /* ========== REMO ========== */
  { id:"REMO-PS3-RESO", brand:"Remo", model:"Powerstroke 3 Resonant (BD)",
    ply:1, mil_total:10, finish:"Clear", sensitivity:3, durability:4, tuningRange:"Wide",
    notes:"Subtle internal ring keeps the front head tidy.",
    vendors: VEND("Remo Powerstroke 3 Resonant bass drum")
  },
  { id:"REMO-FIBERSKYN-RESO", brand:"Remo", model:"Fiberskyn PS3 Resonant (BD)",
    ply:1, mil_total:10, finish:"Textured", sensitivity:3, durability:3, tuningRange:"Mid",
    notes:"Classic vintage look with warm front head tone.",
    vendors: VEND("Remo Fiberskyn Powerstroke 3 Resonant bass drum")
  },

  /* ========== EVANS ========== */
  { id:"EV-EQ3-RESO-BLK", brand:"Evans", model:"EQ3 Resonant Black (BD)",
    ply:1, mil_total:10, finish:"Coated-Black", sensitivity:3, durability:4, tuningRange:"Wide",
    notes:"Popular modern reso; focused sustain and great look.",
    vendors: VEND("Evans EQ3 Resonant Black 22")
  },

  /* ========== AQUARIAN ========== */
  { id:"AQ-REGULATOR", brand:"Aquarian", model:"Regulator (Resonant, w/ optional port)",
    ply:1, mil_total:7.5, finish:"Coated-Black", sensitivity:3, durability:3, tuningRange:"Mid",
    notes:"Clean, quick front head. Available pre-ported.",
    vendors: VEND("Aquarian Regulator bass drum resonant")
  }
];

export const HEADS_BASS = { batter: BATTER, reso: RESO };
export default HEADS_BASS;