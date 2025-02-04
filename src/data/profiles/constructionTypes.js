const constructionTypes = [
  {
    constructionType: 'Stave',
    soundProfile: {
      attack: 8,      // Strong attack, immediate response, but slightly softer than metal shells.
      sustain: 7,     // Good sustain, but not as resonant as steam-bent.
      warmth: 6,      // Moderate warmth, suitable for various genres.
      projection: 10, // Excellent projection, one of the loudest wooden shell types.
      brightness: 7,  // Balanced brightness, good for most styles.
    },
    frequencyResponse: {
      low: 0.52,      // Solid low-end, slightly less than steam bent.
      lowMid: 0.65,   // Strong low-mid frequencies, provides good resonance.
      mid: 0.80,      // Strong mids, giving the drum a defined tone.
      midHigh: 0.75,  // Balanced mid-highs, clear yet not too sharp.
      high: 0.60,     // Bright but not overly sharp highs.
    },
  },
  {
    constructionType: 'Steam Bent',
    soundProfile: {
      attack: 5,      // Softer attack, more rounded and warm.
      sustain: 9,     // Extremely long sustain due to minimal glue and seamless structure.
      warmth: 8,      // Warm sound, excellent for acoustic or jazz.
      projection: 7,  // Moderate projection, not as cutting as stave.
      brightness: 6,  // Balanced brightness, slightly warmer tone.
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
      attack: 8,      // Balanced attack, combining the punch of stave with the resonance of steam bent.
      sustain: 7,     // Good sustain, well-rounded resonance.
      warmth: 7,      // Balanced warmth, versatile sound.
      projection: 8,  // Strong projection, suitable for multiple genres.
      brightness: 7,  // Balanced brightness, adaptable for different playing styles.
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
      attack: 7,      // Balanced attack, slightly softer than stave.
      sustain: 6,     // Moderate sustain, less resonant due to multiple glued joints.
      warmth: 6,      // Balanced warmth, with a slightly drier tone.
      projection: 7,  // Good projection, slightly diffused due to segment construction.
      brightness: 7,  // Balanced brightness, works well in many situations.
    },
    frequencyResponse: {
      low: 0.50,      // Low frequencies present, but with slightly less depth than stave.
      lowMid: 0.60,   // Moderate low-mid frequencies providing some body.
      mid: 0.70,      // Clear mids with balanced tonal quality.
      midHigh: 0.65,  // Bright mids with controlled presence.
      high: 0.55,     // High frequencies are clear but not overly sharp.
    },
  },
  {
    constructionType: 'Solid',
    soundProfile: {
      attack: 8,      // Strong attack, solid structure allows for precise energy transfer.
      sustain: 10,    // Maximum sustain, purest resonance of all construction types.
      warmth: 9,      // Extremely warm sound, smoothest in terms of tonal balance.
      projection: 6,  // Lower projection, more suited for small settings or studio use.
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