import { createEmptyStoryEngineRecord, SOURCE_TYPE } from './storyEngineSchema';
import {
  createSourceEntry,
  applyObservedFields,
  runStoryEngine,
} from './storyEngineHelpers';
import { runStoryDraftPipeline } from './storyEngineDrafting';

export function runStoryEngineConsoleTest() {
  let record = createEmptyStoryEngineRecord();

  const source = createSourceEntry({
    type: SOURCE_TYPE.CONSULTATION,
    label: 'Initial consultation',
    content:
      'Player wants a sensitive but full-bodied 14x6.5 snare for studio and live use.',
    createdBy: 'admin',
    createdAt: new Date().toISOString(),
  });

  record = applyObservedFields(
    record,
    {
      'buildIdentity.artistName': 'Test Artist',
      'buildIdentity.projectName': 'SL-TEST-001',
      'buildIdentity.primaryUseCase': 'studio and live versatility',
      'buildIdentity.styleOfPlaying': 'dynamic, articulate backbeat playing',
      'buildIdentity.size.diameter': '14',
      'buildIdentity.size.depth': '6.5',
      'globalProfile.playerContext.genreContext':
        'modern worship and session work',
      'globalProfile.playerContext.desiredOutcome':
        'a sensitive drum with body and control',
      'globalProfile.sonicIntent.attack': 'clear',
      'globalProfile.sonicIntent.body': 'full',
      'globalProfile.sonicIntent.sensitivity': 'high',
      'globalProfile.sonicIntent.articulation': 'defined',
    },
    source
  );

  record = runStoryEngine(record, {
    sourcesToRegister: [source],
  });

  record = runStoryDraftPipeline(record);

//   console.log('FULL RECORD', record);
//   console.log(
//     'DISCOVERY OVERVIEW:',
//     record.chapters.discoveryDesign.storySections.chapterOverview.text
//   );
//   console.log(
//     'DISCOVERY BUILD NOTES:',
//     record.chapters.discoveryDesign.storySections.buildNotesStory.text
//   );
//   console.log(
//     'DISCOVERY UNIQUE TRAITS:',
//     record.chapters.discoveryDesign.drafts?.uniqueBuildTraits || []
//   );

  return record;
}