// src/utils/legacyPrint/buildHeritageIdentityShapeRead.js

const HARDWARE_VOICE_COPY = {

  Chrome: {

    titleModifier: '',

    phrase: 'framed by clean, timeless chrome hardware',

    visualMood: 'clear, familiar, and understated',

  },

  'Black Nickel': {

    titleModifier: 'Shadowed',

    phrase: 'framed by darker black nickel hardware',

    visualMood: 'moodier, more modern, and slightly more restrained',

  },

  'Brass/Gold': {

    titleModifier: 'Gilded',

    phrase: 'framed by warmer brass / gold hardware',

    visualMood: 'richer, more elevated, and more ceremonial',

  },

};

const AXIS_LABELS = {

  attack: 'Attack',

  brightness: 'Brightness',

  projection: 'Projection',

  sustain: 'Sustain',

  warmth: 'Warmth',

  sensitivity: 'Sensitivity',

  control: 'Control',

};

const AXIS_ORDER = [

  'attack',

  'brightness',

  'projection',

  'sustain',

  'warmth',

  'sensitivity',

  'control',

];

const clamp = (value, min, max) => {

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) return min;

  return Math.max(min, Math.min(max, numberValue));

};

const normalizeText = (value = '') => {

  return String(value || '').trim();

};

const getAxisDelta = (profile = {}, axis) => {

  return Number(profile?.[axis] ?? 5) - 5;

};

const getDepthVoiceLabel = (depth) => {

  const depthNumber = Number(depth);

  if (!Number.isFinite(depthNumber)) return 'Standard Voice';

  if (depthNumber <= 5) return 'Short Voice';

  if (depthNumber <= 6.5) return 'Full Voice';

  if (depthNumber <= 7.5) return 'Deep Voice';

  return 'Maximum Depth Voice';

};

const getShellRecipeLabel = ({ lugs, staveOption }) => {

  const lugCount = Number(lugs);

  const text = String(staveOption || '');

  const staveMatch = text.match(/^(\d+)/);

  const thicknessMatch = text.match(/-\s*(\d+(?:\.\d+)?)mm/i);

  const staveCount = staveMatch ? Number(staveMatch[1]) : null;

  const thickness = thicknessMatch ? Number(thicknessMatch[1]) : null;

  if (lugCount === 6 && thickness <= 8) {

    return '6-Lug Thin Re-Ring Shell';

  }

  if (lugCount === 10 && thickness >= 12) {

    return '10-Lug Firm Shell';

  }

  if (lugCount === 10 && thickness <= 8) {

    return '10-Lug Thin Re-Ring Shell';

  }

  if (staveCount && thickness) {

    return `${lugCount || 8}-Lug ${staveCount}-Stave ${thickness}mm Shell`;

  }

  return `${lugCount || 8}-Lug Reference Stave`;

};

const getHoopFrameLabel = (hoopType) => {

  return hoopType === 'Die-Cast' ? 'Locked Frame' : 'Open Frame';

};

const getSizeLabel = ({ size, depth }) => {

  const sizeText = String(size || '').replace('"', '');

  const depthNumber = Number(depth);

  if (!sizeText || !Number.isFinite(depthNumber)) return '';

  return `${sizeText}x${depthNumber.toFixed(1).replace('.0', '')}`;

};

