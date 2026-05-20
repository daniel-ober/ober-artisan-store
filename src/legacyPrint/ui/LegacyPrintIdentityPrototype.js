import React, { useEffect, useMemo, useRef } from 'react';

import {

  Zap,

  SunMedium,

  Volume2,

  Waves,

  Flame,

  Feather,

  Crosshair,

} from 'lucide-react';

import './LegacyPrintIdentityPrototype.css';

const AXES = [

  {

    key: 'attack',

    label: 'Attack',

    Icon: Zap,

    low: 'quiet / soft spoken',

    high: 'quick / in your face / awakened',

    color: '#ff7448',

  },

  {

    key: 'brightness',

    label: 'Brightness',

    Icon: SunMedium,

    low: 'muted / less color',

    high: 'colorful / shiny / ring',

    color: '#e7d98f',

  },

  {

    key: 'projection',

    label: 'Projection',

    Icon: Volume2,

    low: 'contained / less present',

    high: 'room-filling / forward',

    color: '#ffb53a',

  },

  {

    key: 'sustain',

    label: 'Sustain',

    Icon: Waves,

    low: 'short / choked',

    high: 'long / echoed / ongoing',

    color: '#4d86ff',

  },

  {

    key: 'warmth',

    label: 'Warmth',

    Icon: Flame,

    low: 'thin / less body',

    high: 'full / round / rich body',

    color: '#c1682e',

  },

  {

    key: 'sensitivity',

    label: 'Sensitivity',

    Icon: Feather,

    low: 'rough / harsh / unforgiving',

    high: 'soft / careful / responsive',

    color: '#68d9df',

  },

  {

    key: 'control',

    label: 'Control',

    Icon: Crosshair,

    low: 'chaotic / loose / unstable',

    high: 'stable / clean / contained',

    color: '#9e8bff',

  },

];

const DEFAULT_VOICE = {

  attack: 0.5,

  brightness: 0.5,

  projection: 0.5,

  sustain: 0.5,

  warmth: 0.5,

  sensitivity: 0.5,

  control: 0.5,

};

const clamp = (value, min, max) => {

  const number = Number(value);

  if (!Number.isFinite(number)) return min;

  return Math.max(min, Math.min(max, number));

};

const clamp01 = (value, fallback = 0.5) => {

  const number = Number(value);

  if (!Number.isFinite(number)) return fallback;

  return Math.max(0, Math.min(1, number));

};

const lerp = (a, b, t) => a + (b - a) * t;

const ease = (t) => t * t * (3 - 2 * t);

const toVoice = (voice = {}) => {

  return AXES.reduce((acc, axis) => {

    acc[axis.key] = clamp01(voice?.[axis.key] ?? DEFAULT_VOICE[axis.key]);

    return acc;

  }, {});

};

const hexToRgb = (hex) => {

  const clean = String(hex || '#ffffff').replace('#', '');

  const parsed = Number.parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16);

  if (!Number.isFinite(parsed)) {

    return { r: 255, g: 255, b: 255 };

  }

  return {

    r: (parsed >> 16) & 255,

    g: (parsed >> 8) & 255,

    b: parsed & 255,

  };

};

const rgba = (hex, alpha = 1) => {

  const { r, g, b } = hexToRgb(hex);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;

};

const mix = (hexA, hexB, amount = 0.5) => {

  const a = hexToRgb(hexA);

  const b = hexToRgb(hexB);

  const t = clamp01(amount);

  return {

    r: Math.round(lerp(a.r, b.r, t)),

    g: Math.round(lerp(a.g, b.g, t)),

    b: Math.round(lerp(a.b, b.b, t)),

  };

};

const rgbString = ({ r, g, b }, alpha = 1) => `rgba(${r}, ${g}, ${b}, ${alpha})`;

const getDominantWords = (voice) => {

  const sorted = AXES.map((axis) => ({

    ...axis,

    value: voice[axis.key],

    distance: Math.abs(voice[axis.key] - 0.5),

  })).sort((a, b) => b.distance - a.distance);

  return sorted.slice(0, 3).map((axis) => {

    if (axis.key === 'attack') return axis.value >= 0.5 ? 'Awake' : 'Soft';

    if (axis.key === 'brightness') return axis.value >= 0.5 ? 'Color' : 'Muted';

    if (axis.key === 'projection') return axis.value >= 0.5 ? 'Room' : 'Close';

    if (axis.key === 'sustain') return axis.value >= 0.5 ? 'Echo' : 'Short';

    if (axis.key === 'warmth') return axis.value >= 0.5 ? 'Body' : 'Thin';

    if (axis.key === 'sensitivity') return axis.value >= 0.5 ? 'Care' : 'Rough';

    if (axis.key === 'control') return axis.value >= 0.5 ? 'Stable' : 'Loose';

    return axis.label;

  });

};

