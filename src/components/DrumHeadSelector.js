import React, { useMemo, useState, useEffect } from "react";
import "./DrumHeadSelector.css";
import HEADS_SNARE from "../data/heads.snare.data";

/* =========================
   PRESETS & INPUT VOCAB
   ========================= */
const PRESETS = [
  { label: "Rock Concert", values: { context: "Live",    intensity: "Heavy",  control: "Dry",      articulation: "Bright/Crack", tuning: "Low" } },
  { label: "Jazz Club",    values: { context: "Live",    intensity: "Soft",   control: "Open",     articulation: "Warm",          tuning: "High" } },
  { label: "Studio / Mix", values: { context: "Studio",  intensity: "Medium", control: "Balanced", articulation: "Neutral",       tuning: "Mid" } },
  { label: "Worship/Pop",  values: { context: "Live",    intensity: "Medium", control: "Balanced", articulation: "Neutral",       tuning: "Mid" } },
  { label: "Practice",     values: { context: "Practice",intensity: "Medium", control: "Balanced", articulation: "Neutral",       tuning: "Mid" } },
];

const CONTEXT      = ["Live", "Studio", "Practice", "Acoustic Session"];
const INTENSITY    = ["Soft", "Medium", "Heavy"];
const CONTROL      = ["Open", "Balanced", "Dry"];
const ARTICULATION = ["Warm", "Neutral", "Bright/Crack"];
const TUNING       = ["Low", "Mid", "High"];

/* ---------- Tooltips ---------- */
const HELP = {
  context:
    "Where you’ll use the snare most. Live favors control & durability; studio favors sensitivity & consistency.",
  intensity:
    "How hard you typically hit. Heavier hitters benefit from 2-ply/dots/dry options for control & durability.",
  control:
    "Overtone control. Open = lively ring; Dry = short/controlled; Balanced splits the difference.",
  articulation:
    "How defined you want the stick attack: Warm (round), Neutral (balanced), Bright/Crack (focused).",
  tuning:
    "Where you tend to tune your snare. Some heads excel low/fat, others sing at mid/high tunings.",
};
const HELP_OPT = {
  Live: "Often louder rooms/PA — controlled, durable heads shine.",
  Studio: "Mics hear everything — consistent coating/sensitivity helps.",
  Practice: "Repetitive work — comfortable feel and durability.",
  "Acoustic Session": "Lower volume, more openness & sensitivity.",

  Soft: "Lighter touch — single-ply/open heads feel great.",
  Medium: "Balanced touch — many heads will work well.",
  Heavy: "Big rimshots/power — prefer 2-ply/dots/dry control.",

  Open: "Lively, musical ring (Ambassador/UV1/Texture Coated).",
  Balanced: "Some control without choking (Powerstroke 3, Genera).",
  Dry: "Short, controlled tail (HD Dry, ST Dry, P77, Focus-X).",

  Warm: "Rounder stick sound; woodier coating & no dots.",
  Neutral: "Middle ground, versatile attack.",
  "Bright/Crack": "Defined center crack; dots/vents/nylon-ish bite.",

  Low: "Fat/short tunings — thicker/2-ply/dry can help.",
  Mid: "Classic backbeat range — most heads live here.",
  High: "Tight/bright — sensitive 1-ply heads excel.",
};

/* =========================
   SMALL UI PIECES
   ========================= */
const Segmented = ({ options, value, onChange }) => (
  <div className="oa-head__seg">
    {options.map((opt) => (
      <button
        key={opt}
        type="button"
        className={`oa-head__seg-btn${value === opt ? " is-active" : ""}`}
        aria-pressed={value === opt}
        data-tip={HELP_OPT[opt]}
        onClick={() => onChange(opt)}
      >
        {opt}
      </button>
    ))}
  </div>
);

const PresetBar = ({ presets, value, onApply }) => (
  <div className="oa-head__presets">
    <span className="oa-head__label" style={{ marginRight: 8 }}>Preset</span>
    {presets.map((p) => (
      <button
        key={p.label}
        type="button"
        className={`oa-head__preset${value === p.label ? " is-active" : ""}`}
        onClick={() => onApply(p)}
      >
        {p.label}
      </button>
    ))}
    <span className="oa-head__preset-sep" />
    <span className="oa-head__preset-hint">Tweaking any control switches to <b>Custom</b>.</span>
  </div>
);

