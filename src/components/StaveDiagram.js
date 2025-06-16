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

  // Pre-mill outer and inner radii
  const preMillOuterRadius = ((diameter + buffer) * scale) / 2;
  const preMillInnerRadius = preMillOuterRadius - thickness * scale;

  // Post-mill outer: INSCRIBED in pre-mill outer polygon
  const postMillOuterRadius = preMillOuterRadius * Math.cos(Math.PI / staveCount);

  // Post-mill inner: CIRCUMSCRIBED to pre-mill inner polygon
  const postMillInnerRadius = preMillInnerRadius / Math.cos(Math.PI / staveCount);

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
  const faceWidth = (
    2 * (diameter / 2 - thickness) * Math.sin(Math.PI / staveCount)
  ).toFixed(3);

  return (
    <div className="diagram-wrapper">
      <div className="diagram-controls">
        {Object.entries(visible).map(([key, val]) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={val}
              onChange={() =>
                setVisible((v) => ({ ...v, [key]: !v[key] }))
              }
            />{' '}
            {key.replace(/([A-Z])/g, ' $1')}
          </label>
        ))}
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
            stroke="blue"
            strokeDasharray="4 2"
            strokeWidth="1.2"
          />
        )}

        {visible.postMillOuter && (
          <circle
            cx={center}
            cy={center}
            r={postMillOuterRadius}
            fill="none"
            stroke="#333"
            strokeWidth="1.2"
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

        <line x1={center} y1={center - 100} x2={center} y2={center + 100} stroke="#ccc" strokeWidth="1" />
        <line x1={center - 100} y1={center} x2={center + 100} y2={center} stroke="#ccc" strokeWidth="1" />

        <text x={center - 25} y={center - preMillOuterRadius - 10} fontSize="12" fill="#000">
          {(diameter + buffer).toFixed(3)}"
        </text>
        <text x={center + 10} y={center + 55} fontSize="10" fill="#666">
          Miter Angle: {miter}°
        </text>
        <text x={center - 45} y={center + preMillOuterRadius + 25} fontSize="10" fill="#666">
          Inner Face Width: {faceWidth}"
        </text>
        <text x={center - 60} y={290} fontSize="10" fill="#888">
          * Diagram not to scale
        </text>
      </svg>
    </div>
  );
};

export default StaveDiagram;