// src/components/FrequencySpectrum.js

import React, { useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';
import './FrequencySpectrum.css';

const SPECTRUM_BANDS = [
  { key: 'sub', label: 'Sub', start: 20, end: 60 },
  { key: 'low', label: 'Low', start: 60, end: 180 },
  { key: 'lowMid', label: 'Low-Mid', start: 180, end: 500 },
  { key: 'mid', label: 'Mid', start: 500, end: 1500 },
  { key: 'upperMid', label: 'Upper-Mid', start: 1500, end: 5000 },
  { key: 'presence', label: 'Presence', start: 5000, end: 10000 },
  { key: 'air', label: 'Air', start: 10000, end: 20000 },
];

function createBenchmarkCurve(frequencies = []) {
  return frequencies.map((freq) => {
    if (freq <= 60) return 0.28;
    if (freq <= 180) return 0.36;
    if (freq <= 500) return 0.48;
    if (freq <= 1500) return 0.55;
    if (freq <= 5000) return 0.61;
    if (freq <= 10000) return 0.58;
    return 0.52;
  });
}

const frequencyBandPlugin = {
  id: 'frequencyBandPlugin',
  afterDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    if (!chartArea || !scales?.x) return;

    const { top, bottom, left, right } = chartArea;
    const xScale = scales.x;

    ctx.save();

    SPECTRUM_BANDS.forEach((band, index) => {
      const xStart = Math.max(left, xScale.getPixelForValue(band.start));
      const xEnd = Math.min(right, xScale.getPixelForValue(band.end));
      const width = xEnd - xStart;

      if (width <= 0) return;

      if (index % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.022)';
        ctx.fillRect(xStart, top, width, bottom - top);
      }

      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(xStart, top);
      ctx.lineTo(xStart, bottom);
      ctx.stroke();
    });

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(right, top);
    ctx.lineTo(right, bottom);
    ctx.stroke();

    ctx.restore();
  },
};

function calculateFrequencies(frequencyResponse = {}) {
  const frequencies = [
    20, 30, 40, 60, 80, 100, 150, 200, 300, 400, 600, 800, 1000, 1500, 2000,
    3000, 4000, 6000, 8000, 10000, 12000, 16000, 20000,
  ];

  const levels = frequencies.map((freq) => {
    let volume = 0;

    if (freq <= 500) {
      volume =
        (Number(frequencyResponse.low) || 0) * (Math.log(freq) / Math.log(500));
    } else if (freq <= 1500) {
      volume =
        (Number(frequencyResponse.lowMid) || 0) *
        (Math.log(freq) / Math.log(1500));
    } else if (freq <= 5000) {
      volume =
        (Number(frequencyResponse.mid) || 0) *
        (Math.log(freq) / Math.log(5000));
    } else if (freq <= 10000) {
      volume =
        (Number(frequencyResponse.midHigh) || 0) *
        (Math.log(freq) / Math.log(10000));
    } else {
      volume =
        (Number(frequencyResponse.high) || 0) *
        (Math.log(freq) / Math.log(20000));
    }

    return Math.min(Math.max(volume, 0), 1);
  });

  return { frequencies, levels };
}

