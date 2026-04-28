
import React, { useMemo, useState } from 'react';

import LegacyPrintInteractivePolygon from './LegacyPrintInteractivePolygon';

import LegacyPrintModeTabs from './LegacyPrintModeTabs';

import {

  AXIS_COLOR_BY_KEY,

  LEGACYPRINT_AXIS_META,

  MetricIcon,

} from './legacyPrintVoiceMapData';

import './LegacyPrintVoiceMapModal.css';

const NODE_ORDER = [

  'attack',

  'brightness',

  'projection',

  'sustain',

  'warmth',

  'sensitivity',

  'control',

];

const NODE_LABELS = {

  attack: 'Attack',

  brightness: 'Brightness',

  projection: 'Projection',

  sustain: 'Sustain',

  warmth: 'Warmth',

  sensitivity: 'Sensitivity',

  control: 'Control',

};

const NODE_LOW_HIGH = {

  attack: ['Rounded', 'Immediate'],

  brightness: ['Dark', 'Bright'],

  projection: ['Close', 'Forward'],

  sustain: ['Short', 'Open'],

  warmth: ['Lean', 'Warm'],

  sensitivity: ['Forgiving', 'Responsive'],

  control: ['Open', 'Composed'],

};

const NODE_PLAY_STEPS = {

  attack: {

    number: '01',

    step: 'Strike',

    detail:

      'The first contact. How quickly the drum answers the stick and gives the player something to react to.',

    closing: 'The note begins.',

  },

  brightness: {

    number: '02',

    step: 'Clarity',

    detail:

      'The edge and top-end detail that helps the player hear definition, crispness, and presence.',

    closing: 'The edge appears.',

  },

  projection: {

    number: '03',

    step: 'Carry',

    detail:

      'How the sound moves away from the kit and pushes into the room, band, or mix.',

    closing: 'The voice moves outward.',

  },

  sustain: {

    number: '04',

    step: 'Bloom',

    detail:

      'What remains after the hit. The note can open, linger, breathe, or stay short and contained.',

    closing: 'The note breathes.',

  },

  warmth: {

    number: '05',

    step: 'Body',

    detail:

      'The low-mid center, woodiness, and fullness that make the drum feel round or grounded under the player.',

    closing: 'The drum gains weight.',

  },

  sensitivity: {

    number: '06',

    step: 'Touch',

    detail:

      'How small changes in hand, ghost notes, and dynamics come back through the shell and wires.',

    closing: 'The player feels response.',

  },

  control: {

    number: '07',

    step: 'Refinement',

    detail:

      'How organized the note feels after everything else has happened. Control brings the sound back into focus.',

    closing: 'The sound becomes usable.',

  },

};

const GAUGE_VALUES = {

  attack: 6.1,

  brightness: 6.8,

  projection: 7.2,

  sustain: 5.4,

  warmth: 5.7,

  sensitivity: 7.8,

  control: 6.4,

};

const MODE_TABS = [

  {

    id: 'playCycle',

    label: 'PLAY CYCLE',

    sublabel: 'How the player feels the drum respond',

  },

  {

    id: 'voiceGauge',

    label: 'VOICE GAUGE',

    sublabel: 'How a drum compares',

  },

  {

    id: 'relationship',

    label: 'TONAL RELATIONSHIP',

    sublabel: 'How traits connect',

  },

  {

    id: 'voiceFinder',

    label: 'VOICE FINDER',

    sublabel: 'Guided discovery',

  },

];