const LabelWithTip = ({ children, tip }) => (
  <label className="oa-head__label">
    {children}
    <span className="oa-head__hint" data-tip={tip} aria-hidden="true" />
  </label>
);

/* =========================
   SCORING (rebalanced to avoid over-picking 2-ply/Emperor)
   ========================= */
const BATTER = HEADS_SNARE.batter;
const RESO   = HEADS_SNARE.reso;

const name = (h) => `${h.brand} ${h.model}`.toLowerCase();
const isAmbassador = (h) => name(h).includes("ambassador") && h.ply === 1;
const isEmperor    = (h) => name(h).includes("emperor") && h.ply === 2;
const isG1         = (h) => name(h).includes("g1");
const isG2         = (h) => name(h).includes("g2");
const isUV1        = (h) => name(h).includes("uv1");
const isUV2        = (h) => name(h).includes("uv2");
const isTexture    = (h) => name(h).includes("texture coated");
const isDryish     = (h) => h.dry_vents === true || String(h.finish).includes("Dry");
const hasRingCtrl  = (h) => Boolean(h.control_ring);

function scoreBatterHeads({ context, intensity, control, articulation, tuning }) {
  return BATTER.map((h) => {
    let s = 0;

    // ---------- Control intent ----------
    if (control === "Open") {
      if (h.ply === 1 && !isDryish(h) && !hasRingCtrl(h) && (!h.dot || h.dot === "None")) s += 6;
      if (isAmbassador(h) || isG1(h) || isUV1(h) || isTexture(h)) s += 2;
      if ((h.dryness ?? 3) <= 2) s += 1;
      // penalties for over-controlled choices under "Open"
      if (h.ply === 2) s -= 3;
      if (isDryish(h) || hasRingCtrl(h) || (h.dot && h.dot !== "None")) s -= 2;
    }
    if (control === "Balanced") {
      // prefer subtle control (PS3/Genera) first, then 2-ply
      if (hasRingCtrl(h)) s += 4;
      if (h.ply === 2) s += 2;
      if ((h.dryness ?? 3) === 3) s += 1;
      if (isG2(h) || isUV2(h)) s += 1;
    }
    if (control === "Dry") {
      if (isDryish(h)) s += 6;
      if (hasRingCtrl(h)) s += 3;
      if (h.dot && h.dot !== "None") s += 2;
      if (h.ply === 2) s += 2;
      if ((h.dryness ?? 3) >= 4) s += 2;
    }

    // ---------- Hit intensity ----------
    if (intensity === "Soft") {
      if (h.ply === 1) s += 3;
      if ((h.mil_total ?? 10) <= 10) s += 2;
      if (h.ply === 2) s -= 2; // curb 2-ply for soft hitters
    }
    if (intensity === "Medium") {
      s += 2;
      if ((h.durability ?? 3) >= 3) s += 1;
    }
    if (intensity === "Heavy") {
      if (h.ply === 2) s += 4;
      if ((h.durability ?? 3) >= 4) s += 2;
      if (h.dot && h.dot !== "None") s += 1;
    }

    // ---------- Context ----------
    if (context === "Live")    s += (h.ply === 2 || hasRingCtrl(h) || isDryish(h)) ? 1 : 0; // smaller than before
    if (context === "Studio")  s += (h.finish?.includes("Coated") ? 1 : 0) + (control !== "Dry" ? 1 : 0) + (h.ply === 2 ? -1 : 0);
    if (context === "Practice") s += (h.ply === 2 || (h.durability ?? 3) >= 4) ? 2 : 0;
    if (context === "Acoustic Session") {
      if (h.ply === 1 && (h.dryness ?? 3) <= 3) s += 2;
      if (h.finish?.includes("Coated")) s += 1;
      if (h.ply === 2) s -= 2;
    }

    // ---------- Articulation ----------
    if (articulation === "Warm") {
      if (h.finish === "Coated" || h.finish === "Textured") s += 2;
      if (!h.dot && !isDryish(h)) s += 1;
      if (h.ply === 2) s -= 1; // slightly less warm
    }
    if (articulation === "Neutral") s += 1;
    if (articulation === "Bright/Crack") {
      if (h.dot && h.dot !== "None") s += 2;
      if (isDryish(h) || hasRingCtrl(h)) s += 1;
      if (h.finish?.includes("Coated-Control") || h.finish === "Coated-Dry") s += 1;
    }

    // ---------- Tuning preference ----------
    if (tuning === "Low") {
      if (h.ply === 2 || hasRingCtrl(h)) s += 3;
      if ((h.tuningRange ?? "").includes("Low")) s += 1;
    }
    if (tuning === "Mid") {
      if ((h.tuningRange ?? "") === "Wide" || (h.tuningRange ?? "").includes("Mid")) s += 2;
    }
    if (tuning === "High") {
      if (h.ply === 1 && (h.mil_total ?? 10) <= 10 && !hasRingCtrl(h) && !isDryish(h)) s += 4;
      if ((h.tuningRange ?? "") === "Wide" || (h.tuningRange ?? "").includes("High")) s += 1;
      if (h.ply === 2) s -= 3; // strong push away from Emperor at high tunings
    }

    // ---------- Popularity nudges (reduced & conditional) ----------
    if (isAmbassador(h) && control !== "Dry") s += 1;
    if (isEmperor(h)    && (control !== "Open")) s += 1; // only when user wants some control
    if (isG1(h) || isUV1(h)) s += 1;
    if (isG2(h) || isUV2(h)) s += 1;

    return { ...h, _score: s };
  }).sort((a, b) => b._score - a._score);
}

