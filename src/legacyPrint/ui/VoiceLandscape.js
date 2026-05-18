import React, { useMemo } from 'react';

import { buildVoiceLandscape } from '../space/buildVoiceLandscape.js';

export function VoiceLandscape({ drums = [] }) {

  const points = useMemo(() => buildVoiceLandscape(drums), [drums]);

  return (

    <div

      style={{

        position: 'relative',

        width: '100%',

        height: 500,

        border: '1px solid #333',

        background: '#0a0a0a',

        overflow: 'hidden',

      }}

    >

      {points.map((p) => (

        <div

          key={p.id}

          style={{

            position: 'absolute',

            left: `${50 + p.x * 50}%`,

            top: `${50 + p.y * 50}%`,

            transform: 'translate(-50%, -50%)',

            padding: '4px 8px',

            borderRadius: 4,

            background: '#222',

            fontSize: 10,

            color: '#fff',

            whiteSpace: 'nowrap',

          }}

        >

          {p.company} {p.name}

        </div>

      ))}

    </div>

  );

}