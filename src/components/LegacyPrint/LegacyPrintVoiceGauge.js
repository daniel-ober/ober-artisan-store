
import React from 'react';

import {

  VOICE_NODE_GUIDE,

  AXIS_COLOR_BY_KEY,

  MetricIcon,

} from './legacyPrintVoiceMappingData';

const GAUGE_VIEWS = [

  { id: 'balanced', label: 'Balanced Spider' },

  { id: 'current', label: 'Current Spider' },

  { id: 'spiderCompare', label: 'Spider Compare' },

  { id: 'bars', label: 'Bars' },

  { id: 'rangeBars', label: 'Range Bars' },

  { id: 'barCompare', label: 'Compare Bars' },

];

const BAR_VALUES = {

  attack: 78,

  brightness: 64,

  projection: 82,

  sustain: 58,

  warmth: 70,

  sensitivity: 66,

  control: 84,

};

const RANGE_VALUES = {

  attack: [56, 84],

  brightness: [48, 78],

  projection: [56, 86],

  sustain: [46, 76],

  warmth: [44, 72],

  sensitivity: [52, 82],

  control: [48, 76],

};

const REFERENCE_VALUES = {

  attack: 58,

  brightness: 52,

  projection: 61,

  sustain: 48,

  warmth: 76,

  sensitivity: 54,

  control: 68,

};

const LegacyPrintVoiceGauge = ({ gaugeView, onChangeGaugeView }) => {

  const showBars = ['bars', 'rangeBars', 'barCompare'].includes(gaugeView);

  return (

    <div className="oad-mode-side-panel oad-gauge-side">

      <span className="oad-mode-side-kicker">Voice Gauge</span>

      <h4>How a drum compares.</h4>

      <p>

        Voice Gauge turns the seven nodes into a measurable shape. The main

        polygon is the spider graph; bars are alternate readout views.

      </p>

      <div className="oad-view-option-grid">

        {GAUGE_VIEWS.map((view) => (

          <button

            key={view.id}

            type="button"

            className={gaugeView === view.id ? 'is-active' : ''}

            onClick={() => onChangeGaugeView(view.id)}

          >

            {view.label}

          </button>

        ))}

      </div>

      {showBars && (

        <div className="oad-side-bars">

          {VOICE_NODE_GUIDE.map((node) => {

            const color = AXIS_COLOR_BY_KEY[node.key] || '#d6b277';

            const [start, end] = RANGE_VALUES[node.key] || [35, 70];

            return (

              <div

                key={node.key}

                className={`oad-side-bar-row ${

                  gaugeView === 'rangeBars' ? 'is-range' : ''

                } ${gaugeView === 'barCompare' ? 'is-compare' : ''}`}

                style={{

                  '--oad-axis-color': color,

                  '--oad-bar-value': `${BAR_VALUES[node.key]}%`,

                  '--oad-range-start': `${start}%`,

                  '--oad-range-width': `${end - start}%`,

                  '--oad-reference-value': `${REFERENCE_VALUES[node.key]}%`,

                }}

              >

                <MetricIcon type={node.icon} color={color} size={14} />

                <span>{node.label}</span>

                <i />

              </div>

            );

          })}

        </div>

      )}

      <div className="oad-mode-output-note">

        <strong>Output:</strong>

        <span>Shape summary, strongest traits, reference delta, and range read.</span>

      </div>

    </div>

  );

};

export default LegacyPrintVoiceGauge;