const getSpecMeta = ({

  spec = {},

  size,

  depth,

  lugs,

  staveOption,

  hoopType,

  hardwareColor,

  scorchDepth,

}) => {

  const staveText = normalizeText(staveOption);

  const staveMatch = staveText.match(/^(\d+)/);

  const thicknessMatch = staveText.match(/-\s*(\d+(?:\.\d+)?)mm/i);

  const resolvedSize = Number(spec.width ?? size);

  const resolvedDepth = Number(spec.depth ?? depth);

  const resolvedLugs = Number(spec.lugQuantity ?? lugs);

  const resolvedStaveCount = Number(

    spec.staveCount ?? (staveMatch ? Number(staveMatch[1]) : 16)

  );

  const resolvedThickness = Number(

    spec.shellThicknessMm ??

      spec.thicknessMm ??

      (thicknessMatch ? Number(thicknessMatch[1]) : 10)

  );

  const resolvedHoop = normalizeText(spec.hoopType ?? hoopType);

  const resolvedHardware = normalizeText(spec.hardwareFinish ?? hardwareColor);

  const resolvedFinish = normalizeText(spec.finish ?? scorchDepth);

  const hasReRings =

    normalizeText(spec.reRings).toLowerCase() === 'standard' ||

    staveText.toLowerCase().includes('re-rings') ||

    staveText.includes('+$150') ||

    staveText.includes('+ $150');

  return {

    size: Number.isFinite(resolvedSize) ? resolvedSize : 14,

    depth: Number.isFinite(resolvedDepth) ? resolvedDepth : 5.5,

    lugs: Number.isFinite(resolvedLugs) ? resolvedLugs : 8,

    staveCount: Number.isFinite(resolvedStaveCount) ? resolvedStaveCount : 16,

    thickness: Number.isFinite(resolvedThickness) ? resolvedThickness : 10,

    hoopType: resolvedHoop || 'Triple Flange',

    hardwareColor: resolvedHardware || 'Chrome',

    scorchDepth: resolvedFinish || 'Medium Torch',

    hasReRings,

  };

};

const getIdentityFamily = ({ meta, profile = {}, canonicalNodes = [] }) => {

  const attack = getAxisDelta(profile, 'attack');

  const brightness = getAxisDelta(profile, 'brightness');

  const projection = getAxisDelta(profile, 'projection');

  const sustain = getAxisDelta(profile, 'sustain');

  const warmth = getAxisDelta(profile, 'warmth');

  const sensitivity = getAxisDelta(profile, 'sensitivity');

  const control = getAxisDelta(profile, 'control');

  const isCompact = meta.size <= 12 || meta.depth <= 5;

  const isDeep = meta.depth >= 7;

  const isVeryDeep = meta.depth >= 7.5;

  const isThin = meta.thickness <= 8;

  const isFirm = meta.thickness >= 12;

  const isTenLug = meta.lugs >= 10;

  const isSixLug = meta.lugs <= 6;

  const isDieCast = meta.hoopType === 'Die-Cast';

  const isBlackened = meta.scorchDepth === 'Blackened';

  const isLight = meta.scorchDepth === 'Light Torch';

  if (isBlackened && control >= 0.35 && sustain <= -0.2) {

    return 'blackenedControlled';

  }

  if (isBlackened && isDeep && warmth >= 0.1) {

    return 'blackenedDeep';

  }

  if (isTenLug && isFirm && isDieCast) {

    return 'lockedAuthority';

  }

  if (isTenLug && isFirm) {

    return 'firmAuthority';

  }

  if (isVeryDeep && warmth >= 0.25 && sustain >= 0.15) {

    return 'deepBloom';

  }

  if (isDeep && warmth >= 0.2) {

    return 'warmDepth';

  }

  if (isThin && meta.hasReRings && sensitivity >= 0.1) {

    return 'supportedBreath';

  }

  if (isThin && isSixLug) {

    return 'openThin';

  }

  if (isCompact && attack >= 0.25 && brightness >= 0.2) {

    return 'quickSpark';

  }

  if (isDieCast && attack >= 0.35 && control >= 0.25) {

    return 'focusedCrack';

  }

  if (projection >= 0.3 && control >= 0.2) {

    return 'forwardControl';

  }

  if (warmth >= 0.25 && sustain >= 0.15) {

    return 'warmBloom';

  }

  if (sensitivity >= 0.25 || canonicalNodes.includes('sensitivity')) {

    return isLight ? 'lightTouch' : 'touchResponse';

  }

  if (control >= 0.25) {

    return 'cleanControl';

  }

  return 'heritageCenter';

};

