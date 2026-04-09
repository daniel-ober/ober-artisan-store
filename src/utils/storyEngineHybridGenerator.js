// src/utils/storyEngineHybridGenerator.js

import { buildHybridStoryPayload } from './storyEngineStoryPayload';
import {
  buildHybridChapterOverviewPrompt,
  buildHybridBuildNotesPrompt,
} from './storyEngineHybridPrompts';

export function createHybridChapterGenerationRequest(record, chapterKey) {
  const payload = buildHybridStoryPayload(record, chapterKey);

  return {
    payload,
    prompts: {
      chapterOverview: buildHybridChapterOverviewPrompt(payload),
      buildNotes: buildHybridBuildNotesPrompt(payload),
    },
  };
}