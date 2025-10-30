import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./DrumstickConsultation.css";
import STICKS from "../data/sticks.data";

/* ──────────────────────────────────────────────────────────
   STEP MODEL
   ────────────────────────────────────────────────────────── */
const STEPS = [
  {
    id: "context",
    title: "Where do you spend most of your drumming time?",
    options: [
      { label: "Live Shows",        key: "live",     desc: "Loud rooms, backline, wedges/IEMs. Needs cut & durability." },
      { label: "Studio Sessions",   key: "studio",   desc: "Controlled rooms. Consistent feel & detail matter." },
      { label: "Practice / Teaching", key: "practice", desc: "Low fatigue for long reps; forgiving rebound." },
      { label: "Acoustic / Jazz",   key: "acoustic", desc: "Dynamic range, finesse, brush-friendly sticks." },
      { label: "Marching / Rudimental", key: "marching", desc: "Extreme rebound and power; big tapers." },
      { label: "Mixed / All-Round", key: "balanced", desc: "Versatility first: the 5A/55A/5B family zone." },
    ],
  },
  {
    id: "feel",
    title: "How should the stick feel in the hand?",
    options: [
      { label: "Fast & Lively",     key: "fast",     desc: "Quick rebound, agile, usually lighter mass & longer taper." },
      { label: "Balanced & Easy",   key: "balanced", desc: "Disappears in the hand. Classic, versatile feel." },
      { label: "Solid & Planted",   key: "solid",    desc: "More weight in the stroke; rear/shorter tapers." },
    ],
  },
  {
    id: "tone",
    title: "Your preferred cymbal/drum character?",
    options: [
      { label: "Bright & Articulate", key: "bright",   desc: "Pingy ride, clear definition (nylon or small bead)." },
      { label: "Balanced & Open",     key: "balanced", desc: "Natural tone, wood tip neutrality." },
      { label: "Warm & Round",        key: "warm",     desc: "Dark, buttery ride. Wood teardrop/acorn." },
    ],
  },
  {
    id: "durability",
    title: "How tough should they be?",
    options: [
      { label: "Light Touch",     key: "light",  desc: "Feel > lifespan (Maple / slim diameters)." },
      { label: "Balanced Life",   key: "medium", desc: "Everyday stage/session use (Hickory mid diameters)." },
      { label: "Hard Hitter",     key: "heavy",  desc: "Rimshot proofing (Oak / denser woods / bigger diameters)." },
    ],
  },
  {
    id: "grip",
    title: "Surface feel preference?",
    options: [
      { label: "Raw/Natural",   key: "raw",    desc: "Traditional, breathable, no coating." },
      { label: "Smooth Lacquer",key: "lacquer",desc: "Polished. Glides under the fingers." },
      { label: "Grip/Matte",    key: "grip",   desc: "Extra control when sweaty or on loud gigs." },
    ],
  },
];

/* Simple inline SVG medal (color uses currentColor) */
function MedalIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      {/* ribbons */}
      <path d="M7 2h4l1 3-3 2-2-5zM13 2h4l-2 5-3-2 1-3z" fill="currentColor" opacity=".9"/>
      {/* medallion */}
      <circle cx="12" cy="16" r="6" fill="currentColor" />
      {/* star emboss */}
      <path d="M12 12.9l.9 1.8 2 .3-1.45 1.42.34 2.02-1.79-.94-1.79.94.34-2.02L9.1 15l2-.3.9-1.8z" fill="rgba(0,0,0,.25)"/>
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────
   DATA HELPERS
   ────────────────────────────────────────────────────────── */
