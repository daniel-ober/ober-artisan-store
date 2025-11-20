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
 * CHECKPOINTS_BY_ITEM_ID
 *
 * Keyed by checklist item `id` from defaultStepData.
 * Each value is a flat list of strings that combine "Checkpoints"
 * and "Measurements" for that sub-step.
 */
const CHECKPOINTS_BY_ITEM_ID = {
  /* ----------------------------------------------------------
   * 1. Discovery & Design
   * -------------------------------------------------------- */

  // 1.1 Initial consultation
  discoveryDesign_1: [
    'Capture drummer goals (genres, feel, tonal preferences)',
    'Capture ergonomic considerations (arthritis, hand fatigue, stick choice)',
    'Confirm drum size preference (diameter / depth)',
    'Confirm visual tone / finish direction',
    'Determine tuning goals (LegacyPrint window)',
    'Confirm budget & timeline',
  ],

  // 1.2 Build proposal
  discoveryDesign_2: [
    'Generate full written build spec',
    'Select primary wood species',
    'Select secondary species if hybrid',
    'Determine stave count',
    'Determine shell thickness target',
    'Determine veneer choice',
    'Determine hardware finish (chrome / black nickel / brass)',
    'Determine lug style (vintage tube)',
    'Confirm hoop type is diecast',
    'Determine bearing edge profile',
    'Determine snare bed style',
    'Generate mockup previews (if applicable)',
  ],

  // 1.3 Early mockups
  discoveryDesign_3: [
    'Create first-round visual mockups (finish / veneer / hardware)',
    'Explore 2–3 finish concepts with different accents',
    'Mock up badge placement and logo treatments',
    'Prepare quick write-up explaining each option',
    'Share mockups with customer for feedback',
    'Capture revision notes for chosen direction',
  ],

  /* ----------------------------------------------------------
   * 2. Commitment & Portal Setup
   * -------------------------------------------------------- */

  // 2.1 Payment processing
  commitmentPortal_1: [
    'Payment Link sent to customer',
    'Deposit received / payment confirmed',
    'Order status updated to “In Progress”',
  ],

  // 2.2 Portal access setup
  commitmentPortal_2: [
    'Create customer portal record',
    'Link project to SoundLegend dashboard',
    'Send welcome email with portal link',
    'Confirm customer can log in successfully',
  ],

  /* ----------------------------------------------------------
   * 3. Wood & Vision Lock-In
   * -------------------------------------------------------- */

  // 3.1 Wood selection
  woodVisionLockIn_1: [
    'Select raw boards for shell',
    'Check moisture content (MC% reading)',
    'Verify grain direction for musicality and strength',
    'Inspect knots and natural stress lines for resin fill opportunities',
    'Estimate pre-cut length for each board',
    'Optionally review and approve wood set with customer',
    'Record board length',
    'Record board width',
    'Record board thickness',
    'Record moisture reading (%)',
  ],

  // 3.2 Pre-build measuring & prep
  woodVisionLockIn_2: [
    'Veneer integration test (visual + adhesion plan)',
    'Shell color test under natural light',
    'Shell color test with flash / studio light',
    'Acrylic color swatch review against veneer',
    'Logo badge placement test (mock or tape-on)',
    'Send mockups / visuals to customer',
  ],

  /* ----------------------------------------------------------
   * 4. Raw Shell Creation
   * -------------------------------------------------------- */

  // 4.1 Cut stave blocks to size
  rawShellCreation_1: [
    'Confirm grain orientation for each stave block',
    'Ensure all staves are uniform in dimension',
    'Inspect each block for defects, cracks, or voids',
    'Measure block length',
    'Measure block width',
    'Measure block thickness',
  ],

  // 4.2 Cut stave bevels
  rawShellCreation_2: [
    'Inspect for tear-out after bevel cuts',
    'Test fit two or more staves for perfect mating joints',
    'Measure bevel angle accuracy (e.g., 9° or 10°)',
    'Compare width of inner vs outer face to expected values',
  ],

  // 4.3 Pre-glue test (dry-fit)
  rawShellCreation_3: [
    'Perform full dry-fit circle test',
    'Check gaps between staves visually and by feel',
    'Check roundness variance with calipers or jig',
    'Measure out-of-round (target ±0.03")',
    'Evaluate joint tightness at multiple points',
  ],

  // 4.4 Glue-up & clamping
  rawShellCreation_4: [
    'Verify glue spread is uniform on all mating surfaces',
    'Confirm clamp pressure is even around the circle',
    'Clean squeeze-out as it appears',
    'Check vertical alignment of staves at top and bottom',
    'Measure post-glue rough diameter',
    'Check shell height uniformity at multiple locations',
  ],

  // 4.5 Glue curing
  rawShellCreation_5: [
    'Confirm minimum cure time has been met',
    'Remove shell from clamps carefully',
    'Perform visual inspection of all glue joints',
  ],

  // 4.6 Exterior milling setup
  rawShellCreation_6: [
    'Verify exterior milling sled or lathe jig is square and secure',
    'Confirm shell is centered in jig with even overhang',
    'Set cutter/router bit height for safe first pass',
    'Run a light test pass to check for chatter or vibration',
  ],

  // 4.7 Mill exterior diameter
  rawShellCreation_7: [
    'Take multiple shallow passes to reach target diameter',
    'Check diameter at 12 / 3 / 6 / 9 o’clock positions',
    'Confirm roundness tolerance is within spec',
    'Inspect exterior surface for tool marks or tear-out',
  ],

  // 4.8 Outer bevel reinforcement
  rawShellCreation_8: [
    'Apply thin CA or epoxy to outer bevel region',
    'Confirm adhesive wicks evenly along all joints',
    'Sand back reinforcement to a clean, smooth surface',
    'Re-check for micro gaps or hairline cracks',
  ],

  /* ----------------------------------------------------------
   * 5. Shell Trueing & Torch Tune
   * -------------------------------------------------------- */

  // 5.1 Sanding prep (for veneer + interior)
  shellTrueingTorchTune_1: [
    'Perform 80–120 grit exterior prep',
    'Remove high spots or ridges on exterior',
    'Ensure shell is ready for interior jig / next process',
    'Perform 120–220 grit interior smoothing',
    'Micro-inspect all joints on interior surface',
    'Confirm shell is ready for torching and veneer',
  ],

  // 5.2 Interior milling setup
  shellTrueingTorchTune_2: [
    'Verify interior sled / jig alignment',
    'Set interior cutter height and depth of cut',
    'Index shell correctly on interior jig',
  ],

  // 5.3 Mill interior thickness
  shellTrueingTorchTune_3: [
    'Inspect shell exterior for smoothness after passes',
    'Confirm glue lines are exposed and visible',
    'Measure final exterior diameter (e.g., 14.000")',
    'Check roundness accuracy with calipers / jig',
    'Measure outer wall thickness at multiple points',
  ],

  // 5.4 Inner bevel reinforcement
  shellTrueingTorchTune_4: [
    'Inspect interior surface for smoothness',
    'Confirm no significant tear-out on interior',
    'Measure interior diameter',
    'Measure final shell thickness at top',
    'Measure final shell thickness at mid-shell',
    'Measure final shell thickness at bottom',
    'Check inner roundness variance',
  ],

  // 5.5 Sanding prep (interior)
  shellTrueingTorchTune_5: [
    'Apply thin CA glue to outer bevel region',
    'Inspect penetration of CA along joints',
    'Sand back outer bevel to clean, smooth surface',
    'Apply thin CA glue to inner bevel region',
    'Confirm even penetration along inner joints',
    'Sand back inner bevel smooth after cure',
  ],

  // 5.6 Original torch tune process
  shellTrueingTorchTune_6: [
    'Ensure flame pattern is even around shell',
    'Verify grain “pop” without overburning',
    'Confirm no burn-through or structural damage',
  ],

  /* ----------------------------------------------------------
   * 6. Exterior Art & Finish
   * -------------------------------------------------------- */

  // 6.1 Veneer application
  exteriorArtFinish_1: [
    'Verify contact cement coverage on shell and veneer',
    'Roll veneer onto shell with even pressure',
    'Check for bubbles or trapped air',
    'Confirm seam is tight and effectively invisible',
    'Measure veneer thickness',
    'Confirm veneer seam alignment to design plan',
    'Observe any veneer creep or slippage after set time',
  ],

  // 6.2 Under-spray aesthetic work
  exteriorArtFinish_2: [
    'Place acrylic fills in natural stress lines (not random streaks)',
    'Balance torch accents with overall design',
    'Confirm CA injections are level and clear',
    'Sand shell to 320–400 grit before finish',
  ],

  // 6.3 Pre-finish full shell inspection
  exteriorArtFinish_3: [
    'Verify shell is perfectly smooth to the touch',
    'Confirm no veneer overhang at edges',
    'Remove all surface dust and debris',
    'Mask edges as needed before spray',
  ],

  // 6.4 Badge + logo work
  exteriorArtFinish_4: [
    'Align outer badge at correct vertical and rotational position',
    'Place inner badge in correct location',
    'Confirm adhesives or fasteners have set properly',
  ],

  // 6.5 Spray finishing
  exteriorArtFinish_5: [
    'Spray even, controlled coats (no heavy spots)',
    'Check flashing between coats and eliminate as needed',
    'Minimize orange peel through gun settings and technique',
    'Respect cure time between coats before next application',
    'Measure approximate finish thickness (multi-coat build)',
    'Visually inspect surface reflection consistency',
  ],

  // 6.6 Full de-gassing of chemicals
  exteriorArtFinish_6: [
    'Place shell in dust-controlled area for final cure',
    'Observe finish for shrink-back or witness lines during cure',
    'Respect manufacturer’s full de-gassing / off-gassing time',
    'Confirm finish is fully hardened before level sanding',
  ],

  // 6.7 Final sanding
  exteriorArtFinish_7: [
    'Level sand to remove minor orange peel and dust nibs',
    'Avoid sanding through veneer or color coats',
    'Inspect surface under raking light for flatness and defects',
  ],

  // 6.8 Polishing
  exteriorArtFinish_8: [
    'Buff shell to final gloss or satin sheen',
    'Check reflections for waves or swirl marks',
    'Clean compound residue from edges and hardware zones',
  ],

  /* ----------------------------------------------------------
   * 7. Edges & Snare Beds
   * -------------------------------------------------------- */

  // 7.1 Bearing edges
  edgesSnareBeds_1: [
    'Balance inner and outer edge profiles',
    'Confirm 45° cutting surface with intended roundover',
    'Inspect for chatter marks or tool marks',
    'Measure edge height relative to shell',
    'Inspect contact point profile around full circle',
    'Evaluate cutting surface smoothness',
  ],

  // 7.2 Snare beds
  edgesSnareBeds_2: [
    'Confirm left / right bed symmetry',
    'Check smooth transitions into and out of snare beds',
    'Measure bed depth',
    'Measure bed width',
    'Measure bed taper / ramp profile',
  ],

  /* ----------------------------------------------------------
   * 8. Hardware & Assembly
   * -------------------------------------------------------- */

  // 8.1 Hardware + head assembly
  hardwareAssembly_1: [
    'Install all lugs with correct hardware',
    'Install throw-off at correct height and angle',
    'Install butt plate aligned with throw-off',
    'Install vent grommet',
    'Verify all components sit flush and solid',
    'Install hoops and heads with correct orientation',
    'Install snare wires and confirm center alignment',
    'Confirm no rattles or loose components',
    'Check snare throw action for smooth travel',
    'Verify even head seating all around',
    'Check lug alignment relative to hoops',
    'Confirm shell-to-hoop parallelism',
    'Confirm adequate tension rod travel and feel',
    'Verify snare throw alignment with beds and wires',
  ],

  /* ----------------------------------------------------------
   * 9. Legacy Tuning & Media
   * -------------------------------------------------------- */

  // 9.1 Legacy resonance analysis
  legacyTuningMedia_1: [
    'Capture fundamental pitch (3-hit average)',
    'Identify low sweet spot',
    'Identify Legacy sweet spot',
    'Identify high sweet spot',
    'Note harmonic multiples',
    'Evaluate overtone suppression / control score',
  ],

  // 9.2 Legacy tuning
  legacyTuningMedia_2: [
    'Evaluate sustain at various tunings',
    'Check overtones across the tuning range',
    'Test dynamic response from soft to loud',
    'Measure Hz at each lug (where applicable)',
    'Define target LegacyPrint window',
    'Document adjacent-low tuning reference',
    'Document adjacent-high tuning reference',
  ],

  // 9.3 Professional photos
  legacyTuningMedia_3: [
    'Capture hero shot',
    'Capture left-angle shot',
    'Capture right-angle shot',
    'Capture top-down hoop shot',
    'Capture close-up badge shot',
    'Capture texture macro shot',
    'Capture 360 vertical standing series',
    'Capture 360 flat / horizontal series',
  ],

  // 9.4 Studio Legacy audio
  legacyTuningMedia_4: [
    'Record loose tuning examples',
    'Record medium tuning examples',
    'Record tight tuning examples',
    'Record adjacent-high tuning example',
    'Record cross-stick samples',
    'Record ghost-note swells and dynamic phrases',
  ],

  /* ----------------------------------------------------------
   * 10. Final QA, Packaging & Delivery
   * -------------------------------------------------------- */

  // 10.1 NTAG authentication
  finalQAPackagingDelivery_1: [
    'Capture NFC chip UID',
    'Create or update Firestore entry for tag',
    'Link tag record to correct project',
    'Verify Legacy page URL is correctly linked',
    'Test scan on iPhone',
    'Test scan on Android',
  ],

  // 10.2 Final cleaning
  finalQAPackagingDelivery_2: [
    'Remove fingerprints and smudges from shell and hardware',
    'Polish hoops and hardware to final shine',
    'Confirm snare wire alignment and tension range',
    'Inspect shell under studio light for finish defects',
    'Perform final structural check (shell, edges, hardware)',
    'Perform final sound check and Vault verification',
  ],

  // 10.3 Packaging
  finalQAPackagingDelivery_3: [
    'Apply inner wrap / protective layer to drum',
    'Add moisture barrier as needed',
    'Add cushioning around shell, hoops, and hardware',
    'Insert folder with personalized thank-you letter',
    'Insert folder with Legacy tuning analysis',
    'Insert folder with care instructions',
    'Insert folder with branding tag or collateral',
    'Apply external box branding',
    'Apply shipping label, insurance, and signature required',
  ],

  // 10.4 Delivery confirmation
  finalQAPackagingDelivery_4: [
    'Confirm tracking number is active and correct',
    'Notify customer with tracking details',
    'Schedule day-after-arrival check-in',
    'Schedule reveal date or follow-up session if desired',
  ],
};

