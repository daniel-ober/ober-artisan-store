const drumheadTensions = [
  {
    tension: 'Low',
    soundProfile: {
      attack: 5,  // Softer attack, low tension allows for more flexibility leading to a gentler attack
      sustain: 9, // Long sustain, low tension heads allow for more resonance and longer vibrations
      warmth: 10, // Very warm and deep, low tension heads generally promote more low-frequency resonance
      projection: 8, // Good projection but not as sharp, low tension creates more resonance but less sharpness
      brightness: 4, // Lower brightness, as low tension emphasizes more low-end frequencies
    },
    frequencyResponse: {
      low: 0.85,    // Softer attack emphasizes lower frequencies.
      lowMid: 0.72, // Balanced low-mid, allows for smooth resonance.
      mid: 0.58,    // Mid-range frequencies are not overly harsh, warm.
      midHigh: 0.44,// Less emphasis on high-mids, more focused on low-end.
      high: 0.33,   // Reduced brightness, more of a smooth tone overall.
    },
  },
  {
    tension: 'Medium',
    soundProfile: {
      attack: 7,  // Balanced attack, medium tension offers a good mix of sharpness and softness
      sustain: 7, // Medium sustain, balancing resonance with controlled decay
      warmth: 7,  // Moderate warmth, medium tension heads balance warmth and clarity
      projection: 7, // Balanced projection, medium tension allows for clear, strong projection without being overly sharp
      brightness: 7, // Balanced brightness, medium tension retains enough high-frequency clarity without becoming overly bright
    },
    frequencyResponse: {
      low: 0.78,    // Attack is balanced, with emphasis on both low and mid frequencies.
      lowMid: 0.73, // Even tone throughout the low-mid range.
      mid: 0.68,    // Mid frequencies stay well-defined, not too harsh.
      midHigh: 0.57,// High-mids start to show but are not sharp.
      high: 0.47,   // Balanced brightness, not too bright or too soft.
    },
  },
  {
    tension: 'High',
    soundProfile: {
      attack: 10, // Sharp attack, high tension gives quick, defined attack due to less flexibility
      sustain: 5, // Shorter sustain, high tension heads are stiffer and reduce the resonance and sustain
      warmth: 5,  // Less warmth, high tension reduces low-frequency resonance, making the tone less warm
      projection: 6, // Slightly less projection, though it retains good definition, it sacrifices some resonance for focus
      brightness: 10, // Very bright and crisp, high tension emphasizes higher frequencies for a sharp, bright tone
    },
    frequencyResponse: {
      low: 0.60,    // Less pronounced low frequencies due to sharp attack.
      lowMid: 0.45, // Low-mid frequencies are controlled, emphasizing clarity.
      mid: 0.30,    // Mid-range frequencies are slightly cut for sharper attack.
      midHigh: 0.60,// High-mids have more presence with defined sharpness.
      high: 1.0,    // Very bright, with sharp high frequencies.
    },
  },
];

export default drumheadTensions;