// src/components/SoundLegendPortal/ProjectProgress.js
import React, { useEffect, useMemo, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { calculateProjectProgress } from '../../utils/calculateProjectProgress';
import './ProjectProgress.css';

const CRAFT_VIDEO = '/craft_in_motion/craftinmotion1080p.mp4';

/* =========================================================
   STEP DEFINITIONS (10-PHASE ROADMAP)
   ========================================================= */

const STEP_DEFS = {
  /* ------------------------------------------------------------- */
  /* 1. Discovery & Design                                         */
  /* ------------------------------------------------------------- */
  discoveryDesign: {
    key: 'discoveryDesign',
    label: 'Discovery & Design',
    storageKeys: ['discoveryDesign'],
    estHours: '2–4 hrs',
    avgDays: '2 days',
    what: `We learn how you play, what you love about your current drums, and what you wish you could change. 
This is where we listen, sketch ideas, and translate your sound language into an actual build direction.`,
    why: `If this step is rushed, everything downstream suffers. A great drum starts with great listening: 
your hands, your ears, your rooms, and your story.`,
    techniques: [
      'One-on-one discovery call or written questionnaire',
      'Reference tracks + current kit analysis',
      'Play-style, genre, and tuning-range profiling',
    ],
    tools: [
      'Reference mixes and live clips',
      'Sound/tuning examples from previous builds',
      'Session notes + build notebook',
    ],
    risks: [
      'Misaligned expectations between player and builder',
      'Over- or under-building for the actual use-case',
    ],
    checkpoints: [
      { label: 'Initial consultation', weight: 0.6 },
      { label: 'Build proposal', weight: 1.0 },
      { label: 'Early mockups', weight: 1.3 },
    ],
    mantra:
      'Every legendary drum starts here — with a story worth building around.',
  },

  /* ------------------------------------------------------------- */
  /* 2. Commitment & Portal Setup                                  */
  /* ------------------------------------------------------------- */
  commitmentPortal: {
    key: 'commitmentPortal',
    label: 'Commitment & Portal Setup',
    storageKeys: ['commitmentPortal'],
    estHours: '1–2 hrs',
    avgDays: '1 day',
    what: `We lock in the proposal, confirm scope and price, then spin up your private SoundLegend portal 
so you can follow along as your drum is built.`,
    why: `Clear commitments protect both of us: you know exactly what you’re getting and when, 
and we can focus fully on building instead of chasing loose ends.`,
    techniques: [
      'Transparent written proposal + approvals',
      'Simple, secure online payment',
      'Customer portal onboarding',
    ],
    tools: [
      'Ober proposal template + line-item notes',
      'Stripe payment + receipts',
      'Project and portal setup in Firestore',
    ],
    risks: [
      'Unclear terms or scope creep later in the build',
      'Missed updates if portal access is not configured correctly',
    ],
    checkpoints: [
      { label: 'Payment processing', weight: 0.3 },
      { label: 'Portal access setup', weight: 0.4 },
    ],
    mantra:
      'Once we both commit, this stops being an idea and starts becoming your drum.',
  },

  /* ------------------------------------------------------------- */
  /* 3. Wood & Vision Lock-In                                      */
  /* ------------------------------------------------------------- */
  woodVision: {
    key: 'woodVision',
    label: 'Wood & Vision Lock-In',
    storageKeys: ['woodVisionLockIn'],
    estHours: '3–5 hrs',
    avgDays: '2–3 days',
    what: `We finalize shell size, stave count, species, and visual direction. 
This is where the personality of the drum is chosen — the “why this drum exists” part.`,
    why: `Wood and proportions are the DNA of a stave shell. Getting this right determines feel under the stick, 
how the drum breathes, and how it sits in a mix.`,
    techniques: [
      'Species comparison (tone, weight, and response)',
      'Stave count + thickness planning',
      'Rough visual mockups & finish direction',
    ],
    tools: [
      'Species library + previous builds',
      'Stave calculator + geometry planning',
      'Sketches / simple digital mockups',
    ],
    risks: [
      'Choosing woods that fight the player’s preferred tuning range',
      'Over-complicating the design at the expense of clarity and tone',
    ],
    checkpoints: [
      { label: 'Wood selection', weight: 1.6 },
      { label: 'Pre-build measuring & prep', weight: 1.9 },
    ],
    mantra:
      'This is where your drum stops being “a snare” and becomes your sound in wood form.',
  },

  /* ------------------------------------------------------------- */
  /* 4. Raw Shell Creation                                         */
  /* ------------------------------------------------------------- */
  rawShell: {
    key: 'rawShell',
    label: 'Raw Shell Creation',
    storageKeys: ['rawShellCreation'],
    estHours: '6–10 hrs',
    avgDays: '3–5 days',
    what: `We turn raw lumber into a true, stable stave shell: cut, bevel, dry-fit, glue, and clamp. 
This is where the drum literally comes into existence.`,
    why: `If the shell isn’t square, tight, and tension-balanced here, no amount of hardware or finish will save it later.`,
    techniques: [
      'Precision cross-cutting and ripping',
      'Bevel cutting with strict angle control',
      'Dry-fit staging before glue-up',
      'Full-surface glue coverage and clamping',
    ],
    tools: [
      'Table saw + cross-cut sleds',
      'Stave bevel jigs',
      'Clamping jigs / CentraLock-style shell clamps',
      'Moisture meter + feeler gauges',
    ],
    risks: [
      'Gaps at joints leading to future cracking',
      'Out-of-round or out-of-square shell',
      'Uneven glue squeeze-out causing weak spots',
    ],
    checkpoints: [
      { label: 'Cut stave blocks to size', weight: 6.4 },
      { label: 'Cut stave bevels', weight: 2.6 },
      { label: 'Pre-glue test (dry-fit)', weight: 0.6 },
      { label: 'Glue-up & clamping', weight: 2.6 },
      { label: 'Glue curing', weight: 0.0 },
      { label: 'Exterior milling setup', weight: 2.6 },
      { label: 'Mill exterior diameter', weight: 1.9 },
      { label: 'Outer bevel reinforcement', weight: 0.9 },
    ],
    mantra:
      'This is the moment a stack of boards turns into a living, breathing shell.',
  },

  /* ------------------------------------------------------------- */
  /* 5. Shell Trueing & Torch Tune                                 */
  /* ------------------------------------------------------------- */
  shellTrueingTorch: {
    key: 'shellTrueingTorch',
    label: 'Shell Trueing & Torch Tune',
    storageKeys: ['shellTrueingTorchTune'],
    estHours: '5–8 hrs',
    avgDays: '3–4 days',
    what: `We true the shell inside and out, finalize thickness, reinforce stress points, 
and perform your Torch Tune process so the shell “rings with intent” before any hardware touches it.`,
    why: `This is where the drum learns how to vibrate. A well-trued shell is easier to tune, 
stays in tune longer, and feels alive at any dynamic.`,
    techniques: [
      'Exterior and interior turning / milling',
      'Target thickness mapping',
      'Bevel reinforcement for stability',
      'Torch Tune resonance pass',
    ],
    tools: [
      'Lathe or router-sled milling systems',
      'Dial indicators / calipers',
      'Burnish wheels + hand sanding blocks',
      'Torch / heat process tools (where appropriate)',
    ],
    risks: [
      'Over-thinning critical areas',
      'Flat spots or ridges in the shell wall',
      'Uneven resonance across the shell',
    ],
    checkpoints: [
      { label: 'Sanding prep (for veneer + interior)', weight: 2.6 },
      { label: 'Interior milling setup', weight: 2.6 },
      { label: 'Mill interior thickness', weight: 2.6 },
      { label: 'Inner bevel reinforcement', weight: 1.0 },
      { label: 'Sanding prep (interior)', weight: 2.6 },
      { label: 'Original torch tune process', weight: 3.0 },
    ],
    mantra:
      'If a drum is going to “just lock in,” it has to learn that language right here.',
  },

  /* ------------------------------------------------------------- */
  /* 6. Exterior Art & Finish                                      */
  /* ------------------------------------------------------------- */
  exteriorArt: {
    key: 'exteriorArt',
    label: 'Exterior Art & Finish',
    storageKeys: ['exteriorArtFinish'],
    estHours: '8–14 hrs',
    avgDays: '7–10 days',
    what: `We apply veneer, resin accents, and finish. This is where the drum starts to look like the piece you imagined —
and where we protect the wood for decades of playing.`,
    why: `Finish is more than looks. It affects how the shell breathes, how the grain moves, 
and how the drum ages on the road and in the studio.`,
    techniques: [
      'Precision veneer fitting and seam work',
      'Acrylic/resin accent fills tied to grain stress points',
      'Multi-stage spray finishing and leveling',
      'Hand sanding and polishing',
    ],
    tools: [
      'Veneer presses / cauls',
      'Resin mixing + application tools',
      'HVLP or equivalent spray system',
      'Sanding blocks, polishing compounds, buffing pads',
    ],
    risks: [
      'Telegraphing seams or bubbles under veneer',
      'Finish sinking or witness lines over time',
      'Over-heavy finish that chokes resonance',
    ],
    checkpoints: [
      { label: 'Veneer application', weight: 5.5 },
      { label: 'Under-spray aesthetic work', weight: 1.3 },
      { label: 'Pre-finish full shell inspection', weight: 1.0 },
      { label: 'Badge + logo work', weight: 3.9 },
      { label: 'Spray finishing', weight: 9.5 },
      { label: 'Full de-gassing of chemicals', weight: 0.0 },
      { label: 'Final sanding', weight: 2.9 },
      { label: 'Polishing', weight: 1.9 },
    ],
    mantra:
      'This is where people start saying “I almost don’t want to play it… almost.”',
  },

  /* ------------------------------------------------------------- */
  /* 7. Edges & Snare Beds                                         */
  /* ------------------------------------------------------------- */
  edgesBeds: {
    key: 'edgesBeds',
    label: 'Edges & Snare Beds',
    storageKeys: ['edgesSnareBeds'],
    estHours: '3–6 hrs',
    avgDays: '1 day',
    what: `We cut and blend bearing edges and snare beds so heads seat perfectly and wires respond crisply at any dynamic.`,
    why: `Edges and beds are where feel, tuning ease, and wire response either shine or fall apart. 
Done well, they make the drum feel like it “just locks in.”`,
    techniques: [
      'Edge profiling and burnishing',
      'Template-guided snare bed routing',
      'Hand blending into the shell profile',
    ],
    tools: [
      'Router table & jigs',
      'Router sled',
      'Feeler gauges',
      'Burnish wheels',
    ],
    risks: [
      'Over-deep beds that choke the drum',
      'Uneven edges creating tuning dead zones',
    ],
    checkpoints: [
      { label: 'Bearing edges', weight: 1.4 },
      { label: 'Snare beds', weight: 1.8 },
    ],
    mantra:
      'This is the thin line between “annoying to tune” and “it just lands where you want it.”',
  },

  /* ------------------------------------------------------------- */
  /* 8. Hardware & Assembly                                        */
  /* ------------------------------------------------------------- */
  hardwareAssembly: {
    key: 'hardwareAssembly',
    label: 'Hardware & Assembly',
    storageKeys: ['hardwareAssembly'],
    estHours: '3–6 hrs',
    avgDays: '2 days',
    what: `We install lugs, hoops, throw, wires, and heads, and torque everything to spec.`,
    why: `Hardware is how you physically interact with the shell. Clean drilling, accurate layout, and solid assembly 
keep the drum quiet, stable, and road-worthy.`,
    techniques: [
      'Template-driven drilling and layout',
      'Incremental bit stepping to avoid tear-out',
      'Sequence-based assembly and torqueing',
    ],
    tools: [
      'Drill press with depth stops',
      'Locating templates and center-finding tools',
      'Torque key / tuning key set',
    ],
    risks: [
      'Misaligned lugs or throw-offs',
      'Tear-out or chip-out around drill holes',
      'Hardware rattle from under-tightened fasteners',
    ],
    checkpoints: [{ label: 'Hardware + head assembly', weight: 7.1 }],
    mantra:
      'This is where the shell gets its armor and becomes a drum built to tour.',
  },

  /* ------------------------------------------------------------- */
  /* 9. Legacy Tuning & Media                                      */
  /* ------------------------------------------------------------- */
  legacyMedia: {
    key: 'legacyMedia',
    label: 'Legacy Tuning & Media',
    storageKeys: ['legacyTuningMedia'],
    estHours: '4–8 hrs',
    avgDays: '3–5 days',
    what: `We run your Legacy resonance analysis, tune the drum to its sweet spots, and capture the story in photos, audio, and NFC authentication.`,
    why: `This is where the drum’s voice is documented and preserved. You’re not just getting a snare — you’re getting a record of how it was born.`,
    techniques: [
      'Frequency-based tuning + touch-based fine-tuning',
      'Multi-mic photo and audio capture',
      'NFC/NTAG programming and verification',
    ],
    tools: [
      'Frequency/tuner apps + reference tones',
      'Studio mics + interface',
      'Camera + lighting setup',
      'NTAG 424 or equivalent NFC tools',
    ],
    risks: [
      'Tuning that doesn’t match player preference or range',
      'Poor documentation that undersells the drum’s voice',
    ],
    checkpoints: [
      { label: 'Legacy resonance analysis', weight: 0.6 },
      { label: 'Legacy tuning', weight: 2.6 },
      { label: 'Professional photos', weight: 10.3 },
      { label: 'Studio Legacy audio', weight: 1.0 },
      { label: 'NTAG authentication', weight: 0.3 },
    ],
    mantra:
      'Here’s where your drum stops being “new gear” and becomes part of your legacy.',
  },

  /* ------------------------------------------------------------- */
  /* 10. Final QA, Packaging & Delivery                            */
  /* ------------------------------------------------------------- */
  finalQa: {
    key: 'finalQa',
    label: 'Final QA, Packaging & Delivery',
    storageKeys: ['finalQAPackagingDelivery'],
    estHours: '2–4 hrs',
    avgDays: '1–2 days',
    what: `We run a final inspection, clean and prep the drum, pack it safely, and confirm delivery so you’re ready to play, record, or tour with confidence.`,
    why: `A great drum deserves a great send-off. This step protects the build, your investment, and the story we’ve built together.`,
    techniques: [
      'Multi-point QC checklist',
      'Final tuning + feel pass',
      'Protective packing tailored to the drum',
    ],
    tools: [
      'Soft cloths and non-abrasive cleaners',
      'Custom packing materials / cases',
      'Shipping labels + tracking system',
    ],
    risks: [
      'Transit damage from under-protected packing',
      'Loose hardware or missed issues slipping through QA',
    ],
    checkpoints: [
      { label: 'Final cleaning', weight: 0.3 },
      { label: 'Packaging', weight: 0.7 },
      { label: 'Delivery confirmation', weight: 0.4 },
    ],
    mantra:
      'The build ends here, but the story really starts the first time you hit it in your space.',
  },
};

/** Ordered list for the roadmap / timeline */
const STEPS = [
  STEP_DEFS.discoveryDesign,
  STEP_DEFS.commitmentPortal,
  STEP_DEFS.woodVision,
  STEP_DEFS.rawShell,
  STEP_DEFS.shellTrueingTorch,
  STEP_DEFS.exteriorArt,
  STEP_DEFS.edgesBeds,
  STEP_DEFS.hardwareAssembly,
  STEP_DEFS.legacyMedia,
  STEP_DEFS.finalQa,
];

/** Normalized time weights (kept for reference if needed later) */
const STEP_WEIGHTS = {
  discoveryDesign: 0.0317,
  commitmentPortal: 0.0076,
  woodVision: 0.0382,
  rawShell: 0.1332,
  shellTrueingTorch: 0.2162,
  exteriorArt: 0.2838,
  edgesBeds: 0.0349,
  hardwareAssembly: 0.0775,
  legacyMedia: 0.1616,
  finalQa: 0.0153,
};

const STAGE_DAY_ESTIMATES = {
  discoveryDesign: 2,
  commitmentPortal: 1,
  woodVision: 3,
  rawShell: 4,
  shellTrueingTorch: 4,
  exteriorArt: 9,
  edgesBeds: 1,
  hardwareAssembly: 2,
  legacyMedia: 5,
  finalQa: 2,
};

/**
 * For storageKeys that are shared across multiple steps (like woodPreparation),
 * only the first step that uses that key will show extra internal checklist
 * items, to avoid repetition.
 */
const PRIMARY_BY_STORAGE_KEY = (() => {
  const map = {};
  STEPS.forEach((step) => {
    (step.storageKeys || []).forEach((key) => {
      if (!map[key]) {
        map[key] = step.key;
      }
    });
  });
  return map;
})();

/* =========================================================
   HELPERS
   ========================================================= */

export function computeStageStatus(step) {
  if (!step || !Array.isArray(step.checklist)) {
    return 'not_started';
  }
  const items = step.checklist;
  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const anyProgress =
    items.some((i) => i.completed) ||
    items.some((i) => (i.totalSeconds ?? 0) > 0);

  if (completedCount === totalCount && totalCount > 0) return 'completed';
  if (anyProgress) return 'in_progress';
  return 'not_started';
}

function displayStatus(status) {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'in progress':
      return 'In Progress';
    default:
      return 'Not Started';
  }
}

