import React, { useEffect, useRef } from 'react';

import Chart from 'chart.js/auto';

import './SpiderChart.css';

const DEFAULT_POINT_COLORS = [
  '#d98952',

  '#7fb7f0',

  '#b06a42',

  '#de8a4a',

  '#d8c27a',

  '#7fc7d8',

  '#9d86cf',
];

const AXIS_KEYS = [
  'attack',

  'sustain',

  'warmth',

  'projection',

  'brightness',

  'sensitivity',

  'control',
];

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
  colors = DEFAULT_POINT_COLORS
) {
  const { ctx, chartArea } = chart;

  if (!chartArea) return 'rgba(120, 190, 220, 0.12)';

  const blend = getWeightedBlendColor(values, colors);

  const avg = values.length
    ? values.reduce((sum, value) => sum + (Number(value) || 0), 0) /
      values.length
    : 5;

  const intensity = clamp((avg - 4) / 6, 0.12, 1);

  const centerX = (chartArea.left + chartArea.right) / 2;

  const centerY = (chartArea.top + chartArea.bottom) / 2;

  const radius =
    Math.max(
      chartArea.right - chartArea.left,
      chartArea.bottom - chartArea.top
    ) * 0.58;

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

function createGradientRadarPlugin(
  activeKeyRef,
  pointColors = DEFAULT_POINT_COLORS
) {
  return {
    id: 'legacyprintGradientRadar',

    afterDraw(chart) {
      const { ctx } = chart;

      const scale = chart.scales?.r;

      const meta = chart.getDatasetMeta(0);

      const points = meta?.data || [];

      if (!scale || !points.length) return;

      const values = chart.data?.datasets?.[0]?.data || [];

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

        132
      );

      centerGlow.addColorStop(0, rgbToString(blend, 0.13));

      centerGlow.addColorStop(0.5, rgbToString(blend, 0.05));

      centerGlow.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = centerGlow;

      ctx.beginPath();

      ctx.arc(centerX, centerY, 132, 0, Math.PI * 2);

      ctx.fill();

      ctx.restore();

      const benchmarkRadius = scale.getDistanceFromCenterForValue(5);

      ctx.save();

      ctx.beginPath();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.34)';

      ctx.lineWidth = 1.5;

      ctx.setLineDash([7, 7]);

      ctx.shadowBlur = 0;

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

      ctx.save();

      ctx.lineCap = 'round';

      ctx.lineJoin = 'round';

      ctx.lineWidth = 5.6;

      ctx.shadowBlur = 16;

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

        gradient.addColorStop(
          0.5,
          mixColor(currentColor, nextColor, 0.5, 0.99)
        );

        gradient.addColorStop(1, mixColor(currentColor, nextColor, 0.96, 0.99));

        ctx.strokeStyle = gradient;

        ctx.shadowColor = mixColor(currentColor, nextColor, 0.5, 0.34);

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
          ? `rgba(${glow.r}, ${glow.g}, ${glow.b}, 0.34)`
          : `rgba(${glow.r}, ${glow.g}, ${glow.b}, 0.19)`;

        ctx.arc(point.x, point.y, isActive ? 16 : 11, 0, Math.PI * 2);

        ctx.fill();

        if (isActive) {
          ctx.beginPath();

          ctx.strokeStyle = `rgba(${glow.r}, ${glow.g}, ${glow.b}, 0.36)`;

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
    },
  };
}

