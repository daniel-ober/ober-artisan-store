import React, { useState } from "react";
import "./DrumSelector.css";

// Tools
import DrumstickConsultation from "./DrumstickConsultation"; // 🆕 guided stick flow
import DrumheadConsultation from "./DrumheadConsultation";
import DrumHeadSelector from "./DrumHeadSelector";

export default function DrumSelector() {
  const [tab, setTab] = useState("sticks");

  return (
    <section className="oa-ds oa-ds--fullbleed" aria-label="Ober Drum Selector">
      <div className="oa-ds__container">
        {/* Header */}
        <header className="oa-ds__header">
          <div className="oa-ds__headrow">
            <div>
              <h1 className="oa-ds__title">Drumstick & Drumhead Selector</h1>
              <p className="oa-ds__subtitle">
                Guided recommendations for your playing style, touch, and tone — 
                powered by Ober Artisan’s design data.
              </p>
            </div>

            {/* Tabs */}
            <div className="oa-ds__tabs" role="tablist" aria-label="Selector Tabs">
              <button
                type="button"
                className={`oa-ds__tab ${tab === "sticks" ? "is-active" : ""}`}
                role="tab"
                aria-selected={tab === "sticks"}
                onClick={() => setTab("sticks")}
              >
                Sticks
              </button>
              <button
                type="button"
                className={`oa-ds__tab ${tab === "heads" ? "is-active" : ""}`}
                role="tab"
                aria-selected={tab === "heads"}
                onClick={() => setTab("heads")}
              >
                Heads
              </button>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="oa-ds__content">
          {tab === "sticks" && (
            <div className="oa-ds__toolwrap">
              <DrumstickConsultation />
            </div>
          )}

          {tab === "heads" && (
            <div className="oa-ds__toolwrap">
              <DrumheadConsultation />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}