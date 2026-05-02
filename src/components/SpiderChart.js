import React, { useEffect, useMemo, useRef } from 'react';

import Chart from 'chart.js/auto';

import {

  Zap,

  Waves,

  Flame,

  Volume2,

  SunMedium,

  Feather,

  Crosshair,

} from 'lucide-react';

import './SpiderChart.css';

const DEFAULT_POINT_COLORS = [

  '#ff7448',

  '#e7d98f',

  '#ffb53a',

  '#4d86ff',

  '#c1682e',

  '#68d9df',

  '#9e8bff',

];

const AXIS_KEYS = [

  'attack',

  'brightness',

  'projection',

  'sustain',

  'warmth',

  'sensitivity',

  'control',

];

const AXIS_COLOR_BY_KEY = {

  attack: '#ff7448',

  brightness: '#e7d98f',

  projection: '#ffb53a',

  sustain: '#4d86ff',

  warmth: '#c1682e',

  sensitivity: '#68d9df',

  control: '#9e8bff',

};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function hexToRgb(hex) {

  const normalized = String(hex || '').replace('#', '');

  const full =

    normalized.length === 3

      ? normalized

          .split('')

          .map((char) => char + char)

          .join('')

      : normalized;

  const int = Number.parseInt(full, 16);

  if (Number.isNaN(int)) {

    return { r: 140, g: 190, b: 220 };

  }

  return {

    r: (int >> 16) & 255,

    g: (int >> 8) & 255,

    b: int & 255,

  };

}

function rgbToString({ r, g, b }, alpha = 1) {

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;

}

function mixColor(hexA, hexB, ratio = 0.5, alpha = 1) {

  const a = hexToRgb(hexA);

  const b = hexToRgb(hexB);

  const t = clamp(ratio, 0, 1);

  return rgbToString(

    {

      r: Math.round(a.r + (b.r - a.r) * t),

      g: Math.round(a.g + (b.g - a.g) * t),

      b: Math.round(a.b + (b.b - a.b) * t),

    },

    alpha

  );

}

function getWeightedBlendColor(values = [], colors = DEFAULT_POINT_COLORS) {

  const safeValues = values.map((value) => clamp(Number(value) || 0, 0, 10));

  const total = safeValues.reduce((sum, value) => sum + value, 0) || 1;

  const blended = safeValues.reduce(

    (acc, value, index) => {

      const weight = value / total;

      const rgb = hexToRgb(colors[index % colors.length]);

      return {

        r: acc.r + rgb.r * weight,

        g: acc.g + rgb.g * weight,

        b: acc.b + rgb.b * weight,

      };

    },

    { r: 0, g: 0, b: 0 }

  );

  return {

    r: Math.round(blended.r),

    g: Math.round(blended.g),

    b: Math.round(blended.b),

  };

}

function createInteriorGradient(

  chart,

  values = [],

  colors = DEFAULT_POINT_COLORS,

  voiceMapVariant = 'player'

) {

  const { ctx, chartArea } = chart;

  if (!chartArea) return 'rgba(120, 190, 220, 0.12)';

  if (voiceMapVariant === 'firstTell') {

    return 'rgba(0, 0, 0, 0)';

  }

  const blend = getWeightedBlendColor(values, colors);

  const avg = values.length

    ? values.reduce((sum, value) => sum + (Number(value) || 0), 0) /

      values.length

    : 5;

  const intensity = clamp((avg - 4) / 6, 0.12, 1);

  const centerX = (chartArea.left + chartArea.right) / 2;

  const centerY = (chartArea.top + chartArea.bottom) / 2;

  const radius =

    Math.max(chartArea.right - chartArea.left, chartArea.bottom - chartArea.top) *

    0.58;

  const gradient = ctx.createRadialGradient(

    centerX,

    centerY,

    12,

    centerX,

    centerY,

    radius

  );

  gradient.addColorStop(0, rgbToString(blend, 0.3 * intensity + 0.1));

  gradient.addColorStop(0.42, rgbToString(blend, 0.18 * intensity + 0.06));

  gradient.addColorStop(0.78, rgbToString(blend, 0.08 * intensity + 0.025));

  gradient.addColorStop(1, 'rgba(20, 28, 38, 0.02)');

  return gradient;

}