function bestResoFor({ tuning }) {
  if (tuning === "High") return RESO.find(r => r.mil_total === 2) || RESO.find(r => r.mil_total === 3) || RESO[0];
  if (tuning === "Low")  return RESO.find(r => r.mil_total === 5) || RESO.find(r => r.mil_total === 3) || RESO[0];
  return RESO.find(r => r.mil_total === 3) || RESO[0];
}

/* =========================
   MAIN COMPONENT
   ========================= */
export default function DrumHeadSelector() {
  const [preset, setPreset] = useState(PRESETS[0].label);

  const [context, setContext]           = useState(PRESETS[0].values.context);
  const [intensity, setIntensity]       = useState(PRESETS[0].values.intensity);
  const [control, setControl]           = useState(PRESETS[0].values.control);
  const [articulation, setArticulation] = useState(PRESETS[0].values.articulation);
  const [tuning, setTuning]             = useState(PRESETS[0].values.tuning);

  useEffect(() => {
    const p = PRESETS.find(x => x.label === preset);
    if (!p) return;
    const same =
      p.values.context      === context &&
      p.values.intensity    === intensity &&
      p.values.control      === control &&
      p.values.articulation === articulation &&
      p.values.tuning       === tuning;
    if (!same && preset !== "Custom") setPreset("Custom");
  }, [context, intensity, control, articulation, tuning]); // eslint-disable-line

  const applyPreset = (p) => {
    setPreset(p.label);
    setContext(p.values.context);
    setIntensity(p.values.intensity);
    setControl(p.values.control);
    setArticulation(p.values.articulation);
    setTuning(p.values.tuning);
  };

  const ranked  = useMemo(
    () => scoreBatterHeads({ context, intensity, control, articulation, tuning }),
    [context, intensity, control, articulation, tuning]
  );
  const resoPick = useMemo(() => bestResoFor({ tuning }), [tuning]);

  const top3 = ranked.slice(0, 3);
  const medalClass = ["gold", "silver", "bronze"];

  return (
    <section className="oa-head oa-head--fullbleed" aria-label="Ober Snare Head Selector">
      <div className="oa-head__container">
        {/* Header */}
        <header className="oa-head__header">
          <h1 className="oa-head__title">Snare Head Selector</h1>
          <p className="oa-head__subtitle">
            Describe your playing style and we’ll recommend an Ober-curated Top 3 batter heads with a matching reso.
          </p>
        </header>

        {/* Presets */}
        <div className="oa-head__panel oa-head__panel--presets">
          <PresetBar presets={PRESETS} value={preset} onApply={applyPreset} />
        </div>

        {/* Controls */}
        <div className="oa-head__panel">
          <div className="oa-head__grid oa-head__grid--5">
            <div className="oa-head__field">
              <LabelWithTip tip={HELP.context}>Playing Context</LabelWithTip>
              <Segmented options={CONTEXT} value={context} onChange={setContext} />
            </div>

            <div className="oa-head__field">
              <LabelWithTip tip={HELP.intensity}>Hit Intensity</LabelWithTip>
              <Segmented options={INTENSITY} value={intensity} onChange={setIntensity} />
            </div>

            <div className="oa-head__field">
              <LabelWithTip tip={HELP.control}>Overtone Control</LabelWithTip>
              <Segmented options={CONTROL} value={control} onChange={setControl} />
            </div>

            <div className="oa-head__field">
              <LabelWithTip tip={HELP.articulation}>Articulation</LabelWithTip>
              <Segmented options={ARTICULATION} value={articulation} onChange={setArticulation} />
            </div>

            <div className="oa-head__field">
              <LabelWithTip tip={HELP.tuning}>Tuning Preference</LabelWithTip>
              <Segmented options={TUNING} value={tuning} onChange={setTuning} />
            </div>
          </div>
        </div>

        {/* Results */}
        <section className="oa-head__section">
          <h3 className="oa-head__section-title">Ober Top 3 Picks</h3>
          <div className="oa-head__rec-grid">
            {top3.map((h, idx) => (
              <article key={h.id} className={`oa-head__rec oa-head__rec--${medalClass[idx]}`}>
                <div className="oa-head__rec-head">
                  <span className={`oa-head__medal oa-head__medal--${medalClass[idx]}`}>
                    {["Gold", "Silver", "Bronze"][idx]}
                  </span>
                  <h4 className="oa-head__rec-title">{h.brand} {h.model}</h4>
                </div>

                <div className="oa-head__meta">
                  {h.finish} • {h.ply}-ply • {h.mil_total}mil • {h.tuningRange || "—"}
                  {h.dot && h.dot !== "None" ? ` • ${h.dot} dot` : ""}{hasRingCtrl(h) ? " • Control ring" : ""}{h.dry_vents ? " • Dry vents" : ""}
                </div>

                <ul className="oa-head__bullets">
                  <li><b>Feel:</b> {h.feel}</li>
                  <li><b>Vibe:</b> {h.vibe}</li>
                  <li><b>Control:</b> {(h.dryness ?? 3)} / 5 dryness • {(h.durability ?? 3)} / 5 durability</li>
                  <li><b>Why we like it:</b> {h.notes}</li>
                  <li><b>Pair with (reso):</b> {resoPick.brand} {resoPick.model} ({resoPick.mil_total}mil hazy)</li>
                </ul>

                <div className="oa-head__vendors">
                  {Object.entries(h.vendors || {}).map(([name, url]) => (
                    <a key={name} className="oa-head__vendor" href={url} target="_blank" rel="noopener noreferrer">
                      {name}
                    </a>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="oa-head__partners">
            Interested in joining the <b>Ober DrumSelector Tool Program</b>?{" "}
            <a href="mailto:partners@oberartisandrums.com">partners@oberartisandrums.com</a>
          </div>
        </section>

        {/* Education */}
        <section className="oa-head__section oa-head__edu">
          <h3 className="oa-head__section-title">How to Choose a Snare Head</h3>
          <div className="oa-head__edu-grid">
            <div className="oa-head__edu-card">
              <h4>Open vs. Controlled</h4>
              <p>1-ply coated (10mil) is open and sensitive. Rings/vents/dots shorten decay and focus the hit.</p>
            </div>
            <div className="oa-head__edu-card">
              <h4>Dots & Dry Vents</h4>
              <p>Center dots add attack/durability. Micro-vents and internal rings make the head “mix-ready.”</p>
            </div>
            <div className="oa-head__edu-card">
              <h4>2-ply & Specialty</h4>
              <p>2-ply adds fatness and durability for live/heavy hitters. Specialty (P77, HD Dry) = shortest tail.</p>
            </div>
            <div className="oa-head__edu-card">
              <h4>Resonant (Bottom) Heads</h4>
              <p>2mil = airy & crisp; 3mil = standard & versatile; 5mil = reduces buzz, adds body at low tunings.</p>
            </div>
            <div className="oa-head__edu-card">
              <h4>Tuning Range</h4>
              <p>Choose heads that behave well at your usual pitch. Open 1-ply for high; controlled 2-ply/dry for low.</p>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}