const NAME_POOLS = {

  quickSpark: [

    'Fallowick',

    'Narrowbell',

    'Thornwell',

    'Sparkhollow',

    'Tinderly',

    'Brindle',

    'Flintrow',

    'Quickvale',

    'Kettlebright',

    'Hushspark',

    'Whistlewood',

    'Cinderquick',

  ],

  focusedCrack: [

    'Ironwake',

    'Lockwood',

    'Narrowwell',

    'Tackhouse',

    'Flintlock',

    'Rimwarden',

    'Hardwake',

    'Strikefield',

    'Railthorn',

    'Knockroot',

    'Ironbell',

    'Latchwood',

  ],

  blackenedControlled: [

    'Blackroot',

    'Gravebell',

    'Emberlain',

    'Ashborne',

    'Warden',

    'Cinderfell',

    'Coalhymn',

    'Duskwick',

    'Sootrail',

    'Gravewood',

    'Lowember',

    'Nightstave',

  ],

  blackenedDeep: [

    'Hollowgrave',

    'Blackhollow',

    'Morrowroot',

    'Ashdeep',

    'Gravehymn',

    'Emberfield',

    'Duskmorrow',

    'Lowroot',

    'Coalwater',

    'Blackveil',

    'Nightbloom',

    'Hearthgrave',

  ],

  lockedAuthority: [

    'Ironvale',

    'Oathrail',

    'Brasswake',

    'Wardenfield',

    'Lockhymn',

    'Railwood',

    'Saintgrain',

    'Hardwarden',

    'Anvilwake',

    'Ironhollow',

    'Bellwarden',

    'Oaklock',

  ],

  firmAuthority: [

    'Highwarden',

    'Ironfield',

    'Oakrail',

    'Firmroot',

    'Bellwake',

    'Stavewarden',

    'Hearthrail',

    'Oathwood',

    'Goldharrow',

    'Rimfield',

    'Lockvale',

    'Stonehymn',

  ],

  deepBloom: [

    'Hearthwood',

    'Hollowfield',

    'Oakveil',

    'Morrow',

    'Deepmorrow',

    'Low Lantern',

    'Hearthhollow',

    'Bloomfield',

    'Oakmorrow',

    'Wellwood',

    'Roomhymn',

    'Hollowoak',

  ],

  warmDepth: [

    'Heartwood',

    'Morrowfield',

    'Oakbloom',

    'Hearthvale',

    'Backroom',

    'Lowfield',

    'Warmhollow',

    'Roomwood',

    'Hymnwood',

    'Oakhymn',

    'Hearthbell',

    'Deepwell',

  ],

  warmBloom: [

    'Oakveil',

    'Hearthbloom',

    'Brindlewood',

    'Warmwell',

    'Bloomroot',

    'Gospelwood',

    'Lowbloom',

    'Hearthgrain',

    'Roombloom',

    'Morrowbell',

    'Oaklantern',

    'Fieldhymn',

  ],

  supportedBreath: [

    'Breathwood',

    'Hollowtouch',

    'Softrail',

    'Lacewood',

    'Openhymn',

    'Thinwell',

    'Brindlebreath',

    'Bloomlace',

    'Lightwell',

    'Hushwood',

    'Softstave',

    'Oakwhisper',

  ],

  openThin: [

    'Openwell',

    'Fallowbloom',

    'Hushhollow',

    'Softwood',

    'Hearthdrift',

    'Loomwood',

    'Morrowbreath',

    'Roundwell',

    'Loosegrain',

    'Driftwood',

    'Airhymn',

    'Willowbell',

  ],

  forwardControl: [

    'Throwfield',

    'Roomwarden',

    'Carrywell',

    'Forwardoak',

    'Bellthrow',

    'Oakthrow',

    'Projectionwell',

    'Railbloom',

    'Fieldwake',

    'Hearththrow',

    'Carryroot',

    'Rimcarry',

  ],

  lightTouch: [

    'Lightwell',

    'Fallowair',

    'Open Lantern',

    'Rawhymn',

    'Airwood',

    'Touchfield',

    'Brightmorrow',

    'Featheroak',

    'Softspark',

    'Clearhollow',

    'Livelyroot',

    'Hushbright',

  ],

  touchResponse: [

    'Touchwood',

    'Featherwell',

    'Softwake',

    'Hushgrain',

    'Ghostnote',

    'Liltwood',

    'Whisperfield',

    'Fingerhymn',

    'Bloomtouch',

    'Hearthtouch',

    'Roundtouch',

    'Ghostwood',

  ],

  cleanControl: [

    'Centerwell',

    'Cleanhymn',

    'Oakcenter',

    'Wardenoak',

    'Tidyroot',

    'Heldwood',

    'Composed Oak',

    'Calmrail',

    'Settlewood',

    'Roomcenter',

    'Stillbell',

    'Clearwarden',

  ],

  heritageCenter: [

    'Hearthline',

    'Oakroom',

    'Oldwood',

    'Backroom',

    'Hymnwell',

    'Rootbell',

    'Heritage Well',

    'Oakhouse',

    'Warmrail',

    'Fieldroom',

    'Commonoak',

    'Centergrain',

  ],

};

