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
      attack: 9,      // Strong attack, sharper than 10" drums due to smaller diameter and focused energy.
      sustain: 6,     // Good sustain, as the larger shell allows for more resonance than smaller drums.
      warmth: 5,      // Moderate warmth, but less pronounced due to its relatively smaller size.
      projection: 9,  // High projection, as larger drums still retain good cutting ability.
      brightness: 8,  // Brightness is still present but slightly more subdued compared to smaller shells.
    },
    frequencyResponse: {
      low: 0.40,      // Low-end frequencies have a more balanced presence compared to smaller drums.
      lowMid: 0.55,   // Low-mid frequencies are well-defined, providing warmth and depth.
      mid: 0.65,      // Mids are clear with more resonance, making the drum articulate.
      midHigh: 0.70,  // High mids are more present, contributing to clarity and articulation.
      high: 0.80,     // High frequencies are present and add brightness without being harsh.
    },
  },
  {
    diameter: 13,
    soundProfile: {
      attack: 8,      // Slightly softer attack compared to 12", but still retains a punchy response.
      sustain: 6,     // Good sustain, but less than a 14" drum due to its smaller air volume.
      warmth: 6,      // Balanced warmth, a good middle ground between 12" and 14".
      projection: 8,  // Good projection, but not as sharp or cutting as a 12" drum.
      brightness: 8,  // Bright but not overly piercing, keeping a smooth balance in the high end.
    },
    frequencyResponse: {
      low: 0.45,      // Low-end frequencies are slightly more present than in a 12" drum.
      lowMid: 0.60,   // Low-mid frequencies resonate well with a slightly fuller sound.
      mid: 0.70,      // Balanced mid-range frequencies, contributing to a full-bodied tone.
      midHigh: 0.75,  // High mids are clear and defined, preventing muddiness.
      high: 0.85,     // High frequencies add clarity, allowing for articulation in playing.
    },
  },
  {
    diameter: 14,
    soundProfile: {
      attack: 8,      // Moderate attack, not as sharp as smaller diameters, but still defined.
      sustain: 7,     // Longer sustain compared to smaller shells, producing a more resonant sound.
      warmth: 7,      // Warmer tone, adding fullness and depth to the sound.
      projection: 8,  // Good projection, but with more focus on the low-mid frequencies.
      brightness: 7,  // Balanced brightness, reducing harshness while maintaining clarity.
    },
    frequencyResponse: {
      low: 0.55,      // Low-end frequencies are more pronounced, providing a full-bodied sound.
      lowMid: 0.65,   // Low-mid frequencies project well, giving the drum a solid tone.
      mid: 0.75,      // Mid-range frequencies are clear and balanced with warmth.
      midHigh: 0.70,  // High mids are slightly subdued but still present for articulation.
      high: 0.80,     // High frequencies add clarity but are smoother compared to smaller diameters.
    },
  },
  {
    diameter: 15,
    soundProfile: {
      attack: 7,      // Slightly softer attack due to the larger diameter distributing energy more evenly.
      sustain: 7,     // Sustain increases with size, allowing for more resonance.
      warmth: 8,      // Warmer tone compared to smaller drums, making it ideal for deeper sounds.
      projection: 7,  // Projection is slightly reduced due to the wider distribution of sound energy.
      brightness: 6,  // Slightly less bright, with more emphasis on warmth and midrange tones.
    },
    frequencyResponse: {
      low: 0.60,      // Low-end frequencies become more prominent with the larger shell.
      lowMid: 0.70,   // Low-mid resonance increases, contributing to a fuller sound.
      mid: 0.75,      // Mids remain clear but blend more into the lower range.
      midHigh: 0.65,  // High mids are softer, preventing excessive sharpness.
      high: 0.75,     // High frequencies remain present but are less pronounced than in smaller drums.
    },
  },
  {
    diameter: 16,
    soundProfile: {
      attack: 7,      // Softer attack due to the large shell size, with a rounder tone.
      sustain: 7,     // Sustain increases with size, providing deeper resonance.
      warmth: 8,      // Very warm, making it ideal for fuller, resonant tones.
      projection: 7,  // Moderate projection, providing depth without excessive sharpness.
      brightness: 6,  // Reduced brightness, with more focus on warmth and lower frequencies.
    },
    frequencyResponse: {
      low: 0.65,      // Low-end frequencies become more dominant, adding depth.
      lowMid: 0.75,   // Low-mids resonate well, making the drum sound fuller.
      mid: 0.80,      // Mids are warm and well-balanced within the overall tone.
      midHigh: 0.65,  // High mids are subdued, contributing to a smooth sound.
      high: 0.70,     // High frequencies remain present but are softer.
    },
  },
  {
    diameter: 18,
    soundProfile: {
      attack: 6,      // Softer attack due to the larger diameter dispersing impact energy.
      sustain: 8,     // High sustain, as the larger shell promotes resonance.
      warmth: 9,      // Extremely warm, making it perfect for deep, mellow tones.
      projection: 6,  // Lower projection, as larger shells tend to absorb more energy.
      brightness: 5,  // Lower brightness, focusing more on midrange and low-end tones.
    },
    frequencyResponse: {
      low: 0.70,      // Strong low-end resonance, making the drum sound deep.
      lowMid: 0.80,   // Low-mids contribute to the richness of the tone.
      mid: 0.85,      // Mids are well-balanced, giving the drum a smooth tonal character.
      midHigh: 0.70,  // High mids remain soft, preventing harshness.
      high: 0.60,     // High frequencies are present but significantly more subdued.
    },
  },
  {
    diameter: 20,
    soundProfile: {
      attack: 5,      // Soft attack, prioritizing depth and resonance over sharpness.
      sustain: 9,     // Very long sustain, offering deep, full-bodied resonance.
      warmth: 10,     // Maximum warmth, perfect for deep, resonant tones.
      projection: 5,  // Lower projection, making it more suited for studio or low-volume applications.
      brightness: 4,  // Minimal brightness, allowing the sound to be more bass-heavy.
    },
    frequencyResponse: {
      low: 0.75,      // Deep low-end resonance, adding body and warmth.
      lowMid: 0.85,   // Low-mid frequencies dominate, making the drum sound powerful.
      mid: 0.80,      // Midrange remains present, though warmth is prioritized.
      midHigh: 0.65,  // High mids are softened, reducing harshness.
      high: 0.50,     // High frequencies are reduced, making the tone darker.
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