import React, { useMemo, useState } from 'react';

import { morphVoice } from '../morph/morphVoice.js';

import { translateFeel } from '../intelligence/translateFeel.js';

export function VoiceMorphPanel({ drumA, drumB }) {

  const [t, setT] = useState(0.5);

  const morphed = useMemo(() => {

    if (!drumA || !drumB) return null;

    const voiceA = drumA.voice || drumA.legacyPrintVoice || {};

    const voiceB = drumB.voice || drumB.legacyPrintVoice || {};

    return morphVoice(voiceA, voiceB, t);

  }, [drumA, drumB, t]);

  if (!morphed) return null;

  const feel = translateFeel(morphed);

  return (

    <div style={{ padding: 20, border: '1px solid #333' }}>

      <h3>🎛 Voice Morph Trajectory</h3>

      <input

        type="range"

        min="0"

        max="1"

        step="0.01"

        value={t}

        onChange={(e) => setT(parseFloat(e.target.value))}

        style={{ width: '100%' }}

      />

      <div style={{ marginTop: 10 }}>

        <strong>Sound Description</strong>

        <div>{feel}</div>

      </div>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>

        {drumA.companyName} → {drumB.companyName}

      </div>

    </div>

  );

}