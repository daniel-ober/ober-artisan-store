// src/utils/workflowDefinitions.js

/**
 * Single source of truth for:
 * - Portal/admin stage list (STEPS)
 * - Stage metadata (STEP_DEFS)
 * - Customer-facing sub-step + checkpoint templates (STAGE_TEMPLATES)
 *
 * IMPORTANT:
 * - "key" in STEPS must match a key in STEP_DEFS + STAGE_TEMPLATES
 * - storageKeys must match your Firestore project phase keys
 *
 * This file is aligned to your NEW workflow keys used throughout the app:
 *  discoveryDesign
 *  commitmentPortal
 *  woodVisionLockIn
 *  rawShellCreation
 *  shellTrueingTorchTune
 *  exteriorArtFinish
 *  edgesSnareBeds
 *  hardwareAssembly
 *  legacyTuningMedia
 *  finalQAPackagingDelivery
 */

/* =========================================================
   STAGE LIST (10 stages, in order)
   ========================================================= */

export const STEPS = [
  { key: 'discoveryDesign', label: 'Discovery & Design' },
  { key: 'commitmentPortal', label: 'Commitment & Portal Setup' },
  { key: 'woodVisionLockIn', label: 'Wood & Vision Lock-In' },
  { key: 'rawShellCreation', label: 'Raw Shell Creation' },
  { key: 'shellTrueingTorchTune', label: 'Shell Trueing & Torch Tune' },
  { key: 'exteriorArtFinish', label: 'Exterior Art & Finish' },
  { key: 'edgesSnareBeds', label: 'Edges & Snare Beds' },
  { key: 'hardwareAssembly', label: 'Hardware & Assembly' },
  { key: 'legacyTuningMedia', label: 'Legacy Tuning & Media' },
  { key: 'finalQAPackagingDelivery', label: 'Final QA, Packaging & Delivery' },
];

/* =========================================================
   STAGE DEFINITIONS (your STEP_DEFS)
   ========================================================= */

