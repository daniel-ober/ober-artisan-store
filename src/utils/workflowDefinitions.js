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
 */

/* =========================================================
   STAGE LIST (10 stages, in order)
   ========================================================= */

export const STEPS = [
  { key: 'discoveryDesign', label: 'Discovery & Design' },
  { key: 'commitmentPortal', label: 'Commitment & Portal Setup' },
  { key: 'woodVision', label: 'Wood & Vision Lock-In' },
  { key: 'rawShell', label: 'Raw Shell Creation' },
  { key: 'shellTrueingTorch', label: 'Shell Trueing & Torch Tune' },
  { key: 'exteriorArt', label: 'Exterior Art & Finish' },
  { key: 'edgesBeds', label: 'Edges & Snare Beds' },
  { key: 'hardwareAssembly', label: 'Hardware & Assembly' },
  { key: 'legacyMedia', label: 'Legacy Tuning & Media' },
  { key: 'finalQa', label: 'Final QA, Packaging & Delivery' },
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
    mantra: 'Every legendary drum starts here — with a story worth building around.',
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
      { label: 'Payment processing', weight: 0.3 },
      { label: 'Early mockups', weight: 1.3 },
      { label: 'Portal access setup', weight: 0.4 },
    ],
    mantra: 'Once we both commit, this stops being an idea and starts becoming your drum.',
  },

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
    mantra: 'This is where your drum stops being “a snare” and becomes your sound in wood form.',
  },

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
    mantra: 'This is the moment a stack of boards turns into a living, breathing shell.',
  },

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
    mantra: 'If a drum is going to “just lock in,” it has to learn that language right here.',
  },

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
    mantra: 'This is where people start saying “I almost don’t want to play it… almost.”',
  },

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
    mantra: 'This is the thin line between “annoying to tune” and “it just lands where you want it.”',
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
    checkpoints: [{ label: 'Hardware + head assembly', weight: 7.1 }],
    mantra: 'This is where the shell gets its armor and becomes a drum built to tour.',
  },

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
    mantra: 'Here’s where your drum stops being “new gear” and becomes part of your legacy.',
  },

  finalQa: {
    key: 'finalQa',
    label: 'Final QA, Packaging & Delivery',
    storageKeys: ['finalQAPackagingDelivery'],
    estHours: '2–4 hrs',
    avgDays: '1–2 days',
    what: `We run a final inspection, clean and prep the drum, pack it safely, and confirm delivery so you’re ready to play, record, or tour with confidence.`,
    why: `A great drum deserves a great send-off. This step protects the build, your investment, and the story we’ve built together.`,
    techniques: ['Multi-point QC checklist', 'Final tuning + feel pass', 'Protective packing tailored to the drum'],
    tools: ['Soft cloths and non-abrasive cleaners', 'Custom packing materials / cases', 'Shipping labels + tracking system'],
    risks: ['Transit damage from under-protected packing', 'Loose hardware or missed issues slipping through QA'],
    checkpoints: [
      { label: 'Final cleaning', weight: 0.3 },
      { label: 'Packaging', weight: 0.7 },
      { label: 'Delivery confirmation', weight: 0.4 },
    ],
    mantra: 'The build ends here, but the story really starts the first time you hit it in your space.',
  },
};

/* =========================================================
   CUSTOMER SUB-STEPS + CHECKPOINT TEXT (your STAGE_TEMPLATES)
   ========================================================= */