function getTopThreeAxisKeysFromValues(values = []) {

  return AXIS_KEYS.map((key, index) => ({

    key,

    value: Number(values[index] ?? 5),

  }))

    .sort((a, b) => Math.abs(b.value - 5) - Math.abs(a.value - 5))

    .slice(0, 3)

    .map((item) => item.key);

}

function getOuterPoint(scale, index, radiusValue = 10) {

  return scale.getPointPositionForValue(index, radiusValue);

}

function drawColoredOuterPolygon(ctx, scale, pointColors = DEFAULT_POINT_COLORS) {

  const outerPoints = AXIS_KEYS.map((_, index) =>

    getOuterPoint(scale, index, scale.max)

  );

  ctx.save();

  ctx.lineCap = 'round';

  ctx.lineJoin = 'round';

  outerPoints.forEach((point, index) => {

    const next = outerPoints[(index + 1) % outerPoints.length];

    const currentColor = pointColors[index % pointColors.length];

    const nextColor = pointColors[(index + 1) % pointColors.length];

    const gradient = ctx.createLinearGradient(point.x, point.y, next.x, next.y);

    gradient.addColorStop(0, mixColor(currentColor, nextColor, 0.08, 0.42));

    gradient.addColorStop(0.5, mixColor(currentColor, nextColor, 0.5, 0.34));

    gradient.addColorStop(1, mixColor(currentColor, nextColor, 0.92, 0.42));

    ctx.beginPath();

    ctx.strokeStyle = gradient;

    ctx.lineWidth = 1.35;

    ctx.shadowBlur = 5;

    ctx.shadowColor = mixColor(currentColor, nextColor, 0.5, 0.16);

    ctx.moveTo(point.x, point.y);

    ctx.lineTo(next.x, next.y);

    ctx.stroke();

  });

  ctx.restore();

}

function drawFirstTellTriangle({

  ctx,

  scale,

  values = [],

  pointColors = DEFAULT_POINT_COLORS,

  firstTellKeys = [],

}) {

  const selectedKeys =

    Array.isArray(firstTellKeys) && firstTellKeys.length >= 3

      ? firstTellKeys.slice(0, 3)

      : getTopThreeAxisKeysFromValues(values);

  const selectedPoints = selectedKeys

    .map((axisKey) => {

      const index = AXIS_KEYS.indexOf(axisKey);

      if (index === -1) return null;

      return {

        key: axisKey,

        index,

        point: getOuterPoint(scale, index, scale.max),

        color: pointColors[index % pointColors.length],

      };

    })

    .filter(Boolean);

  if (selectedPoints.length < 3) return;

  const blend = getWeightedBlendColor(

    selectedPoints.map((item) => values[item.index] ?? 8),

    selectedPoints.map((item) => item.color)

  );

  const triangleGradient = ctx.createLinearGradient(

    selectedPoints[0].point.x,

    selectedPoints[0].point.y,

    selectedPoints[2].point.x,

    selectedPoints[2].point.y

  );

  triangleGradient.addColorStop(

    0,

    mixColor(selectedPoints[0].color, '#ffffff', 0.08, 0.96)

  );

  triangleGradient.addColorStop(

    0.5,

    mixColor(selectedPoints[1].color, '#ffffff', 0.08, 0.96)

  );

  triangleGradient.addColorStop(

    1,

    mixColor(selectedPoints[2].color, '#ffffff', 0.08, 0.96)

  );

  ctx.save();

  ctx.lineCap = 'round';

  ctx.lineJoin = 'round';

  ctx.beginPath();

  selectedPoints.forEach(({ point }, index) => {

    if (index === 0) ctx.moveTo(point.x, point.y);

    else ctx.lineTo(point.x, point.y);

  });

  ctx.closePath();

  ctx.fillStyle = rgbToString(blend, 0.035);

  ctx.fill();

  ctx.strokeStyle = triangleGradient;

  ctx.globalAlpha = 0.18;

  ctx.lineWidth = 12;

  ctx.shadowBlur = 18;

  ctx.shadowColor = rgbToString(blend, 0.34);

  ctx.stroke();

  ctx.globalAlpha = 0.44;

  ctx.lineWidth = 6.5;

  ctx.shadowBlur = 14;

  ctx.shadowColor = rgbToString(blend, 0.3);

  ctx.stroke();

  ctx.globalAlpha = 0.96;

  ctx.lineWidth = 2.85;

  ctx.shadowBlur = 8;

  ctx.shadowColor = rgbToString(blend, 0.24);

  ctx.stroke();

  ctx.globalAlpha = 0.5;

  ctx.strokeStyle = 'rgba(255, 246, 218, 0.44)';

  ctx.lineWidth = 0.9;

  ctx.shadowBlur = 0;

  ctx.stroke();

  ctx.restore();

  ctx.save();

  selectedPoints.forEach(({ point, color }) => {

    const glow = hexToRgb(color);

    ctx.beginPath();

    ctx.fillStyle = `rgba(${glow.r}, ${glow.g}, ${glow.b}, 0.2)`;

    ctx.arc(point.x, point.y, 18, 0, Math.PI * 2);

    ctx.fill();

    ctx.beginPath();

    ctx.strokeStyle = `rgba(${glow.r}, ${glow.g}, ${glow.b}, 0.4)`;

    ctx.lineWidth = 1.35;

    ctx.arc(point.x, point.y, 16.5, 0, Math.PI * 2);

    ctx.stroke();

    ctx.beginPath();

    ctx.fillStyle = color;

    ctx.arc(point.x, point.y, 5.8, 0, Math.PI * 2);

    ctx.fill();

    ctx.beginPath();

    ctx.fillStyle = 'rgba(255,255,255,0.9)';

    ctx.arc(point.x, point.y, 1.9, 0, Math.PI * 2);

    ctx.fill();

  });

  ctx.restore();

}

