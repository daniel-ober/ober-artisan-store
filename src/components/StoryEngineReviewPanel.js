import React, { useMemo, useState } from 'react';
import {
  CHAPTER_KEYS,
  ENGINE_FLAGS,
  WRITING_MODE,
} from '../utils/storyEngineSchema';
import {
  CHAPTER_ORDER,
  createAllChapterDraftPreviews,
} from '../utils/storyEngineDrafting';

const CHAPTER_LABELS = {
  [CHAPTER_KEYS.DISCOVERY_DESIGN]: 'Discovery & Design',
  [CHAPTER_KEYS.COMMITMENT_PORTAL]: 'Commitment Portal',
  [CHAPTER_KEYS.WOOD_VISION_LOCK_IN]: 'Wood Vision Lock-In',
  [CHAPTER_KEYS.RAW_SHELL_CREATION]: 'Raw Shell Creation',
  [CHAPTER_KEYS.SHELL_TRUEING_TORCH_TUNE]: 'Shell Trueing, Torch & Tune',
  [CHAPTER_KEYS.EXTERIOR_ART_FINISH]: 'Exterior Art & Finish',
  [CHAPTER_KEYS.EDGES_SNARE_BEDS]: 'Edges & Snare Beds',
  [CHAPTER_KEYS.HARDWARE_ASSEMBLY]: 'Hardware Assembly',
  [CHAPTER_KEYS.LEGACY_TUNING_MEDIA]: 'Legacy, Tuning & Media',
  [CHAPTER_KEYS.FINAL_QA_PACKAGING_DELIVERY]:
    'Final QA, Packaging & Delivery',
};

const READINESS_LABELS = {
  [ENGINE_FLAGS.SAFE_TO_AUTODRAFT]: 'Safe to autodraft',
  [ENGINE_FLAGS.REVIEW_BEFORE_DRAFT]: 'Review before draft',
  [ENGINE_FLAGS.REQUIRES_HUMAN_CONFIRMATION]: 'Requires human confirmation',
};

const WRITING_MODE_LABELS = {
  [WRITING_MODE.TRUTH_ONLY]: 'Truth only',
  [WRITING_MODE.TRUTH_PLUS_INFERENCE]: 'Truth + inference',
  [WRITING_MODE.TRUTH_PLUS_RECOMMENDATION]: 'Truth + recommendation',
  [WRITING_MODE.HOLD_FOR_REVIEW]: 'Hold for review',
};

function pct(value) {
  const num = Number(value || 0);
  return `${Math.round(num * 100)}%`;
}

function formatList(items = []) {
  if (!Array.isArray(items) || !items.length) return '—';
  return items.join(', ');
}

