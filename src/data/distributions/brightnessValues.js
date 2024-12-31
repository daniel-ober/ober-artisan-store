const brightnessValues = [
  { characteristic: 'Shell Construction', percentage: 20 },  // Construction affects overtones contributing to brightness.
  { characteristic: 'Wood Species', percentage: 15 },         // Hardwoods like birch produce brighter tones.
  { characteristic: 'Shell Thickness', percentage: 15 },      // Thinner shells resonate with higher frequencies, enhancing brightness.
  { characteristic: 'Finish Type', percentage: 10 },          // Glossy finishes reflect higher frequencies, increasing brightness.
  { characteristic: 'Drumhead Type', percentage: 10 },        // Clear heads are brighter compared to coated heads.
  { characteristic: 'Bearing Edge', percentage: 10 },         // Sharp bearing edges contribute to higher frequency emphasis.
  { characteristic: 'Depth', percentage: 5 },                 // Shallower depths can enhance higher overtones.
  { characteristic: 'Width', percentage: 5 },                 // Smaller diameters can produce brighter sounds.
  { characteristic: 'Hoop Type', percentage: 5 },             // Certain hoop types can influence the clarity and brightness of the sound.
  { characteristic: 'Hardware Type', percentage: 3 },         // Lighter hardware allows for more shell resonance, affecting brightness.
  { characteristic: 'Environmental Factors', percentage: 2 }, // Environmental conditions can subtly influence material properties, affecting brightness.
];

export default brightnessValues;