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
    woodPreparation: {
      title: 'Wood Preparation',
      what: 'Select boards, moisture-check, joint/plane flat/square, acclimate to shop RH.',
      why: 'Flat, dry, oriented wood prevents warping and sets the drum’s voice.',
      techniques: [
        'Moisture normalization',
        'Grain matching',
        'Face/edge jointing',
      ],
      tools: ['Moisture meter', 'Jointer & planer', 'Calipers', 'Clamps'],
      qc: [
        'Moisture 6–9%',
        'Faces flat & parallel',
        'Grain orientation marked',
      ],
      risks: ['Hidden tension → cupping', 'Mismatched moisture → creep'],
      time: hours(3, 8),
      value: 'Stable wood = stable tone.',
    },
    shellConstruction: {
      title: 'Shell Construction',
      what: 'Cut/bevel/clamp staves (or prep hybrid/steam-bent). True to diameter & roundness.',
      why: 'Round, consistent shells project and tune evenly.',
      techniques: ['Stave beveling', 'Form clamping', 'Roundness trueing'],
      tools: ['Table saw + bevel sled', 'Clamping forms', 'Dial calipers'],
      qc: ['Seam integrity', 'OOR < ±0.5 mm', 'Diameter matches spec'],
      risks: ['Gluing misalignment', 'Ovalization during clamp'],
      time: hours(8, 16),
      value: 'True, round shells tune easier.',
    },
    fineTuning: {
      title: 'Fine Tuning (Trueing/Thickness)',
      what: 'True faces, bring thickness to target, smooth interior.',
      why: 'Consistency yields even resonance & predictable tuning.',
      techniques: [
        'Lathe trueing',
        'Thickness profiling',
        'Progressive sanding',
      ],
      tools: ['Lathe/drum sander', 'Dial indicator', 'Sanding blocks'],
      qc: ['Thickness ±0.3 mm', 'Interior free of ridges'],
      risks: ['Hot spots → dead zones', 'Over-removal'],
      time: hours(4, 10),
      value: 'Consistent shell = consistent resonance.',
    },
    shellExteriorFinish: {
      title: 'Exterior Finish',
      what: 'Veneer/stain/epoxy/clear. Level-sand & polish; honor cure windows.',
      why: 'Protects shell and shapes attack/sustain & feel.',
      techniques: ['HVLP spray', 'Level sanding', 'Buff & polish'],
      tools: ['HVLP sprayer', 'Polishing system', 'Viscosity cups'],
      qc: ['Even film build', 'No witness lines', 'Gloss/Sheen to spec'],
      risks: ['Solvent trap → haze', 'Runs & sags'],
      time: hours(10, 24),
      value: 'Durable finish, consistent tone.',
    },
    bearingEdges: {
      title: 'Bearing Edges',
      what: 'Cut profiles to spec; dress, burnish, polish.',
      why: 'Edge is the head’s contact—attack & articulation start here.',
      techniques: ['Profile routing', 'Hand dressing', 'Burnishing'],
      tools: ['Router table & jigs', 'Files', 'Burnish wheels'],
      qc: ['No flat spots', 'Even apex', 'Silky head glide'],
      risks: ['Chip-out', 'Uneven apex'],
      time: hours(2, 4),
      value: 'Your “handshake” with the head.',
    },
    snareBedCutting: {
      title: 'Snare Beds',
      what: 'Cut/blend beds to target depth/width; verify wire fit.',
      why: 'Keeps wires crisp & sensitive at all dynamics.',
      techniques: ['Template routing', 'Feeler gauge tuning', 'Hand blending'],
      tools: ['Router sled', 'Feeler gauges', 'Blocks & abrasives'],
      qc: ['Symmetric depth/transition', 'No sharp transitions'],
      risks: ['Over-deep → choke', 'Misalignment'],
      time: hours(1, 2),
      value: 'Crisp response, zero choke.',
    },
    hardwareDrilling: {
      title: 'Hardware Drilling',
      what: 'Layout, drill, deburr, and seal all holes.',
      why: 'Prevents micro-cracks; ensures alignment & longevity.',
      techniques: ['Template layout', 'Step drilling', 'Hole sealing'],
      tools: ['Drill press + jigs', 'Step bits', 'Layout templates'],
      qc: ['Spacing verified', 'Edges sealed', 'Hardware test-fit'],
      risks: ['Exit tear-out', 'Layout drift'],
      time: hours(1, 3),
      value: 'Rock-solid hardware, no buzzes.',
    },
    hardwareAssembly: {
      title: 'Hardware Assembly',
      what: 'Install lugs/hoops/throw/butt/strain; dress contacts; treat threads as needed.',
      why: 'Removes squeaks/buzzes; stable tuning.',
      techniques: [
        'Torque sequence',
        'Threadlock (where appropriate)',
        'Contact dressing',
      ],
      tools: ['Torque drivers', 'Soft jaws', 'Thread treatments'],
      qc: ['Even alignment', 'No rattles', 'Smooth throw'],
      risks: ['Cross-threading', 'Uneven seating'],
      time: hours(1, 3),
      value: 'Quiet, aligned hardware that lasts.',
    },
    tuningAndDetailing: {
      title: 'Tuning & Detailing',
      what: 'Head fit, initial tuning, wire alignment, badge, meticulous clean.',
      why: 'Turns a shell into an instrument.',
      techniques: ['Tension mapping', 'Wire centering', 'Final clean'],
      tools: ['Tension gauge', 'Reference tuner', 'Straightedges'],
      qc: ['Even lug pitch', 'Responsive wires'],
      risks: ['Head seating issues', 'Wire chatter'],
      time: hours(1, 3),
      value: 'Plays in tune, feels alive.',
    },
    qualityCheck: {
      title: 'Quality Check',
      what: 'Full inspection, documentation, audio clip, and ship prep.',
      why: 'Ensures it arrives verified & gig-ready.',
      techniques: ['QC checklist', 'Audio capture', 'Pack & protect'],
      tools: ['Reference mic', 'Monitors', 'Inspection lights'],
      qc: ['Fasteners verified', 'No finish defects', 'Audio pass'],
      risks: ['Transit risk if packaging is wrong'],
      time: hours(1, 4),
      value: 'Every SoundLegend leaves verified.',
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

          // seed Vault prefs
          const p = data.publicPrefs || {};
          setPublicPrefs({
            showName: !!p.showName,
            showStory: !!p.showStory,
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
      await updateDoc(doc(db, 'projects', project.id), { publicPrefs });
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
            You’re viewing your custom SoundLegend drum build in progress. This page is read-only.
            Questions? Contact us at{' '}
            <a href="mailto:soundlegend@oberartisandrums.com">soundlegend@oberartisandrums.com</a>.
          </p>
        </div>
      )}

      {/* ---------------- Project Overview ---------------- */}
      <h2>Project Overview</h2>

      <section className="project-section">
        <h3>Build Journey</h3>
        <p className="timeline-hint above">
          Click any <span className="hint-unlocked">unlocked</span> step to learn more.
        </p>
        <p><strong>Project Completion:</strong> {pct}%</p>
        <p><strong>Current Step:</strong> {currentPhase || 'N/A'}</p>

        {/* Progress Bar */}
        <div className="customer-progress-container">
          <div className="customer-progress-track">
            <div className="customer-progress-fill" style={{ width: `${pct}%` }} />
            <div className="customer-current-indicator" style={{ left: `${pct}%` }} />
          </div>

          <div className="customer-progress-timeline">
            {Object.entries(stepWeights).map(([key], index) => {
              const step = project[key] || {};
              const rawList = Array.isArray(step?.checklist) ? step.checklist : [];
              const enabled = rawList.filter((i) => i?.enabled !== false);
              const total = enabled.length;
              const completed = enabled.filter((i) => i?.completed).length;
              const isExplicitlyDone = step?.completed === true;
              const isChecklistDone = total > 0 && completed === total;
              const isDone = isGlobalFinished || isExplicitlyDone || isChecklistDone;

              let className = '';
              if (isDone) className = 'complete';
              else if (completed > 0 || step?.inProgress) className = 'in-progress';

              const left = Object.values(stepWeights).slice(0, index).reduce((s, w) => s + w, 0) * 100;
              const readable = key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
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
                  onKeyDown={(e) => { if (unlocked && (e.key === 'Enter' || e.key === ' ')) setSelectedStep(key); }}
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
        ) : (() => {
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
                      {complete ? 'Completed' : active ? 'In Progress' : 'Locked'}
                    </span>
                    <div className="eta-row">
                      <div className="eta-chip">
                        <span className="sub">Standard Turnaround</span>
                        <span className="big">8–10 weeks</span>
                      </div>
                      <div className="eta-chip">
                        <span className="sub">Projected Completion (throughput)</span>
                        <span className="big">{etaDateRange}</span>
                      </div>
                    </div>
                  </div>
                  <div className="edu-metrics">
                    <div className="metric">
                      <span className="metric-label">Est. Time (working hours)</span>
                      <span className="metric-value">{renderHourRange(meta.time)}</span>
                    </div>
                  </div>
                </div>
              </header>

              {unlocked ? (
                <div className="edu-body">
                  <div className="edu-row"><label>What we do</label><p>{meta.what}</p></div>
                  <div className="edu-row edu-why"><label>Why it matters</label><p>{meta.why}</p></div>

                  <div className="edu-grid">
                    <div className="edu-col">
                      <label>Techniques used</label>
                      <div className="chips">{meta.techniques.map((t) => <span className="chip" key={t}>{t}</span>)}</div>
                    </div>
                    <div className="edu-col">
                      <label>Tools involved</label>
                      <ul className="tool-list">{meta.tools.map((t) => <ToolItem name={t} key={t} />)}</ul>
                    </div>
                  </div>

                  <div className="edu-grid">
                    <div className="edu-col"><label>QC checklist</label><ul>{meta.qc.map((q) => <li key={q}>{q}</li>)}</ul></div>
                    <div className="edu-col"><label>Risks & mitigations</label><ul>{meta.risks.map((r) => <li key={r}>{r}</li>)}</ul></div>
                  </div>

                  <div className="edu-value"><span className="spark">★</span> {meta.value}</div>

                  {/* Dropzone + thumbnails */}
                  <div className="mini-grid" onDragOver={(e)=>isAdmin && e.preventDefault()}>
                    {isAdmin && (
                      <div
                        className={`step-dropzone ${dragActive ? 'drag' : ''}`}
                        onDragEnter={()=>setDragActive(true)}
                        onDragLeave={()=>setDragActive(false)}
                        onDrop={(e)=>handleStepDrop(e, selectedStep)}
                      >
                        Drag & drop media here to add to this step.
                        <div style={{ marginTop:'6px', fontSize:'.85rem' }}>
                          Or <label style={{ textDecoration:'underline', cursor:'pointer' }}>
                            choose files
                            <input type="file" multiple style={{ display:'none' }} onChange={(e)=>handleStepDrop(e, selectedStep)} />
                          </label>
                        </div>
                      </div>
                    )}
                    {visibleFiles.length > 0 ? visibleFiles.map(renderTinyThumb)
                      : !isAdmin && <div className="edu-no-files">No files for this step yet.</div>}
                  </div>
                </div>
              ) : (
                <div className="edu-locked-note">This step unlocks as your build reaches it.</div>
              )}
            </article>
          );
        })()}
      </section>

      {/* ---------------- Customer Info ---------------- */}
      <section className="project-section">
        <h3>Customer</h3>
        <p><strong>Name:</strong> {customer?.name || 'N/A'}</p>
        <p><strong>Phone:</strong> {customer?.phone || 'N/A'}</p>
        <p><strong>Email:</strong> {customer?.email || 'N/A'}</p>
        <p><strong>Shipping Address:</strong> {customer?.address
          ? [customer.address.street, customer.address.city, customer.address.state, customer.address.zip]
              .filter(Boolean).join(', ')
          : 'N/A'}</p>
        {!isAdmin && (
          <button
            className="edit-button"
            onClick={() => window.open('mailto:soundlegend@oberartisandrums.com?subject=Request to update customer info','_blank')}
          >
            Request Changes
          </button>
        )}
      </section>

  {/* ---------------- Vault Privacy ---------------- */}
<section className="project-section">
  <h3>Vault Privacy</h3>
  <p className="muted">Choose what appears publicly in the Legacy Vault.</p>

  <div className="vault-privacy-grid">
    {/* NAME VISIBILITY */}
    <div className="vp-col">
      <div className="vp-row">
        <label className="vp-label" htmlFor="vp-toggle-name">Display my name publicly</label>
        <Toggle
          id="vp-toggle-name"
          checked={publicPrefs.showName}
          onChange={(v) => setPublicPrefs({ ...publicPrefs, showName: v })}
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
        <label className="vp-label" htmlFor="vp-toggle-story">Display my story publicly</label>
        <Toggle
          id="vp-toggle-story"
          checked={publicPrefs.showStory}
          onChange={(v) => setPublicPrefs({ ...publicPrefs, showStory: v })}
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
          If off, Vault will show <strong>Legacy is set to Private.</strong>
        </div>
      </div>
    </div>
  </div>

  <div className="vp-actions">
    <button className="edit-button" onClick={savePublicPrefs}>Save Vault Preferences</button>
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
        <p><strong>Artisan Line:</strong> {project?.artisanLine?.trim() || 'N/A'}</p>
        <p><strong>Shell Construction:</strong> {project?.shellConstructionName?.trim() || 'N/A'}</p>
        {['Stave','Hybrid'].includes(project?.shellConstructionName) && <p><strong>Stave Quantity:</strong> {project?.staveCount || 'N/A'}</p>}
        <p><strong>Diameter:</strong> {project?.width || 'N/A'}</p>
        <p><strong>Depth:</strong> {project?.shellDepth || 'N/A'}</p>
        <p><strong>Wood Species:</strong> {project?.woodPrimary?.trim() || 'N/A'}</p>
        <p><strong>Target Shell Thickness:</strong> {project?.targetShellThickness ? `${project.targetShellThickness} mm` : 'N/A'}</p>
        <p><strong>Bearing Edge:</strong> {project?.bearingEdge?.trim() || 'N/A'}</p>
        <p><strong>Quantity Lugs:</strong> {project?.lugCount || 'N/A'}</p>
        <p><strong>Lug Type:</strong> {project?.lugType?.trim() || 'N/A'}</p>
        <p><strong>Hardware Color:</strong> {project?.hardwareColor?.trim() || 'N/A'}</p>
        <p><strong>Hoops:</strong> {project?.hoops?.trim() || 'N/A'}</p>
        <p><strong>Reinforcement Rings:</strong> {project?.reinforcementRings?.trim() || 'N/A'}</p>
        {project?.reinforcementRings !== 'None' && (
          <p><strong>Re-Rings Wood Species:</strong> {project?.reringsSpecies && project.reringsSpecies !== 'None' ? project.reringsSpecies : 'N/A'}</p>
        )}
        <p><strong>Throw-off:</strong> {project?.snareThrowOff?.trim() || 'N/A'}</p>
        <p><strong>Snare Wires:</strong> {project?.snareWires?.trim() || 'N/A'}</p>
        <p><strong>Snare Bed Depth:</strong> {project?.snareBedDepth || 'N/A'}</p>
        <p><strong>Finish Details:</strong> {project?.finishDetails?.trim() || 'N/A'}</p>
        <p><strong>Additional Notes:</strong> {project?.additionalNotes?.trim() || 'N/A'}</p>
      </section>

      {/* ---------------- Public Files ---------------- */}
      {allFileSections.map((sectionKey) => {
        const files = uploadedFiles?.[sectionKey] || [];
        if (!files.length) return null;
        const sectionTitle = sectionKey.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        return (
          <section className="project-section" key={sectionKey}>
            <h3>{sectionTitle}</h3>
            <div className="file-preview-grid">
              {files.map((file, i) => {
                const fileObj = typeof file === 'string' ? { url: file, hidden: false } : file;
                const { url } = fileObj; if (!url) return null;
                const fileName = decodeURIComponent(url.split('/').pop().split('?')[0].split('%2F').pop());
                const ext = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
                const isImage = ['jpg','jpeg','png','gif','webp'].includes(ext);
                const isPDF = ext === 'pdf';
                return (
                  <div
                    key={i}
                    className="file-preview-item"
                    onClick={() => { setIsPreviewLoaded(false); setModalPreview({ url, ext }); }}
                    style={{ cursor: 'pointer' }}
                  >
                    {isImage ? (
                      <img
                        src={url}
                        alt={fileName}
                        className="file-preview-image"
                        style={{ height:'160px', objectFit:'cover', borderRadius:'8px', border:'1px solid #444' }}
                      />
                    ) : (
                      <div className="file-preview-thumbnail">
                        {isPDF && <img src="/icons/pdf-icon.png" alt="PDF" className="pdf-icon" />}
                        <span className="file-label">{fileName}</span>
                        <span className="file-format">{isPDF ? 'PDF' : 'File'}</span>
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
        <div className="file-preview-modal" onClick={() => setModalPreview(null)}>
          <div className="file-preview-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-button" onClick={() => setModalPreview(null)}>✕</button>
            <a
              href={modalPreview.url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="modal-download-button"
            >
              ⬇ Download
            </a>
            {!isPreviewLoaded && <div className="preview-loading-spinner">Loading...</div>}
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
            ) : ['mp4','webm','mov'].includes(modalPreview.ext) ? (
              <video
                controls autoPlay loop
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
            ) : ['mp3','wav','ogg'].includes(modalPreview.ext) ? (
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
