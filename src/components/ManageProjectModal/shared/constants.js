export const STEP_KEYS = [
  'discoveryDesign',
  'commitmentPortal',
  'woodVisionLockIn',
  'rawShellCreation',
  'shellTrueingTorchTune',
  'exteriorArtFinish',
  'edgesSnareBeds',
  'hardwareAssembly',
  'legacyTuningMedia',
  'finalQAPackagingDelivery',
];

export const STEP_META = {
  discoveryDesign: {
    label: 'Chapter I • Discovery & Design',
    phaseId: 'phase1',
  },
  commitmentPortal: {
    label: 'Chapter II • Commitment & Portal Setup',
    phaseId: 'phase1',
  },
  woodVisionLockIn: {
    label: 'Chapter III • Wood & Vision Lock-In',
    phaseId: 'phase1',
  },
  rawShellCreation: {
    label: 'Chapter IV • Raw Shell Creation',
    phaseId: 'phase2',
  },
  shellTrueingTorchTune: {
    label: 'Chapter V • Shell Trueing & Torch Tune',
    phaseId: 'phase2',
  },
  exteriorArtFinish: {
    label: 'Chapter VI • Exterior Art & Finish',
    phaseId: 'phase2',
  },
  edgesSnareBeds: {
    label: 'Chapter VII • Edges & Snare Beds',
    phaseId: 'phase2',
  },
  hardwareAssembly: {
    label: 'Chapter VIII • Hardware & Assembly',
    phaseId: 'phase2',
  },
  legacyTuningMedia: {
    label: 'Chapter IX • Legacy Tuning & Media',
    phaseId: 'phase3',
  },
  finalQAPackagingDelivery: {
    label: 'Legacy Chapter • Final QA, Packaging & Delivery',
    phaseId: 'phase3',
  },
};

export const buildPhases = STEP_KEYS.map((key) => ({
  key,
  label: STEP_META[key]?.label || key,
  phaseId: STEP_META[key]?.phaseId || null,
}));

export const ADMIN_SECTIONS = {
  OVERVIEW_PROJECT_DETAILS: 'overviewProjectDetails',
  OVERVIEW_BUILD_SCOPE: 'overviewBuildScope',
  OVERVIEW_MEDIA_FILES: 'overviewMediaFiles',

  DISCOVERY_INTAKE_DETAILS: 'discoveryIntakeDetails',
  DISCOVERY_PRECONSULT_PREP: 'discoveryPreconsultPrep',
  DISCOVERY_CONSULTATION_TOOL: 'discoveryConsultationTool',
  DISCOVERY_CRAFTSMAN_MASTER: 'discoveryCraftsmanMaster',
  DISCOVERY_FULL_RECAP: 'discoveryFullRecap',

  BUILD_VENEER_DESIGNER: 'buildVeneerDesigner',
  BUILD_WORKFLOW: 'buildWorkflow',
};

export const ADMIN_NAV_GROUPS = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      {
        key: ADMIN_SECTIONS.OVERVIEW_PROJECT_DETAILS,
        label: 'Project Details',
      },
      {
        key: ADMIN_SECTIONS.OVERVIEW_BUILD_SCOPE,
        label: 'Build Scope',
      },
      {
        key: ADMIN_SECTIONS.OVERVIEW_MEDIA_FILES,
        label: 'Media & Files',
      },
    ],
  },
  {
    id: 'discovery',
    label: 'Discovery Tools',
    items: [
      {
        key: ADMIN_SECTIONS.DISCOVERY_INTAKE_DETAILS,
        label: 'Intake Details & Interpretation',
      },
      {
        key: ADMIN_SECTIONS.DISCOVERY_PRECONSULT_PREP,
        label: 'Intake Analysis & Pre-Consult Prep',
      },
      {
        key: ADMIN_SECTIONS.DISCOVERY_CONSULTATION_TOOL,
        label: 'Consultation Call & Transcript Tool',
      },
      {
        key: ADMIN_SECTIONS.DISCOVERY_CRAFTSMAN_MASTER,
        label: 'Craftsman Master Tool',
      },
      {
        key: ADMIN_SECTIONS.DISCOVERY_FULL_RECAP,
        label: 'Full Discovery Recap Interpretation Tool',
      },
    ],
  },
  {
    id: 'build',
    label: 'Build',
    items: [
      {
        key: ADMIN_SECTIONS.BUILD_VENEER_DESIGNER,
        label: 'Veneer Designer Tool',
      },
    ],
  },
];

export const MEDIA_FILE_SECTIONS = [
  { key: 'buildProposal', label: 'Build Proposal' },
  { key: 'woodSelection', label: 'Wood Selection' },
  { key: 'earlyMockups', label: 'Early Mockups' },
  {
    key: 'staveConstructionPreMilling',
    label: 'Stave Construction (Pre-Milling)',
  },
  {
    key: 'staveConstructionPostMilling',
    label: 'Stave Construction (Post-Milling)',
  },
  { key: 'finalMockups', label: 'Final Mockups' },
  { key: 'mediaFiles', label: 'Media Files' },
  { key: 'other', label: 'Other' },
];

export const MEDIA_FILE_SECTION_LABELS = Object.fromEntries(
  MEDIA_FILE_SECTIONS.map((section) => [section.key, section.label])
);

export const BUILD_WORKFLOW_REQUIRED_DECISION_COUNT = 9;

export const REQUIRED_BUILD_SPEC_KEYS = [
  'shellConstruction',
  'primaryWood',
  'bearingEdge',
  'finishSystem',
  'lugCount',
  'hoopType',
  'snareBed',
];

export const DEFAULT_CRAFTSMAN_TOOL_STATE = {
  decisions: {},
  history: [],
  notes: '',
  customDraft: '',
  currentSelection: '',
  lastUpdatedAt: null,
};

export const CRAFTSMAN_DECISION_TO_BUILDSPEC = {
  shellConstruction: 'shellConstruction',
  primaryWood: 'primaryWood',
  hardwareFinishCommitment: 'hardwareFinish',
  finishDirection: 'finishSystem',
  bearingEdgeDirection: 'bearingEdge',
  tuningApproach: 'tuningApproach',
  lugCountDirection: 'lugCount',
};

export const BUILD_SPEC_TO_CRAFTSMAN_KEY = {
  shellConstruction: 'shellConstruction',
  primaryWood: 'primaryWood',
  hardwareFinish: 'hardwareFinishCommitment',
  finishSystem: 'finishDirection',
  bearingEdge: 'bearingEdgeDirection',
  tuningApproach: 'tuningApproach',
  lugCount: 'lugCountDirection',
};

export const STEPKEY_TO_CHECKPOINT_PREFIX = {
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

export const HYBRID_CHAPTER_PROMPTS = {
  chapterOverview: `
Write the chapter overview for this exact SoundLegend build.

This must read like a real builder's note in a custom build book.
It should feel plain, grounded, and written by hand after reviewing the project.

Requirements:
- 1 paragraph
- 40 to 60 words
- continue naturally from the previous chapter, but still work on its own
- say what currently feels real
- say what is leaning in a direction
- say what is still open
- stop cleanly without a concluding summary sentence

Voice:
- calm
- plain
- observant
- restrained
- human
- workshop-real

Return only the paragraph text.
`.trim(),

  buildNotes: `
Write the build notes for this exact SoundLegend build.

These are private bench notes from the maker to himself.

Requirements:
- return 4 to 6 bullet strings
- one short sentence per bullet
- each bullet should name a real direction, open question, caution, or thing to protect
- be specific where the data supports it
- be honest where the data does not support a firm decision yet

Return only an array of bullet strings.
`.trim(),
};