export const STEP_DEFS = {
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
    ],
    mantra:
      'Every legendary drum starts here — with a story worth building around.',
  },

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
      { label: 'Deposit + confirm', weight: 0.3 },
      { label: 'Portal setup', weight: 0.4 },
      { label: 'Approval rules', weight: 0.4 },
      { label: 'Schedule + risks', weight: 0.4 },
    ],
    mantra:
      'Once we both commit, this stops being an idea and starts becoming your drum.',
  },

  woodVisionLockIn: {
    key: 'woodVisionLockIn',
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
      { label: 'Wood select + moisture check', weight: 1.6 },
      { label: 'Build plan', weight: 1.2 },
      { label: 'Veneer plan', weight: 1.0 },
      { label: 'Resin strategy', weight: 1.0 },
      { label: 'Vision approval gate', weight: 1.4 },
    ],
    mantra:
      'This is where your drum stops being “a snare” and becomes your sound in wood form.',
  },

  rawShellCreation: {
    key: 'rawShellCreation',
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
      { label: 'Stave prep', weight: 2.2 },
      { label: 'Miters + fit', weight: 2.2 },
      { label: 'Dry fit ring', weight: 0.8 },
      { label: 'Glue + clamp', weight: 2.2 },
      { label: 'Cure + inspect', weight: 0.0 },
      { label: 'Rough true', weight: 2.0 },
    ],
    mantra:
      'This is the moment a stack of boards turns into a living, breathing shell.',
  },

  shellTrueingTorchTune: {
    key: 'shellTrueingTorchTune',
    label: 'Shell Trueing & Torch Tune',
    storageKeys: ['shellTrueingTorchTune'],
    estHours: '5–8 hrs',
    avgDays: '3–4 days',
    what: `We true the shell inside and out, finalize thickness, reinforce stress points,
and perform Torch Tune so the shell “rings with intent” before any hardware touches it.`,
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
      { label: 'Surface prep', weight: 1.2 },
      { label: 'ID jig setup', weight: 1.0 },
      { label: 'OD validate', weight: 1.0 },
      { label: 'ID validate', weight: 1.0 },
      { label: 'Stabilize/torch', weight: 1.2 },
    ],
    mantra:
      'If a drum is going to “just lock in,” it has to learn that language right here.',
  },

  exteriorArtFinish: {
    key: 'exteriorArtFinish',
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
      { label: 'Bond prep', weight: 1.2 },
      { label: 'Apply veneer', weight: 2.4 },
      { label: 'Resin/color', weight: 1.4 },
      { label: 'Prep clear', weight: 1.2 },
      { label: 'Clear + cure', weight: 0.0 },
      { label: 'Level + buff', weight: 1.8 },
    ],
    mantra:
      'This is where people start saying “I almost don’t want to play it… almost.”',
  },

  edgesSnareBeds: {
    key: 'edgesSnareBeds',
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
      { label: 'Cut edges', weight: 1.4 },
      { label: 'Bed layout', weight: 1.0 },
      { label: 'Cut beds', weight: 1.4 },
      { label: 'Seal edges', weight: 0.8 },
      { label: 'Seating QC', weight: 1.2 },
    ],
    mantra:
      'This is the thin line between “annoying to tune” and “it just lands where you want it.”',
  },

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
    checkpoints: [
      { label: 'Layout plan', weight: 1.0 },
      { label: 'Drill + fit', weight: 1.6 },
      { label: 'Install lugs', weight: 1.4 },
      { label: 'Install snare', weight: 1.2 },
      { label: 'Mechanical QC', weight: 0.9 },
    ],
    mantra:
      'This is where the shell gets its armor and becomes a drum built to tour.',
  },

  legacyTuningMedia: {
    key: 'legacyTuningMedia',
    label: 'Legacy Tuning & Media',
    storageKeys: ['legacyTuningMedia'],
    estHours: '4–8 hrs',
    avgDays: '3–5 days',
    what: `We tune the drum to its sweet spots and capture the story in photos and audio.`,
    why: `This is where the drum’s voice is documented and preserved. You’re not just getting a snare — you’re getting a record of how it was born.`,
    techniques: [
      'Frequency-based tuning + touch-based fine-tuning',
      'Reference voicings (low / legacy / high)',
      'Documentation-ready notes + media capture',
    ],
    tools: [
      'Frequency/tuner apps + reference tones',
      'Studio mics + interface',
      'Camera + lighting setup',
    ],
    risks: [
      'Tuning that doesn’t match player preference or range',
      'Poor documentation that undersells the drum’s voice',
    ],
    checkpoints: [
      { label: 'Seat heads', weight: 0.8 },
      { label: 'Dial wires', weight: 1.1 },
      { label: 'Legacy voice', weight: 1.2 },
      { label: 'Tuning notes', weight: 1.0 },
    ],
    mantra:
      'Here’s where your drum stops being “new gear” and becomes part of your legacy.',
  },

  finalQAPackagingDelivery: {
    key: 'finalQAPackagingDelivery',
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
      'Shipping + tracking confirmation',
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
      { label: 'Final QA', weight: 1.0 },
      { label: 'Pack insert', weight: 0.9 },
      { label: 'Ship close', weight: 0.7 },
    ],
    mantra:
      'The build ends here, but the story really starts the first time you hit it in your space.',
  },
};

/* =========================================================
   CUSTOMER SUB-STEPS + CHECKPOINT TEXT (your STAGE_TEMPLATES)
   - These are the customer-facing "sub-steps" inside each stage.
   - Keys here align to your NEW workflow stage keys.
   ========================================================= */

