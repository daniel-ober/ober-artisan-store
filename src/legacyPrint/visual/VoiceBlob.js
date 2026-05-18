import React, { useMemo, useEffect, useState } from 'react';

const NODE_KEYS = [

  'attack',

  'brightness',

  'projection',

  'sustain',

  'warmth',

  'sensitivity',

  'control',

];

const clamp01 = (value, fallback = 0.5) => {

  const number = Number(value);

  if (!Number.isFinite(number)) return fallback;

  return Math.max(0, Math.min(1, number));

};

const getVoiceValue = (voice, key, fallback = 0.5) => {

  if (!voice || typeof voice !== 'object') return fallback;

  return clamp01(voice[key], fallback);

};

function buildBlobPoints(voice, time) {

  const attack = getVoiceValue(voice, 'attack');

  const brightness = getVoiceValue(voice, 'brightness');

  const projection = getVoiceValue(voice, 'projection');

  const sustain = getVoiceValue(voice, 'sustain');

  const warmth = getVoiceValue(voice, 'warmth');

  const sensitivity = getVoiceValue(voice, 'sensitivity');

  const control = getVoiceValue(voice, 'control');

  const points = 96;

  const baseRadius = 44 + projection * 34;

  const detailAmount = 4 + sensitivity * 16;

  const attackPull = attack * 13;

  const warmthRoundness = warmth * 10;

  const sustainBreath = Math.sin(time * (0.8 + sustain * 1.4)) * (2 + sustain * 8);

  const controlTightness = 1 - control * 0.28;

  return Array.from({ length: points }, (_, index) => {

    const angle = (Math.PI * 2 * index) / points;

    const brightnessLift = Math.sin(angle - Math.PI * 0.2) * brightness * 12;

    const attackSpike = Math.cos(angle - Math.PI * 1.5) * attackPull;

    const sensitivityRipple =

      Math.sin(angle * 5 + time * 1.8) * detailAmount +

      Math.sin(angle * 9 - time * 1.1) * sensitivity * 5;

    const warmthBulge = Math.sin(angle + Math.PI * 0.75) * warmthRoundness;

    const radius =

      (baseRadius +

        sustainBreath +

        brightnessLift +

        attackSpike +

        sensitivityRipple +

        warmthBulge) *

      controlTightness;

    return {

      x: 120 + Math.cos(angle) * radius,

      y: 120 + Math.sin(angle) * radius,

    };

  });

}

function pointsToSmoothPath(points) {

  if (!points.length) return '';

  const path = [`M ${points[0].x} ${points[0].y}`];

  for (let i = 0; i < points.length; i += 1) {

    const current = points[i];

    const next = points[(i + 1) % points.length];

    const midX = (current.x + next.x) / 2;

    const midY = (current.y + next.y) / 2;

    path.push(`Q ${current.x} ${current.y} ${midX} ${midY}`);

  }

  path.push('Z');

  return path.join(' ');

}

export function VoiceBlob({ voice, size = 240 }) {

  const [time, setTime] = useState(0);

  useEffect(() => {

    let frameId;

    const loop = (timestamp) => {

      setTime(timestamp * 0.001);

      frameId = requestAnimationFrame(loop);

    };

    frameId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(frameId);

  }, []);

  const path = useMemo(() => {

    const points = buildBlobPoints(voice, time);

    return pointsToSmoothPath(points);

  }, [voice, time]);

  const glowStrength = useMemo(() => {

    const projection = getVoiceValue(voice, 'projection');

    const sensitivity = getVoiceValue(voice, 'sensitivity');

    return 0.45 + projection * 0.3 + sensitivity * 0.25;

  }, [voice]);

  return (

    <svg

      width={size}

      height={size}

      viewBox="0 0 240 240"

      role="img"

      aria-label="LegacyPrint voice blob"

      style={{ display: 'block' }}

    >

      <defs>

        <radialGradient id="voiceBlobFill" cx="50%" cy="45%" r="60%">

          <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />

          <stop offset="45%" stopColor="rgba(188,92,255,0.34)" />

          <stop offset="100%" stopColor="rgba(87,31,140,0.18)" />

        </radialGradient>

        <filter id="voiceBlobGlow" x="-80%" y="-80%" width="260%" height="260%">

          <feGaussianBlur stdDeviation="8" result="blur" />

          <feColorMatrix

            in="blur"

            type="matrix"

            values={`1 0 0 0 0.55  0 0.45 0 0 0.1  0 0 1 0 1  0 0 0 ${glowStrength} 0`}

            result="glow"

          />

          <feMerge>

            <feMergeNode in="glow" />

            <feMergeNode in="SourceGraphic" />

          </feMerge>

        </filter>

      </defs>

      <circle

        cx="120"

        cy="120"

        r="72"

        fill="none"

        stroke="rgba(205,134,255,0.18)"

        strokeWidth="1"

        strokeDasharray="5 6"

      />

      <path

        d={path}

        fill="url(#voiceBlobFill)"

        stroke="rgba(224,122,255,0.95)"

        strokeWidth="1.8"

        filter="url(#voiceBlobGlow)"

      />

    </svg>

  );

}