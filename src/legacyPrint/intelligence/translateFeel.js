export function translateFeel(voice) {

  const {

    attack,

    brightness,

    sustain,

    warmth,

    control,

  } = voice;

  const phrases = [];

  // ATTACK

  if (attack > 0.7) phrases.push('sharp transient snap');

  else if (attack < 0.3) phrases.push('soft rounded onset');

  // BRIGHTNESS

  if (brightness > 0.7) phrases.push('bright cutting top-end');

  else if (brightness < 0.3) phrases.push('dark muted tone');

  // SUSTAIN

  if (sustain > 0.7) phrases.push('long open decay');

  else if (sustain < 0.3) phrases.push('tight controlled decay');

  // WARMTH

  if (warmth > 0.7) phrases.push('rich warm body');

  else if (warmth < 0.3) phrases.push('dry focused core');

  // CONTROL

  if (control > 0.7) phrases.push('highly controlled response');

  else if (control < 0.3) phrases.push('loose responsive feel');

  return phrases.join(', ');

}