const StepComponentTemplate = ({
  stepKey,
  stepLabel,
  stepData = { checklist: [] },
  onToggleChecklist,              // (index, completed, totalSeconds)
  onUpdateCheckpointStates,       // (itemIndex, checkpointStatesArray)
  isLocked = false,
  activeIndex = null,
  showCheckbox = false,           // kept for compatibility
}) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [presetSeconds, setPresetSeconds] = useState(0);

  // UI-only: checkpoint checkmarks per sub-step
  // { [itemId]: { [idx]: bool } }
  const [checkpointState, setCheckpointState] = useState({});

  const items = stepData.checklist || [];

  const activeIdx =
    activeIndex !== null && activeIndex >= 0 && activeIndex < items.length
      ? activeIndex
      : 0;

  const activeItem = items[activeIdx] || null;

  /* ---------------- Hydrate checkpointState from Firestore ---------------- */

  useEffect(() => {
    const next = {};
    (stepData.checklist || []).forEach((item) => {
      const id = item.id;
      if (!id) return;
      const arr = Array.isArray(item.checkpointStates)
        ? item.checkpointStates
        : [];
      const map = {};
      arr.forEach((val, idx) => {
        if (val) map[idx] = true;
      });
      next[id] = map;
    });
    setCheckpointState(next);
  }, [stepData]);

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
    if (onToggleChecklist) {
      onToggleChecklist(idx, checked, presetSeconds);
    }
    setEditingIndex(null);
  };

  // Figure out which key to use in CHECKPOINTS_BY_ITEM_ID.
  // 1) Try the item.id (best case if it matches your mapping)
  // 2) If that’s missing, fall back to "<stepKey>_<1-based index>"
  let checkpoints = [];
  if (activeItem) {
    const primaryKey = activeItem.id;
    const fallbackKey = `${stepKey}_${activeIdx + 1}`;

    checkpoints =
      CHECKPOINTS_BY_ITEM_ID[primaryKey] ||
      CHECKPOINTS_BY_ITEM_ID[fallbackKey] ||
      [];
  }

  const activeItemId =
    (activeItem && activeItem.id) || `${stepKey}_${activeIdx + 1}`;

  const checkpointsForItem = checkpointState[activeItemId] || {};

  const toggleCheckpoint = (cpIndex) => {
    if (!activeItem) return;

    setCheckpointState((prev) => {
      const forItem = prev[activeItemId] || {};
      const newFlag = !forItem[cpIndex];
      const nextForItem = { ...forItem, [cpIndex]: newFlag };
      const next = {
        ...prev,
        [activeItemId]: nextForItem,
      };

      // Build a dense boolean array for Firestore
      const maxIndex = Math.max(
        cpIndex,
        ...Object.keys(nextForItem).map((k) => Number(k))
      );
      const arr = Array.from({ length: maxIndex + 1 }, (_, i) => !!nextForItem[i]);

      if (onUpdateCheckpointStates) {
        onUpdateCheckpointStates(activeIdx, arr);
      }

      return next;
    });
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
  const checked = !!activeItem.completed;

  return (
    <div className="mpm-step-detail">
      {/* Sub-step header */}
      <h2 className="mpm-step-title">{stepLabel}</h2>

      {/* total time for this sub-step */}
      <div className="mpm-step-total">
        Total Time: <span>{fmtHM(totalTime)}</span>
      </div>

      {/* ---- Time tracking + status ---- */}
      <section
        className={`mpm-step-time ${isLocked ? 'mpm-step-disabled' : ''}`}
      >
        <div className="mpm-step-time-header">
          <div className="mpm-step-time-label">Time Tracking</div>

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
                  onToggleChecklist &&
                  onToggleChecklist(activeIdx, checked, 0)
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

        {/* Main “completed” toggle for this checklist item */}
        <div className="mpm-step-status-row">
          <label className="mpm-step-status-label">
            <input
              type="checkbox"
              disabled={isLocked}
              checked={checked}
              onChange={(e) => {
                const newCompleted = e.target.checked;
                if (onToggleChecklist) {
                  onToggleChecklist(
                    activeIdx,
                    newCompleted,
                    activeItem.totalSeconds || 0
                  );
                }
              }}
            />
            <span>Mark this sub-step as complete</span>
          </label>
        </div>
      </section>

      {/* ---- Checkpoints & Measurements ---- */}
      <section className="mpm-step-checkpoints">
        <h3 className="mpm-step-checkpoints-title">
          Checkpoints &amp; Measurement Points
        </h3>

        {checkpoints.length === 0 ? (
          <p className="mpm-step-empty">
            No detailed checkpoints defined for this sub-step yet.
          </p>
        ) : (
          <div className="mpm-check-grid">
            {checkpoints.map((text, idx) => (
              <label key={idx} className="mpm-check-row">
                <input
                  type="checkbox"
                  checked={!!checkpointsForItem[idx]}
                  onChange={() => toggleCheckpoint(idx)}
                />
                <span className="mpm-check-text">{text}</span>
              </label>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default StepComponentTemplate;