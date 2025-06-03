const defaultStepData = {
    woodPreparation: {
      checklist: [
        { task: "Select and inspect raw wood blanks", completed: false, totalSeconds: 0 },
        { task: "Cut wood to stave or segment shapes", completed: false, totalSeconds: 0 },
        { task: "Check moisture content (8–12%)", completed: false, totalSeconds: 0 },
        { task: "Bookmatch or orientation layout", completed: false, totalSeconds: 0 },
        { task: "Joint and plane each piece", completed: false, totalSeconds: 0 },
        { task: "Pre-glue test assembly", completed: false, totalSeconds: 0 }
      ]
    },
    shellConstruction: {
      checklist: [
        { task: "Glue-up and clamp process", completed: false, totalSeconds: 0 },
        { task: "Lathe or sand to round", completed: false, totalSeconds: 0 },
        { task: "Wall thickness verification", completed: false, totalSeconds: 0 },
        { task: "Interior surface prep", completed: false, totalSeconds: 0 },
        { task: "Reinforcement rings cut & glued (if applicable)", completed: false, totalSeconds: 0 },
        { task: "Initial bearing edge marking", completed: false, totalSeconds: 0 }
      ]
    },
    fineTuning: {
      checklist: [
        { task: "Check roundness tolerance", completed: false, totalSeconds: 0 },
        { task: "Verify wall uniformity", completed: false, totalSeconds: 0 },
        { task: "Tap test for frequency balance", completed: false, totalSeconds: 0 },
        { task: "Edge re-level if needed", completed: false, totalSeconds: 0 },
        { task: "Moisture re-check", completed: false, totalSeconds: 0 },
        { task: "Mark phase complete", completed: false, totalSeconds: 0 }
      ]
    },
    shellExteriorFinish: {
      checklist: [
        { task: "Sanding shell exterior (progressive grits)", completed: false, totalSeconds: 0 },
        { task: "Inspect for surface defects", completed: false, totalSeconds: 0 },
        { task: "Apply requested finish or stain", completed: false, totalSeconds: 0 },
        { task: "Cure/dry between coats", completed: false, totalSeconds: 0 },
        { task: "Final clear coat (oil, lacquer, etc.)", completed: false, totalSeconds: 0 },
        { task: "Buff/polish exterior surface", completed: false, totalSeconds: 0 }
      ]
    },
    bearingEdges: {
      checklist: [
        { task: "Confirm edge spec (45°, roundover, etc.)", completed: false, totalSeconds: 0 },
        { task: "Rout or cut bearing edges", completed: false, totalSeconds: 0 },
        { task: "Hand-sand edges smooth", completed: false, totalSeconds: 0 },
        { task: "Apply wax or edge treatment (if applicable)", completed: false, totalSeconds: 0 },
        { task: "Final edge inspection", completed: false, totalSeconds: 0 },
        { task: "Mark edges as complete", completed: false, totalSeconds: 0 }
      ]
    },
    snareBedCutting: {
      checklist: [
        { task: "Measure and mark snare bed location", completed: false, totalSeconds: 0 },
        { task: "Cut snare beds to spec", completed: false, totalSeconds: 0 },
        { task: "Check symmetry and depth", completed: false, totalSeconds: 0 },
        { task: "Test with snare wire fitment", completed: false, totalSeconds: 0 },
        { task: "Smooth and blend edges", completed: false, totalSeconds: 0 },
        { task: "Approve beds for hardware", completed: false, totalSeconds: 0 }
      ]
    },
    hardwareDrilling: {
      checklist: [
        { task: "Layout lugs and throwoff spacing", completed: false, totalSeconds: 0 },
        { task: "Center punch all holes", completed: false, totalSeconds: 0 },
        { task: "Drill pilot holes cleanly", completed: false, totalSeconds: 0 },
        { task: "Deburr all hardware holes", completed: false, totalSeconds: 0 },
        { task: "Confirm fit with hardware samples", completed: false, totalSeconds: 0 },
        { task: "Prep for final assembly", completed: false, totalSeconds: 0 }
      ]
    },
    hardwareAssembly: {
      checklist: [
        { task: "Install all lugs, throw, butt plate", completed: false, totalSeconds: 0 },
        { task: "Install air vent grommet", completed: false, totalSeconds: 0 },
        { task: "Verify hardware alignment", completed: false, totalSeconds: 0 },
        { task: "Torque hardware as needed", completed: false, totalSeconds: 0 },
        { task: "Attach badges / brand markings", completed: false, totalSeconds: 0 },
        { task: "Inspect for rattle or loose fit", completed: false, totalSeconds: 0 }
      ]
    },
    tuningDetailing: {
      checklist: [
        { task: "Seat heads and tune evenly", completed: false, totalSeconds: 0 },
        { task: "Adjust snare wire tension", completed: false, totalSeconds: 0 },
        { task: "Check for unwanted buzz or rattle", completed: false, totalSeconds: 0 },
        { task: "Play test: tonal and dynamic response", completed: false, totalSeconds: 0 },
        { task: "Detail clean shell and hardware", completed: false, totalSeconds: 0 },
        { task: "Confirm tuning stability", completed: false, totalSeconds: 0 }
      ]
    },
    qualityCheck: {
      checklist: [
        { task: "Final shell inspection (interior + exterior)", completed: false, totalSeconds: 0 },
        { task: "Check for visual defects or inconsistencies", completed: false, totalSeconds: 0 },
        { task: "Confirm bearing edge cleanliness and integrity", completed: false, totalSeconds: 0 },
        { task: "Inspect hardware tightness and alignment", completed: false, totalSeconds: 0 },
        { task: "Ensure snare wire response is consistent", completed: false, totalSeconds: 0 },
        { task: "Full test-play to confirm tonal balance", completed: false, totalSeconds: 0 },
        { task: "Clean and polish entire drum for delivery", completed: false, totalSeconds: 0 },
        { task: "Mark drum as production complete", completed: false, totalSeconds: 0 }
      ]
    }
  };
  
  export default defaultStepData;