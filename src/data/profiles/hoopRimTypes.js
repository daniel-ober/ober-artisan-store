const hoopRimTypes = [
  {
    hoopType: 'Die-Cast',
    soundProfile: {
      attack: 8,      // Sharp attack, due to the rigid nature of die-cast hoops providing a strong initial hit.
      sustain: 7,     // Moderate sustain, as the rigid hoop allows the drumhead to resonate with decent duration.
      warmth: 6,      // Balanced warmth, with a slightly brighter overall tone.
      projection: 8,  // High projection, because die-cast hoops are solid, enhancing the drum's ability to cut through.
      brightness: 7,  // Balanced brightness, not too harsh but still present, due to the dense material of the hoop.
    },
    frequencyResponse: {
      low: 0.70,      // Moderate low-end presence, not overly dominant.
      lowMid: 0.75,   // Well-defined low-mid frequencies, contributing to fullness and warmth.
      mid: 0.80,      // Strong mid-range frequencies, adding body and clarity to the sound.
      midHigh: 0.85,  // Clear high-mid frequencies, making the drum more defined.
      high: 0.90,     // Bright high frequencies, adding crispness to the attack and sustain.
    }
  },
  {
    hoopType: 'Triple-Flanged',
    soundProfile: {
      attack: 7,      // Slightly softer attack than die-cast, but still sharp, due to the more flexible hoop.
      sustain: 8,     // Good sustain, as triple-flanged hoops offer a balance of rigidity and flexibility.
      warmth: 7,      // Slightly warmer tone due to the hoop's more resonant material.
      projection: 7,  // Balanced projection, providing decent volume without being too overpowering.
      brightness: 6,  // Moderate brightness, with a focus on warmth over sharpness.
    },
    frequencyResponse: {
      low: 0.75,      // Slightly enhanced low-end response, more pronounced due to the hoop's flexibility.
      lowMid: 0.80,   // Strong low-mid frequencies, providing warmth and depth.
      mid: 0.75,      // Clear mid-range frequencies, well-balanced.
      midHigh: 0.70,  // Mild high-mids, not overly sharp but present for definition.
      high: 0.60,     // Soft high frequencies, adding subtle brightness without harshness.
    }
  },
  {
    hoopType: 'Wood Hoop',
    soundProfile: {
      attack: 6,      // Softer attack, as wood hoops provide a more mellow and rounded sound.
      sustain: 9,     // Very high sustain, as wood's natural resonance prolongs the sound.
      warmth: 9,      // Extremely warm tone, wood naturally promotes warmth, ideal for acoustic and mellow styles.
      projection: 6,  // Lower projection, suited for smaller environments or intimate settings.
      brightness: 5,  // Reduced brightness, focusing more on warmth and lower frequencies.
    },
    frequencyResponse: {
      low: 0.85,      // Strong low-end presence, as wood hoops accentuate the lower frequencies.
      lowMid: 0.90,   // Warm low-mid frequencies, giving the sound body and roundness.
      mid: 0.75,      // Full mid-range frequencies, contributing to the warmth.
      midHigh: 0.60,  // Reduced high-mids, creating a smoother, less harsh sound.
      high: 0.50,     // Soft high frequencies, providing a muted brightness.
    }
  },
  {
    hoopType: 'Cast Aluminum',
    soundProfile: {
      attack: 7,      // Balanced attack, slightly less sharp compared to die-cast but still defined.
      sustain: 6,     // Moderate sustain, as aluminum has less resonance compared to wood.
      warmth: 5,      // Slightly less warmth due to the more metallic nature of aluminum.
      projection: 8,  // High projection, as aluminum hoops help the sound cut through.
      brightness: 6,  // Balanced brightness, with some high-end presence but not overly sharp.
    },
    frequencyResponse: {
      low: 0.70,      // Moderate low-end presence, with a slight metallic edge.
      lowMid: 0.65,   // Controlled low-mid frequencies, providing a defined tone without excessive warmth.
      mid: 0.75,      // Strong mid-range frequencies that contribute to clarity and focus.
      midHigh: 0.80,  // Bright high-mids that enhance projection and definition.
      high: 0.85,     // Clear high frequencies, adding crispness and brightness to the tone.
    }
  },
  {
    hoopType: 'Flanged',
    soundProfile: {
      attack: 6,      // Softer attack due to the more flexible nature of flanged hoops.
      sustain: 7,     // Decent sustain, providing a balanced amount of resonance.
      warmth: 8,      // Warm tone, slightly more resonant than other hoop types, making it good for acoustic sounds.
      projection: 6,  // Moderate projection, suited for indoor environments or small spaces.
      brightness: 7,  // Balanced brightness, with enough presence without being piercing.
    },
    frequencyResponse: {
      low: 0.75,      // Moderate low-end response, giving warmth and fullness to the sound.
      lowMid: 0.80,   // Well-defined low-mid frequencies that provide body and depth.
      mid: 0.70,      // Smooth mid-range frequencies that contribute to the overall tone.
      midHigh: 0.65,  // Subtle high-mids that add clarity without too much sharpness.
      high: 0.55,     // Softer high frequencies, providing a smooth, mellow tone.
    }
  }
];

export default hoopRimTypes;