function drawLegacyPrintShape({

  ctx,

  scale,

  values = [],

  pointColors = DEFAULT_POINT_COLORS,

  legacyPrintKeys = [],

}) {

  drawColoredOuterPolygon(ctx, scale, pointColors);

  const selectedKeys =

    Array.isArray(legacyPrintKeys) && legacyPrintKeys.length >= 3

      ? legacyPrintKeys.slice(0, 4)

      : getTopThreeAxisKeysFromValues(values);

  const selectedPoints = selectedKeys

    .map((axisKey) => {

      const index = AXIS_KEYS.indexOf(axisKey);

      if (index === -1) return null;

      const rawValue = Number(values[index] ?? 5);

      const shapedValue = clamp(rawValue, 3.2, 9.2);

      return {

        key: axisKey,

        index,

        point: getOuterPoint(scale, index, shapedValue),

        outerPoint: getOuterPoint(scale, index, scale.max),

        color: pointColors[index % pointColors.length],

        value: shapedValue,

      };

    })

    .filter(Boolean);

  if (selectedPoints.length < 3) return;

  const blend = getWeightedBlendColor(

    selectedPoints.map((item) => item.value),

    selectedPoints.map((item) => item.color)

  );

  const centerPoint = {

    x: scale.xCenter,

    y: scale.yCenter,

  };

  ctx.save();

  const centerGlow = ctx.createRadialGradient(

    centerPoint.x,

    centerPoint.y,

    0,

    centerPoint.x,

    centerPoint.y,

    128

  );

  centerGlow.addColorStop(0, rgbToString(blend, 0.12));

  centerGlow.addColorStop(0.5, rgbToString(blend, 0.05));

  centerGlow.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = centerGlow;

  ctx.beginPath();

  ctx.arc(centerPoint.x, centerPoint.y, 128, 0, Math.PI * 2);

  ctx.fill();

  ctx.restore();

  ctx.save();

  ctx.lineCap = 'round';

  ctx.lineJoin = 'round';

  const sortedPoints = [...selectedPoints].sort((a, b) => a.index - b.index);

  const gradient = ctx.createLinearGradient(

    sortedPoints[0].point.x,

    sortedPoints[0].point.y,

    sortedPoints[sortedPoints.length - 1].point.x,

    sortedPoints[sortedPoints.length - 1].point.y

  );

  sortedPoints.forEach((item, index) => {

    gradient.addColorStop(

      sortedPoints.length === 1 ? 0 : index / (sortedPoints.length - 1),

      mixColor(item.color, '#ffffff', 0.08, 0.96)

    );

  });

  ctx.beginPath();

  sortedPoints.forEach((item, index) => {

    const current = item.point;

    const next = sortedPoints[(index + 1) % sortedPoints.length].point;

    const midX = (current.x + next.x) / 2;

    const midY = (current.y + next.y) / 2;

    const pullX = centerPoint.x + (midX - centerPoint.x) * 0.72;

    const pullY = centerPoint.y + (midY - centerPoint.y) * 0.72;

    if (index === 0) {

      ctx.moveTo(current.x, current.y);

    }

    ctx.quadraticCurveTo(pullX, pullY, next.x, next.y);

  });

  ctx.closePath();

  ctx.fillStyle = rgbToString(blend, 0.07);

  ctx.fill();

  ctx.strokeStyle = gradient;

  ctx.globalAlpha = 0.2;

  ctx.lineWidth = 15;

  ctx.shadowBlur = 24;

  ctx.shadowColor = rgbToString(blend, 0.38);

  ctx.stroke();

  ctx.globalAlpha = 0.52;

  ctx.lineWidth = 8;

  ctx.shadowBlur = 18;

  ctx.shadowColor = rgbToString(blend, 0.34);

  ctx.stroke();

  ctx.globalAlpha = 0.98;

  ctx.lineWidth = 3.4;

  ctx.shadowBlur = 10;

  ctx.shadowColor = rgbToString(blend, 0.26);

  ctx.stroke();

  ctx.globalAlpha = 0.48;

  ctx.strokeStyle = 'rgba(255, 246, 218, 0.44)';

  ctx.lineWidth = 0.9;

  ctx.shadowBlur = 0;

  ctx.stroke();

  ctx.restore();

  ctx.save();

  selectedPoints.forEach(({ outerPoint, color }) => {

    const glow = hexToRgb(color);

    ctx.beginPath();

    ctx.fillStyle = `rgba(${glow.r}, ${glow.g}, ${glow.b}, 0.2)`;

    ctx.arc(outerPoint.x, outerPoint.y, 18, 0, Math.PI * 2);

    ctx.fill();

    ctx.beginPath();

    ctx.strokeStyle = `rgba(${glow.r}, ${glow.g}, ${glow.b}, 0.4)`;

    ctx.lineWidth = 1.35;

    ctx.arc(outerPoint.x, outerPoint.y, 16.5, 0, Math.PI * 2);

    ctx.stroke();

    ctx.beginPath();

    ctx.fillStyle = color;

    ctx.arc(outerPoint.x, outerPoint.y, 5.8, 0, Math.PI * 2);

    ctx.fill();

    ctx.beginPath();

    ctx.fillStyle = 'rgba(255,255,255,0.9)';

    ctx.arc(outerPoint.x, outerPoint.y, 1.9, 0, Math.PI * 2);

    ctx.fill();

  });

  ctx.restore();

}

