const shellThickness = [
  {
    thickness: '4mm',
    soundProfile: {
      attack: 5,      // Softer attack, less mass for quick energy absorption.
      sustain: 9,     // Long sustain due to thinner shell resonance.
      warmth: 9,      // High warmth, focuses on lower frequencies.
      projection: 5,  // Lower projection, sound disperses quickly.
      brightness: 7,  // Bright overtones, resonant highs.
    },
  },
  {
    thickness: '5mm',
    soundProfile: {
      attack: 7,      // Moderate attack, good balance of energy transfer.
      sustain: 8,     // Slightly shorter sustain compared to 4mm.
      warmth: 8,      // Balanced warmth, retains lower frequency focus.
      projection: 6,  // Moderate projection, not as powerful as thicker shells.
      brightness: 8,  // Crisp and clear highs.
    },
  },
  {
    thickness: '6mm',
    soundProfile: {
      attack: 8,      // Stronger attack with enhanced projection.
      sustain: 7,     // Moderate sustain, more controlled decay.
      warmth: 8,      // Retains warmth but introduces more clarity.
      projection: 7,  // Good projection, excellent for live settings.
      brightness: 7,  // Balanced brightness, not overly sharp.
    },
  },
  {
    thickness: '7mm',
    soundProfile: {
      attack: 9,      // Powerful attack with strong presence.
      sustain: 7,     // Moderate sustain, more focus on projection.
      warmth: 8,      // Retains warmth but slightly reduced compared to thinner shells.
      projection: 8,  // High projection, capable of cutting through mixes.
      brightness: 6,  // Slightly reduced brightness, favoring mid frequencies.
    },
  },
  {
    thickness: '8mm',
    soundProfile: {
      attack: 10,     // Maximum attack, immediate and punchy.
      sustain: 6,     // Short sustain, with sound decaying faster.
      warmth: 7,      // Warmth present but slightly diminished.
      projection: 9,  // Excellent projection, designed for high-energy performance.
      brightness: 5,  // Reduced brightness, focusing on mid-lows.
    },
  },
  {
    thickness: '9mm',
    soundProfile: {
      attack: 10,     // Extreme attack, highly percussive.
      sustain: 5,     // Minimal sustain, very focused.
      warmth: 6,      // Warmth present but less than thinner shells.
      projection: 9,  // Very high projection, loud and cutting.
      brightness: 4,  // Darker tone, less high-end presence.
    },
  },
  {
    thickness: '10mm',
    soundProfile: {
      attack: 10,     // Immediate attack, direct and aggressive.
      sustain: 5,     // Limited sustain, designed for short bursts.
      warmth: 6,      // Midrange warmth, but not overly resonant.
      projection: 9,  // Powerful projection, ideal for loud settings.
      brightness: 4,  // Less bright, more focused on low-mids.
    },
  },
  {
    thickness: '12mm',
    soundProfile: {
      attack: 10,     // Extremely sharp attack, fast response.
      sustain: 4,     // Minimal sustain, very dry sound.
      warmth: 5,      // Reduced warmth, favoring direct tones.
      projection: 10, // Maximum projection, highly pronounced.
      brightness: 4,  // Low brightness, with more body focus.
    },
  },
  {
    thickness: '15mm',
    soundProfile: {
      attack: 10,     // Intense attack, cuts through aggressively.
      sustain: 3,     // Very short sustain, sound decays almost instantly.
      warmth: 4,      // Reduced warmth, with more emphasis on attack.
      projection: 10, // Extreme projection, very loud and cutting.
      brightness: 3,  // Darker tone with very little high-end shimmer.
    },
  },
  {
    thickness: '20mm',
    soundProfile: {
      attack: 10,     // Explosive attack, percussive and loud.
      sustain: 2,     // Minimal sustain, very dry and dead tone.
      warmth: 3,      // Reduced warmth, minimal low-end response.
      projection: 10, // Overwhelming projection, designed for extreme settings.
      brightness: 3,  // Minimal brightness, very low-end heavy.
    },
  },
  {
    thickness: '25mm',
    soundProfile: {
      attack: 10,     // Maximum attack, highly aggressive and punchy.
      sustain: 1,     // No sustain, extremely dry sound.
      warmth: 3,      // Minimal warmth, little resonance.
      projection: 10, // Extreme projection, best for highly percussive setups.
      brightness: 2,  // Dark and low-frequency dominant.
    },
  },
];

export default shellThickness;