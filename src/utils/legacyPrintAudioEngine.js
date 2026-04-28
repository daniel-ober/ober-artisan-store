const SNARE_SAMPLE_PATHS = {

  snare10x4Maple: '/audio/legacyprint/10x4-maple.wav',

  snare12x7Maple: '/audio/legacyprint/12x7-maple.wav',

  snare13x7Birch: '/audio/legacyprint/13x7-birch.wav',

  snare14x5MapleCherry: '/audio/legacyprint/14x5-maple-cherry.wav',

  snare14x6Oak: '/audio/legacyprint/14x6.5-oak.wav',

  snare14x8Brass: '/audio/legacyprint/14x8-brass.wav',

  snare14x8Maple: '/audio/legacyprint/14x8-maple.wav',

};

let audioContext = null;

const bufferCache = new Map();

const getAudioContext = () => {

  if (!audioContext) {

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    audioContext = new AudioContextClass();

  }

  return audioContext;

};

const loadAudioBuffer = async (sampleKey) => {

  const samplePath =

    SNARE_SAMPLE_PATHS[sampleKey] || SNARE_SAMPLE_PATHS.snare10x4Maple;

  if (bufferCache.has(samplePath)) {

    return bufferCache.get(samplePath);

  }

  const context = getAudioContext();

  const response = await fetch(samplePath);

  if (!response.ok) {

    throw new Error(`Could not load sample: ${samplePath}`);

  }

  const arrayBuffer = await response.arrayBuffer();

  const audioBuffer = await context.decodeAudioData(arrayBuffer);

  bufferCache.set(samplePath, audioBuffer);

  return audioBuffer;

};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const normalizeNodeValue = (value, fallback = 6) => {

  const safeValue = Number.isFinite(Number(value)) ? Number(value) : fallback;

  return clamp(safeValue, 1, 10);

};

const mapRange = (value, inMin, inMax, outMin, outMax) => {

  const percent = (value - inMin) / (inMax - inMin);

  return outMin + percent * (outMax - outMin);

};

const getNodeIntensity = (value) => {

  return (normalizeNodeValue(value) - 1) / 9;

};

const getTeachingAmount = (engineMode) => {

  return engineMode === 'realistic' ? 0.34 : 1.18;

};

const getHitStrengthLabel = (hitStrength) => {

  if (hitStrength === 'soft') {

    return 'soft';

  }

  if (hitStrength === 'hard') {

    return 'hard';

  }

  return 'medium';

};

const getHitProfile = (hitStrength) => {

  const hit = getHitStrengthLabel(hitStrength);

  if (hit === 'soft') {

    return {

      hitAmount: 0.38,

      mainLevel: 0.68,

      attackScale: 0.56,

      brightnessScale: 0.74,

      projectionScale: 0.48,

      sustainScale: 0.38,

      warmthScale: 0.52,

      bodyScale: 0.44,

      controlScale: 1.08,

      sensitivityScale: 1.45,

      headContactScale: 1.34,

      wireScale: 1.18,

      shellWakeScale: 0.42,

      roomScale: 0.28,

      decayScale: 0.66,

    };

  }

  if (hit === 'hard') {

    return {

      hitAmount: 1,

      mainLevel: 1.08,

      attackScale: 1.22,

      brightnessScale: 1.08,

      projectionScale: 1.28,

      sustainScale: 1.34,

      warmthScale: 1.18,

      bodyScale: 1.24,

      controlScale: 0.86,

      sensitivityScale: 0.82,

      headContactScale: 0.84,

      wireScale: 1.08,

      shellWakeScale: 1.38,

      roomScale: 1.38,

      decayScale: 1.2,

    };

  }

  return {

    hitAmount: 0.72,

    mainLevel: 0.92,

    attackScale: 0.92,

    brightnessScale: 0.94,

    projectionScale: 0.9,

    sustainScale: 0.86,

    warmthScale: 0.9,

    bodyScale: 0.9,

    controlScale: 1,

    sensitivityScale: 1,

    headContactScale: 1,

    wireScale: 1,

    shellWakeScale: 0.88,

    roomScale: 0.86,

    decayScale: 0.92,

  };

};

const safeDisconnect = (node) => {

  try {

    node.disconnect();

  } catch (error) {

    // Ignore already-disconnected nodes.

  }

};

const createNoiseBuffer = (context, duration = 0.08) => {

  const sampleRate = context.sampleRate;

  const length = Math.floor(sampleRate * duration);

  const buffer = context.createBuffer(1, length, sampleRate);

  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i += 1) {

    data[i] = Math.random() * 2 - 1;

  }

  return buffer;

};

