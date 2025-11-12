import React, { useMemo, useState, useEffect } from 'react';
import './ProjectProgress.css';

/* ---- ordered steps ---- */
const STEPS = [
  { key: 'woodPreparation',     label: 'Wood Preparation' },
  { key: 'shellConstruction',   label: 'Shell Construction' },
  { key: 'fineTuning',          label: 'Fine Tuning (Trueing/Thickness)' },
  { key: 'shellExteriorFinish', label: 'Exterior Finish' },
  { key: 'bearingEdges',        label: 'Bearing Edges' },
  { key: 'snareBedCutting',     label: 'Snare Beds' },
  { key: 'hardwareDrilling',    label: 'Hardware Drilling' },
  { key: 'hardwareAssembly',    label: 'Hardware Assembly' },
  { key: 'tuningDetailing',     label: 'Tuning & Detailing' },
  { key: 'qualityCheck',        label: 'Quality Check' },
];

/* ---- weights drive both progress % and dot spacing ---- */
const STEP_WEIGHTS = {
  woodPreparation:     0.05,
  shellConstruction:   0.20,
  fineTuning:          0.10,
  shellExteriorFinish: 0.20,
  bearingEdges:        0.10,
  snareBedCutting:     0.10,
  hardwareDrilling:    0.10,
  hardwareAssembly:    0.05,
  tuningDetailing:     0.05,
  qualityCheck:        0.05,
};

function calcProgress(project) {
  if (!project) return 0;
  let total = 0;
  for (const [key, w] of Object.entries(STEP_WEIGHTS)) {
    const list = project[key]?.checklist;
    if (!list?.length) continue;
    const done = list.filter(i => i.completed).length;
    total += (done / list.length) * w;
  }
  return Math.round(total * 100);
}

function stepStatus(stepData) {
  const total = stepData?.checklist?.length || 0;
  const done  = stepData?.checklist?.filter(i => i.completed).length || 0;
  if (!total) return { status: 'Not Started', done, total };
  if (done === total) return { status: 'Completed', done, total };
  if (done > 0)       return { status: 'In Progress', done, total };
  return { status: 'Not Started', done, total };
}

function topFiveTasks(stepData) {
  return (stepData?.checklist || []).slice(0, 5).map(x => x.task);
}

/* --- media buckets per step (maps to Firestore attachments groups) --- */
const MEDIA_BUCKETS_BY_STEP = {
  woodPreparation:       ['wood_selection'],
  shellConstruction:     ['stave_construction_(pre-milling)', 'stave_construction_(post-milling)'],
  fineTuning:            ['stave_construction_(post-milling)'],
  shellExteriorFinish:   ['early_mockups_(pre-production)', 'other'],
  bearingEdges:          [],
  snareBedCutting:       [],
  hardwareDrilling:      [],
  hardwareAssembly:      [],
  tuningDetailing:       [],
  qualityCheck:          ['other', 'build_proposal'],
};

function detectType(url) {
  const u = (url || '').toLowerCase();
  if (u.endsWith('.pdf')) return 'pdf';
  if (/\.(png|jpg|jpeg|webp|gif|bmp|tiff)$/.test(u)) return 'image';
  if (/\.(mp4|mov|webm|m4v)$/.test(u)) return 'video';
  if (/\.(mp3|m4a|wav|flac|aac|ogg)$/.test(u)) return 'audio';
  return 'link';
}

function getStepMedia(project, stepKey) {
  const all = project?.attachments || {};
  const wanted = MEDIA_BUCKETS_BY_STEP[stepKey] || [];
  const out = [];
  for (const b of wanted) {
    const arr = all[b] || [];
    for (const item of arr) {
      if (item?.url) out.push({ url: item.url, type: detectType(item.url) });
    }
  }
  return out;
}

