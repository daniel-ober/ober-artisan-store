export function extractFirstListen(voice = {}) {

  const nodes = [

    { key: 'attack', value: voice.attack || 0 },

    { key: 'brightness', value: voice.brightness || 0 },

    { key: 'projection', value: voice.projection || 0 },

    { key: 'sustain', value: voice.sustain || 0 },

    { key: 'warmth', value: voice.warmth || 0 },

    { key: 'sensitivity', value: voice.sensitivity || 0 },

    { key: 'control', value: voice.control || 0 }

  ];

  // Sort by strongest perceptual presence

  const sorted = [...nodes].sort((a, b) => b.value - a.value);

  const top3 = sorted.slice(0, 3);

  // Convert into human-readable "First Listen" descriptors

  const mapDescriptor = (node) => {

    switch (node.key) {

      case 'attack':

        return 'Sharp initial transient / stick definition';

      case 'brightness':

        return 'High-frequency clarity and cut';

      case 'projection':

        return 'Front-of-room carry and throw';

      case 'sustain':

        return 'Length of tone and decay bloom';

      case 'warmth':

        return 'Low-mid body and tonal depth';

      case 'sensitivity':

        return 'Response to soft dynamics';

      case 'control':

        return 'Focus and damping / tightness';

      default:

        return 'Unknown';

    }

  };

  const title = buildTitle(top3);

  return {

    top3: top3.map((n) => ({

      node: n.key,

      strength: Number(n.value.toFixed(3)),

      description: mapDescriptor(n)

    })),

    title,

    summary: `${title} — dominated by ${top3.map(t => t.key).join(', ')}`

  };

}

function buildTitle(top3) {

  const [a, b, c] = top3.map(t => t.key);

  if (a === 'attack' && b === 'brightness') {

    return 'Fast articulate snap with bright edge';

  }

  if (a === 'warmth' && b === 'sustain') {

    return 'Deep warm body with long bloom';

  }

  if (a === 'projection') {

    return 'Forward-throwing open response';

  }

  if (a === 'control') {

    return 'Tight focused controlled response';

  }

  return `${capitalize(a)}-forward balanced voice`;

}

function capitalize(str) {

  return str.charAt(0).toUpperCase() + str.slice(1);

}