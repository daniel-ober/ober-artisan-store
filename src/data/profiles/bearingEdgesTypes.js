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
  },
];

export default bearingEdgesTypes;