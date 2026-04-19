import React, { useMemo, useState } from 'react';

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
  const [showAllOutstanding, setShowAllOutstanding] = useState(false);
  const [showChapters, setShowChapters] = useState(false);

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
          syncLabel = 'Confirmed';
        } else {
          syncState = 'mismatch';
          syncLabel = 'Mismatch';
        }
      } else if (hasCraftsmanValue && !hasBuildSpecValue) {
        syncState = 'provisional';
        syncLabel = 'Craftsman only';
      } else if (!hasCraftsmanValue && hasBuildSpecValue) {
        syncState = 'story_only';
        syncLabel = 'Story only';
      }

      let actionText = 'Add direction';

      if (syncState === 'confirmed') {
        actionText = 'Ready';
      } else if (syncState === 'provisional') {
        actionText = 'Carry into Story';
      } else if (syncState === 'mismatch') {
        actionText = 'Reconcile values';
      } else if (syncState === 'needs_review') {
        actionText = 'Review change';
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
    if (transcriptMissing) {
      return 'Transcript missing — story cannot verify the player’s actual language yet.';
    }

    const summaryMissing = actionableGroups.needsNow.find(
      (item) => item.id === 'consultation-summary'
    );
    if (summaryMissing) {
      return 'Consult summary missing — story has no builder-facing call takeaway yet.';
    }

    const firstDirectionBlocker = directionSummary.find(
      (item) =>
        item.syncState === 'provisional' ||
        item.syncState === 'missing' ||
        item.syncState === 'mismatch' ||
        item.syncState === 'needs_review'
    );

    if (firstDirectionBlocker) {
      return `${firstDirectionBlocker.label} is still unresolved for story drafting.`;
    }

    if (adminPrompts.length) {
      return `Resolve ${prettifyFieldKey(adminPrompts[0]?.fieldKey)} before trusting chapter copy.`;
    }

    return 'Story is ready for chapter review.';
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

  const topOutstanding = actionableGroups.needsNow.slice(0, 4);
  const remainingOutstanding = actionableGroups.needsNow.slice(4);

  const readinessTone =
    storyStudioSummaryStats.readiness === 'ready'
      ? 'ready'
      : storyStudioSummaryStats.readiness === 'review_before_draft'
        ? 'review'
        : 'blocked';

  return (
    <div className="mpm-surface mpm-overview-scope">
      <div className="mpm-tab-shell">
        <div className="mpm-story-studio-hero">
          <div className="mpm-story-studio-hero-copy">
            <div className="mpm-tab-kicker">Story Studio</div>
            <h3 className="mpm-tab-title">Story engine + chapter output</h3>
            <p className="mpm-tab-subtitle">
              Check whether story is actually ready, see what is still blocking it,
              and only then move into chapter review.
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
            <h3>Story readiness</h3>
            <p>
              One place to see whether story can actually be trusted yet.
            </p>
          </div>

          <div className="mpm-story-status-grid">
            <div className="mpm-story-status-card">
              <span className="mpm-story-status-kicker">Status</span>
              <strong>{storyStudioSummaryStats.readiness}</strong>
            </div>

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
          </div>

          {!canComfortablyReviewChapters ? (
            <div
              className="mpm-story-review-list"
              style={{ marginTop: 18, marginBottom: 0 }}
            >
              <div className="mpm-story-review-title">
                Story is still provisional
              </div>
              <p style={{ margin: 0 }}>
                Chapter copy should not be treated as trustworthy yet. Resolve the
                core blockers first, then rerun story.
              </p>
            </div>
          ) : (
            <div
              className="mpm-story-review-list"
              style={{ marginTop: 18, marginBottom: 0 }}
            >
              <div className="mpm-story-review-title">
                Story is clear enough to review
              </div>
              <p style={{ margin: 0 }}>
                Core discovery and direction look stable enough for chapter review.
              </p>
            </div>
          )}
        </section>

        <section className="mpm-story-panel">
          <div className="mpm-story-panel-header">
            <h3>Direction sync</h3>
            <p>
              These are the build-direction items story needs in order to stop
              sounding generic.
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
                Show the few highest-value blockers first.
              </p>
            </div>
          </div>

          {topOutstanding.length ? (
            <div className="mpm-story-review-list" style={{ marginBottom: 18 }}>
              <div className="mpm-story-review-title">Top blockers</div>
              <div className="mpm-story-studio-outstanding-list">
                {topOutstanding.map((item) => (
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
          ) : (
            <div className="mpm-story-studio-outstanding-empty">
              No top blockers right now.
            </div>
          )}

          {remainingOutstanding.length ? (
            <div className="mpm-history-collapsible">
              <button
                type="button"
                className="mpm-story-review-title"
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                }}
                onClick={() => setShowAllOutstanding((prev) => !prev)}
              >
                {showAllOutstanding ? 'Hide full blocker list' : 'Show full blocker list'}
              </button>

              {showAllOutstanding ? (
                <div className="mpm-story-studio-outstanding-list" style={{ marginTop: 14 }}>
                  {remainingOutstanding.map((item) => (
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
              ) : null}
            </div>
          ) : null}

          {actionableGroups.reviewSoon.length ? (
            <div className="mpm-story-review-list" style={{ marginTop: 18 }}>
              <div className="mpm-story-review-title">Review soon</div>
              <ul style={{ margin: 0 }}>
                {actionableGroups.reviewSoon.slice(0, 4).map((item) => (
                  <li key={item.id}>{item.label}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="mpm-story-panel mpm-story-panel-wide">
          <div className="mpm-story-panel-header">
            <h3>Chapter review</h3>
            <p>
              Keep this collapsed until the groundwork is stronger.
            </p>
          </div>

          <button
            type="button"
            className="mpm-bulk-btn"
            onClick={() => setShowChapters((prev) => !prev)}
            style={{ marginBottom: 18 }}
          >
            {showChapters ? 'Hide Chapters' : 'Show Chapters'}
          </button>

          {showChapters ? (
            <>
              {!canComfortablyReviewChapters ? (
                <div className="mpm-story-review-list" style={{ marginBottom: 18 }}>
                  <div className="mpm-story-review-title">
                    Chapter review is still provisional
                  </div>
                  <p style={{ margin: 0 }}>
                    You can inspect drafts, but chapter copy should not be treated
                    as final until the core direction is confirmed.
                  </p>
                </div>
              ) : null}

              <div className="mpm-story-preview-list">
                {chapterEntries.map(([chapterKey, chapterValue]) => (
                  <article key={chapterKey} className="mpm-story-preview-card">
                    <div className="mpm-story-preview-head">
                      <h4>{chapterValue?.label || chapterKey}</h4>
                      <div className="mpm-story-preview-meta">
                        <span>
                          Confidence:{' '}
                          {Math.round((chapterValue?.confidenceScore || 0) * 100)}%
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
            </>
          ) : (
            <div className="mpm-story-studio-outstanding-empty">
              Chapters are hidden until you are ready to review them.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default StoryStudioSection;