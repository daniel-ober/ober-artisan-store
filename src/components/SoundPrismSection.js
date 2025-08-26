// src/components/SoundPrismSection.js
import React, { useEffect, useMemo, useState } from 'react';
import { db } from '../firebaseConfig';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import './SoundPrismSection.css';

const DEFAULTS = {
  palette: {
    fundamental: '#00E0B8',
    low: '#06d6a0',
    legacy: '#ffcc00',
    high: '#118ab2',
  },
};

// ---------- helpers ----------
const N = (x, f = null) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : f;
};

const parseSize = (txt = '') => {
  const m = String(txt || '')
    .toLowerCase()
    .match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/);
  return {
    diameterIn: m ? N(m[1], 14) : 14,
    depthIn: m ? N(m[2], 6.5) : 6.5,
  };
};

const splitWoods = (shellTxt = '') => {
  const parts = shellTxt
    .split('+')
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    primary: parts[0] || '',
    secondary: parts[1] || '',
  };
};

/** small musical window around a center */
function bandAround(centerHz, kind) {
  // legacy a little tighter, neighbors a touch wider
  const pct = kind === 'legacy' ? 0.05 : 0.06; // ±5–6%
  return { lo: centerHz * (1 - pct), hi: centerHz * (1 + pct) };
}

/** tiny build-factor nudge (±3% envelope) */
function buildNudge({ hoops = 'die-cast', construction = 'stave', depthIn }) {
  let bias = 1.0;

  // hoops: TF slightly lower, die-cast slightly higher
  const h = String(hoops || '').toLowerCase();
  if (h.includes('triple')) bias *= 0.98;
  else if (h.includes('die')) bias *= 1.02;

  // construction: stave a touch stiffer than thin plies
  const c = String(construction || '').toLowerCase();
  if (c.includes('stave')) bias *= 1.01;
  else if (c.includes('ply')) bias *= 0.995;

  // depth: shallow → slightly higher, deep → slightly lower
  const d = Number(depthIn) || 0;
  if (d >= 7.5) bias *= 0.97;
  else if (d <= 5.5) bias *= 1.015;

  return bias;
}

/**
 * LOCAL MODEL (instant UI, no server needed)
 * - If fundamental < 140 Hz → treat as shell F0: centers at 2.0× / 2.5× / 3.0× (nudged).
 * - Else → treat as head baseline: 0.92× / 1.00× / 1.15× (nudged).
 * - Axis auto-fits all sweet-spots with padding and 20 Hz ticks.
 */
const localPreviewFromInputs = (inputs) => {
  const f = N(inputs?.fundamentalHz, null);
  if (!Number.isFinite(f)) return null;

  const nudge = buildNudge({
    hoops: inputs?.hoops,
    construction: inputs?.construction,
    depthIn: inputs?.depthIn,
  });

  let centers, legacyWhy;
  if (f < 140) {
    // shell mode
    centers = { low: 2.0 * f * nudge, legacy: 2.5 * f * nudge, high: 3.0 * f * nudge };
    legacyWhy = ['legacy centered at 2.5× shell fundamental (nudged for build)'];
  } else {
    // head-baseline mode
    centers = { low: 0.92 * f * nudge, legacy: 1.0 * f * nudge, high: 1.15 * f * nudge };
    legacyWhy = ['legacy anchored to measured head baseline (nudged for build)'];
  }

  const lowR = bandAround(centers.low, 'low');
  const legR = bandAround(centers.legacy, 'legacy');
  const highR = bandAround(centers.high, 'high');

  // playable axis that fully contains sweet-spots (and a touch of air)
  const minBand = Math.min(lowR.lo, legR.lo, highR.lo);
  const maxBand = Math.max(lowR.hi, legR.hi, highR.hi);
  const pad = Math.max(12, (maxBand - minBand) * 0.08);
  const rawLo = Math.max(20, Math.floor((minBand - pad) / 20) * 20);
  const rawHi = Math.ceil((maxBand + pad) / 20) * 20;
  const axis = { loHz: rawLo, hiHz: Math.max(rawLo + 200, rawHi), tickHz: 20 };

  const sweetSpots = [
    { id: 'low', label: 'Low', loHz: lowR.lo, hiHz: lowR.hi },
    { id: 'legacy', label: 'Legacy', loHz: legR.lo, hiHz: legR.hi },
    { id: 'high', label: 'High', loHz: highR.lo, hiHz: highR.hi },
  ];

  // harmonics marker: if shell-mode, show real 2.5×; otherwise legacy center = our “reference”
  const harmonics =
    f < 140
      ? [
          { multiple: 2, hz: 2 * f },
          { multiple: 2.5, hz: 2.5 * f },
          { multiple: 3, hz: 3 * f },
        ]
      : [{ multiple: 2.5, hz: centers.legacy }];

  return {
    axis,
    sweetSpots,
    legacyPrint: { bandId: 'legacy', why: legacyWhy },
    harmonics,
  };
};

