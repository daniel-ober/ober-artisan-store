// src/utils/legacyPrint/heritageReferenceProfile.js

export const HERITAGE_REFERENCE_PROFILE = Object.freeze({
  lineId: 'heritage',

  lineLabel: 'HERITAGE',

benchmarkSpec: Object.freeze({

  scoringIntent: 'shell_first',

  legacyPrintMode: 'shell_first',

  benchmarkMode: 'heritage_shell_first',

  shellFamily: 'wood',

  construction: 'stave',

  primarySpecies: 'oak',

  woodSpeciesLabel: 'Northern Red Oak',

  width: 14,

  depth: 5.5,

  lugQuantity: 8,

  staveCount: 16,

  shellThicknessMm: 10,

  shellThicknessBucket: 'medium',

  hoopType: 'Triple Flange',

  bearingEdge: '45 Inner / Strong Outer Roundover',

  snareBedDepth: 'Standard',

  finish: 'Medium Torch',

  hardwareType: 'Tube Lugs',

  hardwareFinish: 'Chrome',

  drumhead: 'Coated Single Ply',

  tension: 'Medium',

  snareSideHead: 'Standard 3mil',

  snareWireCount: 20,

  snareWireStyle: 'Standard',

  snareWireMaterial: 'Steel',

  reRings: 'None',

}),

  benchmarkMeaning: Object.freeze({
    centerScore: 5,

    explanation:
      'A score of 5.0 represents the benchmark Heritage reference drum, not an average of all snares. Scores above or below 5.0 indicate how this build shifts relative to that Heritage reference.',
  }),

  lineVoicingTruths: Object.freeze({
    warmthBias: 'warmer',

    opennessBias: 'open',

    bodyLean: 'body-forward',

    eraLean: 'vintage-leaning',

    projectionLean: 'more intimate',

    touchLean: 'brush-and-touch-friendly',

    forgivenessLean: 'more demanding',
  }),

  lineNarrative:
    'Heritage is the most rooted side of the Ober voice: naturally warmer, more body-forward, more vintage-leaning, and more intimate in projection than a modern benchmark snare.',

  engineAssumptions: Object.freeze({
    note: 'LegacyPrint Heritage scoring is benchmark-relative. It is intended to describe the shell-driven tonal posture of the build, while heads, wires, and tuning are held to a neutral default scoring setup unless explicitly modeled later.',
  }),
});

export function getHeritageBenchmarkSpec() {
  return { ...HERITAGE_REFERENCE_PROFILE.benchmarkSpec };
}

export default HERITAGE_REFERENCE_PROFILE;
