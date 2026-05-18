export function buildVoiceIndex(voice = {}) {

  const {

    attack = 0.5,

    brightness = 0.5,

    projection = 0.5,

    sustain = 0.5,

    warmth = 0.5,

    sensitivity = 0.5,

    control = 0.5,

  } = voice;

  return {

    // PRIMARY CLUSTERS (FAST FILTER LAYER)

    warmthBand: getBand(warmth),

    brightnessBand: getBand(brightness),

    sustainBand: getBand(sustain),

    attackBand: getBand(attack),

    // CHARACTER TAGS (SECONDARY FILTER)

    isWarm: warmth > 0.65,

    isBright: brightness > 0.65,

    isDry: sustain < 0.35,

    isControlled: control > 0.65,

    isSensitive: sensitivity > 0.65,

    isPunchy: attack > 0.65,

    // COMPOSITE SIGNATURE (FAST HASH-LIKE FILTER)

    signature: buildSignature({

      attack,

      brightness,

      sustain,

      warmth,

      control,

    }),

  };

}

function getBand(value) {

  if (value < 0.33) return 'low';

  if (value < 0.66) return 'mid';

  return 'high';

}

function buildSignature(v) {

  return [

    v.attack > 0.6 ? 1 : 0,

    v.brightness > 0.6 ? 1 : 0,

    v.sustain > 0.6 ? 1 : 0,

    v.warmth > 0.6 ? 1 : 0,

    v.control > 0.6 ? 1 : 0,

  ].join('');

}