const FINISH_NAME_MODIFIERS = {

  'Light Torch': ['Light', 'Fallow', 'Raw', 'Open', 'Clear'],

  'Medium Torch': ['', 'Torch', 'Hearth', 'Oak', 'Seasoned'],

  Blackened: ['Black', 'Ash', 'Grave', 'Dusk', 'Ember'],

};

const HARDWARE_NAME_MODIFIERS = {

  Chrome: ['', 'Clear', 'Bright'],

  'Black Nickel': ['Shadow', 'Dusk', 'Smoke'],

  'Brass/Gold': ['Gilded', 'Gold', 'Saint', 'Brass'],

};

const LEGACY_MARK_FIRST_WORDS = {

  attack: [

    'Strike',

    'Flint',

    'Tack',

    'Spark',

    'Crack',

    'Knock',

    'Snap',

    'Rim',

    'Quick',

    'Hard',

  ],

  brightness: [

    'Clear',

    'Bright',

    'Glass',

    'Lantern',

    'Cinder',

    'Bell',

    'Light',

    'Edge',

    'Shine',

    'Cut',

  ],

  projection: [

    'Throw',

    'Carry',

    'Room',

    'Field',

    'Forward',

    'Wake',

    'Reach',

    'Rail',

    'Outer',

    'Crown',

  ],

  sustain: [

    'Bloom',

    'Hollow',

    'Long',

    'Ring',

    'Open',

    'Drift',

    'Wave',

    'After',

    'Trail',

    'Breath',

  ],

  warmth: [

    'Hearth',

    'Oak',

    'Root',

    'Low',

    'Body',

    'Warm',

    'Grain',

    'Wood',

    'Amber',

    'Round',

  ],

  sensitivity: [

    'Touch',

    'Feather',

    'Ghost',

    'Soft',

    'Lilt',

    'Whisper',

    'Fine',

    'Finger',

    'Air',

    'Pulse',

  ],

  control: [

    'Warden',

    'Held',

    'Lock',

    'Center',

    'Calm',

    'Settle',

    'Tidy',

    'Frame',

    'Bound',

    'Still',

  ],

};

const LEGACY_MARK_SECOND_WORDS = {

  compact: [

    'Vale',

    'Pocket',

    'Bell',

    'Row',

    'Point',

    'Stem',

    'Wick',

    'House',

    'Sprig',

    'Nook',

  ],

  main: [

    'Field',

    'Room',

    'Line',

    'Well',

    'House',

    'Rail',

    'Grain',

    'Hymn',

    'Root',

    'Path',

  ],

  deep: [

    'Hollow',

    'Morrow',

    'Water',

    'Lantern',

    'Well',

    'Chamber',

    'Bloom',

    'Basin',

    'Lowland',

    'Vault',

  ],

  thin: [

    'Lace',

    'Breath',

    'Willow',

    'Thread',

    'Hush',

    'Drift',

    'Veil',

    'Wing',

    'Leaf',

    'Softline',

  ],

  firm: [

    'Rail',

    'Stone',

    'Anvil',

    'Oath',

    'Lock',

    'Frame',

    'Warden',

    'Iron',

    'Ridge',

    'Post',

  ],

  blackened: [

    'Ash',

    'Dusk',

    'Coal',

    'Grave',

    'Night',

    'Ember',

    'Smoke',

    'Cinder',

    'Soot',

    'Shadow',

  ],

  light: [

    'Fallow',

    'Raw',

    'Clear',

    'Air',

    'Open',

    'Sun',

    'Straw',

    'Pale',

    'Bright',

    'Early',

  ],

  locked: [

    'Lock',

    'Frame',

    'Latch',

    'Warden',

    'Rail',

    'Gate',

    'Hold',

    'Brace',

    'Anchor',

    'Set',

  ],

  open: [

    'Open',

    'Bloom',

    'Drift',

    'Room',

    'Breath',

    'Spread',

    'Hollow',

    'Loam',

    'Field',

    'Air',

  ],

};

