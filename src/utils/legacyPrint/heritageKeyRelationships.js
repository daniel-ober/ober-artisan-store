// src/utils/legacyPrint/heritageKeyRelationships.js

const KEY_RELATIONSHIP_DEFINITIONS = [

  {

    id: 'focused-throw-clean-shape',

    slotKey: 'simple',

    title: 'Focused throw with clean shape',

    nodes: ['attack', 'projection'],

    summary:

      'The drum is reading with a stronger front edge and more outward push.',

    relevance: {

      attack: 1,

      projection: 1,

    },

    preferredDirection: {

      attack: 'high',

      projection: 'high',

    },

  },

  {

    id: 'rounded-body-clear-start',

    slotKey: 'shaped',

    title: 'Rounded body with a clear start',

    nodes: ['attack', 'warmth', 'sustain'],

    summary:

      'The drum is reading with more body and bloom while still keeping enough front edge to speak clearly.',

    relevance: {

      attack: 0.72,

      warmth: 1,

      sustain: 1,

    },

    preferredDirection: {

      attack: 'either',

      warmth: 'high',

      sustain: 'high',

    },

  },

  {

    id: 'body-blooms-outward',

    slotKey: 'complex',

    title: 'Body that blooms outward',

    nodes: ['warmth', 'sustain', 'projection', 'control'],

    summary:

      'The shell is reading as fuller and more open, with the note developing outward after the strike while still keeping enough shape to remain usable.',

    relevance: {

      warmth: 1,

      sustain: 1,

      projection: 0.8,

      control: 0.55,

    },

    preferredDirection: {

      warmth: 'high',

      sustain: 'high',

      projection: 'high',

      control: 'either',

    },

  },

  {

    id: 'lively-touch-open-detail',

    slotKey: 'simple',

    title: 'Lively touch with open detail',

    nodes: ['sensitivity', 'brightness'],

    summary:

      'The drum is reading as more responsive under lighter hands, with extra upper detail.',

    relevance: {

      sensitivity: 1,

      brightness: 0.85,

    },

    preferredDirection: {

      sensitivity: 'high',

      brightness: 'high',

    },

  },

  {

    id: 'expressive-blooming-response',

    slotKey: 'shaped',

    title: 'Expressive, blooming response',

    nodes: ['warmth', 'sustain', 'sensitivity'],

    summary:

      'The drum is reading as more expressive and open, with body, bloom, and touch response working together.',

    relevance: {

      warmth: 0.85,

      sustain: 1,

      sensitivity: 1,

    },

    preferredDirection: {

      warmth: 'high',

      sustain: 'high',

      sensitivity: 'high',

    },

  },

  {

    id: 'shorter-note-firm-response',

    slotKey: 'complex',

    title: 'Shorter note with firm response',

    nodes: ['control', 'sustain', 'attack', 'projection'],

    summary:

      'The drum is reading with a tighter note tail, firmer response, stronger front edge, and enough outward push to keep the note present.',

    relevance: {

      control: 1,

      sustain: 1,

      attack: 0.8,

      projection: 0.55,

    },

    preferredDirection: {

      control: 'high',

      sustain: 'low',

      attack: 'high',

      projection: 'either',

    },

  },

  {

    id: 'grounded-body-directed-carry',

    slotKey: 'shaped',

    title: 'Grounded body with directed carry',

    nodes: ['warmth', 'control', 'projection'],

    summary:

      'The drum is reading with body and room presence, but with enough control to keep the note organized.',

    relevance: {

      warmth: 1,

      control: 0.85,

      projection: 0.85,

    },

    preferredDirection: {

      warmth: 'high',

      control: 'high',

      projection: 'high',

    },

  },

  {

    id: 'articulate-snap-restraint',

    slotKey: 'simple',

    title: 'Articulate snap with restraint',

    nodes: ['brightness', 'control'],

    summary:

      'The drum is reading with more top-edge clarity while keeping the note contained.',

    relevance: {

      brightness: 1,

      control: 0.9,

    },

    preferredDirection: {

      brightness: 'high',

      control: 'high',

    },

  },

  {

    id: 'clear-front-edge-lift',

    slotKey: 'simple',

    title: 'Clear front edge with lift',

    nodes: ['attack', 'brightness'],

    summary:

      'The drum is reading with a clearer start and more upper edge.',

    relevance: {

      attack: 1,

      brightness: 0.85,

    },

    preferredDirection: {

      attack: 'high',

      brightness: 'high',

    },

  },

  {

    id: 'fast-disciplined-touch-response',

    slotKey: 'shaped',

    title: 'Fast, disciplined touch response',

    nodes: ['attack', 'sensitivity', 'control'],

    summary:

      'The drum is reading as responsive and quick, but with enough control to keep softer detail organized.',

    relevance: {

      attack: 0.9,

      sensitivity: 1,

      control: 0.9,

    },

    preferredDirection: {

      attack: 'high',

      sensitivity: 'high',

      control: 'high',

    },

  },

];

export function getRelationshipScore(relationship, profile = {}) {

  const relevance = relationship.relevance || {};

  const preferredDirection = relationship.preferredDirection || {};

  return Object.entries(relevance).reduce((score, [axis, weight]) => {

    const value = Number(profile?.[axis] ?? 5);

    const delta = value - 5;

    const direction = preferredDirection[axis] || 'either';

    let movement = Math.abs(delta);

    if (direction === 'high') {

      movement = Math.max(0, delta);

    }

    if (direction === 'low') {

      movement = Math.max(0, -delta);

    }

    return score + movement * weight;

  }, 0);

}

export function buildKeyRelationships(summary = {}) {

  const profile = summary?.profile || {};

  const ranked = KEY_RELATIONSHIP_DEFINITIONS.map((relationship) => ({

    ...relationship,

    score: getRelationshipScore(relationship, profile),

  })).sort((a, b) => b.score - a.score);

  const usedSlots = new Set();

  const slotted = ranked.filter((relationship) => {

    if (usedSlots.has(relationship.slotKey)) return false;

    usedSlots.add(relationship.slotKey);

    return true;

  });

  return slotted.slice(0, 3);

}

export function getPrimaryKeyRelationship(summary = {}) {

  return buildKeyRelationships(summary)[0] || null;

}

export default buildKeyRelationships;