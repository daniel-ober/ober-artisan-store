import { buildEngineRecommendation } from './buildEngineUtils';

export function runBuildEngineSmokeTest() {
  const sampleIntake = {
    tonalGoals: {
      desiredTuningRange: 'tight',
      responsePriorities: ['articulation', 'ghostNotes', 'quickRebound'],
    },
  };

  const result = buildEngineRecommendation(sampleIntake);

//   console.log('BUILD ENGINE TEST RESULT');
//   console.log(result);

  return result;
}