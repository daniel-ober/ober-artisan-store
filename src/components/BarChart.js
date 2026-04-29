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

  'brightness',

  'projection',

  'sustain',

  'warmth',

  'sensitivity',

  'control',

];

const AXIS_META = {

  attack: {

    label: 'Attack',

    subLabel: 'Strike',

    icon: 'attack',

  },

  brightness: {

    label: 'Brightness',

    subLabel: 'Clarity',

    icon: 'brightness',

  },

  projection: {

    label: 'Projection',

    subLabel: 'Carry',

    icon: 'projection',

  },

  sustain: {

    label: 'Sustain',

    subLabel: 'Bloom',

    icon: 'sustain',

  },

  warmth: {

    label: 'Warmth',

    subLabel: 'Body',

    icon: 'warmth',

  },

  sensitivity: {

    label: 'Sensitivity',

    subLabel: 'Touch',

    icon: 'sensitivity',

  },

  control: {

    label: 'Control',

    subLabel: 'Refinement',

    icon: 'control',

  },

};

const COLOR_BY_KEY = {

  attack: '#ff7448',

  brightness: '#e7d98f',

  projection: '#ffb53a',

  sustain: '#4d86ff',

  warmth: '#c1682e',

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

  mode = 'standalone',

}) => {

  const isCompareMode = mode === 'compare';

  return (

    <div

      className={`bar-chart-card ${compact ? 'bar-chart-card--compact' : ''} ${

        isCompareMode ? 'bar-chart-card--compare' : 'bar-chart-card--standalone'

      }`}

    >

      {isCompareMode ? (

        <div className="bar-chart-benchmark-guide">

          <span className="bar-chart-benchmark-guide-label">

            Reference Drum Center Line

          </span>

        </div>

      ) : (

        <div className="bar-chart-benchmark-guide bar-chart-benchmark-guide--standalone">

          <span className="bar-chart-benchmark-guide-label">

            Ober Voice Score · 0–10

          </span>

        </div>

      )}

      <div className="bar-chart-list">

        {BAR_ORDER.map((key) => {

          const rawValue = Number(data[key] ?? 5);

          const safeValue = clamp(rawValue, 0, 10);

          const deltaFromBenchmark = Number((safeValue - 5).toFixed(1));

          const meta = AXIS_META[key];

          const activeColor = COLOR_BY_KEY[key];

          const isActive = activeKey === key;

          const compareValueCopy =

            deltaFromBenchmark > 0

              ? `+${deltaFromBenchmark.toFixed(1)}`

              : deltaFromBenchmark.toFixed(1);

          const scoreValueCopy = `${safeValue.toFixed(1)}`;

          const fillDirectionClass =

            deltaFromBenchmark > 0

              ? 'is-positive'

              : deltaFromBenchmark < 0

                ? 'is-negative'

                : 'is-benchmark';

          const compareFillWidthPercent = `${Math.abs(deltaFromBenchmark) * 10}%`;

          const standaloneFillWidthPercent = `${safeValue * 10}%`;

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

                    className={`bar-chart-track ${

                      isCompareMode

                        ? 'bar-chart-track--benchmark'

                        : 'bar-chart-track--standalone'

                    }`}

                    style={

                      isActive

                        ? {

                            borderColor: `${activeColor}40`,

                            boxShadow: `0 0 0 1px ${activeColor}22, 0 0 14px ${activeColor}12`,

                          }

                        : undefined

                    }

                  >

                    {isCompareMode && <div className="bar-chart-midline" />}

                    {isCompareMode ? (

                      <div

                        className={`bar-chart-fill-shell ${fillDirectionClass}`}

                        style={{

                          width:

                            deltaFromBenchmark === 0

                              ? '0%'

                              : compareFillWidthPercent,

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

                    ) : (

                      <div

                        className="bar-chart-score-fill-shell"

                        style={{

                          width: standaloneFillWidthPercent,

                        }}

                      >

                        <div

                          className={`bar-chart-fill bar-chart-fill--score ${key}`}

                          style={{

                            boxShadow: isActive

                              ? `0 0 16px ${activeColor}50`

                              : undefined,

                          }}

                        />

                      </div>

                    )}

                  </div>

                </div>

                <div className="bar-chart-difference-cell">

                  <span

                    className={`bar-chart-value--visible ${

                      isCompareMode ? valueClass : 'is-score'

                    }`}

                    style={

                      isCompareMode

                        ? Math.abs(deltaFromBenchmark) >= 0.15

                          ? { color: activeColor }

                          : undefined

                        : { color: activeColor }

                    }

                  >

                    {isCompareMode ? compareValueCopy : scoreValueCopy}

                  </span>

                  {!isCompareMode && (

                    <span className="bar-chart-score-max">/10</span>

                  )}

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