function drawPlayerRead({

  ctx,

  chart,

  scale,

  points = [],

  values = [],

  pointColors = DEFAULT_POINT_COLORS,

  activeKeyRef,

  mode,

}) {

  const blend = getWeightedBlendColor(values, pointColors);

  const centerX = scale.xCenter;

  const centerY = scale.yCenter;

  ctx.save();

  const centerGlow = ctx.createRadialGradient(

    centerX,

    centerY,

    0,

    centerX,

    centerY,

    mode === 'compare' ? 132 : 150

  );

  centerGlow.addColorStop(

    0,

    rgbToString(blend, mode === 'compare' ? 0.13 : 0.17)

  );

  centerGlow.addColorStop(

    0.5,

    rgbToString(blend, mode === 'compare' ? 0.05 : 0.07)

  );

  centerGlow.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = centerGlow;

  ctx.beginPath();

  ctx.arc(centerX, centerY, mode === 'compare' ? 132 : 150, 0, Math.PI * 2);

  ctx.fill();

  ctx.restore();

  if (mode === 'compare') {

    const benchmarkRadius = scale.getDistanceFromCenterForValue(5);

    ctx.save();

    ctx.beginPath();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.34)';

    ctx.lineWidth = 1.5;

    ctx.setLineDash([7, 7]);

    points.forEach((point, index) => {

      const angle = scale.getIndexAngle(index) - Math.PI / 2;

      const x = centerX + Math.cos(angle) * benchmarkRadius;

      const y = centerY + Math.sin(angle) * benchmarkRadius;

      if (index === 0) ctx.moveTo(x, y);

      else ctx.lineTo(x, y);

    });

    ctx.closePath();

    ctx.stroke();

    ctx.restore();

  }

  ctx.save();

  ctx.lineCap = 'round';

  ctx.lineJoin = 'round';

  ctx.lineWidth = mode === 'compare' ? 5.6 : 6.4;

  ctx.shadowBlur = mode === 'compare' ? 16 : 20;

  for (let i = 0; i < points.length; i += 1) {

    const current = points[i];

    const next = points[(i + 1) % points.length];

    const currentColor = pointColors[i % pointColors.length];

    const nextColor = pointColors[(i + 1) % pointColors.length];

    const gradient = ctx.createLinearGradient(

      current.x,

      current.y,

      next.x,

      next.y

    );

    gradient.addColorStop(0, mixColor(currentColor, nextColor, 0.04, 0.99));

    gradient.addColorStop(0.5, mixColor(currentColor, nextColor, 0.5, 0.99));

    gradient.addColorStop(1, mixColor(currentColor, nextColor, 0.96, 0.99));

    ctx.strokeStyle = gradient;

    ctx.shadowColor = mixColor(

      currentColor,

      nextColor,

      0.5,

      mode === 'compare' ? 0.34 : 0.42

    );

    ctx.beginPath();

    ctx.moveTo(current.x, current.y);

    ctx.lineTo(next.x, next.y);

    ctx.stroke();

  }

  ctx.restore();

  ctx.save();

  points.forEach((point, index) => {

    const color = pointColors[index % pointColors.length];

    const glow = hexToRgb(color);

    const isActive = AXIS_KEYS[index] === activeKeyRef.current;

    ctx.beginPath();

    ctx.fillStyle = isActive

      ? `rgba(${glow.r}, ${glow.g}, ${glow.b}, 0.36)`

      : `rgba(${glow.r}, ${glow.g}, ${glow.b}, 0.2)`;

    ctx.arc(point.x, point.y, isActive ? 18 : 10, 0, Math.PI * 2);

    ctx.fill();

    if (isActive) {

      ctx.beginPath();

      ctx.strokeStyle = `rgba(${glow.r}, ${glow.g}, ${glow.b}, 0.4)`;

      ctx.lineWidth = 1.5;

      ctx.arc(point.x, point.y, 20, 0, Math.PI * 2);

      ctx.stroke();

    }

    ctx.beginPath();

    ctx.fillStyle = color;

    ctx.arc(point.x, point.y, isActive ? 6.8 : 5.1, 0, Math.PI * 2);

    ctx.fill();

    ctx.beginPath();

    ctx.fillStyle = 'rgba(255,255,255,0.9)';

    ctx.arc(point.x, point.y, isActive ? 2.1 : 1.6, 0, Math.PI * 2);

    ctx.fill();

  });

  ctx.restore();

}

