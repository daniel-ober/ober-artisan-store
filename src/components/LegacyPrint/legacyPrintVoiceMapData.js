
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

export const AXIS_COLOR_BY_KEY = {

  attack: '#ff7448',

  brightness: '#e7d98f',

  projection: '#ffb53a',

  sustain: '#4d86ff',

  warmth: '#c1682e',

  sensitivity: '#68d9df',

  control: '#9e8bff',

};

export const LEGACYPRINT_AXIS_META = {

  Attack: {

    key: 'attack',

    low: 'Rounded',

    high: 'Immediate',

    sublabel: 'Quickness',

    icon: 'attack',

    meaning:

      'How quickly the drum speaks at the start of the note. Rounded attack feels softer and woodier; immediate attack feels quicker, sharper, and more defined.',

    rangeBar:

      'On a range bar, Attack shows where the drum tends to sit between a softer rounded front edge and a quicker, more immediate crack.',

    spiderChart:

      'On a spider chart, a longer Attack point means the drum speaks faster and more clearly at the first touch.',

    drummerRead:

      'Rounded feels woodier and softer. Immediate feels quicker, cleaner, and more articulate.',

  },

  Brightness: {

    key: 'brightness',

    low: 'Dark',

    high: 'Bright',

    sublabel: 'Top End',

    icon: 'brightness',

    meaning:

      'How much upper-register edge and clarity the drum has. Darker voices feel smoother and woodier; brighter voices feel more open, crisp, and cutting.',

    rangeBar:

      'On a range bar, Brightness shows how much top-end edge, clarity, and cut the drum has.',

    spiderChart:

      'On a spider chart, a longer Brightness point means more upper-register clarity and bite.',

    drummerRead:

      'Dark feels smoother and woodier. Bright feels clearer, crisper, and more cutting.',

  },

  Projection: {

    key: 'projection',

    low: 'Close',

    high: 'Forward',

    sublabel: 'Throw',

    icon: 'projection',

    meaning:

      'How strongly the drum carries into the room or mix. A closer voice feels intimate and controlled; a forward voice pushes more presence and authority.',

    rangeBar:

      'On a range bar, Projection shows whether the drum sits close to the kit or steps forward into the room.',

    spiderChart:

      'On a spider chart, a longer Projection point means the drum should carry farther and feel more present in a mix.',

    drummerRead:

      'Close feels contained and intimate. Forward feels stronger, more present, and more commanding.',

  },

  Sustain: {

    key: 'sustain',

    low: 'Short',

    high: 'Open',

    sublabel: 'Length',

    icon: 'sustain',

    meaning:

      'How long the note carries after the initial hit. Shorter sustain feels controlled and dry; more open sustain adds bloom, air, and room presence.',

    rangeBar:

      'On a range bar, Sustain shows whether the drum leans drier and tighter or lets the note breathe longer after the hit.',

    spiderChart:

      'On a spider chart, a longer Sustain point means more bloom, more ring, and more air around the note.',

    drummerRead:

      'Short feels tighter and drier. Open feels roomier, bloomier, and more alive after the stroke.',

  },

  Warmth: {

    key: 'warmth',

    low: 'Lean',

    high: 'Warm',

    sublabel: 'Body',

    icon: 'warmth',

    meaning:

      'How much body, depth, and low-mid character the drum carries. Leaner voices feel cleaner and tighter; warmer voices feel fuller, rounder, and more organic.',

    rangeBar:

      'On a range bar, Warmth shows how much low-mid body and wood character is expected in the voice.',

    spiderChart:

      'On a spider chart, a longer Warmth point means the drum should feel fuller, rounder, and more centered in the body.',

    drummerRead:

      'Lean feels cleaner and tighter. Warm feels fuller, woodier, and more rounded through the center.',

  },

  Sensitivity: {

    key: 'sensitivity',

    low: 'Forgiving',

    high: 'Responsive',

    sublabel: 'Response',

    icon: 'sensitivity',

    meaning:

      'How easily the drum reacts to lighter playing. A forgiving response feels stable and controlled; a responsive drum reveals more ghost notes, touch, and nuance.',

    rangeBar:

      'On a range bar, Sensitivity shows how readily the drum responds to soft strokes, ghost notes, and small changes in touch.',

    spiderChart:

      'On a spider chart, a longer Sensitivity point means the drum reveals more subtle playing detail.',

    drummerRead:

      'Forgiving feels stable and controlled. Responsive feels more detailed, touchy, and alive under lighter hands.',

  },

  Control: {

    key: 'control',

    low: 'Open',

    high: 'Composed',

    sublabel: 'Focus',

    icon: 'control',

    meaning:

      'How organized the overall note feels. More open drums have extra movement and spread; more composed drums keep the note focused and easier to manage.',

    rangeBar:

      'On a range bar, Control shows whether the note has more movement and spread or stays focused and organized.',

    spiderChart:

      'On a spider chart, a longer Control point means the drum should feel more composed, focused, and easy to place.',

    drummerRead:

      'Open feels more lively and loose. Composed feels focused, tidy, and easier to control.',

  },

};

export const VOICE_NODE_GUIDE = Object.entries(LEGACYPRINT_AXIS_META).map(

  ([label, meta]) => ({

    label,

    ...meta,

  })

);

export const GUIDE_NODE_POSITIONS = {

  attack: { x: 50, y: 10.5 },

  brightness: { x: 80.9, y: 25.4 },

  projection: { x: 88.5, y: 58.8 },

  sustain: { x: 67.2, y: 85.8 },

  warmth: { x: 32.8, y: 85.8 },

  sensitivity: { x: 11.5, y: 58.8 },

  control: { x: 19.1, y: 25.4 },

};

export const MetricIcon = ({ type, color = '#d6b277', size = 16 }) => {

  const iconProps = {

    size,

    strokeWidth: 2.15,

    color,

    'aria-hidden': true,

  };

  switch (type) {

    case 'attack':

      return <Zap {...iconProps} />;

    case 'sustain':

      return <Waves {...iconProps} />;

    case 'warmth':

      return <Flame {...iconProps} />;

    case 'projection':

      return <Volume2 {...iconProps} />;

    case 'brightness':

      return <SunMedium {...iconProps} />;

    case 'sensitivity':

      return <Feather {...iconProps} />;

    case 'control':

      return <Crosshair {...iconProps} />;

    default:

      return <Zap {...iconProps} />;

  }

};