/* --- fallback copy to keep panel informative even with sparse checklists --- */
const COPY = {
  woodPreparation: {
    what: 'Select boards, moisture-check, joint/plane flat & square, and mark grain orientation.',
    why:  'Flat, dry, oriented wood prevents warping and sets the drum’s voice.',
    techniques: ['Moisture normalization', 'Grain matching', 'Face/edge jointing'],
    tools: ['Moisture meter', 'Jointer & planer', 'Calipers', 'Clamps'],
    risks: ['Hidden tension → cupping', 'Mismatched moisture → creep'],
    mantra: 'Stable wood = stable tone.',
    est: '3–8 hrs'
  },
  shellConstruction: {
    what: 'Cut/bevel/clamp staves and bring shell true to diameter & roundness.',
    why:  'Round, consistent shells project well and tune evenly.',
    techniques: ['Stave beveling', 'Form clamping', 'Roundness trueing'],
    tools: ['Table saw + bevel sled', 'Clamping forms', 'Dial calipers'],
    risks: ['Gluing misalignment', 'Ovalization during clamp'],
    mantra: 'True, round shells tune easier.',
    est: '8–16 hrs'
  },
  fineTuning: {
    what: 'True faces, bring thickness to target, smooth interior.',
    why:  'Consistency yields even resonance & predictable tuning.',
    techniques: ['Lathe trueing', 'Thickness profiling', 'Progressive sanding'],
    tools: ['Lathe/drum sander', 'Dial indicator', 'Sanding blocks'],
    risks: ['Hot spots → dead zones', 'Over-removal'],
    mantra: 'Consistent shell = consistent resonance.',
    est: '4–10 hrs'
  },
  shellExteriorFinish: {
    what: 'Veneer/stain/epoxy/clear. Level-sand & polish; honor cure windows.',
    why:  'Protects the shell and shapes attack/sustain & feel.',
    techniques: ['HVLP spray', 'Level sanding', 'Buff & polish'],
    tools: ['HVLP sprayer', 'Polishing system', 'Viscosity cups'],
    risks: ['Solvent trap → haze', 'Runs & sags'],
    mantra: 'Durable finish, consistent tone.',
    est: '10–24 hrs'
  },
  bearingEdges: {
    what: 'Cut profiles to spec; dress, burnish, and polish.',
    why:  'Edge is the head’s contact—attack & articulation start here.',
    techniques: ['Profile routing', 'Hand dressing', 'Burnishing'],
    tools: ['Router table & jigs', 'Files', 'Burnish wheels'],
    risks: ['Chip-out', 'Uneven apex'],
    mantra: 'Your “handshake” with the head.',
    est: '2–4 hrs'
  },
  snareBedCutting: {
    what: 'Cut/blend beds to target depth/width; verify wire fit.',
    why:  'Keeps wires crisp & sensitive at all dynamics.',
    techniques: ['Template routing', 'Feeler gauge tuning', 'Hand blending'],
    tools: ['Router sled', 'Feeler gauges', 'Blocks & abrasives'],
    risks: ['Over-deep → choke', 'Misalignment'],
    mantra: 'Crisp response, zero choke.',
    est: '1–2 hrs'
  },
  hardwareDrilling: {
    what: 'Layout, drill, deburr, and seal all holes.',
    why:  'Prevents micro-cracks; ensures alignment & longevity.',
    techniques: ['Template layout', 'Step drilling', 'Hole sealing'],
    tools: ['Drill press + jigs', 'Step bits', 'Layout templates'],
    risks: ['Exit tear-out', 'Layout drift'],
    mantra: 'Rock-solid hardware, no buzzes.',
    est: '1–3 hrs'
  },
  hardwareAssembly: {
    what: 'Install lugs/hoops/throw/butt/strain; dress contacts; treat threads.',
    why:  'Removes squeaks/buzzes; stable tuning.',
    techniques: ['Torque sequence', 'Threadlock where appropriate', 'Contact dressing'],
    tools: ['Torque drivers', 'Soft jaws', 'Thread treatments'],
    risks: ['Cross-threading', 'Uneven seating'],
    mantra: 'Quiet, aligned hardware that lasts.',
    est: '1–3 hrs'
  },
  tuningDetailing: {
    what: 'Head fit, initial tuning, wire alignment, badge, meticulous clean.',
    why:  'Turns a shell into an instrument.',
    techniques: ['Tension mapping', 'Wire centering', 'Final clean'],
    tools: ['Tension gauge', 'Reference tuner', 'Straightedges'],
    risks: ['Head seating issues', 'Wire chatter'],
    mantra: 'Plays in tune, feels alive.',
    est: '1–3 hrs'
  },
  qualityCheck: {
    what: 'Full inspection, documentation, a short audio clip, and ship prep.',
    why:  'Ensures it arrives verified & gig-ready.',
    techniques: ['QC checklist', 'Audio capture', 'Pack & protect'],
    tools: ['Reference mic', 'Monitors', 'Inspection lights'],
    risks: ['Transit risk if packaging is wrong'],
    mantra: 'Every SoundLegend leaves verified.',
    est: '1–4 hrs'
  },
};