export default function FrequencySpectrum({ drumSpecs, frequencyResponse }) {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    const freqData = calculateFrequencies(frequencyResponse);
    const benchmarkCurve = createBenchmarkCurve(freqData.frequencies);

    const gradientFill = ctx.createLinearGradient(
      0,
      0,
      0,
      chartRef.current.height || 260
    );
    gradientFill.addColorStop(0, 'rgba(115, 221, 231, 0.28)');
    gradientFill.addColorStop(0.5, 'rgba(115, 221, 231, 0.12)');
    gradientFill.addColorStop(1, 'rgba(115, 221, 231, 0.02)');

    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: freqData.frequencies,
        datasets: [
          {
            label: 'Reference contour',
            data: benchmarkCurve,
            borderColor: 'rgba(255,255,255,0.22)',
            borderWidth: 1.5,
            borderDash: [6, 6],
            fill: false,
            tension: 0.22,
            pointRadius: 0,
            pointHoverRadius: 0,
            order: 1,
          },
          {
            label: 'Your build',
            data: freqData.levels,
            borderColor: 'rgba(115, 221, 231, 0.98)',
            backgroundColor: gradientFill,
            borderWidth: 3,
            fill: true,
            tension: 0.34,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHitRadius: 18,
            pointBackgroundColor: 'rgba(115, 221, 231, 1)',
            pointBorderColor: 'rgba(10, 16, 24, 0.95)',
            pointBorderWidth: 2,
            order: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 650,
          easing: 'easeOutQuart',
        },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(10, 14, 22, 0.96)',
            borderColor: 'rgba(115, 221, 231, 0.28)',
            borderWidth: 1,
            titleColor: '#ffffff',
            bodyColor: 'rgba(255,255,255,0.9)',
            padding: 12,
            displayColors: true,
            callbacks: {
              title: (items) => `${items[0].label} Hz`,
              label: (item) => {
                if (item.dataset.label === 'Reference contour') {
                  return `Reference: ${Number(item.raw).toFixed(2)}`;
                }
                return `Your build: ${Number(item.raw).toFixed(2)}`;
              },
              afterBody: (items) => {
                const hz = Number(items?.[0]?.label || 0);
                const band = SPECTRUM_BANDS.find(
                  (entry) => hz >= entry.start && hz <= entry.end
                );
                return band ? [`Zone: ${band.label}`] : [];
              },
            },
          },
        },
        scales: {
          x: {
            type: 'logarithmic',
            min: 20,
            max: 20000,
            grid: {
              color: 'rgba(255,255,255,0.07)',
            },
            ticks: {
              color: 'rgba(255,255,255,0.58)',
              callback(value) {
                const numeric = Number(value);
                if ([20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000].includes(numeric)) {
                  if (numeric >= 1000) {
                    return numeric === 1000 ? '1k' : `${numeric / 1000}k`;
                  }
                  return `${numeric}`;
                }
                return '';
              },
            },
            title: {
              display: true,
              text: 'Frequency (Hz)',
              color: 'rgba(255,255,255,0.72)',
              font: {
                family: 'inherit',
                size: 12,
                weight: '600',
              },
            },
          },
          y: {
            min: 0,
            max: 1,
            grid: {
              color: 'rgba(255,255,255,0.07)',
            },
            ticks: {
              color: 'rgba(255,255,255,0.58)',
              stepSize: 0.2,
              callback(value) {
                const num = Number(value);
                if (!Number.isFinite(num)) return '';
                return num === 0 ? '0' : num.toFixed(1);
              },
            },
            title: {
              display: true,
              text: 'Relative Level',
              color: 'rgba(255,255,255,0.72)',
              font: {
                family: 'inherit',
                size: 12,
                weight: '600',
              },
            },
          },
        },
      },
      plugins: [frequencyBandPlugin],
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [drumSpecs, frequencyResponse]);

  return (
    <div className="frequency-spectrum-card">
      <div className="frequency-spectrum-head">
        <div>
          <p className="frequency-spectrum-kicker">Frequency View</p>
          <h3>Expected Frequency Response</h3>
          <p className="frequency-spectrum-subtext">
            A tonal contour view of your build versus a neutral Ober reference
            shape.
          </p>
        </div>

        <div className="frequency-spectrum-mini-legend">
          <span className="fs-legend-item fs-legend-item--build">Your build</span>
          <span className="fs-legend-item fs-legend-item--reference">Reference</span>
        </div>
      </div>

      <div className="frequency-spectrum-chart-wrap">
        <canvas ref={chartRef} />
      </div>

      <div className="frequency-spectrum-band-row">
        {SPECTRUM_BANDS.map((band) => (
          <span key={band.key} className="frequency-spectrum-band-pill">
            {band.label}
          </span>
        ))}
      </div>
    </div>
  );
}