function getProjectDocRef(project) {
  if (!project) return null;
  const id =
    project.id ||
    project.projectId ||
    project.docId ||
    project.serial ||
    project.snareSerial ||
    project.lineSerial;
  if (!id) return null;
  return doc(db, 'projects', id);
}

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

const DAY_MS = 24 * 60 * 60 * 1000;

function fmtDate(v) {
  const ms = typeof v === 'number' ? v : tsToMillis(v);
  if (!ms) return null;
  const d = new Date(ms);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function slugify(s = '') {
  return String(s)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Combine checklists across all underlying storage keys for a portal step */
function getCombinedChecklist(project, stepDef) {
  const keys = stepDef.storageKeys || [];
  const items = [];
  keys.forEach((key) => {
    const section = project[key];
    if (section?.checklist && Array.isArray(section.checklist)) {
      section.checklist.forEach((i) => items.push(i));
    }
  });
  return items;
}

/** Determine status of a step based on its combined checklist */
function getStepStatus(project, stepDef) {
  const list = getCombinedChecklist(project, stepDef);
  if (!list.length) return { status: 'Not Started', done: 0, total: 0 };

  const done = list.filter((i) => i && i.completed).length;

  if (done === 0) return { status: 'Not Started', done: 0, total: list.length };
  if (done === list.length)
    return { status: 'Completed', done, total: list.length };
  return { status: 'In Progress', done, total: list.length };
}

/** Any extra checklist items that aren’t part of the curated weighted list */
function getExtraChecklistItems(project, stepDef) {
  const checklist = getCombinedChecklist(project, stepDef);
  if (!checklist.length) return [];

  const isPrimaryForAnyKey = (stepDef.storageKeys || []).some(
    (key) => PRIMARY_BY_STORAGE_KEY[key] === stepDef.key
  );
  if (!isPrimaryForAnyKey) return [];

  const cpSlugs = new Set(
    (stepDef.checkpoints || []).map((cp) => slugify(cp.label))
  );

  return checklist.filter((item) => {
    const taskSlug = slugify(item.label || item.task || '');
    return !cpSlugs.has(taskSlug);
  });
}

/** Percentage completion using the admin util */
function getOverallProgress(project) {
  if (!project) return 0;
  try {
    return Math.round(calculateProjectProgress(project));
  } catch (e) {
    console.error('calculateProjectProgress failed; defaulting to 0', e);
    return 0;
  }
}

/** Derive current step index from currentPhase text if present */
function getCurrentStepIndex(project) {
  if (!project) return 0;
  const phase = String(project.currentPhase || '').toLowerCase();

  if (phase) {
    const idx = STEPS.findIndex((s) =>
      phase.includes(String(s.label).split(' ')[0].toLowerCase())
    );
    if (idx >= 0) return idx;
  }

  // Fallback: last step that has any completed checklist items
  let lastIdx = 0;
  STEPS.forEach((s, i) => {
    const { done } = getStepStatus(project, s);
    if (done > 0) lastIdx = i;
  });
  return lastIdx;
}

/** Stage completion target */
function getStageTargetDate(project, stepKey) {
  if (!project) return null;
  const stepDef = STEP_DEFS[stepKey];
  if (!stepDef) return null;

  const timestamps = [];
  for (const key of stepDef.storageKeys || []) {
    const step = project[key];
    if (!step || !Array.isArray(step.checklist)) continue;
    for (const item of step.checklist) {
      if (item.timestamp || item.completedAt) {
        timestamps.push(tsToMillis(item.timestamp || item.completedAt));
      }
    }
  }

  if (timestamps.length === 0) return null;
  const latest = Math.max(...timestamps);
  const projected = latest + 14 * DAY_MS;
  return fmtDate(projected);
}

/** Target completion window text */
function getTargetWindow(project) {
  if (!project) return null;
  const all = [];

  Object.values(STEP_DEFS).forEach((stepDef) => {
    (stepDef.storageKeys || []).forEach((key) => {
      const step = project[key];
      if (!step || !Array.isArray(step.checklist)) return;
      step.checklist.forEach((item) => {
        if (item.timestamp || item.completedAt) {
          all.push(tsToMillis(item.timestamp || item.completedAt));
        }
      });
    });
  });

  if (all.length === 0) return null;
  const latest = Math.max(...all);
  const early = fmtDate(latest + 14 * DAY_MS);
  const late = fmtDate(latest + 28 * DAY_MS);
  return `${early} → ${late}`;
}

// 🔎 is this checklist item "touched" at all?
const isItemTouched = (item = {}) => {
  const done = !!item.completed;
  const hasCheckpoints =
    Array.isArray(item.checkpointStates) &&
    item.checkpointStates.some(Boolean);
  return done || hasCheckpoints;
};

// 👉 figure out which checklist index is the "active" step
// for a given phase (e.g. 'rawShellCreation')
const getActiveStepIndexForPhase = (project, phaseKey) => {
  const phase = project?.[phaseKey] || {};
  const checklist = Array.isArray(phase.checklist) ? phase.checklist : [];
  if (!checklist.length) return -1;

  // 1) first item with any checkpoints / completion but not fully done
  for (let i = 0; i < checklist.length; i += 1) {
    const item = checklist[i];
    const touched = isItemTouched(item);
    const done = !!item.completed;
    if (touched && !done) return i;
  }

  // 2) otherwise first incomplete item
  for (let i = 0; i < checklist.length; i += 1) {
    if (!checklist[i].completed) return i;
  }

  // 3) everything is done → no active step
  return -1;
};

// 🟢 derive a STATUS CODE for a specific step in a phase
// returns: 'completed' | 'inProgress' | 'notStarted'
const getStepStatusForPhase = (project, phaseKey, stepIndex) => {
  const phase = project?.[phaseKey] || {};
  const checklist = Array.isArray(phase.checklist) ? phase.checklist : [];
  if (!checklist.length || stepIndex < 0 || stepIndex >= checklist.length) {
    return 'notStarted';
  }

  const item = checklist[stepIndex];
  const done = !!item.completed;
  const touched = isItemTouched(item);
  const activeIdx = getActiveStepIndexForPhase(project, phaseKey);

  if (done) return 'completed';
  if (stepIndex === activeIdx && touched) return 'inProgress';
  return 'notStarted';
};

// 🧮 how many checkpoints are completed for this step
const getCheckpointCountsForPhase = (project, phaseKey, stepIndex) => {
  const phase = project?.[phaseKey] || {};
  const checklist = Array.isArray(phase.checklist) ? phase.checklist : [];
  if (!checklist.length || stepIndex < 0 || stepIndex >= checklist.length) {
    return { done: 0, total: 0 };
  }

  const item = checklist[stepIndex];
  const states = Array.isArray(item.checkpointStates)
    ? item.checkpointStates
    : [];

  const done = states.filter(Boolean).length;
  const total = states.length;
  return { done, total };
};


/* =========================================================
   LIFECYCLE STAGE → STEP → CHECKPOINT TEMPLATE
   (Labels / ordering only; completion comes from Firestore)
   ========================================================= */

const STAGE_TEMPLATES = {
  discoveryDesign: {
    steps: [
      {
        key: 'initialConsultation',
        label: 'Initial consultation',
        checkpoints: [
          'Capture drummer goals (genres, feel, tonal preferences)',
          'Capture ergonomic considerations (arthritis, hand fatigue, stick choice)',
          'Confirm drum size preference (diameter / depth)',
          'Confirm visual tone / finish direction',
          'Determine tuning goals (LegacyPrint window)',
          'Confirm budget & timeline',
        ],
      },
      {
        key: 'buildProposal',
        label: 'Build proposal',
        checkpoints: [
          'Generate full written build spec',
          'Select primary wood species',
          'Select secondary species if hybrid',
          'Determine stave count',
          'Determine shell thickness target',
          'Determine veneer choice',
          'Determine hardware finish (chrome / black nickel / brass)',
          'Determine lug style (vintage tube)',
          'Confirm hoop type is diecast',
          'Determine bearing edge profile',
          'Determine snare bed style',
          'Generate mockup previews (if applicable)',
        ],
      },
      {
        key: 'earlyMockups',
        label: 'Early mockups',
        checkpoints: [
          'Create first-round visual mockups (finish / veneer / hardware)',
          'Explore 2–3 finish concepts with different accents',
          'Mock up badge placement and logo treatments',
          'Prepare quick write-up explaining each option',
          'Share mockups with customer for feedback',
          'Capture revision notes for chosen direction',
        ],
      },
    ],
  },

  commitmentPortal: {
    steps: [
      {
        key: 'paymentProcessing',
        label: 'Payment processing',
        checkpoints: [
          'Invoice sent to customer',
          'Deposit received / payment confirmed',
          'Order status updated to “In Progress”',
        ],
      },
      {
        key: 'portalAccess',
        label: 'Portal access setup',
        checkpoints: [
          'Create customer portal record',
          'Link project to SoundLegend dashboard',
          'Send welcome email with portal link',
          'Confirm customer can log in successfully',
        ],
      },
    ],
  },

  woodVision: {
    steps: [
      {
        key: 'woodSelection',
        label: 'Wood selection',
        checkpoints: [
          'Select raw boards for shell',
          'Check moisture content (MC% reading)',
          'Verify grain direction for musicality and strength',
          'Inspect knots and natural stress lines for resin fill opportunities',
          'Estimate pre-cut length for each board',
          'Optionally review and approve wood set with customer',
          'Record board length',
          'Record board width',
          'Record board thickness',
          'Record moisture reading (%)',
        ],
      },
      {
        key: 'preBuildMeasuring',
        label: 'Pre-build measuring & prep',
        checkpoints: [
          'Veneer integration test (visual + adhesion plan)',
          'Shell color test under natural light',
          'Shell color test with flash / studio light',
          'Acrylic color swatch review against veneer',
          'Logo badge placement test (mock or tape-on)',
          'Send mockups / visuals to customer',
        ],
      },
    ],
  },

  rawShell: {
    steps: [
      {
        key: 'cutStaveBevels',
        label: 'Cut stave bevels',
        checkpoints: [
          'Confirm grain orientation for each stave block',
          'Ensure all staves are uniform in dimension',
          'Inspect each block for defects, cracks, or voids',
          'Measure block length',
          'Measure block width',
          'Measure block thickness',
        ],
      },
      {
        key: 'preGlueTest',
        label: 'Pre-glue test (dry-fit)',
        checkpoints: [
          'Inspect for tear-out after bevel cuts',
          'Test fit two or more staves for perfect mating joints',
          'Measure bevel angle accuracy (e.g., 9° or 10°)',
          'Compare width of inner vs outer face to expected values',
        ],
      },
      {
        key: 'glueUpClamping',
        label: 'Glue-up & clamping',
        checkpoints: [
          'Perform full dry-fit circle test',
          'Check gaps between staves visually and by feel',
          'Check roundness variance with calipers or jig',
          'Measure out-of-round (target ±0.03")',
          'Evaluate joint tightness at multiple points',
        ],
      },
      {
        key: 'glueCuring',
        label: 'Glue curing',
        checkpoints: [
          'Confirm minimum cure time has been met',
          'Remove shell from clamps carefully',
          'Perform visual inspection of all glue joints',
        ],
      },
      {
        key: 'exteriorMillingSetup',
        label: 'Exterior milling setup',
        checkpoints: [
          'Verify exterior milling sled or lathe jig is square and secure',
          'Confirm shell is centered in jig with even overhang',
          'Set cutter/router bit height for safe first pass',
          'Run a light test pass to check for chatter or vibration',
        ],
      },
      {
        key: 'millExteriorDiameter',
        label: 'Mill exterior diameter',
        checkpoints: [
          'Take multiple shallow passes to reach target diameter',
          'Check diameter at 12 / 3 / 6 / 9 o’clock positions',
          'Confirm roundness tolerance is within spec',
          'Inspect exterior surface for tool marks or tear-out',
        ],
      },
      {
        key: 'outerBevelReinforcement',
        label: 'Outer bevel reinforcement',
        checkpoints: [
          'Apply thin CA or epoxy to outer bevel region',
          'Confirm adhesive wicks evenly along all joints',
          'Sand back reinforcement to a clean, smooth surface',
          'Re-check for micro gaps or hairline cracks',
        ],
      },
    ],
  },

  shellTrueingTorch: {
    steps: [
      {
        key: 'sandingPrepExteriorInterior',
        label: 'Sanding prep (for veneer + interior)',
        checkpoints: [
          'Perform 80–120 grit exterior prep',
          'Remove high spots or ridges on exterior',
          'Ensure shell is ready for interior jig / next process',
          'Perform 120–220 grit interior smoothing',
          'Micro-inspect all joints on interior surface',
          'Confirm shell is ready for torching and veneer',
        ],
      },
      {
        key: 'interiorMillingSetup',
        label: 'Interior milling setup',
        checkpoints: [
          'Verify interior sled / jig alignment',
          'Set interior cutter height and depth of cut',
          'Index shell correctly on interior jig',
        ],
      },
      {
        key: 'millInteriorThickness',
        label: 'Mill interior thickness',
        checkpoints: [
          'Inspect shell exterior for smoothness after passes',
          'Confirm glue lines are exposed and visible',
          'Measure final exterior diameter (e.g., 14.000")',
          'Check roundness accuracy with calipers / jig',
          'Measure outer wall thickness at multiple points',
        ],
      },
      {
        key: 'innerBevelReinforcement',
        label: 'Inner bevel reinforcement',
        checkpoints: [
          'Inspect interior surface for smoothness',
          'Confirm no significant tear-out on interior',
          'Measure interior diameter',
          'Measure final shell thickness at top',
          'Measure final shell thickness at mid-shell',
          'Measure final shell thickness at bottom',
          'Check inner roundness variance',
        ],
      },
      {
        key: 'sandingPrepInterior',
        label: 'Sanding prep (interior)',
        checkpoints: [
          'Apply thin CA glue to outer bevel region',
          'Inspect penetration of CA along joints',
          'Sand back outer bevel to clean, smooth surface',
          'Apply thin CA glue to inner bevel region',
          'Confirm even penetration along inner joints',
          'Sand back inner bevel smooth after cure',
        ],
      },
      {
        key: 'originalTorchTune',
        label: 'Original torch tune process',
        checkpoints: [
          'Ensure flame pattern is even around shell',
          'Verify grain “pop” without overburning',
          'Confirm no burn-through or structural damage',
        ],
      },
    ],
  },

  exteriorArt: {
    steps: [
      {
        key: 'veneerApplication',
        label: 'Veneer application',
        checkpoints: [
          'Verify contact cement coverage on shell and veneer',
          'Roll veneer onto shell with even pressure',
          'Check for bubbles or trapped air',
          'Confirm seam is tight and effectively invisible',
          'Measure veneer thickness',
          'Confirm veneer seam alignment to design plan',
          'Observe any veneer creep or slippage after set time',
        ],
      },
      {
        key: 'underSprayWork',
        label: 'Under-spray aesthetic work',
        checkpoints: [
          'Place acrylic fills in natural stress lines (not random streaks)',
          'Balance torch accents with overall design',
          'Confirm CA injections are level and clear',
          'Sand shell to 320–400 grit before finish',
        ],
      },
      {
        key: 'preFinishInspection',
        label: 'Pre-finish full shell inspection',
        checkpoints: [
          'Verify shell is perfectly smooth to the touch',
          'Confirm no veneer overhang at edges',
          'Remove all surface dust and debris',
          'Mask edges as needed before spray',
        ],
      },
      {
        key: 'badgeLogoWork',
        label: 'Badge + logo work',
        checkpoints: [
          'Align outer badge at correct vertical and rotational position',
          'Place inner badge in correct location',
          'Confirm adhesives or fasteners have set properly',
        ],
      },
      {
        key: 'sprayFinishing',
        label: 'Spray finishing',
        checkpoints: [
          'Spray even, controlled coats (no heavy spots)',
          'Check flashing between coats and eliminate as needed',
          'Minimize orange peel through gun settings and technique',
          'Respect cure time between coats before next application',
          'Measure approximate finish thickness (multi-coat build)',
          'Visually inspect surface reflection consistency',
        ],
      },
      {
        key: 'fullDegassing',
        label: 'Full de-gassing of chemicals',
        checkpoints: [
          'Place shell in dust-controlled area for final cure',
          'Observe finish for shrink-back or witness lines during cure',
          'Respect manufacturer’s full de-gassing / off-gassing time',
          'Confirm finish is fully hardened before level sanding',
        ],
      },
      {
        key: 'finalSanding',
        label: 'Final sanding',
        checkpoints: [
          'Level sand to remove minor orange peel and dust nibs',
          'Avoid sanding through veneer or color coats',
          'Inspect surface under raking light for flatness and defects',
        ],
      },
      {
        key: 'polishing',
        label: 'Polishing',
        checkpoints: [
          'Buff shell to final gloss or satin sheen',
          'Check reflections for waves or swirl marks',
          'Clean compound residue from edges and hardware zones',
        ],
      },
    ],
  },

  edgesBeds: {
    steps: [
      {
        key: 'bearingEdges',
        label: 'Bearing edges',
        checkpoints: [
          'Balance inner and outer edge profiles',
          'Confirm 45° cutting surface with intended roundover',
          'Inspect for chatter marks or tool marks',
          'Measure edge height relative to shell',
          'Inspect contact point profile around full circle',
          'Evaluate cutting surface smoothness',
        ],
      },
      {
        key: 'snareBeds',
        label: 'Snare beds',
        checkpoints: [
          'Confirm left / right bed symmetry',
          'Check smooth transitions into and out of snare beds',
          'Measure bed depth',
          'Measure bed width',
          'Measure bed taper / ramp profile',
        ],
      },
    ],
  },

  hardwareAssembly: {
    steps: [
      {
        key: 'hardwareHeadAssembly',
        label: 'Hardware + head assembly',
        checkpoints: [
          'Install all lugs with correct hardware',
          'Install throw-off at correct height and angle',
          'Install butt plate aligned with throw-off',
          'Install vent grommet',
          'Verify all components sit flush and solid',
          'Install hoops and heads with correct orientation',
          'Install snare wires and confirm center alignment',
          'Confirm no rattles or loose components',
          'Check snare throw action for smooth travel',
          'Verify even head seating all around',
          'Check lug alignment relative to hoops',
          'Confirm shell-to-hoop parallelism',
          'Confirm adequate tension rod travel and feel',
          'Verify snare throw alignment with beds and wires',
        ],
      },
    ],
  },

  legacyMedia: {
    steps: [
      {
        key: 'legacyResonanceAnalysis',
        label: 'Legacy resonance analysis',
        checkpoints: [
          'Capture fundamental pitch (3-hit average)',
          'Identify low sweet spot',
          'Identify Legacy sweet spot',
          'Identify high sweet spot',
          'Note harmonic multiples',
          'Evaluate overtone suppression / control score',
        ],
      },
      {
        key: 'legacyTuning',
        label: 'Legacy tuning',
        checkpoints: [
          'Evaluate sustain at various tunings',
          'Check overtones across the tuning range',
          'Test dynamic response from soft to loud',
          'Measure Hz at each lug (where applicable)',
          'Define target LegacyPrint window',
          'Document adjacent-low tuning reference',
          'Document adjacent-high tuning reference',
        ],
      },
      {
        key: 'professionalPhotos',
        label: 'Professional photos',
        checkpoints: [
          'Capture hero shot',
          'Capture left-angle shot',
          'Capture right-angle shot',
          'Capture top-down hoop shot',
          'Capture close-up badge shot',
          'Capture texture macro shot',
          'Capture 360 vertical standing series',
          'Capture 360 flat / horizontal series',
        ],
      },
      {
        key: 'studioLegacyAudio',
        label: 'Studio Legacy audio',
        checkpoints: [
          'Record loose tuning examples',
          'Record medium tuning examples',
          'Record tight tuning examples',
          'Record adjacent-high tuning example',
          'Record cross-stick samples',
          'Record ghost-note swells and dynamic phrases',
        ],
      },
    ],
  },

  finalQa: {
    steps: [
      {
        key: 'ntagAuthentication',
        label: 'NTAG authentication',
        checkpoints: [
          'Capture NFC chip UID',
          'Create or update Firestore entry for tag',
          'Link tag record to correct project',
          'Verify Legacy page URL is correctly linked',
          'Test scan on iPhone',
          'Test scan on Android',
        ],
      },
      {
        key: 'finalCleaning',
        label: 'Final cleaning',
        checkpoints: [
          'Remove fingerprints and smudges from shell and hardware',
          'Polish hoops and hardware to final shine',
          'Confirm snare wire alignment and tension range',
          'Inspect shell under studio light for finish defects',
          'Perform final structural check (shell, edges, hardware)',
          'Perform final sound check and Vault verification',
        ],
      },
      {
        key: 'packaging',
        label: 'Packaging',
        checkpoints: [
          'Apply inner wrap / protective layer to drum',
          'Add moisture barrier as needed',
          'Add cushioning around shell, hoops, and hardware',
          'Insert folder with personalized thank-you letter',
          'Insert folder with Legacy tuning analysis',
          'Insert folder with care instructions',
          'Insert folder with branding tag or collateral',
          'Apply external box branding',
          'Apply shipping label, insurance, and signature required',
        ],
      },
      {
        key: 'deliveryConfirmation',
        label: 'Delivery confirmation',
        checkpoints: [
          'Schedule reveal date or follow-up session if desired',
        ],
      },
    ],
  },
};

/* =========================================================
   STAGE CHECKPOINTS PANEL
   ========================================================= */

const StageCheckpointsPanel = ({ project, stageKey }) => {
  if (!project) return null;

  const template = STAGE_TEMPLATES[stageKey];
  if (!template) return null;

  // 🔑 Find the underlying Firestore section for this stage.
  // e.g. stageKey "rawShell" → STEP_DEFS.rawShell.storageKeys[0] = "rawShellCreation"
  const meta = STEP_DEFS[stageKey];
  const primaryStorageKey = meta?.storageKeys?.[0];
  const section = primaryStorageKey ? project[primaryStorageKey] : null;
  const checklist = Array.isArray(section?.checklist) ? section.checklist : [];

  // Map template steps → align with checklist items + checkpointStates
  const normalizedSteps = template.steps.map((tplStep, stepIndex) => {
    // Each stage step (e.g. "Cut stave blocks to size") corresponds to one
    // checklist item in the admin modal, in order.
    const checklistItem = checklist[stepIndex] || {};
    const states = Array.isArray(checklistItem.checkpointStates)
      ? checklistItem.checkpointStates
      : [];

    const checkpoints = (tplStep.checkpoints || []).map((cpLabel, cpIndex) => ({
      id: `${tplStep.key}_cp_${cpIndex}`,
      label: cpLabel,                // always show template label
      completed: !!states[cpIndex],  // ✅ completion from checkpointStates
    }));

    return {
      id: checklistItem.id || tplStep.key,
      label: tplStep.label,
      order: stepIndex + 1,
      checkpoints,
    };
  });

  // sort by explicit order, fallback to index
  normalizedSteps.sort((a, b) => (a.order || 0) - (b.order || 0));

  // ---------- single-open accordion state ----------
  const [openStepId, setOpenStepId] = useState(
    () => normalizedSteps[0]?.id || null
  );

  // When the stage or project changes, default to first step open
  useEffect(() => {
    const firstId = normalizedSteps[0]?.id || null;
    setOpenStepId(firstId);
  }, [stageKey, project?.id]);

  const toggleStep = (stepId) => {
    setOpenStepId((prev) => (prev === stepId ? null : stepId));
  };

  const summarizeStep = (step) => {
    const cps = step.checkpoints || [];
    const total = cps.length;
    const done = cps.filter((c) => c.completed).length;

    let status = 'NOT STARTED';
    if (done > 0 && done < total) status = 'IN PROGRESS';
    if (done === total && total > 0) status = 'COMPLETED';

    return { total, done, status };
  };

  const statusClass = (status) => {
    if (status === 'COMPLETED') return 'pill-complete';
    if (status === 'IN PROGRESS') return 'pill-progress';
    return 'pill-pending';
  };

  return (
    <div className="pp-stage-card">
      <h4 className="pp-section-title">Stage checkpoints</h4>

      <div className="pp-step-list">
        {normalizedSteps.map((step) => {
          const { total, done, status } = summarizeStep(step);
          const isOpen = openStepId === step.id;

          return (
            <div
              key={step.id}
              className={`pp-step-block step-${status
                .toLowerCase()
                .replace(' ', '-')}`}
            >
              {/* Step header (e.g. "Cut stave blocks to size") */}
              <button
                type="button"
                className="pp-step-header slp-pp-step-header"
                data-context="project-progress-step-header"
                onClick={() => toggleStep(step.id)}
              >
                <div className="pp-step-header-main">
                  <span className="pp-step-title">{step.label}</span>
                  <span className="pp-step-count">
                    {done}/{total} checkpoints
                  </span>
                </div>

                <span
                  className={`pp-step-status pill ${statusClass(status)}`}
                >
                  {status}
                </span>

                <span
                  className={`pp-step-chevron ${isOpen ? 'open' : ''}`}
                  aria-hidden="true"
                >
                  ▾
                </span>
              </button>

              {/* Step checkpoints (internal tasks) */}
              {isOpen && (
                <div className="pp-checkpoint-list grouped">
                  {step.checkpoints.map((cp) => (
                    <div key={cp.id} className="pp-checkpoint-row">
                      <div className="pp-checkpoint-main">
                        <span
                          className={`pp-checkpoint-icon ${
                            cp.completed ? 'is-completed' : ''
                          }`}
                          aria-hidden="true"
                        >
                          {cp.completed ? '✓' : ''}
                        </span>
                        <span
                          className={`pp-checkpoint-label ${
                            cp.completed ? 'is-completed' : ''
                          }`}
                        >
                          {cp.label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* =========================================================
   COMPONENT
   ========================================================= */

const ProjectProgress = ({ project: initialProject }) => {
  const [project, setProject] = useState(initialProject || null);
  const [loading, setLoading] = useState(!initialProject);
  const [activeKey, setActiveKey] = useState(STEPS[0].key);

  // keep in sync if parent passes updated project
  useEffect(() => {
    if (initialProject) {
      setProject(initialProject);
    }
  }, [initialProject]);

  // fetch freshest data from Firestore if we can
  useEffect(() => {
    const ref = getProjectDocRef(initialProject);
    if (!ref) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    (async () => {
      try {
        const snap = await getDoc(ref);
        if (snap.exists() && isMounted) {
          setProject({ id: snap.id, ...snap.data() });
        }
      } catch (e) {
        console.error('Failed to refresh project for ProjectProgress', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [initialProject]);

  const overallPct = useMemo(() => getOverallProgress(project), [project]);
  const currentStepIndex = useMemo(
    () => getCurrentStepIndex(project),
    [project]
  );

  // default active step = current step
  useEffect(() => {
    const def = STEPS[currentStepIndex] || STEPS[0];
    setActiveKey(def.key);
  }, [currentStepIndex]);

  const activeStep = STEPS.find((s) => s.key === activeKey) || STEPS[0];
  const activeStatus = getStepStatus(project, activeStep).status.toLowerCase();

  const targetWindow = useMemo(() => getTargetWindow(project), [project]);
  const stageTarget = useMemo(
    () => getStageTargetDate(project, activeStep.key),
    [project, activeStep]
  );

  const heroMedia = useMemo(
    () => ({ type: 'video', url: CRAFT_VIDEO }),
    []
  );

  if (loading && !project) {
    return (
      <div className="sl-progress sl-progress--loading">
        <p>Loading project progress…</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="sl-progress sl-progress--empty">
        <p>Project not found.</p>
      </div>
    );
  }

  const activeIndex = STEPS.indexOf(activeStep);
  const isStageLocked =
    activeStatus === 'not started' && activeIndex > currentStepIndex;

  return (
    <div className="sl-progress">
      {/* Hero media */}
      <div className="sl-progress-hero">
        {heroMedia.type === 'video' ? (
          <video
            className="sl-progress-hero-video"
            src={heroMedia.url}
            autoPlay
            loop
            muted
            playsInline
          />
        ) : null}
        <button className="sl-progress-hero-pill">Craft in Motion</button>
      </div>

      <section className="sl-progress-intro">
        <p className="sl-progress-intro-text">
          A glimpse into the Ober Artisan process — you’ll see more
          behind-the-scenes clips and photos as your drum moves through each
          step.
        </p>
      </section>

      {/* Top metrics */}
      <section className="sl-progress-metrics">
        <div className="sl-progress-metric">
          <div className="sl-progress-metric-label">Project Completion</div>
          <div className="sl-progress-metric-value">{overallPct}%</div>
        </div>

        <div className="sl-progress-metric">
          <div className="sl-progress-metric-label">Current Step</div>
          <div className="sl-progress-metric-value">
            {STEPS.indexOf(activeStep) + 1}. {activeStep.label}
          </div>
        </div>

        <div className="sl-progress-metric">
          <div className="sl-progress-metric-label">
            Target Completion Window
          </div>
          <div className="sl-progress-metric-value">
            {targetWindow || 'TBD'}
          </div>
        </div>
      </section>

      {/* Roadmap timeline */}
      <section className="sl-progress-roadmap">
        <div className="sl-progress-roadmap-header">Build Roadmap</div>

        <div className="sl-progress-roadmap-track">
          <div
            className="sl-progress-roadmap-track-fill"
            style={{
              width:
                ((currentStepIndex + 0.0001) /
                  Math.max(1, STEPS.length - 1)) *
                  100 + '%',
            }}
          />
        </div>

        {isStageLocked && (
          <div className="sl-progress-stage-locknote">
            Future stages unlock as we reach them — part of building this
            SoundLegend drum together, one focused step at a time.
          </div>
        )}

        <div className="sl-progress-roadmap-steps">
          {STEPS.map((step, index) => {
            const stepStatus = getStepStatus(
              project,
              step
            ).status.toLowerCase();
            const isCurrent = step.key === activeStep.key;

            const isCompleted =
              stepStatus === 'completed' || index < currentStepIndex;

            const isLocked =
              stepStatus === 'not started' && index > currentStepIndex;

            const className = [
              'sl-progress-step-dot',
              isCurrent ? 'is-current' : '',
              isCompleted ? 'is-completed' : '',
              isLocked ? 'is-locked' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <button
                key={step.key}
                type="button"
                className={className}
                disabled={isLocked}
                onClick={() => {
                  if (isLocked) return;
                  setActiveKey(step.key);
                }}
              >
                <span className="sl-progress-step-number">{index + 1}</span>
                <span className="sl-progress-step-label">{step.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Active step details */}
      <section
        className={['sl-progress-stage', isStageLocked ? 'is-locked' : '']
          .filter(Boolean)
          .join(' ')}
      >
        <header className="sl-progress-stage-header">
          <div className="sl-progress-stage-header-main">
            <h2 className="sl-progress-stage-title">
              {STEPS.indexOf(activeStep) + 1}. {activeStep.label}
            </h2>
            <div
              className={[
                'sl-progress-stage-status-pill',
                activeStatus === 'completed'
                  ? 'is-completed'
                  : activeStatus === 'in progress'
                  ? 'is-inprogress'
                  : 'is-notstarted',
              ].join(' ')}
            >
              {displayStatus(activeStatus)}
            </div>
          </div>
        </header>

        {/* Stage stats row */}
        <div className="sl-progress-stage-stats">
          <div className="sl-progress-stage-stat">
            <div className="sl-progress-stage-stat-label">
              Est. Time (focused hours)
            </div>
            <div className="sl-progress-stage-stat-value">
              {activeStep.estHours}
            </div>
          </div>

          <div className="sl-progress-stage-stat">
            <div className="sl-progress-stage-stat-label">
              Avg. Turnaround (calendar days)
            </div>
            <div className="sl-progress-stage-stat-value">
              {activeStep.avgDays}
            </div>
          </div>

          <div className="sl-progress-stage-stat">
            <div className="sl-progress-stage-stat-label">
              Stage Completion Target
            </div>
            <div className="sl-progress-stage-stat-value">
              {stageTarget || 'TBD'}
            </div>
          </div>
        </div>

        {/* Two-column content */}
        <div className="sl-progress-stage-body">
          {/* LEFT: narrative + checkpoints */}
          <div className="sl-progress-stage-col">
            <div className="sl-progress-card">
              <h3 className="sl-progress-card-title">What we do</h3>
              <p className="sl-progress-card-text">{activeStep.what}</p>
            </div>

            <div className="sl-progress-card">
              <h3 className="sl-progress-card-title">Why it matters</h3>
              <p className="sl-progress-card-text">{activeStep.why}</p>
            </div>

            {/* Stage checkpoints (grouped by step, with expand/collapse) */}
            <StageCheckpointsPanel project={project} stageKey={activeStep.key} />
          </div>

          {/* RIGHT: techniques / tools + mantra */}
          <div className="sl-progress-stage-col">
            <div className="sl-progress-card">
              <h3 className="sl-progress-card-title">Techniques used</h3>
              <div className="sl-progress-pill-row">
                {activeStep.techniques.map((t) => (
                  <span key={t} className="sl-progress-pill">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="sl-progress-card">
              <h3 className="sl-progress-card-title">Tools involved</h3>
              <div className="sl-progress-pill-row">
                {activeStep.tools.map((t) => (
                  <span key={t} className="sl-progress-pill">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="sl-progress-card sl-progress-card--quote">
              <div className="sl-progress-quote-icon">★</div>
              <p className="sl-progress-quote-text">
                {activeStep.mantra ||
                  'The difference between “pretty on paper” and “just locks in” lives inside the details of this step.'}
              </p>
            </div>
          </div>
        </div>

        {/* Placeholder for “files for this step” */}
        <footer className="sl-progress-stage-footer">
          <p className="sl-progress-stage-files">
            Files for this step will appear here as we add photos, audio, and
            PDFs.
          </p>
        </footer>
      </section>
    </div>
  );
};

export default ProjectProgress;