export default function ProjectProgress({ project }) {
  const pct = useMemo(() => calcProgress(project), [project]);

  // pick default active based on project.currentPhase or last step with progress
  const defaultIndex = useMemo(() => {
    const phase = (project?.currentPhase || '').toLowerCase();
    const fromPhase = STEPS.findIndex(s =>
      phase.includes(s.label.split(' ')[0].toLowerCase())
    );
    if (fromPhase >= 0) return fromPhase;
    for (let i = STEPS.length - 1; i >= 0; i--) {
      const d = project?.[STEPS[i].key];
      if (d?.checklist?.some(c => c.completed)) return i;
    }
    return 0;
  }, [project]);

  // keep active step in sync with data changes
  const [active, setActive] = useState(defaultIndex);
  useEffect(() => { setActive(defaultIndex); }, [defaultIndex]);

  const activeStep = STEPS[active];
  const stepData   = project?.[activeStep.key] || {};
  const { status } = stepStatus(stepData);
  const body       = COPY[activeStep.key] || {};
  const qcTop5     = topFiveTasks(stepData);
  const media      = getStepMedia(project, activeStep.key);

  // cum weights → dot positions
  const cumWeights = useMemo(() => {
    const arr = STEPS.map(s => STEP_WEIGHTS[s.key] || 0);
    const out = [];
    let sum = 0;
    for (let i = 0; i < arr.length; i++) { out.push(sum); sum += arr[i]; }
    out.push(1); // final bound
    return out;
  }, []);
  const leftPctForIndex = (i) => (cumWeights[i] * 100);

  return (
    <section className="pp2" data-component="ProjectProgress">
      <header className="pp2-head">
        <h3>Build Progress</h3>
        <div className="pp2-metrics" role="group" aria-label="Project metrics">
          <span><strong>Project Completion:</strong> {pct}%</span>
          <span><strong>Current Step:</strong> {project?.currentPhase || '—'}</span>
        </div>
      </header>

      {/* progress track */}
      <div
        className="pp2-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label="Overall project completion"
      >
        <div className="pp2-bar" style={{ width: `${pct}%` }} />
        <div className="pp2-dots" role="tablist" aria-label="Build steps">
          {STEPS.map((s, i) => {
            const d  = project?.[s.key];
            const st = stepStatus(d).status;
            const clazz = st === 'Completed' ? 'done' : st === 'In Progress' ? 'wip' : 'todo';
            const isActive = i === active;
            return (
              <button
                key={s.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-current={isActive ? 'step' : undefined}
                aria-label={`Step ${i+1}: ${s.label} — ${st}`}
                title={`${i+1}. ${s.label} — ${st}`}
                className={`pp2-dot ${clazz} ${isActive ? 'active' : ''}`}
                style={{ left: `${leftPctForIndex(i)}%` }}
                onClick={() => setActive(i)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight') setActive(Math.min(active + 1, STEPS.length - 1));
                  if (e.key === 'ArrowLeft')  setActive(Math.max(active - 1, 0));
                }}
              >
                <span>{i+1}</span>
              </button>
            );
          })}
          <span className="pp2-endcap" style={{ left: `${leftPctForIndex(STEPS.length)}%` }} />
        </div>
      </div>

      {/* detail card */}
      <div className="pp2-card">
        <div className="pp2-card-top">
          <div className="pp2-step-title">
            <div className={`pp2-pill ${status === 'Completed' ? 'ok' : status === 'In Progress' ? 'wip' : ''}`}>
              {status}
            </div>
            <h4>{active+1}. {activeStep.label}</h4>
          </div>

          <div className="pp2-stats">
            <div className="pp2-stat">
              <div className="pp2-stat-label">Standard Turnaround</div>
              <div className="pp2-stat-value">8–10 weeks</div>
            </div>
            <div className="pp2-stat">
              <div className="pp2-stat-label">Projected Completion (Throughput)</div>
              <div className="pp2-stat-value">—</div>
            </div>
            <div className="pp2-stat">
              <div className="pp2-stat-label">Est. Time (Working Hours)</div>
              <div className="pp2-stat-value">{body.est || '—'}</div>
            </div>
          </div>
        </div>

        <div className="pp2-grid">
          <div className="pp2-col">
            <div className="pp2-sub">WHAT WE DO</div>
            <p className="pp2-body">{body.what || '—'}</p>

            <div className="pp2-sub">WHY IT MATTERS</div>
            <p className="pp2-body">{body.why || '—'}</p>

            <div className="pp2-sub">TECHNIQUES USED</div>
            <div className="pp2-chips">
              {(body.techniques || []).map(t => <span key={t} className="pp2-chip">{t}</span>)}
            </div>

            <div className="pp2-sub">QC CHECKLIST <span className="pp2-muted">(Top 5)</span></div>
            <ul className="pp2-list">
              {(qcTop5.length ? qcTop5 : ['No checklist items recorded for this step.']).map((t,i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>

          <div className="pp2-col">
            <div className="pp2-sub">TOOLS INVOLVED</div>
            <ul className="pp2-links">
              {(body.tools || []).map(t => (
                <li key={t}>
                  <a href="#" onClick={(e)=>e.preventDefault()}>{t}</a>
                </li>
              ))}
            </ul>

            <div className="pp2-sub">RISKS & MITIGATIONS</div>
            <ul className="pp2-list">
              {(body.risks || []).map(r => <li key={r}>{r}</li>)}
            </ul>

            <div className="pp2-mantra">
              <span className="pp2-star">★</span>
              <span>{body.mantra}</span>
            </div>
          </div>
        </div>

        {/* Media rail */}
        {media.length > 0 && <div className="pp2-sub" style={{marginTop:12}}>Related Media</div>}
        {media.length === 0 ? (
          <div className="pp2-empty">No files for this step yet.</div>
        ) : (
          <div className="pp2-media">
            {media.map((m, i) => {
              const alt = `${activeStep.label} media ${i+1}`;
              if (m.type === 'image') {
                return (
                  <a key={i} href={m.url} target="_blank" rel="noreferrer" className="pp2-thumb">
                    <img src={m.url} alt={alt} />
                  </a>
                );
              }
              const cls = `pp2-thumb pp2-thumb-${m.type}`;
              const label = m.type[0].toUpperCase() + m.type.slice(1);
              return (
                <a key={i} href={m.url} target="_blank" rel="noreferrer" className={cls} aria-label={`${label}: ${alt}`}>
                  <span>{label}</span>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}