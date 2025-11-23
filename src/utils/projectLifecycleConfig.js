// src/utils/projectLifecycleConfig.js

// 💡 Master schema for the lifecycle. Currently Stage 1 only.
export const PROJECT_LIFECYCLE_DEFINITION = {
  stages: {
    discoveryDesign: {
      id: 'discoveryDesign',
      label: 'Stage 1. Discovery & Design',
      order: 1,
      steps: {
        initialConsultation: {
          id: 'initialConsultation',
          label: 'Initial consultation',
          order: 1,
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
              id: 'determineTuningGoals',
              label: 'Determine tuning goals (LegacyPrint window)',
            },
            {
              id: 'confirmBudgetTimeline',
              label: 'Confirm budget & timeline',
            },
          ],
        },

        buildProposal: {
          id: 'buildProposal',
          label: 'Build proposal',
          order: 2,
          checkpoints: [
            { id: 'generateFullSpec', label: 'Generate full written build spec' },
            { id: 'selectPrimarySpecies', label: 'Select primary wood species' },
            {
              id: 'selectSecondarySpeciesHybrid',
              label: 'Select secondary species if hybrid',
            },
            { id: 'determineStaveCount', label: 'Determine stave count' },
            {
              id: 'determineShellThicknessTarget',
              label: 'Determine shell thickness target',
            },
            { id: 'determineVeneerChoice', label: 'Determine veneer choice' },
            {
              id: 'determineHardwareFinish',
              label:
                'Determine hardware finish (chrome / black nickel / brass)',
            },
            { id: 'determineLugStyle', label: 'Determine lug style (vintage tube)' },
            {
              id: 'confirmHoopTypeDiecast',
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

        earlyMockups: {
          id: 'earlyMockups',
          label: 'Early mockups',
          order: 3,
          checkpoints: [
            {
              id: 'createFirstRoundMockups',
              label:
                'Create first-round visual mockups (finish / veneer / hardware)',
            },
            {
              id: 'exploreFinishConcepts',
              label:
                'Explore 2–3 finish concepts with different accents',
            },
            {
              id: 'mockBadgePlacement',
              label: 'Mock up badge placement and logo treatments',
            },
            {
              id: 'prepareWriteupEachOption',
              label: 'Prepare quick write-up explaining each option',
            },
            {
              id: 'shareMockupsForFeedback',
              label: 'Share mockups with customer for feedback',
            },
            {
              id: 'captureRevisionNotes',
              label: 'Capture revision notes for chosen direction',
            },
          ],
        },
      },
    },
  },
};

export function buildEmptyLifecycle(def = PROJECT_LIFECYCLE_DEFINITION) {
  const stages = {};

  Object.values(def.stages).forEach((stageDef) => {
    const steps = {};

    Object.values(stageDef.steps).forEach((stepDef) => {
      const checkpoints = {};

      (stepDef.checkpoints || []).forEach((cp) => {
        checkpoints[cp.id] = {
          id: cp.id,
          label: cp.label,
          completed: false,
          totalSeconds: 0,
          timestamp: null,
        };
      });

      steps[stepDef.id] = {
        id: stepDef.id,
        label: stepDef.label,
        order: stepDef.order,
        completed: false,
        checkpoints,
      };
    });

    stages[stageDef.id] = {
      id: stageDef.id,
      label: stageDef.label,
      order: stageDef.order,
      completed: false,
      steps,
    };
  });

  return { stages };
}