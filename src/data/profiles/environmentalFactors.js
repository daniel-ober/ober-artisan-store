const environmentalFactors = [
    {
      factor: 'Extremely Humid',
      soundProfile: {
        attack: 6,      // Softer attack in humid conditions. The moisture in the air dampens the initial strike.
        sustain: 8,     // Longer sustain due to moisture, which helps to prolong the vibrations.
        warmth: 8,      // Increased warmth in high humidity as the moisture enhances the low-mid frequencies.
        projection: 6,  // Slightly reduced projection due to dampened vibrations.
        brightness: 5,  // Lower brightness, as moisture in the air softens the high frequencies.
      },
      example: 'A drum set in a tropical rainforest or a steamy indoor environment with high humidity. This dampens the attack and creates a warmer sound.'
    },
    {
      factor: 'Humid',
      soundProfile: {
        attack: 7,      // Softer attack, but more defined. The attack is not as harsh as in dry conditions but still noticeable.
        sustain: 7,     // Good sustain, but not as long as in extreme humidity.
        warmth: 7,      // Higher warmth due to moisture, giving the drum a fuller tone.
        projection: 7,  // Moderate projection in humid environments, not as loud as in dry conditions but still clear.
        brightness: 6,  // Slightly reduced brightness, as moisture in the air softens the high frequencies.
      },
      example: 'A drum set in a humid coastal city. While the attack is not as sharp, the overall sound is warmer and has good sustain.'
    },
    {
      factor: 'Average Setting',
      soundProfile: {
        attack: 7,      // Balanced attack, ideal for most environments, with a natural punch.
        sustain: 7,     // Good sustain, ideal for controlled environments where there is no extreme temperature or humidity.
        warmth: 7,      // Balanced warmth, not too cold or too warm, providing a neutral sound.
        projection: 7,  // Balanced projection, suitable for indoor performances and recordings.
        brightness: 7,  // Balanced brightness, suitable for all-around use in most venues.
      },
      example: 'A drum set in a studio or indoor venue with average room temperature and humidity. The sound is well-balanced and versatile.'
    },
    {
      factor: 'Dry',
      soundProfile: {
        attack: 8,      // Sharper attack in dry conditions. The air is less dense, which results in a more pronounced hit.
        sustain: 6,     // Slightly reduced sustain, as dry air causes quicker sound decay.
        warmth: 5,      // Dry environments reduce warmth, leading to a more focused, brighter sound.
        projection: 8,  // Increased projection in dry climates as the vibrations travel more freely in less dense air.
        brightness: 7,  // Increased brightness due to drier conditions, producing a more crisp tone.
      },
      example: 'A drum set in a desert or arid climate. The drumhead produces a sharper, more cutting sound with enhanced projection.'
    },
    {
      factor: 'Extremely Dry',
      soundProfile: {
        attack: 9,      // Very sharp attack due to dryness, as there is no moisture to soften the hit.
        sustain: 6,     // Shortened sustain in very dry conditions, as dry air accelerates sound decay.
        warmth: 5,      // Dry conditions diminish warmth, making the sound brighter and more focused on the attack.
        projection: 9,  // Very high projection in extremely dry environments, as the sound travels more easily in dry air.
        brightness: 8,  // Very bright sound due to dryness, as the absence of moisture accentuates the higher frequencies.
      },
      example: 'A drum set in a desert or in a dry, heated indoor environment. The sound is very sharp and piercing, with long projection but low warmth.'
    },
  ];
  
  export default environmentalFactors;