const dur2num = (d) => {
  if (!d) return 3;
  const t = String(d).toLowerCase();
  if (t.includes("very")) return 5;
  if (t.includes("high")) return 4;
  if (t.includes("medium")) return 3;
  if (t.includes("low")) return 2;
  return 3;
};
const weight2num = (w) => {
  if (!w) return 3;
  const t = String(w).toLowerCase();
  if (t.includes("light")) return 2;
  if (t.includes("medium")) return 3;
  if (t.includes("heavy")) return 4;
  return 3;
};
const tipMaterial = (tip = "") => (tip.toLowerCase().includes("nylon") ? "nylon" : "wood");
const balance2pos = (b = "") => {
  const t = b.toLowerCase();
  if (t.includes("front")) return "front";
  if (t.includes("rear")) return "rear";
  return "even";
};
const massIndex = (s) => (Number(s.diameter || 0.565) * Number(s.length || 16.0));
const hasGripFinish = (s) =>
  /(grip|puregrit|vicgrip|doubleglaze|activegrip|dip|vatergrip|rubber)/i.test(
    String(s.grip || s.finish || s.notes || "")
  );

/* ──────────────────────────────────────────────────────────
   SCORING
   ────────────────────────────────────────────────────────── */
function scoreStick(s, answers) {
  let score = 0;

  const W = weight2num(s.weight);
  const D = dur2num(s.durability);
  const tip = tipMaterial(s.tip);
  const bal = balance2pos(s.balance);
  const mass = massIndex(s);

  switch (answers.context) {
    case "live":
      score += (D >= 4 ? 3 : 0) + (W >= 3 ? 1 : 0);
      if (answers.tone !== "warm" && tip === "nylon") score += 1;
      break;
    case "studio":
      if (bal === "even") score += 2;
      if (tip === "wood") score += 1;
      if (mass >= 8.8 && mass <= 9.6) score += 1;
      break;
    case "practice":
      if (W <= 3) score += 1;
      if (bal !== "rear") score += 1;
      break;
    case "acoustic":
      if (tip === "wood") score += 2;
      if (W <= 3) score += 1;
      if (mass < 8.9) score += 1;
      break;
    case "marching":
      if (W >= 4 || s.diameter >= 0.595) score += 3;
      break;
    case "balanced":
      if (bal === "even") score += 2;
      if (mass >= 9.0 && mass <= 9.7) score += 1;
      break;
    default: break;
  }

  if (answers.feel === "fast")      { if (bal === "front") score += 2; if (W === 2) score += 1; }
  if (answers.feel === "balanced")  { if (bal === "even")  score += 2; }
  if (answers.feel === "solid")     { if (bal === "rear")  score += 2; if (W >= 4) score += 1; }

  if (answers.tone === "bright") { if (tip === "nylon") score += 2; }
  if (answers.tone === "warm")   { if (tip === "wood")  score += 2; }

  if (answers.durability === "light")  { if (/maple/i.test(s.material))  score += 2; if (mass < 8.9) score += 1; }
  if (answers.durability === "medium") { if (/hickory/i.test(s.material)) score += 2; }
  if (answers.durability === "heavy")  {
    if (/oak|red hickory/i.test(s.material)) score += 3;
    if (D >= 4) score += 2;
    if (mass >= 9.7) score += 1;
  }

  // Grip/finish weighting
  if (answers.grip === "grip"    && hasGripFinish(s)) score += 6;
  if (answers.grip === "lacquer" && /lacquer|doubleglaze/i.test(String(s.notes || s.grip || ""))) score += 2;

  // Familiar families
  const model = `${s.model}`.toUpperCase();
  if (/(^|[^0-9])5(A|B)\b/.test(model) || /55A/.test(model)) score += 1;

  return score;
}

/* motion */
const stepVariants = { initial: { opacity: 0, y: 14 }, enter: { opacity: 1, y: 0, transition: { duration: 0.28 } }, exit: { opacity: 0, y: -14, transition: { duration: 0.2 } } };
const cardVariants = { initial: { opacity: 0, y: 16, scale: 0.98 }, enter: (i) => ({ opacity: 1, y: 0, scale: 1, transition: { delay: 0.06 * i, duration: 0.28 } }) };

/* ──────────────────────────────────────────────────────────
   COMPONENT
   ────────────────────────────────────────────────────────── */
