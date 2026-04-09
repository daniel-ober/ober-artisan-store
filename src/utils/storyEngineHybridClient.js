import { getFunctions, httpsCallable } from 'firebase/functions';
import { createHybridChapterGenerationRequest } from './storyEngineHybridGenerator';

export async function generateHybridChapterFromRecord(record, chapterKey) {
  const functions = getFunctions();
  const callable = httpsCallable(functions, 'generateHybridStoryChapter');

  const request = createHybridChapterGenerationRequest(record, chapterKey);

  const response = await callable({
    payload: request.payload,
    prompts: request.prompts,
    model: 'gpt-5',
  });

  return response?.data?.result || null;
}