
import React from 'react';

import { VOICE_NODE_GUIDE, AXIS_COLOR_BY_KEY, MetricIcon } from './legacyPrintVoiceMappingData';

const CYCLE_STEPS = [

  { nodeKey: 'attack', label: 'Strike', copy: 'The first contact — how quickly the drum answers the player.' },

  { nodeKey: 'brightness', label: 'Answer', copy: 'The first detail the ear catches — clarity, edge, and definition.' },

  { nodeKey: 'projection', label: 'Carry', copy: 'The voice moves into the room or mix.' },

  { nodeKey: 'sustain', label: 'Bloom', copy: 'The note opens after impact.' },

  { nodeKey: 'warmth', label: 'Body', copy: 'The center feels full, round, and woody.' },

  { nodeKey: 'sensitivity', label: 'Touch', copy: 'The drum reacts to lighter hands.' },

  { nodeKey: 'control', label: 'Control', copy: 'Where the sound settles back under the player’s hands.' },

];

const getNode = (nodeKey) => VOICE_NODE_GUIDE.find((node) => node.key === nodeKey);

const LegacyPrintPlayCycle = ({ activeNodeKey, onSelectNode }) => {

  const activeNode = getNode(activeNodeKey) || getNode('attack');

  const activeStep =

    CYCLE_STEPS.find((step) => step.nodeKey === activeNode.key) || CYCLE_STEPS[0];

  return (

    <div className="oad-mode-side-panel oad-play-cycle-side">

      <span className="oad-mode-side-kicker">Play Cycle</span>

      <h4>How the player feels the drum respond.</h4>

      <p>

        The Play Cycle follows the motion of a drum hit as the player experiences it — from first strike,

        to the drum’s answer, to how the sound carries, blooms, fills out, reveals touch, and returns to control.

      </p>

      <div className="oad-cycle-step-list">

        {CYCLE_STEPS.map((step, index) => {

          const node = getNode(step.nodeKey);

          const color = AXIS_COLOR_BY_KEY[step.nodeKey] || '#d6b277';

          const isActive = activeNode.key === step.nodeKey;

          return (

            <button

              key={step.nodeKey}

              type="button"

              className={isActive ? 'is-active' : ''}

              style={{ '--oad-axis-color': color }}

              onClick={() => onSelectNode(step.nodeKey)}

            >

              <small>{String(index + 1).padStart(2, '0')}</small>

              <MetricIcon type={node.icon} color={color} size={15} />

              <strong>{step.label}</strong>

            </button>

          );

        })}

      </div>

      <article

        className="oad-mode-readout-card"

        style={{ '--oad-axis-color': AXIS_COLOR_BY_KEY[activeNode.key] || '#d6b277' }}

      >

        <div className="oad-mode-readout-title">

          <MetricIcon

            type={activeNode.icon}

            color={AXIS_COLOR_BY_KEY[activeNode.key] || '#d6b277'}

            size={18}

          />

          <div>

            <strong>{activeNode.label}</strong>

            <small>

              {activeNode.low} / {activeNode.high}

            </small>

          </div>

        </div>

        <p>{activeNode.meaning}</p>

        <em>{activeStep.copy}</em>

      </article>

      <div className="oad-mode-output-note">

        <strong>Output:</strong>

        <span>Player-feel read, drum response language, and what that response may inspire under the hands.</span>

      </div>

    </div>

  );

};

export default LegacyPrintPlayCycle;

