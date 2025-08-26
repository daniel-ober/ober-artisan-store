// src/components/LegacyTuning.jsx
import React, { forwardRef, useMemo } from 'react';
import './LegacyTuning.css';

const N = (v, d = null) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const fmtHz = (n) => `${Math.round(n)} Hz`;

const PITCH = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const hzToNote = (hz) => {
  if (!hz || hz <= 0) return '';
  const n = Math.round(12 * (Math.log2(hz / 440)));
  const midi = n + 69;
  const name = PITCH[(midi % 12 + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
};

const LegacyTuning = forwardRef(function LegacyTuning(
  {
    axis,                      // { loHz, hiHz, tickHz }
    spots = { low:{}, legacy:{}, high:{} }, // { id:{lo,hi} }
    shellFundHz = null,
    notesText = '',
  },
  ref
){
  // Resolve axis
  const lo = N(axis?.loHz, 140);
  const hi = N(axis?.hiHz, 360);
  const span = Math.max(1, hi - lo);
  const tickHz = N(axis?.tickHz, span <= 400 ? 20 : 50);

  const pct = (hz) => `${((clamp(N(hz, lo), lo, hi) - lo) / span) * 100}%`;

  // Normalize windows
  const norm = (b) => {
    const a = N(b?.lo, lo);
    const z = N(b?.hi, hi);
    const L = clamp(Math.min(a, z), lo, hi);
    const H = clamp(Math.max(a, z), lo, hi);
    return { lo: L, hi: H, center: (L + H) / 2 };
  };
  const low = norm(spots.low);
  const legacy = norm(spots.legacy);
  const high = norm(spots.high);

  // Ticks
  const ticks = useMemo(() => {
    const list = [];
    const start = Math.ceil(lo / tickHz) * tickHz;
    for (let h = start; h <= hi + 0.0001; h += tickHz) list.push(h);
    return list;
  }, [lo, hi, tickHz]);

  return (
    <section ref={ref} className="lt-section sl-anchor" aria-labelledby="lt-h">
      <h2 id="lt-h" className="sl-h2">Legacy Tuning</h2>

      {/* head pill */}
      {shellFundHz ? (
        <div className="lt-pill">
          Shell fundamental:&nbsp;
          <strong>{fmtHz(shellFundHz)}</strong>&nbsp;
          ({hzToNote(shellFundHz)})
        </div>
      ) : null}

      {/* ruler */}
      <div className="lt-ruler">
        {/* ticks */}
        {ticks.map((h) => (
          <div key={h} className="lt-tick" style={{ left: pct(h) }}>
            <div className="lt-tick-line" />
            <div className="lt-tick-label">{h}</div>
          </div>
        ))}

        {/* full playable */}
        <div
          className="lt-full"
          style={{ left: pct(lo), width: `calc(${pct(hi)} - ${pct(lo)})` }}
          title={`Full playable range: ${fmtHz(lo)} – ${fmtHz(hi)}`}
        />

        {/* bands */}
        <div
          className="lt-band low"
          style={{ left: pct(low.lo), width: `calc(${pct(low.hi)} - ${pct(low.lo)})` }}
          title={`Low sweet spot: ${fmtHz(low.lo)} – ${fmtHz(low.hi)}`}
        />
        <div
          className="lt-band legacy"
          style={{ left: pct(legacy.lo), width: `calc(${pct(legacy.hi)} - ${pct(legacy.lo)})` }}
          title={`LegacyPrint™: ${fmtHz(legacy.lo)} – ${fmtHz(legacy.hi)}`}
        />
        <div
          className="lt-band high"
          style={{ left: pct(high.lo), width: `calc(${pct(high.hi)} - ${pct(high.lo)})` }}
          title={`High sweet spot: ${fmtHz(high.lo)} – ${fmtHz(high.hi)}`}
        />

        {/* markers */}
        <div className="lt-marker star" style={{ left: pct(legacy.center) }} aria-label="LegacyPrint center">★</div>
        <div className="lt-marker dot low"  style={{ left: pct(low.center) }}  aria-label="Low center" />
        <div className="lt-marker dot high" style={{ left: pct(high.center) }} aria-label="High center" />
      </div>

      {/* legend + caption */}
      <div className="lt-legend">
        <span className="chip range">Drum’s full tuning range</span>
        <span className="chip spot">Sweet spot</span>
        <span className="chip legacy">LegacyPrint™</span>
      </div>

      <div className="lt-notes">
        {notesText && notesText.trim().length
          ? `Notes: ${notesText.trim()}`
          : `Playable: ${fmtHz(lo)} (${hzToNote(lo)}) – ${fmtHz(hi)} (${hzToNote(hi)})`}
      </div>
    </section>
  );
});

export default LegacyTuning;