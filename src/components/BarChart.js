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

const BarChart = ({

  data = {},

  min = 1,

  compact = false,

  activeKey = 'attack',

  onAxisChange,

}) => {

  return (

    <div className={`bar-chart-card ${compact ? 'bar-chart-card--compact' : ''}`}>

      <div className="bar-chart-list">

        {BAR_ORDER.map((key) => {

          const rawValue = Number(data[key] ?? 0);

          const clampedValue = Math.max(rawValue, min);

          const percentage = Math.max((clampedValue / 10) * 100, 10);

          const isActive = activeKey === key;

          const activeColor = COLOR_BY_KEY[key];

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

                <span

                  className="bar-chart-value"

                  style={isActive ? { color: activeColor } : undefined}

                >

                  {rawValue.toFixed(1)}/10

                </span>

              </div>

              <div

                className="bar-chart-track"

                style={

                  isActive

                    ? {

                        boxShadow: `0 0 0 1px ${activeColor}33, 0 0 14px ${activeColor}1c`,

                        borderColor: `${activeColor}55`,

                      }

                    : undefined

                }

              >

                <div

                  className={`bar-chart-fill ${key}`}

                  style={{

                    width: `${percentage}%`,

                    boxShadow: isActive

                      ? `0 0 16px ${activeColor}55`

                      : undefined,

                    filter: isActive ? 'brightness(1.08)' : undefined,

                  }}

                />

              </div>

            </button>

          );

        })}

      </div>

    </div>

  );

};

export default BarChart;