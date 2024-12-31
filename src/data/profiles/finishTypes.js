const finishTypes = [
    {
      finish: 'Glossy',
      soundProfile: {
        attack: 7,      // Glossy finishes enhance attack slightly by providing a sharper, more defined sound.
        sustain: 6,     // Slightly increased sustain due to the more resonant surface.
        warmth: 6,      // Adds moderate warmth, balancing brightness and resonance.
        projection: 7,  // Slightly improves projection as glossy finishes help the sound resonate.
        brightness: 8,  // High brightness, glossy finishes enhance the higher frequencies.
      },
    },
    {
      finish: 'Matte',
      soundProfile: {
        attack: 6,      // Softer attack, matte finishes reduce some of the sharpness.
        sustain: 7,     // Slightly better sustain than glossy, as matte finishes promote longer resonance.
        warmth: 8,      // Higher warmth, reducing some of the sharpness in the sound.
        projection: 6,  // Matte finishes have less projection compared to glossy ones.
        brightness: 5,  // Lower brightness, focusing more on warmth and resonance.
      },
    },
    {
      finish: 'Satin',
      soundProfile: {
        attack: 7,      // Balanced attack, similar to matte but with a bit more clarity.
        sustain: 6,     // Moderate sustain, suitable for a broad range of genres.
        warmth: 7,      // Moderate warmth, providing a more rounded sound than glossy or matte.
        projection: 6,  // Good projection, but not as sharp as glossy.
        brightness: 6,  // Balanced brightness, works well for general-purpose drumming.
      },
    },
    {
      finish: 'High Gloss',
      soundProfile: {
        attack: 8,      // High gloss finishes provide a very clear, sharp attack.
        sustain: 6,     // Moderate sustain due to the reflective nature of the surface.
        warmth: 5,      // Lower warmth, more focused on bright and clear tones.
        projection: 8,  // High projection, as high gloss helps sound travel.
        brightness: 9,  // Very bright, perfect for styles needing a clear, cutting sound.
      },
    },
    {
      finish: 'Lacquered',
      soundProfile: {
        attack: 7,      // Balanced attack, somewhat between matte and glossy.
        sustain: 7,     // Slightly better sustain, promoting resonance.
        warmth: 6,      // Provides some warmth, but not as much as matte finishes.
        projection: 7,  // Good projection, as lacquer adds some resonant qualities.
        brightness: 7,  // Balanced brightness, neither too sharp nor too muted.
      },
    },
    {
      finish: 'Scorched/Toasted',
      soundProfile: {
        attack: 7,      // Softer attack due to the toasted finish.
        sustain: 8,     // Higher sustain, giving the drum a richer, longer resonance.
        warmth: 9,      // Very warm, emphasizing the low and mid frequencies.
        projection: 7,  // Good projection, but not as strong as glossy finishes.
        brightness: 4,  // Lower brightness, focusing more on warm tones.
      },
    },
  ];
  
  export default finishTypes;