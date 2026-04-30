// src/utils/legacyPrint/buildVoiceThreadReadout.js

const THREAD_AXIS_LABELS = {
  attack: 'Attack',

  brightness: 'Brightness',

  projection: 'Projection',

  sustain: 'Sustain',

  warmth: 'Warmth',

  sensitivity: 'Sensitivity',

  control: 'Control',
};

const THREAD_AXIS_SPOKEN_LABELS = {
  attack: 'front edge',

  brightness: 'top-end clarity',

  projection: 'room carry',

  sustain: 'bloom',

  warmth: 'body',

  sensitivity: 'touch response',

  control: 'note control',
};

const THREAD_AXIS_PLAYER_LANGUAGE = {
  attack: {
    high: 'the note speaks quicker and gives the player a more immediate response',

    low: 'the note starts rounder and feels less pointed at the first hit',

    neutral: 'the front edge stays close to the Heritage center',
  },

  brightness: {
    high: 'the upper edge reads clearer and more articulate',

    low: 'the top end feels smoother, darker, and less glassy',

    neutral: 'the top-end clarity stays close to the Heritage center',
  },

  projection: {
    high: 'the drum feels like it pushes farther into the room',

    low: 'the drum feels more intimate and closer to the player',

    neutral: 'the room carry stays close to the Heritage center',
  },

  sustain: {
    high: 'the note opens up longer after the strike',

    low: 'the note exits sooner and feels more contained',

    neutral: 'the bloom stays close to the Heritage center',
  },

  warmth: {
    high: 'the shell carries more body and low-mid weight',

    low: 'the shell reads leaner with less low-mid density',

    neutral: 'the body stays close to the Heritage center',
  },

  sensitivity: {
    high: 'lighter touch reveals more of the drum',

    low: 'the drum asks for a little more input before it fully wakes up',

    neutral: 'the touch response stays close to the Heritage center',
  },

  control: {
    high: 'the note shape feels more organized and easier to place',

    low: 'the note feels more open, wider, and less contained',

    neutral: 'the note control stays close to the Heritage center',
  },
};

const THREAD_SHAPE_META = {
  simple: {
    label: 'Simple Thread',

    listenerLevel: 'First impression',

    shapeLabel: '2-node connector',

    shortDefinition:
      'The first useful relationship a listener is likely to notice.',

    whyItMatters:
      'A Simple Thread gives the player a clean starting point. Instead of trying to explain the whole drum at once, it names the clearest paired relationship: what the ear notices first and what that trait is working with.',
  },

  shaped: {
    label: 'Shaped Thread',

    listenerLevel: 'Playing personality',

    shapeLabel: '3-node triangle',

    shortDefinition:
      'How the drum begins to behave under the hands, not just how it sounds at first hit.',

    whyItMatters:
      'A Shaped Thread starts to explain feel. It shows how three traits combine into a playing personality: the way the drum responds, opens, focuses, or carries as the player actually works the instrument.',
  },

  complex: {
    label: 'Complex Thread',

    listenerLevel: 'Deeper voice pattern',

    shapeLabel: '4+ node pattern',

    shortDefinition:
      'The wider pattern that describes the current drum personality.',

    whyItMatters:
      'A Complex Thread is the deeper read. It does not try to replace the VoiceMap. It translates the wider pattern into a practical player-facing idea: how the drum wants to be used, where it feels natural, and what kind of musical identity it is beginning to show.',
  },
};

const BUILD_DRIVER_COPY = {
  'Bearing edge':
    'Bearing edge shape affects how quickly the head transfers energy into the shell and how defined the note start feels.',

  'Hoop type':
    'Hoop choice changes the balance between openness, focus, rimshot firmness, and overtone control.',

  'Shell depth':
    'Shell depth changes how much air the drum moves, which affects body, bloom, and how big the drum feels.',

  Depth:
    'Depth changes how much air the drum moves, which affects body, bloom, and how big the drum feels.',

  'Shell size':
    'Shell size shifts the overall center of the drum: smaller shells often feel quicker, while larger shells tend to carry more body.',

  'Shell thickness':
    'Shell thickness affects how stiff or relaxed the shell feels, which changes focus, projection, and sustain.',

  'Lug count':
    'Lug count affects tension distribution and can change how controlled, even, or open the drum feels.',

  'Wood / shell recipe':
    'The shell recipe sets the core voice of the drum: body, density, response, and how the note develops after impact.',

  'Finish intensity':
    'Finish intensity can slightly change the way the shell feels under tension and how controlled or open the voice reads.',

  'Shell construction':
    'Shell construction shapes how energy moves through the drum and how cohesive the note feels.',

  'Die-cast hoops':
    'Die-cast hoops usually push the read toward more focus, firmer rimshot behavior, and stronger note containment.',

  'Triple flange hoops':
    'Triple flange hoops usually preserve more openness, spread, and natural shell bloom.',

  'Snare response setup':
    'Snare response setup affects how much detail comes through at lower dynamics, ghost notes, and softer playing.',

  'Lighter finish treatment':
    'A lighter finish treatment tends to preserve more openness, touch response, and natural shell movement.',
};

