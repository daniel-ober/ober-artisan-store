// src/utils/projectStages.js

/**
 * PROJECT_STAGE_DEFINITION
 *
 * This is the master definition for project lifecycle:
 * - stages      (Discovery & Design, Commitment & Portal Setup, etc.)
 * - steps       (Initial consultation, Build proposal, etc.)
 * - checkpoints (granular tasks craftsmen complete)
 *
 * Firestore should store only progress (completed flags, timestamps)
 * keyed by these IDs. The text lives here as the single source of truth.
 */

export const PROJECT_STAGE_DEFINITION = [
  /* =========================
   * Stage 1: Discovery & Design
   * ========================= */
  {
    id: 'discoveryDesign',
    label: 'Discovery & Design',
    steps: [
      {
        id: 'initialConsultation',
        label: 'Initial consultation',
        checkpoints: [
          {
            id: 'captureDrummerGoals',
            label:
              'Capture drummer goals (genres, feel, tonal preferences)',
          },
          {
            id: 'captureErgonomicConsiderations',
            label:
              'Capture ergonomic considerations (arthritis, hand fatigue, stick choice)',
          },
          {
            id: 'confirmDrumSizePreference',
            label: 'Confirm drum size preference (diameter / depth)',
          },
          {
            id: 'confirmVisualToneDirection',
            label: 'Confirm visual tone / finish direction',
          },
          {
            id: 'determineTuningGoalsLegacyPrint',
            label: 'Determine tuning goals (LegacyPrint window)',
          },
          {
            id: 'confirmBudgetAndTimeline',
            label: 'Confirm budget & timeline',
          },
        ],
      },
      {
        id: 'buildProposal',
        label: 'Build proposal',
        checkpoints: [
          {
            id: 'generateFullWrittenSpec',
            label: 'Generate full written build spec',
          },
          {
            id: 'selectPrimaryWoodSpecies',
            label: 'Select primary wood species',
          },
          {
            id: 'selectSecondarySpeciesIfHybrid',
            label: 'Select secondary species if hybrid',
          },
          {
            id: 'determineStaveCount',
            label: 'Determine stave count',
          },
          {
            id: 'determineShellThicknessTarget',
            label: 'Determine shell thickness target',
          },
          {
            id: 'determineVeneerChoice',
            label: 'Determine veneer choice',
          },
          {
            id: 'determineHardwareFinish',
            label: 'Determine hardware finish (chrome / black nickel / brass)',
          },
          {
            id: 'determineLugStyle',
            label: 'Determine lug style (vintage tube)',
          },
          {
            id: 'confirmDiecastHoops',
            label: 'Confirm hoop type is diecast',
          },
          {
            id: 'determineBearingEdgeProfile',
            label: 'Determine bearing edge profile',
          },
          {
            id: 'determineSnareBedStyle',
            label: 'Determine snare bed style',
          },
          {
            id: 'generateMockupPreviews',
            label: 'Generate mockup previews (if applicable)',
          },
        ],
      },
      {
        id: 'earlyMockups',
        label: 'Early mockups',
        checkpoints: [
          {
            id: 'createFirstRoundVisualMockups',
            label:
              'Create first-round visual mockups (finish / veneer / hardware)',
          },
          {
            id: 'exploreFinishConcepts',
            label:
              'Explore 2–3 finish concepts with different accents',
          },
          {
            id: 'mockBadgePlacementAndLogos',
            label:
              'Mock up badge placement and logo treatments',
          },
          {
            id: 'prepareOptionWriteups',
            label:
              'Prepare quick write-up explaining each option',
          },
          {
            id: 'shareMockupsForFeedback',
            label:
              'Share mockups with customer for feedback',
          },
          {
            id: 'captureRevisionNotesChosenDirection',
            label:
              'Capture revision notes for chosen direction',
          },
        ],
      },
    ],
  },

  /* =========================
   * Stage 2: Commitment & Portal Setup
   * ========================= */
  {
    id: 'commitmentPortalSetup',
    label: 'Commitment & Portal Setup',
    steps: [
      {
        id: 'paymentProcessing',
        label: 'Payment processing',
        checkpoints: [
          {
            id: 'invoiceSentToCustomer',
            label: 'Payment link sent to customer',
          },
          {
            id: 'depositReceivedOrPaymentConfirmed',
            label: 'Deposit received / payment confirmed',
          },
          {
            id: 'orderStatusUpdatedToInProgress',
            label: 'Order status updated to “In Progress”',
          },
        ],
      },
      {
        id: 'portalAccessSetup',
        label: 'Portal access setup',
        checkpoints: [
          {
            id: 'createCustomerPortalRecord',
            label: 'Create customer portal record',
          },
          {
            id: 'linkProjectToSoundlegendDashboard',
            label: 'Link project to SoundLegend dashboard',
          },
          {
            id: 'sendWelcomeEmailWithPortalLink',
            label: 'Send welcome email with portal link',
          },
          {
            id: 'confirmCustomerCanLogin',
            label: 'Confirm customer can log in successfully',
          },
        ],
      },
    ],
  },

  /* =========================
   * Stage 3: Wood & Vision Lock-In
   * ========================= */
  {
    id: 'woodVisionLockIn',
    label: 'Wood & Vision Lock-In',
    steps: [
      {
        id: 'woodSelection',
        label: 'Wood selection',
        checkpoints: [
          {
            id: 'selectRawBoardsForShell',
            label: 'Select raw boards for shell',
          },
          {
            id: 'checkMoistureContent',
            label: 'Check moisture content (MC% reading)',
          },
          {
            id: 'verifyGrainDirection',
            label:
              'Verify grain direction for musicality and strength',
          },
          {
            id: 'inspectKnotsForResinOpportunities',
            label:
              'Inspect knots and natural stress lines for resin fill opportunities',
          },
          {
            id: 'estimatePreCutLengthForBoards',
            label: 'Estimate pre-cut length for each board',
          },
          {
            id: 'optionallyReviewWoodWithCustomer',
            label:
              'Optionally review and approve wood set with customer',
          },
          {
            id: 'recordBoardLength',
            label: 'Record board length',
          },
          {
            id: 'recordBoardWidth',
            label: 'Record board width',
          },
          {
            id: 'recordBoardThickness',
            label: 'Record board thickness',
          },
          {
            id: 'recordMoistureReadingPercent',
            label: 'Record moisture reading (%)',
          },
        ],
      },
      {
        id: 'preBuildMeasuringAndPrep',
        label: 'Pre-build measuring & prep',
        checkpoints: [
          {
            id: 'veneerIntegrationTest',
            label:
              'Veneer integration test (visual + adhesion plan)',
          },
          {
            id: 'shellColorTestNaturalLight',
            label: 'Shell color test under natural light',
          },
          {
            id: 'shellColorTestStudioLight',
            label:
              'Shell color test with flash / studio light',
          },
          {
            id: 'acrylicColorSwatchReview',
            label:
              'Acrylic color swatch review against veneer',
          },
          {
            id: 'badgePlacementTest',
            label:
              'Logo badge placement test (mock or tape-on)',
          },
          {
            id: 'sendMockupsAndVisualsToCustomer',
            label: 'Send mockups / visuals to customer',
          },
        ],
      },
    ],
  },

  /* =========================
   * Stage 4: Raw Shell Creation
   * ========================= */
  {
    id: 'rawShellCreation',
    label: 'Raw Shell Creation',
    steps: [
      {
        id: 'cutStaveBevels',
        label: 'Cut stave bevels',
        checkpoints: [
          {
            id: 'confirmGrainOrientationEachStave',
            label:
              'Confirm grain orientation for each stave block',
          },
          {
            id: 'ensureUniformStaveDimensions',
            label:
              'Ensure all staves are uniform in dimension',
          },
          {
            id: 'inspectBlocksForDefects',
            label:
              'Inspect each block for defects, cracks, or voids',
          },
          {
            id: 'measureBlockLength',
            label: 'Measure block length',
          },
          {
            id: 'measureBlockWidth',
            label: 'Measure block width',
          },
          {
            id: 'measureBlockThickness',
            label: 'Measure block thickness',
          },
        ],
      },
      {
        id: 'preGlueTestDryFit',
        label: 'Pre-glue test (dry-fit)',
        checkpoints: [
          {
            id: 'inspectTearOutAfterBevelCuts',
            label:
              'Inspect for tear-out after bevel cuts',
          },
          {
            id: 'testFitStavesForMatingJoints',
            label:
              'Test fit two or more staves for perfect mating joints',
          },
          {
            id: 'measureBevelAngleAccuracy',
            label:
              'Measure bevel angle accuracy (e.g., 9° or 10°)',
          },
          {
            id: 'compareInnerOuterFaceWidths',
            label:
              'Compare width of inner vs outer face to expected values',
          },
        ],
      },
      {
        id: 'glueUpAndClamping',
        label: 'Glue-up & clamping',
        checkpoints: [
          {
            id: 'performFullDryFitCircleTest',
            label: 'Perform full dry-fit circle test',
          },
          {
            id: 'checkGapsBetweenStaves',
            label:
              'Check gaps between staves visually and by feel',
          },
          {
            id: 'checkRoundnessVarianceClamp',
            label:
              'Check roundness variance with calipers or jig',
          },
          {
            id: 'measureOutOfRound',
            label:
              'Measure out-of-round (target ±0.03")',
          },
          {
            id: 'evaluateJointTightness',
            label:
              'Evaluate joint tightness at multiple points',
          },
        ],
      },
      {
        id: 'glueCuring',
        label: 'Glue curing',
        checkpoints: [
          {
            id: 'confirmMinimumCureTimeMet',
            label: 'Confirm minimum cure time has been met',
          },
          {
            id: 'removeShellFromClamps',
            label: 'Remove shell from clamps carefully',
          },
          {
            id: 'inspectAllGlueJoints',
            label:
              'Perform visual inspection of all glue joints',
          },
        ],
      },
      {
        id: 'exteriorMillingSetup',
        label: 'Exterior milling setup',
        checkpoints: [
          {
            id: 'verifyExteriorSledAlignment',
            label:
              'Verify exterior milling sled or lathe jig is square and secure',
          },
          {
            id: 'confirmShellCenteredInJig',
            label:
              'Confirm shell is centered in jig with even overhang',
          },
          {
            id: 'setExteriorCutterHeight',
            label:
              'Set cutter/router bit height for safe first pass',
          },
          {
            id: 'runLightTestPass',
            label:
              'Run a light test pass to check for chatter or vibration',
          },
        ],
      },
      {
        id: 'millExteriorDiameter',
        label: 'Mill exterior diameter',
        checkpoints: [
          {
            id: 'takeMultipleShallowPasses',
            label:
              'Take multiple shallow passes to reach target diameter',
          },
          {
            id: 'checkDiameterPositions',
            label:
              'Check diameter at 12 / 3 / 6 / 9 o’clock positions',
          },
          {
            id: 'confirmRoundnessWithinSpec',
            label:
              'Confirm roundness tolerance is within spec',
          },
          {
            id: 'inspectExteriorSurfaceForToolMarks',
            label:
              'Inspect exterior surface for tool marks or tear-out',
          },
        ],
      },
      {
        id: 'outerBevelReinforcement',
        label: 'Outer bevel reinforcement',
        checkpoints: [
          {
            id: 'applyThinCaOrEpoxyOuterBevel',
            label:
              'Apply thin CA or epoxy to outer bevel region',
          },
          {
            id: 'confirmAdhesiveWickEvenly',
            label:
              'Confirm adhesive wicks evenly along all joints',
          },
          {
            id: 'sandBackOuterBevelReinforcement',
            label:
              'Sand back reinforcement to a clean, smooth surface',
          },
          {
            id: 'recheckForMicroGapsCracks',
            label:
              'Re-check for micro gaps or hairline cracks',
          },
        ],
      },
    ],
  },

  /* =========================
   * Stage 5: Shell Trueing & Torch Tune
   * ========================= */
  {
    id: 'shellTrueingTorchTune',
    label: 'Shell Trueing & Torch Tune',
    steps: [
      {
        id: 'sandingPrepVeneerAndInterior',
        label: 'Sanding prep (for veneer + interior)',
        checkpoints: [
          {
            id: 'performExteriorPrep80To120',
            label:
              'Perform 80–120 grit exterior prep',
          },
          {
            id: 'removeExteriorHighSpots',
            label:
              'Remove high spots or ridges on exterior',
          },
          {
            id: 'confirmShellReadyForInterior',
            label:
              'Ensure shell is ready for interior jig / next process',
          },
          {
            id: 'performInteriorSmoothing120To220',
            label:
              'Perform 120–220 grit interior smoothing',
          },
          {
            id: 'microInspectInteriorJoints',
            label:
              'Micro-inspect all joints on interior surface',
          },
          {
            id: 'confirmShellReadyForTorchingVeneer',
            label:
              'Confirm shell is ready for torching and veneer',
          },
        ],
      },
      {
        id: 'interiorMillingSetup',
        label: 'Interior milling setup',
        checkpoints: [
          {
            id: 'verifyInteriorSledAlignment',
            label:
              'Verify interior sled / jig alignment',
          },
          {
            id: 'setInteriorCutterHeightDepth',
            label:
              'Set interior cutter height and depth of cut',
          },
          {
            id: 'indexShellCorrectlyOnInteriorJig',
            label:
              'Index shell correctly on interior jig',
          },
        ],
      },
      {
        id: 'millInteriorThickness',
        label: 'Mill interior thickness',
        checkpoints: [
          {
            id: 'inspectExteriorSmoothnessAfterInteriorPasses',
            label:
              'Inspect shell exterior for smoothness after passes',
          },
          {
            id: 'confirmGlueLinesExposedVisible',
            label:
              'Confirm glue lines are exposed and visible',
          },
          {
            id: 'measureFinalExteriorDiameter',
            label:
              'Measure final exterior diameter (e.g., 14.000")',
          },
          {
            id: 'checkRoundnessAccuracy',
            label:
              'Check roundness accuracy with calipers / jig',
          },
          {
            id: 'measureOuterWallThicknessPoints',
            label:
              'Measure outer wall thickness at multiple points',
          },
        ],
      },
      {
        id: 'innerBevelReinforcement',
        label: 'Inner bevel reinforcement',
        checkpoints: [
          {
            id: 'inspectInteriorSurfaceSmoothness',
            label:
              'Inspect interior surface for smoothness',
          },
          {
            id: 'confirmNoInteriorTearOut',
            label:
              'Confirm no significant tear-out on interior',
          },
          {
            id: 'measureInteriorDiameter',
            label: 'Measure interior diameter',
          },
          {
            id: 'measureFinalShellThicknessTop',
            label:
              'Measure final shell thickness at top',
          },
          {
            id: 'measureFinalShellThicknessMid',
            label:
              'Measure final shell thickness at mid-shell',
          },
          {
            id: 'measureFinalShellThicknessBottom',
            label:
              'Measure final shell thickness at bottom',
          },
          {
            id: 'checkInnerRoundnessVariance',
            label:
              'Check inner roundness variance',
          },
        ],
      },
      {
        id: 'sandingPrepInterior',
        label: 'Sanding prep (interior)',
        checkpoints: [
          {
            id: 'applyThinCaOuterBevelRegion',
            label:
              'Apply thin CA glue to outer bevel region',
          },
          {
            id: 'inspectCaPenetrationOuterJoints',
            label:
              'Inspect penetration of CA along joints',
          },
          {
            id: 'sandBackOuterBevelSmooth',
            label:
              'Sand back outer bevel to clean, smooth surface',
          },
          {
            id: 'applyThinCaInnerBevelRegion',
            label:
              'Apply thin CA glue to inner bevel region',
          },
          {
            id: 'confirmEvenCaPenetrationInnerJoints',
            label:
              'Confirm even penetration along inner joints',
          },
          {
            id: 'sandBackInnerBevelSmooth',
            label:
              'Sand back inner bevel smooth after cure',
          },
        ],
      },
      {
        id: 'originalTorchTuneProcess',
        label: 'Original torch tune process',
        checkpoints: [
          {
            id: 'ensureEvenFlamePattern',
            label:
              'Ensure flame pattern is even around shell',
          },
          {
            id: 'verifyGrainPopWithoutOverburning',
            label:
              'Verify grain “pop” without overburning',
          },
          {
            id: 'confirmNoBurnThroughOrDamage',
            label:
              'Confirm no burn-through or structural damage',
          },
        ],
      },
    ],
  },

  /* =========================
   * Stage 6: Exterior Art & Finish
   * ========================= */
  {
    id: 'exteriorArtAndFinish',
    label: 'Exterior Art & Finish',
    steps: [
      {
        id: 'veneerApplication',
        label: 'Veneer application',
        checkpoints: [
          {
            id: 'verifyContactCementCoverage',
            label:
              'Verify contact cement coverage on shell and veneer',
          },
          {
            id: 'rollVeneerWithEvenPressure',
            label:
              'Roll veneer onto shell with even pressure',
          },
          {
            id: 'checkForBubblesOrTrappedAir',
            label:
              'Check for bubbles or trapped air',
          },
          {
            id: 'confirmSeamTightInvisible',
            label:
              'Confirm seam is tight and effectively invisible',
          },
          {
            id: 'measureVeneerThickness',
            label: 'Measure veneer thickness',
          },
          {
            id: 'confirmVeneerSeamAlignmentPlan',
            label:
              'Confirm veneer seam alignment to design plan',
          },
          {
            id: 'observeVeneerCreepOrSlippage',
            label:
              'Observe any veneer creep or slippage after set time',
          },
        ],
      },
      {
        id: 'underSprayAestheticWork',
        label: 'Under-spray aesthetic work',
        checkpoints: [
          {
            id: 'placeAcrylicFillsInStressLines',
            label:
              'Place acrylic fills in natural stress lines (not random streaks)',
          },
          {
            id: 'balanceTorchAccentsWithDesign',
            label:
              'Balance torch accents with overall design',
          },
          {
            id: 'confirmCaInjectionsLevelClear',
            label:
              'Confirm CA injections are level and clear',
          },
          {
            id: 'sandShellTo320To400',
            label:
              'Sand shell to 320–400 grit before finish',
          },
        ],
      },
      {
        id: 'preFinishFullShellInspection',
        label: 'Pre-finish full shell inspection',
        checkpoints: [
          {
            id: 'verifyShellPerfectlySmooth',
            label:
              'Verify shell is perfectly smooth to the touch',
          },
          {
            id: 'confirmNoVeneerOverhangEdges',
            label:
              'Confirm no veneer overhang at edges',
          },
          {
            id: 'removeSurfaceDustAndDebris',
            label:
              'Remove all surface dust and debris',
          },
          {
            id: 'maskEdgesBeforeSpray',
            label:
              'Mask edges as needed before spray',
          },
        ],
      },
      {
        id: 'badgeAndLogoWork',
        label: 'Badge + logo work',
        checkpoints: [
          {
            id: 'alignOuterBadgeCorrectPosition',
            label:
              'Align outer badge at correct vertical and rotational position',
          },
          {
            id: 'placeInnerBadgeCorrectLocation',
            label:
              'Place inner badge in correct location',
          },
          {
            id: 'confirmBadgeAdhesivesSet',
            label:
              'Confirm adhesives or fasteners have set properly',
          },
        ],
      },
      {
        id: 'sprayFinishing',
        label: 'Spray finishing',
        checkpoints: [
          {
            id: 'sprayEvenControlledCoats',
            label:
              'Spray even, controlled coats (no heavy spots)',
          },
          {
            id: 'checkFlashingBetweenCoats',
            label:
              'Check flashing between coats and eliminate as needed',
          },
          {
            id: 'minimizeOrangePeel',
            label:
              'Minimize orange peel through gun settings and technique',
          },
          {
            id: 'respectCureTimeBetweenCoats',
            label:
              'Respect cure time between coats before next application',
          },
          {
            id: 'measureFinishThickness',
            label:
              'Measure approximate finish thickness (multi-coat build)',
          },
          {
            id: 'inspectSurfaceReflectionConsistency',
            label:
              'Visually inspect surface reflection consistency',
          },
        ],
      },
      {
        id: 'fullDegassingOfChemicals',
        label: 'Full de-gassing of chemicals',
        checkpoints: [
          {
            id: 'placeShellInDustControlledArea',
            label:
              'Place shell in dust-controlled area for final cure',
          },
          {
            id: 'observeFinishForShrinkBack',
            label:
              'Observe finish for shrink-back or witness lines during cure',
          },
          {
            id: 'respectFullDegassingTime',
            label:
              'Respect manufacturer’s full de-gassing / off-gassing time',
          },
          {
            id: 'confirmFinishFullyHardened',
            label:
              'Confirm finish is fully hardened before level sanding',
          },
        ],
      },
      {
        id: 'finalSanding',
        label: 'Final sanding',
        checkpoints: [
          {
            id: 'levelSandToRemoveOrangePeel',
            label:
              'Level sand to remove minor orange peel and dust nibs',
          },
          {
            id: 'avoidSandingThroughVeneer',
            label:
              'Avoid sanding through veneer or color coats',
          },
          {
            id: 'inspectSurfaceUnderRakingLight',
            label:
              'Inspect surface under raking light for flatness and defects',
          },
        ],
      },
      {
        id: 'polishing',
        label: 'Polishing',
        checkpoints: [
          {
            id: 'buffShellToFinalSheen',
            label:
              'Buff shell to final gloss or satin sheen',
          },
          {
            id: 'checkReflectionsForWavesOrSwirl',
            label:
              'Check reflections for waves or swirl marks',
          },
          {
            id: 'cleanCompoundResidue',
            label:
              'Clean compound residue from edges and hardware zones',
          },
        ],
      },
    ],
  },

  /* =========================
   * Stage 7: Edges & Snare Beds
   * ========================= */
  {
    id: 'edgesAndSnareBeds',
    label: 'Edges & Snare Beds',
    steps: [
      {
        id: 'bearingEdges',
        label: 'Bearing edges',
        checkpoints: [
          {
            id: 'balanceInnerOuterEdgeProfiles',
            label:
              'Balance inner and outer edge profiles',
          },
          {
            id: 'confirm45DegreeCuttingSurface',
            label:
              'Confirm 45° cutting surface with intended roundover',
          },
          {
            id: 'inspectForChatterOrToolMarks',
            label:
              'Inspect for chatter marks or tool marks',
          },
          {
            id: 'measureEdgeHeightRelativeToShell',
            label:
              'Measure edge height relative to shell',
          },
          {
            id: 'inspectContactPointProfile',
            label:
              'Inspect contact point profile around full circle',
          },
          {
            id: 'evaluateCuttingSurfaceSmoothness',
            label:
              'Evaluate cutting surface smoothness',
          },
        ],
      },
      {
        id: 'snareBeds',
        label: 'Snare beds',
        checkpoints: [
          {
            id: 'confirmBedSymmetry',
            label:
              'Confirm left / right bed symmetry',
          },
          {
            id: 'checkBedTransitionSmoothness',
            label:
              'Check smooth transitions into and out of snare beds',
          },
          {
            id: 'measureBedDepth',
            label: 'Measure bed depth',
          },
          {
            id: 'measureBedWidth',
            label: 'Measure bed width',
          },
          {
            id: 'measureBedTaperProfile',
            label:
              'Measure bed taper / ramp profile',
          },
        ],
      },
    ],
  },

  /* =========================
   * Stage 8: Hardware & Assembly
   * ========================= */
  {
    id: 'hardwareAndAssembly',
    label: 'Hardware & Assembly',
    steps: [
      {
        id: 'hardwareAndHeadAssembly',
        label: 'Hardware + head assembly',
        checkpoints: [
          {
            id: 'installAllLugsWithCorrectHardware',
            label:
              'Install all lugs with correct hardware',
          },
          {
            id: 'installThrowOffCorrectHeightAngle',
            label:
              'Install throw-off at correct height and angle',
          },
          {
            id: 'installButtPlateAlignedWithThrowOff',
            label:
              'Install butt plate aligned with throw-off',
          },
          {
            id: 'installVentGrommet',
            label: 'Install vent grommet',
          },
          {
            id: 'verifyComponentsSitFlush',
            label:
              'Verify all components sit flush and solid',
          },
          {
            id: 'installHoopsAndHeads',
            label:
              'Install hoops and heads with correct orientation',
          },
          {
            id: 'installSnareWiresCentered',
            label:
              'Install snare wires and confirm center alignment',
          },
          {
            id: 'confirmNoRattlesOrLooseComponents',
            label:
              'Confirm no rattles or loose components',
          },
          {
            id: 'checkSnareThrowActionSmooth',
            label:
              'Check snare throw action for smooth travel',
          },
          {
            id: 'verifyEvenHeadSeating',
            label:
              'Verify even head seating all around',
          },
          {
            id: 'checkLugAlignmentRelativeToHoops',
            label:
              'Check lug alignment relative to hoops',
          },
          {
            id: 'confirmShellHoopParallelism',
            label:
              'Confirm shell-to-hoop parallelism',
          },
          {
            id: 'confirmTensionRodTravelAndFeel',
            label:
              'Confirm adequate tension rod travel and feel',
          },
          {
            id: 'verifySnareThrowAlignmentWithBeds',
            label:
              'Verify snare throw alignment with beds and wires',
          },
        ],
      },
    ],
  },

  /* =========================
   * Stage 9: Legacy Tuning & Media
   * ========================= */
  {
    id: 'legacyTuningAndMedia',
    label: 'Legacy Tuning & Media',
    steps: [
      {
        id: 'legacyResonanceAnalysis',
        label: 'Legacy resonance analysis',
        checkpoints: [
          {
            id: 'captureFundamentalPitch',
            label:
              'Capture fundamental pitch (3-hit average)',
          },
          {
            id: 'identifyLowSweetSpot',
            label: 'Identify low sweet spot',
          },
          {
            id: 'identifyLegacySweetSpot',
            label: 'Identify Legacy sweet spot',
          },
          {
            id: 'identifyHighSweetSpot',
            label: 'Identify high sweet spot',
          },
          {
            id: 'noteHarmonicMultiples',
            label: 'Note harmonic multiples',
          },
          {
            id: 'evaluateOvertoneSuppressionScore',
            label:
              'Evaluate overtone suppression / control score',
          },
        ],
      },
      {
        id: 'legacyTuning',
        label: 'Legacy tuning',
        checkpoints: [
          {
            id: 'evaluateSustainAcrossTunings',
            label:
              'Evaluate sustain at various tunings',
          },
          {
            id: 'checkOvertonesAcrossRange',
            label:
              'Check overtones across the tuning range',
          },
          {
            id: 'testDynamicResponse',
            label:
              'Test dynamic response from soft to loud',
          },
          {
            id: 'measureHzAtEachLug',
            label:
              'Measure Hz at each lug (where applicable)',
          },
          {
            id: 'defineLegacyPrintWindow',
            label:
              'Define target LegacyPrint window',
          },
          {
            id: 'documentAdjacentLowReference',
            label:
              'Document adjacent-low tuning reference',
          },
          {
            id: 'documentAdjacentHighReference',
            label:
              'Document adjacent-high tuning reference',
          },
        ],
      },
      {
        id: 'professionalPhotos',
        label: 'Professional photos',
        checkpoints: [
          {
            id: 'captureHeroShot',
            label: 'Capture hero shot',
          },
          {
            id: 'captureLeftAngleShot',
            label: 'Capture left-angle shot',
          },
          {
            id: 'captureRightAngleShot',
            label: 'Capture right-angle shot',
          },
          {
            id: 'captureTopDownHoopShot',
            label: 'Capture top-down hoop shot',
          },
          {
            id: 'captureCloseUpBadgeShot',
            label: 'Capture close-up badge shot',
          },
          {
            id: 'captureTextureMacroShot',
            label: 'Capture texture macro shot',
          },
          {
            id: 'capture360VerticalSeries',
            label:
              'Capture 360 vertical standing series',
          },
          {
            id: 'capture360HorizontalSeries',
            label:
              'Capture 360 flat / horizontal series',
          },
        ],
      },
      {
        id: 'studioLegacyAudio',
        label: 'Studio Legacy audio',
        checkpoints: [
          {
            id: 'recordLooseTuningExamples',
            label:
              'Record loose tuning examples',
          },
          {
            id: 'recordMediumTuningExamples',
            label:
              'Record medium tuning examples',
          },
          {
            id: 'recordTightTuningExamples',
            label:
              'Record tight tuning examples',
          },
          {
            id: 'recordAdjacentHighTuningExample',
            label:
              'Record adjacent-high tuning example',
          },
          {
            id: 'recordCrossStickSamples',
            label:
              'Record cross-stick samples',
          },
          {
            id: 'recordGhostNoteSwells',
            label:
              'Record ghost-note swells and dynamic phrases',
          },
        ],
      },
    ],
  },

  /* =========================
   * Stage 10: Final QA, Packaging & Delivery
   * ========================= */
  {
    id: 'finalQaPackagingDelivery',
    label: 'Final QA, Packaging & Delivery',
    steps: [
      {
        id: 'ntagAuthentication',
        label: 'NTAG authentication',
        checkpoints: [
          {
            id: 'captureNfcChipUid',
            label: 'Capture NFC chip UID',
          },
          {
            id: 'createOrUpdateFirestoreEntryForTag',
            label:
              'Create or update Firestore entry for tag',
          },
          {
            id: 'linkTagRecordToProject',
            label:
              'Link tag record to correct project',
          },
          {
            id: 'verifyLegacyPageUrlLinked',
            label:
              'Verify Legacy page URL is correctly linked',
          },
          {
            id: 'testScanOnIphone',
            label: 'Test scan on iPhone',
          },
          {
            id: 'testScanOnAndroid',
            label: 'Test scan on Android',
          },
        ],
      },
      {
        id: 'finalCleaning',
        label: 'Final cleaning',
        checkpoints: [
          {
            id: 'removeFingerprintsAndSmudges',
            label:
              'Remove fingerprints and smudges from shell and hardware',
          },
          {
            id: 'polishHoopsAndHardwareFinalShine',
            label:
              'Polish hoops and hardware to final shine',
          },
          {
            id: 'confirmSnareWireAlignmentTensionRange',
            label:
              'Confirm snare wire alignment and tension range',
          },
          {
            id: 'inspectShellUnderStudioLight',
            label:
              'Inspect shell under studio light for finish defects',
          },
          {
            id: 'performFinalStructuralCheck',
            label:
              'Perform final structural check (shell, edges, hardware)',
          },
          {
            id: 'performFinalSoundCheckAndVaultVerification',
            label:
              'Perform final sound check and Vault verification',
          },
        ],
      },
      {
        id: 'packaging',
        label: 'Packaging',
        checkpoints: [
          {
            id: 'applyInnerWrapProtectiveLayer',
            label:
              'Apply inner wrap / protective layer to drum',
          },
          {
            id: 'addMoistureBarrierAsNeeded',
            label:
              'Add moisture barrier as needed',
          },
          {
            id: 'addCushioningAroundShellHoopsHardware',
            label:
              'Add cushioning around shell, hoops, and hardware',
          },
          {
            id: 'insertFolderThankYouLetter',
            label:
              'Insert folder with personalized thank-you letter',
          },
          {
            id: 'insertFolderLegacyTuningAnalysis',
            label:
              'Insert folder with Legacy tuning analysis',
          },
          {
            id: 'insertFolderCareInstructions',
            label:
              'Insert folder with care instructions',
          },
          {
            id: 'insertFolderBrandingCollateral',
            label:
              'Insert folder with branding tag or collateral',
          },
          {
            id: 'applyExternalBoxBranding',
            label:
              'Apply external box branding',
          },
          {
            id: 'applyShippingLabelInsuranceSignature',
            label:
              'Apply shipping label, insurance, and signature required',
          },
        ],
      },
      {
        id: 'deliveryConfirmation',
        label: 'Delivery confirmation',
        checkpoints: [
          {
            id: 'scheduleRevealOrFollowUpSession',
            label:
              'Schedule reveal date or follow-up session if desired',
          },
        ],
      },
    ],
  },
];