const seededHash = (value = '') => {

  const text = String(value || '');

  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {

    hash ^= text.charCodeAt(index);

    hash = Math.imul(hash, 16777619);

  }

  return Math.abs(hash >>> 0);

};

const pickSeeded = (items = [], seed = '') => {

  if (!items.length) return '';

  const hash = seededHash(seed);

  return items[hash % items.length];

};

const cleanBirthName = (name = '') => {

  return String(name || '').replace(/\s+/g, ' ').trim();

};

const getBirthNameSeed = ({ meta, profile = {}, canonicalNodes = [], family }) => {

  const profileSignature = AXIS_ORDER.map(

    (axis) => `${axis}:${Number(profile?.[axis] ?? 5).toFixed(2)}`

  ).join('|');

  return [

    family,

    meta.size,

    meta.depth,

    meta.lugs,

    meta.staveCount,

    meta.thickness,

    meta.hoopType,

    meta.hardwareColor,

    meta.scorchDepth,

    meta.hasReRings ? 'rerings' : 'norering',

    canonicalNodes.join('-'),

    profileSignature,

  ].join('|');

};

const buildBirthName = ({ meta, profile, canonicalNodes }) => {

  const family = getIdentityFamily({ meta, profile, canonicalNodes });

  const pool = NAME_POOLS[family] || NAME_POOLS.heritageCenter;

  const seed = getBirthNameSeed({ meta, profile, canonicalNodes, family });

  const baseName = pickSeeded(pool, seed);

  const finishModifier = pickSeeded(

    FINISH_NAME_MODIFIERS[meta.scorchDepth] ||

      FINISH_NAME_MODIFIERS['Medium Torch'],

    `${seed}|finish`

  );

  const hardwareModifier = pickSeeded(

    HARDWARE_NAME_MODIFIERS[meta.hardwareColor] || HARDWARE_NAME_MODIFIERS.Chrome,

    `${seed}|hardware`

  );

  const shouldUseFinishModifier =

    meta.scorchDepth !== 'Medium Torch' &&

    seededHash(`${seed}|useFinish`) % 3 === 0;

  const shouldUseHardwareModifier =

    meta.hardwareColor !== 'Chrome' &&

    seededHash(`${seed}|useHardware`) % 4 === 0;

  const prefix =

    shouldUseHardwareModifier && hardwareModifier

      ? hardwareModifier

      : shouldUseFinishModifier && finishModifier

        ? finishModifier

        : '';

  if (!prefix) {

    return cleanBirthName(baseName);

  }

  const lowerBase = baseName.toLowerCase();

  const lowerPrefix = prefix.toLowerCase();

  if (lowerBase.startsWith(lowerPrefix)) {

    return cleanBirthName(baseName);

  }

  return cleanBirthName(`${prefix} ${baseName}`);

};

const getPrimaryAxis = ({ profile = {}, canonicalNodes = [] }) => {

  const canonicalFirst = canonicalNodes?.[0];

  if (canonicalFirst && AXIS_LABELS[canonicalFirst]) {

    return canonicalFirst;

  }

  return AXIS_ORDER.map((axis) => ({

    axis,

    movement: Math.abs(getAxisDelta(profile, axis)),

  })).sort((a, b) => b.movement - a.movement)[0]?.axis || 'warmth';

};