const normalizeThreadKey = (nodes = []) => {
  return [...nodes].filter(Boolean).sort().join('|');
};

const THREAD_RELATIONSHIP_LANGUAGE = {
  [normalizeThreadKey(['attack', 'brightness'])]: {
    listenerHook:
      'This is the kind of drum a player notices right away because the note has a clear front edge and enough top-end detail to make articulation obvious.',

    playerTranslation:
      'In snare language, this points toward clean stick definition, crisp backbeats, articulate ghost notes, and a drum that explains itself quickly in the mix.',

    caution:
      'The useful word here is clarity, not harshness. A good read should describe definition without implying the drum is thin, brittle, or overly sharp.',
  },

  [normalizeThreadKey(['attack', 'control'])]: {
    listenerHook:
      'This thread points to a drum that feels organized from the first hit. The note starts clearly, then stays shaped instead of spreading too far.',

    playerTranslation:
      'In snare language, this is about pocket placement, focused rimshots, tighter grooves, and a drum that feels easy to put exactly where the player wants it.',

    caution:
      'The useful word here is focus, not stiffness. The read should avoid making the drum sound lifeless or over-controlled.',
  },

  [normalizeThreadKey(['brightness', 'projection'])]: {
    listenerHook:
      'This thread points to a drum that announces itself in the room. The upper edge and outward push are working together.',

    playerTranslation:
      'In snare language, this usually means the drum can hold its place against guitars, keys, louder rooms, or busier arrangements without needing to be forced.',

    caution:
      'The useful word here is presence, not volume alone. Projection should be described as carry and placement, not just loudness.',
  },

  [normalizeThreadKey(['warmth', 'sustain'])]: {
    listenerHook:
      'This thread points to a drum whose body and bloom are working together. The ear notices the center of the note, then hears it open after the hit.',

    playerTranslation:
      'In snare language, this leans toward roundness, shell character, open tuning, rootsier backbeats, and a drum that rewards letting the note breathe.',

    caution:
      'The useful word here is bloom, not ring. Sustain should sound musical and controlled by context, not like uncontrolled overtones.',
  },

  [normalizeThreadKey(['warmth', 'control'])]: {
    listenerHook:
      'This thread points to body with boundaries. The drum keeps a grounded center while still feeling manageable.',

    playerTranslation:
      'In snare language, this is for players who want wood character and warmth without the drum becoming too loose, washy, or hard to place.',

    caution:
      'The useful word here is shaped warmth. Avoid implying that control removes character.',
  },

  [normalizeThreadKey(['sensitivity', 'warmth'])]: {
    listenerHook:
      'This thread points to a drum that still has body when the player backs off. The quieter notes do not disappear.',

    playerTranslation:
      'In snare language, this means ghost notes, softer strokes, brush-style ideas, and dynamic playing can still carry tone instead of only snare-wire chatter.',

    caution:
      'The useful word here is touch, not delicacy. This can still apply to strong players; it simply means the drum gives information back at lower dynamics.',
  },

  [normalizeThreadKey(['sensitivity', 'control'])]: {
    listenerHook:
      'This thread points to detail that stays organized. The drum reveals touch changes without the note getting messy.',

    playerTranslation:
      'In snare language, this is about ghost-note clarity, controlled drag patterns, studio phrasing, and a drum that reacts without spilling all over the track.',

    caution:
      'The useful word here is responsive focus. Avoid making it sound clinical or overly restrained.',
  },

  [normalizeThreadKey(['projection', 'sustain'])]: {
    listenerHook:
      'This thread points to a drum that feels larger after impact. The note travels and hangs in the room.',

    playerTranslation:
      'In snare language, this is about open rooms, bigger backbeats, wider arrangements, and a snare that feels alive beyond the first crack.',

    caution:
      'The useful word here is carry. It should not imply the drum is uncontrolled or too ringy.',
  },

  [normalizeThreadKey(['attack', 'sensitivity', 'control'])]: {
    listenerHook:
      'This triangle points to a drum that responds quickly, tracks touch changes, and keeps the note disciplined.',

    playerTranslation:
      'In snare language, this is a precision-feel read: ghost notes speak, accents pop, and the player can move between soft and strong without the drum losing shape.',

    caution:
      'The useful word here is disciplined response. Avoid making the drum sound rigid; the point is control across dynamics.',
  },

  [normalizeThreadKey(['sensitivity', 'sustain', 'warmth'])]: {
    listenerHook:
      'This triangle points to a drum that feels expressive under the hands. Body, bloom, and touch response are working as one behavior.',

    playerTranslation:
      'In snare language, this is a musical-feel read: the drum opens up when played, carries tone at lower dynamics, and rewards players who shape sound through touch.',

    caution:
      'The useful word here is expressiveness. Avoid over-romanticizing it; the practical point is that the drum gives usable tone across a wider dynamic range.',
  },

  [normalizeThreadKey(['control', 'sensitivity', 'sustain', 'warmth'])]: {
    listenerHook:
      'This wider pattern points to the drum’s deeper personality: body, bloom, touch, and control are all part of the same voice behavior.',

    playerTranslation:
      'In snare language, this is not just one trait standing out. It describes a drum that wants to feel dimensional: warm enough to have a center, open enough to breathe, responsive enough to follow the hands, and controlled enough to stay usable.',

    caution:
      'The useful word here is personality. This should be presented as a practical listening read, not a claim that the engine fully predicts the finished drum.',
  },
};

