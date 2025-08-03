const defaultStepData = {
  woodPreparation: {
    checklist: [
      { task: "Select wood", completed: false, totalSeconds: 0 },
      { task: "Check moisture content", completed: false, totalSeconds: 0 },
      { task: "Cut planning / pencil in measurements", completed: false, totalSeconds: 0 },
      { task: "Check size of initial stave", completed: false, totalSeconds: 0 },
      { task: "Cut remaining staves", completed: false, totalSeconds: 0 },
      { task: "Ensure each stave is ready for jointing / plane if necessary", completed: false, totalSeconds: 0 },
      { task: "Check measurement consistency of each stave", completed: false, totalSeconds: 0 },
      { task: "Bookmatch and orientation stave layout, numbering each stave", completed: false, totalSeconds: 0 },
      { task: "Pre-glue test assembly", completed: false, totalSeconds: 0 }
    ]
  },

  shellConstruction: {
    checklist: [
      { task: "Pre-glue test assembly", completed: false, totalSeconds: 0 },
      { task: "Glue and clamp", completed: false, totalSeconds: 0 },
      { task: "Check joint stability post glue, prior to milling", completed: false, totalSeconds: 0 },
      { task: "Prepare shell in jig (fine-tune, measure, adjust as needed)", completed: false, totalSeconds: 0 },
      { task: "Mill exterior to target diameter", completed: false, totalSeconds: 0 },
      { task: "Wood and grain fill exterior of shell", completed: false, totalSeconds: 0 },
      { task: "Sand exterior of shell", completed: false, totalSeconds: 0 },
      { task: "Check exterior roundness", completed: false, totalSeconds: 0 },
      { task: "Mill interior to desired shell thickness", completed: false, totalSeconds: 0 },
      { task: "Wood and grain fill interior of shell", completed: false, totalSeconds: 0 },
      { task: "Sand interior of shell", completed: false, totalSeconds: 0 }
    ]
  },

  fineTuning: {
    checklist: [
      { task: "Check roundness tolerance", completed: false, totalSeconds: 0 },
      { task: "Verify wall uniformity", completed: false, totalSeconds: 0 },
      { task: "Tap test for frequency balance and mark initial areas for torching", completed: false, totalSeconds: 0 },
      { task: "Complete torch tuning process for core shell", completed: false, totalSeconds: 0 },
      { task: "Re-check joint stability and glue if necessary", completed: false, totalSeconds: 0 },
      { task: "Moisture re-check", completed: false, totalSeconds: 0 },
      { task: "Edge sanding and fine-tune with granite block", completed: false, totalSeconds: 0 }
    ]
  },

  shellExteriorFinish: {
    checklist: [
      { task: "Veneer selection (if applicable)", completed: false, totalSeconds: 0 },
      { task: "Veneer taming (if applicable)", completed: false, totalSeconds: 0 },
      { task: "Veneer orientation planning (if applicable)", completed: false, totalSeconds: 0 },
      { task: "Veneer cutting and taping to bookmatch style (if applicable)", completed: false, totalSeconds: 0 },
      { task: "Test wrap and select placement for veneer adhesion (if applicable)", completed: false, totalSeconds: 0 },
      { task: "Apply veneer (if applicable)", completed: false, totalSeconds: 0 },
      { task: "Inspect veneer adhesion for defects/bubbles (if applicable)", completed: false, totalSeconds: 0 },
      { task: "Tap test veneer for frequency balance (if applicable)", completed: false, totalSeconds: 0 },
      { task: "Complete torch-tuning process for veneer (if applicable)", completed: false, totalSeconds: 0 },
      { task: "Re-check for defects post-torching", completed: false, totalSeconds: 0 },
      { task: "Apply acrylic, gap filler, stain, pre-poly finish", completed: false, totalSeconds: 0 },
      { task: "Final pre-poly sand down", completed: false, totalSeconds: 0 },
      { task: "Initial poly coating and/or shellac", completed: false, totalSeconds: 0 },
      { task: "Apply badges/logos", completed: false, totalSeconds: 0 },
      { task: "Apply additional poly coats, wet sanding between coats", completed: false, totalSeconds: 0 }
    ]
  },

  bearingEdges: {
    checklist: [
      { task: "Finish/spray interior of shell (if applicable)", completed: false, totalSeconds: 0 },
      { task: "Attach interior badges, ntags, customer signature/logos", completed: false, totalSeconds: 0 },
      { task: "Shellac interior", completed: false, totalSeconds: 0 },
      { task: "Apply reinforcement rings (if applicable)", completed: false, totalSeconds: 0 },
      { task: "Confirm edge spec (45°, roundover, etc.)", completed: false, totalSeconds: 0 },
      { task: "Route exterior bearing edges", completed: false, totalSeconds: 0 },
      { task: "Route interior bearing edges", completed: false, totalSeconds: 0 },
      { task: "Hand-sand edges smooth", completed: false, totalSeconds: 0 },
      { task: "Edge inspection for snare bed preparation", completed: false, totalSeconds: 0 }
    ]
  },

  snareBedCutting: {
    checklist: [
      { task: "Determine snare bed placement", completed: false, totalSeconds: 0 },
      { task: "Mark center of snare bed locations", completed: false, totalSeconds: 0 },
      { task: "Select snare bed cut depth", completed: false, totalSeconds: 0 },
      { task: "Cut snare beds to spec", completed: false, totalSeconds: 0 },
      { task: "Check symmetry and depth", completed: false, totalSeconds: 0 },
      { task: "Hand sand/file and blend edges", completed: false, totalSeconds: 0 }
    ]
  },

  hardwareDrilling: {
    checklist: [
      { task: "Ensure all hardware, screws, rods, and accessories are in stock", completed: false, totalSeconds: 0 },
      { task: "Layout lugs and throwoff spacing", completed: false, totalSeconds: 0 },
      { task: "Precision measure/mark hardware holes on painters tape", completed: false, totalSeconds: 0 },
      { task: "Check measurements with square and ruler", completed: false, totalSeconds: 0 },
      { task: "Center punch holes", completed: false, totalSeconds: 0 },
      { task: "Drill pilot holes cleanly", completed: false, totalSeconds: 0 },
      { task: "Double-check alignment", completed: false, totalSeconds: 0 },
      { task: "Deburr all hardware holes", completed: false, totalSeconds: 0 },
      { task: "Confirm fit with hardware samples", completed: false, totalSeconds: 0 },
      { task: "Final wet sand", completed: false, totalSeconds: 0 },
      { task: "Final poly (if needed)", completed: false, totalSeconds: 0 },
      { task: "Ensure finish cure before polishing", completed: false, totalSeconds: 0 },
      { task: "Buff/polish exterior surface before assembly", completed: false, totalSeconds: 0 }
    ]
  },

  hardwareAssembly: {
    checklist: [
      { task: "Punch leather gaskets (if applicable)", completed: false, totalSeconds: 0 },
      { task: "Install lugs, throw, butt plate, air vent", completed: false, totalSeconds: 0 },
      { task: "Verify hardware alignment", completed: false, totalSeconds: 0 },
      { task: "Torque hardware", completed: false, totalSeconds: 0 },
      { task: "Inspect for rattle/loose fit", completed: false, totalSeconds: 0 },
      { task: "Professionally photograph shell before heads/hoops", completed: false, totalSeconds: 0 }
    ]
  },

  tuningDetailing: {
    checklist: [
      { task: "Run FFT spectral analysis, save PDF", completed: false, totalSeconds: 0 },
      { task: "Seat heads and tune evenly", completed: false, totalSeconds: 0 },
      { task: "Adjust snare wire tension", completed: false, totalSeconds: 0 },
      { task: "Check for unwanted buzz or rattle", completed: false, totalSeconds: 0 },
      { task: "Confirm tuning stability", completed: false, totalSeconds: 0 },
      { task: "Professionally photograph shell pre-packaging", completed: false, totalSeconds: 0 },
      { task: "Play test: tonal/dynamic response", completed: false, totalSeconds: 0 },
      { task: "Record samples/video at multiple tunings", completed: false, totalSeconds: 0 }
    ]
  },

  qualityCheck: {
    checklist: [
      { task: "Final shell inspection (interior/exterior)", completed: false, totalSeconds: 0 },
      { task: "Check for visual defects or inconsistencies", completed: false, totalSeconds: 0 },
      { task: "Inspect hardware tightness and alignment", completed: false, totalSeconds: 0 },
      { task: "Ensure snare wire response is consistent", completed: false, totalSeconds: 0 },
      { task: "Full test-play to confirm tonal balance", completed: false, totalSeconds: 0 },
      { task: "Hand polish shell and hardware", completed: false, totalSeconds: 0 },
      { task: "Photograph with final shipping materials", completed: false, totalSeconds: 0 },
      { task: "Box, print shipping label, notify customer", completed: false, totalSeconds: 0 },
      { task: "Ship drum", completed: false, totalSeconds: 0 }
    ]
  }
};

export default defaultStepData;