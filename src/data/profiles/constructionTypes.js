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
  },
];

export default constructionTypes;