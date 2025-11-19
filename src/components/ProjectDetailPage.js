import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { calculateProjectProgress } from '../utils/calculateProjectProgress';
import './ProjectDetailPage.css';

// --- tiny utils ---
function fmtDateRange(d1, d2) {
  const f = (d) =>
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${f(d1)} – ${f(d2)}`;
}
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
const hours = (min, max) => ({ min, max });

// ---- VAULT PRIVACY FALLBACKS ----
const LEGACY_PRIVATE_TEXT = '<p>Legacy is set to Private.</p>'; // alt: use 'Legacy Unknown.' if preferred
const LEGACY_UNKNOWN_TEXT = '<p>Legacy Unknown.</p>';

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  // ---------- state ----------
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  const [uploadedFiles, setUploadedFiles] = useState({});
  const [modalPreview, setModalPreview] = useState(null);
  const [isPreviewLoaded, setIsPreviewLoaded] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // NEW: Vault privacy local state
  const [publicPrefs, setPublicPrefs] = useState({
    showName: false,
    showStory: false,
    displayName: '',
    storyHtml: '',
  });

  // ---------- static config ----------
  const stepWeights = {
    woodPreparation: 0.05,
    shellConstruction: 0.2,
    fineTuning: 0.1,
    shellExteriorFinish: 0.2,
    bearingEdges: 0.1,
    snareBedCutting: 0.1,
    hardwareDrilling: 0.1,
    hardwareAssembly: 0.05,
    tuningAndDetailing: 0.05,
    qualityCheck: 0.05,
  };

  const allFileSections = [
    'build_proposal',
    'wood_selection',
    'early_mockups_(pre-production)',
    'stave_construction_(pre-milling)',
    'stave_construction_(post-milling)',
    'final_mockups_(mid-production)',
    'media_files_(audio/video)',
    'other',
  ];

  const STEP_ORDER = [
    'woodPreparation',
    'shellConstruction',
    'fineTuning',
    'shellExteriorFinish',
    'bearingEdges',
    'snareBedCutting',
    'hardwareDrilling',
    'hardwareAssembly',
    'tuningAndDetailing',
    'qualityCheck',
  ];

  const TOOL_LIBRARY = {
    'Moisture meter': {
      img: '/tools/moisture-meter.jpg',
      desc: 'Checks wood moisture to prevent movement.',
    },
    'Jointer & planer': {
      img: '/tools/jointer-planer.jpg',
      desc: 'True faces & thickness boards.',
    },
    Calipers: {
      img: '/tools/calipers.jpg',
      desc: 'Measure diameters & thickness precisely.',
    },
    Clamps: {
      img: '/tools/clamps.jpg',
      desc: 'Even pressure during glue-ups.',
    },
    'Table saw + bevel sled': {
      img: '/tools/table-saw.jpg',
      desc: 'Accurate stave bevels/angles.',
    },
    'Clamping forms': {
      img: '/tools/forms.jpg',
      desc: 'Keeps shells round while curing.',
    },
    'Dial calipers': {
      img: '/tools/calipers.jpg',
      desc: 'Verify roundness & diameters.',
    },
    'Lathe/drum sander': {
      img: '/tools/lathe.jpg',
      desc: 'True faces & profile thickness.',
    },
    'Dial indicator': {
      img: '/tools/dial-indicator.jpg',
      desc: 'Read tiny deviations for trueness.',
    },
    'Sanding blocks': {
      img: '/tools/sanding-blocks.jpg',
      desc: 'Controlled surface refinement.',
    },
    'HVLP sprayer': {
      img: '/tools/hvlp.jpg',
      desc: 'Thin, even finish coats.',
    },
    'Polishing system': {
      img: '/tools/polish.jpg',
      desc: 'Level & bring sheen to spec.',
    },
    'Viscosity cups': {
      img: '/tools/cup.jpg',
      desc: 'Consistent finish flow rates.',
    },
    'Router table & jigs': {
      img: '/tools/router.jpg',
      desc: 'Cut bearing edges/snare beds.',
    },
    Files: { img: '/tools/files.jpg', desc: 'Refine edges & holes.' },
    'Burnish wheels': {
      img: '/tools/burnish.jpg',
      desc: 'Silky head glide on edges.',
    },
    'Router sled': {
      img: '/tools/router-sled.jpg',
      desc: 'Even bed depth & transitions.',
    },
    'Feeler gauges': {
      img: '/tools/feeler.jpg',
      desc: 'Verify bed clearance.',
    },
    'Blocks & abrasives': {
      img: '/tools/blocks.jpg',
      desc: 'Blend profiles cleanly.',
    },
    'Drill press + jigs': {
      img: '/tools/drill-press.jpg',
      desc: 'Aligned hardware holes.',
    },
    'Step bits': {
      img: '/tools/step-bit.jpg',
      desc: 'Clean, tear-out-free drilling.',
    },
    'Layout templates': {
      img: '/tools/templates.jpg',
      desc: 'Repeatable placements.',
    },
    'Torque drivers': {
      img: '/tools/driver.jpg',
      desc: 'Even, repeatable torque.',
    },
    'Soft jaws': {
      img: '/tools/soft-jaws.jpg',
      desc: 'Protect finish/hardware.',
    },
    'Thread treatments': {
      img: '/tools/thread.jpg',
      desc: 'Quiet, stable hardware.',
    },
    'Tension gauge': { img: '/tools/tension.jpg', desc: 'Check lug balance.' },
    'Reference tuner': { img: '/tools/tuner.jpg', desc: 'Set target pitches.' },
    Straightedges: {
      img: '/tools/straightedge.jpg',
      desc: 'Confirm flatness/edges.',
    },
    'Reference mic': { img: '/tools/mic.jpg', desc: 'QC audio checks.' },
    Monitors: {
      img: '/tools/monitors.jpg',
      desc: 'Listen for rattles/buzzes.',
    },
    'Inspection lights': {
      img: '/tools/light.jpg',
      desc: 'Reveal finish defects.',
    },
  };

  const STEP_EDU = {
    /*
     * STEP 1 — WOOD PREPARATION
     * Maps to master process:
     * 1.1 Initial Consultation
     * 1.2 Build Proposal
     * 1.3 Payment Processing
     * 1.4 Portal Access Setup
     * 1.5 Wood Selection
     * 1.6 Early Mockups
     * 1.7 Pre-Build Measuring & Prep
     */
    woodPreparation: {
      title: 'Wood Preparation',
      what: 'Everything that happens before the first cut: consultation, written build proposal, payment, portal setup, wood selection, early mockups, and pre-build measurements so the shell is engineered on paper before it’s built in wood.',
      why: 'A drum that feels “meant for you” starts here. Getting size, ergonomics, tuning goals, finish direction, and budget correct on day one prevents painful surprises later and lets every downstream step support your voice.',
      techniques: [
        'Artist consultation & goal mapping',
        'Build spec & proposal drafting',
        'SoundLegend portal + dashboard setup',
        'Board selection & moisture testing',
        'Early veneer / finish mockups',
        'Pre-build dimensional planning',
      ],
      tools: ['Moisture meter', 'Jointer & planer', 'Calipers', 'Clamps'],
      qc: [
        'Genres, feel, and tonal goals captured',
        'Ergonomic needs (arthritis, fatigue, stick choice) noted',
        'Diameter & depth agreed and logged',
        'LegacyPrint tuning window defined',
        'Budget & turnaround confirmed',
        'Boards selected, MC% in target range',
        'Mockups / finish direction approved',
      ],
      risks: [
        'Unclear goals → wrong shell or tuning window',
        'Incorrect diameter/depth → ergonomic issues',
        'Poor wood selection → movement or instability later',
        'Portal not set up → poor communication down the line',
      ],
      time: hours(3, 10),
      value:
        'You’re not buying a stock drum — you’re commissioning a tailored instrument. This step makes sure the build, sound, and look are all aimed at you before tools ever touch wood.',
    },

    /*
     * STEP 2 — SHELL CONSTRUCTION
     * Maps to master process:
     * 2.1 Cut Stave Blocks to Size
     * 2.2 Cut Stave Bevels
     * 2.3 Pre-Glue Test
     * 2.4 Glue-Up & Clamping
     * 2.5 Glue Curing
     */
    shellConstruction: {
      title: 'Shell Construction',
      what: 'Cut stave blocks to size, establish bevels, dry-fit, glue, clamp, and cure the raw shell into a single, stable body that will become your drum.',
      why: 'If the shell isn’t structurally perfect, nothing downstream can truly fix it. Consistent staves, clean joints, and a stable glue-up are what allow the drum to stay round, tune easily, and last a lifetime.',
      techniques: [
        'Block sizing & grain orientation',
        'Precision bevel cutting',
        'Dry-fit circle & gap testing',
        'Timed glue spread & clamp sequence',
        'Cure-time and joint inspection',
      ],
      tools: [
        'Table saw + bevel sled',
        'Clamping forms',
        'Dial calipers',
        'Clamps',
      ],
      qc: [
        'Blocks uniform in length/width/thickness',
        'Bevel angles accurate (e.g., 9–10°)',
        'Dry-fit circle shows minimal gaps',
        'Glue coverage full, no starved joints',
        'Post-cure joints visually clean, no cracks',
        'Shell roundness within target variance',
      ],
      risks: [
        'Incorrect bevel → visible gaps and weak joints',
        'Uneven clamp pressure → oval or twisted shell',
        'Rushed cure → joints that fail over time',
      ],
      time: hours(8, 16),
      value:
        'This is where separate pieces of wood become a single voice. Done correctly, the shell feels alive instead of glued together.',
    },

    /*
     * STEP 3 — FINE TUNING (TRUEING / THICKNESS)
     * Maps to master process:
     * 2.6 Exterior Milling Setup
     * 2.7 Mill Exterior Diameter
     * 2.8 Outer Bevel Reinforcement
     * 2.9 Sanding Prep (for Veneer + Interior)
     * 2.10 Interior Milling Setup
     * 2.11 Mill Interior Thickness
     * 2.12 Inner Bevel Reinforcement
     * 2.13 Sanding Prep (Interior)
     * 2.14 Original Torch Tune Process
     */
    fineTuning: {
      title: 'Fine Tuning (Trueing/Thickness)',
      what: 'Bring the shell to precise diameter and thickness, reinforce joints with CA, refine interior and exterior surfaces, and perform the signature torch-tuning that wakes up the grain.',
      why: 'Even tiny variations in thickness and roundness change how a shell breathes. Controlled milling, reinforcement, and the torch process shape how the drum responds, projects, and speaks under the stick.',
      techniques: [
        'Exterior diameter milling',
        'Interior thickness profiling',
        'CA joint reinforcement (inner & outer)',
        'Progressive sanding inside and out',
        'Torch tuning to energize the grain',
      ],
      tools: [
        'Lathe/drum sander',
        'Dial indicator',
        'Sanding blocks',
        'Router sled',
        'Inspection lights',
      ],
      qc: [
        'Exterior diameter on spec (e.g., 14.000")',
        'Roundness within ±0.03"',
        'Shell thickness consistent top/middle/bottom',
        'CA reinforcement clean, no buildup ridges',
        'Interior free of tear-out or grooves',
        'Torch work even, no burn-through',
      ],
      risks: [
        'Over-milling → thin, fragile shell',
        'Uneven thickness → dead spots or “wolf” notes',
        'Poor sanding → micro-ridges that affect head seating',
        'Aggressive torching → structural damage',
      ],
      time: hours(4, 10),
      value:
        'This is where the shell becomes predictable and musical — not just round, but tuned in how it responds to every hit.',
    },

    /*
     * STEP 4 — SHELL EXTERIOR FINISH
     * Maps to master process:
     * 2.15 Veneer Application
     * 2.16 Under-Spray Aesthetic Work
     * 2.17 Pre-Finish Full Shell Inspection
     * 2.18 Badge + Logo Work
     * 2.19 Spray Finishing
     * 2.20 Full De-gassing of Chemicals
     */
    shellExteriorFinish: {
      title: 'Exterior Finish',
      what: 'Apply veneer, integrate acrylic and torch accents, lock in detailing, install badges, and build up the sprayed finish with proper leveling, cure, and de-gassing.',
      why: 'Finish isn’t just cosmetics — it protects the shell, shapes attack and sustain, and becomes the surface you feel every time you touch the drum. SoundLegend aesthetics are part of the instrument, not an afterthought.',
      techniques: [
        'Veneer wrapping & seam control',
        'Acrylic stress-line filling',
        'Torch and CA accent balancing',
        'Spray-finish film-build management',
        'Cure and de-gassing cycles',
      ],
      tools: [
        'HVLP sprayer',
        'Polishing system',
        'Viscosity cups',
        'Inspection lights',
      ],
      qc: [
        'Veneer fully adhered, no bubbles or creep',
        'Seam is clean and visually minimal',
        'Acrylic fills follow natural stress lines, not random streaks',
        'No orange peel or solvent trap in finish',
        'Cure time respected, surface free of tack',
        'Badges aligned and bonded correctly',
      ],
      risks: [
        'Poor veneer adhesion → bubbles or splits later',
        'Over-busy detailing → visually noisy, tone-killing CA buildup',
        'Rushed cure → finish that imprints or hazes',
      ],
      time: hours(10, 24),
      value:
        'This is where your drum starts to look like the photos you dreamed about — but with pro-grade protection and longevity baked in.',
    },

    /*
     * STEP 5 — BEARING EDGES
     * Maps to master process:
     * 2.21 Bearing Edges
     */
    bearingEdges: {
      title: 'Bearing Edges',
      what: 'Cut, refine, and burnish the bearing edges so the head has a perfect, repeatable contact point around the entire shell.',
      why: 'The edge is where energy transfers from head to shell. A great edge gives you articulate attack, controlled sustain, and heads that seat easily instead of fighting you.',
      techniques: [
        'Profile routing (e.g., 45° inner + roundover outer)',
        'Hand dressing & micro-sanding',
        'Burnishing for smooth head glide',
      ],
      tools: [
        'Router table & jigs',
        'Files',
        'Burnish wheels',
        'Straightedges',
      ],
      qc: [
        'Edge height consistent all the way around',
        'No flat spots, chips, or chatter marks',
        'Head glides smoothly with no snags',
        'Inner/outer edge balance supports chosen sound',
      ],
      risks: [
        'Uneven edge → tuning dead zones',
        'Chip-out on veneer or shell',
        'Harsh, unpolished edge → premature head wear',
      ],
      time: hours(2, 4),
      value:
        'A perfect shell with bad edges still feels “off.” This step is where tuning stops being a fight and starts feeling intuitive.',
    },

    /*
     * STEP 6 — SNARE BEDS
     * Maps to master process:
     * 2.22 Snare Beds
     */
    snareBedCutting: {
      title: 'Snare Beds',
      what: 'Shape and blend the snare beds so the wires sit exactly where they should, with just enough relief for crisp response at all dynamics.',
      why: 'Snare beds control wire contact. Done wrong, you get choking, weird buzzes, or dead response. Done right, the drum feels sensitive and controlled from whisper to rimshot.',
      techniques: [
        'Template-guided bed routing',
        'Depth and taper tuning',
        'Hand blending into the edges',
      ],
      tools: [
        'Router sled',
        'Feeler gauges',
        'Blocks & abrasives',
        'Straightedges',
      ],
      qc: [
        'Bed depth and width to spec',
        'Left/right symmetry verified',
        'Transitions smooth, no sudden dips',
        'Wires sit centered over the beds',
      ],
      risks: [
        'Over-deep beds → choked sound',
        'Uneven sides → wires never seat correctly',
        'Sharp transitions → weird overtones',
      ],
      time: hours(1, 2),
      value:
        'This is the difference between wires that feel finicky and a drum that just “locks in” no matter how you play it.',
    },

    /*
     * STEP 7 — HARDWARE DRILLING
     * Maps to master process:
     * 2.23 Final Sanding (surface prep where needed)
     * 2.26 Hardware + Head Assembly (layout & hole prep portion)
     */
    hardwareDrilling: {
      title: 'Hardware Drilling',
      what: 'Lay out, drill, and seal every hardware hole so lugs, throw, butt, and vents all mount cleanly without stressing the shell or finish.',
      why: 'Hardware holes are stress concentrators. Clean, sealed holes preserve the shell’s strength and keep the finish from cracking over time while ensuring everything lines up perfectly.',
      techniques: [
        'Template-based layout',
        'Step-bit drilling from both sides as needed',
        'Deburring and sealing hole edges',
      ],
      tools: ['Drill press + jigs', 'Step bits', 'Layout templates', 'Files'],
      qc: [
        'Lug spacing and alignment verified',
        'Throw and butt positions square and level',
        'No tear-out on entry or exit',
        'Hole edges sealed to prevent moisture intrusion',
      ],
      risks: [
        'Layout drift → crooked hardware',
        'Tear-out in finish or veneer',
        'Unsealed holes → micro-cracks and moisture issues later',
      ],
      time: hours(1, 3),
      value:
        'Great hardware is useless if the holes are wrong. This step makes sure everything mounts cleanly and stays silent for years.',
    },

    /*
     * STEP 8 — HARDWARE ASSEMBLY
     * Maps to master process:
     * 2.26 Hardware + Head Assembly (assembly portion)
     */
    hardwareAssembly: {
      title: 'Hardware Assembly',
      what: 'Install all hardware, heads, and wires with attention to torque, alignment, and feel so everything operates smoothly and quietly.',
      why: 'A high-end shell deserves hardware that feels as refined as it sounds. Proper assembly prevents rattles, cross-threading, and tuning drift.',
      techniques: [
        'Torque-sequenced lug installation',
        'Throw/butt alignment and travel testing',
        'Hoop parallelism checks',
        'Thread treatment where appropriate',
      ],
      tools: [
        'Torque drivers',
        'Soft jaws',
        'Thread treatments',
        'Tension gauge',
      ],
      qc: [
        'All lugs aligned and seated flush',
        'Throw action smooth and centered',
        'Hoops parallel to shell all around',
        'No rattles or loose fittings',
      ],
      risks: [
        'Cross-threaded inserts',
        'Misaligned throw causing uneven wire tension',
        'Hardware noise under microphones',
      ],
      time: hours(1, 3),
      value:
        'This is where your drum starts to feel like a single, intentional machine — not just parts bolted to wood.',
    },

    /*
     * STEP 9 — TUNING & DETAILING
     * Maps to master process:
     * 3.1 Legacy Tuning
     * 3.2 NTAG Authentication
     * 3.3 Professional Photos
     * 3.4 Studio Legacy Audio
     */
    tuningAndDetailing: {
      title: 'Tuning & Detailing',
      what: 'Dial in Legacy tuning ranges, capture key frequency data, authenticate the drum with NTAG, and document the build with studio photos and audio.',
      why: 'You’re not just getting a pretty drum — you’re getting a documented instrument with a known Legacy window, verification tag, and media that shows how it sounds when it leaves the shop.',
      techniques: [
        'Lug-by-lug frequency mapping',
        'LegacyPrint window calibration',
        'Adjacent-low and adjacent-high tuning passes',
        'NTAG linking and scan testing',
        'Photo and audio session capture',
      ],
      tools: [
        'Tension gauge',
        'Reference tuner',
        'Reference mic',
        'Monitors',
        'Inspection lights',
      ],
      qc: [
        'Hz readings logged at key tunings (lo/Legacy/high)',
        'No weird buzzes or snare anomalies',
        'NTAG UID stored and linked in Firestore',
        'Tag verified by iPhone and Android',
        'Core photo set and audio takes captured',
      ],
      risks: [
        'Uneven lug tuning → unstable feel',
        'Tag not linked or mis-linked → failed authentication',
        'Incomplete media set → poor future reference',
      ],
      time: hours(1, 4),
      value:
        'This step creates the “paper trail” of your drum — how it was tuned, how it sounded, and how we prove it’s the real thing.',
    },

    /*
     * STEP 10 — QUALITY CHECK
     * Maps to master process:
     * 3.5 Final Cleaning
     * 3.6 Packaging
     * 3.7 Delivery Confirmation
     * 3.8 Followup Cycle
     * + Final Master QA Checklist
     */
    qualityCheck: {
      title: 'Quality Check',
      what: 'Run through the full master QA checklist, deep clean, pack, ship, confirm delivery, and schedule follow-ups so the relationship continues after unboxing.',
      why: 'A SoundLegend drum doesn’t “end” at shipping. Final QA, safe packaging, and intentional follow-up make sure the drum arrives safely and that you feel supported as you live with it.',
      techniques: [
        'Multi-category QA sign-off (structure, finish, hardware, sound, aesthetic, vault, packaging, readiness)',
        'Final cleaning & inspection under studio light',
        'Purpose-built packing & moisture protection',
        'Tracking, confirmation, and scheduled follow-ups',
      ],
      tools: [
        'Inspection lights',
        'Soft cloths & cleaners',
        'Custom packaging materials',
        'Project management / reminder system',
      ],
      qc: [
        'Final diameter, depth, and thickness verified',
        'Roundness and stave joints inspected',
        'Finish defect-free under hard light',
        'Hardware alignment, threads, and function checked',
        'Legacy measurements and media logged',
        'Vault content linked and validated',
        'Packaging padded, moisture-safe, and labeled correctly',
        'Follow-up cadence created (day-after, 10–14, 30 day)',
      ],
      risks: [
        'Shipping damage from improper padding',
        'Overlooked micro-defects',
        'Customer left without support post-delivery',
      ],
      time: hours(1, 6),
      value:
        'This is the signature on the build. When this step is complete, the drum is ready not just to arrive—but to start its life with you the right way.',
    },
  };

  const STEP_CATEGORY_MAP = {
    woodPreparation: ['build_proposal', 'wood_selection'],
    shellConstruction: [
      'stave_construction_(pre-milling)',
      'stave_construction_(post-milling)',
    ],
    fineTuning: ['stave_construction_(post-milling)'],
    shellExteriorFinish: ['final_mockups_(mid-production)'],
    bearingEdges: ['final_mockups_(mid-production)'],
    snareBedCutting: ['final_mockups_(mid-production)'],
    hardwareDrilling: ['final_mockups_(mid-production)'],
    hardwareAssembly: ['final_mockups_(mid-production)'],
    tuningAndDetailing: ['media_files_(audio/video)'],
    qualityCheck: ['media_files_(audio/video)'],
  };

  const stepIndex = (key) => STEP_ORDER.indexOf(key);
  const currentIndexFromPhase = (currentPhase) => {
    if (!currentPhase) return -1;
    if (currentPhase === 'All Steps Complete') return STEP_ORDER.length;
    const lower = String(currentPhase).toLowerCase();
    const foundKey = STEP_ORDER.find((k) =>
      lower.includes(STEP_EDU[k].title.toLowerCase())
    );
    return foundKey ? STEP_ORDER.indexOf(foundKey) : -1;
  };

  // ---------- effects ----------
  useEffect(() => {
    const fetchProject = async () => {
      if (!user) {
        navigate('/signin');
        return;
      }
      try {
        const ref = doc(db, 'projects', projectId);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          navigate('/not-found');
          return;
        }
        const data = snap.data();
        if (isAdmin || data.ownerUid === user.uid) {
          setProject({ id: snap.id, ...data });

          // visible attachments grouped by category
          const raw = data.attachments || {};
          const groupedVisible = {};
          Object.entries(raw).forEach(([key, files]) => {
            if (!Array.isArray(files)) return;
            files.forEach((file) => {
              const f =
                typeof file === 'string'
                  ? { url: file, hidden: false, category: key }
                  : file;
              if (!f?.url || f.hidden) return;
              const cat = f.category || key || 'other';
              if (!groupedVisible[cat]) groupedVisible[cat] = [];
              groupedVisible[cat].push(f);
            });
          });
          setUploadedFiles(groupedVisible);

          // seed Vault prefs (supports both old + new keys)
          const p = data.publicPrefs || {};
          setPublicPrefs({
            // Prefer admin-style keys if present, fall back to older showName/showStory
            showName: p.showName ?? p.namePublicEnabled ?? false,
            showStory: p.showStory ?? p.storyPublicEnabled ?? false,
            displayName: p.displayName || '',
            storyHtml: p.storyHtml || '',
          });
        } else {
          setUnauthorized(true);
        }
      } catch (err) {
        console.error('❌ Error loading project:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [user, isAdmin, projectId, navigate]);

  // choose default selected step (run after project loads)
  const [selectedStep, setSelectedStep] = useState(null);
  useEffect(() => {
    if (!project) return;
    const pct = calculateProjectProgress(project);
    const finished =
      (project?.status &&
        String(project.status).toLowerCase() === 'finished') ||
      project?.allStepsComplete === true ||
      project?.currentStep === 'All Steps Complete' ||
      project?.currentPhase === 'All Steps Complete' ||
      pct === 100;

    const idx = currentIndexFromPhase(project?.currentPhase);
    if (finished) setSelectedStep(STEP_ORDER[STEP_ORDER.length - 1]);
    else if (idx >= 0) setSelectedStep(STEP_ORDER[idx]);
    else setSelectedStep(null);
  }, [project]);

  // ---------- derive values ----------
  const currentPhase = project?.currentPhase || null;
  const pct = project ? calculateProjectProgress(project) : 0;

  const isGlobalFinished =
    !!project &&
    ((project?.status && String(project.status).toLowerCase() === 'finished') ||
      project?.allStepsComplete === true ||
      project?.currentStep === 'All Steps Complete' ||
      project?.currentPhase === 'All Steps Complete' ||
      pct === 100);

  const currentIdx = currentIndexFromPhase(currentPhase); // -1 if not known

  // ---- curriculum hours ----
  const totalStepHours = useMemo(() => {
    return STEP_ORDER.reduce(
      (acc, key) => {
        const t = STEP_EDU[key].time || { min: 0, max: 0 };
        return {
          min: acc.min + (t.min || 0),
          max: acc.max + (t.max || 0),
          mid: acc.mid + ((t.min || 0) + (t.max || 0)) / 2,
        };
      },
      { min: 0, max: 0, mid: 0 }
    );
  }, []); // static

  const remainingStepHours = useMemo(() => {
    if (isGlobalFinished || currentIdx < 0) return { min: 0, max: 0, mid: 0 };
    return STEP_ORDER.slice(currentIdx).reduce(
      (acc, key, i) => {
        const t = STEP_EDU[key].time || { min: 0, max: 0 };
        const factor = i === 0 ? 0.5 : 1; // assume current step half-done
        return {
          min: acc.min + (t.min || 0) * factor,
          max: acc.max + (t.max || 0) * factor,
          mid: acc.mid + (((t.min || 0) + (t.max || 0)) / 2) * factor,
        };
      },
      { min: 0, max: 0, mid: 0 }
    );
  }, [currentIdx, isGlobalFinished]);

  // ---- calendar ETA (scaled against the standard 8–10 weeks) ----
  const BASE_WEEKS = { min: 8, max: 10, mid: 9 };

  const remainingFraction = useMemo(() => {
    if (isGlobalFinished) return 0;
    const total = totalStepHours.mid || 1;
    return Math.max(0, Math.min(1, (remainingStepHours.mid || 0) / total));
  }, [remainingStepHours.mid, totalStepHours.mid, isGlobalFinished]);

  const etaWeeksCalendar = useMemo(() => {
    return {
      min: remainingFraction * BASE_WEEKS.min,
      max: remainingFraction * BASE_WEEKS.max,
      mid: remainingFraction * BASE_WEEKS.mid,
    };
  }, [remainingFraction]);

  const etaDateRange = useMemo(() => {
    if (etaWeeksCalendar.max <= 0) return '—';
    const now = new Date();
    const start = addDays(now, Math.ceil(etaWeeksCalendar.min * 7));
    const end = addDays(now, Math.ceil(etaWeeksCalendar.max * 7));
    return fmtDateRange(start, end);
  }, [etaWeeksCalendar]);

  // ---------- helpers ----------
  const renderHourRange = (t) =>
    !t ? '—' : t.min === t.max ? `${t.min} hrs` : `${t.min}–${t.max} hrs`;

  // NEW: compute public preview name & story
  const computePublicName = () => {
    if (!publicPrefs.showName) return 'Anonymous Legend';
    return (
      publicPrefs.displayName?.trim() ||
      project?.customer?.name?.trim() ||
      'Anonymous Legend'
    );
  };
  const computePublicStoryHtml = () => {
    if (!publicPrefs.showStory) return LEGACY_PRIVATE_TEXT;
    const fromOverride = (publicPrefs.storyHtml || '').trim();
    const fromProject = (
      project?.legacyStoryHtml ||
      project?.storyHtml ||
      ''
    ).trim();
    return fromOverride || fromProject || LEGACY_UNKNOWN_TEXT;
  };

  const savePublicPrefs = async () => {
    if (!project?.id) return;
    try {
      const payload = {
        // canonical admin-style keys
        namePublicEnabled: !!publicPrefs.showName,
        storyPublicEnabled: !!publicPrefs.showStory,
        displayName: publicPrefs.displayName || '',
        storyHtml: publicPrefs.storyHtml || '',
      };

      await updateDoc(doc(db, 'projects', project.id), {
        publicPrefs: payload,
      });

      alert('Your Vault privacy preferences were saved.');
    } catch (e) {
      console.error('❌ Failed saving publicPrefs', e);
      alert('Sorry, there was a problem saving. Please try again.');
    }
  };

  const ToolItem = ({ name }) => {
    const meta = TOOL_LIBRARY[name] || {};
    return (
      <li className="tool-item">
        <span className="tool-link" aria-describedby={`tip-${name}`}>
          {name}
        </span>
        <div className="tool-pop" id={`tip-${name}`} role="tooltip">
          {meta.img && (
            <img
              src={meta.img}
              alt={name}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div className="tool-name">{name}</div>
          <div className="tool-desc">
            {meta.desc || 'Shop tool used in this operation.'}
          </div>
        </div>
      </li>
    );
  };

  // --- tiny UI bits for artist portal ---
  const Toggle = ({ checked, onChange, id, disabled }) => (
    <button
      id={id}
      type="button"
      className={`vp-toggle ${checked ? 'on' : 'off'} ${disabled ? 'disabled' : ''}`}
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
    >
      <span className="knob" />
    </button>
  );

  const MailLink = ({ label, subject, body }) => {
    const href = `mailto:soundlegend@oberartisandrums.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return (
      <a className="vp-request" href={href}>
        {label} ↗
      </a>
    );
  };

  const renderTinyThumb = (file, i) => {
    const url = typeof file === 'string' ? file : file?.url;
    if (!url) return null;
    const name = decodeURIComponent(
      url.split('?')[0].split('/').pop()?.split('%2F').pop() || 'file'
    );
    const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    const isVideo = ['mp4', 'webm', 'mov'].includes(ext);
    const isPDF = ext === 'pdf';
    const isAudio = ['mp3', 'wav', 'ogg'].includes(ext);
    const open = () => {
      setIsPreviewLoaded(false);
      setModalPreview({ url, ext });
    };

    return (
      <div
        key={`${name}-${i}`}
        className="mini-thumb"
        onClick={open}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') open();
        }}
        title={name}
      >
        {isImage && <img src={url} alt={name} />}
        {isVideo && (
          <video muted loop playsInline>
            <source src={url} />
          </video>
        )}
        {isPDF && <div className="mini-pdf">PDF</div>}
        {isAudio && <div className="mini-audio">🔊</div>}
        {!isImage && !isVideo && !isPDF && !isAudio && (
          <div className="mini-file">FILE</div>
        )}
      </div>
    );
  };

  const handleStepDrop = async (e, selectedStepKey) => {
    if (!isAdmin) return;
    e.preventDefault();
    setDragActive(false);

    const files = Array.from(e.dataTransfer?.files || e.target?.files || []);
    if (!files.length || !project?.id) return;

    const cat = (STEP_CATEGORY_MAP[selectedStepKey] || [])[0] || 'other';
    const current = uploadedFiles[cat] || [];

    for (const file of files) {
      const path = `projects/${project.id}/attachments/${cat}/${file.name}`;
      const fileRef = ref(storage, path);
      await new Promise((resolve, reject) => {
        const task = uploadBytesResumable(fileRef, file);
        task.on(
          'state_changed',
          () => {},
          (err) => reject(err),
          async () => {
            const url = await getDownloadURL(task.snapshot.ref);
            const entry = { url, category: cat, hidden: false };
            const nextList = [...current, entry];
            const nextGrouped = { ...uploadedFiles, [cat]: nextList };
            setUploadedFiles(nextGrouped);
            try {
              await updateDoc(doc(db, 'projects', project.id), {
                [`attachments.${cat}`]: nextList,
              });
            } catch (err) {
              console.error('❌ Firestore update failed:', err);
            }
            resolve();
          }
        );
      });
    }
  };

  // ---------- SAFE conditional UI ----------
  if (loading) return <div className="project-page">Loading...</div>;
  if (unauthorized)
    return (
      <div className="project-page">
        You are not authorized to view this project.
      </div>
    );
  if (!project) return <div className="project-page">Project not found.</div>;

  const customer = project.customer || {};
  const allowedCats = (selectedStep && STEP_CATEGORY_MAP[selectedStep]) || [];

  return (
    <div className="project-page">
      {/* Banner */}
      {!isAdmin && (
        <div className="soundlegend-banner">
          <p>
            You’re viewing your custom SoundLegend drum build in progress. This
            page is read-only. Questions? Contact us at{' '}
            <a href="mailto:soundlegend@oberartisandrums.com">
              soundlegend@oberartisandrums.com
            </a>
            .
          </p>
        </div>
      )}

      {/* ---------------- Project Overview ---------------- */}
      <h2>Project Overview</h2>

      <section className="project-section">
        <h3>Build Journey</h3>
        <p className="timeline-hint above">
          Click any <span className="hint-unlocked">unlocked</span> step to
          learn more.
        </p>
        <p>
          <strong>Project Completion:</strong> {pct}%
        </p>
        <p>
          <strong>Current Step:</strong> {currentPhase || 'N/A'}
        </p>

        {/* Progress Bar */}
        <div className="customer-progress-container">
          <div className="customer-progress-track">
            <div
              className="customer-progress-fill"
              style={{ width: `${pct}%` }}
            />
            <div
              className="customer-current-indicator"
              style={{ left: `${pct}%` }}
            />
          </div>

          <div className="customer-progress-timeline">
            {Object.entries(stepWeights).map(([key], index) => {
              const step = project[key] || {};
              const rawList = Array.isArray(step?.checklist)
                ? step.checklist
                : [];
              const enabled = rawList.filter((i) => i?.enabled !== false);
              const total = enabled.length;
              const completed = enabled.filter((i) => i?.completed).length;
              const isExplicitlyDone = step?.completed === true;
              const isChecklistDone = total > 0 && completed === total;
              const isDone =
                isGlobalFinished || isExplicitlyDone || isChecklistDone;

              let className = '';
              if (isDone) className = 'complete';
              else if (completed > 0 || step?.inProgress)
                className = 'in-progress';

              const left =
                Object.values(stepWeights)
                  .slice(0, index)
                  .reduce((s, w) => s + w, 0) * 100;
              const readable = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, (c) => c.toUpperCase());
              const unlocked = index <= currentIdx || isGlobalFinished;

              return (
                <div
                  key={key}
                  className={`customer-timeline-step ${className} ${unlocked ? 'clickable' : 'disabled'}`}
                  style={{ left: `${left}%` }}
                  data-tooltip={`Step ${index + 1}. ${readable}`}
                  onClick={() => unlocked && setSelectedStep(key)}
                  role={unlocked ? 'button' : undefined}
                  tabIndex={unlocked ? 0 : -1}
                  onKeyDown={(e) => {
                    if (unlocked && (e.key === 'Enter' || e.key === ' '))
                      setSelectedStep(key);
                  }}
                >
                  <div className="step-pill">{index + 1}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Details */}
        {!selectedStep ? (
          <p className="muted" style={{ marginTop: '12px' }}>
            Select a step above to see what happens there.
          </p>
        ) : (
          (() => {
            const meta = STEP_EDU[selectedStep];
            const i = stepIndex(selectedStep);
            const unlocked = i <= currentIdx || isGlobalFinished;
            const active = i === currentIdx && !isGlobalFinished;
            const complete = i < currentIdx || isGlobalFinished;

            const filesForAll = Object.values(uploadedFiles || {}).flat();
            const visibleFiles = (filesForAll || []).filter((f) => {
              const cat = (typeof f === 'string' ? '' : f?.category) || '';
              return (STEP_CATEGORY_MAP[selectedStep] || []).includes(cat);
            });

            return (
              <article
                className={[
                  'edu-step',
                  unlocked ? 'unlocked' : 'locked',
                  active ? 'active' : '',
                  complete ? 'complete' : '',
                ].join(' ')}
                style={{ marginTop: '14px' }}
              >
                <header className="edu-step-head">
                  <div className="edu-header-card">
                    <div className="edu-badge">{complete ? '✓' : i + 1}</div>
                    <div className="edu-titles">
                      <h4>{meta.title}</h4>
                      <span className="edu-state">
                        {complete
                          ? 'Completed'
                          : active
                            ? 'In Progress'
                            : 'Locked'}
                      </span>
                      <div className="eta-row">
                        <div className="eta-chip">
                          <span className="sub">Standard Turnaround</span>
                          <span className="big">8–10 weeks</span>
                        </div>
                        <div className="eta-chip">
                          <span className="sub">
                            Projected Completion (throughput)
                          </span>
                          <span className="big">{etaDateRange}</span>
                        </div>
                      </div>
                    </div>
                    <div className="edu-metrics">
                      <div className="metric">
                        <span className="metric-label">
                          Est. Time (working hours)
                        </span>
                        <span className="metric-value">
                          {renderHourRange(meta.time)}
                        </span>
                      </div>
                    </div>
                  </div>
                </header>

                {unlocked ? (
                  <div className="edu-body">
                    <div className="edu-row">
                      <label>What we do</label>
                      <p>{meta.what}</p>
                    </div>
                    <div className="edu-row edu-why">
                      <label>Why it matters</label>
                      <p>{meta.why}</p>
                    </div>

                    <div className="edu-grid">
                      <div className="edu-col">
                        <label>Techniques used</label>
                        <div className="chips">
                          {meta.techniques.map((t) => (
                            <span className="chip" key={t}>
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="edu-col">
                        <label>Tools involved</label>
                        <ul className="tool-list">
                          {meta.tools.map((t) => (
                            <ToolItem name={t} key={t} />
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="edu-grid">
                      <div className="edu-col">
                        <label>QC checklist</label>
                        <ul>
                          {meta.qc.map((q) => (
                            <li key={q}>{q}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="edu-col">
                        <label>Risks & mitigations</label>
                        <ul>
                          {meta.risks.map((r) => (
                            <li key={r}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="edu-value">
                      <span className="spark">★</span> {meta.value}
                    </div>

                    {/* Dropzone + thumbnails */}
                    <div
                      className="mini-grid"
                      onDragOver={(e) => isAdmin && e.preventDefault()}
                    >
                      {isAdmin && (
                        <div
                          className={`step-dropzone ${dragActive ? 'drag' : ''}`}
                          onDragEnter={() => setDragActive(true)}
                          onDragLeave={() => setDragActive(false)}
                          onDrop={(e) => handleStepDrop(e, selectedStep)}
                        >
                          Drag & drop media here to add to this step.
                          <div style={{ marginTop: '6px', fontSize: '.85rem' }}>
                            Or{' '}
                            <label
                              style={{
                                textDecoration: 'underline',
                                cursor: 'pointer',
                              }}
                            >
                              choose files
                              <input
                                type="file"
                                multiple
                                style={{ display: 'none' }}
                                onChange={(e) =>
                                  handleStepDrop(e, selectedStep)
                                }
                              />
                            </label>
                          </div>
                        </div>
                      )}
                      {visibleFiles.length > 0
                        ? visibleFiles.map(renderTinyThumb)
                        : !isAdmin && (
                            <div className="edu-no-files">
                              No files for this step yet.
                            </div>
                          )}
                    </div>
                  </div>
                ) : (
                  <div className="edu-locked-note">
                    This step unlocks as your build reaches it.
                  </div>
                )}
              </article>
            );
          })()
        )}
      </section>

      {/* ---------------- Customer Info ---------------- */}
      <section className="project-section">
        <h3>Customer</h3>
        <p>
          <strong>Name:</strong> {customer?.name || 'N/A'}
        </p>
        <p>
          <strong>Phone:</strong> {customer?.phone || 'N/A'}
        </p>
        <p>
          <strong>Email:</strong> {customer?.email || 'N/A'}
        </p>
        <p>
          <strong>Shipping Address:</strong>{' '}
          {customer?.address
            ? [
                customer.address.street,
                customer.address.city,
                customer.address.state,
                customer.address.zip,
              ]
                .filter(Boolean)
                .join(', ')
            : 'N/A'}
        </p>
        {!isAdmin && (
          <button
            className="edit-button"
            onClick={() =>
              window.open(
                'mailto:soundlegend@oberartisandrums.com?subject=Request to update customer info',
                '_blank'
              )
            }
          >
            Request Changes
          </button>
        )}
      </section>

      {/* ---------------- Vault Privacy ---------------- */}
      <section className="project-section">
        <h3>Vault Privacy</h3>
        <p className="muted">
          Choose what appears publicly in the Legacy Vault.
        </p>

        <div className="vault-privacy-grid">
          {/* NAME VISIBILITY */}
          <div className="vp-col">
            <div className="vp-row">
              <label className="vp-label" htmlFor="vp-toggle-name">
                Display my name publicly
              </label>
              <Toggle
                id="vp-toggle-name"
                checked={publicPrefs.showName}
                onChange={(v) =>
                  setPublicPrefs({ ...publicPrefs, showName: v })
                }
                disabled={false} // artists can control visibility
              />
            </div>

            <div className="vp-row">
              <span className="vp-sub">Public Name (optional override)</span>
              <input
                className="vp-input"
                type="text"
                placeholder="Leave blank to use your account name"
                value={publicPrefs.displayName}
                disabled // artist cannot directly edit; they request a change
                readOnly
              />
              <div className="vp-actions-inline">
                <MailLink
                  label="Request a name change"
                  subject="SoundLegend Vault — Name change request"
                  body={`Hello SoundLegend Team,

I'd like to request an update to my public name in the Legacy Vault.

Project ID: ${project?.id || ''}
Current public name: ${computePublicName()}

Requested change:
`}
                />
              </div>
              <div className="vp-hint">
                If off, Vault will show <strong>Anonymous Legend</strong>.
              </div>
            </div>
          </div>

          {/* STORY VISIBILITY */}
          <div className="vp-col">
            <div className="vp-row">
              <label className="vp-label" htmlFor="vp-toggle-story">
                Display my story publicly
              </label>
              <Toggle
                id="vp-toggle-story"
                checked={publicPrefs.showStory}
                onChange={(v) =>
                  setPublicPrefs({ ...publicPrefs, showStory: v })
                }
                disabled={false} // artists can control visibility
              />
            </div>

            <div className="vp-row">
              <span className="vp-sub">Story HTML (optional override)</span>
              <textarea
                className="vp-textarea"
                placeholder="Story edits are made by our team. Use the button below to request a revision."
                value={publicPrefs.storyHtml}
                disabled // artist cannot directly edit; they request a change
                readOnly
                rows={6}
              />
              <div className="vp-actions-inline">
                <MailLink
                  label="Request a story revision"
                  subject="SoundLegend Vault — Story/Legacy revision request"
                  body={`Hello SoundLegend Team,

I'd like to request an update to my Legacy story in the Vault.

Project ID: ${project?.id || ''}

Requested changes (paste or describe edits here):
`}
                />
              </div>
              <div className="vp-hint">
                If off, Vault will show{' '}
                <strong>Legacy is set to Private.</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="vp-actions">
          <button className="edit-button" onClick={savePublicPrefs}>
            Save Vault Preferences
          </button>
        </div>

        {/* Preview */}
        <div className="vp-preview">
          <div className="vp-preview-title">Public Preview</div>
          <div className="vp-preview-card">
            <div className="vp-name">{computePublicName()}</div>
            <div
              className="vp-story"
              dangerouslySetInnerHTML={{ __html: computePublicStoryHtml() }}
            />
          </div>
        </div>
      </section>

      {/* ---------------- Scope of Work ---------------- */}
      <section className="project-section">
        <h3>Scope of Work</h3>
        <p>
          <strong>Artisan Line:</strong> {project?.artisanLine?.trim() || 'N/A'}
        </p>
        <p>
          <strong>Shell Construction:</strong>{' '}
          {project?.shellConstructionName?.trim() || 'N/A'}
        </p>
        {['Stave', 'Hybrid'].includes(project?.shellConstructionName) && (
          <p>
            <strong>Stave Quantity:</strong> {project?.staveCount || 'N/A'}
          </p>
        )}
        <p>
          <strong>Diameter:</strong> {project?.width || 'N/A'}
        </p>
        <p>
          <strong>Depth:</strong> {project?.shellDepth || 'N/A'}
        </p>
        <p>
          <strong>Wood Species:</strong> {project?.woodPrimary?.trim() || 'N/A'}
        </p>
        <p>
          <strong>Target Shell Thickness:</strong>{' '}
          {project?.targetShellThickness
            ? `${project.targetShellThickness} mm`
            : 'N/A'}
        </p>
        <p>
          <strong>Bearing Edge:</strong> {project?.bearingEdge?.trim() || 'N/A'}
        </p>
        <p>
          <strong>Quantity Lugs:</strong> {project?.lugCount || 'N/A'}
        </p>
        <p>
          <strong>Lug Type:</strong> {project?.lugType?.trim() || 'N/A'}
        </p>
        <p>
          <strong>Hardware Color:</strong>{' '}
          {project?.hardwareColor?.trim() || 'N/A'}
        </p>
        <p>
          <strong>Hoops:</strong> {project?.hoops?.trim() || 'N/A'}
        </p>
        <p>
          <strong>Reinforcement Rings:</strong>{' '}
          {project?.reinforcementRings?.trim() || 'N/A'}
        </p>
        {project?.reinforcementRings !== 'None' && (
          <p>
            <strong>Re-Rings Wood Species:</strong>{' '}
            {project?.reringsSpecies && project.reringsSpecies !== 'None'
              ? project.reringsSpecies
              : 'N/A'}
          </p>
        )}
        <p>
          <strong>Throw-off:</strong> {project?.snareThrowOff?.trim() || 'N/A'}
        </p>
        <p>
          <strong>Snare Wires:</strong> {project?.snareWires?.trim() || 'N/A'}
        </p>
        <p>
          <strong>Snare Bed Depth:</strong> {project?.snareBedDepth || 'N/A'}
        </p>
        <p>
          <strong>Finish Details:</strong>{' '}
          {project?.finishDetails?.trim() || 'N/A'}
        </p>
        <p>
          <strong>Additional Notes:</strong>{' '}
          {project?.additionalNotes?.trim() || 'N/A'}
        </p>
      </section>

      {/* ---------------- Public Files ---------------- */}
      {allFileSections.map((sectionKey) => {
        const files = uploadedFiles?.[sectionKey] || [];
        if (!files.length) return null;
        const sectionTitle = sectionKey
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());
        return (
          <section className="project-section" key={sectionKey}>
            <h3>{sectionTitle}</h3>
            <div className="file-preview-grid">
              {files.map((file, i) => {
                const fileObj =
                  typeof file === 'string'
                    ? { url: file, hidden: false }
                    : file;
                const { url } = fileObj;
                if (!url) return null;
                const fileName = decodeURIComponent(
                  url.split('/').pop().split('?')[0].split('%2F').pop()
                );
                const ext = fileName.includes('.')
                  ? fileName.split('.').pop().toLowerCase()
                  : '';
                const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(
                  ext
                );
                const isPDF = ext === 'pdf';
                return (
                  <div
                    key={i}
                    className="file-preview-item"
                    onClick={() => {
                      setIsPreviewLoaded(false);
                      setModalPreview({ url, ext });
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {isImage ? (
                      <img
                        src={url}
                        alt={fileName}
                        className="file-preview-image"
                        style={{
                          height: '160px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1px solid #444',
                        }}
                      />
                    ) : (
                      <div className="file-preview-thumbnail">
                        {isPDF && (
                          <img
                            src="/icons/pdf-icon.png"
                            alt="PDF"
                            className="pdf-icon"
                          />
                        )}
                        <span className="file-label">{fileName}</span>
                        <span className="file-format">
                          {isPDF ? 'PDF' : 'File'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* ---------------- Modal Preview ---------------- */}
      {modalPreview && (
        <div
          className="file-preview-modal"
          onClick={() => setModalPreview(null)}
        >
          <div
            className="file-preview-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close-button"
              onClick={() => setModalPreview(null)}
            >
              ✕
            </button>
            <a
              href={modalPreview.url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="modal-download-button"
            >
              ⬇ Download
            </a>
            {!isPreviewLoaded && (
              <div className="preview-loading-spinner">Loading...</div>
            )}
            {modalPreview.ext === 'pdf' ? (
              <iframe
                src={modalPreview.url}
                title="PDF Preview"
                className="file-preview-pdf"
                style={{
                  visibility: isPreviewLoaded ? 'visible' : 'hidden',
                  opacity: isPreviewLoaded ? 1 : 0,
                  transition: 'opacity .4s ease',
                }}
                onLoad={() => setIsPreviewLoaded(true)}
              />
            ) : ['mp4', 'webm', 'mov'].includes(modalPreview.ext) ? (
              <video
                controls
                autoPlay
                loop
                className="file-preview-video"
                style={{
                  visibility: isPreviewLoaded ? 'visible' : 'hidden',
                  opacity: isPreviewLoaded ? 1 : 0,
                  transition: 'opacity .4s ease',
                }}
                onLoadedData={() => setIsPreviewLoaded(true)}
              >
                <source src={modalPreview.url} />
              </video>
            ) : ['mp3', 'wav', 'ogg'].includes(modalPreview.ext) ? (
              <audio
                controls
                className="file-preview-audio"
                style={{
                  visibility: isPreviewLoaded ? 'visible' : 'hidden',
                  opacity: isPreviewLoaded ? 1 : 0,
                  transition: 'opacity .4s ease',
                }}
                onLoadedData={() => setIsPreviewLoaded(true)}
              >
                <source src={modalPreview.url} />
              </audio>
            ) : (
              <img
                src={modalPreview.url}
                alt="Preview"
                className="file-preview-image"
                style={{
                  visibility: isPreviewLoaded ? 'visible' : 'hidden',
                  opacity: isPreviewLoaded ? 1 : 0,
                  transition: 'opacity .4s ease',
                }}
                onLoad={() => setIsPreviewLoaded(true)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailPage;