const createSnareTailBuffer = (context, duration = 0.75) => {

  const sampleRate = context.sampleRate;

  const length = Math.floor(sampleRate * duration);

  const buffer = context.createBuffer(1, length, sampleRate);

  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i += 1) {

    const progress = i / length;

    const decay = Math.pow(1 - progress, 1.45);

    const fastBuzz = Math.sin(progress * Math.PI * 150) * 0.16;

    const lowShell = Math.sin(progress * Math.PI * 38) * 0.14;

    const randomNoise = Math.random() * 2 - 1;

    data[i] = (randomNoise * 0.78 + fastBuzz + lowShell) * decay;

  }

  return buffer;

};

const createRingBuffer = (context, duration = 0.9, frequency = 205) => {

  const sampleRate = context.sampleRate;

  const length = Math.floor(sampleRate * duration);

  const buffer = context.createBuffer(1, length, sampleRate);

  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i += 1) {

    const time = i / sampleRate;

    const progress = i / length;

    const decay = Math.pow(1 - progress, 1.85);

    const main = Math.sin(2 * Math.PI * frequency * time);

    const overtone = Math.sin(2 * Math.PI * frequency * 1.52 * time) * 0.26;

    const air = (Math.random() * 2 - 1) * 0.045;

    data[i] = (main + overtone + air) * decay;

  }

  return buffer;

};

const createOutput = (context, level = 1) => {

  const outputGain = context.createGain();

  outputGain.gain.value = level;

  outputGain.connect(context.destination);

  return outputGain;

};

const makeFilter = (context, type, frequency, gain = 0, q = 1) => {

  const filter = context.createBiquadFilter();

  filter.type = type;

  filter.frequency.value = frequency;

  filter.Q.value = q;

  if ('gain' in filter) {

    filter.gain.value = gain;

  }

  return filter;

};

export const LEGACYPRINT_SNARE_SAMPLES = [

  {

    key: 'snare10x4Maple',

    label: '10x4 Maple',

    description: 'Short / tight maple',

  },

  {

    key: 'snare12x7Maple',

    label: '12x7 Maple',

    description: 'Small / deep maple',

  },

  {

    key: 'snare13x7Birch',

    label: '13x7 Birch',

    description: 'Focused birch',

  },

  {

    key: 'snare14x5MapleCherry',

    label: '14x5 Maple Cherry',

    description: 'Hybrid wood voice',

  },

  {

    key: 'snare14x6.5Oak',

    label: '14x6.5 Oak',

    description: 'Strong oak shell',

  },

  {

    key: 'snare14x8Brass',

    label: '14x8 Brass',

    description: 'Deep brass shell',

  },

  {

    key: 'snare14x8Maple',

    label: '14x8 Maple',

    description: 'Deep maple shell',

  },

];

export const LEGACYPRINT_NEUTRAL_VALUES = {

  attack: 6,

  brightness: 6,

  projection: 6,

  sustain: 6,

  warmth: 6,

  sensitivity: 6,

  control: 6,

};

const getEffectiveValues = (values, focusMode, focusNodeKey) => {

  const normalized = {

    attack: normalizeNodeValue(values.attack),

    brightness: normalizeNodeValue(values.brightness),

    projection: normalizeNodeValue(values.projection),

    sustain: normalizeNodeValue(values.sustain),

    warmth: normalizeNodeValue(values.warmth),

    sensitivity: normalizeNodeValue(values.sensitivity),

    control: normalizeNodeValue(values.control),

  };

  if (focusMode !== 'mute' || !focusNodeKey) {

    return normalized;

  }

  return {

    ...normalized,

    [focusNodeKey]: LEGACYPRINT_NEUTRAL_VALUES[focusNodeKey] || 6,

  };

};