export const STAGE_TEMPLATES = {
  discoveryDesign: {
    steps: [
      {
        key: 'initialConsultation',
        label: 'Initial consultation',
        checkpoints: [
          'Talk through what you play, how you like a drum to feel, and the kind of tone you love hearing.',
          'Note any comfort needs (arthritis, hand fatigue, stick choice) so the drum works with your body, not against it.',
          'Confirm the size you’re leaning toward (diameter and depth) and how it should sit in your setup.',
          'Dial in the visual vibe—wood tones, color, and overall finish direction you’re drawn to.',
          'Define the tuning range where you want this drum to live (your LegacyPrint “home base”).',
          'Agree on a clear budget and realistic build timeline so expectations stay aligned.',
        ],
      },
      {
        key: 'buildProposal',
        label: 'Build proposal',
        checkpoints: [
          'Put everything we’ve discussed into a clear written build plan for your drum.',
          'Choose the main wood that will shape the core tone and feel.',
          'Decide if we’re adding a secondary wood for extra character or hybrid response.',
          'Lock in how many staves the shell will use to balance feel, response, and look.',
          'Set a target shell thickness so the drum breathes and responds the way you want.',
          'Choose the outer veneer that will define the drum’s visual personality.',
          'Pick your hardware finish (chrome, black nickel, or brass/gold) to frame the shell.',
          'Confirm the lug style (vintage tube) that matches both sound and aesthetic.',
          'Confirm we’re using diecast hoops for focus, attack, and tuning stability.',
          'Choose the bearing edge profile that best supports your feel and tuning goals.',
          'Choose the snare bed style that will shape wire response and sensitivity.',
          'Prepare early visual mockups or previews when they’ll help you “see” the build.',
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
          'Send a simple, secure payment link for your build.',
          'Confirm deposit or payment is received so your spot is locked in.',
        ],
      },
      {
        key: 'portalAccess',
        label: 'Portal access setup',
        checkpoints: [
          'Create your private SoundLegend project in the system.',
          'Connect your build to the SoundLegend portal so progress can be tracked.',
          'Send a welcome email with your login link and quick overview.',
          'Confirm you can sign in and everything looks right on your side.',
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
          'Pick the specific boards that will become your shell.',
          'Check each board’s moisture reading so the drum stays stable over time.',
          'Choose grain directions that support both tone and strength.',
          'Study knots and grain stress lines where resin or accents might live naturally.',
          'Rough out how long each board needs to be for your shell size.',
          'Optionally send photos or a quick video so you can approve the wood set.',
          'Log each board’s length for accurate shell planning.',
          'Log each board’s width so staves stay balanced.',
          'Log each board’s thickness so we know how much material we have to work with.',
          'Record the moisture percentage so we have a baseline for the build.',
        ],
      },
      {
        key: 'earlyMockups',
        label: 'Early mockups',
        checkpoints: [
          'Create first visual sketches or mockups of finish, veneer, and hardware together.',
          'Show 2–3 finish concepts so you can compare different accent and color ideas.',
          'Rough in where badges and logos will live on the shell.',
          'Write a simple overview of each option so you know what you’re looking at.',
          'Share these mockups with you for honest feedback and reactions.',
          'Capture your notes and lock in the direction that feels most like “you.”',
        ],
      },
      {
        key: 'preBuildMeasuring',
        label: 'Pre-build measuring & prep',
        checkpoints: [
          'Do a quick test to confirm veneer and shell will bond cleanly and look cohesive.',
          'Check shell color and character in natural light to see its “real-world” appearance.',
          'Check shell color and reflection under flash or studio lighting for photos and stage.',
          'Compare acrylic accent color swatches against the veneer to find the best pairing.',
          'Rough in badge and logo placement so they feel balanced on the shell.',
          'Share updated visuals or notes with you before cutting any wood.',
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
          'Set each stave so its grain flows in a musical, stable direction.',
          'Make sure every stave is cut to the same dimensions so the shell forms cleanly.',
          'Check each piece for cracks, voids, or flaws that could affect long-term strength.',
          'Measure the length of each stave to match your drum size.',
          'Measure the width of each stave so the circle closes correctly.',
          'Measure thickness so the shell can be brought to the right final profile.',
        ],
      },
      {
        key: 'preGlueTest',
        label: 'Pre-glue test (dry-fit)',
        checkpoints: [
          'Inspect freshly cut bevels to ensure there’s no tear-out or roughness.',
          'Test-fit a few staves together to confirm they lock up with tight joints.',
          'Double-check the bevel angle so the full circle will form correctly.',
          'Compare inside and outside faces to be sure proportions match our plan.',
        ],
      },
      {
        key: 'glueUpClamping',
        label: 'Glue-up & clamping',
        checkpoints: [
          'Dry-fit the full circle of staves before glue to make sure everything mates well.',
          'Look and feel for any gaps between staves and correct them before committing.',
          'Check how round the circle is using our jigs or measuring tools.',
          'Measure how far out-of-round the shell is and bring it into tight spec.',
          'Check joint tightness at several points around the shell for even strength.',
        ],
      },
      {
        key: 'glueCuring',
        label: 'Glue curing',
        checkpoints: [
          'Let the shell sit for the full recommended cure time so joints reach full strength.',
          'Release the shell from the clamps carefully to avoid stressing new joints.',
          'Do a first visual pass on every joint to confirm nothing opened up.',
        ],
      },
      {
        key: 'exteriorMillingSetup',
        label: 'Exterior milling setup',
        checkpoints: [
          'Square and lock the exterior milling sled or lathe so the shell cuts cleanly.',
          'Center the shell in the jig so there’s equal support all the way around.',
          'Set the cutter or router depth for a safe, controlled first pass.',
          'Run a light test pass to listen for chatter or vibration and adjust if needed.',
        ],
      },
      {
        key: 'millExteriorDiameter',
        label: 'Mill exterior diameter',
        checkpoints: [
          'Take several shallow cuts instead of one heavy pass to protect the shell.',
          'Measure the shell at multiple clock positions to confirm a true circle.',
          'Verify the final diameter is within our target tolerance.',
          'Inspect the outside of the shell for any tool marks or tear-out that need refinement.',
        ],
      },
      {
        key: 'outerBevelReinforcement',
        label: 'Outer bevel reinforcement',
        checkpoints: [
          'Apply a thin reinforcing layer to the outer bevel zone where heads will sit.',
          'Make sure that reinforcement soaks evenly along all stave joints.',
          'Sand the area back to a smooth, clean surface ready for future steps.',
          'Re-check for tiny gaps or hairline cracks and address them now, not later.',
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
          'Do an initial exterior sand so the shell is smooth and ready for finer work.',
          'Knock down any high spots or ridges so the shell feels even under the hand.',
          'Confirm the shell is ready to move into the next jig or process.',
          'Smooth the interior with finer grits so it feels clean and consistent.',
          'Inspect every interior joint up close before moving forward.',
          'Make sure the shell is fully ready for torch work and veneer application.',
        ],
      },
      {
        key: 'interiorMillingSetup',
        label: 'Interior milling setup',
        checkpoints: [
          'Align the interior milling sled or jig so the shell spins true.',
          'Set the interior cutter depth to remove just the right amount of material.',
          'Seat and index the shell correctly in the jig so it cuts evenly.',
        ],
      },
      {
        key: 'millInteriorThickness',
        label: 'Mill interior thickness',
        checkpoints: [
          'Check the exterior again after passes to ensure it stayed smooth and true.',
          'Expose clean glue lines so we can see the health of each joint.',
          'Measure the final exterior diameter to confirm we’re exactly on spec.',
          'Verify roundness again using calipers or jigs.',
          'Measure shell wall thickness at multiple points to keep things even.',
        ],
      },
      {
        key: 'innerBevelReinforcement',
        label: 'Inner bevel reinforcement',
        checkpoints: [
          'Inspect the interior surface and edges to ensure they feel smooth and intentional.',
          'Confirm there’s no major tear-out or roughness hiding inside.',
          'Measure interior diameter to check our inner profile.',
          'Measure final shell thickness at the top edge area.',
          'Measure final shell thickness around the middle of the shell.',
          'Measure final shell thickness near the bottom edge.',
          'Check how true the inner circle is all the way around.',
        ],
      },
      {
        key: 'sandingPrepInterior',
        label: 'Sanding prep (interior)',
        checkpoints: [
          'Reinforce the outer bevel area with a thin glue treatment for long-term strength.',
          'Check that reinforcement has soaked evenly into all joints.',
          'Sand the outer bevel smooth again so it feels seamless.',
          'Reinforce the inner bevel area with a matching treatment.',
          'Confirm the inner joints have taken reinforcement evenly.',
          'Sand the inner bevel smooth and comfortable after everything cures.',
        ],
      },
      {
        key: 'originalTorchTune',
        label: 'Original torch tune process',
        checkpoints: [
          'Apply torch work in a controlled pattern around the shell.',
          'Bring the grain to life visually without scorching or overburning.',
          'Confirm the shell is visually elevated with no structural damage from heat.',
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
          'Lay down even adhesive on both shell and veneer for a strong bond.',
          'Roll the veneer onto the shell with smooth, even pressure.',
          'Check for any bubbles or trapped air and remove them.',
          'Inspect the seam so it reads as a clean, nearly invisible joint.',
          'Confirm veneer thickness is appropriate for tone and durability.',
          'Make sure the veneer seam lines up with the planned design orientation.',
          'Watch for any drifting or creep as the veneer settles and address it early.',
        ],
      },
      {
        key: 'underSprayWork',
        label: 'Under-spray aesthetic work',
        checkpoints: [
          'Place acrylic accents where the wood naturally wants them—inside stress lines and figure.',
          'Balance torch and color work so the shell feels intentional, not busy.',
          'Check that any injected fills are level, clear, and integrated with the grain.',
          'Sand the shell to a fine grit (320–400) so it’s truly ready for finish.',
        ],
      },
      {
        key: 'preFinishInspection',
        label: 'Pre-finish full shell inspection',
        checkpoints: [
          'Run a hand and eye check to confirm the shell feels perfectly smooth.',
          'Make sure there’s no veneer hanging over the edges where heads will sit.',
          'Remove dust and debris so nothing gets trapped under the finish.',
          'Mask off any areas that shouldn’t receive spray before finishing.',
        ],
      },
      {
        key: 'badgeLogoWork',
        label: 'Badge + logo work',
        checkpoints: [
          'Place the outer badge exactly where it feels balanced on the shell.',
          'Install the inner badge in its dedicated spot inside the drum.',
          'Confirm everything is fully adhered or fastened and ready for the long haul.',
        ],
      },
      {
        key: 'sprayFinishing',
        label: 'Spray finishing',
        checkpoints: [
          'Lay down controlled, even coats so the finish builds cleanly.',
          'Watch for flashing or uneven spots between coats and smooth them out.',
          'Tune gun settings and technique to keep orange peel to a minimum.',
          'Give each coat the time it needs to set before the next one goes on.',
          'Track approximate finish build so tone and protection stay in balance.',
          'Check shell reflections to ensure an even, consistent surface.',
        ],
      },
      {
        key: 'fullDegassing',
        label: 'Full de-gassing of chemicals',
        checkpoints: [
          'Let the shell cure in a clean, dust-controlled area.',
          'Watch the surface as it cures for any shrinking or witness lines.',
          'Give the finish full off-gassing time so it hardens correctly.',
          'Confirm the finish is fully cured before any leveling or polishing.',
        ],
      },
      {
        key: 'finalSanding',
        label: 'Final sanding',
        checkpoints: [
          'Level sand to remove tiny imperfections and texture in the finish.',
          'Protect veneer and color coats by sanding carefully where it matters.',
          'Check the shell under raking light to catch any final surface issues.',
        ],
      },
      {
        key: 'polishing',
        label: 'Polishing',
        checkpoints: [
          'Buff the shell to its final sheen—gloss or satin, as planned.',
          'Inspect reflections for smoothness without waves or swirl marks.',
          'Clean away any leftover polish from edges and hardware areas.',
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
          'Shape inner and outer edges so they work together as one profile.',
          'Confirm the main cutting surface matches the intended angle and roundover.',
          'Check for any chatter or tool marks that could affect tuning or feel.',
          'Measure edge height so heads sit exactly where they should on the shell.',
          'Inspect the contact point all the way around for consistency.',
          'Evaluate how smooth the edge feels as you run a finger along it.',
        ],
      },
      {
        key: 'snareBeds',
        label: 'Snare beds',
        checkpoints: [
          'Confirm left and right snare beds mirror each other perfectly.',
          'Check the transitions into and out of the beds so there are no sharp steps.',
          'Measure bed depth so wires can relax into the shell properly.',
          'Measure bed width to match your snare setup and response goals.',
          'Check how the bed ramps in and out to keep feel and response balanced.',
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
          'Install all lugs with the correct fittings so they feel solid and quiet.',
          'Mount the throw-off at the right height and angle for easy access.',
          'Install the butt plate directly opposite the throw-off for clean wire pull.',
          'Install the vent grommet so the shell can breathe and equalize pressure.',
          'Confirm all hardware sits flat and tight against the shell.',
          'Mount hoops and heads in the correct orientation for the design.',
          'String up the snare wires and center them across the beds.',
          'Tap and check for rattles or loose parts and correct anything that moves.',
          'Test the snare throw to make sure it engages and releases smoothly.',
          'Check that the head seats evenly around the drum with balanced tension.',
          'Visually line up lugs relative to the hoops for a clean, intentional look.',
          'Confirm the hoops and shell sit parallel for smooth tuning and feel.',
          'Make sure there’s plenty of usable range on each tension rod.',
          'Verify the throw-off and beds work together so the wires respond evenly.',
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
          'Capture the drum’s fundamental pitch multiple times and average it.',
          'Find the low tuning range where the drum still feels musical.',
          'Find the “Legacy” sweet-spot tuning that shows the drum at its best.',
          'Find the higher tuning range where it still feels controlled and usable.',
          'Note how the overtones stack so we understand its harmonic behavior.',
          'Evaluate how the drum handles unwanted overtones or ring.',
        ],
      },
      {
        key: 'legacyTuning',
        label: 'Legacy tuning',
        checkpoints: [
          'Listen to how the drum sustains at several tunings.',
          'Check how overtones behave across the tuning range.',
          'Test soft-to-loud playing so we know how it responds dynamically.',
          'Measure lug-to-lug pitch (when useful) to keep things balanced.',
          'Define the LegacyPrint window—the tuning zone we recommend you live in.',
          'Document a slightly-lower tuning option you can explore.',
          'Document a slightly-higher tuning option for brighter applications.',
        ],
      },
      {
        key: 'professionalPhotos',
        label: 'Professional photos',
        checkpoints: [
          'Capture a hero shot that shows the drum’s overall character.',
          'Capture a left-angle shot that highlights depth and stance.',
          'Capture a right-angle shot for full shell and hardware detail.',
          'Capture a top-down shot that shows hoops and head layout.',
          'Capture a close-up of the badge and logo details.',
          'Capture a macro shot of wood, grain, and finish texture.',
          'Shoot a 360-style standing series to show the drum all the way around.',
          'Shoot a horizontal or flat series to show the drum in a different context.',
        ],
      },
      {
        key: 'studioLegacyAudio',
        label: 'Studio Legacy audio',
        checkpoints: [
          'Record examples at a loose tuning so you can hear it wide open.',
          'Record examples at a medium tuning that many players will live in.',
          'Record examples at a tighter tuning for crack and articulation.',
          'Record at the higher recommended tuning for extra cut when needed.',
          'Capture cross-stick examples so you can hear rim voice and feel.',
          'Capture ghost-note and dynamic phrases to show nuance and response.',
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
          'Read and record the unique ID from your NFC chip.',
          'Create or update the digital record that links this tag to your drum.',
          'Connect that tag record to the correct project in our system.',
          'Confirm the tag points to the right Legacy / verification page.',
          'Test tap-to-verify using an iPhone.',
          'Test tap-to-verify using an Android device.',
        ],
      },
      {
        key: 'finalCleaning',
        label: 'Final cleaning',
        checkpoints: [
          'Wipe away fingerprints and smudges from shell and hardware.',
          'Give hoops and hardware a final polish so they arrive stage-ready.',
          'Double-check snare wire alignment and the range of tension available.',
          'Inspect the shell under good light for any last finish issues.',
          'Run a final structural check of shell, edges, and hardware.',
          'Do one last sound and feel pass before calling it complete.',
        ],
      },
      {
        key: 'packaging',
        label: 'Packaging',
        checkpoints: [
          'Wrap the drum in a soft inner layer so nothing rubs against the finish.',
          'Add moisture protection if needed for the route it will travel.',
          'Add cushioning around shell, hoops, and hardware for impact protection.',
          'Place your personalized thank-you letter into the package.',
          'Include your Legacy tuning and analysis materials.',
          'Include care instructions so the drum stays healthy long-term.',
          'Include any brand collateral or extras connected to your build.',
          'Mark the outside of the box with Ober branding where appropriate.',
          'Apply the shipping label, insurance, and signature-required details.',
        ],
      },
      {
        key: 'deliveryConfirmation',
        label: 'Delivery confirmation',
        checkpoints: [
          'Coordinate a reveal or follow-up touchpoint once the drum arrives, if you’d like.',
        ],
      },
    ],
  },
};