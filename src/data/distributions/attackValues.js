const attackValues = [
  { characteristic: 'Drumhead Type', percentage: 20 },  // Drumhead material and thickness directly affect attack response.
  { characteristic: 'Bearing Edge', percentage: 15 },   // Sharper bearing edges lead to a more pronounced attack.
  { characteristic: 'Shell Construction', percentage: 15 }, // Construction type influences shell resonance and attack.
  { characteristic: 'Shell Thickness', percentage: 10 }, // Thicker shells can produce a stronger attack.
  { characteristic: 'Wood Species', percentage: 10 },     // Denser woods like maple enhance attack.
  { characteristic: 'Finish Type', percentage: 5 },      // Glossy finishes may slightly brighten attack.
  { characteristic: 'Depth', percentage: 10 },            // Shallower depths can result in a quicker attack.
  { characteristic: 'Width', percentage: 5 },            // Diameter influences the tonal quality of the attack.
  { characteristic: 'Hoop Type', percentage: 5 },        // Die-cast hoops can focus the attack.
  { characteristic: 'Hardware Type', percentage: 3 },    // Hardware mass can subtly affect attack by influencing shell vibration.
  { characteristic: 'Environmental Factors', percentage: 2 },  // Temperature and humidity can affect drumhead tension, impacting attack.
];

export default attackValues;