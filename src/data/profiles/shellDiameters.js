// shellDiameters.js

const shellDiameters = [
  {
    diameter: 6,
    soundProfile: {
      attack: 10,      // Very sharp attack due to the smaller size, providing a focused, quick response.
      sustain: 4,      // Short sustain, as smaller shells decay faster.
      warmth: 4,       // Less warmth, as smaller drums typically have a more focused, bright sound.
      projection: 10,  // Excellent projection, small shells often have the ability to cut through noise.
      brightness: 9,   // Bright sound, small shells are more resonant in the high frequencies.
    },
    frequencyResponse: {
      low: 0.18,      // Low-end frequencies are less present due to the sharp, focused attack.
      lowMid: 0.40,   // Subtle low-mid presence, with a slightly emphasized mid-high frequency range.
      mid: 0.60,      // Clear mids, but not overly pronounced due to the bright nature of the sound.
      midHigh: 0.80,  // High mids are prominent, enhancing clarity and sharpness.
      high: 0.90,     // Very bright, small drums are more resonant in the high frequencies.
    },
  },
  {
    diameter: 8,
    soundProfile: {
      attack: 9,      // Still sharp attack, though slightly softer compared to 6" diameter.
      sustain: 5,     // Moderate sustain, short enough for a punchy sound.
      warmth: 5,      // Balanced warmth, providing more depth than a 6" drum.
      projection: 9,  // High projection, good for cutting through mixes.
      brightness: 8,  // Bright but slightly more mellow than smaller diameters.
    },
    frequencyResponse: {
      low: 0.22,      // Slightly more low-end present than the 6" drum, but still focused.
      lowMid: 0.50,   // Low-mids become more present, adding depth to the sound.
      mid: 0.60,      // Midrange frequencies are present, with a balanced tone.
      midHigh: 0.75,  // Mids are clearer and slightly more pronounced than in smaller drums.
      high: 0.85,     // High frequencies are still bright but less harsh.
    },
  },
  {
    diameter: 10,
    soundProfile: {
      attack: 8,      // Balanced attack, not too sharp but still defined.
      sustain: 6,     // Good sustain, allowing the sound to resonate.
      warmth: 6,      // Balanced warmth, with a bit more low-end presence than smaller drums.
      projection: 8,  // Good projection, but not as sharp as the smaller diameters.
      brightness: 7,  // Slightly less bright, but still clear in higher frequencies.
    },
    frequencyResponse: {
      low: 0.35,      // Low-end frequencies are present and more defined than smaller drums.
      lowMid: 0.55,   // Low-mid frequencies resonate well, adding warmth to the sound.
      mid: 0.70,      // Clear mids, providing a balanced tone.
      midHigh: 0.60,  // Mids remain defined, but slightly subdued compared to higher frequencies.
      high: 0.65,     // High frequencies are present but less piercing than smaller drums.
    },
  },
  {
    diameter: 12,
    soundProfile: {
      attack: 9,      // Strong attack, sharper than 10" drums.
      sustain: 6,     // Good sustain, as the larger shell allows for more resonance.
      warmth: 5,      // Moderate warmth, less pronounced than smaller drums.
      projection: 9,  // High projection, as larger drums still retain good cutting ability.
      brightness: 8,  // Brightness is still present but slightly more subdued.
    },
    frequencyResponse: {
      low: 0.40,      // Low-end frequencies have a more balanced presence compared to smaller drums.
      lowMid: 0.55,   // Low-mid frequencies are well-defined, providing fullness.
      mid: 0.65,      // Mids are clear with more resonance.
      midHigh: 0.70,  // High mids are more present, contributing to clarity.
      high: 0.80,     // High frequencies are present and add brightness without being harsh.
    },
  },
  {
    diameter: 13,
    soundProfile: {
      attack: 8,      // Slightly softer attack compared to 12", but still punchy.
      sustain: 6,     // Good sustain, but less than 12" drums.
      warmth: 6,      // Balanced warmth, a good middle ground.
      projection: 8,  // Good projection, but not as sharp as smaller drums.
      brightness: 8,  // Bright but not too piercing, keeping a good balance.
    },
    frequencyResponse: {
      low: 0.45,      // Low-end frequencies become more defined, providing a rounded sound.
      lowMid: 0.60,   // Low-mid frequencies resonate well with good definition.
      mid: 0.70,      // Balanced mid-range frequencies, providing a full sound.
      midHigh: 0.75,  // High mids become clearer, adding sharpness without harshness.
      high: 0.85,     // High frequencies provide clarity and brightness.
    },
  },
  {
    diameter: 14,
    soundProfile: {
      attack: 8,      // Moderate attack, not as sharp but still present.
      sustain: 7,     // Longer sustain compared to smaller shells, producing a more resonant sound.
      warmth: 7,      // Warmer tone, adding fullness to the sound.
      projection: 8,  // Good projection, but with more focus on the low-mid frequencies.
      brightness: 7,  // Balanced brightness, not too sharp.
    },
    frequencyResponse: {
      low: 0.55,      // Low-end frequencies are prominent and provide a solid foundation.
      lowMid: 0.65,   // Low-mid frequencies project well, adding warmth to the sound.
      mid: 0.75,      // Mid-range frequencies are clear and pronounced.
      midHigh: 0.70,  // High mids are slightly subdued but still maintain presence.
      high: 0.80,     // High frequencies are present without being piercing.
    },
  },
  {
    diameter: 16,
    soundProfile: {
      attack: 7,      // Softer attack, due to the larger shell size, with a more rounded tone.
      sustain: 7,     // Good sustain, with deeper resonance.
      warmth: 8,      // Very warm, making it ideal for deeper, resonant tones.
      projection: 7,  // Moderate projection, providing depth without being overpowering.
      brightness: 6,  // Reduced brightness, focusing more on warmth and lower frequencies.
    },
    frequencyResponse: {
      low: 0.60,      // Low-end frequencies resonate well, adding richness to the sound.
      lowMid: 0.70,   // Low-mid frequencies are enhanced, adding warmth to the tone.
      mid: 0.80,      // Mids are present and provide fullness.
      midHigh: 0.65,  // High mids are subdued, giving a more mellow tone.
      high: 0.60,     // High frequencies are softer, providing a warmer overall sound.
    },
  },
  {
    diameter: 18,
    soundProfile: {
      attack: 6,      // Softer attack, more subdued than smaller drums.
      sustain: 8,     // High sustain, longer resonance due to the larger shell.
      warmth: 9,      // Extremely warm, ideal for jazz or mellow genres.
      projection: 6,  // Lower projection, suitable for controlled environments.
      brightness: 5,  // Low brightness, more focused on the low and mid-range frequencies.
    },
    frequencyResponse: {
      low: 0.65,      // Low-end frequencies have more presence, contributing to the warmth.
      lowMid: 0.80,   // Low-mid frequencies dominate, providing a full tone.
      mid: 0.85,      // Mids are rich and resonant, adding body to the sound.
      midHigh: 0.75,  // High mids are less pronounced, keeping the tone smooth.
      high: 0.60,     // High frequencies are subdued, focusing on the low-end warmth.
    },
  },
  {
    diameter: 20,
    soundProfile: {
      attack: 5,      // Softer attack, with less defined sharpness.
      sustain: 9,     // Very long sustain, providing a deep, resonant sound.
      warmth: 10,     // Maximum warmth, ideal for creating deep, full tones.
      projection: 5,  // Lower projection, making it best for smaller environments.
      brightness: 4,  // Very low brightness, focusing entirely on deep tones.
    },
    frequencyResponse: {
      low: 0.75,      // Strong low-end frequencies, contributing to the deep warmth.
      lowMid: 0.85,   // Low-mid frequencies dominate, providing fullness and depth.
      mid: 0.80,      // Mids are full, giving the drum a rich and smooth tone.
      midHigh: 0.60,  // High mids are present but subdued, creating a mellow sound.
      high: 0.40,     // Low brightness, with little emphasis on high frequencies.
    },
  },
  {
    diameter: 22,
    soundProfile: {
      attack: 5,      // Very soft attack, focusing on resonance over sharpness.
      sustain: 9,     // Extremely long sustain, giving a rich, deep tone.
      warmth: 10,     // Full-bodied warmth, especially in the lower frequencies.
      projection: 4,  // Low projection, suited for controlled environments.
      brightness: 4,  // Very muted brightness, ideal for mellow tones.
    },
    frequencyResponse: {
      low: 0.80,      // Low-end frequencies resonate strongly, adding richness to the sound.
      lowMid: 0.90,   // Low-mid frequencies are very present, giving the tone fullness.
      mid: 0.85,      // Mid-range frequencies are well-balanced, with good warmth.
      midHigh: 0.70,  // High mids are softened, contributing to the smooth tone.
      high: 0.50,     // High frequencies are low, focusing on the depth of the tone.
    },
  },
  {
    diameter: 24,
    soundProfile: {
      attack: 4,      // Very soft attack, minimal sharpness.
      sustain: 9,     // Extremely long sustain, as the larger shell enhances resonance.
      warmth: 10,     // Maximum warmth, providing a full, rich tone.
      projection: 4,  // Low projection, making it more suited for close-mic or studio use.
      brightness: 3,  // Very low brightness, focusing on deep and warm tones.
    },
    frequencyResponse: {
      low: 0.85,      // Very strong low-end, providing the drum with a deep, resonant sound.
      lowMid: 0.90,   // Low-mid frequencies are rich and present.
      mid: 0.90,      // Mids are resonant and full-bodied, contributing to the warmth.
      midHigh: 0.70,  // High mids are softer, contributing to a mellow tone.
      high: 0.40,     // Very little high-end presence, focusing on warmth.
    },
  },
];

export default shellDiameters;