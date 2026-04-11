import React, { useEffect, useMemo, useState } from 'react';
import {
  CONSULTATION_INTAKE_SECTIONS,
  buildConsultationIntakeDefaults,
} from '../../utils/consultationIntakeSchema';
import './IntakeDirectionSection.css';

const REVIEW_STATE_OPTIONS = [
  { value: 'clarify', label: 'Open Question' },
  { value: 'verify', label: 'Needs Confirming' },
  { value: 'confirmed', label: 'Locked In' },
];

const TRUTH_GROUPS = [
  {
    key: 'purpose',
    title: 'Purpose',
    badge: 'P',
    summary:
      'Why the drum exists — role, context, where it needs to succeed, and how much direction is wanted.',
    consultFields: [
      'playerProfile',
      'primaryGoal',
      'environments',
      'guidancePreference',
    ],
  },
  {
    key: 'feel',
    title: 'Feel',
    badge: 'F',
    summary:
      'How the drum meets the player — rebound, comfort, sensitivity, and touch.',
    consultFields: [
      'feelPriorities',
      'snareLoveMost',
      'snareFrustrations',
      'dynamicFeel',
    ],
  },
  {
    key: 'voice',
    title: 'Voice',
    badge: 'V',
    summary:
      'What the drum says — its sonic identity, tonal character, and musical language.',
    consultFields: [
      'genres',
      'tonalGoals',
      'responsePriorities',
      'sizeDirection',
    ],
  },
  {
    key: 'legacy',
    title: 'Legacy',
    badge: 'L',
    summary:
      'Why it matters — visual character, personal meaning, influences, and emotional permanence.',
    consultFields: [
      'visualDirection',
      'hardwareFinishPreference',
      'storyImportance',
      'favoritePartOfPlaying',
      'influenceReferences',
      'finalNotes',
    ],
  },
];

const cleanText = (value) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeCompare = (value) =>
  cleanText(value)
    .toLowerCase()
    .replace(/[“”"']/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const isEmptyish = (value) => {
  const text = normalizeCompare(value);
  return (
    !text ||
    [
      '—',
      '-',
      'n/a',
      'na',
      'none',
      'unknown',
      'not sure',
      'unsure',
      'tbd',
      'idk',
      "i don't know",
      'i dont know',
      'guide me',
      'still open',
      'open',
      "i'm not sure",
      "i'm",
      'im',
    ].includes(text)
  );
};

const getDisplayValue = (value, fallback = '—') => {
  if (Array.isArray(value)) {
    const joined = value
      .map((item) => cleanText(item))
      .filter(Boolean)
      .join(', ');
    return joined || fallback;
  }

  if (typeof value === 'object' && value !== null) {
    const joined = Object.values(value)
      .flatMap((item) => (Array.isArray(item) ? item : [item]))
      .map((item) => cleanText(item))
      .filter(Boolean)
      .join(', ');
    return joined || fallback;
  }

  const text = cleanText(value);
  return text || fallback;
};

const getReviewStatePillClass = (reviewState) => {
  if (reviewState === 'confirmed') return 'is-good';
  if (reviewState === 'verify') return 'is-medium';
  return 'is-soft';
};

const safeDateLabel = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
};

const flattenSectionFields = (sections) =>
  sections.flatMap((section) =>
    (section.questions || []).flatMap((question) => question.fields || [])
  );

const QUESTIONNAIRE_FIELD_INDEX = flattenSectionFields(
  CONSULTATION_INTAKE_SECTIONS
).reduce((acc, field) => {
  acc[field.id] = field;
  return acc;
}, {});

const emptyTruthRow = () => ({
  notes: '',
  reviewState: '',
  checked: false,
});

