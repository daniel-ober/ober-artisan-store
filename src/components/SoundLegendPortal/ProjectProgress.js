// src/components/SoundLegendPortal/ProjectProgress.js

import React, { useEffect, useMemo, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import './ProjectProgress.css';

const CRAFT_VIDEO = '/craft_in_motion/craftinmotion1080p.mp4';

/* -------------------- Step metadata -------------------- */

const STEPS = [
  { key: 'woodPreparation', label: 'Wood Preparation', short: 'Wood Prep' },
  {
    key: 'shellConstruction',
    label: 'Shell Construction',
    short: 'Shell Build',
  },
  {
    key: 'fineTuning',
    label: 'Fine Tuning (Trueing/Thickness)',
    short: 'Interior',
  },
  { key: 'shellExteriorFinish', label: 'Exterior Finish', short: 'Exterior' },
  { key: 'bearingEdges', label: 'Bearing Edges', short: 'Edges' },
  { key: 'snareBedCutting', label: 'Snare Beds', short: 'Beds' },
  { key: 'hardwareDrilling', label: 'Hardware Drilling', short: 'Drilling' },
  { key: 'hardwareAssembly', label: 'Hardware Assembly', short: 'Hardware' },
  { key: 'tuningDetailing', label: 'Tuning & Detailing', short: 'Tuning' },
  { key: 'qualityCheck', label: 'Quality Check', short: 'Delivery' },
];

const STEP_WEIGHTS = {
  woodPreparation: 0.05,
  shellConstruction: 0.2,
  fineTuning: 0.1,
  shellExteriorFinish: 0.2,
  bearingEdges: 0.1,
  snareBedCutting: 0.1,
  hardwareDrilling: 0.1,
  hardwareAssembly: 0.05,
  tuningDetailing: 0.05,
  qualityCheck: 0.05,
};

/* -------------------- Helpers -------------------- */

function calcProgress(project) {
  if (!project) return 0;
  let total = 0;
  for (const [key, w] of Object.entries(STEP_WEIGHTS)) {
    const step = project[key];
    const list = step?.checklist;
    if (!Array.isArray(list) || !list.length) continue;
    const done = list.filter((i) => i && i.completed).length;
    total += (done / list.length) * w;
  }
  return Math.round(total * 100);
}

function stepStatus(stepData) {
  const list = Array.isArray(stepData?.checklist) ? stepData.checklist : [];

  const total = list.length;
  const done = list.filter((i) => i && i.completed).length;

  if (!total) return { status: 'Not Started', done: 0, total: 0 };
  if (done === total) return { status: 'Completed', done, total };
  if (done > 0) return { status: 'In Progress', done, total };
  return { status: 'Not Started', done, total };
}

function topFiveTasks(stepData) {
  const list = Array.isArray(stepData?.checklist) ? stepData.checklist : [];
  return list
    .filter((x) => x && typeof x.task === 'string' && x.task.trim())
    .slice(0, 5)
    .map((x) => x.task.trim());
}

function detectType(url) {
  const u = (url || '').toLowerCase();
  if (u.endsWith('.pdf')) return 'pdf';
  if (/\.(png|jpg|jpeg|webp|gif|bmp|tiff)$/.test(u)) return 'image';
  if (/\.(mp4|mov|webm|m4v)$/.test(u)) return 'video';
  if (/\.(mp3|m4a|wav|flac|aac|ogg)$/.test(u)) return 'audio';
  return 'link';
}

// Media mapping per step (by attachment category)
const MEDIA_BUCKETS_BY_STEP = {
  woodPreparation: ['wood_selection'],
  shellConstruction: [
    'stave_construction_(pre-milling)',
    'stave_construction_(post-milling)',
  ],
  fineTuning: ['stave_construction_(post-milling)'],
  shellExteriorFinish: ['early_mockups_(pre-production)', 'other'],
  bearingEdges: [],
  snareBedCutting: [],
  hardwareDrilling: [],
  hardwareAssembly: [],
  tuningDetailing: [],
  qualityCheck: ['other', 'build_proposal'],
};

function getStepMedia(project, stepKey) {
  const all = project?.attachments || {};
  const wanted = MEDIA_BUCKETS_BY_STEP[stepKey] || [];
  const out = [];

  wanted.forEach((bucketKey) => {
    const arr = Array.isArray(all[bucketKey]) ? all[bucketKey] : [];
    arr.forEach((item) => {
      if (!item || !item.url) return;
      out.push({ url: item.url, type: detectType(item.url) });
    });
  });

  return out;
}

/* ---- date helpers ---- */

function tsToMillis(v) {
  if (!v) return 0;
  if (typeof v === 'string') {
    const t = Date.parse(v);
    return Number.isFinite(t) ? t : 0;
  }
  if (typeof v === 'number') return v;
  if (v instanceof Date) return v.getTime() || 0;
  if (typeof v === 'object' && v.seconds) return v.seconds * 1000;
  try {
    const t = new Date(v).getTime();
    return Number.isFinite(t) ? t : 0;
  } catch {
    return 0;
  }
}

function fmtFromMs(ms) {
  return ms ? new Date(ms).toLocaleDateString() : '—';
}

function pickLatestDate(...vals) {
  const ms = vals.map(tsToMillis).filter(Boolean);
  if (!ms.length) return 0;
  return Math.max(...ms);
}

function pickEarliestDate(...vals) {
  const ms = vals.map(tsToMillis).filter(Boolean);
  if (!ms.length) return 0;
  return Math.min(...ms);
}

// 🔹 Prefer the explicit actualCompletion field when present,
// otherwise fall back to the latest of other completion-ish timestamps.
function getCompletionDate(project) {
  if (!project) return 0;

  if (project.actualCompletion) {
    return tsToMillis(project.actualCompletion);
  }

  const candidates = [
    project.completionDate,
    project.completedAt,
    project.fulfilledAt,
    project.deliveredAt,
    project.shippedAt,
    project.qualityCheck && project.qualityCheck.completedAt,
  ];

  return pickLatestDate(...candidates);
}

function isProjectComplete(project, pct) {
  if (!project) return false;

  // 🔒 Only treat as complete when the weighted checklist is 100%
  if (pct < 100) return false;

  return true;
}

/**
 * Hero media:
 *  - Use hero URL already attached to the project.
 *  - Falls back to heroMedia struct or attachments.
 */
function getHeroMedia(project) {
  if (!project) return null;

  const directUrl =
    project.showroomHeroUrl ||
    project.heroImageUrl ||
    project.heroImage || // direct hero image on project
    project.heroMediaUrl ||
    project.vaultHeroUrl ||
    project.heroUrl ||
    (project.meta && (project.meta.heroImage || project.meta.heroImageUrl));

  if (directUrl) {
    return { url: directUrl, type: detectType(directUrl) };
  }

  // Struct-style field { url, type }
  if (project.heroMedia && project.heroMedia.url) {
    const t = project.heroMedia.type || detectType(project.heroMedia.url);
    return { url: project.heroMedia.url, type: t };
  }

  // Attachments bucket, e.g. attachments.showroom_hero[0]
  const bucket =
    project.attachments &&
    (project.attachments.showroom_hero ||
      project.attachments.hero ||
      project.attachments.cover);

  if (Array.isArray(bucket) && bucket[0]?.url) {
    const url = bucket[0].url;
    return { url, type: detectType(url) };
  }

  return null;
}

/* 🔹 Determine the "current" step index based on project data */
function getCurrentStepIndex(project) {
  if (!project) return -1;

  const phase = String(project.currentPhase || '').toLowerCase();

  // Try to map currentPhase text to one of the labels (e.g., "Shell Construction")
  const fromPhase = STEPS.findIndex((s) =>
    phase.includes(s.label.split(' ')[0].toLowerCase())
  );
  if (fromPhase >= 0) return fromPhase;

  // Otherwise, fall back to the last step that has *any* completed checklist item
  for (let i = STEPS.length - 1; i >= 0; i--) {
    const d = project[STEPS[i].key];
    const list = Array.isArray(d?.checklist) ? d.checklist : [];
    if (list.some((c) => c && c.completed)) return i;
  }

  // No progress yet
  return -1;
}

/* Step copy (WHAT/WHY/TOOLS/etc.) */

const COPY = {
  woodPreparation: {
    what: 'Select boards, moisture-check, joint/plane flat & square, and mark grain orientation.',
    why: 'Flat, dry, oriented wood prevents warping and sets the drum’s voice.',
    techniques: [
      'Moisture normalization',
      'Grain matching',
      'Face/edge jointing',
    ],
    tools: ['Moisture meter', 'Jointer & planer', 'Calipers', 'Clamps'],
    risks: ['Hidden tension → cupping', 'Mismatched moisture → creep'],
    mantra: 'Stable wood = stable tone.',
    est: '3–8 hrs',
  },
  shellConstruction: {
    what: 'Cut/bevel/clamp staves and bring shell true to diameter & roundness.',
    why: 'Round, consistent shells project well and tune evenly.',
    techniques: ['Stave beveling', 'Form clamping', 'Roundness trueing'],
    tools: ['Table saw + bevel sled', 'Clamping forms', 'Dial calipers'],
    risks: ['Gluing misalignment', 'Ovalization during clamp'],
    mantra: 'True, round shells tune easier.',
    est: '8–16 hrs',
  },
  fineTuning: {
    what: 'True faces, bring thickness to target, smooth interior.',
    why: 'Consistency yields even resonance & predictable tuning.',
    techniques: ['Lathe trueing', 'Thickness profiling', 'Progressive sanding'],
    tools: ['Lathe/drum sander', 'Dial indicator', 'Sanding blocks'],
    risks: ['Hot spots → dead zones', 'Over-removal'],
    mantra: 'Consistent shell = consistent resonance.',
    est: '4–10 hrs',
  },
  shellExteriorFinish: {
    what: 'Veneer/stain/epoxy/clear. Level-sand & polish; honor cure windows.',
    why: 'Protects the shell and shapes attack/sustain & feel.',
    techniques: ['HVLP spray', 'Level sanding', 'Buff & polish'],
    tools: ['HVLP sprayer', 'Polishing system', 'Viscosity cups'],
    risks: ['Solvent trap → haze', 'Runs & sags'],
    mantra: 'Durable finish, consistent tone.',
    est: '10–24 hrs',
  },
  bearingEdges: {
    what: 'Cut profiles to spec; dress, burnish, and polish.',
    why: 'Edge is the head’s contact—attack & articulation start here.',
    techniques: ['Profile routing', 'Hand dressing', 'Burnishing'],
    tools: ['Router table & jigs', 'Files', 'Burnish wheels'],
    risks: ['Chip-out', 'Uneven apex'],
    mantra: 'Your “handshake” with the head.',
    est: '2–4 hrs',
  },
  snareBedCutting: {
    what: 'Cut/blend beds to target depth/width; verify wire fit.',
    why: 'Keeps wires crisp & sensitive at all dynamics.',
    techniques: ['Template routing', 'Feeler gauge tuning', 'Hand blending'],
    tools: ['Router sled', 'Feeler gauges', 'Blocks & abrasives'],
    risks: ['Over-deep → choke', 'Misalignment'],
    mantra: 'Crisp response, zero choke.',
    est: '1–2 hrs',
  },
  hardwareDrilling: {
    what: 'Layout, drill, deburr, and seal all holes.',
    why: 'Prevents micro-cracks; ensures alignment & longevity.',
    techniques: ['Template layout', 'Step drilling', 'Hole sealing'],
    tools: ['Drill press + jigs', 'Step bits', 'Layout templates'],
    risks: ['Exit tear-out', 'Layout drift'],
    mantra: 'Rock-solid hardware, no buzzes.',
    est: '1–3 hrs',
  },
  hardwareAssembly: {
    what: 'Install lugs/hoops/throw/butt/strain; dress contacts; treat threads.',
    why: 'Removes squeaks/buzzes; stable tuning.',
    techniques: [
      'Torque sequence',
      'Threadlock where appropriate',
      'Contact dressing',
    ],
    tools: ['Torque drivers', 'Soft jaws', 'Thread treatments'],
    risks: ['Cross-threading', 'Uneven seating'],
    mantra: 'Quiet, aligned hardware that lasts.',
    est: '1–3 hrs',
  },
  tuningDetailing: {
    what: 'Head fit, initial tuning, wire alignment, badge, meticulous clean.',
    why: 'Turns a shell into an instrument.',
    techniques: ['Tension mapping', 'Wire centering', 'Final clean'],
    tools: ['Tension gauge', 'Reference tuner', 'Straightedges'],
    risks: ['Head seating issues', 'Wire chatter'],
    mantra: 'Plays in tune, feels alive.',
    est: '1–3 hrs',
  },
  qualityCheck: {
    what: 'Full inspection, documentation, a short audio clip, and ship prep.',
    why: 'Ensures it arrives verified & gig-ready.',
    techniques: ['QC checklist', 'Audio capture', 'Pack & protect'],
    tools: ['Reference mic', 'Monitors', 'Inspection lights'],
    risks: ['Transit risk if packaging is wrong'],
    mantra: 'Every SoundLegend leaves verified.',
    est: '1–4 hrs',
  },
};

// ---- estimation helpers (hours -> days for each step) ----
function parseHoursRange(est) {
  if (!est) return null;
  const matches = String(est).match(/(\d+(\.\d+)?)/g);
  if (!matches || !matches.length) return null;

  if (matches.length === 1) {
    const v = parseFloat(matches[0]);
    return { min: v, max: v, avg: v };
  }

  const min = parseFloat(matches[0]);
  const max = parseFloat(matches[matches.length - 1]);
  const avg = (min + max) / 2;
  return { min, max, avg };
}

// Conservative average calendar days for a step, based on COPY.est
function getStepAvgDays(stepKey) {
  const est = COPY[stepKey]?.est;
  const range = parseHoursRange(est);
  if (!range) return 0;

  const hoursPerDay = 6; // focused build hours per day (conservative)
  const days = range.avg / hoursPerDay;
  return Math.max(1, Math.round(days));
}

// Add weekend-only workdays (Sat/Sun) PLUS a 2-weekend buffer (4 days total)
function addWeekendWorkdays(startMs, workdays) {
  if (!workdays) return startMs;

  let date = new Date(startMs);
  let remaining = workdays;

  // First: step forward counting ONLY Sat/Sun as workdays
  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay(); // 0 = Sun, 6 = Sat
    if (day === 0 || day === 6) {
      remaining--;
    }
  }

  // Second: add buffer = 2 full weekends = 4 workdays
  let buffer = 4; // (Sat + Sun) × 2 weekends

  while (buffer > 0) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day === 0 || day === 6) {
      buffer--;
    }
  }

  return date.getTime();
}

