import React, { useEffect, useMemo, useRef, useState } from 'react';
import './ResinAccentGenerator.css';

// If you already export initialized db/storage elsewhere, import here.
// This component does not require them directly; it gives you two
// save options: device download and (optional) Firestore/Storage.
// Hook your Firebase save routine where indicated below.
// Works with Vite (import.meta.env) and CRA (process.env.REACT_APP_*)
const API_URL = 'http://127.0.0.1:5001/danoberartisandrums/us-central1/api/resin/generate';
const QUALITY_PRESETS = [
  { id: 'regular', label: 'Regular', size: 1024 },
  { id: 'high', label: 'High', size: 1536 },      // screenshot-2 level
  { id: 'ultra', label: 'Super-HD', size: 2048 }, // bump if GPUs allow
];

const INTENSITY_PRESETS = [
  { id: 'light', label: 'Light', coverage: 0.25 },
  { id: 'medium', label: 'Medium', coverage: 0.45 }, // default
  { id: 'heavy', label: 'Heavy', coverage: 0.65 },
];

const defaultParams = {
  hex: '#1aa7ff',
  intensity: 'medium',
  quality: 'high',
  nameHint: '',
};

export default function ResinAccentGenerator() {
  const [veneerFile, setVeneerFile] = useState(null);
  const [veneerPreview, setVeneerPreview] = useState('');
  const [params, setParams] = useState(defaultParams);
  const [status, setStatus] = useState('idle'); // idle|running|success|error|canceled
  const [message, setMessage] = useState('');
  const [resultDataUrl, setResultDataUrl] = useState('');
  const [jobId, setJobId] = useState('');
  const abortRef = useRef(null);

  const eyedropperSupported =
    typeof window !== 'undefined' && 'EyeDropper' in window;

  useEffect(() => {
    if (!veneerFile) { setVeneerPreview(''); return; }
    const reader = new FileReader();
    reader.onload = (e) => setVeneerPreview(e.target.result);
    reader.readAsDataURL(veneerFile);
  }, [veneerFile]);

  const quality = useMemo(
    () => QUALITY_PRESETS.find((q) => q.id === params.quality),
    [params.quality]
  );
  const intensity = useMemo(
    () => INTENSITY_PRESETS.find((i) => i.id === params.intensity),
    [params.intensity]
  );

  const onPickFromScreen = async () => {
    if (!eyedropperSupported) return;
    try {
      const ed = new window.EyeDropper();
      const result = await ed.open();
      setParams((p) => ({ ...p, hex: result.sRGBHex }));
    } catch {
      // user canceled
    }
  };

  const onGenerate = async () => {
    if (!veneerPreview) {
      setMessage('Please upload a veneer image first.');
      return;
    }
    setStatus('running');
    setMessage('Generating… feel free to cancel anytime.');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          veneerDataUrl: veneerPreview,
          hex: params.hex,
          intensity: intensity.id,
          coverage: intensity.coverage,
          size: quality.size,
          quality: quality.id,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Generation failed (${res.status})`);
      }
      const payload = await res.json();
      setJobId(payload.jobId || '');
      setResultDataUrl(payload.resultDataUrl || '');
      setStatus('success');
      setMessage('Image generated successfully.');
    } catch (e) {
      if (controller.signal.aborted) {
        setStatus('canceled');
        setMessage('Canceled.');
      } else {
        setStatus('error');
        setMessage(e.message || 'Generation failed.');
      }
    } finally {
      abortRef.current = null;
    }
  };

  const onCancel = () => abortRef.current?.abort();

  const onDownload = () => {
    if (!resultDataUrl) return;
    const a = document.createElement('a');
    a.href = resultDataUrl;
    a.download = `${(params.nameHint || 'resin-accent').trim()}.png`;
    a.click();
  };

  // OPTIONAL: If you want Firestore/Storage saving here, drop your
  // existing save routine inside this handler:
  const onSaveToFirebase = async () => {
    alert(
      'Hook your Firebase save routine here (Storage upload + Firestore doc).\n\nWe pass:\n- jobId\n- resultDataUrl (PNG data URL)\n- options (hex, intensity, coverage, quality, size, nameHint)'
    );
    // Example shape you can persist:
    // { jobId, downloadURL, storagePath, options: { hex, intensity, coverage, quality, size, nameHint } }
  };

  const suggestedTweaks = [
    { label: 'More subtle', apply: () => setParams((p) => ({ ...p, intensity: 'light' })) },
    { label: 'Bolder fill', apply: () => setParams((p) => ({ ...p, intensity: 'heavy' })) },
    { label: 'Cooler hue -10°', apply: () => setParams((p) => ({ ...p, hex: shiftHue(p.hex, -10) })) },
    { label: 'Warmer hue +10°', apply: () => setParams((p) => ({ ...p, hex: shiftHue(p.hex, +10) })) },
  ];

  return (
    <div className="resin-tool">
      <header className="rt-header">
        <h1>Resin Accent Generator</h1>
        <p>Upload veneer, pick color, set intensity & quality, then generate.</p>
      </header>

      <section className="rt-grid">
        <div className="rt-panel">
          <h3>1) Veneer Image</h3>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setVeneerFile(e.target.files?.[0] || null)}
          />
          {veneerPreview && (
            <div className="preview">
              <img src={veneerPreview} alt="Veneer preview" />
            </div>
          )}
        </div>

        <div className="rt-panel">
          <h3>2) Resin Color</h3>
          <div className="color-row">
            <input
              type="color"
              value={params.hex}
              onChange={(e) => setParams((p) => ({ ...p, hex: e.target.value }))}
              aria-label="Resin color"
            />
            <input
              className="hex-input"
              value={params.hex}
              onChange={(e) => setParams((p) => ({ ...p, hex: normalizeHex(e.target.value) }))}
              aria-label="Hex"
            />
            <button
              className="eyedrop"
              disabled={!eyedropperSupported}
              onClick={onPickFromScreen}
              title="Pick from screen"
            >
              🩸 Pick
            </button>
          </div>

          <h3>3) Intensity</h3>
          <div className="segmented">
            {INTENSITY_PRESETS.map((opt) => (
              <button
                key={opt.id}
                className={opt.id === params.intensity ? 'on' : ''}
                onClick={() => setParams((p) => ({ ...p, intensity: opt.id }))}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <h3>4) Quality</h3>
          <div className="segmented">
            {QUALITY_PRESETS.map((opt) => (
              <button
                key={opt.id}
                className={opt.id === params.quality ? 'on' : ''}
                onClick={() => setParams((p) => ({ ...p, quality: opt.id }))}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <label className="namehint">
            Save name (optional):
            <input
              placeholder="Customer / Color / Species"
              value={params.nameHint}
              onChange={(e) => setParams((p) => ({ ...p, nameHint: e.target.value }))}
            />
          </label>

          <div className="cta-row">
            <button className="primary" onClick={onGenerate} disabled={status === 'running'}>
              Generate
            </button>
            <button onClick={onCancel} disabled={status !== 'running'}>Cancel</button>
          </div>

          <div className={`status ${status}`}>
            {status === 'running' && <span className="spinner" />}
            <span>{message}</span>
          </div>
        </div>

        <div className="rt-panel">
          <h3>Result</h3>
          {!resultDataUrl && <div className="result-empty">No image yet.</div>}
          {resultDataUrl && (
            <>
              <div className="result">
                <img src={resultDataUrl} alt="Generated" />
              </div>
              <div className="actions">
                <button onClick={onDownload}>Save to Device</button>
                <button onClick={onSaveToFirebase}>Save to Firestore</button>
                <button onClick={onGenerate}>Regenerate</button>
              </div>
              <div className="tweaks">
                <span>Suggested refinements:</span>
                {suggestedTweaks.map((t) => (
                  <button key={t.label} onClick={t.apply}>{t.label}</button>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

/* ---------- small helpers ---------- */
function normalizeHex(v) {
  let s = (v || '').trim();
  if (!s.startsWith('#')) s = '#' + s;
  if (/^#([0-9A-Fa-f]{6})$/.test(s)) return s;
  return '#000000';
}
function hexToRgb(hex) {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}
function rgbToHex(r, g, b) {
  const to = (n) => n.toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}
function rgbToHsl(r, g, b) {
  r/=255; g/=255; b/=255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max+min)/2;
  if (max===min) { h=0; s=0; } else {
    const d = max - min; s = l>0.5 ? d/(2-max-min) : d/(max+min);
    switch(max){
      case r: h = (g-b)/d + (g<b?6:0); break;
      case g: h = (b-r)/d + 2; break;
      case b: h = (r-g)/d + 4; break;
      default: h = 0;
    } h*=60;
  }
  return [h,s,l];
}
function hslToRgb(h, s, l) {
  const C = (1 - Math.abs(2*l - 1)) * s;
  const X = C * (1 - Math.abs((h/60)%2 - 1));
  const m = l - C/2;
  let r1=0,g1=0,b1=0;
  if (0<=h && h<60){ r1=C; g1=X; }
  else if (60<=h && h<120){ r1=X; g1=C; }
  else if (120<=h && h<180){ g1=C; b1=X; }
  else if (180<=h && h<240){ g1=X; b1=C; }
  else if (240<=h && h<300){ r1=X; b1=C; }
  else { r1=C; b1=X; }
  return { r: Math.round((r1+m)*255), g: Math.round((g1+m)*255), b: Math.round((b1+m)*255) };
}
function shiftHue(hex, deg) {
  const { r, g, b } = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  let nh = (h + deg) % 360; if (nh < 0) nh += 360;
  const { r: nr, g: ng, b: nb } = hslToRgb(nh, s, l);
  return rgbToHex(nr, ng, nb);
}