const playSoloNode = ({

  context,

  buffer,

  now,

  nodeKey,

  values,

  hitStrength = 'medium',

  engineMode = 'teaching',

}) => {

  const attack = normalizeNodeValue(values.attack);

  const brightness = normalizeNodeValue(values.brightness);

  const projection = normalizeNodeValue(values.projection);

  const sustain = normalizeNodeValue(values.sustain);

  const warmth = normalizeNodeValue(values.warmth);

  const sensitivity = normalizeNodeValue(values.sensitivity);

  const control = normalizeNodeValue(values.control);

  const teachingAmount = getTeachingAmount(engineMode);

  const hitProfile = getHitProfile(hitStrength);

  const output = createOutput(context, engineMode === 'realistic' ? 0.88 : 1.06);

  const createdNodes = [output];

  if (nodeKey === 'attack') {

    const noiseSource = context.createBufferSource();

    noiseSource.buffer = createNoiseBuffer(context, 0.042);

    const noiseGain = context.createGain();

    const highpass = makeFilter(

      context,

      'highpass',

      mapRange(attack, 1, 10, 1000, 3300),

      0,

      0.85

    );

    const bandpass = makeFilter(

      context,

      'bandpass',

      mapRange(brightness, 1, 10, 2300, 4700),

      0,

      1.65

    );

    noiseGain.gain.setValueAtTime(0.0001, now);

    noiseGain.gain.linearRampToValueAtTime(

      mapRange(attack, 1, 10, 0.035, 0.19) *

        teachingAmount *

        hitProfile.attackScale,

      now + 0.006

    );

    noiseGain.gain.exponentialRampToValueAtTime(

      0.0001,

      now + mapRange(attack, 1, 10, 0.075, 0.034)

    );

    noiseSource.connect(highpass);

    highpass.connect(bandpass);

    bandpass.connect(noiseGain);

    noiseGain.connect(output);

    noiseSource.start(now);

    createdNodes.push(noiseSource, noiseGain, highpass, bandpass);

  }

  if (nodeKey === 'brightness') {

    const source = context.createBufferSource();

    source.buffer = buffer;

    const gain = context.createGain();

    const highpass = makeFilter(context, 'highpass', 1650, 0, 0.7);

    const shelf = makeFilter(

      context,

      'highshelf',

      4300,

      mapRange(brightness, 1, 10, 1, 13) *

        teachingAmount *

        hitProfile.brightnessScale,

      1

    );

    const crack = makeFilter(

      context,

      'peaking',

      5600,

      mapRange(brightness, 1, 10, 2, 12) *

        teachingAmount *

        hitProfile.brightnessScale,

      1.6

    );

    gain.gain.value = 0.86 * hitProfile.mainLevel;

    source.connect(highpass);

    highpass.connect(shelf);

    shelf.connect(crack);

    crack.connect(gain);

    gain.connect(output);

    source.start(now);

    createdNodes.push(source, gain, highpass, shelf, crack);

  }

  if (nodeKey === 'projection') {

    const source = context.createBufferSource();

    source.buffer = buffer;

    const gain = context.createGain();

    const presence = makeFilter(

      context,

      'peaking',

      2100,

      mapRange(projection, 1, 10, 2, 12) *

        teachingAmount *

        hitProfile.projectionScale,

      1

    );

    const forward = makeFilter(

      context,

      'peaking',

      3300,

      mapRange(projection, 1, 10, 1, 8) *

        teachingAmount *

        hitProfile.projectionScale,

      0.9

    );

    gain.gain.value =

      mapRange(projection, 1, 10, 0.7, 1.42) *

      hitProfile.mainLevel *

      hitProfile.projectionScale;

    source.connect(presence);

    presence.connect(forward);

    forward.connect(gain);

    gain.connect(output);

    source.start(now);

    createdNodes.push(source, gain, presence, forward);

  }

  if (nodeKey === 'sustain') {

    const tailSource = context.createBufferSource();

    const ringSource = context.createBufferSource();

    tailSource.buffer = createSnareTailBuffer(

      context,

      mapRange(sustain, 1, 10, 0.24, 1.32) * hitProfile.decayScale

    );

    ringSource.buffer = createRingBuffer(

      context,

      mapRange(sustain, 1, 10, 0.24, 1.24) * hitProfile.decayScale,

      205

    );

    const tailGain = context.createGain();

    const ringGain = context.createGain();

    const tailBand = makeFilter(context, 'bandpass', 680, 0, 1.05);

    const ringTone = makeFilter(

      context,

      'lowpass',

      mapRange(control, 1, 10, 9000, 3800),

      0,

      0.75

    );

    const air = makeFilter(

      context,

      'highshelf',

      4200,

      mapRange(brightness, 1, 10, -4, 7) * teachingAmount,

      1

    );

    tailGain.gain.setValueAtTime(0.0001, now);

    tailGain.gain.linearRampToValueAtTime(

      mapRange(sustain, 1, 10, 0.06, 0.48) *

        teachingAmount *

        hitProfile.sustainScale,

      now + 0.025

    );

    tailGain.gain.exponentialRampToValueAtTime(

      0.0001,

      now + mapRange(sustain, 1, 10, 0.18, 1.35) * hitProfile.decayScale

    );

    ringGain.gain.setValueAtTime(0.0001, now);

    ringGain.gain.linearRampToValueAtTime(

      mapRange(sustain, 1, 10, 0.025, 0.24) *

        teachingAmount *

        hitProfile.sustainScale,

      now + 0.032

    );

    ringGain.gain.exponentialRampToValueAtTime(

      0.0001,

      now + mapRange(sustain, 1, 10, 0.18, 1.22) * hitProfile.decayScale

    );

    tailSource.connect(tailBand);

    tailBand.connect(air);

    air.connect(tailGain);

    tailGain.connect(output);

    ringSource.connect(ringTone);

    ringTone.connect(ringGain);

    ringGain.connect(output);

    tailSource.start(now);

    ringSource.start(now + 0.015);

    createdNodes.push(

      tailSource,

      ringSource,

      tailGain,

      ringGain,

      tailBand,

      ringTone,

      air

    );

  }

  if (nodeKey === 'warmth') {

    const source = context.createBufferSource();

    source.buffer = buffer;

    const gain = context.createGain();

    const highCut = makeFilter(context, 'lowpass', 1850, 0, 0.55);

    const body = makeFilter(

      context,

      'peaking',

      220,

      mapRange(warmth, 1, 10, -2, 9) *

        teachingAmount *

        hitProfile.bodyScale,

      0.72

    );

    const lowMid = makeFilter(

      context,

      'peaking',

      470,

      mapRange(warmth, 1, 10, -1, 5.5) *

        teachingAmount *

        hitProfile.bodyScale,

      0.7

    );

    const mudGuard = makeFilter(

      context,

      'peaking',

      760,

      mapRange(warmth, 1, 10, 0, -2.5) * teachingAmount,

      1.05

    );

    gain.gain.value = 0.96 * hitProfile.mainLevel;

    source.connect(highCut);

    highCut.connect(body);

    body.connect(lowMid);

    lowMid.connect(mudGuard);

    mudGuard.connect(gain);

    gain.connect(output);

    source.start(now);

    createdNodes.push(source, gain, highCut, body, lowMid, mudGuard);

  }

  if (nodeKey === 'sensitivity') {

    const headContactSource = context.createBufferSource();

    const wireDetailSource = context.createBufferSource();

    const lowBodySource = context.createBufferSource();

    headContactSource.buffer = buffer;

    wireDetailSource.buffer = createNoiseBuffer(context, 0.08);

    lowBodySource.buffer = buffer;

    headContactSource.playbackRate.value = 1.006;

    lowBodySource.playbackRate.value = 0.995;

    const headGain = context.createGain();

    const wireGain = context.createGain();

    const bodyGain = context.createGain();

    const headFilter = makeFilter(context, 'bandpass', 1050, 0, 1.05);

    const wireHighpass = makeFilter(context, 'highpass', 2800, 0, 0.7);

    const wireBand = makeFilter(context, 'bandpass', 5200, 0, 1.6);

    const bodyFilter = makeFilter(context, 'bandpass', 520, 0, 0.9);

    const sensitivityWakeAmount = mapRange(sensitivity, 1, 10, 0.04, 0.34);

    headGain.gain.setValueAtTime(0.0001, now);

    headGain.gain.linearRampToValueAtTime(

      sensitivityWakeAmount *

        teachingAmount *

        hitProfile.sensitivityScale *

        hitProfile.headContactScale,

      now + 0.012

    );

    headGain.gain.exponentialRampToValueAtTime(

      0.0001,

      now + mapRange(sensitivity, 1, 10, 0.1, 0.24)

    );

    wireGain.gain.setValueAtTime(0.0001, now);

    wireGain.gain.linearRampToValueAtTime(

      mapRange(sensitivity, 1, 10, 0.008, 0.16) *

        teachingAmount *

        hitProfile.sensitivityScale *

        hitProfile.wireScale,

      now + 0.018

    );

    wireGain.gain.exponentialRampToValueAtTime(

      0.0001,

      now + mapRange(sensitivity, 1, 10, 0.06, 0.18)

    );

    bodyGain.gain.setValueAtTime(0.0001, now);

    bodyGain.gain.linearRampToValueAtTime(

      mapRange(sensitivity, 1, 10, 0.0, 0.1) *

        teachingAmount *

        hitProfile.shellWakeScale,

      now + 0.026

    );

    bodyGain.gain.exponentialRampToValueAtTime(

      0.0001,

      now + mapRange(sensitivity, 1, 10, 0.08, 0.22)

    );

    headContactSource.connect(headFilter);

    headFilter.connect(headGain);

    headGain.connect(output);

    wireDetailSource.connect(wireHighpass);

    wireHighpass.connect(wireBand);

    wireBand.connect(wireGain);

    wireGain.connect(output);

    lowBodySource.connect(bodyFilter);

    bodyFilter.connect(bodyGain);

    bodyGain.connect(output);

    headContactSource.start(now);

    wireDetailSource.start(now + 0.006);

    lowBodySource.start(now + 0.018);

    createdNodes.push(

      headContactSource,

      wireDetailSource,

      lowBodySource,

      headGain,

      wireGain,

      bodyGain,

      headFilter,

      wireHighpass,

      wireBand,

      bodyFilter

    );

  }

  if (nodeKey === 'control') {

    const source = context.createBufferSource();

    source.buffer = buffer;

    const gain = context.createGain();

    const lowpass = makeFilter(

      context,

      'lowpass',

      mapRange(control, 1, 10, 9500, 2600),

      0,

      mapRange(control, 1, 10, 0.35, 1.25)

    );

    const focus = makeFilter(

      context,

      'peaking',

      900,

      mapRange(control, 1, 10, -2, 6) * teachingAmount,

      1

    );

    const compressor = context.createDynamicsCompressor();

    compressor.threshold.value = mapRange(control, 1, 10, -12, -34);

    compressor.knee.value = 4;

    compressor.ratio.value = mapRange(control, 1, 10, 2, 9);

    compressor.attack.value = 0.003;

    compressor.release.value = mapRange(control, 1, 10, 0.16, 0.045);

    gain.gain.setValueAtTime(1, now);

    gain.gain.setTargetAtTime(

      mapRange(control, 1, 10, 0.9, 0.16),

      now + 0.04,

      mapRange(control, 1, 10, 0.45, 0.07)

    );

    source.connect(lowpass);

    lowpass.connect(focus);

    focus.connect(compressor);

    compressor.connect(gain);

    gain.connect(output);

    source.start(now);

    createdNodes.push(source, gain, lowpass, focus, compressor);

  }

  window.setTimeout(() => {

    createdNodes.forEach(safeDisconnect);

  }, 1900);

};

