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
    frequencyResponse: {
      low: 0.75,    // Warm attack emphasizes the low-end frequencies.
      lowMid: 0.70, // Low-mid frequencies are emphasized, creating a smoother tone.
      mid: 0.60,    // Mid-range frequencies are present but softened.
      midHigh: 0.50,// High-mids are less pronounced, contributing to the warm sound.
      high: 0.35,   // Low brightness, high frequencies are subdued.
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
    frequencyResponse: {
      low: 0.60,    // Defined attack with less emphasis on the low-end.
      lowMid: 0.55, // Low-mid frequencies are more controlled, keeping the focus on attack.
      mid: 0.60,    // Clear mid-range with a bit of edge.
      midHigh: 0.75,// High-mids are prominent, contributing to the sharpness.
      high: 1.0,    // Very bright, sharp attack with a strong high-end presence.
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
    frequencyResponse: {
      low: 0.70,    // Balanced attack, with presence in the low-end.
      lowMid: 0.65, // Low-mid frequencies are well-defined but not overly sharp.
      mid: 0.65,    // Mid-range attack is clear and present.
      midHigh: 0.75,// High-mids are present but not overly harsh.
      high: 0.80,   // Bright, yet not as sharp as the clear drumhead.
    },
  },
];

export default drumheadTypes;