const IntakeDirectionSection = ({
  storyEngineData,
  setStoryEngineData,
  deriveCustomerName,
  projectData,
  handleGenerateConsultationSummary,
  storyEngineRunning,
  isNormalizingTranscript,
  normalizedTranscriptTurns,
  buildSmartTranscriptTurns,
  saveStoryEngineToProject,
}) => {
  const questionnaireMapped = storyEngineData?.questionnaireMapped || {};
  const consultationMapped = storyEngineData?.consultationMapped || {};

  const artistDisplayName =
    consultationMapped?.artistName ||
    questionnaireMapped?.artistName ||
    deriveCustomerName(projectData) ||
    'Artist';

  const discoveryWorkspace = storyEngineData?.discoveryWorkspace || {};
  const intakeState = discoveryWorkspace?.intake || {};
  const consultState = discoveryWorkspace?.consult || {};
  const summaryState = discoveryWorkspace?.summary || {};

  const intakeLocked = !!intakeState?.completed;
  const consultLocked = !!consultState?.completed;
  const summaryGenerated = !!summaryState?.generated;

  const [intakeOpen, setIntakeOpen] = useState(true);
  const [consultOpen, setConsultOpen] = useState(true);
  const [summaryOpen, setSummaryOpen] = useState(true);

  useEffect(() => {
    setIntakeOpen(!intakeLocked);
    setConsultOpen(!consultLocked);
    setSummaryOpen(summaryGenerated);
  }, [intakeLocked, consultLocked, summaryGenerated]);

  const smartTranscriptTurns =
    Array.isArray(normalizedTranscriptTurns) && normalizedTranscriptTurns.length
      ? normalizedTranscriptTurns
      : buildSmartTranscriptTurns?.(
          storyEngineData?.consultationTranscript || '',
          artistDisplayName
        ) || [];

  const updateDiscoveryWorkspace = (updater) => {
    setStoryEngineData((prev) => {
      const currentWorkspace = prev?.discoveryWorkspace || {};
      const nextWorkspace =
        typeof updater === 'function' ? updater(currentWorkspace) : updater;

      return {
        ...prev,
        discoveryWorkspace: nextWorkspace,
      };
    });
  };

  const updateTruthRow = (truthKey, fieldId, patch) => {
    if (consultLocked) return;

    updateDiscoveryWorkspace((current) => {
      const currentRows = current?.consult?.truthRows || {};
      const currentTruthRows = currentRows?.[truthKey] || {};
      const existing = currentTruthRows?.[fieldId] || emptyTruthRow();

      return {
        ...current,
        consult: {
          ...(current?.consult || {}),
          truthRows: {
            ...currentRows,
            [truthKey]: {
              ...currentTruthRows,
              [fieldId]: {
                ...existing,
                ...patch,
              },
            },
          },
        },
      };
    });
  };

  const updateSummaryMeta = (patch) => {
    updateDiscoveryWorkspace((current) => ({
      ...current,
      summary: {
        ...(current?.summary || {}),
        ...patch,
      },
    }));
  };

  const handleMarkIntakeComplete = async () => {
    if (intakeLocked) return;

    const nextDiscoveryWorkspace = {
      ...discoveryWorkspace,
      intake: {
        ...(discoveryWorkspace?.intake || {}),
        completed: true,
        completedAt: new Date().toISOString(),
      },
    };

    setStoryEngineData((prev) => ({
      ...prev,
      discoveryWorkspace: nextDiscoveryWorkspace,
    }));

    if (typeof saveStoryEngineToProject === 'function') {
      await saveStoryEngineToProject({
        sources: {
          consultationTranscript: storyEngineData.consultationTranscript || '',
          consultationTranscriptTurns: Array.isArray(normalizedTranscriptTurns)
            ? normalizedTranscriptTurns
            : [],
          consultationSummary: storyEngineData.consultationSummary || '',
          adminNotes: storyEngineData.adminNotes || '',
          questionnaireRaw: storyEngineData.questionnaireRaw || '',
          questionnaireMapped: storyEngineData.questionnaireMapped || {},
          consultationMapped: storyEngineData.consultationMapped || {},
          discoveryWorkspace: nextDiscoveryWorkspace,
        },
        record: storyEngineData.engineRecord || null,
        draftPreview: storyEngineData.draftPreview || null,
        lastUpdatedAt: new Date().toISOString(),
      });
    }
  };

  const handleMarkConsultComplete = async () => {
    if (consultLocked) return;

    const nextDiscoveryWorkspace = {
      ...discoveryWorkspace,
      consult: {
        ...(discoveryWorkspace?.consult || {}),
        completed: true,
        completedAt: new Date().toISOString(),
        truthRows: discoveryWorkspace?.consult?.truthRows || {},
      },
    };

    setStoryEngineData((prev) => ({
      ...prev,
      discoveryWorkspace: nextDiscoveryWorkspace,
    }));

    if (typeof saveStoryEngineToProject === 'function') {
      await saveStoryEngineToProject({
        sources: {
          consultationTranscript: storyEngineData.consultationTranscript || '',
          consultationTranscriptTurns: Array.isArray(normalizedTranscriptTurns)
            ? normalizedTranscriptTurns
            : [],
          consultationSummary: storyEngineData.consultationSummary || '',
          adminNotes: storyEngineData.adminNotes || '',
          questionnaireRaw: storyEngineData.questionnaireRaw || '',
          questionnaireMapped: storyEngineData.questionnaireMapped || {},
          consultationMapped: storyEngineData.consultationMapped || {},
          discoveryWorkspace: nextDiscoveryWorkspace,
        },
        record: storyEngineData.engineRecord || null,
        draftPreview: storyEngineData.draftPreview || null,
        lastUpdatedAt: new Date().toISOString(),
      });
    }
  };

  const questionnaireDefaults = useMemo(
    () => buildConsultationIntakeDefaults(),
    []
  );

  const questionnaireReceived =
    !!cleanText(storyEngineData?.questionnaireRaw) ||
    Object.keys(questionnaireMapped || {}).length > 0;

  const questionnaireStatus = questionnaireReceived ? 'Received' : 'Incomplete';
  const intakeStatusLabel = intakeLocked ? 'Reviewed' : 'Active';
  const consultStatusLabel = consultLocked ? 'Completed' : 'Active';

  const truthBoards = useMemo(() => {
    const truthRows = consultState?.truthRows || {};

    return TRUTH_GROUPS.map((truth) => {
      const items = truth.consultFields.map((fieldId) => {
        const fieldMeta = QUESTIONNAIRE_FIELD_INDEX[fieldId];
        const sectionDefaults = Object.values(questionnaireDefaults).find(
          (sectionObj) =>
            sectionObj && Object.prototype.hasOwnProperty.call(sectionObj, fieldId)
        );

        const questionnaireValue =
          Object.entries(questionnaireDefaults).reduce((found, [sectionKey]) => {
            if (found !== undefined) return found;
            return questionnaireMapped?.[fieldId];
          }, undefined) || questionnaireMapped?.[fieldId];

        const consultValue = consultationMapped?.[fieldId];

        const truthSavedRow =
          truthRows?.[truth.key]?.[fieldId] || emptyTruthRow();

        const finalValue =
          consultValue !== undefined && consultValue !== null && cleanText(consultValue)
            ? consultValue
            : questionnaireValue;

        let autoReviewState = 'verify';

        if (isEmptyish(finalValue)) {
          autoReviewState = 'clarify';
        } else if (truthSavedRow.checked) {
          autoReviewState = 'confirmed';
        }

        const reviewState =
          truthSavedRow.reviewState && cleanText(truthSavedRow.reviewState)
            ? truthSavedRow.reviewState
            : autoReviewState;

        return {
          fieldId,
          label: fieldMeta?.label || fieldId,
          questionnaireValue,
          consultValue,
          finalValue,
          reviewState,
          checked: !!truthSavedRow.checked,
          notes: truthSavedRow.notes || '',
        };
      });

      const confirmedItems = items.filter(
        (item) => item.reviewState === 'confirmed'
      );
      const verifyItems = items.filter((item) => item.reviewState === 'verify');
      const clarifyItems = items.filter(
        (item) => item.reviewState === 'clarify'
      );

      return {
        ...truth,
        items,
        confirmedItems,
        verifyItems,
        clarifyItems,
      };
    });
  }, [consultState?.truthRows, consultationMapped, questionnaireDefaults, questionnaireMapped]);

  const generatedIntelliSummary = useMemo(() => {
    const allItems = truthBoards.flatMap((truth) =>
      truth.items.map((item) => ({
        truth: truth.title,
        ...item,
      }))
    );

    const trustedSignals = allItems
      .filter((item) => item.reviewState === 'confirmed' && !isEmptyish(item.finalValue))
      .map((item) => ({
        label: `${item.truth} · ${item.label}`,
        value: getDisplayValue(item.finalValue),
        confidence: 'high',
        rationale:
          item.notes ||
          'This has been discussed clearly enough to treat as part of the working direction.',
      }));

    const stillOpen = allItems
      .filter((item) => item.reviewState !== 'confirmed')
      .map((item) => ({
        label: `${item.truth} · ${item.label}`,
        note:
          item.notes ||
          'This area still needs either confirmation or clarification before it should be treated as locked.',
      }));

    const followUps = allItems
      .filter((item) => item.reviewState === 'clarify')
      .map((item) => ({
        label: `${item.truth} · ${item.label}`,
        question: `Ask a clarifying follow-up around ${item.label.toLowerCase()}.`,
      }));

    const confidenceRows = allItems.map((item) => ({
      label: `${item.truth} · ${item.label}`,
      value: getDisplayValue(item.finalValue),
      confidence:
        item.reviewState === 'confirmed'
          ? 'high'
          : item.reviewState === 'verify'
            ? 'medium'
            : 'low',
      rationale:
        item.notes ||
        (item.reviewState === 'confirmed'
          ? 'This appears settled enough to treat as part of the working direction.'
          : item.reviewState === 'verify'
            ? 'This looks directionally useful, but still needs verbal confirmation.'
            : 'This still needs more clarity before it should influence downstream build decisions.'),
    }));

    const truthSummary = truthBoards
      .map((truth) => {
        const confirmedCount = truth.confirmedItems.length;
        const totalCount = truth.items.length;
        return `${truth.title}: ${confirmedCount}/${totalCount} areas currently feel locked in.`;
      })
      .join(' ');

    const overview =
      trustedSignals.length > 0
        ? `Discovery is beginning to form around the four truths. ${truthSummary}`
        : `Discovery has started, but there is not enough confirmed signal yet across Voice, Feel, Purpose, and Legacy to treat the build direction as truly locked.`;

    const nextSteps = [];

    if (trustedSignals.length) {
      nextSteps.push(
        'Promote the clearest confirmed signals into the next build-direction tool.'
      );
    }

    if (stillOpen.length) {
      nextSteps.push(
        'Use the consultation to resolve the most important open questions without forcing weak decisions.'
      );
    }

    if (followUps.length) {
      nextSteps.push(
        'Capture notes by truth so the emotional and practical logic behind the build stays visible.'
      );
    }

    return {
      overview,
      trustedSignals,
      changedSignals: [],
      conflictedSignals: [],
      stillOpen,
      followUps,
      builderResearch: [],
      confidenceRows,
      nextSteps,
    };
  }, [truthBoards]);

  useEffect(() => {
    if (!intakeLocked || !consultLocked || summaryGenerated) return;

    updateDiscoveryWorkspace((current) => ({
      ...current,
      summary: {
        ...(current?.summary || {}),
        generated: true,
        generatedAt: new Date().toISOString(),
        editableText: generatedIntelliSummary.overview,
        structured: generatedIntelliSummary,
      },
    }));
  }, [consultLocked, generatedIntelliSummary, intakeLocked, summaryGenerated]);

  const summaryText =
    summaryState?.editableText || generatedIntelliSummary.overview || '';

  const callRhythmSections = [
    {
      key: 'agenda',
      title: 'Call agenda',
      bullets: [
        'Welcome and set the tone',
        'Briefly frame the four truths: Voice, Feel, Purpose, and Legacy',
        'Confirm what already feels strong from intake',
        'Clarify anything that still feels soft, unclear, or emotionally important',
        'Talk about the artist behind the drum — not just the spec direction',
        'Wrap with what feels locked, what stays open, and what happens next',
      ],
    },
    {
      key: 'opening',
      title: 'Opening script',
      script:
        'Thanks again for taking the time to do this. My goal today is not to force decisions too quickly. I just want to understand what already feels true, where we still need to listen more carefully, and how this drum can become something genuinely meaningful for you.',
    },
    {
      key: 'truths',
      title: 'How I frame the build',
      script:
        'Every SoundLegend build begins with four truths: Voice, Feel, Purpose, and Legacy. The goal is not to rush through them — it is to understand how they come together so the drum feels honest, personal, and lasting.',
    },
  ];

  return (
    <div className="idv-shell">
      <div className="idv-header">
        <div>
          <div className="idv-kicker">Intake & Direction</div>
          <h3 className="idv-title">Discovery Workspace</h3>
          <p className="idv-subtitle">
            Every SoundLegend build begins with four truths: Voice, Feel,
            Purpose, and Legacy. This workspace helps turn the intake and the
            consultation into something more useful than scattered notes.
          </p>
        </div>
      </div>

      <div className="idv-timeline">
        <div className="idv-timeline-chip">
          <span className="idv-timeline-label">Questionnaire</span>
          <span
            className={`idv-status-pill ${
              questionnaireReceived ? 'is-good' : 'is-soft'
            }`}
          >
            {questionnaireStatus}
          </span>
        </div>

        <div className="idv-timeline-chip">
          <span className="idv-timeline-label">Intake Review</span>
          <span
            className={`idv-status-pill ${
              intakeLocked ? 'is-good' : 'is-soft'
            }`}
          >
            {intakeStatusLabel}
          </span>
        </div>

        <div className="idv-timeline-chip">
          <span className="idv-timeline-label">Consultation</span>
          <span
            className={`idv-status-pill ${
              consultLocked ? 'is-good' : 'is-soft'
            }`}
          >
            {consultStatusLabel}
          </span>
        </div>

        <div className="idv-timeline-chip">
          <span className="idv-timeline-label">IntelliSummary</span>
          <span
            className={`idv-status-pill ${
              summaryGenerated ? 'is-good' : 'is-soft'
            }`}
          >
            {summaryGenerated ? 'Generated' : 'Waiting'}
          </span>
        </div>
      </div>

      {summaryGenerated && (
        <section className="idv-summary-hero">
          <button
            type="button"
            className="idv-section-toggle"
            onClick={() => setSummaryOpen((prev) => !prev)}
          >
            <div className="idv-section-toggle-copy">
              <span className="idv-section-kicker">
                Discovery IntelliSummary
              </span>
              <h4>Reviewed intake + consult handoff</h4>
              <p>
                This becomes the useful discovery handoff into the next stage of
                the Ober build process.
              </p>
            </div>
            <div className="idv-section-toggle-right">
              <span className="idv-status-pill is-good">Generated</span>
              <span className="idv-toggle-icon">{summaryOpen ? '−' : '+'}</span>
            </div>
          </button>

          {summaryOpen && (
            <div className="idv-section-body">
              <div className="idv-card">
                <div className="idv-card-head">
                  <span className="idv-card-kicker">Editable Summary</span>
                  <h5>Builder-facing discovery handoff</h5>
                </div>

                <textarea
                  className="idv-textarea idv-summary-textarea"
                  rows={5}
                  value={summaryText}
                  onChange={(e) =>
                    updateSummaryMeta({
                      editableText: e.target.value,
                    })
                  }
                  placeholder="The discovery handoff summary will appear here once questionnaire review and consultation are both completed."
                />
              </div>

              <div className="idv-grid-2">
                <div className="idv-card">
                  <div className="idv-card-head">
                    <span className="idv-card-kicker">Trusted Signals</span>
                    <h5>Safe to carry forward</h5>
                  </div>

                  {generatedIntelliSummary.trustedSignals.length ? (
                    <div className="idv-list-stack">
                      {generatedIntelliSummary.trustedSignals.map((item) => (
                        <div key={item.label} className="idv-info-row">
                          <div className="idv-info-row-top">
                            <strong>{item.label}</strong>
                            <span className="idv-confidence-pill is-high">
                              HIGH
                            </span>
                          </div>
                          <div className="idv-info-row-value">{item.value}</div>
                          <p>{item.rationale}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="idv-empty">
                      No strong reviewed signals yet.
                    </div>
                  )}
                </div>

                <div className="idv-card">
                  <div className="idv-card-head">
                    <span className="idv-card-kicker">Still Open</span>
                    <h5>Areas still needing care</h5>
                  </div>

                  {generatedIntelliSummary.stillOpen.length ? (
                    <ul className="idv-list">
                      {generatedIntelliSummary.stillOpen.map((item) => (
                        <li key={item.label}>
                          <strong>{item.label}:</strong> {item.note}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="idv-empty">
                      No major open areas detected.
                    </div>
                  )}
                </div>
              </div>

              <div className="idv-card">
                <div className="idv-card-head">
                  <span className="idv-card-kicker">
                    Confidence By Category
                  </span>
                  <h5>Why the summary trusts what it trusts</h5>
                </div>

                <div className="idv-confidence-table">
                  {generatedIntelliSummary.confidenceRows.map((row) => (
                    <div key={row.label} className="idv-confidence-row">
                      <div className="idv-confidence-main">
                        <strong>{row.label}</strong>
                        <div className="idv-confidence-value">
                          {getDisplayValue(row.value)}
                        </div>
                      </div>
                      <div className="idv-confidence-side">
                        <span
                          className={`idv-confidence-pill is-${
                            row.confidence || 'unknown'
                          }`}
                        >
                          {(row.confidence || 'unknown').toUpperCase()}
                        </span>
                        <p>{row.rationale}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="idv-section">
        <button
          type="button"
          className="idv-section-toggle"
          onClick={() => setIntakeOpen((prev) => !prev)}
        >
          <div className="idv-section-toggle-copy">
            <span className="idv-section-kicker">Section 1</span>
            <h4>Questionnaire Intake</h4>
            <p>
              Review the questionnaire through the lens of the four truths so
              the call begins with something more intentional than scattered
              preferences.
            </p>
          </div>
          <div className="idv-section-toggle-right">
            <span
              className={`idv-status-pill ${
                intakeLocked ? 'is-good' : 'is-soft'
              }`}
            >
              {intakeLocked ? 'Reviewed' : questionnaireStatus}
            </span>
            <span className="idv-toggle-icon">{intakeOpen ? '−' : '+'}</span>
          </div>
        </button>

        {intakeOpen && (
          <div className="idv-section-body">
            <div className="idv-card">
              <div className="idv-card-head">
                <span className="idv-card-kicker">Four Truths Snapshot</span>
                <h5>How the intake is beginning to speak</h5>
              </div>

              <div className="idv-truth-board">
                {truthBoards.map((truth) => (
                  <div key={truth.key} className="idv-truth-card">
                    <div className="idv-truth-top">
                      <span className="idv-truth-badge">{truth.badge}</span>
                      <div>
                        <strong>{truth.title}</strong>
                        <p>{truth.summary}</p>
                      </div>
                    </div>

                    <div className="idv-truth-stats">
                      <span className="idv-status-pill is-good">
                        Locked: {truth.confirmedItems.length}
                      </span>
                      <span className="idv-status-pill is-medium">
                        Verify: {truth.verifyItems.length}
                      </span>
                      <span className="idv-status-pill is-soft">
                        Open: {truth.clarifyItems.length}
                      </span>
                    </div>

                    <ul className="idv-list">
                      {truth.items.slice(0, 3).map((item) => (
                        <li key={item.fieldId}>
                          <strong>{item.label}:</strong>{' '}
                          {getDisplayValue(item.finalValue)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="idv-action-row idv-action-row--end">
                <button
                  type="button"
                  className="idv-btn idv-btn-primary"
                  onClick={handleMarkIntakeComplete}
                  disabled={intakeLocked || !questionnaireReceived}
                >
                  {intakeLocked
                    ? 'Questionnaire Intake Locked'
                    : 'Mark Intake Reviewed'}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="idv-section">
        <button
          type="button"
          className="idv-section-toggle"
          onClick={() => setConsultOpen((prev) => !prev)}
        >
          <div className="idv-section-toggle-copy">
            <span className="idv-section-kicker">Section 2</span>
            <h4>Consultation Validation</h4>
            <p>
              Use the consultation to confirm, clarify, and emotionally deepen
              what the questionnaire surfaced.
            </p>
          </div>
          <div className="idv-section-toggle-right">
            <span
              className={`idv-status-pill ${
                consultLocked ? 'is-good' : 'is-soft'
              }`}
            >
              {consultLocked ? 'Completed' : 'Active'}
            </span>
            <span className="idv-toggle-icon">{consultOpen ? '−' : '+'}</span>
          </div>
        </button>

        {consultOpen && (
          <div className="idv-section-body">
            <div className="idv-card idv-card-full">
              <div className="idv-card-head">
                <span className="idv-card-kicker">Call Rhythm</span>
                <h5>Cheat sheet for how the conversation should feel</h5>
              </div>

              <div className="idv-call-rhythm-stack">
                {callRhythmSections.map((section) => (
                  <div key={section.key} className="idv-call-rhythm-card">
                    <div className="idv-call-rhythm-title">{section.title}</div>

                    {section.script ? (
                      <p className="idv-call-rhythm-script">{section.script}</p>
                    ) : null}

                    {section.bullets?.length ? (
                      <ul className="idv-list">
                        {section.bullets.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="idv-card idv-card-full">
              <div className="idv-card-head">
                <span className="idv-card-kicker">Four Truths Checklist</span>
                <h5>Confirm the build through Voice, Feel, Purpose, and Legacy</h5>
              </div>

              <div className="idv-truth-checklist-grid">
                {truthBoards.map((truth) => (
                  <div key={truth.key} className="idv-truth-checklist-card">
                    <div className="idv-truth-checklist-head">
                      <div className="idv-truth-top">
                        <span className="idv-truth-badge">{truth.badge}</span>
                        <div>
                          <strong>{truth.title}</strong>
                          <p>{truth.summary}</p>
                        </div>
                      </div>
                    </div>

                    <div className="idv-truth-checklist-items">
                      {truth.items.map((item) => (
                        <div key={item.fieldId} className="idv-truth-item-card">
                          <div className="idv-truth-item-top">
                            <strong>{item.label}</strong>
                            <span
                              className={`idv-status-pill ${getReviewStatePillClass(
                                item.reviewState
                              )}`}
                            >
                              {item.reviewState === 'confirmed'
                                ? 'Locked In'
                                : item.reviewState === 'verify'
                                  ? 'Needs Confirming'
                                  : 'Open Question'}
                            </span>
                          </div>

                          <div className="idv-truth-item-value">
                            {getDisplayValue(item.finalValue)}
                          </div>

                          <div className="idv-field" style={{ marginTop: 10 }}>
                            <label className="idv-field-label">Move Item</label>
                            <select
                              value={item.reviewState}
                              onChange={(e) =>
                                updateTruthRow(truth.key, item.fieldId, {
                                  reviewState: e.target.value,
                                  checked: e.target.value === 'confirmed',
                                })
                              }
                              disabled={consultLocked}
                            >
                              {REVIEW_STATE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="idv-field" style={{ marginTop: 10 }}>
                            <label className="idv-field-label">Notes</label>
                            <textarea
                              className="idv-textarea"
                              rows={3}
                              value={item.notes}
                              onChange={(e) =>
                                updateTruthRow(truth.key, item.fieldId, {
                                  notes: e.target.value,
                                })
                              }
                              disabled={consultLocked}
                              placeholder={`Any notes about how ${truth.title.toLowerCase()} is becoming clearer here...`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="idv-card idv-card-full">
              <div className="idv-card-head">
                <span className="idv-card-kicker">Actions</span>
                <h5>Consult processing</h5>
              </div>

              <div className="idv-action-stack">
                <button
                  type="button"
                  className="idv-btn idv-btn-secondary"
                  onClick={handleGenerateConsultationSummary}
                  disabled={
                    consultLocked ||
                    storyEngineRunning ||
                    isNormalizingTranscript ||
                    !cleanText(storyEngineData?.consultationTranscript)
                  }
                >
                  {isNormalizingTranscript
                    ? 'Processing…'
                    : 'Format + Summarize Call'}
                </button>

                <button
                  type="button"
                  className="idv-btn idv-btn-primary"
                  onClick={handleMarkConsultComplete}
                  disabled={consultLocked}
                >
                  {consultLocked
                    ? 'Consultation Locked'
                    : 'Mark Consultation Complete'}
                </button>
              </div>

              <div className="idv-meta-row" style={{ marginTop: 14 }}>
                <div className="idv-meta-chip">
                  <span className="idv-meta-label">Transcript</span>
                  <strong>
                    {cleanText(storyEngineData?.consultationTranscript)
                      ? 'Added'
                      : 'Missing'}
                  </strong>
                </div>

                <div className="idv-meta-chip">
                  <span className="idv-meta-label">Internal Notes</span>
                  <strong>
                    {cleanText(storyEngineData?.adminNotes)
                      ? 'Added'
                      : 'Missing'}
                  </strong>
                </div>

                <div className="idv-meta-chip">
                  <span className="idv-meta-label">Completed At</span>
                  <strong>{safeDateLabel(consultState?.completedAt)}</strong>
                </div>
              </div>
            </div>

            <div className="idv-grid-2">
              <div className="idv-card">
                <div className="idv-card-head">
                  <span className="idv-card-kicker">Call Capture</span>
                  <h5>Paste consultation transcript</h5>
                </div>

                <textarea
                  className="idv-textarea idv-textarea-tall"
                  rows={14}
                  value={storyEngineData?.consultationTranscript || ''}
                  onChange={(e) => {
                    if (consultLocked) return;
                    setStoryEngineData((prev) => ({
                      ...prev,
                      consultationTranscript: e.target.value,
                    }));
                  }}
                  disabled={consultLocked}
                  placeholder="Paste the consultation transcript here..."
                />
              </div>

              <div className="idv-card">
                <div className="idv-card-head">
                  <span className="idv-card-kicker">Craftsman Notes</span>
                  <h5>Internal-only observations</h5>
                </div>

                <textarea
                  className="idv-textarea idv-textarea-tall"
                  rows={14}
                  value={storyEngineData?.adminNotes || ''}
                  onChange={(e) => {
                    if (consultLocked) return;
                    setStoryEngineData((prev) => ({
                      ...prev,
                      adminNotes: e.target.value,
                    }));
                  }}
                  disabled={consultLocked}
                  placeholder="Builder observations, emotional cues, contradictions, meaningful notes, and things worth protecting..."
                />
              </div>
            </div>

            {!!smartTranscriptTurns.length && (
              <div className="idv-card">
                <div className="idv-card-head">
                  <span className="idv-card-kicker">
                    Formatted Conversation
                  </span>
                  <h5>Transcript preview</h5>
                </div>

                <div className="idv-thread">
                  {smartTranscriptTurns.map((turn, idx) => (
                    <div
                      key={turn?.id || `turn-${idx}`}
                      className={`idv-thread-row ${
                        turn?.speaker === 'Ober Artisan'
                          ? 'is-builder'
                          : 'is-artist'
                      }`}
                    >
                      <div className="idv-thread-speaker">
                        {turn?.speaker || 'Artist'}
                      </div>
                      <div className="idv-thread-bubble">
                        {turn?.text || ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default IntakeDirectionSection;