import React, { useMemo } from 'react';
import './SegmentedRange.css';

// helpers
const N = (v, d = null) => (Number.isFinite(Number(v)) ? Number(v) : d);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const pct = (hz, lo, hi) => ((clamp(hz, lo, hi) - lo) / (hi - lo)) * 100;

// simple Hz→note (A4=440)
const PITCH = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const hzToNote = (hz) => {
  if (!hz || hz <= 0) return '';
  const n = Math.round(12 * (Math.log2(hz / 440)));
  const midi = n + 69;
  const name = PITCH[(midi % 12 + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
};

/**
 * SegmentedRange
 * - If `axis` is provided, uses axis.loHz/hiHz/tickHz for the ruler and full playable range.
 * - Falls back to lowestHz/highestHz if axis not provided.
 * - Shows ONE star (Legacy) and DOTs for low/high, all clamped to the axis range.
 */
export default function SegmentedRange({
  axis,                         // { loHz, hiHz, tickHz }
  lowestHz,                     // fallback if no axis
  highestHz,                    // fallback if no axis
  legacyLowHz,
  legacyHighHz,
  activeBand = 'legacy',        // 'below' | 'legacy' | 'above'
  markerShellHz,                // optional teal pin
  markerHarmHz,                 // optional white pin
  showPlayableCaption = false,  // show "Playable: xxx–yyy (notes)" under the bar
}) {
  // Axis resolution
  const LO = N(axis?.loHz, N(lowestHz, 150));
  const HI = N(axis?.hiHz, N(highestHz, Math.max(LO + 200, 350)));
  const TICK = N(axis?.tickHz, (HI - LO) <= 400 ? 50 : 100);

  // Window boundaries (infer neighbors from legacy bounds + axis ends)
  const loLo = N(lowestHz, LO);
  const loHi = N(legacyLowHz, (LO + N(legacyHighHz, LO + 40)) / 2);
  const legLo = N(legacyLowHz, LO + (HI - LO) * 0.3);
  const legHi = N(legacyHighHz, legLo + 20);
  const hiLo = N(legacyHighHz, legHi);
  const hiHi = N(highestHz, HI);

  // Centers
  const centers = useMemo(() => ({
    below:  (loLo + loHi) / 2,
    legacy: (legLo + legHi) / 2,
    above:  (hiLo + hiHi) / 2,
  }), [loLo, loHi, legLo, legHi, hiLo, hiHi]);

  // Ticks
  const ticks = useMemo(() => {
    const arr = [];
    const start = Math.ceil(LO / TICK) * TICK;
    for (let h = start; h <= HI + 0.0001; h += TICK) arr.push(h);
    return arr;
  }, [LO, HI, TICK]);

  const playableCaption = showPlayableCaption
    ? `Playable: ${Math.round(LO)} Hz (${hzToNote(LO)}) – ${Math.round(HI)} Hz (${hzToNote(HI)})`
    : null;

  return (
    <div className="sr">
      {/* Base track */}
      <div className="sr-track" />

      {/* Axis ticks/labels */}
      {ticks.map((h) => (
        <div key={h} className="sr-tick" style={{ left: `${pct(h, LO, HI)}%` }}>
          <div className="sr-tickline" />
          <div className="sr-ticklabel">{h}</div>
        </div>
      ))}

      {/* Full playable range (green band) */}
      <div
        className="sr-playable"
        style={{ left: `${pct(LO, LO, HI)}%`, width: `${Math.max(0, pct(HI, LO, HI) - pct(LO, LO, HI))}%` }}
        title={`Playable range: ${Math.round(LO)}–${Math.round(HI)} Hz`}
      />

      {/* Legacy thin highlight (always inside playable) */}
      <div
        className={`sr-legacywin ${activeBand === 'legacy' ? 'active' : ''}`}
        style={{
          left: `${pct(legLo, LO, HI)}%`,
          width: `${Math.max(0, pct(legHi, LO, HI) - pct(legLo, LO, HI))}%`,
        }}
        title={`Legacy window: ${Math.round(legLo)}–${Math.round(legHi)} Hz`}
      />

      {/* Centers: one STAR for legacy, DOTs for others */}
      <div
        className={`sr-star legacy ${activeBand === 'legacy' ? 'is-active' : ''}`}
        style={{ left: `${pct(centers.legacy, LO, HI)}%` }}
        title={`Legacy center: ${Math.round(centers.legacy)} Hz`}
      >
        ★
      </div>

      <div
        className={`sr-dot below ${activeBand === 'below' ? 'is-active' : ''}`}
        style={{ left: `${pct(centers.below, LO, HI)}%` }}
        title={`Low center: ${Math.round(centers.below)} Hz`}
      />

      <div
        className={`sr-dot above ${activeBand === 'above' ? 'is-active' : ''}`}
        style={{ left: `${pct(centers.above, LO, HI)}%` }}
        title={`High center: ${Math.round(centers.above)} Hz`}
      />

      {/* Optional pins */}
      {Number.isFinite(markerShellHz) && (
        <div
          className="sr-pin shell"
          style={{ left: `${pct(markerShellHz, LO, HI)}%` }}
          title={`Shell fundamental: ${Math.round(markerShellHz)} Hz`}
        />
      )}
      {Number.isFinite(markerHarmHz) && (
        <div
          className="sr-pin harm"
          style={{ left: `${pct(markerHarmHz, LO, HI)}%` }}
          title={`Harmonic target: ${Math.round(markerHarmHz)} Hz`}
        />
      )}

      {playableCaption ? <div className="sr-caption">{playableCaption}</div> : null}
    </div>
  );
}