const RELATIONSHIPS = [

  {

    id: 'attack_brightness',

    label: 'Snap with clarity',

    tag: 'front edge + detail',

    from: 'attack',

    to: 'brightness',

    text: 'How fast the drum speaks and how clearly that first edge is heard.',

  },

  {

    id: 'brightness_projection',

    label: 'Cut that carries',

    tag: 'clarity + throw',

    from: 'brightness',

    to: 'projection',

    text: 'How bright detail helps the drum move through a room or mix.',

  },

  {

    id: 'projection_sustain',

    label: 'Forward bloom',

    tag: 'carry + openness',

    from: 'projection',

    to: 'sustain',

    text: 'The drum pushes into the room and lets the note breathe after the hit.',

  },

  {

    id: 'sustain_warmth',

    label: 'Bloom with body',

    tag: 'length + fullness',

    from: 'sustain',

    to: 'warmth',

    text: 'How the lingering note carries weight, roundness, and low-mid center.',

  },

  {

    id: 'warmth_sensitivity',

    label: 'Touch tone',

    tag: 'body + response',

    from: 'warmth',

    to: 'sensitivity',

    text: 'How full the drum feels while still reacting to lighter playing.',

  },

  {

    id: 'sensitivity_control',

    label: 'Responsive precision',

    tag: 'touch + focus',

    from: 'sensitivity',

    to: 'control',

    text: 'How much detail the drum reveals without becoming messy or unruly.',

  },

  {

    id: 'attack_warmth',

    label: 'Crack with body',

    tag: 'strike + fullness',

    from: 'attack',

    to: 'warmth',

    text: 'How the first hit balances with fullness underneath it.',

  },

  {

    id: 'projection_control',

    label: 'Power with focus',

    tag: 'carry + refinement',

    from: 'projection',

    to: 'control',

    text: 'How strongly the drum carries without getting chaotic.',

  },

  {

    id: 'brightness_control',

    label: 'Cut without harshness',

    tag: 'clarity + control',

    from: 'brightness',

    to: 'control',

    text: 'How clear the top end feels while staying refined and musical.',

  },

  {

    id: 'sustain_control',

    label: 'Open but controlled',

    tag: 'bloom + focus',

    from: 'sustain',

    to: 'control',

    text: 'How the drum breathes without becoming too ringy or uncontrolled.',

  },

  {

    id: 'warmth_control',

    label: 'Warmth without mud',

    tag: 'body + focus',

    from: 'warmth',

    to: 'control',

    text: 'How full the drum feels while staying shaped and usable.',

  },

  {

    id: 'brightness_warmth',

    label: 'Crisp but full',

    tag: 'top end + body',

    from: 'brightness',

    to: 'warmth',

    text: 'How the drum keeps clarity while still feeling round and musical.',

  },

];

const FINDER_QUESTIONS = [

  {

    question: 'What are you trying to hear or feel more of?',

    options: [

      { label: 'Snap', key: 'attack' },

      { label: 'Body', key: 'warmth' },

      { label: 'Cut', key: 'brightness' },

      { label: 'Power', key: 'projection' },

      { label: 'Touch', key: 'sensitivity' },

      { label: 'Control', key: 'control' },

    ],

  },

  {

    question: 'What should the drum avoid?',

    options: [

      { label: 'Too harsh', key: 'brightness' },

      { label: 'Too ringy', key: 'sustain' },

      { label: 'Too thin', key: 'warmth' },

      { label: 'Too messy', key: 'control' },

      { label: 'Too quiet', key: 'projection' },

      { label: 'Too stiff', key: 'sensitivity' },

    ],

  },

  {

    question: 'What should lead the voice?',

    options: [

      { label: 'Strike', key: 'attack' },

      { label: 'Clarity', key: 'brightness' },

      { label: 'Carry', key: 'projection' },

      { label: 'Bloom', key: 'sustain' },

      { label: 'Touch', key: 'sensitivity' },

      { label: 'Focus', key: 'control' },

    ],

  },

];

const getMeta = (key) => {

  const label = NODE_LABELS[key];

  const meta = LEGACYPRINT_AXIS_META?.[label] || LEGACYPRINT_AXIS_META?.[key] || {};

  const [low, high] = NODE_LOW_HIGH[key] || ['', ''];

  return {

    key,

    label,

    low: meta.low || low,

    high: meta.high || high,

    sublabel: meta.sublabel || '',

    meaning:

      meta.meaning ||

      NODE_PLAY_STEPS[key]?.detail ||

      'A core part of how the drum speaks, feels, and responds.',

    drummerRead:

      meta.drummerRead ||

      'This trait helps describe what the player hears and feels back from the drum.',

  };

};

const getRelationshipById = (id) =>

  RELATIONSHIPS.find((relationship) => relationship.id === id) ||

  RELATIONSHIPS.find(

    (relationship) =>

      [relationship.from, relationship.to].sort().join('_') === id

  ) ||

  RELATIONSHIPS[6];

const getGaugeOverallRead = () => {

  const entries = Object.entries(GAUGE_VALUES).sort((a, b) => b[1] - a[1]);

  const strongest = entries[0];

  const second = entries[1];

  const softest = entries[entries.length - 1];

  return `Overall, this reads as a ${NODE_LABELS[

    strongest[0]

  ].toLowerCase()}-led voice with strong ${NODE_LABELS[

    second[0]

  ].toLowerCase()} and a more restrained ${NODE_LABELS[

    softest[0]

  ].toLowerCase()} area. Compared to the neutral reference drum, it should feel more expressive and forward where the colored shape pushes outside the dotted line.`;

};

