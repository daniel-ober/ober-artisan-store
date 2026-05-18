import React from 'react';

import { useVoiceSearch } from './useVoiceSearch.js';

/**

 * Minimal Voice Search Panel

 */

export function VoiceSearchPanel({ firestore }) {

  const {

    query,

    setQuery,

    results,

    loading,

  } = useVoiceSearch(firestore);

  return (

    <div style={{ padding: 20 }}>

      <input

        value={query}

        onChange={(e) => setQuery(e.target.value)}

        placeholder="Search snare sound... (warm, dry, bright...)"

        style={{

          width: '100%',

          padding: 12,

          fontSize: 16,

          marginBottom: 20,

        }}

      />

      {loading && <div>Searching sound space...</div>}

      {results.map((r) => (

        <div

          key={r.drumId}

          style={{

            padding: 12,

            borderBottom: '1px solid #333',

          }}

        >

          <div style={{ fontWeight: 600 }}>

            {r.companyName} — {r.modelName}

          </div>

          <div>

            Similarity: {r.similarityScore}

          </div>

          <div style={{ opacity: 0.7 }}>

            {r.summary}

          </div>

          <div style={{ fontSize: 12, opacity: 0.5 }}>

            {r.explanation}

          </div>

        </div>

      ))}

    </div>

  );

}