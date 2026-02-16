// src/components/StepComponentTemplate.js
import React, { useMemo, useState, useEffect } from 'react';
import './StepComponentTemplate.css';

/* ---------- Time helpers ---------- */

const fmtHM = (totalSeconds = 0) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
};

/** Preset time options for the dropdown (label + seconds). */
const TIME_PRESETS = [
  { label: '0 min', seconds: 0 },
  { label: '5 min', seconds: 5 * 60 },
  { label: '10 min', seconds: 10 * 60 },
  { label: '15 min', seconds: 15 * 60 },
  { label: '20 min', seconds: 20 * 60 },
  { label: '25 min', seconds: 25 * 60 },
  { label: '30 min', seconds: 30 * 60 },
  { label: '35 min', seconds: 35 * 60 },
  { label: '40 min', seconds: 40 * 60 },
  { label: '45 min', seconds: 45 * 60 },
  { label: '50 min', seconds: 50 * 60 },
  { label: '55 min', seconds: 55 * 60 },
  { label: '1 hr', seconds: 60 * 60 },
  { label: '1 hr 10 min', seconds: 70 * 60 },
  { label: '1 hr 20 min', seconds: 80 * 60 },
  { label: '1 hr 30 min', seconds: 90 * 60 },
  { label: '1 hr 40 min', seconds: 100 * 60 },
  { label: '1 hr 50 min', seconds: 110 * 60 },
  { label: '2 hr', seconds: 120 * 60 },
  { label: '2 hr 15 min', seconds: 135 * 60 },
  { label: '2 hr 30 min', seconds: 150 * 60 },
  { label: '2 hr 45 min', seconds: 165 * 60 },
  { label: '3 hr', seconds: 180 * 60 },
  { label: '3 hr 20 min', seconds: 200 * 60 },
  { label: '3 hr 40 min', seconds: 220 * 60 },
  { label: '4 hr', seconds: 240 * 60 },
  { label: '4 hr 30 min', seconds: 270 * 60 },
  { label: '5 hr', seconds: 300 * 60 },
  { label: '6 hr', seconds: 360 * 60 },
  { label: '8 hr', seconds: 480 * 60 },
  { label: '10 hr', seconds: 600 * 60 },
  { label: '12 hr', seconds: 720 * 60 },
];

/** Find the preset closest to an arbitrary seconds value. */
const findClosestPreset = (totalSeconds = 0) => {
  let closest = TIME_PRESETS[0];
  let bestDiff = Math.abs(totalSeconds - closest.seconds);
  for (const p of TIME_PRESETS) {
    const diff = Math.abs(totalSeconds - p.seconds);
    if (diff < bestDiff) {
      bestDiff = diff;
      closest = p;
    }
  }
  return closest;
};

/**
 * We allow checkpoint state to be:
 * - false (not done)
 * - true  (done)
 * - "na"  (not applicable)
 *
 * This keeps backward-compat with existing boolean arrays.
 */
const normalizeCheckpointArray = (arr, len) => {
  const base = Array.isArray(arr) ? arr : [];
  const normalized = base.map((v) => {
    if (v === 'na') return 'na';
    return v === true; // true or false
  });

  const padded = normalized.concat(
    new Array(Math.max(0, len - normalized.length)).fill(false)
  );

  return padded.slice(0, len);
};

const isCheckpointDone = (v) => v === true;
const isCheckpointNA = (v) => v === 'na';

/**
 * BOOK + UI CHECKPOINT DEFINITIONS
 *
 * Each checkpoint item supports:
 * - ui: what admin/artist portal shows
 * - book: what export/booklet uses
 * - type: "task" | "measurement" | "qc" (optional but nice for export grouping)
 * - naAllowed: boolean (default true)
 */
const cp = (
  ui,
  details = [],
  book = null,
  type = 'task',
  naAllowed = true
) => ({
  ui,
  details, // array of bullet strings shown under the checkpoint in the main panel
  book: book ?? ui,
  type,
  naAllowed,
});

/**
 * CHECKPOINTS_BY_ITEM_ID
 *
 * Keyed by checklist item `id` from defaultStepData.
 * Each value is an array of {ui, book, type, naAllowed}.
 */
