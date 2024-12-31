const woodSpecies = [
  // Common Tonewoods
  {
    woodSpecies: ['Maple'],
    soundProfile: {
      attack: 8,      // Sharp attack due to dense nature.
      sustain: 7,     // Good sustain but decays quicker than mahogany.
      warmth: 6,      // Balanced warmth, more focused on attack.
      projection: 9,  // High projection, great for loud environments.
      brightness: 7,  // Balanced brightness, clear but not too harsh.
    },
  },
  {
    woodSpecies: ['Birch'],
    soundProfile: {
      attack: 7,      // Sharp but not as pronounced as maple.
      sustain: 6,     // Moderate sustain, decays quicker.
      warmth: 8,      // Warmer than maple, focused on the midrange.
      projection: 7,  // Moderate projection.
      brightness: 6,  // Slightly less bright than maple.
    },
  },
  {
    woodSpecies: ['Oak'],
    soundProfile: {
      attack: 6,      // More subdued attack due to density.
      sustain: 6,     // Moderate sustain, less long-lasting than maple.
      warmth: 7,      // Provides solid warmth in the sound.
      projection: 6,  // Less projection compared to maple or bubinga.
      brightness: 5,  // Subdued brightness, more mid-focused.
    },
  },
  {
    woodSpecies: ['Mahogany'],
    soundProfile: {
      attack: 6,      // Softer attack with a rounder tone.
      sustain: 9,     // Excellent sustain, notes last long.
      warmth: 9,      // Extremely warm, deep tonal quality.
      projection: 6,  // Moderate projection, more focused on tone depth.
      brightness: 4,  // Low brightness, perfect for darker sounds.
    },
  },
  {
    woodSpecies: ['Cherry'],
    soundProfile: {
      attack: 7,      // Balanced attack with clarity.
      sustain: 7,     // Good sustain.
      warmth: 8,      // Rich warmth but not as deep as mahogany.
      projection: 6,  // Moderate projection.
      brightness: 5,  // Subtle brightness, focused on warmth.
    },
  },

  // Less Common Tonewoods
  {
    woodSpecies: ['Acacia'],
    soundProfile: {
      attack: 7,      // Balanced attack, slightly sharper.
      sustain: 6,     // Moderate sustain.
      warmth: 6,      // Slightly warm but with more clarity.
      projection: 8,  // Good projection due to density.
      brightness: 7,  // Balanced brightness.
    },
  },
  {
    woodSpecies: ['Bubinga'],
    soundProfile: {
      attack: 8,      // Sharp attack, very defined.
      sustain: 8,     // Long sustain with resonance.
      warmth: 7,      // Warm but with a clear tone.
      projection: 9,  // Very high projection, great for larger spaces.
      brightness: 6,  // Balanced brightness, with more midrange.
    },
  },
  {
    woodSpecies: ['Zebrawood'],
    soundProfile: {
      attack: 6,      // Softer attack with a bit of punch.
      sustain: 7,     // Moderate sustain.
      warmth: 6,      // Slight warmth but more focused on midrange.
      projection: 8,  // Good projection, especially in higher frequencies.
      brightness: 9,  // Very bright and crisp sound.
    },
  },
  {
    woodSpecies: ['Padauk'],
    soundProfile: {
      attack: 7,      // Balanced attack with a slight punch.
      sustain: 6,     // Moderate sustain.
      warmth: 8,      // Rich warmth, perfect for a fuller sound.
      projection: 8,  // Good projection with clarity.
      brightness: 6,  // Balanced brightness with smooth mids.
    },
  },
  {
    woodSpecies: ['Sapele'],
    soundProfile: {
      attack: 7,      // Good attack, slightly rounded.
      sustain: 7,     // Decent sustain.
      warmth: 7,      // Balanced warmth.
      projection: 7,  // Moderate projection.
      brightness: 6,  // Balanced brightness.
    },
  },
  {
    woodSpecies: ['Cocobolo'],
    soundProfile: {
      attack: 8,      // Sharp, defined attack.
      sustain: 9,     // Very long sustain.
      warmth: 8,      // Warm with a rich low end.
      projection: 8,  // High projection, stands out.
      brightness: 7,  // Bright with good clarity in the highs.
    },
  },
  {
    woodSpecies: ['Kingwood'],
    soundProfile: {
      attack: 7,      // Balanced attack with definition.
      sustain: 6,     // Moderate sustain.
      warmth: 7,      // Warm, but still clear in the mids.
      projection: 8,  // Good projection with focus.
      brightness: 8,  // Bright, sharp sound.
    },
  },
  {
    woodSpecies: ['Macassar Ebony'],
    soundProfile: {
      attack: 7,      // Defined attack with clarity.
      sustain: 8,     // Excellent sustain.
      warmth: 9,      // Very warm, rich in lower frequencies.
      projection: 7,  // Moderate projection.
      brightness: 6,  // Balanced brightness with warmth.
    },
  },
  {
    woodSpecies: ['Cedar (Red Cedar)'],
    soundProfile: {
      attack: 6,      // Softer attack, smoother response.
      sustain: 7,     // Good sustain.
      warmth: 8,      // Warm, very present mids.
      projection: 6,  // Moderate projection.
      brightness: 5,  // Lower brightness, focusing on warmth.
    },
  },
  {
    woodSpecies: ['Purpleheart'],
    soundProfile: {
      attack: 8,      // Sharp, defined attack.
      sustain: 7,     // Moderate sustain.
      warmth: 7,      // Balanced warmth, good tonal depth.
      projection: 8,  // High projection.
      brightness: 8,  // Bright and crisp.
    },
  },
  {
    woodSpecies: ['Cedar (Western Red Cedar)'],
    soundProfile: {
      attack: 6,      // Softer attack, rounder.
      sustain: 7,     // Good sustain.
      warmth: 8,      // Deep warmth.
      projection: 6,  // Moderate projection.
      brightness: 5,  // Lower brightness.
    },
  },
  {
    woodSpecies: ['Wenge'],
    soundProfile: {
      attack: 7,      // Sharp attack, quick response.
      sustain: 9,     // Long sustain, clear ringing.
      warmth: 8,      // Rich, deep warmth.
      projection: 9,  // Very high projection, especially in the mids.
      brightness: 5,  // Less brightness, more midrange focused.
    },
  },
  {
    woodSpecies: ['Mango'],
    soundProfile: {
      attack: 7,      // Clear attack with a balanced punch.
      sustain: 8,     // Long sustain.
      warmth: 7,      // Balanced warmth.
      projection: 6,  // Moderate projection.
      brightness: 6,  // Balanced brightness.
    },
  },
  {
    woodSpecies: ['Pau Ferro'],
    soundProfile: {
      attack: 7,      // Clear and sharp attack.
      sustain: 7,     // Moderate sustain.
      warmth: 6,      // Balanced warmth with clarity.
      projection: 7,  // Moderate projection, good presence.
      brightness: 7,  // Balanced brightness, good clarity.
    },
  },
  {
    woodSpecies: ['Bubinga'],
    soundProfile: {
      attack: 8,      // Defined attack with clarity.
      sustain: 8,     // Excellent sustain.
      warmth: 7,      // Warmth with good tonal depth.
      projection: 9,  // Very high projection.
      brightness: 6,  // Balanced brightness.
    },
  },
  {
    woodSpecies: ['Myrtle'],
    soundProfile: {
      attack: 6,      // Softer attack, rounded sound.
      sustain: 7,     // Moderate sustain.
      warmth: 7,      // Warm with some clarity.
      projection: 7,  // Good projection, especially in the midrange.
      brightness: 6,  // Balanced brightness.
    },
  },
  {
    woodSpecies: ['Jatoba'],
    soundProfile: {
      attack: 7,      // Balanced attack.
      sustain: 8,     // Excellent sustain.
      warmth: 6,      // Balanced warmth with a bit of sharpness.
      projection: 8,  // Good projection, with clarity.
      brightness: 6,  // Balanced brightness.
    },
  },
];

export default woodSpecies;