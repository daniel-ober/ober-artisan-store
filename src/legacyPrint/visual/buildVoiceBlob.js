/**

 * Converts a voice profile into a deformable 2D shape

 * (used for visualization only)

 */

export function buildVoiceBlob(voice) {

  const {

    attack = 0.5,

    brightness = 0.5,

    sustain = 0.5,

    warmth = 0.5,

    control = 0.5,

  } = voice || {};

  const points = 32;

  const shape = [];

  for (let i = 0; i < points; i++) {

    const angle = (i / points) * Math.PI * 2;

    // base radius

    let r = 80;

    // deformation logic (this is the “sound DNA”)

    r += attack * 25 * Math.sin(angle * 2);

    r += sustain * 20 * Math.cos(angle * 3);

    r += brightness * 18 * Math.sin(angle * 4);

    r += warmth * 22 * Math.cos(angle * 2);

    r += control * 10 * Math.sin(angle * 6);

    shape.push({

      x: Math.cos(angle) * r,

      y: Math.sin(angle) * r,

    });

  }

  return shape;

}