// woodSpecies.js

const woodSpecies = [
  {
    woodSpecies: ['Acacia'],
    soundProfile: {
      attack: 7,      // Balanced attack, slightly sharper.
      sustain: 6,     // Moderate sustain.
      warmth: 6,      // Slight warmth but with more clarity.
      projection: 8,  // Good projection due to density.
      brightness: 7,  // Balanced brightness.
    },
    frequencyResponse: {
      low: 0.55,      // Present low-end frequencies with a clear tone.
      lowMid: 0.60,   // Low-mids are resonant but not overpowering.
      mid: 0.65,      // Balanced mids, clear but not harsh.
      midHigh: 0.70,  // High mids are present for clarity and definition.
      high: 0.75,     // Bright, but not overly sharp.
    },
  },
  {
    woodSpecies: ['Ash'],
    soundProfile: {
      attack: 7,      // Strong attack with fast response.
      sustain: 6,     // Moderate sustain.
      warmth: 7,      // Warm and throaty sound.
      projection: 8,  // Excellent projection.
      brightness: 7,  // Balanced brightness.
    },
    frequencyResponse: {
      low: 0.65,      // Present low-end frequencies with a nice fullness.
      lowMid: 0.70,   // Low-mids provide warmth and body.
      mid: 0.75,      // Mids are clear and defined.
      midHigh: 0.80,  // High mids add presence and clarity.
      high: 0.85,     // Bright and defined highs.
    },
  },
  {
    woodSpecies: ['Beech'],
    soundProfile: {
      attack: 7,      // Focused and sensitive attack.
      sustain: 7,     // Good sustain.
      warmth: 7,      // Balanced warmth.
      projection: 8,  // Solid low-end punch.
      brightness: 7,  // Present mids and highs.
    },
    frequencyResponse: {
      low: 0.60,      // Slightly reduced low-end, emphasizing clarity.
      lowMid: 0.65,   // Low-mids add some warmth but keep it defined.
      mid: 0.70,      // Midrange is clear, with good tonal balance.
      midHigh: 0.75,  // High mids are crisp and clean.
      high: 0.80,     // High frequencies have a balanced brightness.
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
    frequencyResponse: {
      low: 0.70,      // Low-end is present with a slight warmth.
      lowMid: 0.75,   // Low-mids resonate well with midrange clarity.
      mid: 0.80,      // Mids are strong, giving the drum more body.
      midHigh: 0.75,  // High-mids are well-defined, not too sharp.
      high: 0.65,     // High frequencies are present but not piercing.
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
    frequencyResponse: {
      low: 0.80,      // Strong low-end presence with a warm foundation.
      lowMid: 0.85,   // Low-mids are pronounced, adding richness to the tone.
      mid: 0.80,      // Mids are clear, providing a good tonal balance.
      midHigh: 0.75,  // High mids give clarity without harshness.
      high: 0.70,     // High frequencies are clean but not too bright.
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
    frequencyResponse: {
      low: 0.75,      // Low-end is present, with a smooth, warm response.
      lowMid: 0.80,   // Low-mid frequencies are rich and resonant.
      mid: 0.75,      // Mids have good definition, contributing to the warm tone.
      midHigh: 0.70,  // High mids are slightly subdued, favoring warmth.
      high: 0.60,     // High frequencies are soft but still present.
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
    frequencyResponse: {
      low: 0.70,      // Low-end is solid but not overpowering.
      lowMid: 0.75,   // Low-mid frequencies resonate with a smooth tone.
      mid: 0.80,      // Midrange is full, with good presence.
      midHigh: 0.75,  // High mids are clear and not too harsh.
      high: 0.70,     // High frequencies are balanced but not overly bright.
    },
  },
  {
    woodSpecies: ['Kapur'],
    soundProfile: {
      attack: 7,      // Balanced attack.
      sustain: 7,     // Moderate sustain.
      warmth: 7,      // Warm tone.
      projection: 8,  // Good projection.
      brightness: 6,  // Slightly subdued brightness.
    },
    frequencyResponse: {
      low: 0.70,      // Low-end frequencies are well-defined.
      lowMid: 0.75,   // Low-mids add warmth and body.
      mid: 0.80,      // Mids are clear and present.
      midHigh: 0.75,  // High mids are defined without being too sharp.
      high: 0.70,     // High frequencies are present but not overly bright.
    },
  },
  {
    woodSpecies: ['Leopardwood'],
    soundProfile: {
      attack: 7,      // Balanced attack.
      sustain: 6,     // Moderate sustain.
      warmth: 7,      // Warm tone.
      projection: 7,  // Moderate projection.
      brightness: 7,  // Balanced brightness.
    },
    frequencyResponse: {
      low: 0.75,      // Low-end frequencies are rich and warm.
      lowMid: 0.80,   // Low-mids resonate well with warmth.
      mid: 0.75,      // Mids have good definition.
      midHigh: 0.80,  // High mids are clean and clear.
      high: 0.75,     // High frequencies are bright and present.
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
    frequencyResponse: {
      low: 0.85,      // Rich low-end with a full, warm presence.
      lowMid: 0.90,   // Low-mids are deep and resonant, adding body.
      mid: 0.80,      // Mids are present but smooth, with good warmth.
      midHigh: 0.60,  // High mids are softer, contributing to a round tone.
      high: 0.50,     // High frequencies are subdued, focusing on warmth.
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
    frequencyResponse: {
      low: 0.75,      // Low-end frequencies are balanced with warmth.
      lowMid: 0.80,   // Low-mids have solid resonance.
      mid: 0.80,      // Mids are clear and defined.
      midHigh: 0.75,  // High mids add clarity and definition.
      high: 0.70,     // High frequencies are crisp but not overpowering.
    },
  },
  {
    woodSpecies: ['Maple'],
    soundProfile: {
      attack: 8,      // Sharp attack due to dense nature.
      sustain: 7,     // Good sustain but decays quicker than mahogany.
      warmth: 6,      // Balanced warmth, more focused on attack.
      projection: 9,  // High projection, great for loud environments.
      brightness: 7,  // Balanced brightness, clear but not too harsh.
    },
    frequencyResponse: {
      low: 0.70,      // Low-end frequencies are clear but not as deep.
      lowMid: 0.75,   // Low-mids are well defined but not too pronounced.
      mid: 0.80,      // Mids are strong, offering clarity and balance.
      midHigh: 0.80,  // High mids add definition without sharpness.
      high: 0.85,     // Bright highs cut through but remain smooth.
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
    frequencyResponse: {
      low: 0.60,      // Reduced low-end response with more emphasis on mids.
      lowMid: 0.65,   // Low-mids provide a controlled, warm tone.
      mid: 0.70,      // Mids are present with good tonal balance.
      midHigh: 0.75,  // High mids are crisp, adding clarity.
      high: 0.60,     // High frequencies are more subdued.
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
    frequencyResponse: {
      low: 0.75,      // Low-end frequencies are present, with good warmth.
      lowMid: 0.80,   // Low-mids resonate well, giving depth.
      mid: 0.75,      // Mids are full, offering balance and clarity.
      midHigh: 0.70,  // High mids are well-defined but not harsh.
      high: 0.65,     // High frequencies are smooth, but not overly bright.
    },
  },
  {
    woodSpecies: ['Poplar'],
    soundProfile: {
      attack: 6,      // Mellow attack.
      sustain: 6,     // Moderate sustain.
      warmth: 7,      // Warm tone.
      projection: 6,  // Moderate projection.
      brightness: 6,  // Balanced brightness.
    },
    frequencyResponse: {
      low: 0.70,      // Low-end frequencies are mellow and warm.
      lowMid: 0.75,   // Low-mids add body but are not overwhelming.
      mid: 0.75,      // Mids are clear but not dominant.
      midHigh: 0.70,  // High-mids are soft, contributing to warmth.
      high: 0.65,     // High frequencies are mellow, with some presence.
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
    frequencyResponse: {
      low: 0.75,      // Strong low-end with defined presence.
      lowMid: 0.80,   // Low-mids resonate with clarity.
      mid: 0.80,      // Mids are present, providing full tone.
      midHigh: 0.85,  // High mids add brightness and clarity.
      high: 0.90,     // Crisp high frequencies, very clear and bright.
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
    frequencyResponse: {
      low: 0.70,      // Low-end frequencies are solid and present.
      lowMid: 0.75,   // Low-mids resonate well with warmth.
      mid: 0.75,      // Mids are present, with good tonal balance.
      midHigh: 0.75,  // High mids are present, offering clarity.
      high: 0.70,     // High frequencies are slightly subdued, focusing on warmth.
    },
  },
  {
    woodSpecies: ['Walnut'],
    soundProfile: {
      attack: 7,      // Rounded attack with moderate punch.
      sustain: 7,     // Balanced sustain.
      warmth: 8,      // Rich and warm tones.
      projection: 7,  // Good projection.
      brightness: 6,  // Slightly subdued brightness.
    },
    frequencyResponse: {
      low: 0.75,      // Warm low-end frequencies providing a deep tone.
      lowMid: 0.80,   // Low-mids resonate well, adding warmth.
      mid: 0.75,      // Mids are full, balanced with clarity.
      midHigh: 0.70,  // High mids are crisp but not piercing.
      high: 0.65,     // High frequencies are present but not overly bright.
    },
  },
];

export default woodSpecies;