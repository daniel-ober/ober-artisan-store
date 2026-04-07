// src/components/SpiderChart.js

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

function createInteriorGradient(chart, values = [], colors = DEFAULT_POINT_COLORS) {
  const { ctx, chartArea } = chart;
  if (!chartArea) return 'rgba(120, 190, 220, 0.12)';

  const blend = getWeightedBlendColor(values, colors);
  const avg = values.length
    ? values.reduce((sum, value) => sum + (Number(value) || 0), 0) / values.length
    : 5;

  const intensity = clamp((avg - 4) / 6, 0.12, 1);
  const centerX = (chartArea.left + chartArea.right) / 2;
  const centerY = (chartArea.top + chartArea.bottom) / 2;
  const radius = Math.max(chartArea.right - chartArea.left, chartArea.bottom - chartArea.top) * 0.55;

  const gradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, radius);
  gradient.addColorStop(0, rgbToString(blend, 0.26 * intensity + 0.08));
  gradient.addColorStop(0.45, rgbToString(blend, 0.16 * intensity + 0.05));
  gradient.addColorStop(0.78, rgbToString(blend, 0.08 * intensity + 0.02));
  gradient.addColorStop(1, 'rgba(20, 28, 38, 0.02)');

  return gradient;
}

function createGradientRadarPlugin(pointColors = DEFAULT_POINT_COLORS) {
  return {
    id: 'legacyprintGradientRadar',
    afterDatasetsDraw(chart) {
      const meta = chart.getDatasetMeta(0);
      const points = meta?.data || [];
      if (points.length < 2) return;

      const { ctx } = chart;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 5.25;
      ctx.shadowBlur = 15;

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
        ctx.shadowColor = mixColor(currentColor, nextColor, 0.5, 0.34);

        ctx.beginPath();
        ctx.moveTo(current.x, current.y);
        ctx.lineTo(next.x, next.y);
        ctx.stroke();
      }

      ctx.restore();
    },

    afterDraw(chart) {
      const meta = chart.getDatasetMeta(0);
      const points = meta?.data || [];
      if (!points.length) return;

      const values = chart.data?.datasets?.[0]?.data || [];
      const blend = getWeightedBlendColor(values, pointColors);
      const { ctx, chartArea } = chart;

      if (chartArea) {
        const centerX = (chartArea.left + chartArea.right) / 2;
        const centerY = (chartArea.top + chartArea.bottom) / 2;

        ctx.save();
        const centerGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 120);
        centerGlow.addColorStop(0, rgbToString(blend, 0.12));
        centerGlow.addColorStop(0.5, rgbToString(blend, 0.045));
        centerGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = centerGlow;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 120, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.save();

      points.forEach((point, index) => {
        const color = pointColors[index % pointColors.length];
        const glow = hexToRgb(color);

        ctx.beginPath();
        ctx.fillStyle = `rgba(${glow.r}, ${glow.g}, ${glow.b}, 0.22)`;
        ctx.arc(point.x, point.y, 13, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(point.x, point.y, 5.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,255,255,0.82)';
        ctx.arc(point.x, point.y, 1.7, 0, Math.PI * 2);
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
}) => {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const pluginRef = useRef(createGradientRadarPlugin(pointColors));

  useEffect(() => {
    pluginRef.current = createGradientRadarPlugin(pointColors);
  }, [pointColors]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const existingChart = chartInstanceRef.current;

    if (!existingChart) {
      chartInstanceRef.current = new Chart(ctx, {
        type: 'radar',
        data: {
          labels,
          datasets: [
            {
              label: 'Drum Sound Profile',
              data,
              fill: true,
              backgroundColor: (context) => {
                const chart = context.chart;
                return createInteriorGradient(chart, data, pointColors);
              },
              borderColor: 'rgba(146, 215, 255, 0.16)',
              borderWidth: 1,
              pointRadius: 0,
              pointHoverRadius: 0,
              pointHitRadius: 18,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 900,
            easing: 'easeOutQuart',
          },
          transitions: {
            active: {
              animation: {
                duration: 300,
              },
            },
          },
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: 'rgba(255,255,255,0.72)',
                boxWidth: 26,
                boxHeight: 10,
                padding: compact ? 12 : 18,
                font: {
                  family: 'inherit',
                  size: compact ? 10 : 12,
                  weight: '500',
                },
              },
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
                label: (context) =>
                  `${context.label}: ${Number(context.raw).toFixed(2)}/10`,
              },
            },
          },
          scales: {
            r: {
              min: 1,
              max: 10,
              beginAtZero: false,
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
                font: {
                  family: 'inherit',
                  size: compact ? 10 : 13,
                  weight: '600',
                },
              },
            },
          },
        },
        plugins: [pluginRef.current],
      });
    } else {
      existingChart.data.labels = labels;
      existingChart.data.datasets[0].data = data;
      existingChart.data.datasets[0].backgroundColor = (context) => {
        const chart = context.chart;
        return createInteriorGradient(chart, data, pointColors);
      };
      existingChart.options.plugins.legend.labels.padding = compact ? 12 : 18;
      existingChart.options.plugins.legend.labels.font.size = compact ? 10 : 12;
      existingChart.options.scales.r.pointLabels.font.size = compact ? 10 : 13;
      existingChart.update();
    }
  }, [data, labels, compact, pointColors]);

  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className={`spider-chart-card ${compact ? 'spider-chart-card--compact' : ''}`}>
      <div className={`spider-chart-frame ${compact ? 'spider-chart-frame--compact' : ''}`}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

export default SpiderChart;