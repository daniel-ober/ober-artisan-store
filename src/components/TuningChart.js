import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import './TuningChart.css';

export default function TuningChart({
  lowestHz = 150,
  highestHz = 350,
  legacyLowHz = 200,
  legacyHighHz = 220,
  fundamentalHz = (legacyLowHz + legacyHighHz) / 2,
  selectedBand = 'legacy',
}) {
  const data = useMemo(() => {
    const step = Math.max(1, Math.round((highestHz - lowestHz) / 60));
    const arr = [];
    for (let x = lowestHz; x <= highestHz; x += step) arr.push({ hz: x, y: 1 });
    return arr;
  }, [lowestHz, highestHz]);

  const clamp = (v) => Math.max(lowestHz, Math.min(highestHz, v));
  const lLow = clamp(legacyLowHz);
  const lHigh = clamp(legacyHighHz);
  const span = highestHz - lowestHz || 1;
  const pct = (v) => ((v - lowestHz) / span) * 100;

  const belowLeft  = 0;
  const belowWidth = Math.max(0, pct(lLow) - pct(lowestHz));
  const legacyLeft  = Math.max(0, pct(lLow));
  const legacyWidth = Math.max(0, pct(lHigh) - pct(lLow));
  const aboveLeft  = Math.max(0, pct(lHigh));
  const aboveWidth = Math.max(0, pct(highestHz) - pct(lHigh));

  const active = selectedBand;

  return (
    <div className="sl-tuning-chart">
      <div className="sl-tuning-chart-graph sl-chart-shell">
        {/* minimalist overlays */}
        <div className="sl-overlay-bands" aria-hidden>
          <div className={`sl-band-layer below  ${active === 'below'  ? 'is-active' : ''}`}  style={{ left: `${belowLeft}%`,  width: `${belowWidth}%` }} />
          <div className={`sl-band-layer legacy ${active === 'legacy' ? 'is-active' : ''}`}  style={{ left: `${legacyLeft}%`, width: `${legacyWidth}%` }} />
          <div className={`sl-band-layer above  ${active === 'above'  ? 'is-active' : ''}`}  style={{ left: `${aboveLeft}%`,  width: `${aboveWidth}%` }} />
        </div>

        <div className="sl-chart-svg">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 20, bottom: 24, left: 20 }}>
              <XAxis
                dataKey="hz"
                type="number"
                domain={[lowestHz, highestHz]}
                tickFormatter={(v) => `${Math.round(v)} Hz`}
                stroke="#999"
              />
              <YAxis hide type="number" domain={[0, 1]} />
              <ReferenceLine
                x={fundamentalHz}
                stroke="#ffffff"
                strokeDasharray="6 4"
                label={{ value: '▲ Fundamental', position: 'top', fill: '#fff' }}
              />
              <Tooltip
                isAnimationActive={false}
                formatter={(_, __, p) => `${Math.round(p?.payload?.hz ?? 0)} Hz`}
                labelFormatter={(l) => `${Math.round(l)} Hz`}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}