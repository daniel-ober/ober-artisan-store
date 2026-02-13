const make = (id, label) => ({
  id,
  label,
  task: label,
  completed: false,
  totalSeconds: 0,
  checkpointStates: []
});

const defaultStepData = {

  discoveryDesign: {
    checklist: [
      make("initial_consultation", "Initial consultation"),
      make("build_proposal", "Build proposal")
    ]
  },

  commitmentPortal: {
    checklist: [
      make("deposit_paid", "Deposit received"),
      make("portal_created", "Customer portal created"),
    ]
  },

  woodVisionLockIn: {
    checklist: [
      make("wood_selected", "Select wood"),
      make("moisture_check", "Check moisture content"),
      make("stave_layout", "Bookmatch and orient stave layout"),
      make("pre_glue_test", "Pre-glue test assembly")
    ]
  },

  rawShellCreation: {
    checklist: [
      make("glue_and_clamp", "Glue and clamp"),
      make("joint_stability", "Check joint stability"),
      make("mill_exterior", "Mill exterior to diameter"),
      make("mill_interior", "Mill interior to shell thickness")
    ]
  },

  shellTrueingTorchTune: {
    checklist: [
      make("roundness_check", "Check roundness tolerance"),
      make("wall_uniformity", "Verify wall uniformity"),
      make("torch_tuning", "Complete torch tuning process"),
      make("moisture_recheck", "Moisture re-check")
    ]
  },

  exteriorArtFinish: {
    checklist: [
      make("veneer_selection", "Veneer selection"),
      make("apply_veneer", "Apply veneer"),
      make("torch_veneer", "Torch tune veneer"),
      make("apply_finish", "Apply acrylic / stain / finish"),
      make("poly_coats", "Apply poly coats"),
      make("badge_install", "Install badges / logos")
    ]
  },

  edgesSnareBeds: {
    checklist: [
      make("edge_spec", "Confirm bearing edge spec"),
      make("route_edges", "Route bearing edges"),
      make("sand_edges", "Hand sand edges"),
      make("snare_bed_cut", "Cut snare beds")
    ]
  },

  hardwareAssembly: {
    checklist: [
      make("layout_hardware", "Layout hardware"),
      make("drill_shell", "Drill hardware holes"),
      make("install_hardware", "Install lugs / throw / butt"),
      make("torque_check", "Torque hardware"),
      make("photo_shell", "Photograph shell before heads")
    ]
  },

  legacyTuningMedia: {
    checklist: [
      make("seat_heads", "Seat heads and tune"),
      make("snare_wire", "Adjust snare wires"),
      make("play_test", "Play test drum"),
      make("record_media", "Record audio/video samples"),
      make("fft_analysis", "Run FFT analysis")
    ]
  },

  finalQAPackagingDelivery: {
    checklist: [
      make("final_inspection", "Final shell inspection"),
      make("hardware_check", "Inspect hardware"),
      make("polish", "Hand polish drum"),
      make("final_photos", "Photograph finished drum"),
      make("package", "Package drum"),
      make("ship", "Ship drum")
    ]
  }

};

export default defaultStepData;