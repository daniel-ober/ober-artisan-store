import React from 'react';
import './BarChart.css';

const BAR_ORDER = [
  'attack',
  'sustain',
  'warmth',
  'projection',
  'brightness',
  'sensitivity',
  'control',
];

const LABELS = {
  attack: 'Attack',
  sustain: 'Sustain',
  warmth: 'Warmth',
  projection: 'Projection',
  brightness: 'Brightness',
  sensitivity: 'Sensitivity',
  control: 'Control',
};

const BarChart = ({ data = {}, min = 1, compact = false }) => {
  return (
    <div className={`bar-chart-card ${compact ? 'bar-chart-card--compact' : ''}`}>
      <div className="bar-chart-list">
        {BAR_ORDER.map((key) => {
          const rawValue = Number(data[key] ?? 0);
          const clampedValue = Math.max(rawValue, min);
          const percentage = Math.max((clampedValue / 10) * 100, 10);

          return (
            <div key={key} className="bar-chart-row">
              <div className="bar-chart-row-top">
                <span className="bar-chart-label">{LABELS[key]}</span>
                <span className="bar-chart-value">{rawValue.toFixed(2)}/10</span>
              </div>

              <div className="bar-chart-track">
                <div
                  className={`bar-chart-fill ${key}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BarChart;