const seededNoise = (seed) => {

  const x = Math.sin(seed * 999.13) * 43758.5453123;

  return x - Math.floor(x);

};

const blobPoint = ({

  angle,

  index,

  voice,

  radiusBase,

  radiusVariance,

  centerX,

  centerY,

  time,

}) => {

  const {

    attack,

    brightness,

    projection,

    sustain,

    warmth,

    sensitivity,

    control,

  } = voice;

  const chaos = 1 - control;

  const rough = 1 - sensitivity;

  const top = Math.sin(angle - Math.PI * 1.5);

  const right = Math.cos(angle);

  const bottom = Math.sin(angle - Math.PI * 0.5);

  const attackSpike =

    top > 0.68

      ? attack * top * top * lerp(18, 82, attack)

      : 0;

  const projectionPush =

    right > 0.15

      ? projection * right * lerp(18, 72, projection)

      : 0;

  const sustainDrag =

    right > 0.25 && bottom < -0.05

      ? sustain * right * Math.abs(bottom) * lerp(18, 90, sustain)

      : 0;

  const warmthMass =

    bottom < 0

      ? warmth * Math.abs(bottom) * lerp(16, 72, warmth)

      : warmth * 18;

  const softRound = sensitivity * 18;

  const roughSaw = Math.sin(angle * lerp(6, 18, attack + rough * 0.4) + time * 0.0012) * rough * 18;

  const chaosJitter =

    (seededNoise(index * 13.17 + Math.round(time * 0.008)) - 0.5) *

    chaos *

    42;

  const shimmer = Math.sin(angle * 8 + brightness * 4 + time * 0.001) * brightness * 9;

  const breath = Math.sin(time * 0.0014 + index * 0.42) * lerp(1, 9, projection + sustain);

  const radius =

    radiusBase +

    radiusVariance * Math.sin(angle * 3.4 + warmth * 2.4) +

    attackSpike +

    projectionPush +

    sustainDrag +

    warmthMass +

    softRound +

    roughSaw +

    chaosJitter +

    shimmer +

    breath;

  const squashY = lerp(0.58, 0.78, warmth) + projection * 0.05;

  return {

    x: centerX + Math.cos(angle) * radius,

    y: centerY + Math.sin(angle) * radius * squashY,

  };

};

const buildSmoothPath = (points) => {

  if (!points.length) return null;

  const commands = [];

  const first = points[0];

  commands.push(`M ${first.x} ${first.y}`);

  for (let i = 0; i < points.length; i += 1) {

    const current = points[i];

    const next = points[(i + 1) % points.length];

    const midX = (current.x + next.x) / 2;

    const midY = (current.y + next.y) / 2;

    commands.push(`Q ${current.x} ${current.y} ${midX} ${midY}`);

  }

  commands.push('Z');

  return commands.join(' ');

};

const drawPath = (ctx, path, options = {}) => {

  if (!path) return;

  const path2d = new Path2D(path);

  if (options.shadowBlur) {

    ctx.shadowBlur = options.shadowBlur;

    ctx.shadowColor = options.shadowColor || 'rgba(255,255,255,0.2)';

  }

  if (options.fill) {

    ctx.fillStyle = options.fill;

    ctx.globalAlpha = options.alpha ?? 1;

    ctx.fill(path2d);

  }

  if (options.stroke) {

    ctx.strokeStyle = options.stroke;

    ctx.lineWidth = options.lineWidth || 1;

    ctx.globalAlpha = options.strokeAlpha ?? options.alpha ?? 1;

    ctx.lineJoin = 'round';

    ctx.lineCap = 'round';

    ctx.stroke(path2d);

  }

  ctx.shadowBlur = 0;

  ctx.globalAlpha = 1;

};

const drawSoftPuff = (ctx, x, y, radius, color, alpha = 0.2) => {

  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

  gradient.addColorStop(0, color);

  gradient.addColorStop(0.44, color.replace(/[\d.]+\)$/g, `${alpha * 0.45})`));

  gradient.addColorStop(1, color.replace(/[\d.]+\)$/g, '0)'));

  ctx.fillStyle = gradient;

  ctx.beginPath();

  ctx.arc(x, y, radius, 0, Math.PI * 2);

  ctx.fill();

};

