const projectionValues = [
  { characteristic: 'Shell Construction', percentage: 25 },  // Construction type significantly influences sound projection.
  { characteristic: 'Depth', percentage: 20 },               // Deeper drums project sound more effectively.
  { characteristic: 'Wood Species', percentage: 15 },        // Denser woods contribute to better projection.
  { characteristic: 'Shell Thickness', percentage: 15 },     // Thicker shells can enhance projection by reinforcing sound waves.
  { characteristic: 'Width', percentage: 10 },               // Larger diameters can produce louder sounds with better projection.
  { characteristic: 'Drumhead Type', percentage: 5 },        // Single-ply heads may project more than thicker heads.
  { characteristic: 'Bearing Edge', percentage: 5 },         // Sharper edges can improve projection.
  { characteristic: 'Finish Type', percentage: 2 },          // Certain finishes may slightly affect projection.
  { characteristic: 'Hoop Type', percentage: 2 },            // Hoop design can influence the energy transfer, affecting projection.
  { characteristic: 'Hardware Type', percentage: 1 },        // Hardware has minimal impact on projection.
  { characteristic: 'Environmental Factors', percentage: 0 },// Environmental factors have negligible effect on projection.
];

export default projectionValues;