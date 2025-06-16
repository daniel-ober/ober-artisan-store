import React, { useState } from 'react';
import './StaveDiagram.css';

const StaveDiagram = ({ diameter, staveCount, thickness, buffer = 0.125 }) => {
  const [visible, setVisible] = useState({
    preMillOuter: true,
    preMillInner: true,
    postMillOuter: true,
    postMillInner: true,
  });

  const center = 150;
  const scale = 10;
  const angle = (2 * Math.PI) / staveCount;

  // === PRE-MILL DIMENSIONS ===
  const bufferedDiameter = diameter + buffer;
  const preMillOuterRadius = (bufferedDiameter * scale) / 2;
  const preMillInnerRadius = preMillOuterRadius - thickness * scale;

  // === POST-MILL OUTER AND INNER RADII ===
  const postMillOuterRadius = ((diameter - 0.125) * scale) / 2;
  const postMillInnerDiameter = diameter - 0.125 - 2 * thickness + 0.25;
  const postMillInnerRadius = (postMillInnerDiameter * scale) / 2;

  const finalShellThickness = (
    (postMillOuterRadius - postMillInnerRadius) /
    scale
  ).toFixed(3);

  // === FACE WIDTHS ===
  const outerFaceWidth = (
    (diameter + buffer) *
    Math.tan(Math.PI / staveCount)
  ).toFixed(3);
  const innerFaceWidth = (
    postMillInnerDiameter * Math.tan(Math.PI / staveCount)
  ).toFixed(3);

  // === POLYGON POINT GENERATION ===
  const createPolygonPoints = (radius) =>
    Array.from({ length: staveCount }, (_, i) => {
      const theta = i * angle;
      return {
        x: center + radius * Math.cos(theta),
        y: center + radius * Math.sin(theta),
      };
    });

  const preMillOuterPoints = createPolygonPoints(preMillOuterRadius);
  const preMillInnerPoints = createPolygonPoints(preMillInnerRadius);

  const miter = (180 / staveCount).toFixed(2);

  return (
    <div className="diagram-wrapper">
     <div className="diagram-controls-wrap">
    <div className="diagram-controls">
      {Object.entries(visible).map(([key, val]) => (
        <label key={key}>
          <input
            type="checkbox"
            className="stave-diagram-filters"
            checked={val}
            onChange={() => setVisible((v) => ({ ...v, [key]: !v[key] }))}
          />
          {key.replace(/([A-Z])/g, ' $1')}
        </label>
      ))}
    </div>
  </div>

      <svg width="300" height="300" viewBox="0 0 300 300" className="stave-svg">
        {visible.preMillOuter && (
          <polygon
            points={preMillOuterPoints.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#000"
            strokeWidth="1.4"
          />
        )}

        {visible.preMillInner && (
          <polygon
            points={preMillInnerPoints.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#000"
            strokeWidth="1.4"
          />
        )}

        {visible.postMillOuter && (
          <circle
            cx={center}
            cy={center}
            r={postMillOuterRadius}
            fill="none"
            stroke="red"
            strokeDasharray="4,2"
            strokeWidth="1.4"
          />
        )}

        {visible.postMillInner && (
          <circle
            cx={center}
            cy={center}
            r={postMillInnerRadius}
            fill="none"
            stroke="red"
            strokeDasharray="4,2"
            strokeWidth="1.4"
          />
        )}

        {visible.postMillOuter && visible.postMillInner && (
          <>
            <circle
              cx={center}
              cy={center}
              r={postMillOuterRadius}
              fill="#f88"
              opacity="0.3"
              stroke="none"
            />
            <circle
              cx={center}
              cy={center}
              r={postMillInnerRadius}
              fill="#fff"
              stroke="none"
            />
          </>
        )}

        {/* Reference Lines */}
        <line
          x1={center}
          y1={center - 100}
          x2={center}
          y2={center + 100}
          stroke="#ccc"
          strokeWidth="1"
        />
        <line
          x1={center - 100}
          y1={center}
          x2={center + 100}
          y2={center}
          stroke="#ccc"
          strokeWidth="1"
        />

        {/* Text Labels */}
        <text
          x={center - 25}
          y={center - preMillOuterRadius - 10}
          fontSize="12"
          fill="#000"
        >
          {bufferedDiameter.toFixed(3)}"
        </text>
        <text x={center + 10} y={center + 50} fontSize="10" fill="#666">
          Miter Angle: {miter}°
        </text>
        <text
          x={center - 50}
          y={center + preMillOuterRadius + 15}
          fontSize="10"
          fill="#666"
        >
          Outer Face Width: {outerFaceWidth}"
        </text>
        <text
          x={center - 50}
          y={center + preMillOuterRadius + 30}
          fontSize="10"
          fill="#666"
        >
          Inner Face Width: {innerFaceWidth}"
        </text>
        <text
          x={center - 50}
          y={center + preMillOuterRadius + 45}
          fontSize="10"
          fill="#666"
        >
          Final Shell Thickness: {finalShellThickness}"
        </text>
        <text x={center - 60} y={290} fontSize="10" fill="#888">
          * Diagram not to scale
        </text>
      </svg>
    </div>
  );
};

export default StaveDiagram;