const drawIdentity = (ctx, width, height, voice, time) => {

  const {

    attack,

    brightness,

    projection,

    sustain,

    warmth,

    sensitivity,

    control,

  } = voice;

  const dpr = window.devicePixelRatio || 1;

  const w = width / dpr;

  const h = height / dpr;

  ctx.clearRect(0, 0, w, h);

  const centerX = w * 0.5;

  const centerY = h * 0.45;

  const chaos = 1 - control;

  const rough = 1 - sensitivity;

  const baseRadius = lerp(66, 102, warmth) + projection * 18;

  const variance = lerp(10, 30, 1 - control + attack * 0.4);

  const pointCount = Math.round(lerp(22, 42, attack * 0.55 + rough * 0.45));

  const points = Array.from({ length: pointCount }, (_, index) => {

    const angle = (index / pointCount) * Math.PI * 2 - Math.PI / 2;

    return blobPoint({

      angle,

      index,

      voice,

      radiusBase: baseRadius,

      radiusVariance: variance,

      centerX,

      centerY,

      time,

    });

  });

  const path = buildSmoothPath(points);

  ctx.save();

  ctx.globalCompositeOperation = 'lighter';

  const backdrop = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, w * 0.52);

  backdrop.addColorStop(0, `rgba(255, 116, 72, ${0.03 + warmth * 0.05})`);

  backdrop.addColorStop(0.35, `rgba(77, 134, 255, ${0.025 + sustain * 0.06})`);

  backdrop.addColorStop(0.72, `rgba(104, 217, 223, ${0.015 + projection * 0.035})`);

  backdrop.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = backdrop;

  ctx.fillRect(0, 0, w, h);

  if (projection > 0.18) {

    const ringCount = Math.round(lerp(2, 7, projection));

    for (let i = 0; i < ringCount; i += 1) {

      const t = i / Math.max(1, ringCount - 1);

      ctx.save();

      ctx.globalAlpha = lerp(0.14, 0.025, t) * projection;

      ctx.strokeStyle = rgba('#ffb53a', 0.5);

      ctx.lineWidth = lerp(0.8, 1.8, projection);

      ctx.setLineDash([2, lerp(8, 16, t)]);

      ctx.beginPath();

      ctx.ellipse(

        centerX + projection * 38,

        centerY + 4,

        lerp(128, 268, projection) + t * 46,

        lerp(58, 142, projection) + t * 28,

        -0.02,

        0,

        Math.PI * 2

      );

      ctx.stroke();

      ctx.restore();

    }

  }

  if (sustain > 0.18) {

    const trailCount = Math.round(lerp(4, 16, sustain));

    for (let i = 0; i < trailCount; i += 1) {

      const t = i / Math.max(1, trailCount - 1);

      const x = centerX + lerp(36, 210, t) * sustain;

      const y = centerY + lerp(22, -24, t) * sustain;

      const r = lerp(40, 110, sustain) * (1 - t * 0.25);

      drawSoftPuff(

        ctx,

        x,

        y,

        r,

        `rgba(77, 134, 255, ${lerp(0.09, 0.018, t) * sustain})`,

        lerp(0.09, 0.018, t) * sustain

      );

      drawSoftPuff(

        ctx,

        x + 18,

        y + 12,

        r * 0.78,

        `rgba(255, 79, 216, ${lerp(0.04, 0.01, t) * sustain})`,

        lerp(0.04, 0.01, t) * sustain

      );

    }

  }

  if (chaos > 0.2 || rough > 0.22) {

    const shardCount = Math.round(lerp(8, 34, Math.max(chaos, rough)));

    for (let i = 0; i < shardCount; i += 1) {

      const angle = seededNoise(i * 9.13) * Math.PI * 2 + time * 0.00012 * chaos;

      const radius = lerp(84, 210, chaos) + seededNoise(i * 22.91) * 46;

      const x = centerX + Math.cos(angle) * radius;

      const y = centerY + Math.sin(angle) * radius * 0.68;

      const length = lerp(5, 34, rough + chaos * 0.32) * seededNoise(i * 7.55);

      ctx.save();

      ctx.translate(x, y);

      ctx.rotate(angle + Math.PI / 2);

      ctx.globalAlpha = lerp(0.06, 0.36, Math.max(chaos, rough));

      ctx.strokeStyle = rough > 0.55 ? rgba('#ff7448', 0.5) : rgba('#9e8bff', 0.38);

      ctx.lineWidth = lerp(0.6, 1.25, rough);

      ctx.shadowBlur = 8;

      ctx.shadowColor = rough > 0.55 ? rgba('#ff7448', 0.55) : rgba('#9e8bff', 0.45);

      ctx.beginPath();

      ctx.moveTo(-length / 2, 0);

      ctx.lineTo(length / 2, 0);

      ctx.stroke();

      ctx.restore();

    }

  }

  const shadowGradient = ctx.createRadialGradient(centerX + 18, centerY + 38, 0, centerX + 18, centerY + 38, baseRadius * 1.75);

  shadowGradient.addColorStop(0, 'rgba(0,0,0,0.62)');

  shadowGradient.addColorStop(1, 'rgba(0,0,0,0)');

  drawPath(ctx, path, {

    fill: shadowGradient,

    alpha: 0.72,

  });

  const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius * 2.4);

  glowGradient.addColorStop(0, `rgba(255, 116, 72, ${0.09 + attack * 0.12})`);

  glowGradient.addColorStop(0.36, `rgba(255, 181, 58, ${0.06 + warmth * 0.12})`);

  glowGradient.addColorStop(0.66, `rgba(77, 134, 255, ${0.03 + sustain * 0.08})`);

  glowGradient.addColorStop(1, 'rgba(0,0,0,0)');

  drawPath(ctx, path, {

    fill: glowGradient,

    alpha: 0.92,

    shadowBlur: lerp(18, 46, projection + brightness * 0.3),

    shadowColor: rgba('#ff7448', 0.25 + attack * 0.22),

  });

  const bodyGradient = ctx.createRadialGradient(

    centerX - baseRadius * 0.2,

    centerY - baseRadius * 0.2,

    0,

    centerX,

    centerY,

    baseRadius * 1.6

  );

  const bodyColor = mix('#202038', '#c1682e', warmth);

  const colorPop = mix('#4d86ff', '#ff4fd8', brightness);

  bodyGradient.addColorStop(0, rgbString(mix('#fff2ca', '#ff7448', attack * 0.6), 0.22 + brightness * 0.16));

  bodyGradient.addColorStop(0.28, rgbString(bodyColor, 0.22 + warmth * 0.38));

  bodyGradient.addColorStop(0.58, rgbString(colorPop, 0.12 + brightness * 0.3));

  bodyGradient.addColorStop(0.84, rgba('#080713', 0.26 + (1 - brightness) * 0.22));

  bodyGradient.addColorStop(1, 'rgba(0,0,0,0.02)');

  drawPath(ctx, path, {

    fill: bodyGradient,

    alpha: 0.98,

  });

  const puffCount = Math.round(lerp(20, 58, warmth * 0.35 + brightness * 0.35 + sensitivity * 0.3));

  for (let i = 0; i < puffCount; i += 1) {

    const t = i / Math.max(1, puffCount - 1);

    const angle = seededNoise(i * 41.18) * Math.PI * 2;

    const radius = seededNoise(i * 11.72) * baseRadius * 0.82;

    const x = centerX + Math.cos(angle) * radius;

    const y = centerY + Math.sin(angle) * radius * 0.58;

    const size = lerp(10, 38, seededNoise(i * 8.91)) * lerp(0.85, 1.3, sensitivity);

    const palette =

      t < 0.28

        ? rgba('#ff7448', 0.035 + attack * 0.055)

        : t < 0.54

          ? rgba('#ffb53a', 0.035 + warmth * 0.06)

          : t < 0.78

            ? rgba('#4d86ff', 0.035 + sustain * 0.055)

            : rgba('#68d9df', 0.03 + sensitivity * 0.055);

    drawSoftPuff(ctx, x, y, size, palette, 0.08);

  }

  if (brightness > 0.18) {

    const sparkleCount = Math.round(lerp(5, 34, brightness));

    for (let i = 0; i < sparkleCount; i += 1) {

      const angle = i * 2.399963 + time * 0.0001;

      const radius = 24 + ((i * 29) % Math.max(40, baseRadius * 1.12));

      const x = centerX + Math.cos(angle) * radius * 0.92 + brightness * 12;

      const y = centerY + Math.sin(angle) * radius * 0.58 - brightness * 8;

      const size = lerp(0.9, 3.8, brightness) * (i % 5 === 0 ? 1.65 : 1);

      ctx.save();

      ctx.globalAlpha = lerp(0.12, 0.76, brightness) * (i % 4 === 0 ? 1 : 0.58);

      ctx.fillStyle = rgba('#fff7bf', 0.9);

      ctx.shadowBlur = lerp(4, 14, brightness);

      ctx.shadowColor = i % 3 === 0 ? rgba('#ff4fd8', 0.75) : rgba('#68d9df', 0.75);

      ctx.beginPath();

      ctx.arc(x, y, size, 0, Math.PI * 2);

      ctx.fill();

      ctx.restore();

    }

  }

  if (sensitivity > 0.32) {

    const threadCount = Math.round(lerp(3, 10, sensitivity));

    for (let i = 0; i < threadCount; i += 1) {

      const t = i / Math.max(1, threadCount - 1);

      const y = centerY + lerp(-48, 58, t);

      const xLift = Math.sin(t * Math.PI * 2 + time * 0.0004) * 22 * sensitivity;

      ctx.save();

      ctx.globalAlpha = lerp(0.08, 0.36, sensitivity) * (1 - Math.abs(t - 0.5) * 0.65);

      ctx.strokeStyle = t % 2 > 0.5 ? rgba('#68d9df', 0.72) : rgba('#ffbedd', 0.48);

      ctx.lineWidth = lerp(0.6, 1.25, sensitivity);

      ctx.shadowBlur = 10;

      ctx.shadowColor = rgba('#68d9df', 0.34);

      ctx.beginPath();

      ctx.moveTo(centerX - baseRadius * 0.95 + xLift, y);

      ctx.bezierCurveTo(

        centerX - baseRadius * 0.35,

        y - 24 * sensitivity,

        centerX + baseRadius * 0.34,

        y + 22 * sensitivity,

        centerX + baseRadius * 0.94 + xLift * 0.3,

        y - 6

      );

      ctx.stroke();

      ctx.restore();

    }

  }

  if (attack > 0.38) {

    const spikeCount = Math.round(lerp(1, 10, attack));

    for (let i = 0; i < spikeCount; i += 1) {

      const t = spikeCount === 1 ? 0.5 : i / (spikeCount - 1);

      const spread = lerp(18, 86, attack);

      const x = centerX + lerp(-spread, spread, t) + (seededNoise(i * 6.23) - 0.5) * 18;

      const y = centerY - baseRadius * 0.62 + (seededNoise(i * 3.78) - 0.5) * 22;

      const height = lerp(14, 88, attack) * (0.55 + seededNoise(i * 9.4) * 0.75);

      ctx.save();

      ctx.globalAlpha = lerp(0.12, 0.62, attack) * (i % 3 === 0 ? 1 : 0.66);

      ctx.fillStyle = rgba('#ff7448', 0.2 + attack * 0.22);

      ctx.strokeStyle = rgba('#ff7448', 0.58 + attack * 0.28);

      ctx.lineWidth = 1.2;

      ctx.shadowBlur = lerp(8, 24, attack);

      ctx.shadowColor = rgba('#ff7448', 0.8);

      ctx.beginPath();

      ctx.moveTo(x - 7, y + 18);

      ctx.lineTo(x + (seededNoise(i * 2.2) - 0.5) * 18, y - height);

      ctx.lineTo(x + 9, y + 18);

      ctx.closePath();

      ctx.fill();

      ctx.stroke();

      ctx.restore();

    }

  }

  if (control > 0.28) {

    ctx.save();

    ctx.globalAlpha = lerp(0.05, 0.28, control);

    ctx.strokeStyle = rgba('#9e8bff', 0.55);

    ctx.lineWidth = lerp(0.5, 1.4, control);

    ctx.setLineDash([lerp(2, 10, control), lerp(12, 6, control)]);

    ctx.shadowBlur = 10;

    ctx.shadowColor = rgba('#9e8bff', 0.36);

    ctx.beginPath();

    ctx.ellipse(centerX, centerY + 12, baseRadius * 1.24, baseRadius * 0.58, -0.02, 0, Math.PI * 2);

    ctx.stroke();

    ctx.restore();

  }

  const edgeGradient = ctx.createLinearGradient(centerX - baseRadius, centerY - baseRadius, centerX + baseRadius, centerY + baseRadius);

  edgeGradient.addColorStop(0, rgba('#ff7448', 0.62 + attack * 0.32));

  edgeGradient.addColorStop(0.28, rgba('#e7d98f', 0.12 + brightness * 0.66));

  edgeGradient.addColorStop(0.5, rgba('#ffb53a', 0.22 + projection * 0.34));

  edgeGradient.addColorStop(0.72, rgba('#4d86ff', 0.14 + sustain * 0.42));

  edgeGradient.addColorStop(1, rgba('#68d9df', 0.12 + sensitivity * 0.44));

  drawPath(ctx, path, {

    stroke: edgeGradient,

    lineWidth: lerp(2.1, 4.8, attack * 0.45 + projection * 0.35 + brightness * 0.2),

    strokeAlpha: 0.92,

    shadowBlur: lerp(4, 18, projection + attack * 0.4),

    shadowColor: rgba('#ff7448', 0.18 + attack * 0.34),

  });

  drawPath(ctx, path, {

    stroke: rgba('#fff2ca', 0.18 + brightness * 0.18),

    lineWidth: 0.65,

    strokeAlpha: 0.64,

  });

  const grainCount = Math.round(lerp(60, 180, rough * 0.45 + brightness * 0.3 + warmth * 0.25));

  for (let i = 0; i < grainCount; i += 1) {

    const angle = seededNoise(i * 17.71 + 6) * Math.PI * 2;

    const radius = seededNoise(i * 31.42) * baseRadius;

    const x = centerX + Math.cos(angle) * radius;

    const y = centerY + Math.sin(angle) * radius * 0.58;

    const alpha = seededNoise(i * 2.97) * lerp(0.03, 0.16, rough + brightness * 0.25);

    ctx.save();

    ctx.globalAlpha = alpha;

    ctx.fillStyle = brightness > 0.55 ? rgba('#fff7bf', 0.45) : rgba('#ffffff', 0.22);

    ctx.beginPath();

    ctx.arc(x, y, seededNoise(i * 4.12) * 1.4 + 0.25, 0, Math.PI * 2);

    ctx.fill();

    ctx.restore();

  }

  ctx.restore();

};

