// src/utils/defaultStepData.js

// Simple phase tags so we can color-code later if we want
export const STEP_PHASES = {
  PRE_BUILD: 'pre-build',
  BUILD: 'build',
  POST_BUILD: 'post-build',
};

/**
 * defaultStepData
 *
 * Each key here corresponds to a *core* step in the build journey.
 * These 10 steps should drive:
 *  - Sidebar navigation
 *  - Progress tracker bar
 *  - Customer-facing and admin-facing step labels
 *
 * Inside each step, `checklist` holds the substeps / checkpoints
 * (what your process doc calls 1.1, 1.2, 1.6, 2.1, 2.2, etc.).
 */
export const defaultStepData = {
  /* ----------------------------------------------------------
   * 1. Discovery & Design  (Phase 1 — Pre-Build)
   *   • Initial Consultation
   *   • Build Proposal
   * -------------------------------------------------------- */
  discoveryDesign: {
    key: 'discoveryDesign',
    label: '1. Discovery & Design',
    phase: STEP_PHASES.PRE_BUILD,
    order: 1,
    checklist: [
      {
        id: 'discoveryDesign_1',
        label: 'Initial consultation',
        task: 'Initial consultation',
        completed: false,
        totalSeconds: 0,
      },
      {
        id: 'discoveryDesign_2',
        label: 'Build proposal',
        task: 'Build proposal',
        completed: false,
        totalSeconds: 0,
      },
    ],
  },

  /* ----------------------------------------------------------
   * 2. Commitment & Portal Setup  (Phase 1 — Pre-Build)
   *   • Payment Processing
   *   • Portal Access Setup
   * -------------------------------------------------------- */
  commitmentPortal: {
    key: 'commitmentPortal',
    label: '2. Commitment & Portal Setup',
    phase: STEP_PHASES.PRE_BUILD,
    order: 2,
    checklist: [
      {
        id: 'commitmentPortal_1',
        label: 'Payment processing',
        task: 'Payment processing',
        completed: false,
        totalSeconds: 0,
      },
      {
        id: 'commitmentPortal_2',
        label: 'Portal access setup',
        task: 'Portal access setup',
        completed: false,
        totalSeconds: 0,
      },
    ],
  },

  /* ----------------------------------------------------------
   * 3. Wood & Vision Lock-In  (Phase 1 — Pre-Build)
   *   • Wood Selection
   *   • Early Mockups
   *   • Pre-Build Measuring & Prep
   * -------------------------------------------------------- */
  woodVisionLockIn: {
    key: 'woodVisionLockIn',
    label: '3. Wood & Vision Lock-In',
    phase: STEP_PHASES.PRE_BUILD,
    order: 3,
    checklist: [
      {
        id: 'woodVisionLockIn_1',
        label: 'Wood selection',
        task: 'Wood selection',
        completed: false,
        totalSeconds: 0,
      },
      {
        id: 'woodVisionLockIn_2',
        label: 'Early mockups',
        task: 'Early mockups',
        completed: false,
        totalSeconds: 0,
      },
      {
        id: 'woodVisionLockIn_3',
        label: 'Pre-build measuring & prep',
        task: 'Pre-build measuring & prep',
        completed: false,
        totalSeconds: 0,
      },
    ],
  },

  /* ----------------------------------------------------------
   * 4. Raw Shell Creation  (Phase 2 — Build)
   *   • Cut Stave Blocks to Size
   *   • Cut Stave Bevels
   *   • Pre-Glue Test
   *   • Glue-Up & Clamping
   *   • Glue Curing
   *   • Exterior Milling Setup
   *   • Mill Exterior Diameter
   *   • Outer Bevel Reinforcement
   * -------------------------------------------------------- */
  rawShellCreation: {
    key: 'rawShellCreation',
    label: '4. Raw Shell Creation',
    phase: STEP_PHASES.BUILD,
    order: 4,
    checklist: [
      {
        id: 'rawShellCreation_1',
        label: 'Cut stave blocks to size',
        task: 'Cut stave blocks to size',
        completed: false,
        totalSeconds: 0,
      },
      {
        id: 'rawShellCreation_2',
        label: 'Cut stave bevels',
        task: 'Cut stave bevels',
        completed: false,
        totalSeconds: 0,
      },
      {
        id: 'rawShellCreation_3',
        label: 'Pre-glue test (dry-fit)',
        task: 'Pre-glue test (dry-fit)',
        completed: false,
        totalSeconds: 0,
      },
      {
        id: 'rawShellCreation_4',
        label: 'Glue-up & clamping',
        task: 'Glue-up & clamping',
        completed: false,
        totalSeconds: 0,
      },
      {
        id: 'rawShellCreation_5',
        label: 'Glue curing',
        task: 'Glue curing',
        completed: false,
        totalSeconds: 0,
      },
      {
        id: 'rawShellCreation_6',
        label: 'Exterior milling setup',
        task: 'Exterior milling setup',
        completed: false,
        totalSeconds: 0,
      },
      {
        id: 'rawShellCreation_7',
        label: 'Mill exterior diameter',
        task: 'Mill exterior diameter',
        completed: false,
        totalSeconds: 0,
      },
      {
        id: 'rawShellCreation_8',
        label: 'Outer bevel reinforcement',
        task: 'Outer bevel reinforcement',
        completed: false,
        totalSeconds: 0,
      },
    ],
  },

  /* ----------------------------------------------------------
   * 5. Shell Trueing & Torch Tune  (Phase 2 — Build)
   *   • Sanding Prep (for Veneer + Interior)
   *   • Interior Milling Setup
   *   • Mill Interior Thickness
   *   • Inner Bevel Reinforcement
   *   • Sanding Prep (Interior)
   *   • Original Torch Tune Process
   * -------------------------------------------------------- */
  shellTrueingTorchTune: {
    key: 'shellTrueingTorchTune',
    label: '5. Shell Trueing & Torch Tune',
    phase: STEP_PHASES.BUILD,
    order: 5,
    checklist: [
      {
        id: 'shellTrueingTorchTune_1',
        label: 'Sanding prep (for veneer + interior)',
        task: 'Sanding prep (for veneer + interior)',
        completed: false,
        totalSeconds: 0,
      },
      {
        id: 'shellTrueingTorchTune_2',
        label: 'Interior milling setup',
        task: 'Interior milling setup',
        completed: false,
        totalSeconds: 0,
      },
      {
        id: 'shellTrueingTorchTune_3',
        label: 'Mill interior thickness',
        task: 'Mill interior thickness',
        completed: false,
        totalSeconds: 0,
      },
      {
        id: 'shellTrueingTorchTune_4',
        label: 'Inner bevel reinforcement',
        task: 'Inner bevel reinforcement',
        completed: false,
        totalSeconds: 0,
      },
      {
        id: 'shellTrueingTorchTune_5',
        label: 'Sanding prep (interior)',
        task: 'Sanding prep (interior)',
        completed: false,
        totalSeconds: 0,
      },
      {
        id: 'shellTrueingTorchTune_6',
        label: 'Original torch tune process',
        task: 'Original torch tune process',
        completed: false,
        totalSeconds: 0,
      },
    ],
  },

  /* ----------------------------------------------------------
   * 6. Exterior Art & Finish  (Phase 2 — Build)
   *   • Veneer Application
   *   • Under-Spray Aesthetic Work
   *   • Pre-Finish Full Shell Inspection
   *   • Badge + Logo Work
   *   • Spray Finishing
   *   • Full De-gassing of Chemicals
   *   • Final Sanding
   *   • Polishing
   * -------------------------------------------------------- */
  exteriorArtFinish: {
    key: 'exteriorArtFinish',
    label: '6. Exterior Art & Finish',
    phase: STEP_PHASES.BUILD,
    order: 6,
    checklist: [
      {
        id: 'exteriorArtFinish_1',
        label: 'Veneer application',
        task: 'Veneer application',
        completed: false,
        totalSeconds: 0,
      },
      {
        id: 'exteriorArtFinish_2',
        label: 'Under-spray aesthetic work',
        task: 'Under-spray aesthetic work',
        completed: false,
        totalSeconds: 0,
      },
      {
        id: 'exteriorArtFinish_3',
        label: 'Pre-finish full shell inspection',
        task: 'Pre-finish full shell inspection',
        completed: false,
        totalSeconds: 0,
      },
      {
        id: 'exteriorArtFinish_4',
        label: 'Badge + logo work',
        task: 'Badge + logo work',
        completed: false,
        totalSeconds: 0,
      },
      {
        id: 'exteriorArtFinish_5',
        label: 'Spray finishing',
        task: 'Spray finishing',
        completed: false,
        totalSeconds: 0,
      },
      {
        id: 'exteriorArtFinish_6',
        label: 'Full de-gassing of chemicals',
        task: 'Full de-gassing of chemicals',
        completed: false,
        totalSeconds: 0,
      },
      {
        id: 'exteriorArtFinish_7',
        label: 'Final sanding',
        task: 'Final sanding',
        completed: false,
        totalSeconds: 0,
      },
      {
        id: 'exteriorArtFinish_8',
        label: 'Polishing',
        task: 'Polishing',
        completed: false,
        totalSeconds: 0,
      },
    ],
  },

  /* ----------------------------------------------------------
   * 7. Edges & Snare Beds  (Phase 2 — Build)
   *   • Bearing Edges
   *   • Snare Beds
   * -------------------------------------------------------- */
  edgesSnareBeds: {
    key: 'edgesSnareBeds',
    label: '7. Edges & Snare Beds',
    phase: STEP_PHASES.BUILD,
    order: 7,
    checklist: [
      {
        id: 'edgesSnareBeds_1',
        label: 'Bearing edges',
        task: 'Bearing edges',
        completed: false,
        totalSeconds: 0,
      },
      {
        id: 'edgesSnareBeds_2',
        label: 'Snare beds',
        task: 'Snare beds',
        completed: false,
        totalSeconds: 0,
      },
    ],
  },

  /* ----------------------------------------------------------
   * 8. Hardware & Assembly  (Phase 2 — Build)
   *   • Hardware + Head Assembly
   * -------------------------------------------------------- */
  hardwareAssembly: {
    key: 'hardwareAssembly',
    label: '8. Hardware & Assembly',
    phase: STEP_PHASES.BUILD,
    order: 8,
    checklist: [
      {
        id: 'hardwareAssembly_1',
        label: 'Hardware + head assembly',
        task: 'Hardware + head assembly',
        completed: false,
        totalSeconds: 0,
      },
    ],
  },

  /* ----------------------------------------------------------
   * 9. Legacy Tuning & Media  (Phase 3 — Post-Build)
   *   • Legacy Resonance Analysis
   *   • Legacy Tuning
   *   • Professional Photos
   *   • Studio Legacy Audio
   * -------------------------------------------------------- */
  legacyTuningMedia: {
    key: 'legacyTuningMedia',
    label: '9. Legacy Tuning & Media',
    phase: STEP_PHASES.POST_BUILD,
    order: 9,
    checklist: [
      {
        id: 'legacyTuningMedia_1',
        label: 'Legacy resonance analysis',
        task: 'Legacy resonance analysis',
        completed: false,
        totalSeconds: 0,
      },
      {
        id: 'legacyTuningMedia_2',
        label: 'Legacy tuning',
        task: 'Legacy tuning',
        completed: false,
        totalSeconds: 0,
      },
      {
        id: 'legacyTuningMedia_3',
        label: 'Professional photos',
        task: 'Professional photos',
        completed: false,
        totalSeconds: 0,
      },
      {
        id: 'legacyTuningMedia_4',
        label: 'Studio Legacy audio',
        task: 'Studio Legacy audio',
        completed: false,
        totalSeconds: 0,
      },
    ],
  },

  /* ----------------------------------------------------------
   * 10. Final QA, Packaging & Delivery  (Phase 3 — Post-Build)
   *   • NTAG Authentication
   *   • Final Cleaning
   *   • Packaging
   *   • Delivery Confirmation
   * -------------------------------------------------------- */
  finalQAPackagingDelivery: {
    key: 'finalQAPackagingDelivery',
    label: '10. Final QA, Packaging & Delivery',
    phase: STEP_PHASES.POST_BUILD,
    order: 10,
    checklist: [
      {
        id: 'finalQAPackagingDelivery_1',
        label: 'NTAG authentication',
        task: 'NTAG authentication',
        completed: false,
        totalSeconds: 0,
      },
      {
        id: 'finalQAPackagingDelivery_2',
        label: 'Final cleaning',
        task: 'Final cleaning',
        completed: false,
        totalSeconds: 0,
      },
      {
        id: 'finalQAPackagingDelivery_3',
        label: 'Packaging',
        task: 'Packaging',
        completed: false,
        totalSeconds: 0,
      },
      {
        id: 'finalQAPackagingDelivery_4',
        label: 'Delivery confirmation',
        task: 'Delivery confirmation',
        completed: false,
        totalSeconds: 0,
      },
    ],
  },
};

// ⬅️ This line fixes your import error
export default defaultStepData;