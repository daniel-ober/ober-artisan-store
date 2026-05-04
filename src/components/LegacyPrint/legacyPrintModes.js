
export const LEGACYPRINT_MODES = [

  {

    id: 'playCycle',

    label: 'Play Cycle',

    eyebrow: 'How the player feels the drum respond',

    title: 'Learn the path of the note.',

    description:

      'Follow how a drum moves from first strike, to clarity, to carry, to bloom, to body, to touch response, and back into refinement.',

  },

  {

    id: 'voiceGauge',

    label: 'Voice Gauge',

    eyebrow: 'How a drum compares',

    title: 'Compare the shape of a drum voice.',

    description:

      'Use the seven nodes as a gauge for comparing builds, reference drums, and configurations across tone, feel, and response.',

  },

  {

    id: 'relationships',

    label: 'Tonal Relationship',

    eyebrow: 'How traits connect',

    title: 'Read the lines between traits.',

    description:

      'Each node describes one trait. Each connection describes a relationship — crack with body, cut without harshness, power with focus, or warmth without mud.',

  },

  {

    id: 'voiceFinder',

    label: 'Voice Finder',

    eyebrow: 'Guided discovery',

    title: 'Find the drum voice you are trying to describe.',

    description:

      'Voice Finder is an adaptive discovery tool that uses the VoiceMapping to turn player language into a clear Voice Target.',

  },

];

export const getLegacyPrintModeById = (modeId) =>

  LEGACYPRINT_MODES.find((mode) => mode.id === modeId) || LEGACYPRINT_MODES[0];

