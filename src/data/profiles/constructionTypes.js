const constructionTypes = [
  {
    constructionType: 'Stave',
    soundProfile: {
      attack: 9,      // High attack due to solid wood pieces.
      sustain: 7,     // Good sustain, but not as resonant as steam-bent.
      warmth: 6,      // Moderate warmth, suitable for various genres.
      projection: 9,  // Excellent projection, ideal for loud environments.
      brightness: 7,  // Balanced brightness, good for most styles.
    },
    frequencyResponse: {
      low: 0.52,      // Solid lows, slightly less than steam bent.
      lowMid: 0.65,   // Strong low-mid frequencies, provides good resonance.
      mid: 0.80,      // Strong mids, giving the drum a defined tone.
      midHigh: 0.75,  // Balanced mid-highs, clear yet not too sharp.
      high: 0.60,     // Bright but not overly sharp highs.
    },
  },
  {
    constructionType: 'Steam Bent',
    soundProfile: {
      attack: 6,      // Softer attack, more rounded tone.
      sustain: 8,     // Long sustain, ideal for softer genres.
      warmth: 8,      // Warm sound, excellent for acoustic or jazz.
      projection: 7,  // Moderate projection, not as cutting as stave.
      brightness: 6,  // Balanced brightness, warmer tone.
    },
    frequencyResponse: {
      low: 0.60,      // Strong low frequencies, with plenty of warmth.
      lowMid: 0.75,   // Warm low-mid frequencies, providing depth.
      mid: 0.70,      // Warm mids, smooth sound profile.
      midHigh: 0.50,  // Softer mid-high frequencies, contributing to the rounded tone.
      high: 0.45,     // Muted highs, warmer and smoother sound.
    },
  },
  {
    constructionType: 'Hybrid',
    soundProfile: {
      attack: 7,      // Balanced attack, between stave and steam-bent.
      sustain: 7,     // Good sustain, well-rounded resonance.
      warmth: 7,      // Balanced warmth, versatile sound.
      projection: 7,  // Good projection, works for various settings.
      brightness: 7,  // Balanced brightness, good for general use.
    },
    frequencyResponse: {
      low: 0.55,      // Solid low-end, balanced with warmth and resonance.
      lowMid: 0.65,   // Strong low-mid, providing punch and depth.
      mid: 0.75,      // Balanced midrange, clear and well-rounded.
      midHigh: 0.70,  // Smooth mid-highs, adding some clarity.
      high: 0.65,     // Bright but controlled highs, providing definition.
    },
  },
  {
    constructionType: 'Segmented',
    soundProfile: {
      attack: 7,      // Balanced attack, slightly reduced punch.
      sustain: 6,     // Moderate sustain, suitable for controlled sound.
      warmth: 6,      // Balanced warmth, but less resonant than stave.
      projection: 8,  // Good projection for the segmented structure.
      brightness: 7,  // Balanced brightness.
    },
    frequencyResponse: {
      low: 0.50,      // Low frequencies present, but with less depth.
      lowMid: 0.60,   // Moderate low-mid frequencies providing some body.
      mid: 0.70,      // Clear mids with balanced tonal quality.
      midHigh: 0.65,  // Bright mids with controlled presence.
      high: 0.55,     // High frequencies are clear but not overly sharp.
    },
  },
  {
    constructionType: 'Solid',
    soundProfile: {
      attack: 8,      // Excellent attack, solid construction enhances punch.
      sustain: 9,     // Very good sustain, creates a resonant tone.
      warmth: 9,      // Extremely warm sound, perfect for jazz.
      projection: 7,  // Lower projection, good for smaller spaces.
      brightness: 6,  // Lower brightness, focusing on warmth and low-mid tones.
    },
    frequencyResponse: {
      low: 0.75,      // Strong low-end with good warmth and resonance.
      lowMid: 0.80,   // Warm low-mid frequencies that add depth.
      mid: 0.70,      // Smooth midrange, good for jazz and mellow tones.
      midHigh: 0.55,  // Soft mid-high frequencies, smooth and balanced.
      high: 0.40,     // Muted highs, focusing on warmth and body.
    },
  },
];

export default constructionTypes;