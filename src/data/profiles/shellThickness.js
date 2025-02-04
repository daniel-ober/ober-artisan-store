// shellThickness.js

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
      frequencyResponse: {
        low: 0.70,      // Present low-end frequencies with a focus on warmth.
        lowMid: 0.75,   // Low-mid frequencies resonate well with warmth.
        mid: 0.80,      // Mid frequencies are clear and full.
        midHigh: 0.85,  // High-mids have some presence, giving the drum a bright feel.
        high: 0.90,     // High frequencies are present, providing clear overtones.
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
      frequencyResponse: {
        low: 0.65,      // Low-end frequencies are present but not overpowering.
        lowMid: 0.70,   // Low-mid frequencies are well-defined with good balance.
        mid: 0.75,      // Mids are present, offering a clean, balanced tone.
        midHigh: 0.80,  // High-mids are pronounced, adding clarity.
        high: 0.85,     // High frequencies are bright and clear.
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
      frequencyResponse: {
        low: 0.75,      // Low frequencies are more pronounced and full.
        lowMid: 0.80,   // Low-mid frequencies are solid, adding warmth and body.
        mid: 0.85,      // Mid-range frequencies are full and defined.
        midHigh: 0.75,  // High mids are slightly reduced, offering smoothness.
        high: 0.70,     // High frequencies are present but less sharp.
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
      frequencyResponse: {
        low: 0.80,      // Low-end frequencies are prominent, adding depth.
        lowMid: 0.85,   // Low-mids resonate well, contributing to the overall warmth.
        mid: 0.90,      // Mids are clear and full, providing body to the tone.
        midHigh: 0.75,  // High mids are present but not overly sharp.
        high: 0.60,     // High frequencies are reduced, focusing on warmth.
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
      frequencyResponse: {
        low: 0.85,      // Strong low-end frequencies with rich presence.
        lowMid: 0.80,   // Low-mids are prominent, adding depth and warmth.
        mid: 0.75,      // Mids are clear but with slightly reduced warmth.
        midHigh: 0.60,  // High mids are less pronounced, favoring warmth.
        high: 0.50,     // High frequencies are subdued, emphasizing mid-lows.
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
      frequencyResponse: {
        low: 0.90,      // Strong low-end frequencies providing punch.
        lowMid: 0.85,   // Low-mids are present but not overpowering.
        mid: 0.70,      // Mids are sharp, focused, and clear.
        midHigh: 0.55,  // High-mids are controlled, keeping the tone direct.
        high: 0.40,     // High frequencies are present but lack brightness.
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
      frequencyResponse: {
        low: 0.90,      // Low-end frequencies are present but with more focus on mids.
        lowMid: 0.80,   // Low-mids dominate, giving warmth and definition.
        mid: 0.75,      // Mids are clear but not overly pronounced.
        midHigh: 0.60,  // High mids are present but controlled.
        high: 0.40,     // High frequencies are present but subtle.
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
    frequencyResponse: {
      low: 0.85,      // Strong low-end presence, very focused.
      lowMid: 0.80,   // Low-mid frequencies are present, providing clarity.
      mid: 0.75,      // Mids are defined but less resonant.
      midHigh: 0.70,  // High mids are slightly more present, giving clarity.
      high: 0.45,     // High frequencies are subtle but present.
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
    frequencyResponse: {
      low: 0.90,      // Low-end frequencies are prominent but short-lived.
      lowMid: 0.75,   // Low-mid frequencies are present but quick to decay.
      mid: 0.70,      // Mids are sharp, focused, and direct.
      midHigh: 0.65,  // High mids are cutting through but not too bright.
      high: 0.30,     // High frequencies are almost muted, focusing on low-end presence.
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
    frequencyResponse: {
      low: 0.95,      // Very strong low-end frequencies with deep presence.
      lowMid: 0.90,   // Low-mids resonate well, providing a solid base.
      mid: 0.80,      // Mids are present but less resonant.
      midHigh: 0.65,  // High mids are somewhat reduced, keeping the tone more grounded.
      high: 0.30,     // Very little high-end presence, focusing on low-mids and low-end.
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
    frequencyResponse: {
      low: 1.0,       // Very strong low-end frequencies with intense presence.
      lowMid: 0.95,   // Low-mid frequencies are extremely present.
      mid: 0.85,      // Mids are punchy but quick to decay.
      midHigh: 0.70,  // High mids are present but muted.
      high: 0.20,     // Very little high-end presence, focusing purely on low-mids and low-end.
    },
  },
];

export default shellThickness;