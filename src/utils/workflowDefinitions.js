// src/utils/workflowDefinitions.js

// Checkpoint helper shape (matches what your StepComponentTemplate expects)
const cp = (
  ui,
  details = [],
  book = null,
  type = 'task',
  naAllowed = true
) => ({
  ui, // admin main UI label (full)
  details, // bullet points shown under the checkpoint
  book: book ?? ui, // admin left-panel short label (and/or export label)
  type, // "task" | "measurement" | "qc"
  naAllowed,
});

/**
 * STAGE_TEMPLATES — SOURCE OF TRUTH
 *
 * Weight rules:
 * - All stage weights sum to 100
 * - Step weights within a stage sum to that stage weight
 *
 * Naming rules:
 * - stage.adminLeftShort: admin left panel stage label (short)
 * - stage.adminMainTitle: admin main panel stage title (full)
 * - step.adminLeftShort: admin left panel step label (short)
 * - step.adminMainTitle: admin main panel step title (full)
 * - step.portalActiveLabel: customer-facing present-tense live label
 * - checkpoint.book: short label used in left panel under the active sub-step
 */
export const STAGE_TEMPLATES = {
  /* ============================================================
   * 1) Discovery & Design
   * ========================================================== */
  discoveryDesign: {
    stageKey: 'discoveryDesign',
    weight: 3,
    adminLeftShort: '1. Discovery',
    adminMainTitle: '1. Discovery & Design',
    portalLabel: 'Discovery & Design',
    estHours: '2–4 hrs',
    avgDays: '2 days',
    what: 'We learn how you play, what you love about your current drums, and what you wish you could change. This is where we listen, sketch ideas, and translate your sound language into an actual build direction.',
    why: 'If this step is rushed, everything downstream suffers. A great drum starts with great listening: your hands, your ears, your rooms, and your story.',
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
    mantra:
      'Every legendary drum starts here — with a story worth building around.',
    steps: [
      {
        id: 'discoveryDesign_1',
        weight: 1,
        adminLeftShort: 'Kickoff',
        adminMainTitle: 'Kickoff & Vision Capture',
        portalActiveLabel: 'Capturing Your Vision',
        checkpoints: [
          cp(
            'Capture player goals + influences',
            [
              'Ask where the drum will live most (studio / live / worship / touring / bedroom).',
              'Ask: “What snare have you loved most in your life and why?” Capture brand/model if known.',
              'Ask: “What snare disappointed you?” Listen for what they *don’t* want (ring, dryness, brightness, choke).',
              'Clarify tuning habits: high / medium / low — ask for examples (e.g., ‘cranked like gospel’ vs ‘fat rock’).',
              'Clarify feel: rebound vs resistance; sensitivity for ghost notes vs rimshot authority.',
              'Collect 1–3 reference tracks (or drummers) that represent the target vibe; note the role of snare in the mix.',
              'Red-flag check: conflicting goals (e.g., ‘super dry but huge open bloom’). If present, guide them to priorities.',
            ],
            'Goals + refs',
            'task',
            false
          ),

          cp(
            'Define sound target',
            [
              'Write a 1-sentence identity: “Fast attack, woody body, controlled decay, studio-friendly.”',
              'Attack character: quick/snap vs round/soft — test by describing rimshot envelope (crack vs thud).',
              'Body: chesty/fat vs lean/pointed — ask how much note they want under the hit.',
              'Sustain/decay: short/controlled vs open/bloom — ask how it should behave unmiked.',
              'Dynamic range: whisper ghost notes ↔ full rimshots — confirm sensitivity expectations.',
              'Use-case test: “If a mediocre engineer mics this, does it still sound great?” If not, steer to safer choices.',
              'Confirm the ‘no-go zone’: too ringy / too papery / too boxy / too pingy — document in plain language.',
            ],
            'Sound target',
            'task',
            false
          ),

          cp(
            'Define aesthetic target',
            [
              'Veneer intent: figure/drama vs subtle/classic — what should the eye notice first?',
              'Grain direction preference: “bookmatched centerline” vs “wrap-around flow” (set expectation early).',
              'Accent intent: subtle enhancement vs bold statement — confirm it should *enhance* not replace the wood.',
              'Hardware finish direction (chrome / black nickel / brass-gold) and how it should photograph under studio light.',
              'Badge vibe: understated heirloom vs standout signature; confirm it must still feel premium in 10–20 years.',
              'Use-case: “Would you be proud of this on a dark stage AND in a close-up photo?”',
            ],
            'Aesthetic',
            'task',
            true
          ),

          cp(
            'Confirm constraints + non-negotiables',
            [
              'Budget range + what’s flexible (finish complexity, hardware tier, timeline) vs what’s fixed.',
              'Deadline sensitivity: hard date vs target window; confirm buffer policy and why it protects quality.',
              'Must-have features: diecast hoops, tube lugs, wire type/count, shell depth, edge style, venting, etc.',
              'Must-NOT-happen list: “no harsh ring”, “no choking”, “no overly bright ping”, “no resin streaks”.',
              'Decision rule: once spec is approved, changes require a logged revision (prevents drift + confusion).',
            ],
            'Constraints',
            'qc',
            false
          ),
        ],
      },
      {
        id: 'discoveryDesign_2',
        weight: 1,
        adminLeftShort: 'Spec Draft',
        adminMainTitle: 'Initial Spec Draft',
        portalActiveLabel: 'Drafting Your Build Specification',
        checkpoints: [
          cp(
            'Lock size + lug count direction',
            [
              'Diameter x depth direction locked (note: depth affects feel; diameter strongly affects pitch ceiling).',
              'Lug count direction (6/8/10) and why: tuning stability, head response, aesthetic, and shell loading.',
              'Use-case test: do they detune quickly on loud gigs? More lugs may help stability.',
              'Check practical fit: player ergonomics, case availability, and whether depth affects comfort/position.',
            ],
            'Size + lugs',
            'task',
            false
          ),

          cp(
            'Draft shell construction plan',
            [
              'Construction chosen (stave / steam-bent / hybrid) based on voice target (attack, body, decay).',
              'Target thickness range set; note how thickness impacts projection vs sensitivity.',
              'Reinforcement rings decision (if applicable): stability, focus, and aesthetic implications.',
              'Risk check: stability of stock + likelihood of movement; plan acclimation/rest steps if needed.',
            ],
            'Shell plan',
            'task',
            true
          ),

          cp(
            'Draft hardware + snare system plan',
            [
              'Hoops: diecast only — confirm thickness/weight expectations and how it shapes attack/decay.',
              'Lugs: vintage tube lugs — confirm spacing and visual balance for chosen diameter/lug count.',
              'Throw + butt plate style selected; confirm smooth operation and serviceability.',
              'Wire count/type selected; confirm sensitivity target and how it behaves at low dynamics.',
              'Use-case test: “Can it do articulate ghost notes without choking on rimshots?”',
            ],
            'Hardware plan',
            'task',
            false
          ),

          cp(
            'Draft finish + accent plan',
            [
              'Veneer selection path: exact reference image required; confirm match expectation explicitly.',
              'Accent color (HEX) if known; if unknown, plan swatch/lighting test before commitment.',
              'Accent behavior rules: organic integration into grain/knots/stress points; no streaks; wraps circumference.',
              'Topcoat type + sheen direction (satin / semi / gloss) based on ‘luxury look’ and durability goals.',
              'Use-case: how it should look under harsh raking light + phone flash (common real-world revealers).',
            ],
            'Finish plan',
            'task',
            true
          ),
        ],
      },
      {
        id: 'discoveryDesign_3',
        weight: 1,
        adminLeftShort: 'Approval',
        adminMainTitle: 'Customer Approval & Sign-Off',
        portalActiveLabel: 'Finalizing Your Approval',
        checkpoints: [
          cp(
            'Send proposal summary',
            [
              'Include plain-English voice summary (1 sentence) + bullet spec list (size, lugs, hoops, lugs, throw, wires).',
              'Include aesthetic plan: veneer reference, accent behavior rules, hardware finish, badge rules.',
              'Include timeline window + buffer explanation (quality protection, not delay).',
              'Ask for explicit confirmation of any trade-offs (e.g., ‘more control’ means less open ring).',
            ],
            'Send proposal',
            'task',
            false
          ),

          cp(
            'Capture explicit approval',
            [
              'Written approval of: size, lug count, shell style, hardware finish, veneer reference, accent rules, badge placement.',
              'Confirm “no-go list” is understood (ring/dry/bright/resin behavior).',
              'If customer is uncertain, offer 2 options max (avoid endless forks).',
            ],
            'Approval',
            'qc',
            false
          ),

          cp(
            'Record final version (source of truth)',
            [
              'Store final spec as the authoritative doc in project (vFinal).',
              'Prevent silent changes: all changes after vFinal require logged revision note (who/what/why/when).',
              'Attach reference images (veneer, hardware finish, badge reference) to avoid interpretation drift later.',
            ],
            'Record vFinal',
            'qc',
            false
          ),
        ],
      },
    ],
  },

  /* ============================================================
   * 2) Commitment & Portal Setup
   * ========================================================== */
  commitmentPortal: {
    stageKey: 'commitmentPortal',
    weight: 3,
    adminLeftShort: '2. Commitment',
    adminMainTitle: '2. Commitment & Portal Setup',
    portalLabel: 'Commitment & Portal Setup',
    estHours: '1–2 hrs',
    avgDays: '1 day',
    what: 'We lock in the proposal, confirm scope and price, then spin up your private SoundLegend portal so you can follow along as your drum is built.',
    why: 'Clear commitments protect both of us: you know exactly what you’re getting and when, and we can focus fully on building instead of chasing loose ends.',
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
    mantra:
      'Once we both commit, this stops being an idea and starts becoming your drum.',
    steps: [
      {
        id: 'commitmentPortal_1',
        weight: 1,
        adminLeftShort: 'Deposit',
        adminMainTitle: 'Deposit / Commitment Confirmed',
        portalActiveLabel: 'Confirming Your Commitment',
        checkpoints: [
          cp(
            'Confirm deposit received',
            [
              'Payment method confirmed and recorded.',
              'Receipt stored/linked in project for audit + customer trust.',
              'Confirm customer understands deposit starts the build queue (sets seriousness + expectations).',
            ],
            'Deposit',
            'qc',
            false
          ),

          cp(
            'Confirm start date + target window',
            [
              'Start date set and date-stamped.',
              'Target completion window set (date range) + buffer policy explained.',
              'Use-case: if finish cure or shell movement requires extra time, quality wins over speed.',
            ],
            'Dates',
            'task',
            false
          ),

          cp(
            'Create internal work order snapshot',
            [
              'Build sheet generated with vFinal spec snapshot (prevents drift).',
              'Special notes elevated (non-negotiables, ‘no-go’ list, reference tracks).',
              'Tooling/hardware lead-time check (avoid mid-build waiting).',
            ],
            'Work order',
            'task',
            false
          ),
        ],
      },
      {
        id: 'commitmentPortal_2',
        weight: 1,
        adminLeftShort: 'Portal',
        adminMainTitle: 'Portal Access + Project Setup',
        portalActiveLabel: 'Setting Up Your Artist Portal',
        checkpoints: [
          cp(
            'Confirm customer user link',
            [
              'Project linked to correct user account.',
              'Customer can see project in portal (verify from customer view if possible).',
              'Privacy check: confirm no other customer data is visible anywhere.',
            ],
            'User link',
            'qc',
            false
          ),

          cp(
            'Initialize workflow steps',
            [
              'All 10 stages present; all sub-steps present.',
              'Checkpoint arrays initialized (no missing checklist objects).',
              'Sanity test: mark/unmark a checkpoint and verify it persists to Firestore correctly.',
            ],
            'Init workflow',
            'qc',
            false
          ),

          cp(
            'Welcome message + how-to',
            [
              'Explain portal layout (progress, stages, attachments, updates).',
              'Explain what triggers updates (milestones, approvals, photos/audio).',
              'Set expectation: fewer, higher-quality updates beats constant noise.',
              'Invite customer to ask questions, but clarify spec changes require revision log.',
            ],
            'Welcome',
            'task',
            true
          ),
        ],
      },
      {
        id: 'commitmentPortal_3',
        weight: 1,
        adminLeftShort: 'Intake',
        adminMainTitle: 'Shipping / Intake Details Confirmed',
        portalActiveLabel: 'Confirming Your Shipping Details',
        checkpoints: [
          cp(
            'Confirm shipping address + contact',
            [
              'Name, phone, address verified (read back to confirm).',
              'Special delivery instructions captured (gate codes, signature required, business hours).',
              'Risk check: apartment deliveries—confirm safe drop procedures.',
            ],
            'Ship info',
            'qc',
            false
          ),

          cp(
            'Confirm billing preferences',
            [
              'Remaining balance timing clarified.',
              'Invoice/receipt preference captured.',
              'If split payments: define dates and what triggers final invoice (e.g., after Final QA).',
            ],
            'Billing',
            'task',
            true
          ),
        ],
      },
    ],
  },

  /* ============================================================
   * 3) Wood & Vision Lock-In
   * ========================================================== */
  woodVisionLockIn: {
    stageKey: 'woodVisionLockIn',
    weight: 6,
    adminLeftShort: '3. Wood',
    adminMainTitle: '3. Wood & Vision Lock-In',
    portalLabel: 'Wood & Vision Lock-In',
    estHours: '3–5 hrs',
    avgDays: '2–3 days',
    what: 'We finalize shell size, stave count, species, and visual direction. This is where the personality of the drum is chosen — the “why this drum exists” part.',
    why: 'Wood and proportions are the DNA of a stave shell. Getting this right determines feel under the stick, how the drum breathes, and how it sits in a mix.',
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
    mantra:
      'This is where your drum stops being “a snare” and becomes your sound in wood form.',
    steps: [
      {
        id: 'woodVisionLockIn_1',
        weight: 2,
        adminLeftShort: 'Veneer',
        adminMainTitle: 'Veneer Selection Locked',
        portalActiveLabel: 'Locking In Your Veneer Direction',
        checkpoints: [
          cp(
            'Confirm exact veneer reference',
            [
              'Store the exact source image (not ‘similar to’).',
              'Confirm grain orientation intent: center seam vs wrap flow; confirm where the eye should land.',
              'Confirm ‘match expectation’: “must match the photo closely—no interpretation.”',
              'Use-case test: phone flash + raking light will reveal seam/figure—plan accordingly.',
            ],
            'Veneer lock',
            'qc',
            false
          ),

          cp(
            'Confirm accent color + behavior',
            [
              'HEX captured and stored in project.',
              'Accent must embed into grain stress/knots organically (not painted on top).',
              'Accent must wrap full circumference (no isolated center patch).',
              'Speckled integration (not streaks, stripes, or lightning lines).',
              'Rule: subtle luxury—enhance the wood, don’t replace it.',
              'Test method: do a tiny swatch under similar lighting before full commit (if applicable).',
            ],
            'Accent rules',
            'qc',
            false
          ),

          cp(
            'Confirm hardware finish + badge',
            [
              'Hardware finish locked; confirm it matches customer expectation in photos (chrome vs black nickel vs brass/gold).',
              'Badge finish must match hardware finish (no mismatch).',
              'Badge centered vertically on shell (non-negotiable placement rule).',
              'Use-case test: rotate the drum in mind—does badge feel balanced from all angles?',
            ],
            'Hardware lock',
            'qc',
            false
          ),
        ],
      },
      {
        id: 'woodVisionLockIn_2',
        weight: 2,
        adminLeftShort: 'Core Wood',
        adminMainTitle: 'Core Shell Wood Selection',
        portalActiveLabel: 'Selecting Your Core Shell Wood',
        checkpoints: [
          cp(
            'Select core species + rationale',
            [
              'Species chosen (core) documented.',
              'Write WHY it supports the sound target (attack/body/decay).',
              'Confirm stability suitability for chosen construction method.',
              'Use-case: player’s environment (humid touring vs controlled studio) may influence species choice.',
            ],
            'Core species',
            'task',
            false
          ),

          cp(
            'Moisture + stability check',
            [
              'Stock acclimated to shop environment before milling.',
              'Moisture content in acceptable range (record reading + date).',
              'Check for twist/cupping/bow; reject pieces that will fight glue-up.',
              'Visual check: micro-cracks, knots in critical zones, internal stress signs.',
              'Fallback rule: if you’re unsure, swap boards now (cheap) instead of after cutting (expensive).',
            ],
            'Moisture',
            'measurement',
            false
          ),

          cp(
            'Cut list generated',
            [
              'Stave count confirmed (if applicable) + reason (geometry + voice).',
              'Board yield plan: map defects away from structural zones.',
              'Contingency plan: extra staves/stock ready in case of tear-out or movement.',
              'Waste plan documented so you don’t ‘force’ borderline pieces into the build.',
            ],
            'Cut list',
            'task',
            true
          ),
        ],
      },
      {
        id: 'woodVisionLockIn_3',
        weight: 2,
        adminLeftShort: 'Final Spec',
        adminMainTitle: 'Final Spec Freeze (No Silent Changes)',
        portalActiveLabel: 'Freezing Your Final Specification',
        checkpoints: [
          cp(
            'Freeze spec + revision log',
            [
              'Mark spec as vFinal (authoritative).',
              'Any later changes require explicit revision entry (who/what/why/date).',
              'Confirm customer approval is captured for any post-freeze spec changes.',
            ],
            'Freeze vFinal',
            'qc',
            false
          ),

          cp(
            'Confirm tooling/fixture readiness',
            [
              'Jigs/fixtures ready for chosen build style (stave, steam-bent, hybrid).',
              'Bits/blades sharp; correct profiles available (edges/bed cutters).',
              'Dry-run test on scrap for tear-out risk + finish compatibility where applicable.',
            ],
            'Tooling',
            'qc',
            true
          ),

          cp(
            'Confirm timeline checkpoint',
            [
              'Start confirmed and date-stamped.',
              'Major milestones date-stamped (shell complete, finish start, hardware install, tuning, ship).',
              'Risk note: curing + movement can shift timing—buffer protects final quality.',
            ],
            'Timeline',
            'task',
            true
          ),
        ],
      },
    ],
  },

  /* ============================================================
   * 4) Raw Shell Creation
   * ========================================================== */
  rawShellCreation: {
    stageKey: 'rawShellCreation',
    weight: 15,
    adminLeftShort: '4. Raw Shell',
    adminMainTitle: '4. Raw Shell Creation',
    portalLabel: 'Raw Shell Creation',
    estHours: '6–10 hrs',
    avgDays: '3–5 days',
    what: 'We turn raw lumber into a true, stable stave shell: cut, bevel, dry-fit, glue, and clamp. This is where the drum literally comes into existence.',
    why: 'If the shell isn’t square, tight, and tension-balanced here, no amount of hardware or finish will save it later.',
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
    mantra:
      'This is the moment a stack of boards turns into a living, breathing shell.',
    steps: [
      {
        id: 'rawShellCreation_1',
        weight: 5,
        adminLeftShort: 'Milling',
        adminMainTitle: 'Stave/Blank Milling + Prep',
        portalActiveLabel: 'Milling Your Shell Stock',
        checkpoints: [
          cp(
            'Mill stock to spec',
            [
              'Plane thickness consistently (record target thickness + actual range).',
              'Square edges; confirm 90° reference surfaces before miters.',
              'Avoid defects in critical zones (micro cracks, knots near edges, stress lines).',
              'Use-case test: dry clamp a few pieces—do they align without force?',
            ],
            'Mill stock',
            'task',
            false
          ),

          cp(
            'Verify geometry inputs',
            [
              'Confirm stave count matches design + tooling.',
              'Confirm miter angle; verify on scrap before committing to all pieces.',
              'Confirm outer/inner face widths; compare against expected diameter and thickness targets.',
              'Check for cumulative error risk: small variance per piece becomes big out-of-round later.',
            ],
            'Geometry',
            'measurement',
            false
          ),

          cp(
            'Dry fit layout check',
            [
              'Dry clamp alignment check—ring should nearly hold itself before heavy pressure.',
              'Identify gaps; mark high spots; correct before glue (don’t rely on clamp force).',
              'Clock/seam planning: where will final seam live relative to badge/throw?',
              'Pass/fail: if you see daylight, you fix it now.',
            ],
            'Dry fit',
            'qc',
            false
          ),
        ],
      },
      {
        id: 'rawShellCreation_2',
        weight: 6,
        adminLeftShort: 'Glue-Up',
        adminMainTitle: 'Glue-Up + Compression',
        portalActiveLabel: 'Forming Your Raw Shell',
        checkpoints: [
          cp(
            'Glue application verified',
            [
              'Even spread (no starvation) across all mating faces.',
              'Open time respected—stage pieces so you’re not rushing or panicking.',
              'Squeeze-out consistency check: uneven squeeze-out often means uneven pressure or poor fit.',
              'Cleanup plan: remove excess without contaminating surfaces you’ll true later.',
            ],
            'Glue',
            'qc',
            false
          ),

          cp(
            'Compression achieved evenly',
            [
              'Even pressure around shell; avoid crushing one zone to fix another.',
              'No step offsets; seams aligned flush.',
              'Recheck alignment midway (things can drift under clamp pressure).',
              'Pass/fail: shell should look ‘calm’ under compression, not forced.',
            ],
            'Compression',
            'qc',
            false
          ),

          cp(
            'Cure plan executed',
            [
              'Clamp time logged (date/time start and release).',
              'Environment stable during cure (temperature/humidity swings can cause movement).',
              'Do not rush: glue gains strength beyond ‘dry to touch’—patience preserves integrity.',
            ],
            'Cure plan',
            'task',
            false
          ),
        ],
      },
      {
        id: 'rawShellCreation_3',
        weight: 4,
        adminLeftShort: 'Rough True',
        adminMainTitle: 'Final QA Checklist',
        portalActiveLabel: 'Trueing Your Raw Shell',
        portalNote:
          'This is the last full inspection pass, where we verify function, finish, hardware, and sound before the drum is cleared for packing.',
        checkpoints: [
          cp(
            'Rough true shell',
            [
              'Remove squeeze-out cleanly (avoid tearing grain at seams).',
              'Rough true inside/outside surfaces to reveal geometry and tension points.',
              'Watch grain behavior: it ‘tells’ you where stress lives—note areas that fight the cut.',
            ],
            'Rough true',
            'task',
            false
          ),

          cp(
            'Roundness measurement',
            [
              'Measure across multiple axes (at several heights if possible).',
              'Record min/max variance; note where it’s out and why (seam area, clamp drift, milling variance).',
              'Decision: if variance exceeds tolerance, correct now—finish/hardware will not fix geometry later.',
            ],
            'Roundness',
            'measurement',
            false
          ),

          cp(
            'Shell integrity QC',
            [
              'No seam failures, no visible glue voids, no cracks developing.',
              'Tap test around circumference—listen for dead spots or suspicious ‘clicks’.',
              'Visual inspection under strong light; any structural concern pauses the workflow for correction.',
            ],
            'Integrity',
            'qc',
            false
          ),
        ],
      },
    ],
  },

  /* ============================================================
   * 5) Shell Trueing & Torch Tune
   * ========================================================== */
  shellTrueingTorchTune: {
    stageKey: 'shellTrueingTorchTune',
    weight: 17,
    adminLeftShort: '5. True + Tune',
    adminMainTitle: '5. Shell Trueing & Torch Tune',
    portalLabel: 'Shell Trueing & Torch Tune',
    estHours: '5–8 hrs',
    avgDays: '3–4 days',
    what: 'We true the shell inside and out, finalize thickness, reinforce stress points, and perform your Torch Tune process so the shell “rings with intent” before any hardware touches it.',
    why: 'This is where the drum learns how to vibrate. A well-trued shell is easier to tune, stays in tune longer, and feels alive at any dynamic.',
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
    mantra:
      'If a drum is going to “just lock in,” it has to learn that language right here.',
    steps: [
      {
        id: 'shellTrueingTorchTune_1',
        weight: 7,
        adminLeftShort: 'Precision True',
        adminMainTitle: 'Precision Trueing (Flat + Round)',
        portalActiveLabel: 'Precision-Trueing Your Shell',
        checkpoints: [
          cp(
            'True bearing surfaces flat',
            [
              'Top and bottom planes true; confirm no rocking on a verified flat reference.',
              'Check multiple positions: rotate shell on surface and test for wobble.',
              'Log corrective passes required (so you can correlate to prior roundness notes).',
              'Use-case test: uneven bearing planes cause head seating issues and unpredictable tuning.',
            ],
            'Flatness',
            'measurement',
            false
          ),
          cp(
            'Confirm final thickness range',
            [
              'Measure thickness at multiple clock positions.',
              'Confirm within target thickness range for the intended voice (projection vs sensitivity).',
              'Log min/max thickness + where extremes occur (helps diagnose later if needed).',
              'Pass/fail: avoid abrupt thickness transitions (they can create weird resonance nodes).',
            ],
            'Thickness',
            'measurement',
            false
          ),
          cp(
            'Inside surface refinement',
            [
              'Refine inside surface for feel + resonance (remove chatter marks/tear-out).',
              'Keep passes consistent; avoid creating ‘pockets’ or dips.',
              'Touch test: interior should feel continuous (players feel this subconsciously).',
              'Use-case: rough interior can add unwanted harshness or dead spots.',
            ],
            'Inside refine',
            'task',
            true
          ),
        ],
      },
      {
        id: 'shellTrueingTorchTune_2',
        weight: 5,
        adminLeftShort: 'Torch Tune',
        adminMainTitle: 'Torch Tune (Stability + Voice)',
        portalActiveLabel: 'Torch-Tuning Your Shell',
        checkpoints: [
          cp(
            'Torch tune executed safely',
            [
              'Even heat application around shell (consistent pace and distance).',
              'No scorching/hot spots; stop immediately if color shifts too aggressively.',
              'Keep passes uniform—this is controlled conditioning, not dramatic burning.',
              'Safety: ventilation + fire readiness. Never improvise here.',
            ],
            'Torch tune',
            'qc',
            false
          ),
          cp(
            'Post-tune rest + recheck',
            [
              'Allow rest period before re-measuring (wood needs to settle).',
              'Recheck roundness + flatness; log any movement and corrective actions.',
              'Decision: if movement exceeds tolerance, correct now before sanding/finish.',
            ],
            'Recheck',
            'measurement',
            false
          ),
        ],
      },
      {
        id: 'shellTrueingTorchTune_3',
        weight: 5,
        adminLeftShort: 'Prep Sand',
        adminMainTitle: 'Surface Prep Sanding',
        portalActiveLabel: 'Preparing Your Shell Surface',
        checkpoints: [
          cp(
            'Sand progression completed',
            [
              'Consistent grit progression (no skipping).',
              'Edges protected (don’t round profiles unintentionally).',
              'No visible swirls at final grit (inspect between grits).',
              'Use-case: finish will magnify sanding mistakes under raking light.',
            ],
            'Sand prog',
            'qc',
            false
          ),
          cp(
            'Final inspection under raking light',
            [
              'Inspect under raking light from multiple angles (rotate shell).',
              'Look for scratches, low spots, glue lines, seam telegraphing, uneven sheen.',
              'Correct defects before moving forward—finish is not a hiding layer.',
            ],
            'Raking QC',
            'qc',
            false
          ),
        ],
      },
    ],
  },

  /* ============================================================
   * 6) Exterior Art & Finish
   * ========================================================== */
  exteriorArtFinish: {
    stageKey: 'exteriorArtFinish',
    weight: 20,
    adminLeftShort: '6. Finish',
    adminMainTitle: '6. Exterior Art & Finish',
    portalLabel: 'Exterior Art & Finish',
    estHours: '8–14 hrs',
    avgDays: '7–10 days',
    what: 'We apply veneer, resin accents, and finish. This is where the drum starts to look like the piece you imagined — and where we protect the wood for decades of playing.',
    why: 'Finish is more than looks. It affects how the shell breathes, how the grain moves, and how the drum ages on the road and in the studio.',
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
    mantra:
      'This is where people start saying “I almost don’t want to play it… almost.”',
    steps: [
      {
        id: 'exteriorArtFinish_1',
        weight: 7,
        adminLeftShort: 'Bond Prep',
        adminMainTitle: 'Bond Prep (Sealer + Surface)',
        portalActiveLabel: 'Preparing Your Shell for Finish',
        checkpoints: [
          cp(
            'Seal strategy applied',
            [
              'Sealer compatible with veneer + resin system (no surprise reactions).',
              'Even coat; prevent blotching; confirm uniform absorption.',
              'Dry time respected per product—don’t trap solvents under later layers.',
              'Use-case: sealing is where luxury finishes are either born or doomed.',
            ],
            'Seal prep',
            'qc',
            false
          ),
          cp(
            'Adhesion readiness',
            [
              'Surface cleaned/degreased; hands/gloves discipline in finish zone.',
              'Dust removal complete (tack + air + wipe) right before application.',
              'No contamination (silicone, oils, wax) — if suspected, stop and reset.',
              'Test method: tape pull test on scrap system if you’re mixing products.',
            ],
            'Adhesion',
            'qc',
            false
          ),
        ],
      },
      {
        id: 'exteriorArtFinish_2',
        weight: 6,
        adminLeftShort: 'Apply Veneer',
        adminMainTitle: 'Apply Veneer (Exact Match)',
        portalActiveLabel: 'Applying Your Veneer',
        checkpoints: [
          cp(
            'Grain orientation confirmed',
            [
              'Matches reference intent (centerline/seam decision locked).',
              'Seam placement chosen intentionally relative to badge/throw.',
              'Wrap direction confirmed; figure direction consistent under rotation.',
              'Use-case test: rotate under bright light—does the flow feel premium from all angles?',
            ],
            'Orientation',
            'qc',
            false
          ),
          cp(
            'Veneer applied without defects',
            [
              'No bubbles/voids; pressure even; edges stable.',
              'Seams tight (no lift); no glue bleed that will telegraph through finish.',
              'Pass/fail: if your eye catches the seam instantly, it will always catch it—fix now.',
            ],
            'Veneer QC',
            'qc',
            false
          ),
        ],
      },
      {
        id: 'exteriorArtFinish_3',
        weight: 4,
        adminLeftShort: 'Resin/Color',
        adminMainTitle: 'Resin / Color Accent Integration',
        portalActiveLabel: 'Integrating Your Accent Work',
        checkpoints: [
          cp(
            'Accent behavior enforced',
            [
              'Speckled integration (NOT streaks/stripes).',
              'Lives in grain/knots/stress points (organic, not painted).',
              'Wraps full circumference (no isolated center panel).',
              'No harsh “electric” lines; keep it subtle and luxurious.',
              'Use-case: under macro lighting it should look like it grew there.',
            ],
            'Accent rules',
            'qc',
            false
          ),
          cp(
            'Color verified vs HEX',
            [
              'HEX captured and referenced.',
              'Test swatch compared under similar lighting (warm + cool light checks).',
              'Adjust tone BEFORE committing to full shell if it reads wrong.',
            ],
            'HEX match',
            'measurement',
            true
          ),
        ],
      },
      {
        id: 'exteriorArtFinish_4',
        weight: 3,
        adminLeftShort: 'Clear + Cure',
        adminMainTitle: 'Clearcoat + Cure',
        portalActiveLabel: 'Finishing and Curing Your Shell',
        checkpoints: [
          cp(
            'Clearcoat applied evenly',
            [
              'No runs/sags; consistent film build.',
              'Orange peel within tolerance; no dry spray beyond correction ability.',
              'Thin, controlled coats > thick hero coats (depth comes from patience).',
              'Use-case: uneven clear becomes visible forever under raking light.',
            ],
            'Clear',
            'qc',
            false
          ),
          cp(
            'Cure schedule logged',
            [
              'Cure time recorded; handling discipline maintained.',
              'Environment stable during cure (temp/humidity).',
              'Do not rush leveling/buffing—premature work causes witness lines and soft finish issues.',
            ],
            'Cure',
            'task',
            false
          ),
        ],
      },
    ],
  },

  /* ============================================================
   * 7) Edges & Snare Beds
   * ========================================================== */
  edgesSnareBeds: {
    stageKey: 'edgesSnareBeds',
    weight: 14,
    adminLeftShort: '7. Edges',
    adminMainTitle: '7. Edges & Snare Beds',
    portalLabel: 'Edges & Snare Beds',
    estHours: '3–6 hrs',
    avgDays: '1 day',
    what: 'We cut and blend bearing edges and snare beds so heads seat perfectly and wires respond crisply at any dynamic.',
    why: 'Edges and beds are where feel, tuning ease, and wire response either shine or fall apart. Done well, they make the drum feel like it “just locks in.”',
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
    mantra:
      'This is the thin line between “annoying to tune” and “it just lands where you want it.”',
    steps: [
      {
        id: 'edgesSnareBeds_1',
        weight: 6,
        adminLeftShort: 'Bearing Edges',
        adminMainTitle: 'Cut Bearing Edges',
        portalActiveLabel: 'Cutting Your Bearing Edges',
        checkpoints: [
          cp(
            'Edge profile executed',
            [
              'Profile matches spec (angle/roundover) and intended voice (sharp = articulate, round = forgiving).',
              'Clean apex; no tear-out; consistent cutter behavior around the shell.',
              'Consistency check: run fingertip slowly—no ‘changes’ should be felt.',
              'Use-case: edge inconsistency = unpredictable tuning + weird overtones.',
            ],
            'Profile',
            'qc',
            false
          ),
          cp(
            'Edge flatness verified',
            [
              'Confirm even contact on reference surface; no high spots/rocking.',
              'Rotate shell and repeat test (multiple orientations).',
              'Log any corrective truing (so you can correlate with head seating later).',
            ],
            'Flatness',
            'measurement',
            false
          ),
          cp(
            'Edge finish polish',
            [
              'Polish/sand to final feel (no burrs, no micro chips).',
              'Touch test: smooth and continuous with no sharp ‘ticks’.',
              'Use-case: micro-chips can cause tuning instability and early head wear.',
            ],
            'Polish',
            'task',
            true
          ),
        ],
      },
      {
        id: 'edgesSnareBeds_2',
        weight: 5,
        adminLeftShort: 'Snare Beds',
        adminMainTitle: 'Cut Snare Beds',
        portalActiveLabel: 'Cutting Your Snare Beds',
        checkpoints: [
          cp(
            'Bed depth + symmetry verified',
            [
              'Even depth on both sides; smooth transitions into bearing edge.',
              'No abrupt ledges; beds should feel ‘melted’ not carved.',
              'Measure + compare left/right; correct immediately if asymmetric.',
              'Use-case: poor symmetry = wire pull, uneven buzz, choking at low dynamics.',
            ],
            'Depth',
            'measurement',
            false
          ),
          cp(
            'Wire alignment confirmed',
            [
              'Throw/butt centered across snare beds; wire path straight.',
              'Test with plate/wires to ensure alignment under tension.',
              'Use-case: if it pulls to one side, it will never feel ‘effortless’ to tune.',
            ],
            'Alignment',
            'qc',
            false
          ),
          cp(
            'Bed surface finished clean',
            [
              'No chatter marks; no tear-out in bed zone.',
              'Final smoothness verified by fingertip + raking light.',
              'Use-case: rough beds produce inconsistent wire response and noisy artifacts.',
            ],
            'Bed finish',
            'qc',
            true
          ),
        ],
      },
      {
        id: 'edgesSnareBeds_3',
        weight: 3,
        adminLeftShort: 'Head Seat',
        adminMainTitle: 'Head Seating + Fit Check',
        portalActiveLabel: 'Checking Head Seating and Hoop Fit',
        checkpoints: [
          cp(
            'Head seats cleanly',
            [
              'Head drops on without binding; no rocking.',
              'Even collar contact; rotate head and confirm no ‘catch’ points.',
              'Use-case: binding indicates geometry issues that will show up as tuning weirdness.',
            ],
            'Head seat',
            'qc',
            false
          ),
          cp(
            'Hoop fit check',
            [
              'Hoop sits evenly; no interference points with hardware/finish edges.',
              'Confirm roundness under hoop; tighten lightly and observe even tension.',
              'Use-case: hoop interference creates false tension readings and tuning instability.',
            ],
            'Hoop fit',
            'measurement',
            false
          ),
        ],
      },
    ],
  },

  /* ============================================================
   * 8) Hardware & Assembly
   * ========================================================== */
  hardwareAssembly: {
    stageKey: 'hardwareAssembly',
    weight: 9,
    adminLeftShort: '8. Hardware',
    adminMainTitle: '8. Hardware & Assembly',
    portalLabel: 'Hardware & Assembly',
    estHours: '3–6 hrs',
    avgDays: '2 days',
    what: 'We install lugs, hoops, throw, wires, and heads, and torque everything to spec.',
    why: 'Hardware is how you physically interact with the shell. Clean drilling, accurate layout, and solid assembly keep the drum quiet, stable, and road-worthy.',
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
    mantra:
      'This is where the shell gets its armor and becomes a drum built to tour.',
    steps: [
      {
        id: 'hardwareAssembly_1',
        weight: 3,
        adminLeftShort: 'Layout',
        adminMainTitle: 'Hardware Layout + Marking',
        portalActiveLabel: 'Laying Out Your Hardware',
        checkpoints: [
          cp(
            'Confirm lug count + spacing',
            [
              'Verify lug count matches spec (6/8/10).',
              'Verify spacing plan before drilling; mark clock positions precisely.',
              'Dry-visual test: rotate shell and confirm spacing looks balanced (no ‘crowded’ zones).',
              'Use-case: spacing errors become permanent and visually loud.',
            ],
            'Lug spacing',
            'measurement',
            false
          ),
          cp(
            'Confirm throw/butt alignment',
            [
              'Throw/butt centered across snare beds; wire path straight.',
              'Test plate alignment before drilling; confirm no collision with lugs/internal hardware.',
              'Use-case: misalignment creates tuning frustration forever.',
            ],
            'Throw align',
            'qc',
            false
          ),
          cp(
            'Badge placement confirmed',
            [
              'Centered vertically on shell (non-negotiable).',
              'Orientation correct; reads cleanly in photos.',
              'Finish matches hardware spec.',
              'Use-case: badge is the signature—must feel intentional, not ‘placed somewhere’.',
            ],
            'Badge place',
            'qc',
            false
          ),
        ],
      },
      {
        id: 'hardwareAssembly_2',
        weight: 4,
        adminLeftShort: 'Drill',
        adminMainTitle: 'Drilling + Install Hardware',
        portalActiveLabel: 'Installing Your Hardware',
        checkpoints: [
          cp(
            'Drill clean + tear-out controlled',
            [
              'Backer used where needed; control exit tear-out.',
              'Hole edges clean; no chipping that compromises finish.',
              'Hardware sits flush; no forced seating.',
              'Use-case: one ugly hole ruins the heirloom feel—slow down here.',
            ],
            'Drill QC',
            'qc',
            false
          ),
          cp(
            'Install lugs + gaskets/isolators',
            [
              'All lugs installed; verify consistent orientation and alignment.',
              'No binding; screws snug but not crushing wood/finish.',
              'Even tension across mounts; re-check after initial snugging.',
              'Use-case: uneven lug seating causes buzzing and tuning drift.',
            ],
            'Install lugs',
            'task',
            false
          ),
          cp(
            'Install throw + butt + strap/cord',
            [
              'Smooth throw action; no scraping/binding.',
              'Alignment confirmed under tension; strap/cord even.',
              'Use-case: throw should feel ‘luxury smooth’—not gritty or stiff.',
            ],
            'Throw/butt',
            'task',
            false
          ),
          cp(
            'Hoops: diecast + correct fit',
            [
              'Diecast hoops installed (confirm).',
              'No interference with lugs/finish; seats evenly.',
              'Light tension test: confirm hoop pulls down uniformly.',
              'Use-case: diecast hoops are part of your sound/feel signature—fit must be perfect.',
            ],
            'Diecast fit',
            'qc',
            false
          ),
        ],
      },
      {
        id: 'hardwareAssembly_3',
        weight: 2,
        adminLeftShort: 'Heads/Wires',
        adminMainTitle: 'Heads + Snare Wires Installed',
        portalActiveLabel: 'Installing Your Heads and Snare Wires',
        checkpoints: [
          cp(
            'Install heads',
            [
              'Batter + snare-side installed; initial tension even.',
              'Seat collars gently; re-check that head is not binding at any point.',
              'Use-case: sloppy initial seating leads to unstable tuning and false buzz diagnosis.',
            ],
            'Heads',
            'task',
            false
          ),
          cp(
            'Install snare wires centered',
            [
              'Wire centered over beds; even strap/cord tension.',
              'Check response at low dynamics; no off-center buzz zones.',
              'Use-case: wires should ‘disappear’ until you need them—then respond instantly.',
            ],
            'Wires',
            'qc',
            false
          ),
        ],
      },
    ],
  },

  /* ============================================================
   * 9) Legacy Tuning & Media
   * ========================================================== */
  legacyTuningMedia: {
    stageKey: 'legacyTuningMedia',
    weight: 10,
    adminLeftShort: '9. Tuning',
    adminMainTitle: '9. Legacy Tuning & Media',
    portalLabel: 'Legacy Tuning & Media',
    estHours: '4–8 hrs',
    avgDays: '3–5 days',
    what: 'We run your Legacy resonance analysis, tune the drum to its sweet spots, and capture the story in photos, audio, and verification media.',
    why: 'This is where the drum’s voice is documented and preserved. You’re not just getting a snare — you’re getting a record of how it was born.',
    techniques: [
      'Frequency-based tuning + touch-based fine-tuning',
      'Multi-mic photo and audio capture',
      'Legacy verification and documentation workflow',
    ],
    tools: [
      'Frequency/tuner apps + reference tones',
      'Studio mics + interface',
      'Camera + lighting setup',
      'Portal upload + archive tools',
    ],
    mantra:
      'Here’s where your drum stops being “new gear” and becomes part of your legacy.',
    steps: [
      {
        id: 'legacyTuningMedia_1',
        weight: 4,
        adminLeftShort: 'Tuning Pass',
        adminMainTitle: 'Primary Tuning Pass',
        portalActiveLabel: 'Dialing In Your Drum’s Voice',
        checkpoints: [
          cp(
            'Seat heads + initial stretch',
            [
              'Equalize tension around lugs (star pattern; small increments).',
              'Press/seat carefully; re-tension and re-check after settling.',
              'Use-case: prevent ‘false high lug’ issues that create phantom overtones.',
            ],
            'Seat heads',
            'task',
            false
          ),
          cp(
            'Dial snare response',
            [
              'Snare-side tension balanced for sensitivity target.',
              'Wire tension set so ghost notes speak but rimshots don’t choke.',
              'Test soft/medium/hard hits; confirm consistent articulation across dynamics.',
              'Use-case: the drum must be *musical* at whisper volume, not just impressive loud.',
            ],
            'Snare resp',
            'qc',
            false
          ),
          cp(
            'Control unwanted artifacts',
            [
              'Identify buzz zones and whether they’re wire tension, head seating, bed contact, or lug imbalance.',
              'Make one change at a time; re-test after each adjustment.',
              'Confirm sustain/decay matches target direction (controlled vs open).',
              'Use-case: remove problems without killing character.',
            ],
            'Control buzz',
            'qc',
            false
          ),
        ],
      },
      {
        id: 'legacyTuningMedia_2',
        weight: 4,
        adminLeftShort: 'Media Capture',
        adminMainTitle: 'Capture Media (Sound + Visual)',
        portalActiveLabel: 'Capturing Your Drum’s Sound and Story',
        checkpoints: [
          cp(
            'Record reference audio',
            [
              'Close mic sample + room sample (even phone recordings are useful if consistent).',
              'Capture soft/medium/hard hits; include ghost notes and rimshots.',
              'Use-case: audio becomes the drum’s ‘birth certificate’ and a future service reference.',
            ],
            'Audio',
            'task',
            true
          ),
          cp(
            'Capture beauty photos',
            [
              'Lighting shows grain + accents accurately (avoid color shifts).',
              'Hardware finish visible; badge visible and centered.',
              'Use-case: photos confirm spec compliance and set customer’s emotional payoff.',
            ],
            'Photos',
            'task',
            true
          ),
          cp(
            'Log final tuning notes',
            [
              'Record approximate batter tuning, reso tuning, and wire tension notes.',
              'Note the ‘sweet spot’ window (where it smiles) and any special behavior.',
              'Use-case: customer can return to your intended tuning quickly after head changes.',
            ],
            'Tuning notes',
            'task',
            true
          ),
        ],
      },
      {
        id: 'legacyTuningMedia_3',
        weight: 2,
        adminLeftShort: 'Customer Share',
        adminMainTitle: 'Customer Update + Delivery Prep Notes',
        portalActiveLabel: 'Preparing Your Final Update',
        checkpoints: [
          cp(
            'Send update summary',
            [
              'Share progress + what changed (if anything) and why.',
              'Set delivery expectations; confirm shipping readiness window.',
              'Ask final preference check: head choice, wire feel preference, desired tuning vibe on arrival.',
            ],
            'Update',
            'task',
            true
          ),
          cp(
            'Finalize portal attachments',
            [
              'Upload photos/audio and tag in correct category.',
              'Set visibility appropriately (customer vs internal).',
              'Sanity test: view from customer portal to confirm everything displays correctly.',
            ],
            'Portal files',
            'qc',
            true
          ),
        ],
      },
    ],
  },

  /* ============================================================
   * 10) Final QA, Packaging & Delivery
   * ========================================================== */
  finalQAPackagingDelivery: {
    stageKey: 'finalQAPackagingDelivery',
    weight: 3,
    adminLeftShort: '10. Final QA',
    adminMainTitle: '10. Final QA, Packaging & Delivery',
    portalLabel: 'Final QA, Packaging & Delivery',
    estHours: '2–4 hrs',
    avgDays: '1–2 days',
    what: 'We run a final inspection, clean and prep the drum, pack it safely, and confirm delivery so you’re ready to play, record, or tour with confidence.',
    why: 'A great drum deserves a great send-off. This step protects the build, your investment, and the story we’ve built together.',
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
    mantra:
      'The build ends here, but the story really starts the first time you hit it in your space.',
    steps: [
      {
        id: 'finalQAPackagingDelivery_1',
        weight: 1,
        adminLeftShort: 'Final QA',
        adminMainTitle: 'Final QA Checklist',
        portalActiveLabel: 'Running Final QA on Your Drum',
        checkpoints: [
          cp(
            'Hardware verification',
            [
              'Lugs are correct style (vintage tube lugs).',
              'Hoops are diecast (non-negotiable).',
              'Hardware finish matches spec; badge finish matches hardware.',
              'Badge placement check: centered vertically; orientation correct.',
              'Quick rattle test: gently shake/tap around hardware zones—silence is craftsmanship.',
            ],
            'Hardware QA',
            'qc',
            false
          ),
          cp(
            'Fit + function verification',
            [
              'Throw operates smoothly; no scraping/binding; consistent feel through travel.',
              'No rattle/buzz from loose hardware; all fasteners properly seated.',
              'Head seats properly; hoop seats evenly; even lug tension possible.',
              'Use-case: customer should be able to tune it without ‘mystery problems’.',
            ],
            'Function QA',
            'qc',
            false
          ),
          cp(
            'Cosmetic inspection',
            [
              'No finish defects beyond tolerance (runs, pinholes, witness lines, haze).',
              'No scratches/dings; inspect under raking light + phone flash.',
              'Accents behave as specified: speckled, organic, full wrap, no harsh streaks.',
              'Seam/veneer check: does it disappear unless you hunt for it?',
            ],
            'Cosmetic',
            'qc',
            false
          ),
          cp(
            'Sound verification',
            [
              'Hit test across dynamics: whisper ghost notes → rimshots.',
              'Snare response consistent; no weird choke zones.',
              'Sustain/decay matches target direction (controlled vs open).',
              'Use-case: should sound great in the room AND be easy to capture on mic.',
            ],
            'Sound QA',
            'qc',
            false
          ),
        ],
      },
      {
        id: 'finalQAPackagingDelivery_2',
        weight: 1,
        adminLeftShort: 'Pack',
        adminMainTitle: 'Packaging',
        portalActiveLabel: 'Packaging Your Drum',
        checkpoints: [
          cp(
            'Protective packing complete',
            [
              'Shell protected from impact; finish protected from abrasion.',
              'Hardware protected from rub/contact points.',
              'Movement controlled inside packaging (no shifting).',
              'Use-case: survives worst-case carrier handling without cosmetic damage.',
            ],
            'Protection',
            'task',
            false
          ),
          cp(
            'Include documents / care notes',
            [
              'Care + maintenance notes included (cleaning, humidity, tuning habits).',
              'Tuning notes included (sweet spot guidance).',
              'Thank-you / brand insert included (heirloom moment).',
            ],
            'Docs',
            'task',
            true
          ),
          cp(
            'Photo before seal',
            [
              'Quick photo proof of packed condition (top + side).',
              'Attach to project record for documentation.',
              'Use-case: protects you and reassures customer if shipping issues arise.',
            ],
            'Pack photo',
            'task',
            true
          ),
        ],
      },
      {
        id: 'finalQAPackagingDelivery_3',
        weight: 1,
        adminLeftShort: 'Ship/Deliver',
        adminMainTitle: 'Shipping / Delivery',
        portalActiveLabel: 'Preparing Your Drum for Delivery',
        checkpoints: [
          cp(
            'Label + carrier confirmed',
            [
              'Address verified again (read-back).',
              'Carrier + service selected; insurance set appropriately.',
              'Signature requirement decision documented if needed.',
              'Use-case: high-end builds deserve high-confidence delivery.',
            ],
            'Label',
            'qc',
            false
          ),
          cp(
            'Tracking shared with customer',
            [
              'Tracking sent immediately.',
              'Delivery expectations communicated (ETA window, signature notes).',
              'Offer arrival guidance: let the drum acclimate if extreme temperatures occurred in transit.',
            ],
            'Tracking',
            'task',
            false
          ),
          cp(
            'Closeout + archive',
            [
              'Project status set to finished; final media stored.',
              'Revision log finalized; spec snapshot preserved for future service/support.',
              'Queue follow-up reminder (check-in after delivery + after first gig/session).',
            ],
            'Closeout',
            'task',
            true
          ),
        ],
      },
    ],
  },
};

