// src/utils/defaultProjectFields.js

// ⚙️ Canonical, non-step fields for every drum project.
// Step checklists (woodPreparation, shellConstruction, etc.) come from defaultStepData.

const defaultProjectFields = {
  /* ---------- identity / linkage ---------- */
  orderId: '',
  ownerUid: null,
  ownerEmail: '',
  customerName: '',
  customer: {
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
    },
  },

  /* ---------- drum build meta ---------- */
  artisanLine: '',              // e.g., "SoundLegend", "Heritage", "Feuzøn"
  lineSerial: '',               // e.g., "SL-004"
  globalSerial: '',             // e.g., "000008"
  staveCount: '',               // e.g., "20"
  width: '',                    // diameter, e.g., "14"
  shellDepth: '',               // depth, e.g., "6.5"
  shellConstructionName: '',    // e.g., "Stave", "Hybrid", "Steam-Bent"
  woodPrimary: '',
  woodSecondary: '',
  woodSecondaryPercent: '',
  reinforcementRings: '',
  targetShellThickness: '',
  hardwareColor: '',
  hoops: '',
  lugType: '',
  lugCount: '',
  snareThrowOff: '',
  throwOff: '',
  snareWires: '',
  snareBedDepth: '',
  bearingEdge: '',
  finishDetails: '',
  additionalNotes: '',

  /* ---------- timeline / status ---------- */
  startDate: null,          // can be Timestamp or ISO string; UI handles both
  targetCompletion: '',     // store as "YYYY-MM-DD" string
  actualCompletion: '',     // store as "YYYY-MM-DD" string
  status: 'In Progress',    // or "Order Started", "Finished", etc.
  currentPhase: 'Step 1. Wood Preparation',

  /* ---------- Vault / Legacy prefs ---------- */
  publicPrefs: {
    namePublicEnabled: false,
    storyPublicEnabled: false,
    displayName: '',
    storyHtml: '',
  },

  /* ---------- shipping ---------- */
  shipping: {
    shipDate: '',            // "YYYY-MM-DD"
    deliveryDate: '',        // "YYYY-MM-DD"
    trackingNumber: '',      // string
  },

  /* ---------- attachments (file sections) ---------- */
  // Each key will map to an array of { url, category, hidden }
  attachments: {},

  /* ---------- misc / totals ---------- */
  totalTimeSeconds: 0,
};

export default defaultProjectFields;