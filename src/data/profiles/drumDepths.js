const drumDepths = [
  {
    depth: 5,
    soundProfile: {
      attack: 9,      // Sharper attack due to the shallower depth.
      sustain: 5,     // Shorter sustain due to quick decay.
      warmth: 4,      // Less warmth due to the shallow nature.
      projection: 8,  // Good projection, cuts through the sound well.
      brightness: 9,  // Very bright due to the shallower shell.
    },
  },
  {
    depth: 5.5,
    soundProfile: {
      attack: 8,      // Slightly reduced attack compared to a 5" depth.
      sustain: 5,     // Short sustain, still quite fast decay.
      warmth: 5,      // Balanced warmth.
      projection: 8,  // Solid projection, great for most settings.
      brightness: 8,  // Good brightness, but not too piercing.
    },
  },
  {
    depth: 6,
    soundProfile: {
      attack: 8,      // Balanced attack, clear and present.
      sustain: 6,     // Moderate sustain, good resonance.
      warmth: 6,      // Well-balanced warmth.
      projection: 8,  // Moderate projection, ideal for varied genres.
      brightness: 8,  // Good brightness, suitable for versatile applications.
    },
  },
  {
    depth: 6.5,
    soundProfile: {
      attack: 7,      // Softer attack due to the increased depth.
      sustain: 7,     // Longer sustain, more resonance.
      warmth: 7,      // Rich warmth, ideal for deeper tones.
      projection: 7,  // Balanced projection, suitable for most styles.
      brightness: 7,  // Balanced brightness, well-rounded sound.
    },
  },
  {
    depth: 7,
    soundProfile: {
      attack: 7,      // Softer attack, emphasizing resonance.
      sustain: 7,     // Good sustain, ideal for jazz or mellow styles.
      warmth: 8,      // Very warm tone, excellent for rich mid-range frequencies.
      projection: 7,  // Adequate projection, suitable for controlled environments.
      brightness: 7,  // Balanced brightness, neither too sharp nor too muted.
    },
  },
  {
    depth: 7.5,
    soundProfile: {
      attack: 7,      // More rounded attack due to the deeper depth.
      sustain: 8,     // Long sustain, making the tone richer and more resonant.
      warmth: 8,      // Deep warmth, providing richness to the sound.
      projection: 7,  // Good projection, ideal for medium to large spaces.
      brightness: 6,  // Slightly muted brightness, focusing more on low-mids.
    },
  },
  {
    depth: 8,
    soundProfile: {
      attack: 7,      // Softer attack, focusing more on the midrange.
      sustain: 8,     // Extended sustain, great for longer rhythms.
      warmth: 8,      // Very warm, especially suited for acoustic and mellow genres.
      projection: 6,  // Lower projection, suitable for small to medium settings.
      brightness: 6,  // Muted brightness, emphasizing the lower end of the spectrum.
    },
  },
  {
    depth: 9,
    soundProfile: {
      attack: 6,      // Softer attack, the deeper shell absorbs some of the initial hit.
      sustain: 9,     // High sustain, resonating for long periods.
      warmth: 9,      // Extremely warm, good for jazz or smooth genres.
      projection: 6,  // Moderate projection, not overly loud.
      brightness: 6,  // Soft brightness, focusing on low-mid frequencies.
    },
  },
  {
    depth: 10,
    soundProfile: {
      attack: 6,      // Softer attack, more focused on resonance than sharpness.
      sustain: 9,     // Very long sustain, great for slow rhythms.
      warmth: 9,      // Very warm, producing a smooth, full sound.
      projection: 5,  // Low projection, best for smaller environments.
      brightness: 5,  // Very muted brightness, focused more on tone.
    },
  },
  {
    depth: 11,
    soundProfile: {
      attack: 6,      // Softer attack, further reduced by depth.
      sustain: 9,     // High sustain, extends the tone.
      warmth: 9,      // Warmth is at its peak, ideal for slower, mellow tunes.
      projection: 5,  // Lower projection, creating a more intimate sound.
      brightness: 5,  // Very soft brightness, suitable for low-volume settings.
    },
  },
  {
    depth: 12,
    soundProfile: {
      attack: 6,      // Low attack, the deep shell absorbs much of the initial hit.
      sustain: 9,     // High sustain, producing a long-lasting tone.
      warmth: 9,      // Very warm tone, ideal for jazz or folk.
      projection: 5,  // Poor projection, better suited for smaller rooms or studios.
      brightness: 5,  // Muted brightness, focusing on rich mid and low tones.
    },
  },
  {
    depth: 13,
    soundProfile: {
      attack: 5,      // Very soft attack due to deep shell.
      sustain: 9,     // Extremely long sustain, resonating deeply.
      warmth: 9,      // High warmth, perfect for acoustic genres.
      projection: 4,  // Low projection, best for controlled environments.
      brightness: 4,  // Very low brightness, creating a very mellow sound.
    },
  },
  {
    depth: 14,
    soundProfile: {
      attack: 5,      // Very soft attack, focused on resonance.
      sustain: 10,    // Longest sustain, ideal for slow beats.
      warmth: 10,     // Maximum warmth, very full-bodied tone.
      projection: 4,  // Poor projection, perfect for small studios or recording.
      brightness: 4,  // Very low brightness, focuses purely on deep tones.
    },
  },
  {
    depth: 15,
    soundProfile: {
      attack: 4,      // Extremely soft attack, nearly no sharpness.
      sustain: 10,    // Very high sustain, ideal for creating thick tones.
      warmth: 10,     // Maximum warmth, the sound is rich and deep.
      projection: 3,  // Very low projection, better for close-mic setups.
      brightness: 3,  // Very low brightness, focusing on the low end.
    },
  },
  {
    depth: 16,
    soundProfile: {
      attack: 4,      // Very soft attack, due to the deep, thick shell.
      sustain: 10,    // Extremely long sustain.
      warmth: 10,     // High warmth, ideal for slow, resonant beats.
      projection: 3,  // Low projection, suited for very intimate environments.
      brightness: 3,  // Very low brightness, best for smooth, deep tones.
    },
  },
  {
    depth: 17,
    soundProfile: {
      attack: 3,      // Extremely soft attack, deep shell absorbs most of the sound.
      sustain: 10,    // Extremely long sustain.
      warmth: 10,     // Full warmth, very mellow and resonant.
      projection: 3,  // Low projection, ideal for very controlled settings.
      brightness: 3,  // Very muted, perfect for a smooth sound profile.
    },
  },
  {
    depth: 18,
    soundProfile: {
      attack: 3,      // Low attack, not much sharpness.
      sustain: 10,    // Very long sustain, creating a resonant atmosphere.
      warmth: 10,     // Extremely warm, perfect for slow, deep beats.
      projection: 2,  // Very low projection, best suited for studio use.
      brightness: 2,  // Extremely low brightness, focusing on low-end warmth.
    },
  },
];

export default drumDepths;