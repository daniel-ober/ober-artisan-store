// src/data/sticks.data.js
// Brand-diverse drumstick catalog for the Ober Stick Insight Tool.
// Adds grip metadata so "surface feel" can be scored.

const VEND = (q) => ({
  "Sweetwater": `https://www.sweetwater.com/store/search.php?s=${encodeURIComponent(q)}`,
  "Guitar Center": `https://www.guitarcenter.com/Search/Default.aspx?Ntt=${encodeURIComponent(q)}`,
  "Amazon": `https://www.amazon.com/s?k=${encodeURIComponent(q)}`
});

/**
 * Fields:
 * - id, brand, model
 * - material: "Hickory" | "Maple" | "Oak" | "Hickory FireGrain" | "Aluminum+Poly Sleeve" | "Red Hickory"
 * - tip: "Teardrop (Wood)" | "Teardrop (Nylon)" | "Acorn (Wood)" | "Oval (Wood)" | ...
 * - weight: "Light" | "Medium" | "Heavy"
 * - balance: "Front" | "Even" | "Rear"
 * - diameter: Number (inches)
 * - length: Number (inches)
 * - feel, tone, durability, notes
 * - grip: "Bare" | "Lacquer-Gloss" | "Lacquer-Matte" | "VicGrip" | "PureGrit" | "DoubleGlaze" | "ActiveGrip" | "DIP" | "VaterGrip" | "Rubber Sleeve"
 * - tack: 1–5 (approx hand tack / perceived grip, higher = tackier)
 */

