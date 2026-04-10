import React, { useMemo } from 'react';

const BUILD_DIRECTION_SUMMARY = [
  {
    id: 'shellConstruction',
    label: 'Shell Construction',
    craftsmanKey: 'shellConstruction',
    buildSpecKey: 'shellConstruction',
  },
  {
    id: 'primaryWood',
    label: 'Primary Wood',
    craftsmanKey: 'primaryWood',
    buildSpecKey: 'primaryWood',
  },
  {
    id: 'hardwareFinish',
    label: 'Hardware Finish',
    craftsmanKey: 'hardwareFinishCommitment',
    buildSpecKey: 'hardwareFinish',
  },
  {
    id: 'finishSystem',
    label: 'Finish System',
    craftsmanKey: 'finishDirection',
    buildSpecKey: 'finishSystem',
  },
  {
    id: 'bearingEdge',
    label: 'Bearing Edge',
    craftsmanKey: 'bearingEdgeDirection',
    buildSpecKey: 'bearingEdge',
  },
  {
    id: 'tuningApproach',
    label: 'Tuning Approach',
    craftsmanKey: 'tuningApproach',
    buildSpecKey: 'tuningApproach',
  },
  {
    id: 'lugCount',
    label: 'Lug Count',
    craftsmanKey: 'lugCountDirection',
    buildSpecKey: 'lugCount',
  },
];

const safeText = (value, fallback = 'Open') => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') return fallback;
  const text = String(value).trim();
  return text || fallback;
};

const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/["']/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const prettifyFieldKey = (fieldKey = '') => {
  const map = {
    shellConstruction: 'Shell Construction',
    primaryWood: 'Primary Wood',
    secondaryWood: 'Secondary Wood',
    bearingEdge: 'Bearing Edge',
    hoopType: 'Hoop Type',
    lugCount: 'Lug Count',
    finishSystem: 'Finish System',
    snareBed: 'Snare Bed',
    tuningApproach: 'Tuning Approach',
    hardwareFinish: 'Hardware Finish',
  };

  return map[fieldKey] || fieldKey;
};