export const playLegacyPrintSnare = async ({

  sampleKey = 'snare10x4Maple',

  values = LEGACYPRINT_NEUTRAL_VALUES,

  focusMode = 'full',

  focusNodeKey = null,

  hitStrength = 'medium',

  engineMode = 'teaching',

} = {}) => {

  const context = getAudioContext();

  if (context.state === 'suspended') {

    await context.resume();

  }

  const buffer = await loadAudioBuffer(sampleKey);

  const requestedValues = {

    ...LEGACYPRINT_NEUTRAL_VALUES,

    ...values,

  };

  if (focusMode === 'solo' && focusNodeKey) {

    playSoloNode({

      context,

      buffer,

      now: context.currentTime,

      nodeKey: focusNodeKey,

      values: requestedValues,

      hitStrength,

      engineMode,

    });

    return;

  }

  const effectiveValues = getEffectiveValues(

    requestedValues,

    focusMode,

    focusNodeKey

  );

  const attack = normalizeNodeValue(effectiveValues.attack);

  const brightness = normalizeNodeValue(effectiveValues.brightness);

  const projection = normalizeNodeValue(effectiveValues.projection);

  const sustain = normalizeNodeValue(effectiveValues.sustain);

  const warmth = normalizeNodeValue(effectiveValues.warmth);

  const sensitivity = normalizeNodeValue(effectiveValues.sensitivity);

  const control = normalizeNodeValue(effectiveValues.control);

  const originalAttack = normalizeNodeValue(requestedValues.attack);

  const originalSensitivity = normalizeNodeValue(requestedValues.sensitivity);

  const originalSustain = normalizeNodeValue(requestedValues.sustain);

  const teachingAmount = getTeachingAmount(engineMode);

  const hitProfile = getHitProfile(hitStrength);

  const projectionAmount = getNodeIntensity(projection);

  const sustainAmount = getNodeIntensity(sustain);

  const controlAmount = getNodeIntensity(control);

  const shouldMuteAttack = focusMode === 'mute' && focusNodeKey === 'attack';

  const shouldMuteSensitivity =

    focusMode === 'mute' && focusNodeKey === 'sensitivity';

  const shouldMuteSustain = focusMode === 'mute' && focusNodeKey === 'sustain';

  const now = context.currentTime;

  const source = context.createBufferSource();

  source.buffer = buffer;

  source.playbackRate.value = 1;

  const inputGain = context.createGain();

  const outputGain = context.createGain();

  const warmthFilter = context.createBiquadFilter();

  warmthFilter.type = 'peaking';

  warmthFilter.frequency.value = 220;

  warmthFilter.Q.value = 0.72;

  warmthFilter.gain.value =

    mapRange(warmth, 1, 10, -5.5, 6.5) *

    teachingAmount *

    hitProfile.bodyScale;

  const bodyFilter = context.createBiquadFilter();

  bodyFilter.type = 'peaking';

  bodyFilter.frequency.value = 470;

  bodyFilter.Q.value = 0.7;

  bodyFilter.gain.value =

    mapRange(warmth, 1, 10, -2.5, 4.5) *

    teachingAmount *

    hitProfile.bodyScale;

  const mudGuardFilter = context.createBiquadFilter();

  mudGuardFilter.type = 'peaking';

  mudGuardFilter.frequency.value = 760;

  mudGuardFilter.Q.value = 1.05;

  mudGuardFilter.gain.value =

    mapRange(warmth, 1, 10, 1.5, -2.25) * teachingAmount;

  const presenceFilter = context.createBiquadFilter();

  presenceFilter.type = 'peaking';

  presenceFilter.frequency.value = 2100;

  presenceFilter.Q.value = 1.05;

  presenceFilter.gain.value =

    mapRange(projection, 1, 10, -4, 7) *

    teachingAmount *

    hitProfile.projectionScale;

  const crackFilter = context.createBiquadFilter();

  crackFilter.type = 'peaking';

  crackFilter.frequency.value = 3700;

  crackFilter.Q.value = 1.2;

  crackFilter.gain.value = shouldMuteAttack

    ? 0

    : mapRange(attack, 1, 10, -4, 7) *

      teachingAmount *

      hitProfile.attackScale;

  const brightnessFilter = context.createBiquadFilter();

  brightnessFilter.type = 'highshelf';

  brightnessFilter.frequency.value = 4700;

  brightnessFilter.gain.value =

    mapRange(brightness, 1, 10, -9, 9) *

    teachingAmount *

    hitProfile.brightnessScale;

  const controlFilter = context.createBiquadFilter();

  controlFilter.type = 'lowpass';

  controlFilter.frequency.value = mapRange(

    control,

    1,

    10,

    14500,

    engineMode === 'realistic' ? 5200 : 3900

  );

  controlFilter.Q.value = mapRange(control, 1, 10, 0.25, 1.05);

  const compressor = context.createDynamicsCompressor();

  compressor.threshold.value = mapRange(

    control,

    1,

    10,

    -5,

    engineMode === 'realistic' ? -20 : -32

  );

  compressor.knee.value = mapRange(control, 1, 10, 18, 5);

  compressor.ratio.value = mapRange(

    control,

    1,

    10,

    1.15,

    engineMode === 'realistic' ? 3.2 : 7.2

  );

  compressor.attack.value = mapRange(attack, 1, 10, 0.018, 0.0009);

  compressor.release.value = mapRange(sustain, 1, 10, 0.045, 0.32);

  const dryGain = context.createGain();

  outputGain.gain.value =

    mapRange(projection, 1, 10, 0.62, 1.22) *

    mapRange(control, 1, 10, 1.05, 0.88) *

    hitProfile.mainLevel;

  inputGain.gain.setValueAtTime(0.0001, now);

  inputGain.gain.linearRampToValueAtTime(

    mapRange(sensitivity, 1, 10, 0.72, 1.05) *

      hitProfile.mainLevel *

      mapRange(hitProfile.hitAmount, 0.38, 1, 0.86, 1.02),

    now + mapRange(attack, 1, 10, 0.014, 0.0045)

  );

  const controlledDecayTime =

    mapRange(control, 1, 10, 0.62, 0.16) * hitProfile.decayScale;

  inputGain.gain.setTargetAtTime(

    mapRange(sustain, 1, 10, 0.52, 1.02) *

      hitProfile.shellWakeScale *

      hitProfile.sustainScale,

    now + 0.018,

    controlledDecayTime

  );

  dryGain.gain.value =

    mapRange(control, 1, 10, 1.0, 0.78) *

    mapRange(hitProfile.hitAmount, 0.38, 1, 0.9, 1.04);

  source.connect(inputGain);

  inputGain.connect(warmthFilter);

  warmthFilter.connect(bodyFilter);

  bodyFilter.connect(mudGuardFilter);

  mudGuardFilter.connect(presenceFilter);

  presenceFilter.connect(crackFilter);

  crackFilter.connect(brightnessFilter);

  brightnessFilter.connect(controlFilter);

  controlFilter.connect(compressor);

  compressor.connect(dryGain);

  dryGain.connect(outputGain);

  const tailSource = context.createBufferSource();

  const ringSource = context.createBufferSource();

  tailSource.buffer = createSnareTailBuffer(

    context,

    mapRange(sustain, 1, 10, 0.18, 1.08) * hitProfile.decayScale

  );

  ringSource.buffer = createRingBuffer(

    context,

    mapRange(sustain, 1, 10, 0.16, 0.98) * hitProfile.decayScale,

    205

  );

  const tailGain = context.createGain();

  const ringGain = context.createGain();

  const tailTone = context.createBiquadFilter();

  const tailAir = context.createBiquadFilter();

  const ringTone = context.createBiquadFilter();

  tailTone.type = 'bandpass';

  tailTone.frequency.value = 680;

  tailTone.Q.value = mapRange(control, 1, 10, 0.65, 1.75);

  tailAir.type = 'highshelf';

  tailAir.frequency.value = 3600;

  tailAir.gain.value =

    mapRange(brightness, 1, 10, -6, 6) *

    teachingAmount *

    hitProfile.brightnessScale;

  ringTone.type = 'lowpass';

  ringTone.frequency.value = mapRange(control, 1, 10, 9200, 3600);

  ringTone.Q.value = 0.7;

  const sustainTeachingBoost =

    mapRange(originalSustain, 1, 10, 0.0, 0.22) * teachingAmount;

  const sustainTailLevel = shouldMuteSustain

    ? 0.0001

    : (mapRange(sustain, 1, 10, 0.0, 0.44) *

        mapRange(control, 1, 10, 1.14, 0.42) +

        sustainTeachingBoost) *

      hitProfile.sustainScale *

      hitProfile.roomScale;

  const ringLevel = shouldMuteSustain

    ? 0.0001

    : mapRange(sustain, 1, 10, 0.0, 0.18) *

      mapRange(control, 1, 10, 1.0, 0.38) *

      hitProfile.sustainScale *

      hitProfile.shellWakeScale *

      teachingAmount;

  tailGain.gain.setValueAtTime(0.0001, now);

  tailGain.gain.linearRampToValueAtTime(sustainTailLevel, now + 0.022);

  tailGain.gain.exponentialRampToValueAtTime(

    0.0001,

    now + mapRange(sustain, 1, 10, 0.16, 1.15) * hitProfile.decayScale

  );

  ringGain.gain.setValueAtTime(0.0001, now);

  ringGain.gain.linearRampToValueAtTime(ringLevel, now + 0.036);

  ringGain.gain.exponentialRampToValueAtTime(

    0.0001,

    now + mapRange(sustain, 1, 10, 0.15, 1.08) * hitProfile.decayScale

  );

  tailSource.connect(tailTone);

  tailTone.connect(tailAir);

  tailAir.connect(tailGain);

  tailGain.connect(outputGain);

  ringSource.connect(ringTone);

  ringTone.connect(ringGain);

  ringGain.connect(outputGain);

  const attackSource = context.createBufferSource();

  attackSource.buffer = createNoiseBuffer(context, 0.032);

  const attackGain = context.createGain();

  const attackHighpass = context.createBiquadFilter();

  const attackBand = context.createBiquadFilter();

  const attackAboveNeutral = shouldMuteAttack

    ? 0

    : Math.max(0, originalAttack - 6.4) / 3.6;

  attackHighpass.type = 'highpass';

  attackHighpass.frequency.value = mapRange(attack, 6, 10, 1500, 3200);

  attackBand.type = 'bandpass';

  attackBand.frequency.value = mapRange(brightness, 1, 10, 2200, 4300);

  attackBand.Q.value = mapRange(attack, 6, 10, 0.95, 1.65);

  attackGain.gain.setValueAtTime(0.0001, now);

  attackGain.gain.linearRampToValueAtTime(

    clamp(

      mapRange(attackAboveNeutral, 0, 1, 0.0001, 0.078) *

        teachingAmount *

        hitProfile.attackScale,

      0.0001,

      engineMode === 'realistic' ? 0.035 : 0.095

    ),

    now + 0.008

  );

  attackGain.gain.exponentialRampToValueAtTime(

    0.0001,

    now + mapRange(attackAboveNeutral, 0, 1, 0.064, 0.034)

  );

  attackSource.connect(attackHighpass);

  attackHighpass.connect(attackBand);

  attackBand.connect(attackGain);

  attackGain.connect(outputGain);

  const headContactSource = context.createBufferSource();

  const wireDetailSource = context.createBufferSource();

  const sensitivityBodySource = context.createBufferSource();

  headContactSource.buffer = buffer;

  wireDetailSource.buffer = createNoiseBuffer(context, 0.08);

  sensitivityBodySource.buffer = buffer;

  headContactSource.playbackRate.value = 1.006;

  sensitivityBodySource.playbackRate.value = 0.995;

  const headGain = context.createGain();

  const wireGain = context.createGain();

  const sensitivityBodyGain = context.createGain();

  const headFilter = context.createBiquadFilter();

  const wireHighpass = context.createBiquadFilter();

  const wireBand = context.createBiquadFilter();

  const sensitivityBodyFilter = context.createBiquadFilter();

  headFilter.type = 'bandpass';

  headFilter.frequency.value = 1050;

  headFilter.Q.value = 1.05;

  wireHighpass.type = 'highpass';

  wireHighpass.frequency.value = 2800;

  wireHighpass.Q.value = 0.7;

  wireBand.type = 'bandpass';

  wireBand.frequency.value = 5200;

  wireBand.Q.value = 1.6;

  sensitivityBodyFilter.type = 'bandpass';

  sensitivityBodyFilter.frequency.value = 520;

  sensitivityBodyFilter.Q.value = 0.9;

  const sensitivityAboveNeutral = shouldMuteSensitivity

    ? 0

    : Math.max(0, originalSensitivity - 6) / 4;

  const sensitivityWakeThreshold =

    getHitStrengthLabel(hitStrength) === 'soft'

      ? mapRange(originalSensitivity, 1, 10, 0.18, 1.32)

      : getHitStrengthLabel(hitStrength) === 'hard'

        ? mapRange(originalSensitivity, 1, 10, 0.06, 0.72)

        : mapRange(originalSensitivity, 1, 10, 0.1, 1);

  const sensitivityResponse =

    mapRange(sensitivityAboveNeutral, 0, 1, 0.0001, 0.15) *

    teachingAmount *

    sensitivityWakeThreshold *

    hitProfile.sensitivityScale;

  headGain.gain.setValueAtTime(0.0001, now);

  headGain.gain.linearRampToValueAtTime(

    sensitivityResponse * hitProfile.headContactScale,

    now + 0.012

  );

  headGain.gain.exponentialRampToValueAtTime(

    0.0001,

    now + mapRange(originalSensitivity, 1, 10, 0.08, 0.24)

  );

  wireGain.gain.setValueAtTime(0.0001, now);

  wireGain.gain.linearRampToValueAtTime(

    sensitivityResponse *

      mapRange(brightness, 1, 10, 0.55, 1.15) *

      hitProfile.wireScale,

    now + 0.018

  );

  wireGain.gain.exponentialRampToValueAtTime(

    0.0001,

    now + mapRange(originalSensitivity, 1, 10, 0.06, 0.18)

  );

  sensitivityBodyGain.gain.setValueAtTime(0.0001, now);

  sensitivityBodyGain.gain.linearRampToValueAtTime(

    sensitivityResponse *

      mapRange(warmth, 1, 10, 0.24, 0.76) *

      hitProfile.shellWakeScale,

    now + 0.026

  );

  sensitivityBodyGain.gain.exponentialRampToValueAtTime(

    0.0001,

    now + mapRange(originalSensitivity, 1, 10, 0.08, 0.22)

  );

  headContactSource.connect(headFilter);

  headFilter.connect(headGain);

  headGain.connect(outputGain);

  wireDetailSource.connect(wireHighpass);

  wireHighpass.connect(wireBand);

  wireBand.connect(wireGain);

  wireGain.connect(outputGain);

  sensitivityBodySource.connect(sensitivityBodyFilter);

  sensitivityBodyFilter.connect(sensitivityBodyGain);

  sensitivityBodyGain.connect(outputGain);

  const slapDelay = context.createDelay();

  const slapGain = context.createGain();

  const slapTone = context.createBiquadFilter();

  slapDelay.delayTime.value = mapRange(projection, 1, 10, 0.035, 0.09);

  slapTone.type = 'lowpass';

  slapTone.frequency.value = mapRange(control, 1, 10, 8200, 3000);

  slapGain.gain.value = shouldMuteSustain

    ? 0.0001

    : mapRange(sustainAmount, 0, 1, 0.0, 0.2) *

      mapRange(projectionAmount, 0, 1, 0.45, 1.0) *

      mapRange(controlAmount, 0, 1, 1.0, 0.28) *

      teachingAmount *

      hitProfile.roomScale;

  compressor.connect(slapDelay);

  slapDelay.connect(slapTone);

  slapTone.connect(slapGain);

  slapGain.connect(outputGain);

  outputGain.connect(context.destination);

  headContactSource.start(now);

  wireDetailSource.start(now + 0.006);

  sensitivityBodySource.start(now + 0.018);

  source.start(now);

  attackSource.start(now);

  tailSource.start(now + 0.012);

  ringSource.start(now + 0.018);

  const cleanupDelay = Math.max(1.8, buffer.duration + 1.45);

  window.setTimeout(() => {

    [

      source,

      inputGain,

      warmthFilter,

      bodyFilter,

      mudGuardFilter,

      presenceFilter,

      crackFilter,

      brightnessFilter,

      controlFilter,

      compressor,

      dryGain,

      tailSource,

      ringSource,

      tailGain,

      ringGain,

      tailTone,

      tailAir,

      ringTone,

      attackSource,

      attackGain,

      attackHighpass,

      attackBand,

      headContactSource,

      wireDetailSource,

      sensitivityBodySource,

      headGain,

      wireGain,

      sensitivityBodyGain,

      headFilter,

      wireHighpass,

      wireBand,

      sensitivityBodyFilter,

      slapDelay,

      slapGain,

      slapTone,

      outputGain,

    ].forEach(safeDisconnect);

  }, cleanupDelay * 1000);

};