const getRelationshipLanguage = (nodes = []) => {
  return THREAD_RELATIONSHIP_LANGUAGE[normalizeThreadKey(nodes)] || null;
};

const clamp = (value, min = 0, max = 10) => {
  const num = Number(value);

  if (!Number.isFinite(num)) return min;

  return Math.max(min, Math.min(max, num));
};

const round1 = (value) => Math.round(Number(value || 0) * 10) / 10;

const getAxisValue = (profile = {}, axis) => Number(profile?.[axis] ?? 5);

const getAxisDelta = (profile = {}, axis) =>
  round1(getAxisValue(profile, axis) - 5);

const getAxisDirection = (profile = {}, axis) => {
  const delta = getAxisDelta(profile, axis);

  if (delta >= 0.35) return 'high';

  if (delta <= -0.35) return 'low';

  return 'neutral';
};

const getAxisIntensity = (profile = {}, axis) => {
  const delta = Math.abs(getAxisDelta(profile, axis));

  if (delta >= 1.15) return 'strong';

  if (delta >= 0.65) return 'moderate';

  if (delta >= 0.35) return 'subtle';

  return 'centered';
};

const getThreadKind = (thread = {}) => {

  const slotKey = String(thread?.slotKey || '').toLowerCase();

  if (slotKey === 'simple') return 'simple';

  if (slotKey === 'shaped') return 'shaped';

  if (slotKey === 'complex') return 'complex';

  const nodeCount = Array.isArray(thread?.nodes) ? thread.nodes.length : 0;

  if (nodeCount <= 2) return 'simple';

  if (nodeCount === 3) return 'shaped';

  return 'complex';

};

const formatNodeList = (nodes = []) => {
  const labels = nodes.map((node) => THREAD_AXIS_LABELS[node] || node);

  if (labels.length <= 1) return labels[0] || '';

  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;

  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
};

const formatSpokenNodeList = (nodes = []) => {
  const labels = nodes.map((node) => THREAD_AXIS_SPOKEN_LABELS[node] || node);

  if (labels.length <= 1) return labels[0] || '';

  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;

  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
};