const getSecondaryAxis = ({ profile = {}, canonicalNodes = [] }) => {

  const primary = getPrimaryAxis({ profile, canonicalNodes });

  const canonicalSecond = canonicalNodes.find(

    (nodeKey) => nodeKey !== primary && AXIS_LABELS[nodeKey]

  );

  if (canonicalSecond) {

    return canonicalSecond;

  }

  return (

    AXIS_ORDER.map((axis) => ({

      axis,

      movement: Math.abs(getAxisDelta(profile, axis)),

    }))

      .filter((item) => item.axis !== primary)

      .sort((a, b) => b.movement - a.movement)[0]?.axis || 'control'

  );

};

const getLegacyMarkSecondPoolKey = (meta) => {

  if (meta.scorchDepth === 'Blackened') return 'blackened';

  if (meta.scorchDepth === 'Light Torch') return 'light';

  if (meta.hoopType === 'Die-Cast') return 'locked';

  if (meta.thickness >= 12 || meta.lugs >= 10) return 'firm';

  if (meta.thickness <= 8 || meta.hasReRings) return 'thin';

  if (meta.depth >= 7) return 'deep';

  if (meta.size <= 12 || meta.depth <= 5.5) return 'compact';

  return 'main';

};

const buildLegacyMark = ({ meta, profile = {}, canonicalNodes = [] }) => {

  const primaryAxis = getPrimaryAxis({ profile, canonicalNodes });

  const secondaryAxis = getSecondaryAxis({ profile, canonicalNodes });

  const secondPoolKey = getLegacyMarkSecondPoolKey(meta);

  const seed = getBirthNameSeed({

    meta,

    profile,

    canonicalNodes,

    family: `legacy-mark-${primaryAxis}-${secondaryAxis}-${secondPoolKey}`,

  });

  const firstWord = pickSeeded(

    LEGACY_MARK_FIRST_WORDS[primaryAxis] || LEGACY_MARK_FIRST_WORDS.warmth,

    `${seed}|first`

  );

  const secondWord = pickSeeded(

    LEGACY_MARK_SECOND_WORDS[secondPoolKey] || LEGACY_MARK_SECOND_WORDS.main,

    `${seed}|second`

  );

  const combined = cleanBirthName(`${firstWord}${secondWord}`);

  return combined;

};

const buildIdentitySeal = ({ meta, profile = {}, canonicalNodes = [] }) => {

  const seed = getBirthNameSeed({

    meta,

    profile,

    canonicalNodes,

    family: 'identity-seal',

  });

  const rawSeal = seededHash(seed)

    .toString(36)

    .toUpperCase()

    .replace(/[^A-Z0-9]/g, '')

    .padStart(5, '0')

    .slice(0, 5);

  return rawSeal;

};

const buildIdentityTitle = ({ meta, profile = {}, canonicalNodes = [] }) => {

  const birthName = buildBirthName({

    meta,

    profile,

    canonicalNodes,

  });

  const legacyMark = buildLegacyMark({

    meta,

    profile,

    canonicalNodes,

  });

  const identitySeal = buildIdentitySeal({

    meta,

    profile,

    canonicalNodes,

  });

  let resolvedName = birthName;

  if (legacyMark) {

    const normalizedBirthName = birthName.toLowerCase().replace(/\s+/g, '');

    const normalizedLegacyMark = legacyMark.toLowerCase().replace(/\s+/g, '');

    const shouldAppendLegacyMark =

      normalizedBirthName !== normalizedLegacyMark &&

      !normalizedBirthName.includes(normalizedLegacyMark) &&

      !normalizedLegacyMark.includes(normalizedBirthName);

    if (shouldAppendLegacyMark) {

      resolvedName = `${birthName} ${legacyMark}`;

    }

  }

  return cleanBirthName(`${resolvedName} Mark ${identitySeal}`);

};

