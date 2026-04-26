import React from 'react';

import {

  Zap,

  Waves,

  Flame,

  Volume2,

  SunMedium,

  Feather,

  Crosshair,

} from 'lucide-react';

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

const AXIS_META = {

  attack: {

    label: 'Attack',

    subLabel: 'Quickness',

    icon: 'attack',

  },

  sustain: {

    label: 'Sustain',

    subLabel: 'Length',

    icon: 'sustain',

  },

  warmth: {

    label: 'Warmth',

    subLabel: 'Body',

    icon: 'warmth',

  },

  projection: {

    label: 'Projection',

    subLabel: 'Throw',

    icon: 'projection',

  },

  brightness: {

    label: 'Brightness',

    subLabel: 'Top End',

    icon: 'brightness',

  },

  sensitivity: {

    label: 'Sensitivity',

    subLabel: 'Response',

    icon: 'sensitivity',

  },

  control: {

    label: 'Control',

    subLabel: 'Focus',

    icon: 'control',

  },

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

const MetricIcon = ({ type = 'attack', color = '#d6b277' }) => {

  const iconProps = {

    size: 18,

    strokeWidth: 2.1,

    color,

    'aria-hidden': true,

  };

  let IconComponent = Zap;

  switch (type) {

    case 'attack':

      IconComponent = Zap;

      break;

    case 'sustain':

      IconComponent = Waves;

      break;

    case 'warmth':

      IconComponent = Flame;

      break;

    case 'projection':

      IconComponent = Volume2;

      break;

    case 'brightness':

      IconComponent = SunMedium;

      break;

    case 'sensitivity':

      IconComponent = Feather;

      break;

    case 'control':

      IconComponent = Crosshair;

      break;

    default:

      IconComponent = Zap;

  }

  return (

    <span className="bar-chart-metric-icon" style={{ color }} aria-hidden="true">

      <IconComponent {...iconProps} />

    </span>

  );

};

const BarChart = ({

  data = {},

  compact = false,

  activeKey = 'attack',

  onAxisChange,

}) => {

  return (

    <div className={`bar-chart-card ${compact ? 'bar-chart-card--compact' : ''}`}>

      <div className="bar-chart-benchmark-guide">

        <span className="bar-chart-benchmark-guide-label">

          Reference Drum Center Line

        </span>

      </div>

      <div className="bar-chart-list">

        {BAR_ORDER.map((key) => {

          const rawValue = Number(data[key] ?? 5);

          const safeValue = clamp(rawValue, 0, 10);

          const deltaFromBenchmark = Number((safeValue - 5).toFixed(1));

          const meta = AXIS_META[key];

          const activeColor = COLOR_BY_KEY[key];

          const isActive = activeKey === key;

          const valueCopy =

            deltaFromBenchmark > 0

              ? `+${deltaFromBenchmark.toFixed(1)}`

              : deltaFromBenchmark.toFixed(1);

          const fillDirectionClass =

            deltaFromBenchmark > 0

              ? 'is-positive'

              : deltaFromBenchmark < 0

                ? 'is-negative'

                : 'is-benchmark';

          const fillWidthPercent = `${Math.abs(deltaFromBenchmark) * 10}%`;

          const valueClass =

            Math.abs(deltaFromBenchmark) < 0.15

              ? 'is-neutral'

              : deltaFromBenchmark > 0

                ? 'is-positive'

                : 'is-negative';

          return (

            <button

              key={key}

              type="button"

              className={`bar-chart-row ${isActive ? 'is-active' : ''}`}

              onMouseEnter={() => onAxisChange?.(key)}

              onFocus={() => onAxisChange?.(key)}

              onClick={() => onAxisChange?.(key)}

              style={{ '--bar-accent': activeColor }}

              aria-pressed={isActive}

            >

              <div className="bar-chart-row-main">

                <div className="bar-chart-attribute-cell">

                  <MetricIcon type={meta.icon} color={activeColor} />

                  <div className="bar-chart-attribute-copy">

                    <span

                      className="bar-chart-label"

                      style={isActive ? { color: activeColor } : undefined}

                    >

                      {meta.label}

                    </span>

                    <span className="bar-chart-sub-label">{meta.subLabel}</span>

                  </div>

                </div>

                <div className="bar-chart-track-cell">

                  <div

                    className="bar-chart-track bar-chart-track--benchmark"

                    style={

                      isActive

                        ? {

                            borderColor: `${activeColor}40`,

                            boxShadow: `0 0 0 1px ${activeColor}22, 0 0 14px ${activeColor}12`,

                          }

                        : undefined

                    }

                  >

                    <div className="bar-chart-midline" />

                    <div

                      className={`bar-chart-fill-shell ${fillDirectionClass}`}

                      style={{

                        width: deltaFromBenchmark === 0 ? '0%' : fillWidthPercent,

                      }}

                    >

                      <div

                        className={`bar-chart-fill ${key}`}

                        style={{

                          boxShadow: isActive

                            ? `0 0 16px ${activeColor}50`

                            : undefined,

                        }}

                      />

                    </div>

                  </div>

                </div>

                <div className="bar-chart-difference-cell">

                  <span

                    className={`bar-chart-value--visible ${valueClass}`}

                    style={

                      Math.abs(deltaFromBenchmark) >= 0.15

                        ? { color: activeColor }

                        : undefined

                    }

                  >

                    {valueCopy}

                  </span>

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