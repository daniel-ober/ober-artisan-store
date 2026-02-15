// src/utils/defaultStepData.js

const make = (id, uiLabel, bookLabel) => ({
  id, // MUST match keys in CHECKPOINTS_BY_ITEM_ID (e.g. discoveryDesign_1)
  label: uiLabel, // UI label (admin + artist portal)
  bookLabel: bookLabel || uiLabel, // Book/export label
  task: uiLabel, // backwards compat with older code that expects task/label
  completed: false,
  totalSeconds: 0,
  checkpointStates: [], // values: false | true | "na"
});

/**
 * 10 stages (stepKeys), 48 stage steps total
 * Counts:
 *  - Discovery & Design: 5
 *  - Commitment & Portal Setup: 4
 *  - Wood & Vision Lock-In: 5
 *  - Raw Shell Creation: 6
 *  - Shell Trueing & Torch Tune: 5
 *  - Exterior Art & Finish: 6
 *  - Edges & Snare Beds: 5
 *  - Hardware & Assembly: 5
 *  - Legacy Tuning & Media: 4
 *  - Final QA, Packaging & Delivery: 3
 * TOTAL = 48
 */
const defaultStepData = {
  discoveryDesign: {
    stageLabel: 'Discovery & Design',
    checklist: [
      make('discoveryDesign_1', 'Player Interview', 'Player Discovery Interview'),
      make(
        'discoveryDesign_2',
        'Voice Targets',
        'Sonic Targets & Voice Definition'
      ),
      make('discoveryDesign_3', 'Spec Targets', 'Physical Spec Targets'),
      make('discoveryDesign_4', 'Aesthetic Lane', 'Aesthetic Direction'),
      make(
        'discoveryDesign_5',
        'Feasibility Gate',
        'Build Feasibility & Guardrails Gate'
      ),
    ],
  },

  commitmentPortal: {
    stageLabel: 'Commitment & Portal Setup',
    checklist: [
      make(
        'commitmentPortal_1',
        'Deposit + Confirm',
        'Order Confirmation & Deposit'
      ),
      make('commitmentPortal_2', 'Portal Setup', 'Project Portal Initialization'),
      make(
        'commitmentPortal_3',
        'Approval Rules',
        'Communication & Approval Rules'
      ),
      make(
        'commitmentPortal_4',
        'Schedule + Risks',
        'Baseline Schedule & Risk Flags'
      ),
    ],
  },

  woodVisionLockIn: {
    stageLabel: 'Wood & Vision Lock-In',
    checklist: [
      make(
        'woodVisionLockIn_1',
        'Wood Select + MC',
        'Wood Set Selection & Moisture Verification'
      ),
      make(
        'woodVisionLockIn_2',
        'Build Plan',
        'Shell Construction Plan (Stave/Thickness/Orientation)'
      ),
      make('woodVisionLockIn_3', 'Veneer Plan', 'Veneer/Wrap Lock & Seam Plan'),
      make(
        'woodVisionLockIn_4',
        'Resin Strategy',
        'Resin/Accent Strategy (HEX + Organic Logic)'
      ),
      make('woodVisionLockIn_5', 'Vision Approval', 'Final Vision Approval Gate'),
    ],
  },

  rawShellCreation: {
    stageLabel: 'Raw Shell Creation',
    checklist: [
      make('rawShellCreation_1', 'Stave Prep', 'Stave Block Prep & Measurements'),
      make('rawShellCreation_2', 'Miters + Fit', 'Bevel/Miter Cuts & Joint Fit'),
      make(
        'rawShellCreation_3',
        'Dry Fit Ring',
        'Full Dry Fit Ring & Roundness Check'
      ),
      make(
        'rawShellCreation_4',
        'Glue + Clamp',
        'Glue-Up & Compression & Alignment'
      ),
      make(
        'rawShellCreation_5',
        'Cure + Inspect',
        'Cure & Joint Inspection'
      ),
      make(
        'rawShellCreation_6',
        'Rough True',
        'Rough Turning / OD Truing & Stabilization'
      ),
    ],
  },

  shellTrueingTorchTune: {
    stageLabel: 'Shell Trueing & Torch Tune',
    checklist: [
      make(
        'shellTrueingTorchTune_1',
        'Surface Prep',
        'Surface Prep (Exterior + Interior)'
      ),
      make(
        'shellTrueingTorchTune_2',
        'ID Jig Setup',
        'Interior Truing Setup'
      ),
      make(
        'shellTrueingTorchTune_3',
        'OD Validate',
        'Final OD Validation (Roundness + Thickness Map)'
      ),
      make(
        'shellTrueingTorchTune_4',
        'ID Validate',
        'Final ID Validation (Smoothness + Tear-Out)'
      ),
      make(
        'shellTrueingTorchTune_5',
        'Stabilize/Torch',
        'Stabilize + Torch Tune (Optional)'
      ),
    ],
  },

  exteriorArtFinish: {
    stageLabel: 'Exterior Art & Finish',
    checklist: [
      make(
        'exteriorArtFinish_1',
        'Bond Prep',
        'Veneer Bond Prep (Dry Fit + Adhesive Plan)'
      ),
      make(
        'exteriorArtFinish_2',
        'Apply Veneer',
        'Veneer Application & Seam Integrity'
      ),
      make('exteriorArtFinish_3', 'Resin/Color', 'Accent Resin / Color Work'),
      make(
        'exteriorArtFinish_4',
        'Prep Clear',
        'Surface Prep for Clear (Flatness + Dust Control)'
      ),
      make(
        'exteriorArtFinish_5',
        'Clear + Cure',
        'Clear Coat System & Cure Management'
      ),
      make('exteriorArtFinish_6', 'Level + Buff', 'Level Sand & Buff to Final'),
    ],
  },

  edgesSnareBeds: {
    stageLabel: 'Edges & Snare Beds',
    checklist: [
      make(
        'edgesSnareBeds_1',
        'Cut Edges',
        'Bearing Edge Cut & Profile Verification'
      ),
      make('edgesSnareBeds_2', 'Bed Layout', 'Snare Bed Layout & Symmetry Plan'),
      make(
        'edgesSnareBeds_3',
        'Cut Beds',
        'Snare Bed Cutting & Transition Smoothness'
      ),
      make('edgesSnareBeds_4', 'Seal Edges', 'Edge Sealing & Protection'),
      make('edgesSnareBeds_5', 'Seating QC', 'Seating + Response QC Gate'),
    ],
  },

  hardwareAssembly: {
    stageLabel: 'Hardware & Assembly',
    checklist: [
      make(
        'hardwareAssembly_1',
        'Layout Plan',
        'Layout Plan (Lugs/Throw/Butt/Badge/Vent)'
      ),
      make(
        'hardwareAssembly_2',
        'Drill + Fit',
        'Drill & Fit (Accuracy + Tear-Out Prevention)'
      ),
      make(
        'hardwareAssembly_3',
        'Install Lugs',
        'Lug Install + Protection Stack'
      ),
      make(
        'hardwareAssembly_4',
        'Install Snare',
        'Throw-Off/Butt Install & Alignment'
      ),
      make(
        'hardwareAssembly_5',
        'Mech QC',
        'Mechanical QC Gate (Torque/Rattle/Clearance)'
      ),
    ],
  },

  legacyTuningMedia: {
    stageLabel: 'Legacy Tuning & Media',
    checklist: [
      make('legacyTuningMedia_1', 'Seat Heads', 'Head Install & Seating Procedure'),
      make(
        'legacyTuningMedia_2',
        'Dial Wires',
        'Snare Wire Centering & Response'
      ),
      make(
        'legacyTuningMedia_3',
        'Legacy Voice',
        'Legacy Voicing (Low/Legacy/High)'
      ),
      make(
        'legacyTuningMedia_4',
        'Tuning Notes',
        'Tuning Analysis (Hz/Window/References)'
      ),
    ],
  },

  finalQAPackagingDelivery: {
    stageLabel: 'Final QA, Packaging & Delivery',
    checklist: [
      make(
        'finalQAPackagingDelivery_1',
        'Final QA',
        'Final Cosmetic/Structural/Sound Inspection'
      ),
      make(
        'finalQAPackagingDelivery_2',
        'Pack Insert',
        'Packaging Build + Documentation Inserts'
      ),
      make(
        'finalQAPackagingDelivery_3',
        'Ship Close',
        'Shipping + Tracking + Follow-Up Closeout'
      ),
    ],
  },
};

export default defaultStepData;