const getGaugeNodeRead = (key) => {

  const value = Number(GAUGE_VALUES[key] || 5);

  const delta = value - 5;

  const meta = getMeta(key);

  const direction = delta >= 0 ? 'above' : 'below';

  const amount = Math.abs(delta).toFixed(1);

  return `${meta.label} is ${amount} points ${direction} the neutral reference. That means this configuration leans more toward “${delta >= 0 ? meta.high : meta.low}” for this trait.`;

};

const LegacyPrintVoiceMapModal = ({ onClose }) => {

  const [activeMode, setActiveMode] = useState('playCycle');

  const [activeNodeKey, setActiveNodeKey] = useState('attack');

  const [activeRelationshipId, setActiveRelationshipId] = useState('attack_warmth');

  const [finderAnswers, setFinderAnswers] = useState([]);

  const [finderStepIndex, setFinderStepIndex] = useState(0);

  const activeNode = useMemo(() => getMeta(activeNodeKey), [activeNodeKey]);

  const activePlayStep = NODE_PLAY_STEPS[activeNodeKey] || NODE_PLAY_STEPS.attack;

  const activeRelationship = useMemo(

    () => getRelationshipById(activeRelationshipId),

    [activeRelationshipId]

  );

  const activeFinderQuestion =

    FINDER_QUESTIONS[finderStepIndex] ||

    FINDER_QUESTIONS[FINDER_QUESTIONS.length - 1];

  const handleFinderAnswer = (key) => {

    setFinderAnswers((current) => [...current, key]);

    setActiveNodeKey(key);

    setFinderStepIndex((current) =>

      Math.min(current + 1, FINDER_QUESTIONS.length - 1)

    );

  };

  const handleModeChange = (modeId) => {

    setActiveMode(modeId);

    if (modeId === 'voiceGauge') {

      setActiveNodeKey('projection');

    }

    if (modeId === 'relationship') {

      setActiveRelationshipId('attack_warmth');

    }

    if (modeId === 'playCycle') {

      setActiveNodeKey('attack');

    }

  };

  return (

    <div className="lp-modal-page" role="dialog" aria-modal="true">

      <button

        type="button"

        className="lp-modal-close"

        onClick={onClose}

        aria-label="Close Voice Map Reference"

      >

        ×

      </button>

      <div className="lp-modal-shell">

        <header className="lp-modal-header">

          <span className="lp-kicker">LegacyPrint™ Sound Guide</span>

          <h2>Voice Map Reference</h2>

          <p>A seven-point listening framework for drum tone, feel, and response.</p>

        </header>

        <LegacyPrintModeTabs

          modes={MODE_TABS}

          activeMode={activeMode}

          onChange={handleModeChange}

        />

        <div className="lp-modal-workspace">

          <LegacyPrintInteractivePolygon

            mode={activeMode}

            activeNodeKey={activeNodeKey}

            onSelectNode={setActiveNodeKey}

            activeRelationshipId={activeRelationshipId}

            onSelectRelationship={setActiveRelationshipId}

            gaugeValues={GAUGE_VALUES}

            finderAnswers={finderAnswers}

          />

          <aside className="lp-readout-panel">

            {activeMode === 'playCycle' && (

              <>

                <span className="lp-panel-kicker">Play Cycle</span>

                <h3>How the player feels the drum respond.</h3>

                <p>

                  This mode follows the felt experience of a hit: the first

                  strike, the clarity that follows, how it carries, how it

                  blooms, how it fills out, how it reacts to touch, and how it

                  comes back into focus.

                </p>

                <div className="lp-step-grid">

                  {NODE_ORDER.map((key) => {

                    const step = NODE_PLAY_STEPS[key];

                    const color = AXIS_COLOR_BY_KEY[key];

                    return (

                      <button

                        key={key}

                        type="button"

                        className={`lp-step-pill ${

                          activeNodeKey === key ? 'is-active' : ''

                        }`}

                        onClick={() => setActiveNodeKey(key)}

                        style={{ '--axis-color': color }}

                      >

                        <span>{step.number}</span>

                        <MetricIcon type={key} color={color} size={14} />

                        <strong>{step.step}</strong>

                      </button>

                    );

                  })}

                </div>

                <div

                  className="lp-detail-card"

                  style={{ '--axis-color': AXIS_COLOR_BY_KEY[activeNodeKey] }}

                >

                  <div className="lp-detail-title">

                    <MetricIcon

                      type={activeNodeKey}

                      color={AXIS_COLOR_BY_KEY[activeNodeKey]}

                      size={18}

                    />

                    <div>

                      <strong>{activeNode.label}</strong>

                      <small>

                        {activeNode.low} / {activeNode.high}

                      </small>

                    </div>

                  </div>

                  <p>{activePlayStep.detail}</p>

                  <b>{activePlayStep.closing}</b>

                </div>

                <div className="lp-output-card">

                  <strong>Output:</strong>

                  <span>Node definition, player response, and note-cycle position.</span>

                </div>

              </>

            )}

            {activeMode === 'voiceGauge' && (

              <>

                <span className="lp-panel-kicker">Voice Gauge</span>

                <h3>How a drum compares.</h3>

                <p>

                  Voice Gauge turns the seven nodes into a measurable shape. The

                  dotted reference is a neutral 5-point drum. The colored shape

                  shows the current configuration.

                </p>

                <div className="lp-option-grid">

                  {[

                    'Balanced Spider',

                    'Current Spider',

                    'Spider Compare',

                    'Bars',

                    'Range Bars',

                    'Compare Bars',

                  ].map((label, index) => (

                    <button

                      key={label}

                      type="button"

                      className={index === 0 ? 'is-active' : ''}

                    >

                      {label}

                    </button>

                  ))}

                </div>

                <div className="lp-output-card lp-output-card-readable">

                  <strong>Overall drum read</strong>

                  <span>{getGaugeOverallRead()}</span>

                </div>

                <div

                  className="lp-detail-card"

                  style={{ '--axis-color': AXIS_COLOR_BY_KEY[activeNodeKey] }}

                >

                  <div className="lp-detail-title">

                    <MetricIcon

                      type={activeNodeKey}

                      color={AXIS_COLOR_BY_KEY[activeNodeKey]}

                      size={18}

                    />

                    <div>

                      <strong>{activeNode.label}</strong>

                      <small>

                        Current: {GAUGE_VALUES[activeNodeKey].toFixed(1)} / Reference: 5.0

                      </small>

                    </div>

                  </div>

                  <p>{getGaugeNodeRead(activeNodeKey)}</p>

                </div>

              </>

            )}

            {activeMode === 'relationship' && (

              <>

                <span className="lp-panel-kicker">Tonal Relationship</span>

                <h3>How traits connect.</h3>

                <p>

                  Tap a connector line to see how two traits shape one another.

                  Selected lines blend the colors of the two connected nodes.

                </p>

                <div

                  className="lp-detail-card"

                  style={{

                    '--axis-color':

                      AXIS_COLOR_BY_KEY[activeRelationship.from] || '#d6b277',

                  }}

                >

                  <strong>{activeRelationship.label}</strong>

                  <small>{activeRelationship.tag}</small>

                  <p>{activeRelationship.text}</p>

                </div>

                <div className="lp-relationship-list">

                  {RELATIONSHIPS.map((relationship) => (

                    <button

                      key={relationship.id}

                      type="button"

                      className={

                        activeRelationshipId === relationship.id ? 'is-active' : ''

                      }

                      onClick={() => setActiveRelationshipId(relationship.id)}

                    >

                      {relationship.label}

                    </button>

                  ))}

                </div>

                <div className="lp-output-card">

                  <strong>Output:</strong>

                  <span>Relationship phrase, meaning, and build implication.</span>

                </div>

              </>

            )}

            {activeMode === 'voiceFinder' && (

              <>

                <span className="lp-panel-kicker">Voice Finder</span>

                <h3>One guided session. One Voice Target.</h3>

                <p>

                  Voice Finder uses the map as an adaptive discovery tool. Each

                  answer shifts the network and helps translate player language

                  into a clear drum direction.

                </p>

                <div className="lp-finder-question-card">

                  <strong>{activeFinderQuestion.question}</strong>

                  <div className="lp-finder-answer-grid">

                    {activeFinderQuestion.options.map((option) => (

                      <button

                        key={option.label}

                        type="button"

                        onClick={() => handleFinderAnswer(option.key)}

                      >

                        {option.label}

                      </button>

                    ))}

                  </div>

                </div>

                <div className="lp-output-card lp-output-card-readable">

                  <strong>Live readout</strong>

                  <span>

                    {finderAnswers.length === 0

                      ? 'Start with one answer. The map will begin shaping a custom Voice Target.'

                      : `Current direction is leaning toward ${finderAnswers

                          .map((key) => NODE_LABELS[key])

                          .join(', ')}.`}

                  </span>

                </div>

              </>

            )}

          </aside>

        </div>

      </div>

    </div>

  );

};

export default LegacyPrintVoiceMapModal;

