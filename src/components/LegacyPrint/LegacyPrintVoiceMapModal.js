import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import ReactDOM from 'react-dom';

import LegacyPrintInteractivePolygon from './LegacyPrintInteractivePolygon';

import LegacyPrintModeTabs from './LegacyPrintModeTabs';

import {

  LEGACYPRINT_SNARE_SAMPLES,

  playLegacyPrintSnare,

} from '../../utils/legacyPrintAudioEngine';

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

const NODE_VOICE_NAMES = {

  attack: 'Strike',

  brightness: 'Clarity',

  projection: 'Carry',

  sustain: 'Bloom',

  warmth: 'Body',

  sensitivity: 'Touch',

  control: 'Refinement',

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

const RESET_PLAY_VALUES = {

  attack: 5,

  brightness: 5,

  projection: 5,

  sustain: 5,

  warmth: 5,

  sensitivity: 5,

  control: 5,

};

const NODE_PLAY_STEPS = {

  attack: {

    number: '01',

    step: 'Strike',

    detail:

      'Attack is the front edge of the drum. It is the first thing the stick gives back to the player: soft and woody on one end, quick and immediate on the other.',

    hear: 'How fast the drum speaks when the stick first touches the head.',

    words: ['rounded', 'quick', 'crisp', 'immediate'],

    affects: ['bearing edge', 'head choice', 'shell stiffness', 'tuning'],

    closing: 'The note begins.',

  },

  brightness: {

    number: '02',

    step: 'Clarity',

    detail:

      'Brightness is the upper edge of the voice. It is where definition, crispness, and top-end detail help the drum stay clear under the hands and in the room.',

    hear: 'How much top-end detail and clean separation the note carries.',

    words: ['dark', 'clear', 'crisp', 'cutting'],

    affects: ['head coating', 'rim choice', 'wire response', 'room brightness'],

    closing: 'The edge appears.',

  },

  projection: {

    number: '03',

    step: 'Carry',

    detail:

      'Projection is how far the drum steps away from the kit. Some voices stay close and controlled. Others move forward and take up more space in the band or room.',

    hear: 'How strongly the drum moves outward after the first hit.',

    words: ['close', 'present', 'forward', 'commanding'],

    affects: ['shell depth', 'material', 'hoops', 'tuning range'],

    closing: 'The voice moves outward.',

  },

  sustain: {

    number: '04',

    step: 'Bloom',

    detail:

      'Sustain is the part of the note that stays after the first hit. Some snares dry up quickly. Others open, bloom, and leave more air around the stroke.',

    hear: 'How long the note breathes after impact.',

    words: ['short', 'open', 'airy', 'dry'],

    affects: ['heads', 'muffling', 'shell thickness', 'room response'],

    closing: 'The note breathes.',

  },

  warmth: {

    number: '05',

    step: 'Body',

    detail:

      'Warmth is the center and weight of the drum. It is the wood, low-mid fullness, and roundness that keeps the voice from feeling thin or papery.',

    hear: 'How much fullness and low-mid center sits underneath the note.',

    words: ['lean', 'round', 'woody', 'full'],

    affects: ['wood species', 'shell depth', 'edge shape', 'head pairing'],

    closing: 'The drum gains weight.',

  },

  sensitivity: {

    number: '06',

    step: 'Touch',

    detail:

      'Sensitivity is how easily the drum wakes up under lighter playing. A more sensitive drum reveals wire detail, head contact, and low-level shell response without needing to be hit as hard.',

    hear: 'How easily ghost notes, smaller motions, and lighter strokes speak.',

    words: ['forgiving', 'responsive', 'alive', 'detailed'],

    affects: ['snare wires', 'snare bed', 'head tension', 'bearing edge'],

    closing: 'The player feels response.',

  },

  control: {

    number: '07',

    step: 'Refinement',

    detail:

      'Control is how organized the finished note feels. It does not mean dead or muted. It means the drum gives the player something musical, focused, and usable.',

    hear: 'How focused and manageable the full voice feels after the hit.',

    words: ['open', 'focused', 'composed', 'finished'],

    affects: ['muffling', 'wire balance', 'tuning', 'overall build design'],

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

    sublabel: 'How a hit unfolds',

  },

  {

    id: 'voiceSculptor',

    label: 'VOICE SCULPTOR',

    sublabel: 'Shape and audition',

  },

  {

    id: 'voiceGauge',

    label: 'VOICE GAUGE',

    sublabel: 'How the shape reads',

  },

  {

    id: 'relationship',

    label: 'NODE RELATIONSHIPS',

    sublabel: 'How traits connect',

  },

  {

    id: 'voiceFinder',

    label: 'VOICE FINDER',

    sublabel: 'Guided preview',

  },

];

const GAUGE_VIEW_OPTIONS = [

  {

    id: 'shape',

    label: 'Shape',

    title: 'Read the shape like a drum voice.',

    text:

      'Wider areas show where the drum has more of a trait. Tighter areas show where the voice is more restrained.',

  },

  {

    id: 'balance',

    label: 'Balance',

    title: 'Look for the lean, not just the score.',

    text:

      'A useful drum voice does not need to be flat or neutral. The map helps show which traits lead and which traits support the player.',

  },

  {

    id: 'playerRead',

    label: 'Player Read',

    title: 'Turn the chart into drummer language.',

    text:

      'The map matters most when it helps someone say what they actually hear and feel: quick, warm, open, controlled, sensitive, forward, or refined.',

  },

];

const RELATIONSHIPS = [

  {

    id: 'attack_brightness',

    label: 'Snap with clarity',

    tag: 'Attack + Brightness',

    from: 'attack',

    to: 'brightness',

    text: 'How the first edge of the note stays clean and easy to hear.',

    hear:

      'A quicker front edge with enough top-end detail to feel crisp and articulate.',

    playerWords: ['snappy', 'crisp', 'clean crack'],

    watchOut:

      'Too much of this pairing can start to feel sharp if the body underneath is missing.',

  },

  {

    id: 'brightness_projection',

    label: 'Cut that carries',

    tag: 'Brightness + Projection',

    from: 'brightness',

    to: 'projection',

    text: 'How clear top-end detail helps the drum move through a room or mix.',

    hear:

      'A drum that does not just sound clear up close, but keeps that clarity as it moves outward.',

    playerWords: ['cuts', 'present', 'speaks through the band'],

    watchOut:

      'Too much top-end carry can feel harsh in bright rooms or close microphones.',

  },

  {

    id: 'projection_sustain',

    label: 'Forward bloom',

    tag: 'Projection + Sustain',

    from: 'projection',

    to: 'sustain',

    text: 'How the drum pushes forward while still letting the note breathe.',

    hear:

      'A voice that projects strongly and leaves air or ring behind the initial stroke.',

    playerWords: ['big', 'open', 'roomy'],

    watchOut:

      'If the bloom is not controlled, the drum may feel too wide or ringy.',

  },

  {

    id: 'sustain_warmth',

    label: 'Bloom with body',

    tag: 'Sustain + Warmth',

    from: 'sustain',

    to: 'warmth',

    text: 'How the lingering note keeps weight and roundness underneath it.',

    hear:

      'A note that opens up without getting thin, papery, or all top-end.',

    playerWords: ['warm ring', 'round', 'full sustain'],

    watchOut:

      'Too much warmth and bloom can become cloudy if the refinement is low.',

  },

  {

    id: 'warmth_sensitivity',

    label: 'Touch tone',

    tag: 'Warmth + Sensitivity',

    from: 'warmth',

    to: 'sensitivity',

    text: 'How the drum keeps body while still reacting to lighter playing.',

    hear:

      'A drum that keeps weight under the note even when the player backs off.',

    playerWords: ['easy', 'expressive', 'warm under the hands'],

    watchOut:

      'If the response is too soft, the drum can feel less precise under faster playing.',

  },

  {

    id: 'sensitivity_control',

    label: 'Responsive precision',

    tag: 'Sensitivity + Control',

    from: 'sensitivity',

    to: 'control',

    text: 'How much detail the drum reveals without becoming messy or unruly.',

    hear:

      'A sensitive drum that still keeps ghost notes, wires, and overtones organized.',

    playerWords: ['detailed', 'controlled', 'clean response'],

    watchOut:

      'Too much control can make a sensitive drum feel less alive.',

  },

  {

    id: 'attack_warmth',

    label: 'Crack with body',

    tag: 'Attack + Warmth',

    from: 'attack',

    to: 'warmth',

    text: 'How the first hit balances with fullness underneath it.',

    hear:

      'Clear first contact with enough fullness to avoid sounding thin or papery.',

    playerWords: ['cracky but fat', 'punchy', 'quick but full'],

    watchOut:

      'Too much attack without body can feel thin. Too much body without attack can feel slow.',

  },

  {

    id: 'projection_control',

    label: 'Power with focus',

    tag: 'Projection + Control',

    from: 'projection',

    to: 'control',

    text: 'How strongly the drum carries without getting chaotic.',

    hear:

      'A drum that can step forward in a mix while still sounding organized and usable.',

    playerWords: ['powerful', 'focused', 'mix-ready'],

    watchOut:

      'Too much focus can reduce the sense of size or movement.',

  },

  {

    id: 'brightness_control',

    label: 'Cut without harshness',

    tag: 'Brightness + Control',

    from: 'brightness',

    to: 'control',

    text: 'How clear the top end feels while staying refined and musical.',

    hear:

      'Enough clarity to hear detail, but enough organization to keep the top end from feeling brittle.',

    playerWords: ['clear but smooth', 'crisp not harsh', 'polished'],

    watchOut:

      'If over-controlled, the drum can lose sparkle or openness.',

  },

  {

    id: 'sustain_control',

    label: 'Open but controlled',

    tag: 'Sustain + Control',

    from: 'sustain',

    to: 'control',

    text: 'How the drum breathes without becoming too ringy or uncontrolled.',

    hear:

      'A note that opens after the hit but settles in a way that stays musical.',

    playerWords: ['open but usable', 'controlled ring', 'musical bloom'],

    watchOut:

      'Too much control may make the drum feel dry; too little may make it feel messy.',

  },

  {

    id: 'warmth_control',

    label: 'Warmth without mud',

    tag: 'Warmth + Control',

    from: 'warmth',

    to: 'control',

    text: 'How full the drum feels while staying shaped and usable.',

    hear:

      'Low-mid body that stays focused instead of turning cloudy or undefined.',

    playerWords: ['full but clean', 'warm but focused', 'round'],

    watchOut:

      'Too much body without clarity can disappear in dense mixes.',

  },

  {

    id: 'brightness_warmth',

    label: 'Crisp but full',

    tag: 'Brightness + Warmth',

    from: 'brightness',

    to: 'warmth',

    text: 'How the drum keeps clarity while still feeling round and musical.',

    hear:

      'A voice with enough top-end detail to stay clear and enough center to avoid sounding thin.',

    playerWords: ['crisp and fat', 'clear but warm', 'balanced'],

    watchOut:

      'This pairing needs careful balance; too much of either side can dominate the read.',

  },

];

const FINDER_QUESTIONS = [

  {

    question: 'What are you trying to hear or feel more of?',

    options: [

      { label: 'Snap', key: 'attack', hint: 'More attack' },

      { label: 'Body', key: 'warmth', hint: 'More warmth' },

      { label: 'Cut', key: 'brightness', hint: 'More clarity' },

      { label: 'Power', key: 'projection', hint: 'More projection' },

      { label: 'Touch', key: 'sensitivity', hint: 'More sensitivity' },

      { label: 'Control', key: 'control', hint: 'More refinement' },

    ],

  },

  {

    question: 'What should the drum avoid?',

    options: [

      { label: 'Too harsh', key: 'brightness', hint: 'Tame brightness' },

      { label: 'Too ringy', key: 'sustain', hint: 'Tame bloom' },

      { label: 'Too thin', key: 'warmth', hint: 'Add body' },

      { label: 'Too messy', key: 'control', hint: 'Add focus' },

      { label: 'Too quiet', key: 'projection', hint: 'Add carry' },

      { label: 'Too stiff', key: 'sensitivity', hint: 'Add touch' },

    ],

  },

];

const ENGINE_MODES = [

  {

    id: 'teaching',

    label: 'Teaching',

    description: 'Bigger changes so the listening trait is easier to hear.',

  },

  {

    id: 'realistic',

    label: 'Realistic',

    description: 'More restrained shaping for a more natural drum read.',

  },

];

const HIT_STRENGTH_OPTIONS = [

  {

    id: 'soft',

    label: 'Soft Hit',

    description:

      'Less shell, body, projection, and bloom. More head/contact and low-level response.',

  },

  {

    id: 'medium',

    label: 'Medium Hit',

    description: 'Balanced playing strength.',

  },

  {

    id: 'hard',

    label: 'Hard Hit',

    description:

      'More shell, body, projection, bloom, hoop/stick energy, and room response.',

  },

];

const RANDOMIZER_PRESETS = [

  {

    name: 'Warm Studio',

    values: {

      attack: [4, 7],

      brightness: [3, 6],

      projection: [4, 7],

      sustain: [4, 7],

      warmth: [7, 9],

      sensitivity: [5, 8],

      control: [6, 9],

    },

  },

  {

    name: 'Open Bloom',

    values: {

      attack: [4, 7],

      brightness: [5, 8],

      projection: [6, 9],

      sustain: [7, 9],

      warmth: [5, 8],

      sensitivity: [5, 8],

      control: [3, 6],

    },

  },

  {

    name: 'Crisp & Controlled',

    values: {

      attack: [7, 9],

      brightness: [7, 9],

      projection: [5, 8],

      sustain: [3, 6],

      warmth: [4, 7],

      sensitivity: [5, 8],

      control: [7, 9],

    },

  },

  {

    name: 'Touch Responsive',

    values: {

      attack: [4, 7],

      brightness: [5, 8],

      projection: [4, 7],

      sustain: [4, 7],

      warmth: [5, 8],

      sensitivity: [8, 10],

      control: [5, 8],

    },

  },

];

const getRandomInt = (min, max) => {

  return Math.floor(Math.random() * (max - min + 1)) + min;

};

const buildRandomVoice = () => {

  const preset =

    RANDOMIZER_PRESETS[Math.floor(Math.random() * RANDOMIZER_PRESETS.length)];

  return {

    name: preset.name,

    values: Object.fromEntries(

      NODE_ORDER.map((key) => {

        const range = preset.values[key] || [3, 9];

        return [key, getRandomInt(range[0], range[1])];

      })

    ),

  };

};

const getMeta = (key) => {

  const label = NODE_LABELS[key];

  const meta = LEGACYPRINT_AXIS_META?.[label] || LEGACYPRINT_AXIS_META?.[key] || {};

  const [low, high] = NODE_LOW_HIGH[key] || ['', ''];

  return {

    key,

    label,

    voiceName: NODE_VOICE_NAMES[key] || label,

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

    (relationship) => [relationship.from, relationship.to].sort().join('_') === id

  ) ||

  RELATIONSHIPS[6];

const getGaugeOverallRead = () => {

  const entries = Object.entries(GAUGE_VALUES).sort((a, b) => b[1] - a[1]);

  const strongest = entries[0];

  const second = entries[1];

  const softest = entries[entries.length - 1];

  return `This voice is led by ${NODE_LABELS[

    strongest[0]

  ].toLowerCase()}, supported by ${NODE_LABELS[

    second[0]

  ].toLowerCase()}, with a more restrained ${NODE_LABELS[

    softest[0]

  ].toLowerCase()} area. In plain terms, the drum should feel more forward where the shape pushes out, and more contained where it pulls inward.`;

};

const getGaugeNodeRead = (key) => {

  const value = Number(GAUGE_VALUES[key] || 5);

  const delta = value - 5;

  const meta = getMeta(key);

  const direction = delta >= 0 ? 'above' : 'below';

  const amount = Math.abs(delta).toFixed(1);

  return `${meta.label} sits ${amount} points ${direction} the neutral reference. In the shop, that means this drum leans more toward “${

    delta >= 0 ? meta.high : meta.low

  }” for this part of the voice.`;

};

const getFocusReadout = (soloNodeKeys = [], muteNodeKeys = []) => {

  const soloCount = soloNodeKeys.length;

  const muteCount = muteNodeKeys.length;

  if (soloCount > 0 && muteCount > 0) {

    return `Soloing ${soloCount} / Muting ${muteCount}`;

  }

  if (soloCount === 1) {

    const node = getMeta(soloNodeKeys[0]);

    return `Soloing ${node.label} / ${node.voiceName}`;

  }

  if (soloCount > 1) {

    return `Soloing ${soloCount} nodes`;

  }

  if (muteCount === 1) {

    const node = getMeta(muteNodeKeys[0]);

    return `Muting ${node.label} / ${node.voiceName}`;

  }

  if (muteCount > 1) {

    return `Muting ${muteCount} nodes`;

  }

  return 'Full shaped voice';

};

const LegacyPrintVoiceMapModal = ({ onClose }) => {

  const [activeMode, setActiveMode] = useState('playCycle');

  const [activeNodeKey, setActiveNodeKey] = useState('attack');

  const [activeRelationshipId, setActiveRelationshipId] = useState('attack_warmth');

  const [activeGaugeView, setActiveGaugeView] = useState('shape');

  const [finderAnswers, setFinderAnswers] = useState([]);

  const [finderStepIndex, setFinderStepIndex] = useState(0);

  const [selectedSampleKey, setSelectedSampleKey] = useState('snare10x4Maple');

  const [isPlayingSample, setIsPlayingSample] = useState(false);

  const [audioError, setAudioError] = useState('');

  const [playValues, setPlayValues] = useState(RESET_PLAY_VALUES);

  const [soloNodeKeys, setSoloNodeKeys] = useState([]);

  const [muteNodeKeys, setMuteNodeKeys] = useState([]);

  const [engineMode, setEngineMode] = useState('teaching');

  const [hitStrength, setHitStrength] = useState('medium');

  const [randomVoiceName, setRandomVoiceName] = useState('');

  const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);

  const autoPlayTimerRef = useRef(null);

  const shouldAutoPlayNextChangeRef = useRef(false);

  const activeNode = useMemo(() => getMeta(activeNodeKey), [activeNodeKey]);

  const activePlayStep = NODE_PLAY_STEPS[activeNodeKey] || NODE_PLAY_STEPS.attack;

  const activeRelationship = useMemo(

    () => getRelationshipById(activeRelationshipId),

    [activeRelationshipId]

  );

  const activeGaugeCopy = useMemo(

    () =>

      GAUGE_VIEW_OPTIONS.find((option) => option.id === activeGaugeView) ||

      GAUGE_VIEW_OPTIONS[0],

    [activeGaugeView]

  );

  const activeFinderQuestion =

    FINDER_QUESTIONS[finderStepIndex] ||

    FINDER_QUESTIONS[FINDER_QUESTIONS.length - 1];

  const selectedSample =

    LEGACYPRINT_SNARE_SAMPLES.find((sample) => sample.key === selectedSampleKey) ||

    LEGACYPRINT_SNARE_SAMPLES[0];

  const activeEngineCopy =

    ENGINE_MODES.find((mode) => mode.id === engineMode) || ENGINE_MODES[0];

  const activeHitCopy =

    HIT_STRENGTH_OPTIONS.find((option) => option.id === hitStrength) ||

    HIT_STRENGTH_OPTIONS[1];

  const firstSoloNodeKey = soloNodeKeys[0] || null;

  const firstMuteNodeKey = muteNodeKeys[0] || null;

  const legacyFocusMode =

    soloNodeKeys.length > 0 ? 'solo' : muteNodeKeys.length > 0 ? 'mute' : 'full';

  const legacyFocusNodeKey = firstSoloNodeKey || firstMuteNodeKey || null;

  const playCurrentHit = useCallback(

    async (

      valuesOverride = null,

      sampleOverride = null,

      focusOverride = null

    ) => {

      setAudioError('');

      setIsPlayingSample(true);

      const resolvedFocus = focusOverride || {

        soloNodeKeys,

        muteNodeKeys,

      };

      try {

        await playLegacyPrintSnare({

          sampleKey: sampleOverride || selectedSampleKey,

          values: valuesOverride || playValues,

          soloNodeKeys: resolvedFocus.soloNodeKeys,

          muteNodeKeys: resolvedFocus.muteNodeKeys,

          focusMode:

            resolvedFocus.soloNodeKeys?.length > 0

              ? 'solo'

              : resolvedFocus.muteNodeKeys?.length > 0

                ? 'mute'

                : 'full',

          focusNodeKey:

            resolvedFocus.soloNodeKeys?.[0] || resolvedFocus.muteNodeKeys?.[0] || null,

          hitStrength,

          engineMode,

        });

      } catch (error) {

        console.error(error);

        setAudioError('Could not play that sample yet. Check the audio file path.');

      } finally {

        window.setTimeout(() => {

          setIsPlayingSample(false);

        }, 220);

      }

    },

    [

      selectedSampleKey,

      playValues,

      soloNodeKeys,

      muteNodeKeys,

      hitStrength,

      engineMode,

    ]

  );

  useEffect(() => {

    if (!autoPlayEnabled || !shouldAutoPlayNextChangeRef.current) {

      return undefined;

    }

    window.clearTimeout(autoPlayTimerRef.current);

    autoPlayTimerRef.current = window.setTimeout(() => {

      playCurrentHit(playValues);

      shouldAutoPlayNextChangeRef.current = false;

    }, 280);

    return () => {

      window.clearTimeout(autoPlayTimerRef.current);

    };

  }, [autoPlayEnabled, playValues, playCurrentHit]);

  const updatePlayValuesFromMixer = (nextValues) => {

    shouldAutoPlayNextChangeRef.current = true;

    setPlayValues(nextValues);

    setRandomVoiceName('');

  };

  const handleSampleChange = (sampleKey) => {

    setSelectedSampleKey(sampleKey);

    setSoloNodeKeys([]);

    setMuteNodeKeys([]);

    window.setTimeout(() => {

      playCurrentHit(playValues, sampleKey, {

        soloNodeKeys: [],

        muteNodeKeys: [],

      });

    }, 80);

  };

  const handleFinderAnswer = (key) => {

    setFinderAnswers((current) => [...current, key]);

    setActiveNodeKey(key);

    setFinderStepIndex((current) =>

      Math.min(current + 1, FINDER_QUESTIONS.length - 1)

    );

  };

  const resetFinderPreview = () => {

    setFinderAnswers([]);

    setFinderStepIndex(0);

    setActiveNodeKey('attack');

  };

  const handleModeChange = (modeId) => {

    setActiveMode(modeId);

    if (modeId === 'playCycle') {

      setActiveNodeKey('attack');

      setSoloNodeKeys([]);

      setMuteNodeKeys([]);

    }

    if (modeId === 'voiceSculptor') {

      setActiveNodeKey('attack');

    }

    if (modeId === 'voiceGauge') {

      setActiveNodeKey('projection');

      setSoloNodeKeys([]);

      setMuteNodeKeys([]);

    }

    if (modeId === 'relationship') {

      setActiveRelationshipId('attack_warmth');

      setActiveNodeKey('attack');

      setSoloNodeKeys([]);

      setMuteNodeKeys([]);

    }

    if (modeId === 'voiceFinder') {

      setActiveNodeKey(finderAnswers[0] || 'attack');

      setSoloNodeKeys([]);

      setMuteNodeKeys([]);

    }

  };

  const handleResetVoice = () => {

    shouldAutoPlayNextChangeRef.current = true;

    setPlayValues(RESET_PLAY_VALUES);

    setRandomVoiceName('');

    setSoloNodeKeys([]);

    setMuteNodeKeys([]);

    setActiveNodeKey('attack');

  };

  const handleRandomizeVoice = () => {

    const nextVoice = buildRandomVoice();

    shouldAutoPlayNextChangeRef.current = true;

    setPlayValues(nextVoice.values);

    setRandomVoiceName(nextVoice.name);

  };

  const handleNodeFocus = (event, nodeKey, nextFocusMode) => {

    event.stopPropagation();

    setActiveNodeKey(nodeKey);

    if (nextFocusMode === 'solo') {

      setSoloNodeKeys((current) => {

        if (current.includes(nodeKey)) {

          return current.filter((key) => key !== nodeKey);

        }

        return [...current, nodeKey];

      });

      setMuteNodeKeys((current) => current.filter((key) => key !== nodeKey));

      return;

    }

    if (nextFocusMode === 'mute') {

      setMuteNodeKeys((current) => {

        if (current.includes(nodeKey)) {

          return current.filter((key) => key !== nodeKey);

        }

        return [...current, nodeKey];

      });

      setSoloNodeKeys((current) => current.filter((key) => key !== nodeKey));

    }

  };

  const handlePlayHit = () => {

    shouldAutoPlayNextChangeRef.current = false;

    playCurrentHit(playValues);

  };

  const modalContent = (

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

          <span className="lp-kicker">LegacyPrint™ Listening Guide</span>

          <h2>Voice Map Reference</h2>

          <p>

            A practical way to hear how a snare speaks, carries, blooms, and settles.

          </p>

        </header>

        <LegacyPrintModeTabs

          modes={MODE_TABS}

          activeMode={activeMode}

          onChange={handleModeChange}

        />

        <div className="lp-modal-workspace">

          <div className="lp-map-and-mixer">

            <LegacyPrintInteractivePolygon

              mode={activeMode}

              activeNodeKey={activeNodeKey}

              onSelectNode={setActiveNodeKey}

              activeRelationshipId={activeRelationshipId}

              onSelectRelationship={setActiveRelationshipId}

              gaugeValues={GAUGE_VALUES}

              finderAnswers={finderAnswers}

              playValues={playValues}

              onPlayValuesChange={updatePlayValuesFromMixer}

              soloNodeKeys={soloNodeKeys}

              muteNodeKeys={muteNodeKeys}

              focusMode={legacyFocusMode}

              focusNodeKey={legacyFocusNodeKey}

            />

          </div>

          <aside className="lp-readout-panel">

            {activeMode === 'playCycle' && (

              <>

                <span className="lp-panel-kicker">Play Cycle</span>

                <h3>How a snare hit unfolds.</h3>

                <p className="lp-panel-lede">

                  Before shaping a drum voice, it helps to hear the order of the

                  listening path. A snare hit starts with the strike, finds clarity,

                  moves outward, blooms, gains body, answers the player’s touch, and

                  finally settles into refinement.

                </p>

                <div className="lp-listening-index lp-play-cycle-index">

                  {NODE_ORDER.map((key) => {

                    const step = NODE_PLAY_STEPS[key];

                    const color = AXIS_COLOR_BY_KEY[key];

                    return (

                      <button

                        key={key}

                        type="button"

                        className={`lp-listening-row ${

                          activeNodeKey === key ? 'is-active' : ''

                        }`}

                        onClick={() => setActiveNodeKey(key)}

                        style={{ '--axis-color': color }}

                      >

                        <span className="lp-listening-number">{step.number}</span>

                        <span className="lp-listening-mark">

                          <MetricIcon type={key} color={color} size={15} />

                        </span>

                        <span className="lp-listening-name">{NODE_LABELS[key]}</span>

                        <span className="lp-listening-language">{step.step}</span>

                      </button>

                    );

                  })}

                </div>

                <div

                  className="lp-field-note"

                  style={{ '--axis-color': AXIS_COLOR_BY_KEY[activeNodeKey] }}

                >

                  <div className="lp-field-note-heading">

                    <MetricIcon

                      type={activeNodeKey}

                      color={AXIS_COLOR_BY_KEY[activeNodeKey]}

                      size={18}

                    />

                    <div>

                      <strong>{activeNode.label}</strong>

                      <small>

                        {activePlayStep.step} · {activeNode.low} / {activeNode.high}

                      </small>

                    </div>

                  </div>

                  <p>{activePlayStep.detail}</p>

                  <dl className="lp-shop-note-list">

                    <div>

                      <dt>At the kit</dt>

                      <dd>{activePlayStep.hear}</dd>

                    </div>

                    <div>

                      <dt>Player language</dt>

                      <dd>{activePlayStep.words.join(' · ')}</dd>

                    </div>

                    <div>

                      <dt>Craft notes</dt>

                      <dd>{activePlayStep.affects.join(', ')}</dd>

                    </div>

                  </dl>

                  <em>{activePlayStep.closing}</em>

                </div>

                <div className="lp-bench-note">

                  <strong>Next step</strong>

                  <span>

                    Move into Voice Sculptor when you are ready to shape and audition

                    the sound itself.

                  </span>

                </div>

              </>

            )}

            {activeMode === 'voiceSculptor' && (

              <>

                <section className="lp-node-mixer-box" aria-label="Voice mixer">

                  <div className="lp-mixer-topline">

                    <div>

                      <span className="lp-panel-kicker">Voice Sculptor</span>

                      <strong>{getFocusReadout(soloNodeKeys, muteNodeKeys)}</strong>

                    </div>

                    <button

                      type="button"

                      className={`lp-autoplay-toggle ${

                        autoPlayEnabled ? 'is-active' : ''

                      }`}

                      onClick={() => setAutoPlayEnabled((current) => !current)}

                    >

                      Auto-Play {autoPlayEnabled ? 'On' : 'Off'}

                    </button>

                  </div>

                  <div className="lp-mixer-control-grid">

                    <div className="lp-sample-picker">

                      {LEGACYPRINT_SNARE_SAMPLES.map((sample) => (

                        <button

                          key={sample.key}

                          type="button"

                          className={

                            selectedSampleKey === sample.key ? 'is-active' : ''

                          }

                          onClick={() => handleSampleChange(sample.key)}

                        >

                          <span>{sample.label}</span>

                          <small>{sample.description}</small>

                        </button>

                      ))}

                    </div>

                    <div className="lp-quiet-selector lp-engine-selector">

                      {ENGINE_MODES.map((mode) => (

                        <button

                          key={mode.id}

                          type="button"

                          className={engineMode === mode.id ? 'is-active' : ''}

                          onClick={() => setEngineMode(mode.id)}

                          title={mode.description}

                        >

                          {mode.label}

                        </button>

                      ))}

                    </div>

                    <div className="lp-quiet-selector lp-hit-selector">

                      {HIT_STRENGTH_OPTIONS.map((option) => (

                        <button

                          key={option.id}

                          type="button"

                          className={hitStrength === option.id ? 'is-active' : ''}

                          onClick={() => setHitStrength(option.id)}

                          title={option.description}

                        >

                          {option.label}

                        </button>

                      ))}

                    </div>

                  </div>

                  <div className="lp-mixer-actions">

                    <button

                      type="button"

                      className="is-primary"

                      onClick={handlePlayHit}

                      disabled={isPlayingSample}

                    >

                      Play Hit

                    </button>

                    <button type="button" onClick={handleResetVoice}>

                      Reset

                    </button>

                    <button type="button" onClick={handleRandomizeVoice}>

                      Randomize

                    </button>

                  </div>

                  {randomVoiceName && (

                    <div className="lp-random-readout">

                      Current random voice: <strong>{randomVoiceName}</strong>

                    </div>

                  )}

                  {audioError && <p className="lp-audio-error">{audioError}</p>}

                  <div className="lp-listening-index lp-mixer-node-list">

                    {NODE_ORDER.map((key) => {

                      const step = NODE_PLAY_STEPS[key];

                      const color = AXIS_COLOR_BY_KEY[key];

                      const isSoloActive = soloNodeKeys.includes(key);

                      const isMuteActive = muteNodeKeys.includes(key);

                      return (

                        <div

                          key={key}

                          role="button"

                          tabIndex="0"

                          className={`lp-listening-row ${

                            activeNodeKey === key ? 'is-active' : ''

                          } ${isSoloActive ? 'is-soloing' : ''} ${

                            isMuteActive ? 'is-muting' : ''

                          }`}

                          onClick={() => setActiveNodeKey(key)}

                          onKeyDown={(event) => {

                            if (event.key === 'Enter' || event.key === ' ') {

                              event.preventDefault();

                              setActiveNodeKey(key);

                            }

                          }}

                          style={{ '--axis-color': color }}

                        >

                          <span className="lp-listening-mark">

                            <MetricIcon type={key} color={color} size={15} />

                          </span>

                          <span className="lp-listening-name">

                            {NODE_LABELS[key]}

                          </span>

                          <span className="lp-listening-language">

                            {step.step}

                          </span>

                          <span className="lp-node-focus-actions">

                            <button

                              type="button"

                              className={isSoloActive ? 'is-active' : ''}

                              onClick={(event) =>

                                handleNodeFocus(event, key, 'solo')

                              }

                            >

                              Solo

                            </button>

                            <button

                              type="button"

                              className={isMuteActive ? 'is-active' : ''}

                              onClick={(event) =>

                                handleNodeFocus(event, key, 'mute')

                              }

                            >

                              Mute

                            </button>

                          </span>

                        </div>

                      );

                    })}

                  </div>

                </section>

                <span className="lp-panel-kicker">Voice Sculptor</span>

                <h3>Shape and audition the snare voice.</h3>

                <p className="lp-panel-lede">

                  Voice Sculptor is the hands-on model. Adjust the inner shape, switch

                  drum examples, solo or mute nodes, and listen for how each trait

                  changes the hit.

                </p>

                <div

                  className="lp-field-note"

                  style={{ '--axis-color': AXIS_COLOR_BY_KEY[activeNodeKey] }}

                >

                  <div className="lp-field-note-heading">

                    <MetricIcon

                      type={activeNodeKey}

                      color={AXIS_COLOR_BY_KEY[activeNodeKey]}

                      size={18}

                    />

                    <div>

                      <strong>{activeNode.label}</strong>

                      <small>

                        {activePlayStep.step} · {activeNode.low} / {activeNode.high}

                      </small>

                    </div>

                  </div>

                  <p>{activePlayStep.detail}</p>

                  <dl className="lp-shop-note-list">

                    <div>

                      <dt>At the kit</dt>

                      <dd>{activePlayStep.hear}</dd>

                    </div>

                    <div>

                      <dt>Player language</dt>

                      <dd>{activePlayStep.words.join(' · ')}</dd>

                    </div>

                    <div>

                      <dt>Craft notes</dt>

                      <dd>{activePlayStep.affects.join(', ')}</dd>

                    </div>

                  </dl>

                  <em>{activePlayStep.closing}</em>

                </div>

                <div className="lp-bench-note">

                  <strong>{selectedSample.label}</strong>

                  <span>

                    {`${selectedSample.description}. ${activeEngineCopy.description} ${activeHitCopy.description}`}

                  </span>

                </div>

              </>

            )}

            {activeMode === 'voiceGauge' && (

              <>

                <span className="lp-panel-kicker">Voice Gauge</span>

                <h3>Read the drum’s shape.</h3>

                <p className="lp-panel-lede">

                  Voice Gauge turns the seven nodes into a visual voice shape. The

                  dotted reference shows a neutral center. The colored shape shows where

                  this drum leans.

                </p>

                <div className="lp-quiet-selector">

                  {GAUGE_VIEW_OPTIONS.map((option) => (

                    <button

                      key={option.id}

                      type="button"

                      className={activeGaugeView === option.id ? 'is-active' : ''}

                      onClick={() => setActiveGaugeView(option.id)}

                    >

                      {option.label}

                    </button>

                  ))}

                </div>

                <div className="lp-bench-note">

                  <strong>{activeGaugeCopy.title}</strong>

                  <span>{activeGaugeCopy.text}</span>

                </div>

                <div className="lp-bench-note">

                  <strong>Overall drum read</strong>

                  <span>{getGaugeOverallRead()}</span>

                </div>

                <div

                  className="lp-field-note"

                  style={{ '--axis-color': AXIS_COLOR_BY_KEY[activeNodeKey] }}

                >

                  <div className="lp-field-note-heading">

                    <MetricIcon

                      type={activeNodeKey}

                      color={AXIS_COLOR_BY_KEY[activeNodeKey]}

                      size={18}

                    />

                    <div>

                      <strong>{activeNode.label}</strong>

                      <small>

                        {activeNode.voiceName} ·{' '}

                        {GAUGE_VALUES[activeNodeKey].toFixed(1)} / Reference 5.0

                      </small>

                    </div>

                  </div>

                  <p>{getGaugeNodeRead(activeNodeKey)}</p>

                </div>

                <div className="lp-bench-note">

                  <strong>Next listening step</strong>

                  <span>

                    Explore Node Relationships to see how two traits shape one another.

                  </span>

                </div>

              </>

            )}

            {activeMode === 'relationship' && (

              <>

                <span className="lp-panel-kicker">Node Relationships</span>

                <h3>Learn what combinations mean.</h3>

                <p className="lp-panel-lede">

                  Select a relationship to hear how two parts of the voice shape each

                  other. This helps turn vague player language into a clearer sound

                  direction.

                </p>

                <div

                  className="lp-field-note"

                  style={{

                    '--axis-color':

                      AXIS_COLOR_BY_KEY[activeRelationship.from] || '#d6b277',

                  }}

                >

                  <div className="lp-field-note-heading">

                    <MetricIcon

                      type={activeRelationship.from}

                      color={AXIS_COLOR_BY_KEY[activeRelationship.from]}

                      size={18}

                    />

                    <div>

                      <strong>{activeRelationship.label}</strong>

                      <small>{activeRelationship.tag}</small>

                    </div>

                  </div>

                  <p>{activeRelationship.text}</p>

                  <dl className="lp-shop-note-list">

                    <div>

                      <dt>At the kit</dt>

                      <dd>{activeRelationship.hear}</dd>

                    </div>

                    <div>

                      <dt>Player language</dt>

                      <dd>{activeRelationship.playerWords.join(' · ')}</dd>

                    </div>

                    <div>

                      <dt>Craft notes</dt>

                      <dd>{activeRelationship.watchOut}</dd>

                    </div>

                  </dl>

                </div>

                <div className="lp-relation-ledger">

                  {RELATIONSHIPS.map((relationship) => (

                    <button

                      key={relationship.id}

                      type="button"

                      className={

                        activeRelationshipId === relationship.id ? 'is-active' : ''

                      }

                      onClick={() => setActiveRelationshipId(relationship.id)}

                      style={{

                        '--axis-color': AXIS_COLOR_BY_KEY[relationship.from],

                      }}

                    >

                      <span>{relationship.label}</span>

                      <small>{relationship.tag}</small>

                    </button>

                  ))}

                </div>

                <div className="lp-bench-note">

                  <strong>Next listening step</strong>

                  <span>

                    Try Voice Finder Preview to see how player language can become a

                    target direction.

                  </span>

                </div>

              </>

            )}

            {activeMode === 'voiceFinder' && (

              <>

                <span className="lp-panel-kicker">Voice Finder Preview</span>

                <h3>Turn preference into direction.</h3>

                <p className="lp-panel-lede">

                  This preview shows how guided listening questions can translate player

                  language into a clearer drum voice target.

                </p>

                <div className="lp-field-note lp-finder-note">

                  <div className="lp-finder-topline">

                    <strong>{activeFinderQuestion.question}</strong>

                    {finderAnswers.length > 0 && (

                      <button type="button" onClick={resetFinderPreview}>

                        Reset

                      </button>

                    )}

                  </div>

                  <div className="lp-finder-answer-grid">

                    {activeFinderQuestion.options.map((option) => (

                      <button

                        key={option.label}

                        type="button"

                        onClick={() => handleFinderAnswer(option.key)}

                      >

                        <span>{option.label}</span>

                        <small>{option.hint}</small>

                      </button>

                    ))}

                  </div>

                </div>

                <div className="lp-bench-note">

                  <strong>Example voice direction</strong>

                  <span>

                    {finderAnswers.length === 0

                      ? 'Start with one answer. The map will begin shaping a sample Voice Target.'

                      : `This sample direction is leaning toward ${finderAnswers

                          .map((key) => NODE_LABELS[key])

                          .join(', ')}. A full finder would turn this into a more complete voice summary.`}

                  </span>

                </div>

                <div className="lp-bench-note">

                  <strong>Workshop note</strong>

                  <span>

                    Voice Finder is a conversation starter. Final fit still depends on

                    the player, room, tuning, heads, sticks, and expert judgment.

                  </span>

                </div>

              </>

            )}

          </aside>

        </div>

      </div>

    </div>

  );

  return ReactDOM.createPortal(modalContent, document.body);

};

export default LegacyPrintVoiceMapModal;