export default function DrumstickConsultation() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  const onSelect = (value) => {
    const stepId = STEPS[stepIndex].id;
    setAnswers((prev) => ({ ...prev, [stepId]: value }));
    if (stepIndex < STEPS.length - 1) setStepIndex(stepIndex + 1);
    else setShowResults(true);
  };

  const goBack = () => {
    if (showResults) { setShowResults(false); setStepIndex(STEPS.length - 1); return; }
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  const ranked = useMemo(() => {
    if (!showResults) return [];
    return STICKS.map((s) => ({ ...s, _score: scoreStick(s, answers) }))
      .sort((a, b) => b._score - a._score)
      .slice(0, 3);
  }, [answers, showResults]);

  return (
    <section className="oa-stickflow">
      <div className="oa-stickflow__container">
        <div className="oa-stickflow__topbar">
          {stepIndex > 0 || showResults ? (
            <button className="oa-stickflow__back" onClick={goBack} type="button">‹ Back</button>
          ) : <span />}
          <div className="oa-stickflow__dots" aria-hidden>
            {STEPS.map((_, i) => {
              const active = showResults ? i === STEPS.length - 1 : i === stepIndex;
              return <span key={i} className={`dot${active ? " is-active" : ""}`} />;
            })}
          </div>
          <button
            className="oa-stickflow__restart"
            onClick={() => { setStepIndex(0); setShowResults(false); setAnswers({}); }}
            type="button"
          >
            Start Over
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!showResults ? (
            <motion.div key={STEPS[stepIndex].id} variants={stepVariants} initial="initial" animate="enter" exit="exit" className="oa-stickflow__step">
              <h2 className="oa-stickflow__title">{STEPS[stepIndex].title}</h2>
              <div className="oa-stickflow__options">
                {STEPS[stepIndex].options.map((opt) => (
                  <button key={opt.key} className="oa-stickflow__option" onClick={() => onSelect(opt.key)} type="button">
                    <span className="oa-stickflow__label">{opt.label}</span>
                    <span className="oa-stickflow__desc">{opt.desc}</span>
                  </button>
                ))}
              </div>
              <div className="oa-stickflow__progress">Step {stepIndex + 1} of {STEPS.length}</div>
            </motion.div>
          ) : (
            <motion.div key="results" variants={stepVariants} initial="initial" animate="enter" exit="exit" className="oa-stickflow__results">
              <h2>Your Top Picks</h2>
              <p className="oa-stickflow__intro">Based on your answers, here are the three sticks that best match the brief.</p>

              <div className="oa-stickflow__rec-grid">
                {ranked.map((s, i) => (
                  <motion.article
                    key={s.id || `${s.brand}-${s.model}-${i}`}
                    className={`oa-stickflow__rec oa-stickflow__rec--${["gold","silver","bronze"][i]}`}
                    variants={cardVariants}
                    initial="initial"
                    animate="enter"
                    custom={i}
                  >
                    {/* CONSISTENT TITLE BOX — medal above, centered */}
                    <header className="oa-stickflow__rec-head">
                      <span className={`medal medal--${["gold","silver","bronze"][i]}`} aria-hidden="true">
                        <MedalIcon className="medal__icon" />
                      </span>
                      <h3 className="oa-stickflow__rec-title">{s.brand} {s.model}</h3>
                    </header>

                    {/* BODY grows to keep footers aligned */}
                    <div className="oa-stickflow__rec-body">
                      <p className="oa-stickflow__rec-notes">{s.notes || s.feel}</p>
                      <ul className="oa-stickflow__rec-meta">
                        <li><b>Material:</b> {s.material}</li>
                        <li><b>Tip:</b> {s.tip}</li>
                        {s.diameter && <li><b>Ø:</b> {Number(s.diameter).toFixed(3)}"</li>}
                        {s.length &&   <li><b>L:</b> {Number(s.length).toFixed(2)}"</li>}
                        {s.balance &&  <li><b>Balance:</b> {s.balance}</li>}
                        {s.weight &&   <li><b>Weight:</b> {s.weight}</li>}
                        {s.durability && <li><b>Durability:</b> {s.durability}</li>}
                      </ul>
                    </div>

                    {!!s.vendors && (
                      <div className="oa-stickflow__links">
                        {Object.entries(s.vendors).map(([name, url]) => (
                          <a key={name} href={url} target="_blank" rel="noopener noreferrer">{name}</a>
                        ))}
                      </div>
                    )}
                  </motion.article>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}