// ---------- component ----------
export default function SoundPrismSection({ docId, specs }) {
  const [inputs, setInputs] = useState(null);
  const [computed, setComputed] = useState(null);
  const [status, setStatus] = useState('draft');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // seed from Firestore + specs (size/shell), lock everything but fundamental
  useEffect(() => {
    let alive = true;
    (async () => {
      const { diameterIn, depthIn } = parseSize(specs?.size || '');
      const woods = splitWoods(specs?.shell || '');
      const fGuess = Number(
        String(specs?.fundamentalPitch || '').match(/(\d+(?:\.\d+)?)\s*hz/i)?.[1] || ''
      );

      // read existing soundprism block (if any)
      let existing = {};
      try {
        const snap = await getDoc(doc(db, 'soundlegend_showroom', docId));
        if (snap.exists()) existing = snap.data()?.soundprism || {};
      } catch {
        /* ignore */
      }

      const lockedHoops = (existing.inputs?.hoops || 'die-cast').toLowerCase();

      const initialInputs = {
        fundamentalHz: Number.isFinite(fGuess)
          ? fGuess
          : existing.inputs?.fundamentalHz ?? null,
        diameterIn,
        depthIn,
        hoops: lockedHoops,
        construction: existing.inputs?.construction || 'stave',
        staveCount: existing.inputs?.staveCount ?? null,
        shellThicknessMm: existing.inputs?.shellThicknessMm ?? null,
        woodPrimary: woods.primary,
        woodSecondary: woods.secondary,
        woodSecondaryPercent: existing.inputs?.woodSecondaryPercent ?? null,
        bearingEdges: specs?.bearingEdges || existing.inputs?.bearingEdges || '',
        notes: existing.inputs?.notes || '',
      };

      if (!alive) return;
      setInputs(initialInputs);
      setComputed(existing.computed || null);
      if (existing.status) setStatus(existing.status);
    })();
    return () => {
      alive = false;
    };
  }, [docId, specs]);

  const changeFund = (v) => {
    setInputs((p) => ({ ...p, fundamentalHz: v }));
    // changing the fundamental invalidates any stale server compute
    setComputed(null);
  };

  const saveDraft = async () => {
    if (!inputs?.fundamentalHz) {
      setErr('Fundamental (Hz) is required.');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      await setDoc(
        doc(db, 'soundlegend_showroom', docId),
        {
          soundprism: {
            status: 'draft',
            version: '1.0.0',
            inputs,
            meta: { createdAt: Date.now(), updatedAt: Date.now() },
          },
        },
        { merge: true }
      );
      setStatus('draft');
    } catch (e) {
      setErr(e.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const compute = async () => {
    if (!inputs?.fundamentalHz) {
      setErr('Enter fundamental (Hz) first.');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const fn = httpsCallable(getFunctions(), 'computeSoundPrism');
      const { data } = await fn({ inputs });
      setComputed(data.computed);
      await updateDoc(doc(db, 'soundlegend_showroom', docId), {
        'soundprism.computed': data.computed,
        'soundprism.meta.updatedAt': Date.now(),
        'soundprism.status': 'draft',
      });
    } catch {
      // keep the local preview for UI reliability
      if (!computed) setErr('Compute service not reachable. Showing local preview.');
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    const snapshotSource = computed || localPreviewFromInputs(inputs);
    if (!snapshotSource) {
      setErr('Compute or enter a valid fundamental before publishing.');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const snapshot = {
        serial: docId, // locked to docId
        axis: snapshotSource.axis, // full playable axis for this drum
        sweetSpots: snapshotSource.sweetSpots, // low / legacy / high (inside axis)
        legacyPrint: snapshotSource.legacyPrint, // { bandId, why[] }
        harmonics: snapshotSource.harmonics, // for showroom markers if needed
        palette: DEFAULTS.palette,
        legend: [
          { key: 'fundamental', label: 'Shell Fundamental' },
          { key: 'low', label: 'Low Sweet Spot' },
          { key: 'legacy', label: 'LegacyPrint™' },
          { key: 'high', label: 'High Sweet Spot' },
        ],
        version: '1.0.0',
        publishedAt: Date.now(),
      };
      await updateDoc(doc(db, 'soundlegend_showroom', docId), {
        'soundprism.publishedSnapshot': snapshot,
        'soundprism.status': 'published',
        'soundprism.meta.updatedAt': Date.now(),
      });
      setStatus('published');
    } catch (e) {
      setErr(e.message || 'Publish failed');
    } finally {
      setBusy(false);
    }
  };

  // local preview always reflects the current inputs
  const localPreview = useMemo(
    () => localPreviewFromInputs(inputs),
    [inputs?.fundamentalHz, inputs?.hoops, inputs?.construction, inputs?.depthIn]
  );

  // choose server compute only if its legacy center ≈ local (reflects current inputs)
  const serverLegacy = computed?.sweetSpots?.find((b) => b.id === 'legacy');
  const serverCenter =
    serverLegacy ? (serverLegacy.loHz + serverLegacy.hiHz) / 2 : null;

  const localLegacy = localPreview?.sweetSpots?.find((b) => b.id === 'legacy');
  const localCenter = localLegacy ? (localLegacy.loHz + localLegacy.hiHz) / 2 : null;

  const useServer =
    Number.isFinite(serverCenter) &&
    Number.isFinite(localCenter) &&
    Math.abs(serverCenter - localCenter) < 2; // within 2 Hz

  const activePreview = useServer ? computed : localPreview;

  // marker = the Legacy center of whichever preview is active
  const legacyBand = activePreview?.sweetSpots?.find((b) => b.id === 'legacy');
  const activeCenterHz = legacyBand
    ? (legacyBand.loHz + legacyBand.hiHz) / 2
    : null;

  // ---------- tiny axis renderer inside the card ----------
  const Axis = ({ axis, bands, f }) => {
    if (!axis) return null;
    const pct = (hz) =>
      Math.max(0, Math.min(100, ((hz - axis.loHz) / (axis.hiHz - axis.loHz)) * 100));
    const ticks = Math.floor((axis.hiHz - axis.loHz) / axis.tickHz) + 1;

    return (
      <div className="spx">
        <div className="spx-track" />
        {Array.from({ length: ticks }).map((_, i) => {
          const h = axis.loHz + i * axis.tickHz;
          return (
            <div key={i} className="spx-tick" style={{ left: `${pct(h)}%` }}>
              <div className="spx-tickLine" />
              <div className="spx-tickLabel">{Math.round(h)}</div>
            </div>
          );
        })}
        {Number.isFinite(f) && (
          <div
            className="spx-fund"
            style={{ left: `${pct(f)}%` }}
            title={`Legacy center ~${Math.round(f)} Hz`}
          />
        )}
        {bands?.map((b) => (
          <div
            key={b.id}
            className={`spx-band ${b.id === 'legacy' ? 'legacy' : ''}`}
            style={{
              left: `${pct(b.loHz)}%`,
              width: `${Math.max(0, pct(b.hiHz) - pct(b.loHz))}%`,
            }}
            title={`${b.label}: ${Math.round(b.loHz)}–${Math.round(b.hiHz)} Hz`}
          >
            <span>{b.label}</span>
          </div>
        ))}
      </div>
    );
  };

  if (!inputs) return <div className="spx-card">Loading SoundPRISM…</div>;

  return (
    <div className="spx-card">
      <div className="spx-header">
        <h2>SoundPRISM™</h2>
        <div className={`spx-status ${status}`}>{status}</div>
      </div>

      <div className="spx-grid">
        <div className="spx-form">
          <div className="spx-info">
            <strong>Locked fields.</strong> Size, depth & hoops come from your
            drum’s source of truth in Firestore:
            <code> soundlegend_showroom / {docId} </code> → <code>specs.size</code>{' '}
            (e.g. “14x8”), and <code>soundprism.inputs.hoops</code> (if present).
            Edit them in the <em>SL Vault Artists</em> editor, then reload.
          </div>

          <label>Serial</label>
          <input
            value={docId}
            disabled
            title="Serial is locked to the document ID (soundlegend_showroom/{docId})."
          />

          <div className="spx-row2">
            <div>
              <label>Fundamental (Hz) *</label>
              <input
                type="number"
                step="0.1"
                value={inputs.fundamentalHz ?? ''}
                onChange={(e) => changeFund(N(e.target.value))}
              />
            </div>
            <div>
              <label>
                Diameter (in){' '}
                <span className="spx-i" title="From specs.size in soundlegend_showroom/{docId}.">
                  ⓘ
                </span>
              </label>
              <input type="number" step="0.1" value={inputs.diameterIn ?? ''} disabled />
            </div>
            <div>
              <label>
                Depth (in){' '}
                <span className="spx-i" title="From specs.size in soundlegend_showroom/{docId}.">
                  ⓘ
                </span>
              </label>
              <input type="number" step="0.1" value={inputs.depthIn ?? ''} disabled />
            </div>
            <div>
              <label>
                Hoops{' '}
                <span
                  className="spx-i"
                  title="From soundprism.inputs.hoops in soundlegend_showroom/{docId} (optional)."
                >
                  ⓘ
                </span>
              </label>
              <input value={inputs.hoops || 'die-cast'} disabled />
            </div>
          </div>

          <label>Notes (private)</label>
          <textarea
            rows={3}
            value={inputs.notes || ''}
            onChange={(e) => setInputs((p) => ({ ...p, notes: e.target.value }))}
          />

          {inputs?.fundamentalHz > 140 && (
            <div className="spx-warn">
              This value looks high for a <b>shell fundamental</b>. This field expects
              the shell’s natural frequency (typically <b>60–110 Hz</b>). If you entered
              a head tuning target, divide by ~<b>2.3–2.7</b> and re-enter.
            </div>
          )}

          {err && <div className="spx-err">{err}</div>}

          <div className="spx-actions">
            <button onClick={saveDraft} disabled={busy}>Save Draft</button>
            <button onClick={compute} disabled={busy}>Compute</button>
            <button onClick={publish} disabled={busy || !activePreview}>Publish</button>
          </div>
        </div>

        <div className="spx-preview">
          <h4>Preview</h4>
          {!activePreview ? (
            <div className="spx-empty">Enter fundamental → preview updates instantly.</div>
          ) : (
            <>
              <Axis
                axis={activePreview.axis}
                bands={activePreview.sweetSpots}
                f={activeCenterHz}
              />
              <div className="spx-why">
                <b>LegacyPrint™:</b> {activePreview.legacyPrint?.bandId}
                <ul>
                  {activePreview.legacyPrint?.why?.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}