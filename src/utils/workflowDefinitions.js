// src/utils/workflowDefinitions.js

// Checkpoint helper shape (matches what your StepComponentTemplate expects)
const cp = (ui, details = [], book = null, type = "task", naAllowed = true) => ({
  ui,                    // admin main UI label (full)
  details,               // bullet points shown under the checkpoint
  book: book ?? ui,      // admin left-panel short label (and/or export label)
  type,                  // "task" | "measurement" | "qc"
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
 * - checkpoint.book: short label used in left panel under the active sub-step
 */
export const STAGE_TEMPLATES = {
  /* ============================================================
   * 1) Discovery & Design
   * ========================================================== */
  discoveryDesign: {
    stageKey: "discoveryDesign",
    weight: 10,
    adminLeftShort: "1. Discovery",
    adminMainTitle: "1. Discovery & Design",
    steps: [
      {
        id: "discoveryDesign_1",
        weight: 3,
        adminLeftShort: "Kickoff",
        adminMainTitle: "Kickoff & Vision Capture",
        checkpoints: [
          cp("Capture player goals + influences", [
            "Primary playing context (studio, live, worship, metal, etc.)",
            "Touch preferences: rebound, sensitivity, articulation",
            "Reference snares (what they love / hate) and why",
          ], "Goals + refs", "task", false),

          cp("Define sound target", [
            "Attack character (soft ↔ sharp)",
            "Body (dry ↔ open)",
            "Sustain (short ↔ long)",
            "Dynamic range (ghost notes ↔ rimshots)",
          ], "Sound target", "task", false),

          cp("Define aesthetic target", [
            "Veneer intent (grain drama, figure, contrast)",
            "Accent intent (subtle / bold, where it should “live”)",
            "Hardware finish direction",
          ], "Aesthetic", "task", true),

          cp("Confirm constraints + non-negotiables", [
            "Budget range, deadline sensitivity, must-have features",
            "What must NOT happen (too ringy, too dry, too bright, etc.)",
          ], "Constraints", "qc", false),
        ],
      },
      {
        id: "discoveryDesign_2",
        weight: 4,
        adminLeftShort: "Spec Draft",
        adminMainTitle: "Initial Spec Draft",
        checkpoints: [
          cp("Lock size + lug count direction", [
            "Diameter x depth",
            "Lug count (6 / 8 / 10) and rationale",
          ], "Size + lugs", "task", false),

          cp("Draft shell construction plan", [
            "Stave / steam-bent / hybrid decision",
            "Target shell thickness range",
            "Reinforcement rings (if applicable)",
          ], "Shell plan", "task", true),

          cp("Draft hardware + snare system plan", [
            "Hoops: diecast only (confirm)",
            "Lugs: vintage tube lugs (confirm)",
            "Throw + butt plate style",
            "Wire count and type",
          ], "Hardware plan", "task", false),

          cp("Draft finish + accent plan", [
            "Veneer selection path",
            "Accent color (HEX) if known",
            "Topcoat type and sheen direction",
          ], "Finish plan", "task", true),
        ],
      },
      {
        id: "discoveryDesign_3",
        weight: 3,
        adminLeftShort: "Approval",
        adminMainTitle: "Customer Approval & Sign-Off",
        checkpoints: [
          cp("Send proposal summary", [
            "Specs + finish summary",
            "Timeline expectations + buffer policy",
          ], "Send proposal", "task", false),

          cp("Capture explicit approval", [
            "Written approval of specs + finish direction",
            "Approval of any tradeoffs",
          ], "Approval", "qc", false),

          cp("Record final version (source of truth)", [
            "Store the final spec as the authoritative doc in the project",
            "Prevent silent changes later (log revisions)",
          ], "Record vFinal", "qc", false),
        ],
      },
    ],
  },

  /* ============================================================
   * 2) Commitment & Portal Setup
   * ========================================================== */
  commitmentPortal: {
    stageKey: "commitmentPortal",
    weight: 8,
    adminLeftShort: "2. Commitment",
    adminMainTitle: "2. Commitment & Portal Setup",
    steps: [
      {
        id: "commitmentPortal_1",
        weight: 3,
        adminLeftShort: "Deposit",
        adminMainTitle: "Deposit / Commitment Confirmed",
        checkpoints: [
          cp("Confirm deposit received", [
            "Payment method confirmed",
            "Receipt stored/linked",
          ], "Deposit", "qc", false),

          cp("Confirm start date + target window", [
            "Start date set",
            "Target completion date set",
            "Buffer policy explained",
          ], "Dates", "task", false),

          cp("Create internal work order snapshot", [
            "Build sheet generated",
            "Any special notes elevated",
          ], "Work order", "task", false),
        ],
      },
      {
        id: "commitmentPortal_2",
        weight: 3,
        adminLeftShort: "Portal",
        adminMainTitle: "Portal Access + Project Setup",
        checkpoints: [
          cp("Confirm customer user link", [
            "Project linked to correct user",
            "Customer can see project in portal",
          ], "User link", "qc", false),

          cp("Initialize workflow steps", [
            "All 10 stages present",
            "All sub-steps present",
            "Checkpoint arrays initialized",
          ], "Init workflow", "qc", false),

          cp("Welcome message + how-to", [
            "Explain portal layout",
            "Explain progress + checkpoints",
            "Set expectations for updates",
          ], "Welcome", "task", true),
        ],
      },
      {
        id: "commitmentPortal_3",
        weight: 2,
        adminLeftShort: "Intake",
        adminMainTitle: "Shipping / Intake Details Confirmed",
        checkpoints: [
          cp("Confirm shipping address + contact", [
            "Name, phone, address verified",
            "Special delivery instructions captured",
          ], "Ship info", "qc", false),

          cp("Confirm billing preferences", [
            "Remaining balance timeline",
            "Any invoice preferences",
          ], "Billing", "task", true),
        ],
      },
    ],
  },

  /* ============================================================
   * 3) Wood & Vision Lock-In
   * ========================================================== */
  woodVisionLockIn: {
    stageKey: "woodVisionLockIn",
    weight: 12,
    adminLeftShort: "3. Wood",
    adminMainTitle: "3. Wood & Vision Lock-In",
    steps: [
      {
        id: "woodVisionLockIn_1",
        weight: 4,
        adminLeftShort: "Veneer",
        adminMainTitle: "Veneer Selection Locked",
        checkpoints: [
          cp("Confirm exact veneer reference", [
            "Source image stored",
            "Grain orientation intent stated",
            "Match expectation explicitly confirmed",
          ], "Veneer lock", "qc", false),

          cp("Confirm accent color + behavior", [
            "HEX captured",
            "Accent must embed in grain stress/knots",
            "Accent must wrap full circumference",
            "Speckled, not streaked",
          ], "Accent rules", "qc", false),

          cp("Confirm hardware finish + badge", [
            "Hardware finish locked",
            "Badge finish matches hardware",
            "Badge centered vertically on shell",
          ], "Hardware lock", "qc", false),
        ],
      },
      {
        id: "woodVisionLockIn_2",
        weight: 4,
        adminLeftShort: "Core Wood",
        adminMainTitle: "Core Shell Wood Selection",
        checkpoints: [
          cp("Select core species + rationale", [
            "Species chosen (core)",
            "Why it supports the sound target",
          ], "Core species", "task", false),

          cp("Moisture + stability check", [
            "Stock acclimated",
            "Moisture in acceptable range",
            "No twist/cupping beyond tolerance",
          ], "Moisture", "measurement", false),

          cp("Cut list generated", [
            "Stave count (if applicable)",
            "Board yield plan",
            "Waste plan / contingency",
          ], "Cut list", "task", true),
        ],
      },
      {
        id: "woodVisionLockIn_3",
        weight: 4,
        adminLeftShort: "Final Spec",
        adminMainTitle: "Final Spec Freeze (No Silent Changes)",
        checkpoints: [
          cp("Freeze spec + revision log", [
            "Mark spec as vFinal",
            "Any later changes require explicit revision entry",
          ], "Freeze vFinal", "qc", false),

          cp("Confirm tooling/fixture readiness", [
            "Jigs/fixtures ready for chosen build style",
            "Bits/blades sharp and appropriate",
          ], "Tooling", "qc", true),

          cp("Confirm timeline checkpoint", [
            "Start confirmed",
            "Major milestones date-stamped",
          ], "Timeline", "task", true),
        ],
      },
    ],
  },

  /* ============================================================
   * 4) Raw Shell Creation
   * ========================================================== */
  rawShellCreation: {
    stageKey: "rawShellCreation",
    weight: 16,
    adminLeftShort: "4. Raw Shell",
    adminMainTitle: "4. Raw Shell Creation",
    steps: [
      {
        id: "rawShellCreation_1",
        weight: 5,
        adminLeftShort: "Milling",
        adminMainTitle: "Stave/Blank Milling + Prep",
        checkpoints: [
          cp("Mill stock to spec", [
            "Thickness planed",
            "Edges square",
            "Defects avoided in critical zones",
          ], "Mill stock", "task", false),

          cp("Verify geometry inputs", [
            "Stave count confirmed",
            "Miter angle confirmed",
            "Face widths confirmed",
          ], "Geometry", "measurement", false),

          cp("Dry fit layout check", [
            "Dry clamp alignment check",
            "Gaps identified and corrected",
          ], "Dry fit", "qc", false),
        ],
      },
      {
        id: "rawShellCreation_2",
        weight: 6,
        adminLeftShort: "Glue-Up",
        adminMainTitle: "Glue-Up + Compression",
        checkpoints: [
          cp("Glue application verified", [
            "Even spread (no starvation)",
            "Open time respected",
          ], "Glue", "qc", false),

          cp("Compression achieved evenly", [
            "Even pressure around shell",
            "No step offsets",
            "Seam alignment checked",
          ], "Compression", "qc", false),

          cp("Cure plan executed", [
            "Clamp time logged",
            "Environment stable during cure",
          ], "Cure plan", "task", false),
        ],
      },
      {
        id: "rawShellCreation_3",
        weight: 5,
        adminLeftShort: "Rough True",
        adminMainTitle: "Rough Trueing + Roundness",
        checkpoints: [
          cp("Rough true shell", [
            "Remove squeeze-out cleanly",
            "Rough true inside/outside surfaces",
          ], "Rough true", "task", false),

          cp("Roundness measurement", [
            "Measure across multiple axes",
            "Record min/max variance",
          ], "Roundness", "measurement", false),

          cp("Shell integrity QC", [
            "No seam failures",
            "No cracks/voids in structural areas",
          ], "Integrity", "qc", false),
        ],
      },
    ],
  },

   /* ============================================================
   * 5) Shell Trueing & Torch Tune
   * ========================================================== */
  shellTrueingTorchTune: {
    stageKey: "shellTrueingTorchTune",
    weight: 10,
    adminLeftShort: "5. True + Tune",
    adminMainTitle: "5. Shell Trueing & Torch Tune",
    steps: [
      {
        id: "shellTrueingTorchTune_1",
        weight: 4,
        adminLeftShort: "Precision True",
        adminMainTitle: "Precision Trueing (Flat + Round)",
        checkpoints: [
          cp(
            "True bearing surfaces flat",
            [
              "Top and bottom planes true",
              "No wobble on a flat reference surface",
              "Record any corrective passes required",
            ],
            "Flatness",
            "measurement",
            false
          ),
          cp(
            "Confirm final thickness range",
            [
              "Measure thickness at multiple clock positions",
              "Confirm within target thickness range",
              "Log min/max thickness",
            ],
            "Thickness",
            "measurement",
            false
          ),
          cp(
            "Inside surface refinement",
            [
              "Refine inside surface for feel + resonance",
              "Remove tool marks / tear-out in tone-critical zones",
              "Final pass consistency confirmed",
            ],
            "Inside refine",
            "task",
            true
          ),
        ],
      },
      {
        id: "shellTrueingTorchTune_2",
        weight: 3,
        adminLeftShort: "Torch Tune",
        adminMainTitle: "Torch Tune (Stability + Voice)",
        checkpoints: [
          cp(
            "Torch tune executed safely",
            [
              "Even heat application around the shell",
              "No scorching / no hot spots",
              "Controlled pace, consistent passes",
            ],
            "Torch tune",
            "qc",
            false
          ),
          cp(
            "Post-tune rest + recheck",
            [
              "Allow rest period before re-measuring",
              "Recheck roundness + flatness",
              "Log any movement and corrective actions",
            ],
            "Recheck",
            "measurement",
            false
          ),
        ],
      },
      {
        id: "shellTrueingTorchTune_3",
        weight: 3,
        adminLeftShort: "Prep Sand",
        adminMainTitle: "Surface Prep Sanding",
        checkpoints: [
          cp(
            "Sand progression completed",
            [
              "Consistent grit progression (no skipping)",
              "Edges protected (no rounding where not intended)",
              "No visible swirls at final grit",
            ],
            "Sand prog",
            "qc",
            false
          ),
          cp(
            "Final inspection under raking light",
            [
              "Inspect under raking light from multiple angles",
              "Identify scratches/low spots before finish",
              "Correct defects before moving forward",
            ],
            "Raking QC",
            "qc",
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
    stageKey: "exteriorArtFinish",
    weight: 14,
    adminLeftShort: "6. Finish",
    adminMainTitle: "6. Exterior Art & Finish",
    steps: [
      {
        id: "exteriorArtFinish_1",
        weight: 5,
        adminLeftShort: "Bond Prep",
        adminMainTitle: "Bond Prep (Sealer + Surface)",
        checkpoints: [
          cp(
            "Seal strategy applied",
            [
              "Sealer compatible with veneer + resin system",
              "Even coat, no blotching",
              "Dry time respected per product",
            ],
            "Seal prep",
            "qc",
            false
          ),
          cp(
            "Adhesion readiness",
            [
              "Surface cleaned/degreased",
              "Dust removal complete (tack + air + wipe)",
              "No contamination in finish zone",
            ],
            "Adhesion",
            "qc",
            false
          ),
        ],
      },
      {
        id: "exteriorArtFinish_2",
        weight: 4,
        adminLeftShort: "Apply Veneer",
        adminMainTitle: "Apply Veneer (Exact Match)",
        checkpoints: [
          cp(
            "Grain orientation confirmed",
            [
              "Matches reference intent",
              "Seam/centerline decisions confirmed",
              "Wrap direction confirmed",
            ],
            "Orientation",
            "qc",
            false
          ),
          cp(
            "Veneer applied without defects",
            [
              "No bubbles or voids",
              "Seams are tight (no lift)",
              "Edges are clean and stable",
            ],
            "Veneer QC",
            "qc",
            false
          ),
        ],
      },
      {
        id: "exteriorArtFinish_3",
        weight: 3,
        adminLeftShort: "Resin/Color",
        adminMainTitle: "Resin / Color Accent Integration",
        checkpoints: [
          cp(
            "Accent behavior enforced",
            [
              "Speckled integration (NOT streaks)",
              "Lives in grain/knots/stress points",
              "Wraps full circumference",
              "No harsh “electric” lines",
            ],
            "Accent rules",
            "qc",
            false
          ),
          cp(
            "Color verified vs HEX",
            [
              "HEX captured and referenced",
              "Test swatch compared under similar lighting",
              "Adjust tone before commit if needed",
            ],
            "HEX match",
            "measurement",
            true
          ),
        ],
      },
      {
        id: "exteriorArtFinish_4",
        weight: 2,
        adminLeftShort: "Clear + Cure",
        adminMainTitle: "Clearcoat + Cure",
        checkpoints: [
          cp(
            "Clearcoat applied evenly",
            [
              "No runs/sags",
              "Consistent film build",
              "No dry spray / orange peel beyond tolerance",
            ],
            "Clear",
            "qc",
            false
          ),
          cp(
            "Cure schedule logged",
            [
              "Cure time recorded",
              "No handling too early",
              "Environment stable during cure",
            ],
            "Cure",
            "task",
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
    stageKey: "edgesSnareBeds",
    weight: 10,
    adminLeftShort: "7. Edges",
    adminMainTitle: "7. Edges & Snare Beds",
    steps: [
      {
        id: "edgesSnareBeds_1",
        weight: 4,
        adminLeftShort: "Bearing Edges",
        adminMainTitle: "Cut Bearing Edges",
        checkpoints: [
          cp(
            "Edge profile executed",
            [
              "Profile matches spec (angle/roundover)",
              "Clean apex, no tear-out",
              "Consistent around full circumference",
            ],
            "Profile",
            "qc",
            false
          ),
          cp(
            "Edge flatness verified",
            [
              "Confirm even contact on reference surface",
              "No high spots / rocking",
              "Log any corrective truing",
            ],
            "Flatness",
            "measurement",
            false
          ),
          cp(
            "Edge finish polish",
            [
              "Polish/sand to final feel",
              "No burrs or micro-chips",
              "Touch test confirms smoothness",
            ],
            "Polish",
            "task",
            true
          ),
        ],
      },
      {
        id: "edgesSnareBeds_2",
        weight: 4,
        adminLeftShort: "Snare Beds",
        adminMainTitle: "Cut Snare Beds",
        checkpoints: [
          cp(
            "Bed depth + symmetry verified",
            [
              "Even depth on both sides",
              "Smooth transition into bearing edge",
              "No abrupt ledges",
            ],
            "Depth",
            "measurement",
            false
          ),
          cp(
            "Wire alignment confirmed",
            [
              "Centered alignment for throw/butt",
              "No pull to one side",
              "Test plate/wire alignment verified",
            ],
            "Alignment",
            "qc",
            false
          ),
          cp(
            "Bed surface finished clean",
            [
              "No chatter marks",
              "No tear-out in bed zone",
              "Final smoothness verified",
            ],
            "Bed finish",
            "qc",
            true
          ),
        ],
      },
      {
        id: "edgesSnareBeds_3",
        weight: 2,
        adminLeftShort: "Head Seat",
        adminMainTitle: "Head Seating + Fit Check",
        checkpoints: [
          cp(
            "Head seats cleanly",
            [
              "Head drops on without binding",
              "No rocking",
              "Even collar contact",
            ],
            "Head seat",
            "qc",
            false
          ),
          cp(
            "Hoop fit check",
            [
              "Hoop sits evenly",
              "No interference points",
              "Roundness confirmed under hoop",
            ],
            "Hoop fit",
            "measurement",
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
    stageKey: "hardwareAssembly",
    weight: 12,
    adminLeftShort: "8. Hardware",
    adminMainTitle: "8. Hardware & Assembly",
    steps: [
      {
        id: "hardwareAssembly_1",
        weight: 4,
        adminLeftShort: "Layout",
        adminMainTitle: "Hardware Layout + Marking",
        checkpoints: [
          cp(
            "Confirm lug count + spacing",
            [
              "Verify lug count matches spec (6/8/10)",
              "Verify spacing plan before drilling",
              "Mark clock positions precisely",
            ],
            "Lug spacing",
            "measurement",
            false
          ),
          cp(
            "Confirm throw/butt alignment",
            [
              "Throw/butt centered across snare beds",
              "Wire path alignment verified",
            ],
            "Throw align",
            "qc",
            false
          ),
          cp(
            "Badge placement confirmed",
            [
              "Centered vertically on shell",
              "Orientation correct",
              "Finish matches hardware spec",
            ],
            "Badge place",
            "qc",
            false
          ),
        ],
      },
      {
        id: "hardwareAssembly_2",
        weight: 5,
        adminLeftShort: "Drill",
        adminMainTitle: "Drilling + Install Hardware",
        checkpoints: [
          cp(
            "Drill clean + tear-out controlled",
            [
              "Backer used where needed",
              "Hole edges clean",
              "Hardware sits flush",
            ],
            "Drill QC",
            "qc",
            false
          ),
          cp(
            "Install lugs + gaskets/isolators",
            [
              "All lugs installed",
              "No binding",
              "Tension even across mounts",
            ],
            "Install lugs",
            "task",
            false
          ),
          cp(
            "Install throw + butt + strap/cord",
            [
              "Smooth throw action",
              "No scraping/binding",
              "Alignment confirmed under tension",
            ],
            "Throw/butt",
            "task",
            false
          ),
          cp(
            "Hoops: diecast + correct fit",
            [
              "Diecast hoops installed (confirm)",
              "No interference",
              "Even seating",
            ],
            "Diecast fit",
            "qc",
            false
          ),
        ],
      },
      {
        id: "hardwareAssembly_3",
        weight: 3,
        adminLeftShort: "Heads/Wires",
        adminMainTitle: "Heads + Snare Wires Installed",
        checkpoints: [
          cp(
            "Install heads",
            [
              "Batter + snare-side installed",
              "Initial tension even",
              "Collar seating verified",
            ],
            "Heads",
            "task",
            false
          ),
          cp(
            "Install snare wires centered",
            [
              "Wire centered over beds",
              "Even strap/cord tension",
              "No off-center buzz zones",
            ],
            "Wires",
            "qc",
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
    stageKey: "legacyTuningMedia",
    weight: 8,
    adminLeftShort: "9. Tuning",
    adminMainTitle: "9. Legacy Tuning & Media",
    steps: [
      {
        id: "legacyTuningMedia_1",
        weight: 3,
        adminLeftShort: "Tuning Pass",
        adminMainTitle: "Primary Tuning Pass",
        checkpoints: [
          cp(
            "Seat heads + initial stretch",
            [
              "Equalize tension around lugs",
              "Press/seat carefully",
              "Re-tension and re-check",
            ],
            "Seat heads",
            "task",
            false
          ),
          cp(
            "Dial snare response",
            [
              "Snare-side tension balanced",
              "Wire tension set for sensitivity target",
              "Check dynamic articulation (ghost ↔ rimshot)",
            ],
            "Snare resp",
            "qc",
            false
          ),
          cp(
            "Control unwanted artifacts",
            [
              "Identify buzz zones",
              "Adjust tension/throw/bed contact if needed",
              "Confirm musical sustain target",
            ],
            "Control buzz",
            "qc",
            false
          ),
        ],
      },
      {
        id: "legacyTuningMedia_2",
        weight: 3,
        adminLeftShort: "Media Capture",
        adminMainTitle: "Capture Media (Sound + Visual)",
        checkpoints: [
          cp(
            "Record reference audio",
            [
              "Close mic sample",
              "Room sample",
              "Soft/medium/hard hits captured",
            ],
            "Audio",
            "task",
            true
          ),
          cp(
            "Capture beauty photos",
            [
              "Lighting shows grain + accents accurately",
              "Hardware finish visible",
              "Badge visible and centered",
            ],
            "Photos",
            "task",
            true
          ),
          cp(
            "Log final tuning notes",
            [
              "Batter approx tuning",
              "Reso approx tuning",
              "Wire tension notes",
            ],
            "Tuning notes",
            "task",
            true
          ),
        ],
      },
      {
        id: "legacyTuningMedia_3",
        weight: 2,
        adminLeftShort: "Customer Share",
        adminMainTitle: "Customer Update + Delivery Prep Notes",
        checkpoints: [
          cp(
            "Send update summary",
            [
              "Share progress + what changed",
              "Set delivery expectations",
              "Confirm any last preferences",
            ],
            "Update",
            "task",
            true
          ),
          cp(
            "Finalize portal attachments",
            [
              "Upload photos/audio",
              "Tag in correct category",
              "Set visibility appropriately",
            ],
            "Portal files",
            "qc",
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
    stageKey: "finalQAPackagingDelivery",
    weight: 10,
    adminLeftShort: "10. Final QA",
    adminMainTitle: "10. Final QA, Packaging & Delivery",
    steps: [
      {
        id: "finalQAPackagingDelivery_1",
        weight: 4,
        adminLeftShort: "Final QA",
        adminMainTitle: "Final QA Checklist",
        checkpoints: [
          cp(
            "Hardware verification",
            [
              "Lugs are correct style (vintage tube lugs)",
              "Hoops are diecast",
              "Finish matches spec",
              "Badge finish matches hardware",
            ],
            "Hardware QA",
            "qc",
            false
          ),
          cp(
            "Fit + function verification",
            [
              "Throw operates smoothly",
              "No rattle/binding",
              "Head seats properly",
              "Even lug tension possible",
            ],
            "Function QA",
            "qc",
            false
          ),
          cp(
            "Cosmetic inspection",
            [
              "No finish defects beyond tolerance",
              "No scratches/dings",
              "Accents behave as specified (speckled, wrap, organic)",
            ],
            "Cosmetic",
            "qc",
            false
          ),
          cp(
            "Sound verification",
            [
              "Hit test across dynamics",
              "Snare response is consistent",
              "Sustain/decay matches target direction",
            ],
            "Sound QA",
            "qc",
            false
          ),
        ],
      },
      {
        id: "finalQAPackagingDelivery_2",
        weight: 3,
        adminLeftShort: "Pack",
        adminMainTitle: "Packaging",
        checkpoints: [
          cp(
            "Protective packing complete",
            [
              "Shell protected from impact",
              "Hardware protected from rub",
              "Finish protected from abrasion",
            ],
            "Protection",
            "task",
            false
          ),
          cp(
            "Include documents / care notes",
            [
              "Care + maintenance notes",
              "Any tuning notes",
              "Thank-you / brand insert",
            ],
            "Docs",
            "task",
            true
          ),
          cp(
            "Photo before seal",
            [
              "Quick photo proof of packed condition",
              "Attach to project for record",
            ],
            "Pack photo",
            "task",
            true
          ),
        ],
      },
      {
        id: "finalQAPackagingDelivery_3",
        weight: 3,
        adminLeftShort: "Ship/Deliver",
        adminMainTitle: "Shipping / Delivery",
        checkpoints: [
          cp(
            "Label + carrier confirmed",
            [
              "Address verified again",
              "Carrier + service selected",
              "Insurance set appropriately",
            ],
            "Label",
            "qc",
            false
          ),
          cp(
            "Tracking shared with customer",
            [
              "Tracking sent",
              "Delivery expectations communicated",
            ],
            "Tracking",
            "task",
            false
          ),
          cp(
            "Closeout + archive",
            [
              "Project status set to finished",
              "Final media stored",
              "Any follow-up reminders queued",
            ],
            "Closeout",
            "task",
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
export const STAGES = Object.values(STAGE_TEMPLATES).map((stage, stageIndex) => ({
  stageKey: stage.stageKey,
  weight: stage.weight,
  adminLeftShort: stage.adminLeftShort,
  adminMainTitle: stage.adminMainTitle,
  stageNumber: stageIndex + 1,
  steps: stage.steps.map((step, stepIndex) => ({
    ...step,
    stepNumber: stepIndex + 1,
  })),
}));

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
  woodPreparation: "woodVisionLockIn",
  shellConstruction: "rawShellCreation",
  fineTuning: "shellTrueingTorchTune",
  shellExteriorFinish: "exteriorArtFinish",
  bearingEdges: "edgesSnareBeds",
  snareBedCutting: "edgesSnareBeds",
  hardwareDrilling: "hardwareAssembly",
  tuningDetailing: "legacyTuningMedia",
  qualityCheck: "finalQAPackagingDelivery",
};

// 5) Helper to resolve stage key safely
export const resolveStageKey = (key) => {
  if (!key) return null;
  return LEGACY_STAGEKEY_ALIASES[key] || key;
};