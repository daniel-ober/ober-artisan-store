// StaveCalculator.js
import React, { useState } from 'react';
import './StaveCalculator.css';
import StaveDiagram from './StaveDiagram';

const commonStaves = [10, 16, 20, 6, 8, 12, 24, 32, 36, 40];
const commonDiameters = [14, 13, 12, 8, 10, 15, 16, 18, 20, 22, 24];
const units = ['in', 'mm', 'cm', 'fraction'];

const StaveCalculator = () => {
  const [diameter, setDiameter] = useState('');
  const [staveCount, setStaveCount] = useState('');
  const [thickness, setThickness] = useState('0.75');
  const [results, setResults] = useState(null);
  const [unit, setUnit] = useState('in');

  const calculate = () => {
    const d = parseFloat(diameter);
    const n = parseInt(staveCount);
    const t = parseFloat(thickness);
    const buffer = 0.125;

    if (!d || !n || !t) return;

    const preMillDiameter = d + buffer;
    const postMillDiameter = d - 0.125;
    const postMillCircumference = Math.PI * postMillDiameter;

    const angle = 360 / n;
    const miterAngle = angle / 2;

    const outerFaceWidth = preMillDiameter * Math.tan(Math.PI / n);
    const innerFaceWidth = (preMillDiameter - 2 * t) * Math.tan(Math.PI / n);

    const postMillInnerDiameter = (preMillDiameter - 2 * t) / Math.cos(Math.PI / n);
    const shellThickness = (postMillDiameter - postMillInnerDiameter) / 2;

    setResults({
      miterAngle: miterAngle.toFixed(3),
      faceWidth: outerFaceWidth.toFixed(3),
      innerWidth: innerFaceWidth.toFixed(3),
      bufferedDiameter: preMillDiameter.toFixed(3),
      postMillDiameter: postMillDiameter.toFixed(3),
      postMillCircumference: postMillCircumference.toFixed(3),
      finalShellThickness: shellThickness.toFixed(3),
    });
  };

  const convert = (val) => {
    const num = parseFloat(val);
    if (unit === 'mm') return (num * 25.4).toFixed(2) + ' mm';
    if (unit === 'cm') return (num * 2.54).toFixed(2) + ' cm';
    if (unit === 'fraction') {
      const frac = Math.round(num * 16);
      const whole = Math.floor(frac / 16);
      const rem = frac % 16;
      if (rem === 0) return `${whole}"`;
      return `${whole} ${rem}/16"`;
    }
    return num.toFixed(3) + ' in';
  };

  return (
    <div className="stave-calculator">
      <h2>Stave Drum Calculator</h2>
      <div className="input-grid">
        <label>
          Number of Staves
          <select className="select-field" value={staveCount} onChange={(e) => setStaveCount(e.target.value)}>
            <option value="">Select</option>
            {commonStaves.map((count) => (
              <option key={count} value={count}>{count}</option>
            ))}
          </select>
        </label>
        <label>
          Drum Diameter (in)
          <select className="select-field" value={diameter} onChange={(e) => setDiameter(e.target.value)}>
            <option value="">Select</option>
            {commonDiameters.map((dia) => (
              <option key={dia} value={dia}>{dia}"</option>
            ))}
          </select>
        </label>
        <label>
          Shell Thickness (in)
          <input type="number" value={thickness} onChange={(e) => setThickness(e.target.value)} />
        </label>
      </div>
      <button className="calculate-button" onClick={calculate}>Calculate</button>

      {results && (
        <div className="results-panel">
          <div className="results-header">
            <h3>Results</h3>
            <div className="unit-toggle">
              {units.map((u) => (
                <button
                  key={u}
                  className={`unit-button ${unit === u ? 'active' : ''}`}
                  onClick={() => setUnit(u)}
                >{u}</button>
              ))}
            </div>
          </div>
          <p><strong>Miter Angle:</strong> {results.miterAngle}°</p>
          <p><strong>Outer Face Width:</strong> {convert(results.faceWidth)}</p>
          <p><strong>Inner Face Width:</strong> {convert(results.innerWidth)}</p>
          <p><strong>Buffered Diameter Used:</strong> {convert(results.bufferedDiameter)}</p>
          <p><strong>Post-Mill Diameter:</strong> {convert(results.postMillDiameter)}</p>
          <p><strong>Target Circumference (Post-Mill):</strong> {convert(results.postMillCircumference)}</p>
          <p><strong>Final Shell Thickness (Post-Mill):</strong> {convert(results.finalShellThickness)}</p>

          <StaveDiagram
            diameter={parseFloat(diameter)}
            staveCount={parseInt(staveCount)}
            thickness={parseFloat(thickness)}
            buffer={0.125}
          />
        </div>
      )}
    </div>
  );
};

export default StaveCalculator;