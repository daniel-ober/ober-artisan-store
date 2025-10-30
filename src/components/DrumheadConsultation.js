import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './DrumheadConsultation.css';

// data
import HEADS_SNARE from '../data/heads.snare.data';
import HEADS_TOMS from '../data/heads.toms.data';
import HEADS_BASS from '../data/heads.bass.data';

/* -------------------- Catalog wiring -------------------- */
const CATALOG = {
  snare: {
    batter: HEADS_SNARE?.batter || [],
    reso: HEADS_SNARE?.reso || [],
  },
  rack: {
    batter: HEADS_TOMS?.batter || [],
    reso: HEADS_TOMS?.reso || [],
  },
  floor: {
    batter: HEADS_TOMS?.batter || [],
    reso: HEADS_TOMS?.reso || [],
  },
  bass: {
    batter: HEADS_BASS?.batter || [],
    reso: HEADS_BASS?.reso || [],
  },
};

const uniq = (arr) => [...new Set(arr)];
const brandListFor = (drum) =>
  uniq((CATALOG[drum]?.batter || []).map((h) => h.brand)).sort();
const modelsForBrand = (drum, brand) =>
  (CATALOG[drum]?.batter || []).filter((h) => h.brand === brand);

/* -------------------- Step definitions -------------------- */
const STEP_DRUMTYPE = {
  id: 'drumType',
  title: 'Which drum are we choosing a head for?',
  options: [
    { label: 'Snare Drum', key: 'snare', desc: 'Articulation, crack, sensitivity.' },
    { label: 'Bass Drum', key: 'bass', desc: 'Punch, weight, feel under the beater.' },
    { label: 'Floor Tom', key: 'floor', desc: 'Low end, sustain vs. control.' },
    { label: 'Rack Tom', key: 'rack', desc: 'Attack clarity, tone shape, sustain.' },
  ],
};

const STEP_SIDE = {
  id: 'side',
  title: 'Which side of the drum?',
  options: [
    { label: 'Batter (Top / Played)', key: 'batter', desc: 'Struck side (feel, attack, durability).' },
    { label: 'Resonant (Bottom)', key: 'reso', desc: 'Response side (sustain, snare wire/bottom response).' },
  ],
};

// Batter path
const STEP_CONTEXT = {
  id: 'context',
  title: 'Where do you spend most of your playing time?',
  options: [
    { label: 'Live Shows / Rock / Pop', key: 'live', desc: 'Cut & projection with some control.' },
    { label: 'Studio / Recording', key: 'studio', desc: 'Consistency, detail, mix-friendly tone.' },
    { label: 'Jazz / Fusion', key: 'jazz', desc: 'Articulation & sensitivity across dynamics.' },
    { label: 'Marching / Rudimental', key: 'marching', desc: 'High tension, short sustain, focused.' },
    { label: 'Worship / Indie', key: 'worship', desc: 'Warmth, controlled overtones, smooth feel.' },
  ],
};

const STEP_TONE = {
  id: 'tone',
  title: 'What tone are you chasing?',
  options: [
    { label: 'Open / Singing', key: 'open', desc: 'Air, ring, long sustain.' },
    { label: 'Balanced / Controlled', key: 'balanced', desc: 'Shape the ring without choking it.' },
    { label: 'Warm / Focused', key: 'warm', desc: 'Shorter decay, dry/‘mix-ready’.' },
  ],
};

const STEP_FEEL = {
  id: 'feel',
  title: 'How should it feel under the stick/beater?',
  options: [
    { label: 'Fast & Lively', key: 'fast', desc: 'Quick rebound, brighter attack.' },
    { label: 'Balanced & Natural', key: 'balanced', desc: 'Familiar, responsive.' },
    { label: 'Solid & Damp', key: 'solid', desc: 'Heft, thud, less bounce.' },
  ],
};