export const STAGE_TEMPLATES = {
  discoveryDesign: {
    steps: [
      {
        key: 'playerInterview',
        label: 'Player Interview',
        checkpoints: [
          'Talk through what you play, how you like a drum to feel, and the kind of tone you love hearing.',
          'Note any comfort needs (arthritis, hand fatigue, stick choice) so the drum works with your body, not against it.',
          'Confirm the size you’re leaning toward (diameter and depth) and how it should sit in your setup.',
          'Define the tuning range where you want this drum to live (your LegacyPrint “home base”).',
          'Agree on a clear budget and realistic build timeline so expectations stay aligned.',
        ],
      },
      {
        key: 'voiceTargets',
        label: 'Voice Targets',
        checkpoints: [
          'Define the core voice you want: fat, dry, crisp, airy, aggressive, or dark.',
          'Decide how forward the attack should be versus how big the body should feel.',
          'Choose sustain preference: controlled and tight vs open and breathing.',
          'Define snare response goals: sensitivity vs thickness and weight.',
          'Identify the “mix position” you want (studio focus vs live projection).',
        ],
      },
      {
        key: 'specTargets',
        label: 'Spec Targets',
        checkpoints: [
          'Confirm diameter + depth targets (and why that size makes sense for you).',
          'Lock in stave count direction to balance response, weight, and feel.',
          'Set a target shell thickness so the drum breathes and responds the way you want.',
          'Choose the bearing edge profile that best supports your feel and tuning goals.',
          'Choose the snare bed style that will shape wire response and sensitivity.',
        ],
      },
      {
        key: 'aestheticLane',
        label: 'Aesthetic Lane',
        checkpoints: [
          'Dial in the visual vibe—wood tones, color, and overall finish direction you’re drawn to.',
          'Choose the outer veneer that will define the drum’s visual personality.',
          'Pick your hardware finish (chrome, black nickel, or brass/gold) to frame the shell.',
          'Confirm the lug style (vintage tube) that matches both sound and aesthetic.',
          'Confirm we’re using diecast hoops for focus, attack, and tuning stability.',
        ],
      },
      {
        key: 'feasibilityGate',
        label: 'Feasibility Gate',
        checkpoints: [
          'Confirm the design is feasible with the selected materials and construction method.',
          'Confirm the scope and build direction are clearly defined (no hidden unknowns).',
          'Validate timeline and workload assumptions before committing to the build path.',
          'Validate budget alignment relative to materials, finish complexity, and hardware.',
          'Greenlight moving forward into Commitment & Portal Setup.',
        ],
      },
    ],
  },

  commitmentPortal: {
    steps: [
      {
        key: 'depositConfirm',
        label: 'Deposit + Confirm',
        checkpoints: [
          'Send a simple, secure payment link for your build.',
          'Confirm deposit or payment is received so your spot is locked in.',
          'Confirm your build spec summary is accurate (size, woods, finish, hardware).',
        ],
      },
      {
        key: 'portalSetup',
        label: 'Portal Setup',
        checkpoints: [
          'Create your private SoundLegend project in the system.',
          'Connect your build to the portal so progress can be tracked.',
          'Send a welcome email with your login link and quick overview.',
          'Confirm you can sign in and everything looks right on your side.',
        ],
      },
      {
        key: 'approvalRules',
        label: 'Approval Rules',
        checkpoints: [
          'Define what requires approval vs what is shared as FYI updates.',
          'Set response timing expectations (typical: 24–72 hours).',
          'Clarify how changes affect timeline + cost after approval gates.',
        ],
      },
      {
        key: 'scheduleRisks',
        label: 'Schedule + Risks',
        checkpoints: [
          'Set your start date and target completion window (with buffer).',
          'Document any hard deadlines (recording, tour, gift date).',
          'Flag risk factors (burl, heavy resin, winter humidity, etc.) and how we mitigate them.',
        ],
      },
    ],
  },

  woodVisionLockIn: {
    steps: [
      {
        key: 'woodSelectMC',
        label: 'Wood Select + MC',
        checkpoints: [
          'Pick the specific boards that will become your shell.',
          'Check each board’s moisture reading so the drum stays stable over time.',
          'Choose grain directions that support both tone and strength.',
          'Study knots and grain stress lines where resin or accents might live naturally.',
          'Optionally send photos or a quick video so you can approve the wood set.',
        ],
      },
      {
        key: 'buildPlan',
        label: 'Build Plan',
        checkpoints: [
          'Confirm shell size, stave count, and construction approach.',
          'Confirm target shell thickness and the feel/tone intent behind it.',
          'Confirm bearing edge direction so everything supports the same voice.',
        ],
      },
      {
        key: 'veneerPlan',
        label: 'Veneer Plan',
        checkpoints: [
          'Choose the veneer and figure intensity that matches your vision.',
          'Confirm seam placement and grain flow around the shell.',
          'Dry-wrap preview before any adhesive touches wood.',
        ],
      },
      {
        key: 'resinStrategy',
        label: 'Resin Strategy',
        checkpoints: [
          'Lock your accent color (HEX) and how it should behave under finish.',
          'Confirm accents will follow natural stress points/figure—no stripes.',
          'Confirm the “subtle vs bold” direction so it feels intentional.',
        ],
      },
      {
        key: 'visionApproval',
        label: 'Vision Approval',
        checkpoints: [
          'We do a full spec readback so everything is perfectly aligned.',
          'You approve the final direction in writing.',
          'After this gate, major spec changes require a timeline/cost reset.',
        ],
      },
    ],
  },

  rawShellCreation: {
    steps: [
      {
        key: 'stavePrep',
        label: 'Stave Prep',
        checkpoints: [
          'Mill stock to consistent thickness and width.',
          'Crosscut to length with a little buffer for post-glue squaring.',
          'Mark grain direction + number all staves to protect wrap flow.',
        ],
      },
      {
        key: 'mitersFit',
        label: 'Miters + Fit',
        checkpoints: [
          'Cut bevel/miter angles accurately using the correct math for your stave count.',
          'Dry-clamp partial sections to validate fit before committing.',
          'Fix any daylight/gaps before moving forward.',
        ],
      },
      {
        key: 'dryFitRing',
        label: 'Dry Fit Ring',
        checkpoints: [
          'Assemble the full ring with no glue to preview figure + seam alignment.',
          'Check all joints under bright light.',
          'Confirm the circle closes without forcing anything.',
        ],
      },
      {
        key: 'glueClamp',
        label: 'Glue + Clamp',
        checkpoints: [
          'Apply full-surface glue coverage.',
          'Clamp evenly so joint pressure is balanced all the way around.',
          'Measure out-of-round and bring it into spec while glue is workable.',
        ],
      },
      {
        key: 'cureInspect',
        label: 'Cure + Inspect',
        checkpoints: [
          'Allow full cure time so joints reach full strength.',
          'Release from clamps carefully to avoid stressing joints.',
          'Inspect every joint for any opening or weakness.',
        ],
      },
      {
        key: 'roughTrue',
        label: 'Rough True',
        checkpoints: [
          'Rough true the OD so it’s stable and ready for precision milling.',
          'Check roundness at multiple clock positions.',
          'Address any high spots or wobble before moving on.',
        ],
      },
    ],
  },

  shellTrueingTorchTune: {
    steps: [
      {
        key: 'surfacePrep',
        label: 'Surface Prep',
        checkpoints: [
          'Sand exterior to remove ridges and prep for cleaner milling and bonding.',
          'Smooth the interior so it feels consistent under the hand.',
          'Inspect joints closely before any resonance work begins.',
        ],
      },
      {
        key: 'idJigSetup',
        label: 'ID Jig Setup',
        checkpoints: [
          'Align the interior milling setup so the shell spins/cuts true.',
          'Set safe depth for controlled passes.',
          'Confirm shell is seated and indexed correctly.',
        ],
      },
      {
        key: 'odValidate',
        label: 'OD Validate',
        checkpoints: [
          'Validate final OD roundness and target diameter.',
          'Measure wall thickness at multiple points.',
          'Confirm there are no flat spots or ridges on the outside.',
        ],
      },
      {
        key: 'idValidate',
        label: 'ID Validate',
        checkpoints: [
          'Confirm interior is smooth with no major tear-out.',
          'Measure final ID consistency and thickness map.',
          'Confirm the shell “feels” even and intentional.',
        ],
      },
      {
        key: 'stabilizeTorch',
        label: 'Stabilize/Torch',
        checkpoints: [
          'Perform Torch Tune (where appropriate) in a controlled pattern.',
          'Re-test resonance around the shell after each pass.',
          'Confirm no structural stress or seam issues were introduced.',
        ],
      },
    ],
  },

  exteriorArtFinish: {
    steps: [
      {
        key: 'bondPrep',
        label: 'Bond Prep',
        checkpoints: [
          'Dry-fit veneer/wrap and confirm seam strategy.',
          'Plan adhesive and clamping/press method for your veneer type.',
          'Confirm shell is clean, dust-free, and ready to bond.',
        ],
      },
      {
        key: 'applyVeneer',
        label: 'Apply Veneer',
        checkpoints: [
          'Apply even adhesive coverage to shell and veneer.',
          'Roll/press evenly to remove bubbles and trapped air.',
          'Inspect the seam for a clean, nearly invisible joint.',
        ],
      },
      {
        key: 'resinColor',
        label: 'Resin/Color',
        checkpoints: [
          'Place accents where the wood naturally wants them—inside stress lines and figure.',
          'Keep the accent behavior speckled and organic (no streak bands).',
          'Sand to a fine grit so the surface is truly ready for clear.',
        ],
      },
      {
        key: 'prepClear',
        label: 'Prep Clear',
        checkpoints: [
          'Run hand + eye checks to confirm surface is perfectly smooth.',
          'Remove dust/debris so nothing gets trapped under clear.',
          'Mask off areas that should not receive spray.',
        ],
      },
      {
        key: 'clearCure',
        label: 'Clear + Cure',
        checkpoints: [
          'Lay down controlled, even coats to build protection without choking resonance.',
          'Respect cure windows so the finish hardens correctly.',
          'Watch for witness lines/sink-back and adjust schedule if needed.',
        ],
      },
      {
        key: 'levelBuff',
        label: 'Level + Buff',
        checkpoints: [
          'Level sand to remove texture and tiny imperfections.',
          'Polish to the final sheen (gloss/satin as planned).',
          'Final inspection under raking light for swirl/wave control.',
        ],
      },
    ],
  },

  edgesSnareBeds: {
    steps: [
      {
        key: 'cutEdges',
        label: 'Cut Edges',
        checkpoints: [
          'Cut the bearing edge profile to match the intended feel and tuning behavior.',
          'Inspect for chatter/tool marks and refine immediately.',
          'Verify consistent contact point all the way around.',
        ],
      },
      {
        key: 'bedLayout',
        label: 'Bed Layout',
        checkpoints: [
          'Mark snare bed zones aligned to throw/butt orientation.',
          'Ensure left/right beds are symmetric.',
          'Confirm centerline before any cutting begins.',
        ],
      },
      {
        key: 'cutBeds',
        label: 'Cut Beds',
        checkpoints: [
          'Cut beds using multiple light passes to avoid burning/tear-out.',
          'Blend transitions so there are no sharp steps.',
          'Verify depth/width match your snare wire intent.',
        ],
      },
      {
        key: 'sealEdges',
        label: 'Seal Edges',
        checkpoints: [
          'Seal/protect edge surfaces so heads seat consistently long-term.',
          'Confirm sealing does not change the intended profile.',
          'Allow cure time before seating tests.',
        ],
      },
      {
        key: 'seatingQC',
        label: 'Seating QC',
        checkpoints: [
          'Seat a head (when available) to confirm smooth, even contact.',
          'Confirm snare response potential with a quick wire fit check.',
          'Sign off the “it just locks in” feel before assembly.',
        ],
      },
    ],
  },

  hardwareAssembly: {
    steps: [
      {
        key: 'layoutPlan',
        label: 'Layout Plan',
        checkpoints: [
          'Confirm all hardware is in stock and matches spec (finish, lug count, diecast hoops).',
          'Plan layout for lugs/throw/butt/badge/vent.',
          'Verify alignment relative to snare beds and visual front.',
        ],
      },
      {
        key: 'drillFit',
        label: 'Drill + Fit',
        checkpoints: [
          'Tape + mark centers to prevent finish chip-out.',
          'Drill pilot holes first; step up sizes gradually.',
          'Deburr all holes and test-fit each hardware type.',
        ],
      },
      {
        key: 'installLugs',
        label: 'Install Lugs',
        checkpoints: [
          'Install lug hardware with the correct protection stack/gaskets.',
          'Ensure everything sits flat and tight against the shell.',
          'Sight lug lines for clean vertical alignment.',
        ],
      },
      {
        key: 'installSnare',
        label: 'Install Snare',
        checkpoints: [
          'Install throw-off and butt plate aligned to beds.',
          'Install vent grommet and verify shell breathing.',
          'Dry-check snare wire path and clearance.',
        ],
      },
      {
        key: 'mechQC',
        label: 'Mechanical QC Gate',
        checkpoints: [
          'Torque check: snug, even, no crushed wood.',
          'Rattle check: shake test and tap test.',
          'Confirm hoops/heads seat parallel and tune smoothly.',
        ],
      },
    ],
  },

  legacyTuningMedia: {
    steps: [
      {
        key: 'seatHeads',
        label: 'Seat Heads',
        checkpoints: [
          'Install heads and seat them properly.',
          'Tune in a star pattern for even lug pressure.',
          'Set a neutral baseline tuning.',
        ],
      },
      {
        key: 'dialWires',
        label: 'Dial Wires',
        checkpoints: [
          'Center wires across the beds.',
          'Set wire tension for crisp response without choke.',
          'Test for sympathetic buzz and adjust as needed.',
        ],
      },
      {
        key: 'legacyVoice',
        label: 'Legacy Voice',
        checkpoints: [
          'Play-test dynamics: ghosts, rimshots, cross-stick.',
          'Establish low / legacy / high voicing zones.',
          'Confirm it matches the original Discovery voice target.',
        ],
      },
      {
        key: 'tuningNotes',
        label: 'Tuning Notes',
        checkpoints: [
          'Document notes, ranges, and references.',
          'Capture any quick audio/video samples when possible.',
          'Save a simple “where this drum lives best” summary for you.',
        ],
      },
    ],
  },

  finalQAPackagingDelivery: {
    steps: [
      {
        key: 'finalQA',
        label: 'Final QA',
        checkpoints: [
          'Final cosmetic + structural inspection under good light.',
          'Confirm hardware tightness/alignment and no rattles.',
          'Full test-play to confirm tuning stability and tonal balance.',
        ],
      },
      {
        key: 'packInsert',
        label: 'Pack Insert',
        checkpoints: [
          'Final clean + polish so it arrives stage-ready.',
          'Package with finish-safe protection and impact cushioning.',
          'Include inserts: thank-you, care notes, tuning notes, any extras.',
        ],
      },
      {
        key: 'shipClose',
        label: 'Ship Close',
        checkpoints: [
          'Create label + insurance/signature as appropriate.',
          'Confirm tracking is saved and shared.',
          'Coordinate delivery confirmation / reveal follow-up if desired.',
        ],
      },
    ],
  },
};