export const CHECKPOINTS_BY_ITEM_ID = {
  /* =========================================================
   * 1) Discovery & Design
   * ======================================================= */
  discoveryDesign_1: [
    cp(
      'Capture player identity + musical DNA',
      [
        'Ask: “Which drummers shaped your ear?” Identify stylistic lineage (ex: Bonham = body, Copeland = articulation, Garstka = precision).',
        'Map their musical environments: studio, touring, church, sessions, home recording.',
        'Determine attack personality: fingertip player, balanced striker, or heavy hitter.',
        'Listen for language clues like “fat,” “crack,” “pillowy,” or “surgical” — these reveal tonal psychology.',
      ],
      'Player identity'
    ),

    cp(
      'Define primary performance environment',
      [
        'Studio priority: tuning range, overtone control, microphone friendliness.',
        'Live priority: projection, rimshot authority, mix penetration without harshness.',
        'Hybrid priority: shell must translate across tunings without losing personality.',
        'Ask what frustrates them most in their current environments — that is often the design target.',
      ],
      'Performance environment'
    ),

    cp(
      'Audit current snare arsenal',
      [
        'Identify their “desert island” snare and WHY it wins.',
        'Ask which drum they never reach for — and what failed (tone, feel, response).',
        'Listen for gaps: lack of body, poor ghost response, uncontrolled ring, limited tuning window.',
        'This step prevents accidentally rebuilding a drum they already own.',
      ],
      'Current arsenal'
    ),

    cp(
      'Expose tonal frustrations + response gaps',
      [
        'Buzz sensitivity: determine tolerance for sympathetic vibration.',
        'Feel under stick: too rigid vs too elastic dramatically informs shell thickness and edge geometry.',
        'Dynamic behavior: confirm whether ghost notes must remain present at lower tunings.',
        'Projection reality check: many players want “loud” when they actually need focused midrange.',
      ],
      'Tonal gaps'
    ),

    cp(
      'Lock non-negotiables + emotional drivers',
      [
        'Document absolute requirements: lug count, finish family, hoops, throw style, diameter/depth comfort zone.',
        'Surface emotional language: “I’ve always wanted…”, “My dream snare is…”. These matter.',
        'Identify visual identity expectations — some players bond visually before they ever strike the drum.',
        'Set budget guardrails early to protect design integrity.',
      ],
      'Non-negotiables'
    ),

    cp(
      'Define success criteria for the build',
      [
        'Ask: “When you first hit this drum, what makes you immediately smile?”',
        'Clarify whether success is tonal uniqueness, versatility, familiarity, or artistic statement.',
        'Capture the single sentence that defines the drum’s mission — this becomes the north star for every decision.',
        'Example: “Explosive rimshot with studio-ready ghost sensitivity.”',
      ],
      'Success criteria'
    ),
  ],

  discoveryDesign_2: [
    cp(
      'Define target “voice” (dry/fat/crack/air)',
      [
        'Dry: fast decay, controlled overtone, tight snare response.',
        'Fat: thicker fundamental, slightly slower bloom, “big” center note.',
        'Crack: strong upper-mid bite; rimshot authority.',
        'Air: open + breathy; longer decay; still musical.',
      ],
      'Target voice'
    ),
    cp(
      'Reference tracks/artists (links)',
      [
        'Ask for 2–3 songs and timestamp the snare moments.',
        'Example: “Verse ghost notes feel like ___, chorus rimshots like ___.”',
        'Capture both low tuning and high tuning examples if possible.',
      ],
      'References'
    ),
    cp(
      'Dynamic response target (ghosts to rimshots)',
      [
        'Define: should ghosts stay audible at medium-low tuning?',
        'Define: should rimshots “bark” or “crack” or “thud”?',
        'Example: worship snare wants controlled crack + soft ghost clarity.',
      ],
      'Dynamics'
    ),
    cp(
      'Snare response + buzz tolerance target',
      [
        'Buzz tolerance: “I want it dry + tight” vs “I don’t mind some air.”',
        'Decide wire count preference (ex: 20 vs 24 vs 42).',
        'Decide snare bed depth approach (shallow = open, deeper = tighter response).',
      ],
      'Snare response'
    ),
  ],

  discoveryDesign_3: [
    cp(
      'Confirm diameter + depth target',
      [
        'Example: 14x6.5 = big body + fat center note.',
        'Example: 14x5 = faster + tighter articulation.',
        'Confirm how deep they want it to *feel* in rimshot.',
      ],
      'Size'
    ),
    cp(
      'Stave count / shell thickness target (initial)',
      [
        'Example: thicker shell = punch + projection + focus.',
        'Example: thinner shell = sensitivity + openness.',
        'Decide: is it a “weapon” snare or a “nuance” snare?',
      ],
      'Shell plan'
    ),
    cp(
      'Hardware preference (finish / throw / hoops)',
      [
        'Finish examples: chrome (classic), black nickel (premium dark), brass/gold (warm + vintage).',
        'Hoops: diecast always for focus + rimshot feel.',
        'Throw preference: smooth action, reliability, plate style.',
      ],
      'Hardware'
    ),
    cp(
      'Head preference + wire preference',
      [
        'Head examples: coated for warmth + control, clear for brighter articulation.',
        'Wire examples: 20-strand balanced; 42 for wide, sensitive “spread.”',
        'Confirm if they ever play brushes.',
      ],
      'Heads/wires'
    ),
  ],

  discoveryDesign_4: [
    cp(
      'Veneer direction + aesthetic lane',
      [
        'Example: mappa burl = wild figure, needs stabilization mindset.',
        'Example: walnut = classic dark + elegant grain.',
        'Decide seam placement (front vs back) and orientation.',
      ],
      'Veneer lane'
    ),
    cp(
      'Resin/accent intent',
      [
        'Confirm HEX and whether it’s subtle vs bold.',
        'Confirm organic logic: stress points/knots only (no stripe bands).',
        'Example: “deep teal in burl eyes + micro-speckle wrap.”',
      ],
      'Resin plan'
    ),
    cp(
      'Badge/logo intent',
      [
        'Standard badge = consistent brand.',
        'Custom badge example: artist initials, legacy mark, or anniversary stamp.',
        'Confirm placement: centered vertically on shell.',
      ],
      'Badge plan'
    ),
  ],

    discoveryDesign_5: [
    cp(
      'Confirm spec feasibility (size / lugs / construction)',
      [
        'Validate diameter/depth is realistic for the intended voice + feel (ex: 14x7 = massive body, but slower response; 14x5 = quicker articulation).',
        'Confirm lug count fits the shell + tuning intent (6 = open + fast; 8 = balanced; 10 = max tension stability + high-tune control).',
        'Confirm construction method matches goals (stave thickness vs sensitivity; reinforcement rings only when truly needed).',
        'Call out any “physics conflicts” early (ex: ultra-thin shell + aggressive diecast rimshots + heavy resin = higher risk).',
      ],
      'Spec feasibility'
    ),

    cp(
      'Materials + finish feasibility (veneer / resin / clear system)',
      [
        'Confirm veneer behavior: burl/figured woods may require stabilization + slower bonding strategy.',
        'Confirm seam strategy: front vs back; align grain flow; avoid seam landing on high-stress zones.',
        'Resin logic must be organic: fills knots/stress points, speckled integration, wraps the shell (no stripe bands).',
        'Finish system call: confirm cure windows (don’t promise delivery inside a cure window you can’t compress).',
      ],
      'Materials + finish feasibility'
    ),

    cp(
      'Timeline reality check (schedule + buffer)',
      [
        'Estimate stage durations based on build complexity (burl + resin + high-gloss = longer).',
        'Confirm customer deadline constraints (gig/tour/record date). If hard deadline exists, decide “rush not allowed” vs “scope reduction.”',
        'Set buffer expectation clearly (ex: “Target Apr 15–Apr 29” not “final week”).',
        'Identify non-negotiable cure/settle gates that protect quality (finish cure, glue cure, stabilization rest).',
      ],
      'Timeline feasibility'
    ),

    cp(
      'Budget guardrails + change policy acknowledged',
      [
        'Confirm what is included vs add-ons (ex: custom badge, premium hardware finish, special heads/wires).',
        'Confirm how spec changes are handled after approvals (ex: “Change after Vision Lock may add cost + time”).',
        'If budget and vision conflict, document the tradeoff decision (ex: keep premium hardware, simplify resin).',
        'Get written acknowledgment: “Approved / understood.”',
      ],
      'Budget + change policy'
    ),

    cp(
      'Risk assessment + mitigation plan documented',
      [
        'List risks specific to this build: burl veneer cracking, resin sink-back, winter humidity movement, ultra-thin walls, aggressive edge profile, etc.',
        'Assign mitigation actions (test panel, slower clamp strategy, extra stabilization time, additional coats/cure).',
        'Define “stop conditions” (ex: veneer stress = pause and re-stabilize; finish haze = extend cure).',
        'Record the plan in notes so the customer understands *why* the schedule includes buffer.',
      ],
      'Risk plan'
    ),

    cp(
      'Feasibility gate sign-off (internal + customer)',
      [
        'Internal sign-off: “This build is achievable to standard without cutting corners.”',
        'Customer sign-off: confirm the north-star mission statement (ex: “Explosive rimshot + studio ghost clarity”).',
        'Lock the next step trigger: deposit/portal/approvals sequence is clear.',
        'When this is checked, you’re officially cleared to enter Commitment & Portal Setup.',
      ],
      'Feasibility sign-off'
    ),
  ],

  /* =========================================================
   * 2) Commitment & Portal Setup
   * ======================================================= */
  commitmentPortal_1: [
    cp(
      'Deposit received + confirmed',
      [
        'Verify Stripe/receipt recorded.',
        'Confirm deposit terms: non-refundable vs applied to total.',
        'Example: “Deposit received — build starts on ___.”',
      ],
      'Deposit confirmed'
    ),
    cp(
      'Order details finalized + acknowledged',
      [
        'Confirm spec sheet is accurate (size, lugs, finish, hoops, throw).',
        'Confirm customer agrees to guardrails + change policy.',
        'Example: customer replies “Approved” in writing.',
      ],
      'Order finalized'
    ),
  ],

  commitmentPortal_2: [
    cp(
      'Project created in portal',
      [
        'Create project doc + initialize all step checklists.',
        'Confirm start/target completion dates show correctly.',
        'Example: project ID assigned + visible in dashboard.',
      ],
      'Project created'
    ),
    cp(
      'Customer access verified',
      [
        'Customer can log in and see project.',
        'They can view uploads, progress, and messages.',
        'Example: “Customer confirmed access — screenshot received.”',
      ],
      'Access verified'
    ),
    cp(
      'Upload sections confirmed',
      [
        'Confirm categories (Build Proposal, Wood Selection, Mockups, Media, Other).',
        'Test: upload a PDF + verify preview modal works.',
        'Example: “Build Proposal uploaded and visible to customer.”',
      ],
      'Uploads confirmed'
    ),
  ],

  commitmentPortal_3: [
    cp(
      'Approval rules defined',
      [
        'Who approves? customer only vs customer + artist.',
        'Turnaround expectation: 24–72 hours.',
        'Example: “No cutting begins until Vision Lock approval.”',
      ],
      'Approval rules'
    ),
    cp(
      'Communication cadence agreed',
      [
        'Example: weekly update (photo + paragraph) every Friday.',
        'Define exceptions: “if anything risky happens, immediate update.”',
        'Set channel preference: portal only vs text/email.',
      ],
      'Cadence'
    ),
    cp(
      'What requires approval vs FYI updates',
      [
        'Approval: veneer choice, resin color, lug count, badge design.',
        'FYI: sanding progress, curing, shop photos.',
        'Example: “We only request approval 2–4 times total.”',
      ],
      'Approval vs FYI'
    ),
  ],

  commitmentPortal_4: [
    cp(
      'Dates set: start + target completion + buffer window',
      [
        'Confirm targetCompletion and buffer rules (ex: +14 days).',
        'Customer deadline check: “Is there an event date this must be ready for?”',
        'Example: “Start Feb 20, Target Apr 15–Apr 29 (buffer).”',
      ],
      'Dates set'
    ),
    cp(
      'Chapter gates defined',
      [
        'Define “done” for each stage (ex: Raw Shell complete = milled, filled, sanded).',
        'Define what photos/documents are delivered at each gate.',
        'Example: gate requires: roundness verified + thickness recorded.',
      ],
      'Gates'
    ),
    cp(
      'Risk flags added',
      [
        'Risk examples: burl veneer, heavy resin, winter humidity swings, ultra-thin shell.',
        'Add mitigation: acclimation time, test panels, longer cure windows.',
        'Example: “Burl veneer flagged — extra stabilization + slow clamp plan.”',
      ],
      'Risk flags'
    ),
  ],

  /* =========================================================
   * 3) Wood & Vision Lock-In  (maps heavily to OLD woodPreparation)
   * ======================================================= */
  woodVisionLockIn_1: [
    cp(
      'Select wood',
      [
        'Example: maple for balance, walnut for warmth, oak for bite.',
        'Match wood choice to target “voice” from Discovery.',
        'Confirm availability + acclimation time.',
      ],
      'Select wood'
    ),
    cp(
      'Check moisture content',
      [
        'Target example: 6–9% (shop stable) before milling.',
        'If high: sticker + acclimate; don’t rush glue-up.',
        'Record moisture in notes (helps explain movement later).',
      ],
      'Moisture check'
    ),
    cp(
      'Cut planning / pencil in measurements',
      [
        'Example: mark each stave with outside face + grain direction.',
        'Plan extra length for trimming/squaring after glue.',
        'Confirm miter angle plan matches stave count.',
      ],
      'Cut plan'
    ),
    cp(
      'Bookmatch + orientation layout; number each stave',
      [
        'Example: align figure so “flow” wraps around shell.',
        'Mark: 1–N staves; indicate top/bottom direction.',
        'Choose seam placement strategy (front vs back).',
      ],
      'Layout + number'
    ),
    cp(
      'Pre-glue test assembly',
      [
        'Dry clamp to check gaps before glue touches wood.',
        'Example: if any joint light shows through, re-joint/plane.',
        'Confirm shell closes evenly without force.',
      ],
      'Dry assembly'
    ),
  ],

    woodVisionLockIn_2: [
    cp(
      'Confirm construction method + shell philosophy',
      [
        'Decide stave vs hybrid vs specialty construction.',
        'Example: full stave = maximum articulation + projection.',
        'Hybrid example: tonal warmth inside, visual drama outside.',
        'Align shell philosophy with the target voice from Discovery.',
      ],
      'Construction method'
    ),

    cp(
      'Lock shell thickness strategy',
      [
        'Thicker shell → punch, projection, reduced flex.',
        'Thinner shell → sensitivity, bloom, dynamic range.',
        'Example: heavy hitter touring player may benefit from added mass.',
        'Confirm bearing edge compatibility before committing.',
      ],
      'Shell thickness'
    ),

    cp(
      'Determine stave count + geometry',
      [
        'Higher stave count = more circular geometry, smoother tone.',
        'Lower stave count = stronger polygonal influence, added character.',
        'Example: 20–24 staves often balances strength + roundness.',
        'Confirm miter angle math BEFORE milling.',
      ],
      'Stave geometry'
    ),

    cp(
      'Validate structural risk factors',
      [
        'Identify highly figured woods prone to movement.',
        'Example: burl requires slower acclimation + stabilization mindset.',
        'Plan clamp strategy early for difficult species.',
        'Add risk note to project if instability is possible.',
      ],
      'Structural validation'
    ),
  ],


  woodVisionLockIn_3: [
    cp(
      'Select veneer species + figure intensity',
      [
        'Example: mappa burl = chaotic figure, extremely visual.',
        'Walnut = refined, classic, understated.',
        'Olive / redwood burl = statement drum territory.',
        'Confirm veneer complements shell voice — not fights it.',
      ],
      'Veneer species'
    ),

    cp(
      'Confirm seam strategy',
      [
        'Front seam = intentional visual statement.',
        'Rear seam = cleaner presentation.',
        'Example: align seam opposite badge unless design says otherwise.',
        'Dry wrap to preview before adhesive touches wood.',
      ],
      'Seam strategy'
    ),

    cp(
      'Plan grain orientation + flow',
      [
        'Ensure grain wraps naturally around shell.',
        'Avoid abrupt figure transitions at seam.',
        'Example: bookmatch when possible for premium builds.',
        'Visual continuity dramatically increases perceived value.',
      ],
      'Grain flow'
    ),

    cp(
      'Run adhesion risk check',
      [
        'Highly figured veneers require excellent glue coverage.',
        'Confirm press/clamp method before starting.',
        'Example: vacuum press recommended for unstable sheets.',
        'Failure here becomes permanent after finishing.',
      ],
      'Adhesion risk'
    ),
  ],


  woodVisionLockIn_4: [
    cp(
      'Define resin/accent philosophy',
      [
        'Should resin whisper or shout?',
        'Subtle micro-speckle = sophistication.',
        'Bold fills = artistic centerpiece.',
        'Must support the drum — never distract.',
      ],
      'Accent philosophy'
    ),

    cp(
      'Confirm HEX + color behavior',
      [
        'Test color against wood under real lighting.',
        'Example: teal may skew green under warm finish.',
        'Confirm transparency vs opacity.',
        'Document exact HEX for repeatability.',
      ],
      'Color lock'
    ),

    cp(
      'Map organic fill zones',
      [
        'Resin should follow knots, voids, and stress lines.',
        'Avoid artificial stripe bands.',
        'Example: fill burl eyes only — let wood lead.',
        'Natural integration separates artisan from hobby.',
      ],
      'Fill mapping'
    ),

    cp(
      'Run finish compatibility check',
      [
        'Confirm resin bonds cleanly with clear coat system.',
        'Test scrap if using metallic or pigment-heavy pours.',
        'Verify cure schedule alignment.',
        'Prevent sink-back surprises later.',
      ],
      'Finish compatibility'
    ),
  ],


  woodVisionLockIn_5: [
    cp(
      'Conduct full spec readback with client',
      [
        'Verbally confirm size, wood, finish, hardware.',
        'Example: “We are building a 14x6.5 walnut stave with teal resin.”',
        'Catch misunderstandings NOW — not mid-build.',
        'Document confirmation.',
      ],
      'Spec readback'
    ),

    cp(
      'Obtain written vision approval',
      [
        'Customer explicitly approves the final direction.',
        'Portal confirmation preferred.',
        'Example: “Approved — proceed to build.”',
        'No cutting begins before this moment.',
      ],
      'Vision approval'
    ),

    cp(
      'Freeze change window',
      [
        'After approval, major changes require rebuild-level discussion.',
        'Protect timeline integrity.',
        'Example: veneer swaps post-cut are not minor changes.',
        'Set expectations clearly.',
      ],
      'Change freeze'
    ),

    cp(
      'Greenlight build transition',
      [
        'Mark Vision Lock complete.',
        'Update project status → Ready for Shell Creation.',
        'Notify client that the build officially begins.',
        'Psychological milestone — celebrate it.',
      ],
      'Build greenlight'
    ),
  ],


  /* =========================================================
   * 4) Raw Shell Creation
   * ======================================================= */
  rawShellCreation_1: [
    cp(
      'Mill stock to consistent thickness + width',
      [
        'Joint/plane so every stave blank is the same thickness (prevents gaps during glue-up).',
        'Rip to consistent width with clean edges.',
        'Example: label one face as the “outside” reference face.',
      ],
      'Stave stock milling'
    ),
    cp(
      'Crosscut to length + add buffer',
      [
        'Cut all staves slightly long to allow post-glue squaring/flush trim.',
        'Example: add 1/2"–1" buffer depending on shell depth + jig method.',
      ],
      'Stave length prep'
    ),
    cp(
      'Mark grain direction + number all staves',
      [
        'Arrow grain direction, mark top/bottom, and number 1–N.',
        'This protects the “wrap flow” and keeps bookmatching consistent.',
      ],
      'Stave orientation + numbering'
    ),
    cp(
      'Dry layout the full ring (no glue)',
      [
        'Assemble the ring on the bench to preview seam placement + figure flow.',
        'This catches mismatched edges before any cuts or glue.',
      ],
      'Dry layout ring'
    ),
  ],

  rawShellCreation_2: [
    cp(
      'Cut miter/bevel angles accurately',
      [
        'Set saw/jig to the correct miter angle for the stave count.',
        'Do test cuts on scrap first.',
        'Example: cut 2 staves, place together, and check for daylight.',
      ],
      'Miter cuts'
    ),
    cp(
      'Joint/true the cut faces (if needed)',
      [
        'If faces show tiny gaps, true them with shooting board/plane or sanding jig.',
        'Goal: joints close with light pressure, not clamp force.',
      ],
      'True joint faces'
    ),
    cp(
      'Dry clamp partial sections to validate fit',
      [
        'Clamp 4–6 staves at a time to validate your cut accuracy.',
        'If it hinges or twists, correct before cutting the rest.',
      ],
      'Dry clamp validation'
    ),
    cp(
      'Full dry-fit ring + gap inspection',
      [
        'Assemble the entire ring and check all joints under bright light.',
        'Any consistent gap = angle issue; isolated gap = bad stave face.',
      ],
      'Full ring fit check'
    ),
  ],

  /* =========================================================
   * 5) Shell Trueing & Torch Tune (maps to OLD fineTuning + QC)
   * ======================================================= */
  shellTrueingTorchTune_1: [
    cp(
      'Check roundness tolerance',
      [
        'Example: measure at top/bottom, 8 points each.',
        'If out: identify high zones for correction strategy.',
        'Record values for customer transparency.',
      ],
      'Roundness tolerance'
    ),
    cp(
      'Verify wall uniformity',
      [
        'Example: thickness variation should be minimal across the shell.',
        'Mark thin spots (protect during torch/tuning).',
        'Confirm no interior ridges that could reflect sound oddly.',
      ],
      'Wall uniformity'
    ),
  ],
  shellTrueingTorchTune_2: [
    cp(
      'Tap test for frequency balance; mark initial torch zones',
      [
        'Tap around circumference and listen for dead spots.',
        'Example: mark areas that sound choked vs overly bright.',
        'Document notes: “Zone A warms fundamental, Zone B opens decay.”',
      ],
      'Tap test + mark'
    ),
  ],
  shellTrueingTorchTune_3: [
    cp(
      'Complete torch tuning process for core shell',
      [
        'Work gradually; re-test after each pass.',
        'Example: aim for consistent “note” around the shell.',
        'Re-check joint stability after tuning (heat can reveal weaknesses).',
      ],
      'Torch tune'
    ),
    cp(
      'Re-check joint stability and glue if necessary',
      [
        'Inspect seams under raking light for hairline gaps.',
        'Example: address immediately before any finish work begins.',
        'If needed: clamp + cure before progressing.',
      ],
      'Joint re-check'
    ),
  ],
  shellTrueingTorchTune_4: [
    cp(
      'Moisture re-check',
      [
        'Example: after machining + heat, re-check before finish.',
        'If moisture changed: allow rest/acclimation.',
        'Record values for stability tracking.',
      ],
      'Moisture re-check'
    ),
  ],
  shellTrueingTorchTune_5: [
    cp(
      'Edge sanding and fine-tune with granite block',
      [
        'Example: use granite block to keep surfaces dead-flat.',
        'Check: shell sits flat; no rocking.',
        'Prep for bearing edge routing accuracy.',
      ],
      'Granite block tune'
    ),
  ],

  /* =========================================================
   * 6) Exterior Art & Finish (maps to OLD shellExteriorFinish)
   * ======================================================= */
  exteriorArtFinish_1: [
    cp(
      'Apply veneer (if applicable)',
      [
        'Example: dry-fit wrap first to confirm seam placement.',
        'Use consistent adhesive coverage; avoid dry zones.',
        'Clamp strategy for burl/figured veneer to prevent cracking.',
      ],
      'Apply veneer'
    ),
    cp(
      'Inspect veneer adhesion for defects/bubbles',
      [
        'Example: tap test for hollow spots.',
        'Fix bubbles now (before finish locks them in).',
        'Edge check: confirm seam is tight and clean.',
      ],
      'Inspect adhesion'
    ),
  ],
  exteriorArtFinish_2: [
    cp(
      'Tap test veneer for frequency balance',
      [
        'Example: veneer can choke resonance if unevenly bonded.',
        'Compare before/after tone around circumference.',
        'Mark any “dull” zones for correction.',
      ],
      'Veneer tap test'
    ),
    cp(
      'Torch-tuning process for veneer (if applicable)',
      [
        'Go slower than core shell tuning (veneer is delicate).',
        'Example: stop immediately if veneer shows stress.',
        'Re-check seam after tuning.',
      ],
      'Torch tune veneer'
    ),
    cp(
      'Re-check for defects post-torching',
      [
        'Look for glue lines, micro-cracks, seam lift.',
        'Example: repair + cure before resin or clear coat.',
        'Confirm surface is ready for accent work.',
      ],
      'Defect re-check'
    ),
  ],
  exteriorArtFinish_3: [
    cp(
      'Apply acrylic / gap filler / stain / pre-poly finish',
      [
        'Resin example: speckled fill that follows grain/knots (no streak band).',
        'Stain example: test on scrap first to avoid blotchiness.',
        'Confirm cure windows before sanding (avoid gum-up).',
      ],
      'Apply accents'
    ),
  ],
  exteriorArtFinish_4: [
    cp(
      'Final pre-poly sand down',
      [
        'Example grit path: 320 → 400 before clear.',
        'Raking light check for scratches or low spots.',
        'Confirm edges aren’t rounded unintentionally.',
      ],
      'Pre-poly sand'
    ),
  ],
  exteriorArtFinish_5: [
    cp(
      'Initial poly coating and/or shellac',
      [
        'Example: light tack coats to lock in dye/metallics.',
        'Avoid heavy first coat (runs, solvent trap).',
        'Document start of cure window.',
      ],
      'Initial clear'
    ),
    cp(
      'Apply additional poly coats; wet sand between coats',
      [
        'Example: wet sand 600–800 between coats.',
        'Watch for sink-back over pores; add coat if needed.',
        'Final cure time: don’t rush polishing.',
      ],
      'Build coats'
    ),
  ],
  exteriorArtFinish_6: [
    cp(
      'Apply badges/logos',
      [
        'Placement: vertically centered on shell.',
        'Example: pre-drill carefully; protect finish with tape.',
        'Confirm badge matches hardware finish (chrome/black nickel/brass).',
      ],
      'Apply badge'
    ),
  ],

  /* =========================================================
   * 7) Edges & Snare Beds (maps to OLD bearingEdges + snareBedCutting)
   * ======================================================= */
  edgesSnareBeds_1: [
    cp(
      'Confirm edge spec (45°, roundover, etc.)',
      [
        'Example: 45°/slight roundover = focus + sensitivity.',
        'Example: rounder edge = warmer + thicker feel.',
        'Confirm compatibility with shell thickness.',
      ],
      'Edge spec'
    ),
    cp(
      'Route exterior bearing edges',
      [
        'Example: multiple light passes to prevent tearout.',
        'Check grain direction before routing.',
        'Inspect for chatter marks immediately.',
      ],
      'Route exterior'
    ),
    cp(
      'Route interior bearing edges',
      [
        'Example: keep inside cut clean; avoid blowout at seam.',
        'Check symmetry around circumference.',
        'Light hand-sand after routing.',
      ],
      'Route interior'
    ),
    cp(
      'Hand-sand edges smooth',
      [
        'Example: 320–400 grit, maintain profile.',
        'Check with fingertip: no sharp micro-tear.',
        'Head seating test if available.',
      ],
      'Hand sand edges'
    ),
  ],
  edgesSnareBeds_2: [
    cp(
      'Edge inspection for snare bed preparation',
      [
        'Confirm edges are complete before snare bed work.',
        'Example: if edge has defects, fix now (beds depend on clean edges).',
        'Mark bed zones with tape.',
      ],
      'Prep for beds'
    ),
    cp(
      'Determine snare bed placement',
      [
        'Align to throw + butt plate orientation.',
        'Example: ensure centered relative to lug layout.',
        'Confirm with customer preference if any (badge front vs throw front).',
      ],
      'Bed placement'
    ),
    cp(
      'Mark center of snare bed locations',
      [
        'Example: mark exact centerline for symmetric beds.',
        'Use template/jig for repeatability.',
        'Double-check before cutting.',
      ],
      'Mark centers'
    ),
  ],
  edgesSnareBeds_3: [
    cp(
      'Select snare bed cut depth',
      [
        'Example: shallow = more open; deeper = tighter snare response.',
        'Match to wire preference (20 vs 42).',
        'Record depth target for transparency.',
      ],
      'Bed depth'
    ),
    cp(
      'Cut snare beds to spec',
      [
        'Multiple light passes; avoid burning.',
        'Example: blend bed smoothly into edge.',
        'Inspect symmetry immediately.',
      ],
      'Cut beds'
    ),
  ],
  edgesSnareBeds_4: [
    cp(
      'Check symmetry and depth',
      [
        'Example: measure both beds; match depth + shape.',
        'Head seating check if possible.',
        'Fix now before interior finish locks it in.',
      ],
      'Verify beds'
    ),
    cp(
      'Hand sand/file and blend edges',
      [
        'Example: no sharp transitions; smooth ramp.',
        'Final feel test: fingertip sweep across bed.',
        'Clean dust before finishing interior.',
      ],
      'Blend beds'
    ),
  ],
  edgesSnareBeds_5: [
    cp(
      'Finish/spray interior (if applicable)',
      [
        'Example: thin coat to protect without choking tone.',
        'Avoid runs in snare bed zones.',
        'Allow cure before hardware.',
      ],
      'Interior finish'
    ),
    cp(
      'Shellac interior',
      [
        'Example: shellac adds protection + slight control.',
        'Keep application even.',
        'Let fully cure before assembly.',
      ],
      'Shellac'
    ),
    cp(
      'Attach interior badges / ntags / signature logos',
      [
        'Example: NTAG placement that’s protected but scannable.',
        'Confirm adhesive safe for finish.',
        'Photograph for documentation.',
      ],
      'Interior marks'
    ),
    cp(
      'Apply reinforcement rings (if applicable)',
      [
        'Example: rings for stiffness + stability in certain builds.',
        'Clamp evenly; avoid squeeze-out mess.',
        'Verify roundness after rings cure.',
      ],
      'Reinforcement rings'
    ),
  ],

  /* =========================================================
   * 8) Hardware & Assembly (maps to OLD hardwareDrilling + hardwareAssembly)
   * ======================================================= */
  hardwareAssembly_1: [
    cp(
      'Ensure all hardware, screws, rods, and accessories are in stock',
      [
        'Example: confirm lug count matches plan (6/8/10) + correct rod lengths.',
        'Confirm hoops are diecast and match finish.',
        'Confirm throw/butt plate model matches order.',
      ],
      'Inventory check'
    ),
    cp(
      'Layout lugs and throwoff spacing',
      [
        'Example: ensure throw aligns with snare beds.',
        'Confirm lug spacing symmetry; mark reference line.',
        'Check badge orientation relative to throw (front/back decision).',
      ],
      'Layout'
    ),
    cp(
      'Precision measure/mark hardware holes on tape',
      [
        'Example: painters tape prevents finish chip-out.',
        'Mark: center points + drill size notes.',
        'Double-check with lug template.',
      ],
      'Mark holes'
    ),
    cp(
      'Check measurements with square and ruler',
      [
        'Example: verify vertical alignment so lugs don’t “walk.”',
        'Confirm hole distances mirror left/right sides.',
        'Confirm throw/butt plate alignment is dead center.',
      ],
      'Verify layout'
    ),
  ],

  hardwareAssembly_2: [
    cp(
      'Center punch holes',
      [
        'Example: prevents bit skating on finish.',
        'Use light punch first; confirm location; then commit.',
        'Protect finish around punch point.',
      ],
      'Center punch'
    ),
    cp(
      'Drill pilot holes cleanly',
      [
        'Example: step drill / pilot-first reduces tearout.',
        'Backer block inside shell if needed.',
        'Go slow; let bit cut, don’t force.',
      ],
      'Pilot drill'
    ),
    cp(
      'Double-check alignment',
      [
        'Test fit a lug/throw before drilling all holes.',
        'Example: install 2 opposing lugs to verify symmetry.',
        'Correct any drift immediately.',
      ],
      'Alignment check'
    ),
    cp(
      'Deburr all hardware holes',
      [
        'Example: deburr prevents gasket tearing + finish cracking.',
        'Use light chamfer; don’t overdo.',
        'Vacuum all dust.',
      ],
      'Deburr'
    ),
    cp(
      'Confirm fit with hardware samples',
      [
        'Test each hardware type: lug, throw, butt, vent, badge.',
        'Example: confirm screw length doesn’t bottom out.',
        'Confirm washers/gaskets sit flat.',
      ],
      'Test fit'
    ),
  ],

  hardwareAssembly_3: [
    cp(
      'Final wet sand',
      [
        'Example: 1000–2000 grit depending on finish build.',
        'Avoid sanding through edges.',
        'Rinse and inspect under bright light.',
      ],
      'Wet sand'
    ),
    cp(
      'Final poly (if needed)',
      [
        'If sand-through occurs, re-coat and re-cure.',
        'Example: spot coat and feather edges.',
        'Document cure start time.',
      ],
      'Final clear'
    ),
    cp(
      'Ensure finish cure before polishing',
      [
        'Example: don’t polish soft clear — it hazes later.',
        'Respect cure window based on product used.',
        'If in doubt, wait longer.',
      ],
      'Cure check'
    ),
    cp(
      'Buff/polish exterior surface before assembly',
      [
        'Example: compound → polish; avoid burning finish.',
        'Keep hardware off until polish is complete.',
        'Final wipe with clean microfiber.',
      ],
      'Polish'
    ),
  ],

  hardwareAssembly_4: [
    cp(
      'Punch leather gaskets (if applicable)',
      [
        'Example: cut clean circles; match lug footprint.',
        'Confirm thickness doesn’t misalign hardware.',
        'Dry fit before install.',
      ],
      'Gaskets'
    ),
    cp(
      'Install lugs, throw, butt plate, air vent',
      [
        'Example: install opposing lugs first to keep balance.',
        'Use correct washer stack (nylon/neoprene if used).',
        'Confirm throw aligns with snare beds.',
      ],
      'Install hardware'
    ),
    cp(
      'Verify hardware alignment',
      [
        'Sight down lug lines — no “lean.”',
        'Example: hoops seat evenly; rods align straight.',
        'Fix misalignments before heads go on.',
      ],
      'Verify alignment'
    ),
  ],

  hardwareAssembly_5: [
    cp(
      'Torque hardware',
      [
        'Example: snug + quarter turn; don’t crush shell.',
        'Equalize tension across lug screws.',
        'Check after 24 hours (settling).',
      ],
      'Torque'
    ),
    cp(
      'Inspect for rattle/loose fit',
      [
        'Shake test: no internal rattles.',
        'Tap hardware zones; listen for buzz.',
        'Fix with gaskets/washers if needed.',
      ],
      'Rattle check'
    ),
    cp(
      'Photograph shell before heads/hoops',
      [
        'Capture finish detail + badge + hardware alignment.',
        'Example: use consistent lighting angle for portfolio.',
        'Store in Media Files section.',
      ],
      'Photo shell'
    ),
  ],

  /* =========================================================
   * 9) Legacy Tuning & Media (maps to OLD tuningDetailing)
   * ======================================================= */
  legacyTuningMedia_1: [
    cp(
      'Seat heads and tune evenly',
      [
        'Example: press seat; tune star pattern; re-seat.',
        'Ensure even lug pitch all around.',
        'Set initial “neutral” tuning baseline.',
      ],
      'Seat + tune'
    ),
  ],
  legacyTuningMedia_2: [
    cp(
      'Adjust snare wire tension',
      [
        'Example: start medium, then tighten until response is crisp without choke.',
        'Check dynamic range: ghosts to rimshots.',
        'Confirm throw engages smoothly.',
      ],
      'Wire tension'
    ),
    cp(
      'Check for unwanted buzz or rattle',
      [
        'Example: test with tom hits (sympathetic buzz).',
        'Test multiple tunings (low/med/high).',
        'Mitigate: bed tweak, wire adjustment, head tuning.',
      ],
      'Buzz check'
    ),
    cp(
      'Confirm tuning stability',
      [
        'Play test 5–10 minutes; confirm it holds.',
        'Example: re-check lug pitch after hard rimshots.',
        'Document final tuning notes.',
      ],
      'Stability'
    ),
  ],
  legacyTuningMedia_3: [
    cp(
      'Play test: tonal/dynamic response',
      [
        'Test: center hit, rimshot, ghost notes, cross-stick.',
        'Example: confirm it matches “target voice” from Discovery.',
        'Adjust tuning if needed for the best personality.',
      ],
      'Play test'
    ),
    cp(
      'Legacy voicing: low / legacy / high',
      [
        'Low: fat + body; High: crack + articulate.',
        '“Legacy” = sweet spot tuning used for recordings.',
        'Record notes for each voicing.',
      ],
      'Voicings'
    ),
  ],
  legacyTuningMedia_4: [
    cp(
      'Run FFT spectral analysis, save PDF',
      [
        'Example: record a standardized hit and generate analysis PDF.',
        'Store in portal for customer “proof + story.”',
        'Use same mic distance every time for consistency.',
      ],
      'FFT analysis'
    ),
    cp(
      'Record samples/video at multiple tunings',
      [
        'Example: 3 clips: low, legacy, high.',
        'Include rimshot + ghost groove.',
        'Upload to Media section.',
      ],
      'Record media'
    ),
    cp(
      'Photograph shell pre-packaging',
      [
        'Final “hero” shots under clean lighting.',
        'Example: capture badge + grain + resin closeups.',
        'Archive for marketing + customer memories.',
      ],
      'Final photos'
    ),
  ],

  /* =========================================================
   * 10) Final QA, Packaging & Delivery (maps to OLD qualityCheck)
   * ======================================================= */
  finalQAPackagingDelivery_1: [
    cp(
      'Final shell inspection (interior/exterior)',
      [
        'Inspect finish under bright light (swirls, haze, sink-back).',
        'Check interior for runs/drips.',
        'Example: confirm badge is centered + secure.',
      ],
      'Final inspection'
    ),
    cp(
      'Inspect hardware tightness and alignment',
      [
        'Check all lug screws, throw, butt, vent.',
        'Example: verify no hoop wobble; rods thread smoothly.',
        'Confirm no rattles when shaken.',
      ],
      'Hardware check'
    ),
    cp(
      'Ensure snare wire response is consistent',
      [
        'Test: soft ghosts + rimshots; adjust wires if needed.',
        'Example: no choke at medium-high tension.',
        'Confirm beds feel symmetric in response.',
      ],
      'Wire response'
    ),
    cp(
      'Full test-play to confirm tonal balance',
      [
        'Play: groove, rolls, rimshots, cross-stick.',
        'Example: confirm tuning holds after 5–10 minutes.',
        'Sign off: “ready to ship.”',
      ],
      'Test play'
    ),
    cp(
      'Hand polish shell and hardware',
      [
        'Final microfiber polish; remove fingerprints.',
        'Example: protect finish with clean gloves afterward.',
        'Photograph final look if needed.',
      ],
      'Polish'
    ),
  ],

  finalQAPackagingDelivery_2: [
    cp(
      'Photograph with final shipping materials',
      [
        'Example: capture packed protection layers for proof.',
        'Photo of label (no private data visible in customer view).',
        'Store in portal.',
      ],
      'Packing photos'
    ),
    cp(
      'Box + protective packing',
      [
        'Example: shell protected, hoops locked, no movement in box.',
        'Double-box if needed for safety.',
        'Include care card / thank you if applicable.',
      ],
      'Pack'
    ),
    cp(
      'Print shipping label',
      [
        'Verify address + contact info.',
        'Example: insure package for value.',
        'Save tracking info immediately.',
      ],
      'Label'
    ),
  ],

  finalQAPackagingDelivery_3: [
    cp(
      'Ship drum',
      [
        'Drop-off scan confirmed.',
        'Example: require signature for delivery if high value.',
        'Record ship date in portal.',
      ],
      'Ship'
    ),
    cp(
      'Notify customer + send tracking',
      [
        'Send tracking + ETA + care instructions.',
        'Example: “Unboxing tips + first tuning suggestion.”',
        'Mark project stage complete.',
      ],
      'Notify'
    ),
  ],
};