const getDominantAxis = (nodes = [], profile = {}) => {
  return nodes.reduce(
    (strongest, node) => {
      const delta = Math.abs(getAxisDelta(profile, node));

      if (delta > strongest.delta) {
        return {
          axis: node,

          delta,
        };
      }

      return strongest;
    },

    {
      axis: nodes[0] || 'attack',

      delta: 0,
    }
  ).axis;
};

const buildTraitEvidence = (nodes = [], profile = {}) => {
  return nodes.map((node) => {
    const delta = getAxisDelta(profile, node);

    const direction = getAxisDirection(profile, node);

    const intensity = getAxisIntensity(profile, node);

    return {
      axis: node,

      label: THREAD_AXIS_LABELS[node] || node,

      spokenLabel: THREAD_AXIS_SPOKEN_LABELS[node] || node,

      value: round1(getAxisValue(profile, node)),

      delta,

      direction,

      intensity,

      read:
        THREAD_AXIS_PLAYER_LANGUAGE[node]?.[direction] ||
        THREAD_AXIS_PLAYER_LANGUAGE[node]?.neutral ||
        'this trait stays close to the center',
    };
  });
};

const buildIntensityLabel = (evidence = []) => {
  const deltas = evidence.map((item) => Math.abs(Number(item.delta || 0)));

  const average =
    deltas.length > 0
      ? deltas.reduce((sum, value) => sum + value, 0) / deltas.length
      : 0;

  const strongest = Math.max(...deltas, 0);

  const combined = clamp(average * 0.65 + strongest * 0.35, 0, 3);

  if (combined >= 1.15) {
    return {
      label: 'Strong',

      detail:
        'This thread is clearly shaping the current read and should be easy to discuss with a player.',
    };
  }

  if (combined >= 0.65) {
    return {
      label: 'Moderate',

      detail:
        'This thread is present enough to matter, but it is still working inside the broader Heritage balance.',
    };
  }

  if (combined >= 0.35) {
    return {
      label: 'Subtle',

      detail:
        'This thread is more of a gentle lean than a hard personality shift.',
    };
  }

  return {
    label: 'Centered',

    detail:
      'This thread is reading close to the reference center, so it should be described carefully and without overstatement.',
  };
};

const buildOpeningRead = ({ thread, kindMeta, nodes, profile }) => {
  const relationshipLanguage = getRelationshipLanguage(nodes);

  if (relationshipLanguage?.listenerHook) {
    return relationshipLanguage.listenerHook;
  }

  const dominantAxis = getDominantAxis(nodes, profile);

  const dominantLabel = THREAD_AXIS_SPOKEN_LABELS[dominantAxis] || dominantAxis;

  const nodeText = formatSpokenNodeList(nodes);

  if (nodes.length <= 2) {
    return `This is the quick first-impression read. The engine is hearing ${nodeText} working together, with ${dominantLabel} acting as the clearest entry point into the drum’s current voice.`;
  }

  if (nodes.length === 3) {
    return `This triangle starts to describe playing personality. The engine is not just naming isolated traits — it is reading how ${nodeText} combine when the drum is struck, heard, and felt under the hands.`;
  }

  return `This wider pattern is the current drum-personality read. The engine is looking beyond one trait or one relationship and reading how ${nodeText} form a broader musical behavior.`;
};

const buildWhatThreadIsTellingUs = ({ nodes, profile, thread }) => {
  const relationshipLanguage = getRelationshipLanguage(nodes);

  if (relationshipLanguage?.playerTranslation) {
    return relationshipLanguage.playerTranslation;
  }

  const evidence = buildTraitEvidence(nodes, profile);

  const meaningfulEvidence = evidence.filter(
    (item) => item.intensity !== 'centered'
  );

  const evidenceToUse = meaningfulEvidence.length
    ? meaningfulEvidence
    : evidence;

  const phrases = evidenceToUse.slice(0, 4).map((item) => item.read);

  if (phrases.length === 0) {
    return (
      thread?.summary || 'This thread is reading close to the Heritage center.'
    );
  }

  if (phrases.length === 1) {
    return `In player terms, ${phrases[0]}.`;
  }

  if (phrases.length === 2) {
    return `In player terms, ${phrases[0]}, while ${phrases[1]}.`;
  }

  return `In player terms, ${phrases[0]}, ${phrases[1]}, and ${phrases[2]}.`;
};

