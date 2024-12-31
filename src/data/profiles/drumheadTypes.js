const drumheadTypes = [
  {
    drumhead: 'Coated',
    soundProfile: {
      attack: 8,      // Warm attack, great for jazz and acoustic.
      sustain: 7,     // Slight sustain, not overpowering.
      warmth: 9,      // High warmth, ideal for mellow tones.
      projection: 6,  // Moderate projection, suited for controlled environments.
      brightness: 5,  // Less bright, more focused on warmth.
    },
  },
  {
    drumhead: 'Clear',
    soundProfile: {
      attack: 9,      // Bright and sharp attack, ideal for rock.
      sustain: 6,     // Moderate sustain.
      warmth: 5,      // Slightly less warmth.
      projection: 7,  // Good projection.
      brightness: 7,  // Higher brightness, cuts through more.
    },
  },
  {
    drumhead: 'Mesh',
    soundProfile: {
      attack: 3,      // Very muted attack, great for silent practice.
      sustain: 2,     // Very low sustain, primarily used for practice.
      warmth: 4,      // Low warmth.
      projection: 2,  // Very low projection.
      brightness: 3,  // Low brightness.
    },
  },
  {
    drumhead: 'Hybrid (Coated + Clear)',
    soundProfile: {
      attack: 8,      // Balanced attack, between clear and coated.
      sustain: 7,     // Good sustain, suitable for many genres.
      warmth: 7,      // Moderate warmth, versatile for different sounds.
      projection: 8,  // Good projection.
      brightness: 6,  // Balanced brightness.
    },
  },
];

export default drumheadTypes;