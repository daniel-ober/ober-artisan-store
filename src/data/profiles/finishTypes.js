const finishTypes = [
  {
    finish: 'Glossy',
    soundProfile: {
      attack: 7,      // Glossy finishes enhance attack slightly by providing a sharper, more defined sound.
      sustain: 6,     // Slightly increased sustain due to the more resonant surface.
      warmth: 6,      // Adds moderate warmth, balancing brightness and resonance.
      projection: 7,  // Slightly improves projection as glossy finishes help the sound resonate.
      brightness: 8,  // High brightness, glossy finishes enhance the higher frequencies.
    },
    frequencyResponse: {
      low: 0.60,      // Slight low-end presence due to more focused tone.
      lowMid: 0.65,   // Balanced low-mid frequencies with moderate warmth.
      mid: 0.70,      // Moderate mid-range frequencies contributing to clarity.
      midHigh: 0.80,  // Strong mid-high frequencies providing definition.
      high: 0.90,     // Bright high frequencies, adding crispness to the sound.
    }
  },
  {
    finish: 'Matte',
    soundProfile: {
      attack: 6,      // Softer attack, matte finishes reduce some of the sharpness.
      sustain: 7,     // Slightly better sustain than glossy, as matte finishes promote longer resonance.
      warmth: 8,      // Higher warmth, reducing some of the sharpness in the sound.
      projection: 6,  // Matte finishes have less projection compared to glossy ones.
      brightness: 5,  // Lower brightness, focusing more on warmth and resonance.
    },
    frequencyResponse: {
      low: 0.75,      // Good low-end presence due to increased warmth.
      lowMid: 0.80,   // Emphasis on low-mid frequencies, creating a fuller sound.
      mid: 0.70,      // Warm mid-range frequencies that are rounded and smooth.
      midHigh: 0.60,  // Reduced high-mid frequencies, focusing on warmth.
      high: 0.40,     // Mellow high frequencies, less brightness.
    }
  },
  {
    finish: 'Satin',
    soundProfile: {
      attack: 7,      // Balanced attack, similar to matte but with a bit more clarity.
      sustain: 6,     // Moderate sustain, suitable for a broad range of genres.
      warmth: 7,      // Moderate warmth, providing a more rounded sound than glossy or matte.
      projection: 6,  // Good projection, but not as sharp as glossy.
      brightness: 6,  // Balanced brightness, works well for general-purpose drumming.
    },
    frequencyResponse: {
      low: 0.70,      // Balanced low-end presence, not too pronounced.
      lowMid: 0.75,   // Balanced low-mid frequencies contributing to a natural tone.
      mid: 0.75,      // Well-rounded mid-range, clear and full.
      midHigh: 0.70,  // Moderately present high-mid frequencies.
      high: 0.60,     // Slightly muted high frequencies, but still present.
    }
  },
  {
    finish: 'High Gloss',
    soundProfile: {
      attack: 8,      // High gloss finishes provide a very clear, sharp attack.
      sustain: 6,     // Moderate sustain due to the reflective nature of the surface.
      warmth: 5,      // Lower warmth, more focused on bright and clear tones.
      projection: 8,  // High projection, as high gloss helps sound travel.
      brightness: 9,  // Very bright, perfect for styles needing a clear, cutting sound.
    },
    frequencyResponse: {
      low: 0.55,      // Less low-end presence, more focus on clarity.
      lowMid: 0.60,   // Moderate low-mid frequencies, allowing for clarity without warmth.
      mid: 0.70,      // Clear mid-range frequencies that enhance sharpness.
      midHigh: 0.85,  // Very bright high-mids contributing to clarity and definition.
      high: 1.0,      // Extremely bright, sharp and crisp high frequencies.
    }
  },
  {
    finish: 'Lacquered',
    soundProfile: {
      attack: 7,      // Balanced attack, somewhat between matte and glossy.
      sustain: 7,     // Slightly better sustain, promoting resonance.
      warmth: 6,      // Provides some warmth, but not as much as matte finishes.
      projection: 7,  // Good projection, as lacquer adds some resonant qualities.
      brightness: 7,  // Balanced brightness, neither too sharp nor too muted.
    },
    frequencyResponse: {
      low: 0.65,      // Slight low-end presence with a rounded sound.
      lowMid: 0.70,   // Moderate low-mid frequencies giving warmth.
      mid: 0.75,      // Clear mid-range frequencies, balanced and defined.
      midHigh: 0.75,  // Present high-mids with some definition.
      high: 0.70,     // Balanced high frequencies without excessive sharpness.
    }
  },
  {
    finish: 'Scorched/Toasted',
    soundProfile: {
      attack: 7,      // Softer attack due to the toasted finish.
      sustain: 8,     // Higher sustain, giving the drum a richer, longer resonance.
      warmth: 9,      // Very warm, emphasizing the low and mid frequencies.
      projection: 7,  // Good projection, but not as strong as glossy finishes.
      brightness: 4,  // Lower brightness, focusing more on warm tones.
    },
    frequencyResponse: {
      low: 0.85,      // Strong low-end presence, perfect for a warm sound.
      lowMid: 0.90,   // Very warm low-mid frequencies, providing a rich body.
      mid: 0.80,      // Smooth mid-range with warmth, creating a full tone.
      midHigh: 0.60,  // Reduced high-mid frequencies, adding to the warmth.
      high: 0.30,     // Very subdued high frequencies, focusing on low-end tones.
    }
  }
];

export default finishTypes;