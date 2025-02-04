const attackValues = [
  {
    characteristic: 'Drumhead Tension', 
    percentage: 20,  
    explanation: 'Higher tension results in a sharper, quicker attack, while lower tension gives a more open and less immediate response. [Source](https://www.drumhead.com/blog/choosing-the-right-drumhead-thickness/)' 
    // High tension tightens the drumhead, increasing attack and responsiveness.
    // Low tension allows for a more open, softer sound with a slower attack.
  },
  {
    characteristic: 'Drumhead Type', 
    percentage: 18,  
    explanation: 'Single-ply heads provide a snappier attack compared to double-ply heads, which soften the initial impact. Clear heads also emphasize attack more than coated heads. [Source](https://www.drumhead.com/blog/clear-vs-coated-drumheads/)' 
    // Clear heads enhance the high frequencies, making the attack more pronounced.
    // Coated heads absorb some energy, slightly reducing attack sharpness.
  },
  {
    characteristic: 'Shell Construction', 
    percentage: 16,  
    explanation: 'Harder materials such as maple and birch produce a sharper and more immediate attack. The construction affects how energy from the strike is transferred to the shell. [Source](https://www.moderndrummer.com/2016/09/the-science-of-drums-sound-characteristics/)' 
    // Stave and segmented shells provide stronger attack due to dense, rigid structure.
    // Steam-bent shells have slightly softer attack due to the way they flex.
  },
  {
    characteristic: 'Bearing Edge', 
    percentage: 14,  
    explanation: 'Sharper bearing edges emphasize the attack by allowing for a more focused and articulate sound, while rounder edges produce a softer attack. [Source](https://www.drumsociety.com/blog/bearing-edges-and-how-they-affect-sound/)' 
    // A 45-degree edge maximizes attack and articulation.
    // A round-over edge softens the attack, making the sound warmer.
  },
  {
    characteristic: 'Hoop Type', 
    percentage: 9,  
    explanation: 'Die-cast hoops tend to focus the energy from the strike into a more punchy, direct attack, while triple-flanged hoops offer a slightly softer response. [Source](https://www.moderndrummer.com/2015/03/need-know-counterhoops/)' 
    // Die-cast hoops provide a rigid response, increasing attack sharpness.
    // Wood hoops soften the attack by allowing more resonance.
  },
  {
    characteristic: 'Wood Species', 
    percentage: 8,  
    explanation: 'Hardwoods like oak or maple deliver a more focused and quick attack due to their density and energy transfer properties. Softer woods provide a slightly more muted attack. [Source](https://www.drumfinder.com/blog/importance-of-drum-wood-species/)' 
    // Birch and maple produce crisp attack due to their dense structure.
    // Mahogany and poplar soften the attack with more warmth.
  },
  {
    characteristic: 'Depth', 
    percentage: 6,  
    explanation: 'Shallower drums produce a more focused and snappy attack, while deeper drums soften the attack and add more resonance. [Source](https://drumhead.com/what-importance-drum-depth/)' 
    // A 5" snare has more immediate attack than an 8" deep snare.
    // Deeper drums spread the energy out, reducing attack intensity.
  },
  {
    characteristic: 'Hardware Type', 
    percentage: 3,  
    explanation: 'The type of hardware, like lugs and tension rods, can slightly influence the drum’s attack by affecting the overall resonance, though this is a minor factor. [Source](https://www.drumfactorydirect.com/blog/choosing-drums-hardware-impacts-sound/)' 
    // Heavier hardware slightly reduces attack sharpness by limiting shell vibration.
    // Lighter hardware allows more resonance, making attack more defined.
  },
  {
    characteristic: 'Width', 
    percentage: 3,  
    explanation: 'Smaller diameter drums often result in a sharper, more focused attack, as opposed to larger drums, which have a broader tone and softer attack. [Source](https://www.drumfinder.com/blog/impact-of-drum-sizes-on-sound/)' 
    // A 10" snare has a sharper attack than a 14" snare due to its smaller surface.
    // Larger snares distribute energy over a bigger area, softening the attack.
  },
  {
    characteristic: 'Environmental Factors', 
    percentage: 2,  
    explanation: 'Environmental factors like temperature and humidity have a negligible effect on attack compared to other factors. [Source](https://www.soundonsound.com/techniques/how-environment-affects-sound)' 
    // Cold, dry environments slightly increase attack due to stiffer drumheads.
    // Humid conditions can soften attack by making drumheads more flexible.
  },
  {
    characteristic: 'Finish Type', 
    percentage: 2,  
    explanation: 'Gloss finishes can reflect higher frequencies, slightly emphasizing the initial strike and making the attack feel sharper. Matte finishes have a minimal effect. [Source](https://www.drumhead.com/blog/drum-finish-and-its-effects-on-sound/)' 
    // High-gloss finishes enhance brightness, making attack feel sharper.
    // Matte finishes diffuse higher frequencies, softening attack slightly.
  }
];

export default attackValues;