const STICKS = [
  /* =========================
     VIC FIRTH — American Classic / X-Series / Signatures
     ========================= */
  { id:"VF-7A", brand:"Vic Firth", model:"7A", material:"Maple", tip:"Oval (Wood)", weight:"Light", balance:"Front",
    diameter:0.540, length:15.5, feel:"Fast, low fatigue", tone:"Open/airy", durability:"Medium",
    grip:"Bare", tack:1,
    notes:"Responsive and light—quiet rooms, finesse and long sets.", vendors: VEND("Vic Firth 7A") },

  { id:"VF-7AN", brand:"Vic Firth", model:"7A Nylon", material:"Hickory", tip:"Oval (Nylon)", weight:"Light", balance:"Front",
    diameter:0.540, length:15.5, feel:"Light but articulate", tone:"Bright/airy", durability:"High",
    grip:"Bare", tack:1,
    notes:"Quiet rooms with added ride/hat definition.", vendors: VEND("Vic Firth 7A Nylon") },

  { id:"VF-8D", brand:"Vic Firth", model:"8D", material:"Hickory", tip:"Small Round (Wood)", weight:"Light", balance:"Front",
    diameter:0.540, length:16.0, feel:"Longer 7A-ish", tone:"Light/defined", durability:"Medium",
    grip:"Bare", tack:1,
    notes:"Long reach with slim diameter; finesse plus articulation.", vendors: VEND("Vic Firth 8D") },

  { id:"VF-85A", brand:"Vic Firth", model:"85A", material:"Hickory", tip:"Tear (Wood)", weight:"Light", balance:"Even",
    diameter:0.555, length:16.0, feel:"Between 7A and 5A", tone:"Neutral", durability:"High",
    grip:"Bare", tack:1,
    notes:"Great for lower-volume live or studio finesse.", vendors: VEND("Vic Firth 85A") },

  { id:"VF-5A", brand:"Vic Firth", model:"5A", material:"Hickory", tip:"Teardrop (Wood)", weight:"Medium", balance:"Even",
    diameter:0.565, length:16.0, feel:"Versatile, balanced rebound", tone:"Medium/neutral", durability:"High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Industry standard all-rounder for studio/practice/live.", vendors: VEND("Vic Firth 5A") },

  { id:"VF-5AN", brand:"Vic Firth", model:"5A Nylon", material:"Hickory", tip:"Teardrop (Nylon)", weight:"Medium", balance:"Even",
    diameter:0.565, length:16.0, feel:"Balanced, brighter ride", tone:"Bright", durability:"High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Same 5A comfort with added cymbal ping/consistency.", vendors: VEND("Vic Firth 5A Nylon") },

  { id:"VF-55A", brand:"Vic Firth", model:"55A", material:"Hickory", tip:"Acorn (Wood)", weight:"Medium", balance:"Even",
    diameter:0.580, length:16.0, feel:"Slightly more mass than 5A", tone:"Slightly fuller", durability:"High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Bridge between 5A and 5B—extra punch without feeling heavy.", vendors: VEND("Vic Firth 55A") },

  { id:"VF-5B", brand:"Vic Firth", model:"5B", material:"Hickory", tip:"Oval (Wood)", weight:"Heavy", balance:"Rear",
    diameter:0.595, length:16.0, feel:"Solid, weighty stroke", tone:"Meaty/controlled", durability:"Very High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"For louder stages or firm feel with lower effort for volume.", vendors: VEND("Vic Firth 5B") },

  /* --- Vic Firth Grip variants --- */
  { id:"VF-5A-VG", brand:"Vic Firth", model:"5A VicGrip", material:"Hickory", tip:"Teardrop (Wood)", weight:"Medium", balance:"Even",
    diameter:0.565, length:16.0, feel:"5A with factory grip", tone:"Neutral", durability:"High",
    grip:"VicGrip", tack:4,
    notes:"Red tactile coating improves hold without bulk.", vendors: VEND("Vic Firth 5A VicGrip") },

  { id:"VF-5B-VG", brand:"Vic Firth", model:"5B VicGrip", material:"Hickory", tip:"Oval (Wood)", weight:"Heavy", balance:"Rear",
    diameter:0.595, length:16.0, feel:"5B with grip", tone:"Controlled", durability:"Very High",
    grip:"VicGrip", tack:4,
    notes:"Extra purchase for loud stages and sweaty hands.", vendors: VEND("Vic Firth 5B VicGrip") },

  { id:"VF-55A-VG", brand:"Vic Firth", model:"55A VicGrip", material:"Hickory", tip:"Acorn (Wood)", weight:"Medium", balance:"Even",
    diameter:0.580, length:16.0, feel:"55A with grip", tone:"Fuller 5A", durability:"High",
    grip:"VicGrip", tack:4,
    notes:"Great ‘more than 5A’ with a tacky feel.", vendors: VEND("Vic Firth 55A VicGrip") },

  /* --- Vic Firth surface finishes --- */
  { id:"VF-5A-DG", brand:"Vic Firth", model:"5A DoubleGlaze", material:"Hickory", tip:"Teardrop (Wood)", weight:"Medium", balance:"Even",
    diameter:0.565, length:16.0, feel:"Extra tack lacquer", tone:"Neutral", durability:"High",
    grip:"DoubleGlaze", tack:5,
    notes:"Double lacquer for maximum tack (classic ‘sticky’ feel).", vendors: VEND("Vic Firth 5A DoubleGlaze") },

  { id:"VF-5A-PG", brand:"Vic Firth", model:"5A PureGrit", material:"Hickory", tip:"Teardrop (Wood)", weight:"Medium", balance:"Even",
    diameter:0.565, length:16.0, feel:"Bare/sanded texture", tone:"Neutral", durability:"High",
    grip:"PureGrit", tack:3,
    notes:"No lacquer—lightly sanded for dry, matte grip.", vendors: VEND("Vic Firth 5A PureGrit") },

  /* X-Series */
  { id:"VF-X5A", brand:"Vic Firth", model:"Extreme 5A (X5A)", material:"Hickory", tip:"Tear (Wood)", weight:"Medium", balance:"Even",
    diameter:0.565, length:16.5, feel:"5A with extra reach", tone:"Neutral", durability:"High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Same diameter, more leverage.", vendors: VEND("Vic Firth X5A") },

  { id:"VF-X5B", brand:"Vic Firth", model:"Extreme 5B (X5B)", material:"Hickory", tip:"Oval (Wood)", weight:"Heavy", balance:"Rear",
    diameter:0.595, length:16.5, feel:"5B with extra reach", tone:"Strong", durability:"Very High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Extra projection without extra diameter.", vendors: VEND("Vic Firth X5B") },

  /* Signatures (unchanged grip unless noted) */
  { id:"VF-PE", brand:"Vic Firth", model:"Peter Erskine Ride", material:"Hickory", tip:"Small Tear (Wood)", weight:"Light", balance:"Front",
    diameter:0.525, length:16.0, feel:"Quick, cymbal articulate", tone:"Warm/defined ride", durability:"Medium",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Jazz club clarity at lower volumes.", vendors: VEND("Vic Firth Peter Erskine Ride Stick") },

  { id:"VF-VINNIE", brand:"Vic Firth", model:"Vinnie Colaiuta", material:"Hickory", tip:"Barrel (Wood)", weight:"Medium", balance:"Front",
    diameter:0.555, length:16.0, feel:"Quick & articulate", tone:"Clear/defined", durability:"High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Taper gives rebound without too much mass.", vendors: VEND("Vic Firth Vinnie Colaiuta sticks") },

  { id:"VF-BRICH", brand:"Vic Firth", model:"Buddy Rich", material:"Hickory", tip:"Barrel (Wood)", weight:"Heavy", balance:"Rear",
    diameter:0.590, length:16.25, feel:"Hefty swing", tone:"Full/round", durability:"Very High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Classic big-band power with definition.", vendors: VEND("Vic Firth Buddy Rich sticks") },

  { id:"VF-SJM", brand:"Vic Firth", model:"Jojo Mayer", material:"Hickory", tip:"Barrel (Wood)", weight:"Medium", balance:"Front",
    diameter:0.545, length:15.44, feel:"Agile, fast rebound", tone:"Defined", durability:"High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Designed for speed and finesse.", vendors: VEND("Vic Firth Jojo Mayer sticks") },

  /* =========================
     VATER — Classics / Fusion / Grip / Signatures
     ========================= */
  { id:"VTR-7A", brand:"Vater", model:"7A", material:"Hickory", tip:"Acorn (Wood)", weight:"Light", balance:"Front",
    diameter:0.540, length:15.5, feel:"Light & nimble", tone:"Warm/open", durability:"High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Compact rooms and finesse playing.", vendors: VEND("Vater 7A") },

  { id:"VTR-5A", brand:"Vater", model:"5A", material:"Hickory", tip:"Acorn (Wood)", weight:"Medium", balance:"Even",
    diameter:0.570, length:16.0, feel:"Classic all-purpose", tone:"Neutral", durability:"High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Slightly thicker take on the 5A family.", vendors: VEND("Vater 5A") },

  { id:"VTR-5AN", brand:"Vater", model:"5A Nylon", material:"Hickory", tip:"Acorn (Nylon)", weight:"Medium", balance:"Even",
    diameter:0.570, length:16.0, feel:"Balanced with bright cymbal ping", tone:"Bright", durability:"High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Extra ride definition and longevity.", vendors: VEND("Vater 5A Nylon") },

  { id:"VTR-55A", brand:"Vater", model:"55A", material:"Hickory", tip:"Acorn (Wood)", weight:"Medium", balance:"Even",
    diameter:0.580, length:16.0, feel:"Between 5A/5B", tone:"Neutral/full", durability:"High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Great ‘more-than-5A’ option.", vendors: VEND("Vater 55A") },

  { id:"VTR-5B", brand:"Vater", model:"5B", material:"Hickory", tip:"Acorn (Wood)", weight:"Heavy", balance:"Rear",
    diameter:0.600, length:16.0, feel:"Powerful", tone:"Controlled/solid", durability:"Very High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Rock stages, larger rooms.", vendors: VEND("Vater 5B") },

  { id:"VTR-FUS", brand:"Vater", model:"Fusion", material:"Hickory", tip:"Acorn (Wood)", weight:"Medium", balance:"Even",
    diameter:0.580, length:16.0, feel:"Tight 55A-ish control", tone:"Neutral", durability:"High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Great compromise for mixed gigs.", vendors: VEND("Vater Fusion sticks") },

  { id:"VTR-GOS", brand:"Vater", model:"GS-Fusion (Grip)", material:"Hickory", tip:"Acorn (Wood)", weight:"Medium", balance:"Even",
    diameter:0.580, length:16.0, feel:"Factory grip + control", tone:"Neutral", durability:"High",
    grip:"VaterGrip", tack:4,
    notes:"For sweaty stages without taping sticks.", vendors: VEND("Vater GS Fusion Grip") },

  { id:"VTR-5A-GRIP", brand:"Vater", model:"5A w/ Grip", material:"Hickory", tip:"Acorn (Wood)", weight:"Medium", balance:"Even",
    diameter:0.570, length:16.0, feel:"5A with tack", tone:"Neutral", durability:"High",
    grip:"VaterGrip", tack:4,
    notes:"Same profile as 5A but with tacky factory grip.", vendors: VEND("Vater 5A Grip") },

  { id:"VTR-SugarMaple-8A", brand:"Vater", model:"8A Sugar Maple", material:"Maple", tip:"Acorn (Wood)", weight:"Light", balance:"Front",
    diameter:0.555, length:16.0, feel:"Lighter 5A-ish", tone:"Warm/open", durability:"Medium",
    grip:"Bare", tack:1,
    notes:"Maple for fatigue-friendly practice.", vendors: VEND("Vater Sugar Maple 8A") },

  /* =========================
     PROMARK — Classic / Oak / Rebound & Forward / FireGrain / ActiveGrip / Signatures
     ========================= */
  { id:"PM-7A", brand:"ProMark", model:"7A", material:"Hickory", tip:"Acorn (Wood)", weight:"Light", balance:"Front",
    diameter:0.535, length:15.375, feel:"Light & quick", tone:"Warm", durability:"High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Great finesse stick in hickory.", vendors: VEND("ProMark 7A hickory") },

  { id:"PM-7A-OAK", brand:"ProMark", model:"7A Shira Kashi Oak", material:"Oak", tip:"Acorn (Wood)", weight:"Light", balance:"Front",
    diameter:0.535, length:15.375, feel:"Light but dense", tone:"Warm/focused", durability:"Very High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Oak density = longevity; still nimble.", vendors: VEND("ProMark 7A Shira Kashi Oak") },

  { id:"PM-5A", brand:"ProMark", model:"5A", material:"Hickory", tip:"Acorn (Wood)", weight:"Medium", balance:"Even",
    diameter:0.565, length:16.0, feel:"Classic 5A", tone:"Neutral", durability:"High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Do-it-all in ProMark flavor.", vendors: VEND("ProMark 5A hickory") },

  { id:"PM-5A-AG", brand:"ProMark", model:"5A ActiveGrip", material:"Hickory", tip:"Acorn (Wood)", weight:"Medium", balance:"Even",
    diameter:0.565, length:16.0, feel:"5A with heat-activated grip", tone:"Neutral", durability:"High",
    grip:"ActiveGrip", tack:4,
    notes:"Gets tackier as your hands warm up—no bulk.", vendors: VEND("ProMark 5A ActiveGrip") },

  { id:"PM-5AN", brand:"ProMark", model:"5A Nylon", material:"Hickory", tip:"Teardrop (Nylon)", weight:"Medium", balance:"Even",
    diameter:0.565, length:16.0, feel:"Balanced with bright definition", tone:"Bright", durability:"High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Extra ride articulation.", vendors: VEND("ProMark 5A Nylon") },

  { id:"PM-55A", brand:"ProMark", model:"55A", material:"Hickory", tip:"Acorn (Wood)", weight:"Medium", balance:"Even",
    diameter:0.580, length:16.0, feel:"Touch more heft than 5A", tone:"Fuller", durability:"High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Bridge size for mixed gigs.", vendors: VEND("ProMark 55A") },

  { id:"PM-5B", brand:"ProMark", model:"5B", material:"Hickory", tip:"Oval (Wood)", weight:"Heavy", balance:"Rear",
    diameter:0.595, length:16.0, feel:"Meaty/controlled", tone:"Strong", durability:"Very High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Louder venues, thicker backbeat.", vendors: VEND("ProMark 5B hickory") },

  /* Oak & FireGrain */
  { id:"PM-5A-OAK", brand:"ProMark", model:"5A Shira Kashi Oak", material:"Oak", tip:"Acorn (Wood)", weight:"Medium", balance:"Even",
    diameter:0.565, length:16.0, feel:"Dense & durable 5A", tone:"Neutral/strong", durability:"Very High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Oak longevity with classic feel.", vendors: VEND("ProMark 5A Shira Kashi Oak") },

  { id:"PM-FG-5A", brand:"ProMark", model:"FireGrain 5A", material:"Hickory FireGrain", tip:"Acorn (Wood)", weight:"Medium", balance:"Even",
    diameter:0.565, length:16.0, feel:"Classic 5A with toughness", tone:"Neutral", durability:"Very High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Tempered for longer life.", vendors: VEND("ProMark FireGrain 5A") },

  { id:"PM-FG-5A-AG", brand:"ProMark", model:"FireGrain 5A ActiveGrip", material:"Hickory FireGrain", tip:"Acorn (Wood)", weight:"Medium", balance:"Even",
    diameter:0.565, length:16.0, feel:"Durable + tack", tone:"Neutral", durability:"Very High",
    grip:"ActiveGrip", tack:4,
    notes:"FireGrain’s longevity with heat-activated grip.", vendors: VEND("ProMark FireGrain 5A ActiveGrip") },

  { id:"PM-RBD-5A", brand:"ProMark", model:"Rebound 5A", material:"Hickory", tip:"Acorn (Wood)", weight:"Medium", balance:"Front",
    diameter:0.565, length:16.0, feel:"Springy rebound", tone:"Neutral", durability:"High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Longer taper for quicker bounce and finesse.", vendors: VEND("ProMark Rebound 5A") },

  { id:"PM-FWD-5A", brand:"ProMark", model:"Forward 5A", material:"Hickory", tip:"Acorn (Wood)", weight:"Medium", balance:"Rear",
    diameter:0.565, length:16.0, feel:"Slightly back-weighted", tone:"Neutral", durability:"High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Built for power with familiar 5A feel.", vendors: VEND("ProMark Forward 5A") },

  { id:"PM-RBD-5B", brand:"ProMark", model:"Rebound 5B", material:"Hickory", tip:"Acorn (Wood)", weight:"Heavy", balance:"Front",
    diameter:0.595, length:16.0, feel:"Quick 5B response", tone:"Strong", durability:"Very High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"More bounce in a heavier family.", vendors: VEND("ProMark Rebound 5B") },

  { id:"PM-FWD-5B", brand:"ProMark", model:"Forward 5B", material:"Hickory", tip:"Acorn (Wood)", weight:"Heavy", balance:"Rear",
    diameter:0.595, length:16.0, feel:"Back-weight punch", tone:"Strong/controlled", durability:"Very High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Power without changing diameter.", vendors: VEND("ProMark Forward 5B") },

  /* Signatures + Mike Portnoy (wood & nylon) */
  { id:"PM-747", brand:"ProMark", model:"747 (Neil Peart)", material:"Hickory", tip:"Oval (Wood)", weight:"Medium", balance:"Rear",
    diameter:0.551, length:16.25, feel:"Longer reach, articulate", tone:"Focused", durability:"High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Precise, driving parts with added reach.", vendors: VEND("ProMark 747 Neil Peart") },

  { id:"PM-420", brand:"ProMark", model:"Mike Portnoy 420", material:"Hickory", tip:"Oval (Wood)", weight:"Medium", balance:"Even",
    diameter:0.565, length:16.5, feel:"Long-reach 5A family", tone:"Neutral/focused", durability:"High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Extra length for prog/rock facility without extra diameter.", vendors: VEND("ProMark Mike Portnoy 420") },

  { id:"PM-420N", brand:"ProMark", model:"Mike Portnoy 420N (Nylon)", material:"Hickory", tip:"Oval (Nylon)", weight:"Medium", balance:"Even",
    diameter:0.565, length:16.5, feel:"Long-reach, brighter ride", tone:"Bright/defined", durability:"High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Added articulation for complex ride patterns and big rooms.", vendors: VEND("ProMark Mike Portnoy 420N") },

  /* =========================
     ZILDJIAN — Classics / DIP / Rock / Signatures
     ========================= */
  { id:"Z-7A", brand:"Zildjian", model:"7A", material:"Hickory", tip:"Oval (Wood)", weight:"Light", balance:"Front",
    diameter:0.540, length:15.5, feel:"Light & nimble", tone:"Warm/open", durability:"Medium",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Compact rooms and finesse playing.", vendors: VEND("Zildjian 7A") },

  { id:"Z-5A", brand:"Zildjian", model:"5A", material:"Hickory", tip:"Teardrop (Wood)", weight:"Medium", balance:"Even",
    diameter:0.560, length:16.0, feel:"Do-it-all", tone:"Neutral", durability:"High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Classic Z family feel in the 5A lane.", vendors: VEND("Zildjian 5A") },

  { id:"Z-5A-DIP", brand:"Zildjian", model:"5A DIP", material:"Hickory", tip:"Teardrop (Wood)", weight:"Medium", balance:"Even",
    diameter:0.560, length:16.0, feel:"5A with tacky black dip", tone:"Neutral", durability:"High",
    grip:"DIP", tack:4,
    notes:"Rubbery dipped grip for extra hold.", vendors: VEND("Zildjian 5A DIP") },

  { id:"Z-5B", brand:"Zildjian", model:"5B", material:"Hickory", tip:"Oval (Wood)", weight:"Heavy", balance:"Rear",
    diameter:0.595, length:16.0, feel:"Meaty 5B", tone:"Strong", durability:"Very High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Rock-ready classic.", vendors: VEND("Zildjian 5B") },

  { id:"Z-5B-DIP", brand:"Zildjian", model:"5B DIP", material:"Hickory", tip:"Oval (Wood)", weight:"Heavy", balance:"Rear",
    diameter:0.595, length:16.0, feel:"5B with tack dip", tone:"Strong", durability:"Very High",
    grip:"DIP", tack:4,
    notes:"High-grip handle for aggressive sets.", vendors: VEND("Zildjian 5B DIP") },

  { id:"Z-ROCKN", brand:"Zildjian", model:"Rock (Nylon)", material:"Hickory", tip:"Barrel/Teardrop (Nylon)", weight:"Heavy", balance:"Rear",
    diameter:0.600, length:16.25, feel:"Powerful with ping", tone:"Bright/strong", durability:"Very High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Large stages, high volume, cutting cymbal definition.", vendors: VEND("Zildjian Rock Nylon") },

  { id:"Z-TB", brand:"Zildjian", model:"Travis Barker", material:"Hickory", tip:"Round (Wood)", weight:"Heavy", balance:"Rear",
    diameter:0.595, length:16.375, feel:"Long & strong", tone:"Focused/solid", durability:"Very High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"High-energy live performance.", vendors: VEND("Zildjian Travis Barker sticks") },

  /* =========================
     REGAL TIP — Lacquer feel
     ========================= */
  { id:"RT-5A", brand:"Regal Tip", model:"5A (Lacquer)", material:"Hickory", tip:"Teardrop (Wood)", weight:"Medium", balance:"Even",
    diameter:0.580, length:16.0, feel:"Grippy lacquer finish", tone:"Neutral", durability:"High",
    grip:"Lacquer-Gloss", tack:3,
    notes:"A classic feel with signature lacquer tack.", vendors: VEND("Regal Tip 5A") },

  { id:"RT-8A", brand:"Regal Tip", model:"8A (Lacquer)", material:"Hickory", tip:"Teardrop (Wood)", weight:"Light", balance:"Front",
    diameter:0.555, length:16.0, feel:"Slim & quick", tone:"Warm", durability:"High",
    grip:"Lacquer-Gloss", tack:3,
    notes:"Light touch with Regal Tip feel.", vendors: VEND("Regal Tip 8A") },

  /* =========================
     AHEAD — Aluminum core + sleeves (rubber feel)
     ========================= */
  { id:"AHD-5A", brand:"Ahead", model:"5A (Aluminum/Poly)", material:"Aluminum+Poly Sleeve", tip:"Nylon", weight:"Medium", balance:"Rear",
    diameter:0.565, length:16.0, feel:"Different flex, very durable", tone:"Bright/consistent", durability:"Very High",
    grip:"Rubber Sleeve", tack:4,
    notes:"Sleeved design for longevity; unique response.", vendors: VEND("Ahead 5A drumsticks") },

  { id:"AHD-LU", brand:"Ahead", model:"Lars Ulrich", material:"Aluminum+Poly Sleeve", tip:"Nylon", weight:"Heavy", balance:"Rear",
    diameter:0.595, length:16.25, feel:"Aggressive & loud", tone:"Bright/strong", durability:"Very High",
    grip:"Rubber Sleeve", tack:4,
    notes:"Signature metal performance feel.", vendors: VEND("Ahead Lars Ulrich sticks") },

  /* =========================
     MEINL STICK & BRUSH — Hybrid / Artist
     ========================= */
  { id:"MEINL-H-5A", brand:"Meinl Stick & Brush", model:"Hybrid 5A/5B", material:"Hickory", tip:"Hybrid (Wood)", weight:"Medium", balance:"Even",
    diameter:0.585, length:16.0, feel:"Sits between 5A/5B", tone:"Neutral/full", durability:"High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Modern profile aimed at versatility.", vendors: VEND("Meinl 5A 5B Hybrid Hickory drumsticks") },

  { id:"MEINL-AC-Balanced", brand:"Meinl Stick & Brush", model:"Acoustic Balanced 5A", material:"Hickory", tip:"Acorn (Wood)", weight:"Light", balance:"Front",
    diameter:0.565, length:16.0, feel:"Lighter balance for unplugged", tone:"Warm/open", durability:"High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Nuanced acoustic sets.", vendors: VEND("Meinl Acoustic Balanced 5A") },

  /* =========================
     ORCHESTRAL / EDUCATIONAL FAVORITES
     ========================= */
  { id:"VF-SD1", brand:"Vic Firth", model:"SD1 General", material:"Maple", tip:"Round (Wood)", weight:"Medium", balance:"Even",
    diameter:0.635, length:16.38, feel:"Big but light", tone:"Warm/round", durability:"Medium",
    grip:"Bare", tack:1,
    notes:"Great for practice pads and orchestral snare sensitivity.", vendors: VEND("Vic Firth SD1 General") },

  { id:"PM-MSD5", brand:"ProMark", model:"SD5 Swift (Maple)", material:"Maple", tip:"Small Round (Wood)", weight:"Light", balance:"Front",
    diameter:0.560, length:16.0, feel:"Agile & airy", tone:"Light/precise", durability:"Medium",
    grip:"Bare", tack:1,
    notes:"Maple rebound for lower fatigue.", vendors: VEND("ProMark SD5 Swift maple") },

  /* =========================
     HEAVY / MARCHING-LEANING
     ========================= */
  { id:"VF-2B", brand:"Vic Firth", model:"2B", material:"Hickory", tip:"Tear/Oval (Wood)", weight:"Heavy", balance:"Rear",
    diameter:0.630, length:16.25, feel:"Massive, marching-leaning heft", tone:"Focused/strong", durability:"Very High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"If you routinely play very loud or outdoors.", vendors: VEND("Vic Firth 2B") },

  { id:"PM-2BN", brand:"ProMark", model:"2B Nylon", material:"Hickory", tip:"Oval (Nylon)", weight:"Heavy", balance:"Rear",
    diameter:0.630, length:16.25, feel:"Mass + ping", tone:"Bright/strong", durability:"Very High",
    grip:"Lacquer-Gloss", tack:2,
    notes:"Big stages with extra articulation.", vendors: VEND("ProMark 2B Nylon") },
];

export default STICKS;