// Map whatever "stepKey" your app uses → the checkpoint prefix used in CHECKPOINTS_BY_ITEM_ID
const STEPKEY_TO_CHECKPOINT_PREFIX = {
  // NEW workflow step keys (preferred)
  discoveryDesign: 'discoveryDesign',
  commitmentPortal: 'commitmentPortal',
  woodVisionLockIn: 'woodVisionLockIn',
  rawShellCreation: 'rawShellCreation',
  shellTrueingTorchTune: 'shellTrueingTorchTune',
  exteriorArtFinish: 'exteriorArtFinish',
  edgesSnareBeds: 'edgesSnareBeds',
  hardwareAssembly: 'hardwareAssembly',
  legacyTuningMedia: 'legacyTuningMedia',
  finalQAPackagingDelivery: 'finalQAPackagingDelivery',

  // OLD workflow step keys (from your original defaultStepData)
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

const StepComponentTemplate = ({
  stepKey,
  stepLabel,
  stepData = { checklist: [] },
  onToggleChecklist, // (index, completed, totalSeconds)
  onUpdateCheckpointStates, // (itemIndex, checkpointStatesArray)
  isLocked = false,
  activeIndex = null,
}) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [presetSeconds, setPresetSeconds] = useState(0);

  const items = stepData.checklist || [];

  const activeIdx =
    activeIndex !== null && activeIndex >= 0 && activeIndex < items.length
      ? activeIndex
      : 0;

  const activeItem = items[activeIdx] || null;

  /* ---------------------------------------------------
     CHECKPOINT RESOLUTION
  --------------------------------------------------- */

  const prefix = STEPKEY_TO_CHECKPOINT_PREFIX[stepKey];

  const generatedKey = prefix
    ? `${prefix}_${activeIdx + 1}`
    : `${stepKey}_${activeIdx + 1}`;

  // Prefer explicit item.id → fallback to generated key
const resolvedCheckpointKey =
  (activeItem?.id && CHECKPOINTS_BY_ITEM_ID[activeItem.id]
    ? activeItem.id
    : null) || (CHECKPOINTS_BY_ITEM_ID[generatedKey] ? generatedKey : null);

// Do we actually have real checkpoint definitions?
const hasExplicitDefs = !!resolvedCheckpointKey;

// If there is no checkpoint definition, preserve saved length
const savedCheckpointLen = Array.isArray(activeItem?.checkpointStates)
  ? activeItem.checkpointStates.length
  : 0;

let checkpointDefs = [];

// ✅ REAL DEFINITIONS
if (hasExplicitDefs) {
  checkpointDefs = CHECKPOINTS_BY_ITEM_ID[resolvedCheckpointKey];
}

// ✅ EXISTING SAVED STATES (legacy projects)
else if (savedCheckpointLen > 0) {
  checkpointDefs = new Array(savedCheckpointLen)
    .fill(null)
    .map((_, i) =>
      cp(`Checkpoint ${i + 1}`, [], `Checkpoint ${i + 1}`, 'task', true)
    );
}

// ✅ HARD FALLBACK — SINGLE CHECKBOX ONLY
else {
  checkpointDefs = [
    cp(
      'Mark step complete',
      [],
      activeItem?.bookLabel ||
        activeItem?.label ||
        activeItem?.task ||
        `Step ${activeIdx + 1}`,
      'task',
      false
    ),
  ];
}

const activeItemId = resolvedCheckpointKey || activeItem?.id || generatedKey;

 /* ---------------------------------------------------
     LOCAL CHECKPOINT STATE
  --------------------------------------------------- */

  const [localCheckpointStates, setLocalCheckpointStates] = useState(() =>
    normalizeCheckpointArray(
      activeItem?.checkpointStates,
      checkpointDefs.length
    )
  );

  useEffect(() => {
    setLocalCheckpointStates(
      normalizeCheckpointArray(
        activeItem?.checkpointStates,
        checkpointDefs.length
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeItem?.id, checkpointDefs.length]);

  const totalTime = useMemo(
    () => (activeItem ? activeItem.totalSeconds || 0 : 0),
    [activeItem]
  );

  const beginEdit = (idx, currentSeconds = 0) => {
    const closest = findClosestPreset(currentSeconds || 0);
    setPresetSeconds(closest.seconds);
    setEditingIndex(idx);
  };

  const saveEdit = (idx, checked) => {
    onToggleChecklist?.(idx, checked, presetSeconds);
    setEditingIndex(null);
  };

  const persistCheckpointStates = (next) => {
    setLocalCheckpointStates(next);
    onUpdateCheckpointStates?.(activeIdx, next);
  };

  const handleCheckpointDoneToggle = (cpIndex, checked) => {
    if (!activeItem) return;

    const len = Math.max(checkpointDefs.length, localCheckpointStates.length);
    const next = Array.from(
      { length: len },
      (_, i) => localCheckpointStates[i]
    );

    // If user checks "done" and it was "na", flip to done.
    // If user unchecks, set to false (not done) but keep NA if they explicitly set NA.
    next[cpIndex] = checked ? true : false;

    persistCheckpointStates(next);
  };

  const handleCheckpointNAToggle = (cpIndex) => {
    if (!activeItem) return;

    const def = checkpointDefs[cpIndex];
    if (def?.naAllowed === false) return;

    const len = Math.max(checkpointDefs.length, localCheckpointStates.length);
    const next = Array.from(
      { length: len },
      (_, i) => localCheckpointStates[i]
    );

    // Toggle: false/true -> 'na' ; 'na' -> false
    next[cpIndex] = next[cpIndex] === 'na' ? false : 'na';

    persistCheckpointStates(next);
  };

  // Bulk mark/clear all (done only; NA remains as-is)
  const handleAllCheckpointsComplete = () => {
    if (!activeItem || checkpointDefs.length === 0) return;
    const next = checkpointDefs.map((_, i) =>
      isCheckpointNA(localCheckpointStates[i]) ? 'na' : true
    );
    persistCheckpointStates(next);
  };

  const handleAllCheckpointsClear = () => {
    if (!activeItem || checkpointDefs.length === 0) return;
    const next = checkpointDefs.map((_, i) =>
      isCheckpointNA(localCheckpointStates[i]) ? 'na' : false
    );
    persistCheckpointStates(next);
  };

  if (!activeItem) {
    return (
      <div className="mpm-step-detail">
        <h2 className="mpm-step-title">{stepLabel}</h2>
        <p>No sub-step data found.</p>
      </div>
    );
  }

  const isEditing = editingIndex === activeIdx;

  // Completed logic:
  // - A checkpoint counts as "satisfied" if done OR NA.
  // - A sub-step is "effectively complete" if all checkpoints are satisfied.
  const allSatisfied =
    checkpointDefs.length > 0 &&
    localCheckpointStates.length > 0 &&
    checkpointDefs.every(
      (_, i) =>
        isCheckpointDone(localCheckpointStates[i]) ||
        isCheckpointNA(localCheckpointStates[i])
    );

  const checked = !!activeItem.completed || allSatisfied;

  return (
    <div className="mpm-step-detail">
      <h2 className="mpm-step-title">{stepLabel}</h2>

      <div className="mpm-step-total">
        Total Time for this sub-step:
        <span>{fmtHM(totalTime)}</span>
      </div>

      <section
        className={`mpm-step-time ${isLocked ? 'mpm-step-disabled' : ''}`}
      >
        <div className="mpm-step-time-header">
          <div className="mpm-step-time-label-block">
            <div className="mpm-step-time-label">Time Tracking</div>
            <div className="mpm-step-time-sub">
              Adjust the time spent on this sub-step.
            </div>
          </div>
          {!isEditing ? (
            <div className="mpm-step-time-right">
              <div className="mpm-step-time-value">
                {fmtHM(activeItem.totalSeconds || 0)}
              </div>

              <button
                disabled={isLocked}
                onClick={() =>
                  beginEdit(activeIdx, activeItem.totalSeconds || 0)
                }
                className="mpm-step-btn"
              >
                Edit
              </button>

              <button
                disabled={isLocked || (activeItem.totalSeconds || 0) === 0}
                onClick={() =>
                  onToggleChecklist?.(activeIdx, !!activeItem.completed, 0)
                }
                className="mpm-step-link-btn"
              >
                Clear
              </button>
            </div>
          ) : (
            <div className="mpm-step-time-edit">
              <select
                className="mpm-step-time-select"
                value={presetSeconds}
                onChange={(e) => setPresetSeconds(Number(e.target.value))}
              >
                {TIME_PRESETS.map((p) => (
                  <option key={p.seconds} value={p.seconds}>
                    {p.label}
                  </option>
                ))}
              </select>

              <button
                onClick={() => saveEdit(activeIdx, checked)}
                className="mpm-step-btn mpm-step-btn-primary"
              >
                Save
              </button>

              <button
                onClick={() => setEditingIndex(null)}
                className="mpm-step-btn"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="mpm-step-status-row">
          <label className="mpm-step-status-label">
            <input
              type="checkbox"
              disabled={isLocked}
              checked={checked}
              onChange={(e) => {
                const newCompleted = e.target.checked;

                // Toggle checklist item
                onToggleChecklist?.(
                  activeIdx,
                  newCompleted,
                  activeItem.totalSeconds || 0
                );

                // Auto-sync checkpoints to done/clear (does NOT set NA)
                if (checkpointDefs.length > 0 && onUpdateCheckpointStates) {
                  const nextStates = checkpointDefs.map((_, i) =>
                    isCheckpointNA(localCheckpointStates[i])
                      ? 'na'
                      : newCompleted
                  );
                  persistCheckpointStates(nextStates);
                }
              }}
            />
            <span>Mark this sub-step as complete</span>
          </label>
        </div>
      </section>

      <section className="mpm-step-checkpoints">
        <div className="mpm-step-checkpoints-header-row">
          <h3 className="mpm-step-checkpoints-title">
            Checkpoints &amp; QC Points
          </h3>

          {!isLocked && checkpointDefs.length > 1 && hasExplicitDefs && (
            <div className="mpm-step-checkpoints-bulk-actions">
              <button
                type="button"
                className="mpm-step-checkpoints-bulk-btn mark-all"
                onClick={handleAllCheckpointsComplete}
              >
                Mark all done
              </button>
              <button
                type="button"
                className="mpm-step-checkpoints-bulk-btn clear-all"
                onClick={handleAllCheckpointsClear}
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {checkpointDefs.length === 0 ? (
          <p className="mpm-step-empty">
            No detailed checkpoints defined for this sub-step yet.
          </p>
        ) : (
          <div className="mpm-check-grid">
            {checkpointDefs.map((def, idx) => {
              const inputId = `cp-${activeItemId}-${idx}`;
              const val = localCheckpointStates[idx];
              const done = isCheckpointDone(val);
              const na = isCheckpointNA(val);
              const title = def?.ui ?? `Checkpoint ${idx + 1}`;
              const book = def?.book ?? null;
              const details = Array.isArray(def?.details) ? def.details : [];

              return (
                <div key={idx} className="mpm-check-row">
                  <input
                    id={inputId}
                    type="checkbox"
                    checked={done || na}
                    disabled={isLocked}
                    onChange={(e) =>
                      handleCheckpointDoneToggle(idx, e.target.checked)
                    }
                  />

                  <div
                    className="mpm-check-main"
                    style={{ opacity: na ? 0.65 : 1 }}
                  >
                    <div className="mpm-check-top">
                      <label htmlFor={inputId} className="mpm-check-title">
                        {title}
                        {na && <span className="na-pill">N/A</span>}
                      </label>

                      {!isLocked && def?.naAllowed !== false && (
                        <button
                          type="button"
                          className="mpm-check-na-btn"
                          onClick={() => handleCheckpointNAToggle(idx)}
                          title="Mark as Not Applicable (omitted from book export)"
                        >
                          {na ? 'Undo N/A' : 'N/A'}
                        </button>
                      )}
                    </div>

                    {!!book && <div className="mpm-check-desc">{book}</div>}

                    {details.length > 0 && (
                      <ul className="mpm-check-bullets">
                        {details.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default StepComponentTemplate;