function safeString(value) {
  if (value == null) return '';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function getChapterLabel(chapterKey) {
  return CHAPTER_LABELS[chapterKey] || chapterKey;
}

function ReviewPill({ children, tone = 'default' }) {
  return (
    <span className={`story-engine-pill story-engine-pill--${tone}`}>
      {children}
    </span>
  );
}

function SectionCard({ title, children, right }) {
  return (
    <div className="story-engine-card">
      <div className="story-engine-card__header">
        <div className="story-engine-card__title">{title}</div>
        {right ? <div className="story-engine-card__right">{right}</div> : null}
      </div>
      <div className="story-engine-card__body">{children}</div>
    </div>
  );
}

function KVRow({ label, value }) {
  return (
    <div className="story-engine-kv">
      <div className="story-engine-kv__label">{label}</div>
      <div className="story-engine-kv__value">{value || '—'}</div>
    </div>
  );
}

function DraftBlock({ label, text }) {
  return (
    <div className="story-engine-draft-block">
      <div className="story-engine-draft-block__label">{label}</div>
      <div className="story-engine-draft-block__text">{text || '—'}</div>
    </div>
  );
}

function TraitList({ items = [] }) {
  if (!items.length) {
    return <div className="story-engine-muted">No unique build traits yet.</div>;
  }

  return (
    <ul className="story-engine-traits">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

function FactTable({ facts = [] }) {
  if (!facts.length) {
    return <div className="story-engine-muted">No grounded facts available.</div>;
  }

  return (
    <div className="story-engine-facts-table-wrap">
      <table className="story-engine-facts-table">
        <thead>
          <tr>
            <th>Field</th>
            <th>Value</th>
            <th>Status</th>
            <th>Confidence</th>
            <th>Review</th>
          </tr>
        </thead>
        <tbody>
          {facts.map((fact, index) => (
            <tr key={`${fact.fieldPath}-${index}`}>
              <td>{fact.fieldPath}</td>
              <td className="story-engine-pre">{safeString(fact.value) || '—'}</td>
              <td>{fact.status || '—'}</td>
              <td>{pct(fact.confidence)}</td>
              <td>
                {fact.reviewNeeded
                  ? formatList(fact.reviewReasons || []) || 'Yes'
                  : 'No'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const StoryEngineReviewPanel = ({ storyEngine }) => {
  const [activeChapterKey, setActiveChapterKey] = useState(CHAPTER_ORDER[0]);
  const [showFacts, setShowFacts] = useState(false);

  const previews = useMemo(() => {
    if (!storyEngine) return {};
    try {
      return createAllChapterDraftPreviews(storyEngine);
    } catch (err) {
      console.error('Failed to build story engine previews:', err);
      return {};
    }
  }, [storyEngine]);

  const chapterKeys = useMemo(() => {
    const fromRecord = Object.keys(storyEngine?.chapters || {});
    if (fromRecord.length) {
      return CHAPTER_ORDER.filter((key) => fromRecord.includes(key));
    }
    return CHAPTER_ORDER;
  }, [storyEngine]);

  const activePreview = previews?.[activeChapterKey] || null;
  const activeChapter = storyEngine?.chapters?.[activeChapterKey] || {};
  const activePrompts = activePreview?.prompts || {};
  const activeDraft = activePreview?.fallbackDraft || {};

  if (!storyEngine) {
    return (
      <div className="story-engine-shell">
        <div className="story-engine-empty">
          No story engine data found on this project yet.
        </div>

        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="story-engine-shell">
      <div className="story-engine-topbar">
        <div>
          <div className="story-engine-eyebrow">Story Engine Review</div>
          <div className="story-engine-title">Admin Story Draft Review</div>
        </div>

        <div className="story-engine-topbar__meta">
          <ReviewPill
            tone={
              storyEngine?.engineMeta?.draftReadiness ===
              ENGINE_FLAGS.SAFE_TO_AUTODRAFT
                ? 'good'
                : storyEngine?.engineMeta?.draftReadiness ===
                    ENGINE_FLAGS.REQUIRES_HUMAN_CONFIRMATION
                  ? 'danger'
                  : 'warn'
            }
          >
            {READINESS_LABELS[storyEngine?.engineMeta?.draftReadiness] ||
              'Review before draft'}
          </ReviewPill>

          <ReviewPill tone="default">
            Overall confidence: {pct(storyEngine?.engineMeta?.overallConfidence)}
          </ReviewPill>
        </div>
      </div>

      <div className="story-engine-grid story-engine-grid--summary">
        <SectionCard title="Engine Meta">
          <KVRow
            label="Overall confidence"
            value={pct(storyEngine?.engineMeta?.overallConfidence)}
          />
          <KVRow
            label="Draft readiness"
            value={
              READINESS_LABELS[storyEngine?.engineMeta?.draftReadiness] ||
              storyEngine?.engineMeta?.draftReadiness ||
              '—'
            }
          />
          <KVRow
            label="Last engine run"
            value={storyEngine?.engineMeta?.lastEngineRunAt || '—'}
          />
          <KVRow
            label="Last reviewed at"
            value={storyEngine?.engineMeta?.lastReviewedAt || '—'}
          />
          <KVRow
            label="Last reviewed by"
            value={storyEngine?.engineMeta?.lastReviewedBy || '—'}
          />
        </SectionCard>

        <SectionCard title="Unresolved Questions">
          {storyEngine?.engineMeta?.unresolvedQuestions?.length ? (
            <ul className="story-engine-bullets">
              {storyEngine.engineMeta.unresolvedQuestions.map((item, index) => (
                <li key={`${item.fieldKey || item.reason || index}`}>
                  <strong>{item.fieldKey || 'Field'}:</strong>{' '}
                  {item.suggestion || item.reason || 'Needs review'}
                </li>
              ))}
            </ul>
          ) : (
            <div className="story-engine-muted">No unresolved questions.</div>
          )}
        </SectionCard>
      </div>

      <div className="story-engine-main">
        <div className="story-engine-sidebar">
          <div className="story-engine-sidebar__title">Chapters</div>

          {chapterKeys.map((chapterKey) => {
            const chapter = storyEngine?.chapters?.[chapterKey] || {};
            const isActive = chapterKey === activeChapterKey;
            const confidenceScore = chapter?.confidenceScore || 0;
            const flag = chapter?.flags?.[0] || ENGINE_FLAGS.REVIEW_BEFORE_DRAFT;

            return (
              <button
                key={chapterKey}
                type="button"
                className={`story-engine-chapter-btn ${
                  isActive ? 'is-active' : ''
                }`}
                onClick={() => setActiveChapterKey(chapterKey)}
              >
                <div className="story-engine-chapter-btn__top">
                  <span>{getChapterLabel(chapterKey)}</span>
                </div>

                <div className="story-engine-chapter-btn__meta">
                  <span>{pct(confidenceScore)}</span>
                  <span>
                    {flag === ENGINE_FLAGS.SAFE_TO_AUTODRAFT
                      ? 'Ready'
                      : flag === ENGINE_FLAGS.REQUIRES_HUMAN_CONFIRMATION
                        ? 'Blocked'
                        : 'Review'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="story-engine-content">
          <div className="story-engine-grid story-engine-grid--chapter-meta">
            <SectionCard
              title={getChapterLabel(activeChapterKey)}
              right={
                <ReviewPill
                  tone={
                    activeChapter?.flags?.[0] === ENGINE_FLAGS.SAFE_TO_AUTODRAFT
                      ? 'good'
                      : activeChapter?.flags?.[0] ===
                          ENGINE_FLAGS.REQUIRES_HUMAN_CONFIRMATION
                        ? 'danger'
                        : 'warn'
                  }
                >
                  {READINESS_LABELS[activeChapter?.flags?.[0]] || 'Review'}
                </ReviewPill>
              }
            >
              <KVRow
                label="Confidence"
                value={pct(activeChapter?.confidenceScore)}
              />
              <KVRow
                label="Unresolved critical fields"
                value={formatList(activeChapter?.unresolvedCriticalFields)}
              />
              <KVRow
                label="Last drafted at"
                value={activeChapter?.drafts?.lastDraftedAt || '—'}
              />
              <KVRow
                label="Last drafted by"
                value={activeChapter?.drafts?.lastDraftedBy || '—'}
              />
            </SectionCard>

            <SectionCard title="Writing Modes">
              <KVRow
                label="Chapter overview"
                value={
                  WRITING_MODE_LABELS[
                    activePrompts?.chapterOverview?.writingMode
                  ] || activePrompts?.chapterOverview?.writingMode
                }
              />
              <KVRow
                label="Build notes story"
                value={
                  WRITING_MODE_LABELS[
                    activePrompts?.buildNotesStory?.writingMode
                  ] || activePrompts?.buildNotesStory?.writingMode
                }
              />
              <KVRow
                label="Prompt confidence"
                value={`${pct(
                  activePrompts?.chapterOverview?.confidence
                )} / ${pct(activePrompts?.buildNotesStory?.confidence)}`}
              />
            </SectionCard>
          </div>

          <SectionCard title="Fallback Draft Preview">
            <DraftBlock
              label="Chapter Overview"
              text={activeDraft?.chapterOverview}
            />
            <DraftBlock
              label="Build Notes Story"
              text={activeDraft?.buildNotesStory}
            />

            <div className="story-engine-draft-block">
              <div className="story-engine-draft-block__label">
                Unique Build Traits
              </div>
              <TraitList items={activeDraft?.uniqueBuildTraits || []} />
            </div>
          </SectionCard>

          <SectionCard title="Saved Drafts On Record">
            <DraftBlock
              label="Saved chapterOverview"
              text={activeChapter?.drafts?.chapterOverview}
            />
            <DraftBlock
              label="Saved buildNotesStory"
              text={activeChapter?.drafts?.buildNotesStory}
            />
            <div className="story-engine-draft-block">
              <div className="story-engine-draft-block__label">
                Saved uniqueBuildTraits
              </div>
              <TraitList items={activeChapter?.drafts?.uniqueBuildTraits || []} />
            </div>
          </SectionCard>

          <SectionCard
            title="Grounded Facts Used For This Chapter"
            right={
              <button
                type="button"
                className="story-engine-toggle-btn"
                onClick={() => setShowFacts((prev) => !prev)}
              >
                {showFacts ? 'Hide facts' : 'Show facts'}
              </button>
            }
          >
            {showFacts ? (
              <>
                <div className="story-engine-subsection-title">
                  Chapter Overview Facts
                </div>
                <FactTable
                  facts={activePrompts?.chapterOverview?.resolvedFacts || []}
                />

                <div className="story-engine-subsection-title">
                  Build Notes Facts
                </div>
                <FactTable
                  facts={activePrompts?.buildNotesStory?.resolvedFacts || []}
                />

                <div className="story-engine-subsection-title">
                  Review Facts
                </div>
                <FactTable
                  facts={[
                    ...(activePrompts?.chapterOverview?.reviewFacts || []),
                    ...(activePrompts?.buildNotesStory?.reviewFacts || []),
                  ]}
                />
              </>
            ) : (
              <div className="story-engine-muted">
                Expand to inspect the exact facts, confidence, and review flags
                feeding this chapter.
              </div>
            )}
          </SectionCard>

          <SectionCard title="Source Registry">
            {storyEngine?.sourceRegistry?.length ? (
              <div className="story-engine-source-list">
                {storyEngine.sourceRegistry.map((source) => (
                  <div
                    className="story-engine-source-item"
                    key={source.id || source.label}
                  >
                    <div className="story-engine-source-item__top">
                      <strong>{source.label || source.id || 'Source'}</strong>
                      <ReviewPill tone="default">{source.type || 'source'}</ReviewPill>
                    </div>

                    <div className="story-engine-source-item__meta">
                      <div>Created at: {source.createdAt || '—'}</div>
                      <div>Created by: {source.createdBy || '—'}</div>
                    </div>

                    {source?.meta ? (
                      <pre className="story-engine-pre story-engine-pre--source">
                        {safeString(source.meta)}
                      </pre>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="story-engine-muted">No registered sources yet.</div>
            )}
          </SectionCard>
        </div>
      </div>

      <style>{styles}</style>
    </div>
  );
};

const styles = `
.story-engine-shell {
  width: 100%;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(18,18,22,0.94), rgba(10,10,14,0.96));
  color: rgba(255,255,255,0.92);
  padding: 18px;
  box-sizing: border-box;
}

.story-engine-topbar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 18px;
}

.story-engine-topbar__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.story-engine-eyebrow {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  opacity: 0.62;
  margin-bottom: 6px;
}

.story-engine-title {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}

.story-engine-grid {
  display: grid;
  gap: 14px;
}

.story-engine-grid--summary {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-bottom: 18px;
}

.story-engine-grid--chapter-meta {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-bottom: 14px;
}

.story-engine-main {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 16px;
}

.story-engine-sidebar {
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 12px;
  background: rgba(255,255,255,0.03);
  height: fit-content;
}

.story-engine-sidebar__title {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  opacity: 0.64;
  margin-bottom: 10px;
}

.story-engine-chapter-btn {
  width: 100%;
  text-align: left;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.03);
  color: inherit;
  border-radius: 12px;
  padding: 11px 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: 160ms ease;
}

.story-engine-chapter-btn:hover {
  background: rgba(255,255,255,0.06);
}

.story-engine-chapter-btn.is-active {
  border-color: rgba(108,162,255,0.55);
  background: rgba(82,122,214,0.16);
}

.story-engine-chapter-btn__top {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
}

.story-engine-chapter-btn__meta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
  opacity: 0.76;
}

.story-engine-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.story-engine-card {
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  background: rgba(255,255,255,0.03);
  overflow: hidden;
}

.story-engine-card__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 14px 16px 0;
}

.story-engine-card__title {
  font-size: 16px;
  font-weight: 700;
}

.story-engine-card__body {
  padding: 14px 16px 16px;
}

.story-engine-kv {
  display: grid;
  grid-template-columns: 210px minmax(0, 1fr);
  gap: 14px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.story-engine-kv:last-child {
  border-bottom: none;
}

.story-engine-kv__label {
  font-size: 13px;
  opacity: 0.7;
}

.story-engine-kv__value {
  font-size: 14px;
}

.story-engine-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid rgba(255,255,255,0.1);
}

.story-engine-pill--default {
  background: rgba(255,255,255,0.06);
}

.story-engine-pill--good {
  background: rgba(74, 179, 120, 0.18);
  border-color: rgba(74, 179, 120, 0.3);
}

.story-engine-pill--warn {
  background: rgba(230, 170, 62, 0.18);
  border-color: rgba(230, 170, 62, 0.3);
}

.story-engine-pill--danger {
  background: rgba(214, 86, 86, 0.18);
  border-color: rgba(214, 86, 86, 0.3);
}

.story-engine-draft-block {
  margin-bottom: 16px;
}

.story-engine-draft-block:last-child {
  margin-bottom: 0;
}

.story-engine-draft-block__label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  opacity: 0.62;
  margin-bottom: 8px;
}

.story-engine-draft-block__text {
  white-space: pre-wrap;
  line-height: 1.6;
  font-size: 14px;
  color: rgba(255,255,255,0.92);
}

.story-engine-traits {
  margin: 0;
  padding-left: 18px;
}

.story-engine-traits li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.story-engine-muted {
  font-size: 14px;
  opacity: 0.68;
}

.story-engine-bullets {
  margin: 0;
  padding-left: 18px;
}

.story-engine-bullets li {
  margin-bottom: 10px;
  line-height: 1.5;
}

.story-engine-toggle-btn {
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.92);
  border-radius: 10px;
  padding: 8px 10px;
  cursor: pointer;
  font-size: 12px;
}

.story-engine-toggle-btn:hover {
  background: rgba(255,255,255,0.08);
}

.story-engine-subsection-title {
  font-size: 13px;
  font-weight: 700;
  margin: 14px 0 8px;
}

.story-engine-facts-table-wrap {
  overflow-x: auto;
}

.story-engine-facts-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.story-engine-facts-table th,
.story-engine-facts-table td {
  padding: 10px 10px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  vertical-align: top;
  text-align: left;
}

.story-engine-facts-table th {
  opacity: 0.72;
  font-weight: 600;
}

.story-engine-pre {
  white-space: pre-wrap;
  word-break: break-word;
}

.story-engine-pre--source {
  margin: 10px 0 0;
  padding: 10px;
  background: rgba(255,255,255,0.03);
  border-radius: 10px;
  font-size: 12px;
  opacity: 0.84;
}

.story-engine-source-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.story-engine-source-item {
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.02);
  border-radius: 12px;
  padding: 12px;
}

.story-engine-source-item__top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 8px;
}

.story-engine-source-item__meta {
  font-size: 12px;
  opacity: 0.72;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.story-engine-empty {
  padding: 18px;
  border-radius: 14px;
  background: rgba(255,255,255,0.03);
  opacity: 0.72;
}

@media (max-width: 980px) {
  .story-engine-main {
    grid-template-columns: 1fr;
  }

  .story-engine-grid--summary,
  .story-engine-grid--chapter-meta {
    grid-template-columns: 1fr;
  }

  .story-engine-topbar {
    flex-direction: column;
  }

  .story-engine-kv {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}
`;

export default StoryEngineReviewPanel;