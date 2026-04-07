// src/components/CraftsmanRecommendationPanel.js

import React, { useMemo, useState } from 'react';
import buildCraftsmanDisplayModel from '../utils/craftsmanEngine/buildCraftsmanDisplayModel';
import scoreLegacyTuningProfile from '../utils/spider/scoreLegacyTuningProfile';
import SegmentedRange from './SegmentedRange';
import './CraftsmanRecommendationPanel.css';

function RecommendationCard({ item, compact = false }) {
  return (
    <article className={`crp-rec-card ${compact ? 'crp-rec-card--compact' : ''}`}>
      <div className="crp-rec-top">
        <h4>{item.label}</h4>
      </div>
      <div className="crp-rec-value">{item.value}</div>
      {!compact && item.rationale ? <p>{item.rationale}</p> : null}
    </article>
  );
}

function CalloutCard({ item }) {
  return (
    <article className="crp-callout-card">
      <div className="crp-callout-top">
        <span className="crp-callout-label">{item.label}</span>
        <span className="crp-callout-score">{item.value}</span>
      </div>
      <p>{item.text}</p>
    </article>
  );
}

function ContributorRow({ item }) {
  return (
    <article className="crp-contributor-card">
      <div className="crp-contributor-top">
        <div>
          <h4>{item.label}</h4>
          <div className="crp-contributor-score">{item.score}/10</div>
        </div>
      </div>

      {item.topContributors?.length ? (
        <div className="crp-contributor-list">
          {item.topContributors.map((contributor, index) => (
            <div
              key={`${item.key}-${contributor.contributorKey}-${index}`}
              className="crp-contributor-row"
            >
              <div className="crp-contributor-row-main">
                <span className="crp-contributor-name">
                  {contributor.label || contributor.contributorKey}
                </span>
                <span className="crp-contributor-weight">
                  {Math.round((Number(contributor.weight) || 0) * 100)}%
                </span>
              </div>

              {contributor.rationale ? (
                <div className="crp-contributor-rationale">
                  {contributor.rationale}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function SectionToggle({ isOpen, onClick, labelOpen, labelClosed }) {
  return (
    <button
      type="button"
      className="crp-toggle-btn"
      onClick={onClick}
      aria-expanded={isOpen}
    >
      {isOpen ? labelOpen : labelClosed}
    </button>
  );
}

export default function CraftsmanRecommendationPanel({
  specs,
  summary,
  title = 'Ober AI Craftsman Summary',
}) {
  const [showDeepBreakdown, setShowDeepBreakdown] = useState(false);
  const [showBuilderNotes, setShowBuilderNotes] = useState(false);

  const display = useMemo(() => {
    if (summary) return buildCraftsmanDisplayModel(summary);
    return buildCraftsmanDisplayModel(specs || {});
  }, [summary, specs]);

  const legacy = useMemo(() => {
    if (summary?.legacyTuning) return summary.legacyTuning;
    return scoreLegacyTuningProfile(specs || {});
  }, [summary, specs]);

  const legacyBand =
    legacy?.sweetSpots?.find((spot) => spot.id === 'legacy') || null;

  const primaryRecommendations = useMemo(() => {
    return (display.recommendations || []).slice(0, 8);
  }, [display.recommendations]);

  const secondaryRecommendations = useMemo(() => {
    return (display.recommendations || []).slice(8);
  }, [display.recommendations]);

  const topDrivers = useMemo(() => {
    return (display.contributors || []).slice(0, 4);
  }, [display.contributors]);

  const remainingDrivers = useMemo(() => {
    return (display.contributors || []).slice(4);
  }, [display.contributors]);

  return (
    <section className="crp-panel">
      <div className="crp-header">
        <div>
          <h2>{title}</h2>
          <p className="crp-subtitle">{display.overview.summary}</p>
        </div>
      </div>

      {display.overview.tonalSummary ? (
        <div className="crp-tonal-summary">
          <h3>Core Read</h3>
          <p>{display.overview.tonalSummary}</p>
        </div>
      ) : null}

      {display.callouts?.length ? (
        <div className="crp-callout-grid">
          {display.callouts.map((item) => (
            <CalloutCard key={item.key} item={item} />
          ))}
        </div>
      ) : null}

      {primaryRecommendations?.length ? (
        <div className="crp-section">
          <div className="crp-section-head">
            <h3>Recommended Build Direction</h3>
          </div>

          <div className="crp-rec-grid">
            {primaryRecommendations.map((item) => (
              <RecommendationCard key={item.key} item={item} />
            ))}
          </div>

          {secondaryRecommendations.length ? (
            <div className="crp-section-actions">
              <SectionToggle
                isOpen={showDeepBreakdown}
                onClick={() => setShowDeepBreakdown((prev) => !prev)}
                labelOpen="Hide deeper recommendation details"
                labelClosed="Show deeper recommendation details"
              />
            </div>
          ) : null}

          {showDeepBreakdown && secondaryRecommendations.length ? (
            <div className="crp-rec-grid crp-rec-grid--secondary">
              {secondaryRecommendations.map((item) => (
                <RecommendationCard key={item.key} item={item} compact />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="crp-section">
        <div className="crp-section-head">
          <h3>Legacy Tuning Direction</h3>
        </div>

        <div className="crp-tuning-cards">
          {display.tuning.cards.map((card) => (
            <article key={card.key} className="crp-tuning-card">
              <span className="crp-tuning-label">{card.label}</span>
              <strong>{card.value}</strong>
              {card.subvalue ? <em>{card.subvalue}</em> : null}
            </article>
          ))}
        </div>

        {legacy?.axis && legacyBand ? (
          <div className="crp-range-wrap">
            <SegmentedRange
              axis={legacy.axis}
              lowestHz={legacy.lowestHz}
              highestHz={legacy.highestHz}
              legacyLowHz={legacyBand.loHz}
              legacyHighHz={legacyBand.hiHz}
              activeBand="legacy"
              markerShellHz={legacy.shellFundamentalHz}
              markerHarmHz={legacy.legacyCenterHz}
              showPlayableCaption
            />
          </div>
        ) : null}

        {display.tuning.why?.length ? (
          <div className="crp-why">
            <h4>Why this tuning center</h4>
            <ul>
              {display.tuning.why.slice(0, 4).map((reason, index) => (
                <li key={`${index}-${reason.slice(0, 16)}`}>{reason}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {topDrivers?.length ? (
        <div className="crp-section">
          <div className="crp-section-head">
            <h3>What Is Driving This Read</h3>
          </div>
          <div className="crp-contributor-grid">
            {topDrivers.map((item) => (
              <ContributorRow key={item.key} item={item} />
            ))}
          </div>

          {remainingDrivers.length ? (
            <div className="crp-section-actions">
              <SectionToggle
                isOpen={showDeepBreakdown}
                onClick={() => setShowDeepBreakdown((prev) => !prev)}
                labelOpen="Hide full contributor breakdown"
                labelClosed="Show full contributor breakdown"
              />
            </div>
          ) : null}

          {showDeepBreakdown && remainingDrivers.length ? (
            <div className="crp-contributor-grid crp-contributor-grid--secondary">
              {remainingDrivers.map((item) => (
                <ContributorRow key={item.key} item={item} />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {display.notes.builderNotes?.length ? (
        <div className="crp-section">
          <div className="crp-section-head">
            <h3>Builder Notes</h3>
          </div>

          <div className="crp-section-actions">
            <SectionToggle
              isOpen={showBuilderNotes}
              onClick={() => setShowBuilderNotes((prev) => !prev)}
              labelOpen="Hide builder notes"
              labelClosed="Show builder notes"
            />
          </div>

          {showBuilderNotes ? (
            <div className="crp-builder-notes">
              {display.notes.builderNotes.map((note, index) => (
                <div key={`${index}-${note.slice(0, 18)}`} className="crp-note">
                  {note}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}