const STEP_DURABILITY = {
  id: 'durability',
  title: 'How hard do you tend to play?',
  options: [
    { label: 'Light Touch', key: 'light', desc: 'Finesse first; longevity is secondary.' },
    { label: 'Regular Use', key: 'medium', desc: 'Gigging/writing/practice balance.' },
    { label: 'Heavy Hitter', key: 'heavy', desc: 'Rimshots/touring/high volume.' },
  ],
};

const STEP_SURFACE = {
  id: 'surface',
  title: 'Surface preference?',
  options: [
    { label: 'Coated', key: 'coated', desc: 'Warmer top end; brushes on snare; tames highs.' },
    { label: 'Clear', key: 'clear', desc: 'Brighter, more attack & projection.' },
    { label: 'Frosted / Textured', key: 'frosted', desc: 'Attack with a bit of warmth.' },
    { label: 'Hydraulic / Oil', key: 'hydraulic', desc: 'Very controlled, short sustain (toms/bass).' },
  ],
};

// Reso path (brand → model → prefs)
const make_STEP_BATTER_BRAND = (answers) => {
  const brands = brandListFor(answers.drumType || 'snare');
  return {
    id: 'batterBrand',
    title: 'Which batter head brand are you pairing with?',
    options: brands.map((b) => ({ label: b, key: b, desc: 'Filter next step to this brand’s models.' })),
  };
};

const make_STEP_BATTER_MODEL = (answers) => {
  const drum = answers.drumType || 'snare';
  const brand = answers.batterBrand;
  const models = brand ? modelsForBrand(drum, brand) : [];
  return {
    id: 'batterModelId',
    title: 'Which batter head model are you pairing with?',
    options: models.map((h) => ({
      key: h.id,
      label: `${h.brand} ${h.model}`,
      desc: `ply ${h.ply ?? '?'}, ${h.finish || '—'}`,
    })),
  };
};

const STEP_RESO_TONE = {
  id: 'resoTone',
  title: 'What character do you want from the resonant side?',
  options: [
    { label: 'Max sensitivity / crisp', key: 'crisp', desc: 'Airy response, lively snares.' },
    { label: 'Balanced sustain', key: 'balanced', desc: 'Even response & decay.' },
    { label: 'Tamed / buzz control', key: 'tamed', desc: 'A bit thicker to reduce buzz.' },
  ],
};

const STEP_RESO_CONTEXT = {
  id: 'resoContext',
  title: 'Where will this snare mostly live?',
  options: [
    { label: 'Studio / Sensitive', key: 'studio', desc: 'Crisp articulation, detailed ghost notes.' },
    { label: 'Live / Mixed', key: 'live', desc: 'A touch of control, less sympathetic buzz.' },
  ],
};

/* -------------------- Step builder -------------------- */
function buildSteps(answers) {
  const steps = [STEP_DRUMTYPE, STEP_SIDE];

  if (answers.side === 'reso') {
    steps.push(make_STEP_BATTER_BRAND(answers));
    if (answers.batterBrand) steps.push(make_STEP_BATTER_MODEL(answers));
    steps.push(STEP_RESO_TONE, STEP_RESO_CONTEXT);
  } else if (answers.side === 'batter') {
    steps.push(STEP_CONTEXT, STEP_TONE, STEP_FEEL, STEP_DURABILITY, STEP_SURFACE);
  }
  return steps;
}

/* -------------------- Scoring + filtering -------------------- */
const isCoatedLike = (h) =>
  /coated|texture|frost(ed)?|etch(ed)?/i.test(String(h.finish || ''));
const isClearLike = (h) =>
  /clear/i.test(String(h.finish || '')) && !/coated|frost|hazy/i.test(String(h.finish || ''));
const isHydraulic = (h) =>
  /hydraulic|oil/i.test(`${h.finish || ''} ${h.model || ''} ${h.notes || ''}`);