/* ============================================================
   BACKWARDS COMPAT EXPORTS
   DO NOT DELETE — other parts of the app still use these.
   Derived from STAGE_TEMPLATES so STAGE_TEMPLATES stays source-of-truth.
   ========================================================== */

// 1) Flatten stages into a STAGES array
export const STAGES = Object.values(STAGE_TEMPLATES).map(
  (stage, stageIndex) => ({
    stageKey: stage.stageKey,
    weight: stage.weight,
    adminLeftShort: stage.adminLeftShort,
    adminMainTitle: stage.adminMainTitle,
    stageNumber: stageIndex + 1,
    steps: stage.steps.map((step, stepIndex) => ({
      ...step,
      stepNumber: stepIndex + 1,
    })),
  })
);

// 2) Quick lookup maps
export const STAGE_DEFS = STAGES.reduce((acc, s) => {
  acc[s.stageKey] = s;
  return acc;
}, {});

// 3) Flatten all steps (ProjectProgress expects this)
export const STEPS = STAGES.flatMap((stage) =>
  stage.steps.map((step) => ({
    ...step,
    stageKey: stage.stageKey,
    stageWeight: stage.weight,
    stageAdminLeftShort: stage.adminLeftShort,
    stageAdminMainTitle: stage.adminMainTitle,
  }))
);

export const STEP_DEFS = STEPS.reduce((acc, step) => {
  acc[step.id] = step;
  return acc;
}, {});

// 4) Legacy stageKey aliases (old Firestore values → new stageKey)
export const LEGACY_STAGEKEY_ALIASES = {
  woodPreparation: 'woodVisionLockIn',
  shellConstruction: 'rawShellCreation',
  fineTuning: 'shellTrueingTorchTune',
  shellExteriorFinish: 'exteriorArtFinish',
  bearingEdges: 'edgesSnareBeds',
  snareBedCutting: 'edgesSnareBeds',
  hardwareDrilling: 'hardwareAssembly',
  tuningDetailing: 'legacyTuningMedia',
  qualityCheck: 'finalQAPackagingDelivery',
};

// 5) Helper to resolve stage key safely
export const resolveStageKey = (key) => {
  if (!key) return null;
  return LEGACY_STAGEKEY_ALIASES[key] || key;
};