const StoryStudioSection = ({
  storyEngineRunning,
  handleRunStoryEngine,
  saveStoryEngineToProject,
  storyStudioSummaryStats,
  storyStudioOutstandingItems,
  setOutstandingHelpItem,
  storyEngineData,
  getChapterSectionData,
  regenerateChapterSection,
  toggleChapterSectionLock,
  craftsmanMasterTool = {},
}) => {
  const buildSpec = storyEngineData?.engineRecord?.buildSpec || {};
  const craftsmanDecisions = craftsmanMasterTool?.decisions || {};
  const adminPrompts =
    storyEngineData?.engineRecord?.engineMeta?.adminPrompts || [];

  const directionSummary = useMemo(() => {
    return BUILD_DIRECTION_SUMMARY.map((item) => {
      const craftsmanNode = craftsmanDecisions?.[item.craftsmanKey] || {};
      const buildSpecNode = buildSpec?.[item.buildSpecKey] || {};

      const craftsmanValue = craftsmanNode?.value || '';
      const recommendedValue = craftsmanNode?.recommendedValue || '';
      const buildSpecValue = buildSpecNode?.value || '';

      const hasCraftsmanValue = !!String(craftsmanValue).trim();
      const hasBuildSpecValue = !!String(buildSpecValue).trim();

      const confidence =
        Number.isFinite(craftsmanNode?.confidence) && craftsmanNode?.confidence > 0
          ? craftsmanNode.confidence
          : Math.round((buildSpecNode?.confidence || 0) * 100);

      let syncState = 'missing';
      let syncLabel = 'Missing';

      if (craftsmanNode?.stale) {
        syncState = 'needs_review';
        syncLabel = 'Needs review';
      } else if (hasCraftsmanValue && hasBuildSpecValue) {
        if (normalize(craftsmanValue) === normalize(buildSpecValue)) {
          syncState = 'confirmed';
          syncLabel = 'Confirmed for Story';
        } else {
          syncState = 'mismatch';
          syncLabel = 'Mismatch';
        }
      } else if (hasCraftsmanValue && !hasBuildSpecValue) {
        syncState = 'provisional';
        syncLabel = 'From Craftsman only';
      } else if (!hasCraftsmanValue && hasBuildSpecValue) {
        syncState = 'story_only';
        syncLabel = 'Story only';
      }

      let actionText = 'Add direction';

      if (syncState === 'confirmed') {
        actionText = 'No action needed';
      } else if (syncState === 'provisional') {
        actionText = 'Confirm in Story';
      } else if (syncState === 'mismatch') {
        actionText = 'Reconcile values';
      } else if (syncState === 'needs_review') {
        actionText = 'Review downstream change';
      } else if (syncState === 'story_only') {
        actionText = 'Verify against Craftsman';
      }

      return {
        ...item,
        craftsmanValue: safeText(craftsmanValue, '—'),
        buildSpecValue: safeText(buildSpecValue, '—'),
        displayValue: safeText(craftsmanValue || buildSpecValue, 'Open'),
        recommendedValue: safeText(recommendedValue, ''),
        syncState,
        syncLabel,
        actionText,
        confidence,
        staleReason: craftsmanNode?.staleReason || '',
      };
    });
  }, [buildSpec, craftsmanDecisions]);

  const actionableGroups = useMemo(() => {
    const needsNow = [];
    const reviewSoon = [];
    const later = [];

    storyStudioOutstandingItems.forEach((item) => {
      if (
        item.type === 'source' ||
        item.id === 'consultation-transcript' ||
        item.id === 'consultation-summary' ||
        item.id === 'questionnaire-raw'
      ) {
        needsNow.push(item);
        return;
      }

      if (item.type === 'buildspec') {
        needsNow.push(item);
        return;
      }

      if (item.type === 'prompt') {
        reviewSoon.push(item);
        return;
      }

      if (item.type === 'chapter') {
        later.push(item);
        return;
      }

      reviewSoon.push(item);
    });

    return { needsNow, reviewSoon, later };
  }, [storyStudioOutstandingItems]);

  const nextBestAction = useMemo(() => {
    const transcriptMissing = actionableGroups.needsNow.find(
      (item) => item.id === 'consultation-transcript'
    );
    if (transcriptMissing) return 'Add consultation transcript';

    const summaryMissing = actionableGroups.needsNow.find(
      (item) => item.id === 'consultation-summary'
    );
    if (summaryMissing) return 'Add consultation summary';

    const firstDirectionBlocker = directionSummary.find(
      (item) =>
        item.syncState === 'provisional' ||
        item.syncState === 'missing' ||
        item.syncState === 'mismatch' ||
        item.syncState === 'needs_review'
    );

    if (firstDirectionBlocker) {
      return `${firstDirectionBlocker.label}: ${firstDirectionBlocker.actionText}`;
    }

    if (adminPrompts.length) {
      return `Resolve ${prettifyFieldKey(adminPrompts[0]?.fieldKey)}`;
    }

    return 'Run Story Engine and review chapters';
  }, [actionableGroups, directionSummary, adminPrompts]);

  const chapters = storyEngineData?.engineRecord?.chapters || {};
  const chapterEntries = Object.entries(chapters);

  const canComfortablyReviewChapters = useMemo(() => {
    const unresolvedDirection = directionSummary.some(
      (item) =>
        item.syncState === 'missing' ||
        item.syncState === 'provisional' ||
        item.syncState === 'mismatch' ||
        item.syncState === 'needs_review'
    );

    return !unresolvedDirection && actionableGroups.needsNow.length === 0;
  }, [directionSummary, actionableGroups]);

  return (
    <div className="mpm-surface mpm-overview-scope">
      <div className="mpm-tab-shell">
        <div className="mpm-story-studio-hero">
          <div className="mpm-story-studio-hero-copy">
            <div className="mpm-tab-kicker">Story Studio</div>
            <h3 className="mpm-tab-title">Story engine + chapter output</h3>
            <p className="mpm-tab-subtitle">
              Use this page to see what is missing, what direction is only
              provisional, and what is actually ready for story drafting.
            </p>
          </div>

          <div className="mpm-story-studio-hero-actions">
            <button
              type="button"
              className="mpm-bulk-btn"
              onClick={handleRunStoryEngine}
              disabled={storyEngineRunning}
            >
              {storyEngineRunning ? 'Running…' : 'Run Story Engine'}
            </button>

            <button
              type="button"
              className="mpm-bulk-btn"
              onClick={() => saveStoryEngineToProject()}
              disabled={storyEngineRunning}
            >
              Save Studio State
            </button>
          </div>
        </div>

        <section className="mpm-story-studio-summary">
          <div className="mpm-story-studio-summary-card">
            <span className="mpm-story-studio-summary-label">Outstanding</span>
            <strong className="mpm-story-studio-summary-value">
              {storyStudioSummaryStats.outstandingCount}
            </strong>
          </div>

          <div className="mpm-story-studio-summary-card">
            <span className="mpm-story-studio-summary-label">Chapters</span>
            <strong className="mpm-story-studio-summary-value">
              {storyStudioSummaryStats.chapterCount}
            </strong>
          </div>

          <div className="mpm-story-studio-summary-card">
            <span className="mpm-story-studio-summary-label">Readiness</span>
            <strong className="mpm-story-studio-summary-value">
              {storyStudioSummaryStats.readiness}
            </strong>
          </div>

          <div className="mpm-story-studio-summary-card">
            <span className="mpm-story-studio-summary-label">Confidence</span>
            <strong className="mpm-story-studio-summary-value">
              {storyStudioSummaryStats.confidence}%
            </strong>
          </div>
        </section>

        <section className="mpm-story-panel">
          <div className="mpm-story-panel-header">
            <h3>What to do now</h3>
            <p>
              This is the shortest path to getting Story Studio into a usable,
              trustworthy state.
            </p>
          </div>

          <div className="mpm-story-status-grid">
            <div className="mpm-story-status-card">
              <span className="mpm-story-status-kicker">Next best action</span>
              <strong>{nextBestAction}</strong>
            </div>

            <div className="mpm-story-status-card">
              <span className="mpm-story-status-kicker">Needs now</span>
              <strong>{actionableGroups.needsNow.length}</strong>
            </div>

            <div className="mpm-story-status-card">
              <span className="mpm-story-status-kicker">Review soon</span>
              <strong>{actionableGroups.reviewSoon.length}</strong>
            </div>

            <div className="mpm-story-status-card">
              <span className="mpm-story-status-kicker">Later</span>
              <strong>{actionableGroups.later.length}</strong>
            </div>
          </div>
        </section>

        <section className="mpm-story-panel">
          <div className="mpm-story-panel-header">
            <h3>Current direction</h3>
            <p>
              This compares Craftsman decisions against Story build-spec values
              so you can see what is merely selected versus what Story can
              actually trust.
            </p>
          </div>

          <div className="mpm-story-preview-list">
            {directionSummary.map((item) => (
              <div key={item.id} className="mpm-story-preview-card">
                <div className="mpm-story-preview-head">
                  <h4>{item.label}</h4>
                  <div className="mpm-story-preview-meta">
                    <span>{item.syncLabel}</span>
                    <span>
                      {item.confidence
                        ? `Confidence: ${item.confidence}%`
                        : 'Confidence: —'}
                    </span>
                  </div>
                </div>

                <div className="mpm-story-preview-block">
                  <div className="mpm-story-preview-label">Craftsman</div>
                  <div className="mpm-story-preview-text">
                    {item.craftsmanValue}
                  </div>
                </div>

                <div className="mpm-story-preview-block">
                  <div className="mpm-story-preview-label">Story build-spec</div>
                  <div className="mpm-story-preview-text">
                    {item.buildSpecValue}
                  </div>
                </div>

                <div className="mpm-story-preview-block">
                  <div className="mpm-story-preview-label">Action</div>
                  <div className="mpm-story-preview-text">{item.actionText}</div>
                </div>

                {item.recommendedValue && item.recommendedValue !== 'Open' ? (
                  <div className="mpm-story-preview-block">
                    <div className="mpm-story-preview-label">
                      Top recommendation
                    </div>
                    <div className="mpm-story-preview-text">
                      {item.recommendedValue}
                    </div>
                  </div>
                ) : null}

                {item.staleReason ? (
                  <div className="mpm-story-preview-block">
                    <div className="mpm-story-preview-label">Review note</div>
                    <div className="mpm-story-preview-text">
                      {item.staleReason}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className="mpm-story-studio-outstanding">
          <div className="mpm-story-studio-outstanding-head">
            <div>
              <h4 className="mpm-story-studio-section-title">
                What still needs action
              </h4>
              <p className="mpm-story-studio-section-subtitle">
                Grouped by urgency so you can tell what matters now versus what
                can wait.
              </p>
            </div>
          </div>

          {actionableGroups.needsNow.length ? (
            <div className="mpm-story-review-list" style={{ marginBottom: 18 }}>
              <div className="mpm-story-review-title">Needs now</div>
              <div className="mpm-story-studio-outstanding-list">
                {actionableGroups.needsNow.map((item) => (
                  <div
                    key={item.id}
                    className={`mpm-story-studio-outstanding-item mpm-story-studio-outstanding-item-${item.type}`}
                  >
                    <div className="mpm-story-studio-outstanding-main">
                      <span className="mpm-story-studio-outstanding-dot" />
                      <span className="mpm-story-studio-outstanding-text">
                        {item.label}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="mpm-story-studio-info-btn"
                      onClick={() =>
                        setOutstandingHelpItem((prev) =>
                          prev?.id === item.id ? null : item
                        )
                      }
                      aria-label={`How to resolve ${item.label}`}
                      title="How to resolve"
                    >
                      ?
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {actionableGroups.reviewSoon.length ? (
            <div className="mpm-story-review-list" style={{ marginBottom: 18 }}>
              <div className="mpm-story-review-title">Review soon</div>
              <div className="mpm-story-studio-outstanding-list">
                {actionableGroups.reviewSoon.map((item) => (
                  <div
                    key={item.id}
                    className={`mpm-story-studio-outstanding-item mpm-story-studio-outstanding-item-${item.type}`}
                  >
                    <div className="mpm-story-studio-outstanding-main">
                      <span className="mpm-story-studio-outstanding-dot" />
                      <span className="mpm-story-studio-outstanding-text">
                        {item.label}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="mpm-story-studio-info-btn"
                      onClick={() =>
                        setOutstandingHelpItem((prev) =>
                          prev?.id === item.id ? null : item
                        )
                      }
                      aria-label={`How to resolve ${item.label}`}
                      title="How to resolve"
                    >
                      ?
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {actionableGroups.later.length ? (
            <div className="mpm-story-review-list">
              <div className="mpm-story-review-title">Later / optional</div>
              <div className="mpm-story-studio-outstanding-list">
                {actionableGroups.later.map((item) => (
                  <div
                    key={item.id}
                    className={`mpm-story-studio-outstanding-item mpm-story-studio-outstanding-item-${item.type}`}
                  >
                    <div className="mpm-story-studio-outstanding-main">
                      <span className="mpm-story-studio-outstanding-dot" />
                      <span className="mpm-story-studio-outstanding-text">
                        {item.label}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="mpm-story-studio-info-btn"
                      onClick={() =>
                        setOutstandingHelpItem((prev) =>
                          prev?.id === item.id ? null : item
                        )
                      }
                      aria-label={`How to resolve ${item.label}`}
                      title="How to resolve"
                    >
                      ?
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {!storyStudioOutstandingItems.length ? (
            <div className="mpm-story-studio-outstanding-empty">
              All core intake + story inputs are in place.
            </div>
          ) : null}
        </section>

        <div className="mpm-story-layout">
          <section className="mpm-story-panel">
            <div className="mpm-story-panel-header">
              <h3>Can story be trusted yet?</h3>
              <p>
                Review readiness and any remaining unresolved prompts before you
                spend time polishing chapter output.
              </p>
            </div>

            <div className="mpm-story-status-grid">
              <div className="mpm-story-status-card">
                <span className="mpm-story-status-kicker">Draft readiness</span>
                <strong>
                  {storyEngineData?.engineRecord?.engineMeta?.draftReadiness ||
                    'not_ready'}
                </strong>
              </div>

              <div className="mpm-story-status-card">
                <span className="mpm-story-status-kicker">
                  Overall confidence
                </span>
                <strong>
                  {Math.round(
                    (storyEngineData?.engineRecord?.engineMeta
                      ?.overallConfidence || 0) * 100
                  )}
                  %
                </strong>
              </div>
            </div>

            {adminPrompts.length ? (
              <div className="mpm-story-review-list">
                <div className="mpm-story-review-title">Unresolved prompts</div>
                <ul>
                  {adminPrompts.map((item, idx) => (
                    <li key={`${item.fieldKey}-${idx}`}>
                      <strong>{prettifyFieldKey(item.fieldKey)}</strong>: {item.reason}{' '}
                      — {item.suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          {!!chapterEntries.length ? (
            <section className="mpm-story-panel mpm-story-panel-wide">
              <div className="mpm-story-panel-header">
                <h3>Story Studio Chapters</h3>
                <p>
                  Review chapter output, regenerate sections, and lock approved
                  sections once the direction is stable enough to trust.
                </p>
              </div>

              {!canComfortablyReviewChapters ? (
                <div className="mpm-story-review-list" style={{ marginBottom: 18 }}>
                  <div className="mpm-story-review-title">
                    Chapter review is still provisional
                  </div>
                  <p style={{ margin: 0 }}>
                    You can still inspect drafts, but chapter copy should not be
                    treated as final until the core direction above is confirmed
                    for Story.
                  </p>
                </div>
              ) : null}

              <div className="mpm-story-preview-list">
                {chapterEntries.map(([chapterKey, chapterValue]) => (
                  <article
                    key={chapterKey}
                    className="mpm-story-preview-card"
                  >
                    <div className="mpm-story-preview-head">
                      <h4>{chapterValue?.label || chapterKey}</h4>
                      <div className="mpm-story-preview-meta">
                        <span>
                          Confidence:{' '}
                          {Math.round((chapterValue?.confidenceScore || 0) * 100)}
                          %
                        </span>
                        <span>
                          Flags: {(chapterValue?.flags || []).join(', ') || '—'}
                        </span>
                      </div>
                    </div>

                    <div className="mpm-story-preview-block">
                      <div className="mpm-story-preview-label-row">
                        <div className="mpm-story-preview-label">
                          Chapter Overview
                          {getChapterSectionData(chapterKey, 'chapterOverview')
                            ?.locked ? (
                            <span style={{ marginLeft: 8, opacity: 0.75 }}>
                              (Locked)
                            </span>
                          ) : null}
                        </div>

                        <div className="mpm-story-preview-actions">
                          <button
                            type="button"
                            className="mpm-bulk-btn"
                            disabled={
                              storyEngineRunning ||
                              !!getChapterSectionData(
                                chapterKey,
                                'chapterOverview'
                              )?.locked
                            }
                            onClick={() =>
                              regenerateChapterSection({
                                chapterKey,
                                sectionKey: 'chapterOverview',
                              })
                            }
                          >
                            Regenerate
                          </button>

                          <button
                            type="button"
                            className="mpm-bulk-btn"
                            onClick={() =>
                              toggleChapterSectionLock({
                                chapterKey,
                                sectionKey: 'chapterOverview',
                                locked: !getChapterSectionData(
                                  chapterKey,
                                  'chapterOverview'
                                )?.locked,
                              })
                            }
                          >
                            {getChapterSectionData(
                              chapterKey,
                              'chapterOverview'
                            )?.locked
                              ? 'Unlock'
                              : 'Lock'}
                          </button>
                        </div>
                      </div>

                      <div className="mpm-story-preview-text">
                        {chapterValue?.storySections?.chapterOverview?.text || '—'}
                      </div>
                    </div>

                    <div className="mpm-story-preview-block">
                      <div className="mpm-story-preview-label-row">
                        <div className="mpm-story-preview-label">
                          Build Notes
                          {getChapterSectionData(
                            chapterKey,
                            'buildNotesStory'
                          )?.locked ? (
                            <span style={{ marginLeft: 8, opacity: 0.75 }}>
                              (Locked)
                            </span>
                          ) : null}
                        </div>

                        <div className="mpm-story-preview-actions">
                          <button
                            type="button"
                            className="mpm-bulk-btn"
                            disabled={
                              storyEngineRunning ||
                              !!getChapterSectionData(
                                chapterKey,
                                'buildNotesStory'
                              )?.locked
                            }
                            onClick={() =>
                              regenerateChapterSection({
                                chapterKey,
                                sectionKey: 'buildNotesStory',
                              })
                            }
                          >
                            Regenerate
                          </button>

                          <button
                            type="button"
                            className="mpm-bulk-btn"
                            onClick={() =>
                              toggleChapterSectionLock({
                                chapterKey,
                                sectionKey: 'buildNotesStory',
                                locked: !getChapterSectionData(
                                  chapterKey,
                                  'buildNotesStory'
                                )?.locked,
                              })
                            }
                          >
                            {getChapterSectionData(
                              chapterKey,
                              'buildNotesStory'
                            )?.locked
                              ? 'Unlock'
                              : 'Lock'}
                          </button>
                        </div>
                      </div>

                      <div className="mpm-story-preview-text">
                        {chapterValue?.storySections?.buildNotesStory?.text || '—'}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default StoryStudioSection;