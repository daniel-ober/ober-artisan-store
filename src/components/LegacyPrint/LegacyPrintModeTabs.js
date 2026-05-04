import React from 'react';

const LegacyPrintModeTabs = ({ modes = [], activeMode, onChange }) => {

  return (

    <div className="lp-mode-tabs" role="tablist" aria-label="LegacyPrint VoiceMapping modes">

      {modes.map((mode) => (

        <button

          key={mode.id}

          type="button"

          className={`lp-mode-tab ${activeMode === mode.id ? 'is-active' : ''}`}

          onClick={() => onChange(mode.id)}

          role="tab"

          aria-selected={activeMode === mode.id}

        >

          <span>{mode.label}</span>

          <small>{mode.sublabel}</small>

        </button>

      ))}

    </div>

  );

};

export default LegacyPrintModeTabs;