function createGradientRadarPlugin({

  activeKeyRef,

  pointColors = DEFAULT_POINT_COLORS,

  modeRef,

  voiceMapVariantRef,

  firstTellKeysRef,

}) {

  return {

    id: 'legacyprintGradientRadar',

    afterDraw(chart) {

      const { ctx } = chart;

      const scale = chart.scales?.r;

      const meta = chart.getDatasetMeta(0);

      const points = meta?.data || [];

      if (!scale || !points.length) return;

      const mode = modeRef.current || 'standalone';

      const voiceMapVariant = voiceMapVariantRef.current || 'player';

      const values = chart.data?.datasets?.[0]?.data || [];

      if (voiceMapVariant === 'firstTell') {

        drawColoredOuterPolygon(ctx, scale, pointColors);

        drawFirstTellTriangle({

          ctx,

          scale,

          values,

          pointColors,

          firstTellKeys: firstTellKeysRef.current || [],

        });

        return;

      }

      if (voiceMapVariant === 'legacyprint') {

        drawLegacyPrintShape({

          ctx,

          scale,

          values,

          pointColors,

          legacyPrintKeys: firstTellKeysRef.current || [],

        });

        return;

      }

      drawPlayerRead({

        ctx,

        chart,

        scale,

        points,

        values,

        pointColors,

        activeKeyRef,

        mode,

      });

    },

  };

}

