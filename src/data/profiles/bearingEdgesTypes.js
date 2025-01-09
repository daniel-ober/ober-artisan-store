const bearingEdgesTypes = [
  {
    bearingEdge: '45 Degree',
    soundProfile: {
      attack: 9,      // Sharp attack, defined sound.
      sustain: 6,     // Moderate sustain.
      warmth: 5,      // Low warmth, emphasizes brightness.
      projection: 9,  // High projection, cuts through noise.
      brightness: 8,  // Bright, sharp tones.
    },
    frequencyResponse: {
      low: 0.32,      // Low frequencies are slightly present, due to brightness.
      lowMid: 0.50,   // Moderate low-mid frequencies, giving some depth.
      mid: 0.72,      // Strong mid frequencies due to high attack and projection.
      midHigh: 0.85,  // Clear mid-high frequencies, adding sharpness.
      high: 0.91,     // Very bright and sharp high frequencies.
    },
  },
  {
    bearingEdge: 'Round Over',
    soundProfile: {
      attack: 6,      // Softer attack, more mellow sound.
      sustain: 8,     // High sustain, adds to resonance.
      warmth: 9,      // High warmth, ideal for mellow genres.
      projection: 7,  // Moderate projection.
      brightness: 5,  // Less bright, focused on warmth.
    },
    frequencyResponse: {
      low: 0.70,      // Strong low frequencies, supported by warmth.
      lowMid: 0.60,   // Present low-mid frequencies with good sustain.
      mid: 0.48,      // Warm midrange with a smoother tone.
      midHigh: 0.35,  // Subdued mid-high frequencies due to warmer tones.
      high: 0.20,     // Less bright, darker high frequencies.
    },
  },
  {
    bearingEdge: '30 Degree',
    soundProfile: {
      attack: 7,      // Balanced attack, not too sharp or soft.
      sustain: 7,     // Good sustain.
      warmth: 8,      // Warm sound, suitable for mellow genres.
      projection: 8,  // Good projection.
      brightness: 6,  // Balanced brightness.
    },
    frequencyResponse: {
      low: 0.52,      // Low frequencies balanced, with a bit of warmth.
      lowMid: 0.68,   // Moderate low-mid frequencies, providing good resonance.
      mid: 0.75,      // Clear mids, thanks to balanced sustain and projection.
      midHigh: 0.60,  // Well-controlled high mids for clarity.
      high: 0.50,     // Slightly bright high frequencies, without being too sharp.
    },
  },
  {
    bearingEdge: '60 Degree',
    soundProfile: {
      attack: 5,      // Softer attack, very warm.
      sustain: 8,     // High sustain, ideal for slower rhythms.
      warmth: 9,      // Very warm, suitable for jazz.
      projection: 6,  // Lower projection.
      brightness: 4,  // Very muted, good for controlled environments.
    },
    frequencyResponse: {
      low: 0.80,      // Strong low frequencies, ideal for warmth.
      lowMid: 0.85,   // High low-mid response, adds body and sustain.
      mid: 0.72,      // Warm mids with a smooth and full tone.
      midHigh: 0.55,  // Subdued mid-high range due to warm sound.
      high: 0.35,     // Muted highs, good for controlled environments.
    },
  },
  {
    bearingEdge: 'Sharp/Acute Angle',
    soundProfile: {
      attack: 10,     // Extremely sharp attack, very bright.
      sustain: 4,     // Low sustain, quick decay.
      warmth: 3,      // Low warmth, focused on high frequencies.
      projection: 10, // Very high projection, ideal for loud environments.
      brightness: 9,  // Very bright, cuts through noise.
    },
    frequencyResponse: {
      low: 0.18,      // Very little low frequency response due to sharpness.
      lowMid: 0.25,   // Minimal low-mid, focused on upper frequencies.
      mid: 0.75,      // Strong midrange frequencies, clear and sharp.
      midHigh: 0.90,  // Strong mid-high frequencies, sharp and cutting.
      high: 0.96,     // Very bright, prominent high frequencies.
    },
  },
];

export default bearingEdgesTypes;