/* -------------------- Component -------------------- */

const ProjectProgress = ({ project }) => {
  const pct = useMemo(() => calcProgress(project), [project]);
  const complete = useMemo(
    () => isProjectComplete(project, pct),
    [project, pct]
  );

  // 🔹 Index used for default active tab in the track
  const defaultIndex = useMemo(() => {
    const idx = getCurrentStepIndex(project);
    return idx === -1 ? 0 : idx; // UI still needs *some* step selected
  }, [project]);

  // 🔹 Stable "current step" index for the summary card
  const currentStepIndex = useMemo(
    () => getCurrentStepIndex(project),
    [project]
  );

  const [active, setActive] = useState(defaultIndex);
  const [heroFromShowroom, setHeroFromShowroom] = useState(null);

  useEffect(() => {
    setActive(defaultIndex);
  }, [defaultIndex]);

  // 🔹 Pull heroImage from soundlegend_showroom (e.g. doc "SL-003")
  useEffect(() => {
    let cancelled = false;

    const fetchHero = async () => {
      if (!project) return;

      const serial =
        project.lineSerial ||
        project.globalSerial ||
        (project.specs && project.specs.lineSerial);

      if (!serial) return;

      try {
        const ref = doc(db, 'soundlegend_showroom', serial);
        const snap = await getDoc(ref);
        if (!snap.exists() || cancelled) return;

        const data = snap.data();
        const url =
          data.heroImage ||
          data.heroImageUrl ||
          data.hero ||
          data.coverImage ||
          '';

        if (!url || cancelled) return;

        setHeroFromShowroom({ url, type: detectType(url) });
      } catch (err) {
        console.error('Failed to load showroom hero:', err);
      }
    };

    fetchHero();
    return () => {
      cancelled = true;
    };
  }, [project]);

  if (!project) {
    return (
      <div className="slp-card pp-card" data-component="ProjectProgress">
        <h3>Build Progress</h3>
        <p className="slp-muted">No project selected.</p>
      </div>
    );
  }

  const activeStep = STEPS[active];
  const stepData = project[activeStep.key] || {};
  const { status } = stepStatus(stepData);
  const body = COPY[activeStep.key] || {};
  const qcTop5 = topFiveTasks(stepData);
  const media = getStepMedia(project, activeStep.key);

  // Weighted track marker positions
  const cumWeights = useMemo(() => {
    const arr = STEPS.map((s) => STEP_WEIGHTS[s.key] || 0);
    const out = [];
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
      out.push(sum);
      sum += arr[i];
    }
    out.push(1); // end cap
    return out;
  }, []);

  const leftPctForIndex = (i) => cumWeights[i] * 100;

  // summary dates
  const startMs = pickEarliestDate(project.startDate, project.createdAt);
  const completionMs = getCompletionDate(project);

  const startDate = fmtFromMs(startMs);
  const completionDate = fmtFromMs(completionMs);

  // Step-level timing estimates
  const stepAvgDays = getStepAvgDays(activeStep.key);

  // Cumulative days from project start through each step, for target dates
  const cumulativeStepDays = useMemo(() => {
    let running = 0;
    return STEPS.map((s) => {
      const d = getStepAvgDays(s.key);
      running += d;
      return running;
    });
  }, []);

  const daysFromStartForActive = cumulativeStepDays[active] || stepAvgDays || 0;

  const baselineMs = startMs || Date.now();

  const targetStepDateMs = daysFromStartForActive
    ? addWeekendWorkdays(baselineMs, daysFromStartForActive)
    : 0;

  const targetStepDate = fmtFromMs(targetStepDateMs);

  // 🔹 Final-step conservative completion window (summary row)
  const totalDaysFinal = cumulativeStepDays[STEPS.length - 1] || 0;

  const finalStepTargetMs = totalDaysFinal
    ? addWeekendWorkdays(baselineMs, totalDaysFinal)
    : 0;

  const finalStepTargetDate = fmtFromMs(finalStepTargetMs);

  // Add 2 calendar weeks for shipping / life buffer
  const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;
  const finalWindowEndMs = finalStepTargetMs
    ? finalStepTargetMs + TWO_WEEKS_MS
    : 0;

  const finalWindowEndDate = fmtFromMs(finalWindowEndMs);

  // 🔹 Current step label in the SUMMARY row (top middle card)
  const currentStepLabel = complete
    ? 'All Steps Complete'
    : currentStepIndex === -1
      ? 'Not Started'
      : `${currentStepIndex + 1}. ${STEPS[currentStepIndex].label}`;

  // ⭐ Hero selection: use showroom hero first, then any hero already on the project
  const heroLocal = getHeroMedia(project);
  const hero = heroFromShowroom || heroLocal;
  const showHeroFromProject = complete && hero && hero.url;
  const heroIsVideo = showHeroFromProject && hero.type === 'video';

  const buildWindowLabel = complete
    ? 'Completion date'
    : 'Target completion window';

  return (
    <div className="slp-card pp-card" data-component="ProjectProgress">
      <h3>Build Progress</h3>
      <p className="slp-muted">
        Follow your SoundLegend as it moves through each phase of the build —
        from raw wood to finished instrument, ready for the Legacy Vault.
      </p>

      {/* ---------- Hero media ---------- */}
      <section className="pp-hero-section">
        <div className="pp-hero-frame">
          {showHeroFromProject ? (
            heroIsVideo ? (
              <video
                className="pp-hero-media"
                src={hero.url}
                muted
                loop
                autoPlay
                playsInline
                controls
              />
            ) : (
              <img
                className="pp-hero-media"
                src={hero.url}
                alt="SoundLegend hero"
              />
            )
          ) : (
            <video
              className="pp-hero-media"
              src={CRAFT_VIDEO}
              muted
              loop
              autoPlay
              playsInline
            />
          )}

          <div className="pp-hero-overlay">
            <span className="pp-hero-pill">
              {showHeroFromProject ? 'Legacy Vault Reveal' : 'Craft In Motion'}
            </span>
          </div>
        </div>

        <p className="pp-hero-caption slp-muted">
          {showHeroFromProject
            ? 'Your finished SoundLegend as it appears in the Legacy Vault and showroom.'
            : 'A glimpse into the Ober Artisan process — you’ll see more behind-the-scenes clips and photos in the Media tab as your drum moves through each step.'}
        </p>
      </section>

      {/* ---------- Summary row ---------- */}
      <section className="pp-summary">
        <div className="pp-summary-item">
          <span className="pp-summary-label">
            Project completion
            {complete && (
              <span className="pp-summary-check" aria-hidden="true">
                ✔
              </span>
            )}
          </span>
          <span className="pp-summary-value">
            {complete ? 'All steps complete' : `${pct}%`}
          </span>
        </div>

        <div className="pp-summary-item">
          <span className="pp-summary-label">
            Current step
            {complete && (
              <span className="pp-summary-check" aria-hidden="true">
                ✔
              </span>
            )}
          </span>
          <span className="pp-summary-value">{currentStepLabel}</span>
        </div>

        <div className="pp-summary-item">
          <span className="pp-summary-label">
            {buildWindowLabel}
            {complete && completionMs && (
              <span className="pp-summary-check" aria-hidden="true">
                ✔
              </span>
            )}
          </span>
          <span className="pp-summary-value">
            {complete
              ? completionDate || startDate || '—'
              : finalStepTargetDate !== '—' || finalWindowEndDate !== '—'
                ? `${finalStepTargetDate || '—'} → ${
                    finalWindowEndDate || '—'
                  }`
                : '—'}
          </span>
        </div>
      </section>

      {/* ---------- Weighted progress track ---------- */}
      <section className="pp-track-section">
        <h4 className="pp-subheading">Build roadmap</h4>

        <div
          className="pp-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label="Overall project completion"
        >
          <div className="pp-track-bar">
            <div className="pp-track-fill" style={{ width: `${pct}%` }} />
          </div>

          <div
            className="pp-track-dots"
            role="tablist"
            aria-label="Build steps"
          >
            {STEPS.map((s, i) => {
              const d = project[s.key];
              const st = stepStatus(d).status;
              const isActive = i === active;

              const clazz =
                st === 'Completed'
                  ? 'done'
                  : st === 'In Progress'
                    ? 'wip'
                    : 'todo';

              return (
                <button
                  key={s.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={`Step ${i + 1}: ${s.label} — ${st}`}
                  title={`${i + 1}. ${s.label} — ${st}`}
                  className={`pp-dot ${clazz} ${isActive ? 'active' : ''}`}
                  style={{ left: `${leftPctForIndex(i)}%` }}
                  onClick={() => setActive(i)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowRight') {
                      setActive((prev) => Math.min(prev + 1, STEPS.length - 1));
                    }
                    if (e.key === 'ArrowLeft') {
                      setActive((prev) => Math.max(prev - 1, 0));
                    }
                  }}
                >
                  <span className="pp-dot-number">{i + 1}</span>
                </button>
              );
            })}
            <span
              className="pp-endcap"
              style={{ left: `${leftPctForIndex(STEPS.length)}%` }}
            />
          </div>
        </div>
      </section>

      {/* ---------- Active step details ---------- */}
      <section className="pp-detail">
        <div className="pp-step-header">
          <h4 className="pp-step-title">
            {active + 1}. {activeStep.label}
          </h4>
          <div
            className={`pp-pill ${
              status === 'Completed'
                ? 'ok'
                : status === 'In Progress'
                  ? 'wip'
                  : ''
            }`}
          >
            {status}
          </div>
        </div>

        <div className="pp-stats">
          <div className="pp-stat">
            <div className="pp-stat-label">Est. time (focused hours)</div>
            <div className="pp-stat-value">{body.est || '—'}</div>
          </div>

          <div className="pp-stat">
            <div className="pp-stat-label">Avg. turnaround (calendar days)</div>
            <div className="pp-stat-value">
              {stepAvgDays
                ? `${stepAvgDays} day${stepAvgDays === 1 ? '' : 's'}`
                : '—'}
            </div>
          </div>

          <div className="pp-stat">
            <div className="pp-stat-label">
              Conservative target date
              <span
                className="pp-info-tip"
                title="Currently based on a weekend-only work schedule."
              >
                ?
              </span>
            </div>
            <div className="pp-stat-value">
              {daysFromStartForActive ? targetStepDate : '—'}
            </div>
          </div>
        </div>

        <div className="pp-grid">
          {/* Column 1 */}
          <div className="pp-col">
            <div className="pp-sub">What we do</div>
            <p className="pp-body">{body.what || '—'}</p>

            <div className="pp-sub">Why it matters</div>
            <p className="pp-body">{body.why || '—'}</p>

            <div className="pp-sub">Techniques used</div>
            <div className="pp-chips">
              {(body.techniques || []).map((t) => (
                <span key={t} className="pp-chip">
                  {t}
                </span>
              ))}
            </div>

            <div className="pp-sub">
              QC checklist <span className="pp-muted">(top 5)</span>
            </div>
            <ul className="pp-list">
              {(qcTop5.length
                ? qcTop5
                : ['No checklist items recorded for this step.']
              ).map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>

          {/* Column 2 */}
          <div className="pp-col">
            <div className="pp-sub">Tools involved</div>
            <ul className="pp-links">
              {(body.tools || []).map((t) => (
                <li key={t}>
                  <button
                    type="button"
                    className="pp-link-button"
                    onClick={(e) => e.preventDefault()}
                  >
                    {t}
                  </button>
                </li>
              ))}
            </ul>

            <div className="pp-sub">Risks & mitigations</div>
            <ul className="pp-list">
              {(body.risks || []).map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>

            <div className="pp-mantra">
              <span className="pp-star">★</span>
              <span>{body.mantra}</span>
            </div>
          </div>
        </div>

        {/* Related media */}
        {media.length > 0 && (
          <div className="pp-sub" style={{ marginTop: 12 }}>
            Related media
          </div>
        )}

        {media.length === 0 ? (
          <div className="pp-empty">No files for this step yet.</div>
        ) : (
          <div className="pp-media">
            {media.map((m, i) => {
              const alt = `${activeStep.label} media ${i + 1}`;

              if (m.type === 'image') {
                return (
                  <a
                    key={i}
                    href={m.url}
                    target="_blank"
                    rel="noreferrer"
                    className="pp-thumb"
                  >
                    <img src={m.url} alt={alt} />
                  </a>
                );
              }

              const cls = `pp-thumb pp-thumb-${m.type}`;
              const label = m.type.charAt(0).toUpperCase() + m.type.slice(1);

              return (
                <a
                  key={i}
                  href={m.url}
                  target="_blank"
                  rel="noreferrer"
                  className={cls}
                  aria-label={`${label}: ${alt}`}
                >
                  <span>{label}</span>
                </a>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default ProjectProgress;