const isHazy = (h) => /hazy/i.test(String(h.finish || ''));
const drynessVal = (h) => Number(h.dryness ?? 3);
const durabilityVal = (h) => Number(h.durability ?? 3);
const plyVal = (h) => Number(h.ply ?? 1);
const mil = (h) => Number(h.mil_total ?? (plyVal(h) === 2 ? 14 : 10));
const hasDot = (h) => h.dot && h.dot !== 'None';
const hasRing = (h) => !!h.control_ring;
const hasVents = (h) => !!h.dry_vents;

// Strict filter for batter surface
function surfacePass(h, a) {
  if (a.side !== 'batter' || !a.surface) return true;
  const finish = String(h.finish || '');
  switch (a.surface) {
    case 'coated':
      return isCoatedLike(h) && !isClearLike(h);
    case 'clear':
      return isClearLike(h);
    case 'frosted':
      return /frost|texture|etch/i.test(finish);
    case 'hydraulic':
      return isHydraulic(h);
    default:
      return true;
  }
}

// If no true hydraulic options exist, allow closest pre-damped equivalents
function hydraulicFallbackPass(h) {
  const finish = String(h.finish || '');
  const model = String(h.model || '');
  return (
    isHydraulic(h) ||
    hasRing(h) ||
    /coated-control|control/i.test(finish) ||
    /pinstripe|ec2|super[- ]?kick|focus[- ]?x|studio[- ]?x/i.test(`${finish} ${model}`)
  );
}

function scoreHead(h, a) {
  let s = 0;
  const side = a.side;
  const drum = a.drumType || 'snare';
  const dry = drynessVal(h);
  const dur = durabilityVal(h);
  const ply = plyVal(h);
  const mm = mil(h);

  if (side === 'reso') {
    if (drum === 'snare') {
      if (isHazy(h)) s += 3;
      if (mm <= 3) s += 2;
      if (mm === 2 || mm === 3) s += 1;
      if (!hasDot(h) && !hasRing(h) && !hasVents(h)) s += 1;

      if (a.batterModelId) {
        const batter = ((CATALOG[drum] || CATALOG.snare).batter || []).find((x) => x.id === a.batterModelId);
        if (batter) {
          if (plyVal(batter) === 1 && mm <= 3) s += 1;
          if (plyVal(batter) >= 2 && mm >= 3) s += 1;
        }
      }

      if (a.resoTone === 'crisp' && mm <= 3) s += 2;
      if (a.resoTone === 'tamed' && mm >= 5) s += 2;
      if (a.resoContext === 'live' && mm >= 3) s += 1;
    }
  } else {
    if (drum === 'snare') {
      if (a.tone === 'open' && ply === 1 && dry <= 3) s += 3;
      if (a.tone === 'balanced' && (ply === 2 || hasRing(h)) && dry === 3) s += 2;
      if (a.tone === 'warm' && (hasVents(h) || hasDot(h) || hasRing(h) || dry >= 4)) s += 3;

      if (a.durability === 'heavy') {
        if (ply === 2) s += 3;
        if (dur >= 4) s += 2;
        if (hasDot(h)) s += 1;
      }
      if (a.durability === 'light') {
        if (ply === 1 && mm <= 10) s += 2;
      }

      if (a.feel === 'fast' && ply === 1 && mm <= 10) s += 2;
      if (a.feel === 'solid' && (ply === 2 || hasRing(h) || hasVents(h))) s += 2;

      if (a.surface === 'coated' && isCoatedLike(h)) s += 2;
      if (a.surface === 'clear' && isClearLike(h)) s += 2;
      if (a.surface === 'frosted' && /frost|etch|texture/i.test(String(h.finish || ''))) s += 2;
      if (a.surface === 'hydraulic' && isHydraulic(h)) s += 3;

      if (a.context === 'live') {
        if (dur >= 4) s += 2;
        if (a.tone !== 'open' && (hasVents(h) || hasRing(h) || hasDot(h))) s += 1;
      }
      if (a.context === 'studio') {
        if (isCoatedLike(h)) s += 1;
        if (a.tone !== 'warm' && dry <= 4) s += 1;
      }
      if (a.context === 'jazz') {
        if (ply === 1 && isCoatedLike(h) && mm <= 10) s += 3;
      }
      if (a.context === 'worship') {
        if (a.tone !== 'open') s += 1;
        if (ply === 2 || hasRing(h) || dry >= 4) s += 1;
      }
      if (a.context === 'marching') {
        if (ply === 2 || dur >= 4 || hasDot(h)) s += 2;
      }
    }
  }

  if (String(h.tuningRange || '').toLowerCase().includes('wide')) s += 1;
  return s;
}