const SpiderChart = ({
  data = [],

  labels = [],

  compact = false,

  pointColors = DEFAULT_POINT_COLORS,

  activeKey = 'attack',

  onAxisChange,

  pulseKey = 0,
}) => {
  const canvasRef = useRef(null);

  const chartInstanceRef = useRef(null);

  const activeKeyRef = useRef(activeKey);

  const onAxisChangeRef = useRef(onAxisChange);

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
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');

    if (!ctx) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();

      chartInstanceRef.current = null;
    }

    const plugin = createGradientRadarPlugin(activeKeyRef, pointColors);

    const handleAxisInteraction = (event, chart) => {
      const points = chart.getElementsAtEventForMode(
        event,

        'nearest',

        { intersect: true },

        true
      );

      if (points.length && typeof onAxisChangeRef.current === 'function') {
        const index = points[0].index;

        const nextKey = AXIS_KEYS[index];

        if (nextKey) onAxisChangeRef.current(nextKey);
      }
    };

    chartInstanceRef.current = new Chart(ctx, {
      type: 'radar',

      data: {
        labels,

        datasets: [
          {
            label: 'Drum Sound Profile',

            data,

            rawData: data,

            fill: true,

            backgroundColor: (context) => {
              const chart = context.chart;

              return createInteriorGradient(chart, data, pointColors);
            },

            borderColor: 'rgba(255, 255, 255, 0.10)',

            borderWidth: 1,

            pointRadius: 0,

            pointHoverRadius: 0,

            pointHitRadius: 20,
          },
        ],
      },

      options: {
        responsive: true,

        maintainAspectRatio: false,

        animation: {
          duration: 180,

          easing: 'easeOutQuart',
        },

        transitions: {
          active: {
            animation: {
              duration: 140,
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
            ? { top: 26, right: 8, bottom: 12, left: 8 }
            : { top: 42, right: 18, bottom: 20, left: 18 },
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
            backgroundColor: 'rgba(10, 14, 22, 0.96)',

            borderColor: 'rgba(103, 203, 255, 0.3)',

            borderWidth: 1,

            titleColor: '#ffffff',

            bodyColor: 'rgba(255,255,255,0.9)',

            padding: 12,

            displayColors: false,

            callbacks: {
              label: (context) => {
                const rawValue =
                  context.dataset?.rawData?.[context.dataIndex] ?? context.raw;

                return `${context.label}: ${Number(rawValue).toFixed(1)}/10`;
              },
            },
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
              color: 'rgba(255,255,255,0.11)',
            },

            angleLines: {
              color: 'rgba(255,255,255,0.12)',
            },

            pointLabels: {
              color: 'rgba(255,255,255,0.84)',

              padding: compact ? 8 : 12,

              font: {
                family: 'inherit',

                size: compact ? 10 : 13,

                weight: '600',
              },
            },
          },
        },
      },

      plugins: [plugin],
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();

        chartInstanceRef.current = null;
      }
    };
  }, [data, labels, compact, pointColors]);

  useEffect(() => {
    if (!chartInstanceRef.current) return;

    chartInstanceRef.current.data.labels = labels;

    chartInstanceRef.current.data.datasets[0].data = data;

    chartInstanceRef.current.data.datasets[0].rawData = data;

    chartInstanceRef.current.data.datasets[0].backgroundColor = (context) => {
      const chart = context.chart;

      return createInteriorGradient(chart, data, pointColors);
    };

    chartInstanceRef.current.options.scales.r.pointLabels.font.size = compact
      ? 10
      : 13;

    chartInstanceRef.current.options.scales.r.pointLabels.padding = compact
      ? 8
      : 12;

    chartInstanceRef.current.update();
  }, [data, labels, compact, pointColors]);

return (

  <div

    className={`spider-chart-card ${compact ? 'spider-chart-card--compact' : ''} spider-chart-card--benchmark-pulse`}

  >

    <div

      className={`spider-chart-frame ${compact ? 'spider-chart-frame--compact' : ''}`}

    >

      <div className="spider-chart-reference-key spider-chart-reference-key--inside">

        <span className="spider-chart-reference-key-line" aria-hidden="true" />

        <span className="spider-chart-reference-key-text">

          Dotted line = selected reference drum

        </span>

      </div>

      <canvas ref={canvasRef} />

    </div>

  </div>

);
};

export default SpiderChart;