const AxisIcon = ({ axisKey, size = 18 }) => {

  const color = AXIS_COLOR_BY_KEY[axisKey] || '#d6b277';

  const iconProps = {

    size,

    strokeWidth: 2.1,

    color,

    'aria-hidden': true,

  };

  switch (axisKey) {

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

const SpiderChart = ({

  data = [],

  labels = [],

  compact = false,

  pointColors = DEFAULT_POINT_COLORS,

  activeKey = 'attack',

  onAxisChange,

  mode = 'standalone',

  /**

   * VoiceMap variants:

   * - player: current filled/glowing spider read

   * - firstTell: simple outer 7-node polygon + glowing triangle touching 3 nodes

   */

  voiceMapVariant = 'player',

  firstTellKeys = [],

}) => {

  const canvasRef = useRef(null);

  const chartInstanceRef = useRef(null);

  const activeKeyRef = useRef(activeKey);

  const onAxisChangeRef = useRef(onAxisChange);

  const modeRef = useRef(mode);

  const voiceMapVariantRef = useRef(voiceMapVariant);

  const firstTellKeysRef = useRef(firstTellKeys);

  const frameRef = useRef(null);

  const [axisPositions, setAxisPositions] = React.useState([]);

  const isCompareMode = mode === 'compare';

  const isFirstTell = voiceMapVariant === 'firstTell';

  const overlayAxes = useMemo(

    () =>

      Array.isArray(labels) && labels.length

        ? labels.map((axis, index) => ({

            key: axis.key || AXIS_KEYS[index],

            label: axis.label || AXIS_KEYS[index],

          }))

        : AXIS_KEYS.map((key) => ({

            key,

            label: key.charAt(0).toUpperCase() + key.slice(1),

          })),

    [labels]

  );

  const recalcAxisPositions = () => {

    const chart = chartInstanceRef.current;

    const frame = frameRef.current;

    const scale = chart?.scales?.r;

    if (!chart || !frame || !scale) return;

    const frameRect = frame.getBoundingClientRect();

    const canvasRect = chart.canvas.getBoundingClientRect();

    const canvasOffsetX = canvasRect.left - frameRect.left;

    const canvasOffsetY = canvasRect.top - frameRect.top;

    const baseOffset = window.innerWidth <= 700 ? 10 : 14;

    const nextPositions = AXIS_KEYS.map((key, index) => {

      const point = scale.getPointPositionForValue(index, scale.max);

      const dx = point.x - scale.xCenter;

      const dy = point.y - scale.yCenter;

      const length = Math.hypot(dx, dy) || 1;

      const ux = dx / length;

      const uy = dy / length;

      const x = canvasOffsetX + point.x + ux * baseOffset;

      const y = canvasOffsetY + point.y + uy * baseOffset;

      return { key, x, y };

    });

    setAxisPositions(nextPositions);

  };

  useEffect(() => {

    activeKeyRef.current = activeKey;

    if (chartInstanceRef.current) {

      chartInstanceRef.current.render();

    }

  }, [activeKey]);

  useEffect(() => {

    onAxisChangeRef.current = onAxisChange;

  }, [onAxisChange]);

  useEffect(() => {

    modeRef.current = mode;

    if (chartInstanceRef.current) {

      chartInstanceRef.current.render();

    }

  }, [mode]);

  useEffect(() => {

    voiceMapVariantRef.current = voiceMapVariant;

    if (chartInstanceRef.current) {

      chartInstanceRef.current.render();

    }

  }, [voiceMapVariant]);

  useEffect(() => {

    firstTellKeysRef.current = firstTellKeys;

    if (chartInstanceRef.current) {

      chartInstanceRef.current.render();

    }

  }, [firstTellKeys]);

  useEffect(() => {

    if (!canvasRef.current) return undefined;

    const ctx = canvasRef.current.getContext('2d');

    if (!ctx) return undefined;

    if (chartInstanceRef.current) {

      chartInstanceRef.current.destroy();

      chartInstanceRef.current = null;

    }

    const plugin = createGradientRadarPlugin({

      activeKeyRef,

      pointColors,

      modeRef,

      voiceMapVariantRef,

      firstTellKeysRef,

    });

    const handleAxisInteraction = (event, chart) => {

      const points = chart.getElementsAtEventForMode(

        event,

        'nearest',

        { intersect: true },

        true

      );

      if (points.length) {

        const index = points[0].index;

        const nextKey = AXIS_KEYS[index];

        if (nextKey && typeof onAxisChangeRef.current === 'function') {

          onAxisChangeRef.current(nextKey);

        }

      }

    };

    chartInstanceRef.current = new Chart(ctx, {

      type: 'radar',

      data: {

        labels: overlayAxes.map(() => ''),

        datasets: [

          {

            label:

              voiceMapVariantRef.current === 'firstTell'

                ? 'First Tell'

                : 'Current Build',

            data,

            rawData: data,

            fill: !isFirstTell,

            backgroundColor: (context) => {

              const chart = context.chart;

              return createInteriorGradient(

                chart,

                data,

                pointColors,

                voiceMapVariantRef.current

              );

            },

            borderColor: 'rgba(255, 255, 255, 0)',

            borderWidth: 0,

            pointRadius: 0,

            pointHoverRadius: 0,

            pointHitRadius: 34,

          },

        ],

      },

      options: {

        responsive: true,

        maintainAspectRatio: false,

        animation: {

          duration: 700,

          easing: 'easeInOutQuart',

          onComplete: () => {

            recalcAxisPositions();

          },

        },

        transitions: {

          active: {

            animation: {

              duration: 220,

              easing: 'easeOutCubic',

            },

          },

          resize: {

            animation: {

              duration: 0,

            },

          },

        },

        layout: {

          padding: compact

            ? { top: 36, right: 8, bottom: 16, left: 8 }

            : { top: 58, right: 18, bottom: 24, left: 18 },

        },

        onHover: (event, _elements, chart) => {

          handleAxisInteraction(event, chart);

        },

        onClick: (event, _elements, chart) => {

          handleAxisInteraction(event, chart);

        },

        plugins: {

          legend: {

            display: false,

          },

          tooltip: {

            enabled: false,

          },

        },

        hover: {

          animationDuration: 0,

        },

        scales: {

          r: {

            min: 0,

            max: 10,

            beginAtZero: true,

            ticks: {

              display: false,

              stepSize: 1,

              backdropColor: 'transparent',

            },

            grid: {

              color: isFirstTell

                ? 'rgba(255,255,255,0)'

                : isCompareMode

                  ? 'rgba(255,255,255,0.11)'

                  : 'rgba(214,178,119,0.09)',

            },

            angleLines: {

              color: isFirstTell

                ? 'rgba(255,255,255,0)'

                : isCompareMode

                  ? 'rgba(255,255,255,0.12)'

                  : 'rgba(255,255,255,0.10)',

            },

            pointLabels: {

              display: false,

            },

          },

        },

      },

      plugins: [plugin],

    });

    const resizeObserver = new ResizeObserver(() => {

      recalcAxisPositions();

    });

    if (frameRef.current) {

      resizeObserver.observe(frameRef.current);

    }

    const timeout = setTimeout(() => {

      recalcAxisPositions();

    }, 40);

    return () => {

      clearTimeout(timeout);

      resizeObserver.disconnect();

      if (chartInstanceRef.current) {

        chartInstanceRef.current.destroy();

        chartInstanceRef.current = null;

      }

    };

  }, [compact, pointColors, data, overlayAxes, isCompareMode, isFirstTell]);

  useEffect(() => {

    if (!chartInstanceRef.current) return;

    const chart = chartInstanceRef.current;

    chart.data.labels = overlayAxes.map(() => '');

    chart.data.datasets[0].label =

      voiceMapVariant === 'firstTell' ? 'First Tell' : 'Current Build';

    chart.data.datasets[0].data = data;

    chart.data.datasets[0].rawData = data;

    chart.data.datasets[0].fill = voiceMapVariant !== 'firstTell';

    chart.data.datasets[0].backgroundColor = (context) => {

      const chartRef = context.chart;

      return createInteriorGradient(

        chartRef,

        data,

        pointColors,

        voiceMapVariant

      );

    };

    chart.options.scales.r.grid.color =

      voiceMapVariant === 'firstTell'

        ? 'rgba(255,255,255,0)'

        : isCompareMode

          ? 'rgba(255,255,255,0.11)'

          : 'rgba(214,178,119,0.09)';

    chart.options.scales.r.angleLines.color =

      voiceMapVariant === 'firstTell'

        ? 'rgba(255,255,255,0)'

        : isCompareMode

          ? 'rgba(255,255,255,0.12)'

          : 'rgba(255,255,255,0.10)';

    chart.update('default');

    setTimeout(() => {

      recalcAxisPositions();

    }, 40);

  }, [data, compact, pointColors, overlayAxes, isCompareMode, voiceMapVariant]);

  return (

    <div

      className={`spider-chart-card ${

        compact ? 'spider-chart-card--compact' : ''

      } ${

        isCompareMode

          ? 'spider-chart-card--compare'

          : 'spider-chart-card--standalone'

      } spider-chart-card--${voiceMapVariant}`}

    >

      <div

        ref={frameRef}

        className={`spider-chart-frame ${

          compact ? 'spider-chart-frame--compact' : ''

        } spider-chart-frame--${voiceMapVariant}`}

      >

        <div className="spider-chart-legend spider-chart-legend--inside">

          <div className="spider-chart-legend-item">

            <span className="spider-chart-legend-line spider-chart-legend-line--current" />

            <span className="spider-chart-legend-text">

              {voiceMapVariant === 'firstTell' ? 'First Tell' : 'Current Build'}

            </span>

          </div>

          {isCompareMode && voiceMapVariant !== 'firstTell' && (

            <div className="spider-chart-legend-item">

              <span className="spider-chart-legend-line spider-chart-legend-line--reference" />

              <span className="spider-chart-legend-text">Reference Drum</span>

            </div>

          )}

        </div>

        <div className="spider-chart-axis-overlay" aria-hidden="true">

          {overlayAxes.map((axis) => {

            const isActive = activeKey === axis.key;

            const isFirstTellNode = firstTellKeys.includes(axis.key);

            const position = axisPositions.find((item) => item.key === axis.key);

            return (

              <div

                key={axis.key}

                className={`spider-chart-axis-button is-decorative ${

                  isActive ? 'is-active' : ''

                } ${isFirstTell && isFirstTellNode ? 'is-first-tell-node' : ''}`}

                style={{

                  '--axis-color': AXIS_COLOR_BY_KEY[axis.key],

                  left: position ? `${position.x}px` : '50%',

                  top: position ? `${position.y}px` : '50%',

                }}

              >

                <span className="spider-chart-axis-button-icon">

                  <AxisIcon

                    axisKey={axis.key}

                    size={isActive || isFirstTellNode ? 20 : 18}

                  />

                </span>

              </div>

            );

          })}

        </div>

        <canvas ref={canvasRef} />

      </div>

    </div>

  );

};

export default SpiderChart;