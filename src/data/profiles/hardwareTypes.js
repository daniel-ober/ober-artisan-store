// hardwareTypes.js

const hardwareTypes = [
  {
    hardware: 'Standard Lugs',
    soundProfile: {
      attack: 6,      // Moderate attack, balanced response.
      sustain: 7,     // Good sustain, not too short or long.
      warmth: 6,      // Balanced warmth, neither too cold nor too warm.
      projection: 6,  // Moderate projection, neither too focused nor too spread out.
      brightness: 7,  // Slightly bright, providing clarity without sharpness.
    },
    frequencyResponse: {
      low: 0.60,      // Moderate low-end presence, providing fullness without excess.
      lowMid: 0.65,   // Balanced low-mid frequencies contributing to overall warmth.
      mid: 0.70,      // Clear mid-range frequencies for a natural tone.
      midHigh: 0.75,  // High-mids add some definition and brightness, enhancing presence.
      high: 0.80,     // Bright high frequencies, cutting through slightly for added clarity.
    }
  },
  {
    hardware: 'Heavy Duty Lugs',
    soundProfile: {
      attack: 8,      // Strong attack, giving a more defined sound.
      sustain: 8,     // High sustain, allowing the tone to last longer.
      warmth: 7,      // Slightly warm, adding depth but retaining clarity.
      projection: 8,  // High projection, ideal for loud environments.
      brightness: 6,  // Balanced brightness, not overly sharp.
    },
    frequencyResponse: {
      low: 0.75,      // Strong low-end presence due to increased sustain, adding depth.
      lowMid: 0.80,   // Low-mid frequencies resonate well, adding body to the sound.
      mid: 0.75,      // Solid mid-range frequencies that help with overall clarity and projection.
      midHigh: 0.70,  // High-mids are present but not overly harsh, adding definition.
      high: 0.60,     // Moderate brightness, maintaining clarity without sharpness or piercing.
    }
  },
  {
    hardware: 'Brass Lugs',
    soundProfile: {
      attack: 8,      // Strong and sharp attack, adding impact.
      sustain: 7,     // Moderate sustain, giving a clear and defined tone.
      warmth: 6,      // Slight warmth, focused more on clarity than tone depth.
      projection: 8,  // Excellent projection, ideal for live performances.
      brightness: 7,  // Slightly bright, enhancing the overall presence.
    },
    frequencyResponse: {
      low: 0.70,      // Balanced low-end, providing fullness with clarity.
      lowMid: 0.75,   // Slightly stronger low-mid frequencies for added warmth.
      mid: 0.75,      // Defined mid-range frequencies, enhancing projection and clarity.
      midHigh: 0.80,  // Present high-mids for clear definition without harshness.
      high: 0.85,     // Bright high frequencies with good presence, cutting through the mix.
    }
  }
];

export default hardwareTypes;