const buildWhyItMatters = ({ kind, kindMeta, thread }) => {
  if (kind === 'simple') {
    return `${kindMeta.whyItMatters} For this build, that gives the player an easy first sentence: “I notice ${String(
      thread?.title || 'this relationship'
    ).toLowerCase()}.”`;
  }

  if (kind === 'shaped') {
    return `${kindMeta.whyItMatters} For this build, the triangle helps explain why the drum may feel like more than the sum of its parts.`;
  }

  return `${kindMeta.whyItMatters} For this build, the wider pattern is useful because it turns the VoiceMap into a more human read of the drum’s personality.`;
};

const buildHowToUseThis = ({ kind, thread }) => {
  if (kind === 'simple') {
    return `Use this as the first comparison point when talking about the drum. It should help answer: “What do I notice first, and what is that first impression connected to?”`;
  }

  if (kind === 'shaped') {
    return `Use this when talking about feel, touch, and musical behavior. It should help answer: “How does the drum start behaving once I actually play it?”`;
  }

  return `Use this as the broader personality read. It should help answer: “What kind of player, room, arrangement, or musical role does this drum naturally seem to understand?”`;
};

const buildTrustNote = ({ kind, evidence, nodes = [] }) => {
  const relationshipLanguage = getRelationshipLanguage(nodes);

  if (relationshipLanguage?.caution) {
    return relationshipLanguage.caution;
  }

  const centeredCount = evidence.filter(
    (item) => item.intensity === 'centered'
  ).length;

  if (centeredCount >= evidence.length - 1) {
    return 'This read should stay gentle: most of the connected traits are close to the Heritage reference center, so the language should describe tendency rather than certainty.';
  }

  if (kind === 'complex') {
    return 'This is a pattern read, not a lab measurement. It should be treated as practical listening language: useful for comparison, conversation, and build direction, then confirmed by real playing and final tuning.';
  }

  return 'This read is meant to support listening, not replace it. It gives the player shared language for what the drum appears to be emphasizing.';
};

const buildDriverEvidence = (drivers = []) => {
  return drivers.map((driver) => ({
    label: driver,

    read:
      BUILD_DRIVER_COPY[driver] ||
      'This build choice contributes to the way the connected traits are being shaped.',
  }));
};

const buildThreadName = ({ kindMeta, thread }) => {
  return `${kindMeta.label} • ${kindMeta.listenerLevel}`;
};

export function buildVoiceThreadReadout({
  thread = null,

  profile = {},

  sourceBuildRead = '',
} = {}) {
  const nodes = Array.isArray(thread?.nodes)
    ? thread.nodes.filter(Boolean)
    : [];

  const kind = getThreadKind(thread);

  const kindMeta = THREAD_SHAPE_META[kind];

  const evidence = buildTraitEvidence(nodes, profile);

  const intensity = buildIntensityLabel(evidence);

  return {
    id: thread?.id || 'voice-thread',

    title: thread?.title || 'Voice Thread',

    threadName: buildThreadName({ kindMeta, thread }),

    threadKind: kind,

    listenerLevel: kindMeta.listenerLevel,

    shapeLabel: kindMeta.shapeLabel,

    shortDefinition: kindMeta.shortDefinition,

    intensityLabel: intensity.label,

    intensityDetail: intensity.detail,

    nodeLabels: formatNodeList(nodes),

    spokenNodeLabels: formatSpokenNodeList(nodes),

    openingRead: buildOpeningRead({
      thread,

      kindMeta,

      nodes,

      profile,
    }),

    whatThreadIsTellingUs: buildWhatThreadIsTellingUs({
      nodes,

      profile,

      thread,
    }),

    whyItMatters: buildWhyItMatters({
      kind,

      kindMeta,

      thread,
    }),

    howToUseThis: buildHowToUseThis({
      kind,

      thread,
    }),

    bestFitRead: thread?.bestFits?.length
      ? `This thread tends to make the most sense for ${thread.bestFits.join(
          ', '
        )}.`
      : 'This thread should be treated as a general voicing direction until more player context is known.',

    trustNote: buildTrustNote({
      kind,

      evidence,

      nodes,
    }),

    traitEvidence: evidence,

    driverEvidence: buildDriverEvidence(thread?.drivers || []),

    sourceBuildRead,
  };
}

export default buildVoiceThreadReadout;
