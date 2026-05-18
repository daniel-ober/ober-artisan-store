// src/legacyPrint/voiceField/useVoiceField.js

import { useMemo } from 'react';

const clamp01 = (value) => {

  const number = Number(value);

  if (!Number.isFinite(number)) return 0;

  return Math.max(0, Math.min(1, number));

};

const getVoiceValue = (voice, key, fallback = 0.5) => {

  if (!voice || typeof voice !== 'object') return fallback;

  return clamp01(voice[key] ?? fallback);

};

const getResultVoice = (result) => {

  if (!result || typeof result !== 'object') return {};

  return result.voice || result.legacyPrintVoice || result.voiceProfile || {};

};

export function useVoiceField(anchorVoice = {}, results = []) {

  return useMemo(() => {

    const safeResults = Array.isArray(results) ? results : [];

    return safeResults.map((result, index) => {

      const resultVoice = getResultVoice(result);

      const attack = getVoiceValue(

        resultVoice,

        'attack',

        getVoiceValue(anchorVoice, 'attack', 0.5)

      );

      const brightness = getVoiceValue(

        resultVoice,

        'brightness',

        getVoiceValue(anchorVoice, 'brightness', 0.5)

      );

      const projection = getVoiceValue(

        resultVoice,

        'projection',

        getVoiceValue(anchorVoice, 'projection', 0.5)

      );

      const sustain = getVoiceValue(

        resultVoice,

        'sustain',

        getVoiceValue(anchorVoice, 'sustain', 0.5)

      );

      const warmth = getVoiceValue(

        resultVoice,

        'warmth',

        getVoiceValue(anchorVoice, 'warmth', 0.5)

      );

      const sensitivity = getVoiceValue(

        resultVoice,

        'sensitivity',

        getVoiceValue(anchorVoice, 'sensitivity', 0.5)

      );

      const control = getVoiceValue(

        resultVoice,

        'control',

        getVoiceValue(anchorVoice, 'control', 0.5)

      );

      const similarity = clamp01(result.similarityScore ?? result.matchScore ?? 0.5);

      return {

        drumId: result.drumId || result.id || `voice-field-node-${index}`,

        companyName: result.companyName || result.company || 'Unknown',

        modelName: result.modelName || result.model || 'Untitled Voice',

        raw: result,

        x: clamp01(

          brightness * 0.42 + projection * 0.38 + (1 - warmth) * 0.2

        ),

        y: clamp01(

          1 -

            (attack * 0.35 +

              control * 0.25 +

              projection * 0.15 +

              (1 - sustain) * 0.25)

        ),

        size: 10 + similarity * 26,

        gravity: 0.22 + similarity * 0.58,

        voice: {

          attack,

          brightness,

          projection,

          sustain,

          warmth,

          sensitivity,

          control,

        },

      };

    });

  }, [anchorVoice, results]);

}