export default function LegacyPrintIdentityPrototype({

  voice = DEFAULT_VOICE,

  title = 'LegacyPrint Identity',

  subtitle = 'Living acoustic body',

  compact = false,

  className = '',

}) {

  const canvasRef = useRef(null);

  const frameRef = useRef(null);

  const resolvedVoice = useMemo(() => toVoice(voice), [voice]);

  const dominantWords = useMemo(() => getDominantWords(resolvedVoice), [resolvedVoice]);

  useEffect(() => {

    const canvas = canvasRef.current;

    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d', { alpha: true });

    if (!ctx) return undefined;

    let mounted = true;

    const render = (time = 0) => {

      if (!mounted) return;

      const rect = canvas.getBoundingClientRect();

      const dpr = window.devicePixelRatio || 1;

      const nextWidth = Math.max(1, Math.floor(rect.width * dpr));

      const nextHeight = Math.max(1, Math.floor(rect.height * dpr));

      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {

        canvas.width = nextWidth;

        canvas.height = nextHeight;

      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      drawIdentity(ctx, canvas.width, canvas.height, resolvedVoice, time);

      frameRef.current = window.requestAnimationFrame(render);

    };

    frameRef.current = window.requestAnimationFrame(render);

    return () => {

      mounted = false;

      if (frameRef.current) {

        window.cancelAnimationFrame(frameRef.current);

      }

    };

  }, [resolvedVoice]);

  return (

    <section

      className={[

        'legacyprint-identity-prototype',

        compact ? 'legacyprint-identity-prototype--compact' : '',

        className,

      ]

        .filter(Boolean)

        .join(' ')}

      aria-label={title}

    >

      <div className="lp-id-header">

        <span>{subtitle}</span>

        <strong>{title}</strong>

        <p>{dominantWords.join(' / ')}</p>

      </div>

      <div className="lp-id-canvas-wrap">

        <canvas ref={canvasRef} className="lp-id-canvas" aria-hidden="true" />

      </div>

      <div className="lp-id-axis-readout">

        {AXES.map(({ key, label, Icon, low, high, color }) => {

          const value = resolvedVoice[key];

          const isHigh = value >= 0.5;

          return (

            <div

              key={key}

              className="lp-id-axis-row"

              style={{

                '--axis-color': color,

                '--axis-value': value,

              }}

            >

              <Icon size={13} strokeWidth={2.2} />

              <span>{label}</span>

              <i />

              <strong>{Math.round(value * 100)}</strong>

              <em>{isHigh ? high : low}</em>

            </div>

          );

        })}

      </div>

    </section>

  );

}