const buildNameReason = ({ meta, profile = {}, canonicalNodes = [] }) => {

  const nodeLabels = canonicalNodes

    .map((nodeKey) => AXIS_LABELS[nodeKey] || nodeKey)

    .filter(Boolean);

  const strongestDeltas = AXIS_ORDER.map((axis) => ({

    axis,

    label: AXIS_LABELS[axis],

    delta: getAxisDelta(profile, axis),

    movement: Math.abs(getAxisDelta(profile, axis)),

  }))

    .sort((a, b) => b.movement - a.movement)

    .slice(0, 3);

  const strongestRead = strongestDeltas

    .map((item) => {

      const direction = item.delta >= 0 ? 'above' : 'below';

      return `${item.label} ${direction} center`;

    })

    .join(', ');

  return [

    `${meta.size}x${String(meta.depth).replace('.0', '')}`,

    getDepthVoiceLabel(meta.depth),

    getShellRecipeLabel({

      lugs: meta.lugs,

      staveOption: `${meta.staveCount} - ${meta.thickness}mm${

        meta.hasReRings ? ' + $150 (Re-Rings Required)' : ''

      }`,

    }),

    getHoopFrameLabel(meta.hoopType),

    meta.scorchDepth,

    meta.hardwareColor,

    nodeLabels.length ? `nodes: ${nodeLabels.join(' / ')}` : '',

    strongestRead,

  ]

    .filter(Boolean)

    .join(' • ');

};

export default function buildHeritageIdentityShapeRead({

  baseTitle = 'Classic Heritage Voice Print',

  canonicalNodes = [],

  hardwareColor = 'Chrome',

  scorchDepth = 'Medium Torch',

  hoopType = 'Triple Flange',

  size,

  depth,

  lugs,

  staveOption,

  spec = {},

  profile = {},

}) {

  const meta = getSpecMeta({

    spec,

    size,

    depth,

    lugs,

    staveOption,

    hoopType,

    hardwareColor,

    scorchDepth,

  });

  const hardware =

    HARDWARE_VOICE_COPY[meta.hardwareColor] || HARDWARE_VOICE_COPY.Chrome;

  const cleanBaseTitle = String(baseTitle || 'Classic Heritage Voice Print')

    .replace(/^(Shadowed|Gilded)\s+/i, '')

    .replace(/\s+—\s+.*$/u, '')

    .trim();

  const sizeLabel = getSizeLabel({

    size: meta.size,

    depth: meta.depth,

  });

  const titleDetails = [

    sizeLabel,

    getDepthVoiceLabel(meta.depth),

    getShellRecipeLabel({

      lugs: meta.lugs,

      staveOption: `${meta.staveCount} - ${meta.thickness}mm${

        meta.hasReRings ? ' + $150 (Re-Rings Required)' : ''

      }`,

    }),

    getHoopFrameLabel(meta.hoopType),

  ].filter(Boolean);

  const identityTitle = buildIdentityTitle({

    meta,

    profile,

    canonicalNodes,

  });

  const debugTitle = `${cleanBaseTitle} — ${titleDetails.join(', ')}`;

  const finishMood =

    meta.scorchDepth === 'Blackened'

      ? 'The darker finish pulls the identity toward a drier, more dramatic visual and playing posture.'

      : meta.scorchDepth === 'Light Torch'

        ? 'The lighter torching keeps the identity more open, raw, and natural.'

        : 'The medium torch finish keeps the identity close to the seasoned Heritage center.';

  const hoopMood =

    meta.hoopType === 'Die-Cast'

      ? 'Die-cast hoops add a more locked-in frame around the response.'

      : 'Triple flange hoops leave more of the drum’s natural openness exposed.';

  const nodePhrase = canonicalNodes.length

    ? `Its strongest identity nodes are ${canonicalNodes.join(', ')}.`

    : 'Its strongest identity nodes stay close to the Heritage center.';

  const nameReason = buildNameReason({

    meta,

    profile,

    canonicalNodes,

  });

  return {

    title: identityTitle,

    summary: `The Identity Shape is the artistic layer of this read: sound, feel, finish, hardware, and the kind of playing the drum seems to invite. This build is ${hardware.phrase}, giving the drum a ${hardware.visualMood} presence. ${finishMood} ${hoopMood} ${nodePhrase}`,

    hardwarePhrase: hardware.phrase,

    visualMood: hardware.visualMood,

    nodes: canonicalNodes,

    identityBirthName: identityTitle,

    identityDebugTitle: debugTitle,

    identityNameReason: nameReason,

  };

}