import { calculateVoiceProfile } from '../engine/calculateVoiceProfile.js';

import { extractFirstListen } from '../intelligence/extractFirstListen.js';

import { compareVoices } from '../intelligence/compareVoices.js';

import { buildVoiceIndex } from '../indexing/buildVoiceIndex.js';

export async function processRebuildQueue({

  firestore,

  limit = 10,

}) {

  const snapshot = await firestore

    .collection('legacyPrintRebuildQueue')

    .where('status', '==', 'queued')

    .limit(limit)

    .get();

  if (snapshot.empty) {

    return {

      success: true,

      processed: 0,

      message: 'No queued rebuilds found',

    };

  }

  const results = [];

  for (const doc of snapshot.docs) {

    const job = doc.data();

    try {

      // STEP 1 — mark as started

      await doc.ref.set(

        {

          status: 'processing',

          startedAt: new Date().toISOString(),

        },

        { merge: true }

      );

      // STEP 2 — fetch latest drum reference

      const drumRefDoc = await firestore

        .collection('legacyPrintDrumReferences')

        .doc(job.targetDrumReferenceId)

        .get();

      if (!drumRefDoc.exists) {

        throw new Error('Drum reference not found');

      }

      const drum = drumRefDoc.data();

      // STEP 3 — VOICE ENGINE CALCULATION

      const result = calculateVoiceProfile(drum);

      const firstListen = extractFirstListen(result.voice);

      const comparisonToBaseline = drum?.legacyPrintBaselineVoice

        ? compareVoices(drum.legacyPrintBaselineVoice, result.voice)

        : null;

      const recalculatedVoice = {

        ...result.voice,

        recalculatedAt: new Date().toISOString(),

        reason: 'legacyprint_voice_engine_v1',

      };

      // STEP 3.5 — BUILD INDEX (NEW)

      const voiceIndex = buildVoiceIndex(recalculatedVoice);

      // STEP 4 — write recalculated voice profile

      await firestore

        .collection('legacyPrintVoiceProfiles')

        .doc(job.targetDrumReferenceId)

        .set(

          {

            drumReferenceId: job.targetDrumReferenceId,

            voice: recalculatedVoice,

            metadata: result.metadata,

            firstListen,

            comparisonToBaseline,

            // NEW: indexed representation for fast search

            voiceIndex,

            updatedAt: new Date().toISOString(),

          },

          { merge: true }

        );

      // STEP 5 — mark complete

      await doc.ref.set(

        {

          status: 'completed',

          completedAt: new Date().toISOString(),

        },

        { merge: true }

      );

      results.push({

        jobId: job.id,

        status: 'completed',

      });

    } catch (err) {

      await doc.ref.set(

        {

          status: 'failed',

          failedAt: new Date().toISOString(),

          errorMessage: err.message,

        },

        { merge: true }

      );

      results.push({

        jobId: job.id,

        status: 'failed',

        error: err.message,

      });

    }

  }

  return {

    success: true,

    processed: results.length,

    results,

  };

}