/**
 * buildEmptyLifecycle
 *
 * Creates a blank lifecycle object for a new project,
 * based on PROJECT_STAGE_DEFINITION.
 *
 * Shape:
 * {
 *   completed: false,
 *   completedAt: null,
 *   stages: {
 *     [stageId]: {
 *       completed: false,
 *       completedAt: null,
 *       steps: {
 *         [stepId]: {
 *           completed: false,
 *           completedAt: null,
 *           checkpoints: {
 *             [checkpointId]: {
 *               completed: false,
 *               completedAt: null,
 *             }
 *           }
 *         }
 *       }
 *     }
 *   }
 * }
 */
export const buildEmptyLifecycle = () => {
  const stages = {};

  PROJECT_STAGE_DEFINITION.forEach((stage) => {
    const stepsMap = {};

    stage.steps.forEach((step) => {
      const checkpointsMap = {};

      step.checkpoints.forEach((checkpoint) => {
        checkpointsMap[checkpoint.id] = {
          completed: false,
          completedAt: null, // Firestore Timestamp or null
        };
      });

      stepsMap[step.id] = {
        completed: false,
        completedAt: null,
        checkpoints: checkpointsMap,
      };
    });

    stages[stage.id] = {
      completed: false,
      completedAt: null,
      steps: stepsMap,
    };
  });

  return {
    completed: false,
    completedAt: null,
    stages,
  };
};