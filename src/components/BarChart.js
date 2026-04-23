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

const COLOR_BY_KEY = {
  attack: '#ff7448',

  sustain: '#4d86ff',

  warmth: '#c1682e',

  projection: '#ffb53a',

  brightness: '#e7d98f',

  sensitivity: '#68d9df',

  control: '#9e8bff',
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const BarChart = ({
  data = {},

  compact = false,

  activeKey = 'attack',

  onAxisChange,

  pulseKey = 0,
}) => {
  return (
    <div
      key={pulseKey}
      className={`bar-chart-card ${compact ? 'bar-chart-card--compact' : ''} bar-chart-card--benchmark-pulse`}
    >
      <div className="bar-chart-benchmark-guide">
        {/* <span className="bar-chart-benchmark-guide-label bar-chart-benchmark-guide-label--left">
          Less
        </span> */}

        <span className="bar-chart-benchmark-guide-label bar-chart-benchmark-guide-label--center">

  Reference Drum

</span>

        {/* <span className="bar-chart-benchmark-guide-label bar-chart-benchmark-guide-label--right">
          More
        </span> */}
      </div>

      <div className="bar-chart-list">
        {BAR_ORDER.map((key) => {
          const rawValue = Number(data[key] ?? 5);

          const safeValue = clamp(rawValue, 0, 10);

          const deltaFromBenchmark = Number((safeValue - 5).toFixed(1));

          const isActive = activeKey === key;

          const activeColor = COLOR_BY_KEY[key];

          const fillWidthPercent = `${Math.abs(deltaFromBenchmark) * 10}%`;

          const fillDirectionClass =
            deltaFromBenchmark > 0
              ? 'is-positive'
              : deltaFromBenchmark < 0
                ? 'is-negative'
                : 'is-benchmark';

          const valueCopy =
            deltaFromBenchmark > 0
              ? `+${deltaFromBenchmark.toFixed(1)}`
              : deltaFromBenchmark.toFixed(1);
          return (
            <button
              key={key}
              type="button"
              className={`bar-chart-row ${isActive ? 'is-active' : ''}`}
              onMouseEnter={() => onAxisChange?.(key)}
              onClick={() => onAxisChange?.(key)}
              style={{
                background: 'transparent',

                border: 'none',

                padding: 0,

                textAlign: 'left',

                cursor: 'pointer',

                borderRadius: '10px',

                boxShadow: isActive
                  ? `0 0 0 1px ${activeColor}22, 0 0 18px ${activeColor}20`
                  : 'none',

                transition: 'box-shadow 160ms ease, transform 160ms ease',
              }}
            >
              <div className="bar-chart-row-top">
                <span
                  className="bar-chart-label"
                  style={isActive ? { color: activeColor } : undefined}
                >
                  {LABELS[key]}
                </span>

                <div className="bar-chart-value-group">
                  <span
                    className="bar-chart-value"
                    style={isActive ? { color: activeColor } : undefined}
                  >
                    {valueCopy}
                  </span>
                </div>
              </div>

              <div
                className="bar-chart-track bar-chart-track--benchmark"
                style={
                  isActive
                    ? {
                        boxShadow: `0 0 0 1px ${activeColor}33, 0 0 14px ${activeColor}1c`,

                        borderColor: `${activeColor}55`,
                      }
                    : undefined
                }
              >
                <div className="bar-chart-midline" />

                <div
                  className={`bar-chart-fill-shell ${fillDirectionClass}`}
                  style={{
                    width:
                      deltaFromBenchmark === 0
                        ? '0%'
                        : `calc(${fillWidthPercent})`,
                  }}
                >
                  <div
                    className={`bar-chart-fill ${key}`}
                    style={{
                      boxShadow: isActive
                        ? `0 0 16px ${activeColor}55`
                        : undefined,

                      filter: isActive ? 'brightness(1.08)' : undefined,
                    }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BarChart;