/* -------------------- Motion -------------------- */
const stepVariants = {
  initial: { opacity: 0, y: 14 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.28 } },
  exit: { opacity: 0, y: -14, transition: { duration: 0.2 } },
};
const cardVariants = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  enter: (i) => ({ opacity: 1, y: 0, scale: 1, transition: { delay: 0.06 * i, duration: 0.28 } }),
};

/* -------------------- Medal Icon -------------------- */
function MedalIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 2h4l1 3-3 2-2-5zM13 2h4l-2 5-3-2 1-3z" fill="currentColor" opacity=".9" />
      <circle cx="12" cy="16" r="6" fill="currentColor" />
      <path d="M12 12.9l.9 1.8 2 .3-1.45 1.42.34 2.02-1.79-.94-1.79.94.34-2.02L9.1 15l2-.3.9-1.8z" fill="rgba(0,0,0,.25)" />
    </svg>
  );
}

/* -------------------- Component -------------------- */
export default function DrumheadConsultation() {
  const [answers, setAnswers] = useState({});
  const [stepIndex, setStepIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const steps = useMemo(() => buildSteps(answers), [answers]);

  useEffect(() => {
    if (stepIndex > steps.length - 1) {
      setStepIndex(Math.max(steps.length - 1, 0));
    }
  }, [steps, stepIndex]);

  const onSelect = (value) => {
    const stepId = steps[stepIndex].id;

    setAnswers((prev) => {
      const next = { ...prev, [stepId]: value };
      if (stepId === 'batterBrand') delete next.batterModelId;
      return next;
    });

    const nextSteps = buildSteps({ ...answers, [stepId]: value });
    const lastIdx = nextSteps.length - 1;
    if (stepIndex < lastIdx) setStepIndex(stepIndex + 1);
    else setShowResults(true);
  };

  const goBack = () => {
    if (showResults) {
      setShowResults(false);
      setStepIndex(Math.max(steps.length - 1, 0));
      return;
    }
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  const drum = answers.drumType || 'snare';
  const side = answers.side || 'batter';

  const dataset = useMemo(() => {
    const cat = CATALOG[drum] || CATALOG.snare;
    return side === 'reso' ? cat.reso : cat.batter;
  }, [drum, side]);

  const ranked = useMemo(() => {
    if (!showResults) return [];

    // strict surface filter first
    let filtered = (dataset || []).filter((h) => surfacePass(h, answers));

    // smart fallback for Hydraulic when none exist in this drum/side
    if (
      answers.side === 'batter' &&
      answers.surface === 'hydraulic' &&
      filtered.length === 0
    ) {
      filtered = (dataset || []).filter(hydraulicFallbackPass);
    }

    return filtered
      .map((h) => ({ ...h, _score: scoreHead(h, answers) }))
      .sort((a, b) => b._score - a._score)
      .slice(0, 3);
  }, [dataset, answers, showResults]);

  const hasData = dataset && dataset.length > 0;

  return (
    <section className="oa-headflow">
      <div className="oa-headflow__container">
        <div className="oa-headflow__topbar">
          {(stepIndex > 0 || showResults) ? (
            <button className="oa-headflow__back" onClick={goBack} type="button">
              ‹ Back
            </button>
          ) : (
            <span />
          )}
          <div className="oa-headflow__dots" aria-hidden>
            {steps.map((_, i) => {
              const active = showResults ? i === steps.length - 1 : i === stepIndex;
              return <span key={i} className={`dot${active ? ' is-active' : ''}`} />;
            })}
          </div>
          <button
            className="oa-headflow__restart"
            onClick={() => {
              setStepIndex(0);
              setShowResults(false);
              setAnswers({});
            }}
            type="button"
          >
            Start Over
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!showResults ? (
            <motion.div
              key={steps[stepIndex].id}
              variants={stepVariants}
              initial="initial"
              animate="enter"
              exit="exit"
              className="oa-headflow__step"
            >
              <h2 className="oa-headflow__title">{steps[stepIndex].title}</h2>
              <div className="oa-headflow__options">
                {steps[stepIndex].options.map((opt) => (
                  <button
                    key={opt.key}
                    className="oa-headflow__option"
                    onClick={() => onSelect(opt.key)}
                    type="button"
                  >
                    <span className="oa-headflow__label">{opt.label}</span>
                    {opt.desc ? <span className="oa-headflow__desc">{opt.desc}</span> : null}
                  </button>
                ))}
              </div>
              <div className="oa-headflow__progress">Step {stepIndex + 1} of {steps.length}</div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              variants={stepVariants}
              initial="initial"
              animate="enter"
              exit="exit"
              className="oa-headflow__results"
            >
              <h2>Your Top Picks</h2>
              <p className="oa-headflow__intro">
                {hasData
                  ? 'Based on your answers, here are the heads that best match the brief.'
                  : 'Heads for this drum/side aren’t loaded yet. Add a catalog to see ranked picks.'}
              </p>

              {hasData ? (
                <div className="oa-headflow__rec-grid">
                  {ranked.map((h, i) => (
                    <motion.article
                      key={h.id || `${h.brand}-${h.model}-${i}`}
                      className={`oa-headflow__rec oa-headflow__rec--${['gold', 'silver', 'bronze'][i]}`}
                      variants={cardVariants}
                      initial="initial"
                      animate="enter"
                      custom={i}
                    >
                      <header className="oa-headflow__rec-head">
                        <span className={`medal medal--${['gold', 'silver', 'bronze'][i]}`} aria-hidden="true">
                          <MedalIcon className="medal__icon" />
                        </span>
                        <h3 className="oa-headflow__rec-title">
                          {h.brand} {h.model}
                        </h3>
                      </header>

                      <div className="oa-headflow__rec-body">
                        <p className="oa-headflow__rec-notes">{h.notes || h.vibe || h.feel}</p>
                        <ul className="oa-headflow__rec-meta">
                          {h.finish && <li><b>Finish:</b> {h.finish}</li>}
                          {h.ply && <li><b>Ply:</b> {h.ply}-ply</li>}
                          {h.mil_total && <li><b>Total Thickness:</b> {h.mil_total} mil</li>}
                          {h.dot && h.dot !== 'None' && <li><b>Dot:</b> {h.dot}</li>}
                          {h.control_ring && <li><b>Control Ring:</b> Yes</li>}
                          {h.dry_vents && <li><b>Dry Vents:</b> Yes</li>}
                          {h.dryness && <li><b>Dryness:</b> {h.dryness} / 5</li>}
                          {h.durability && <li><b>Durability:</b> {h.durability} / 5</li>}
                          {h.tuningRange && <li><b>Tuning:</b> {h.tuningRange}</li>}
                        </ul>
                      </div>

                      {!!h.vendors && (
                        <div className="oa-headflow__links">
                          {Object.entries(h.vendors).map(([name, url]) => (
                            <a key={name} href={url} target="_blank" rel="noopener noreferrer">
                              {name}
                            </a>
                          ))}
                        </div>
                      )}
                    </motion.article>
                  ))}
                </div>
              ) : (
                <div className="oa-headflow__empty">
                  <p>
                    <b>Quick setup:</b> add tom/bass catalogs (e.g. <code>heads.toms.data.js</code>,{' '}
                    <code>heads.bass.data.js</code>) and populate <code>CATALOG</code>.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}