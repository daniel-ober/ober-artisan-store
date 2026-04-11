import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CONSULTATION_INTAKE_SECTIONS,
  buildConsultationIntakeDefaults,
  isConsultationIntakeComplete,
} from '../../utils/consultationIntakeSchema';
import './ConsultationIntakePanel.css';

function normalizeIncomingIntake(value = {}) {
  const defaults = buildConsultationIntakeDefaults();
  const merged = { ...defaults };

  Object.keys(defaults).forEach((sectionKey) => {
    merged[sectionKey] = {
      ...defaults[sectionKey],
      ...(value?.[sectionKey] || {}),
    };
  });

  return merged;
}

function ensureArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value].filter(Boolean);
}

function getOptionValue(option) {
  return typeof option === 'string' ? option : option.value || '';
}

function getOptionLabel(option) {
  return typeof option === 'string'
    ? option
    : option.label || option.value || '';
}

function getOptionDescription(option) {
  return typeof option === 'string' ? '' : option.description || '';
}

function isFieldComplete(value, field) {
  if (field?.optional) return true;

  if (field?.type === 'multiSelect') {
    return Array.isArray(value) && value.length > 0;
  }

  return String(value || '').trim() !== '';
}

function isQuestionOptional(question) {
  const fields = Array.isArray(question?.fields) ? question.fields : [];
  if (!fields.length) return false;
  return fields.every((field) => field?.optional);
}

const getMissingFieldIdsForQuestion = (section, question, formState) => {
  const fields = Array.isArray(question?.fields) ? question.fields : [];

  return fields
    .filter((field) => !field?.optional)
    .filter((field) => {
      const value = formState?.[section?.id]?.[field.id];
      return !isFieldComplete(value, field);
    })
    .map((field) => field.id);
};

const getQuestionCountForSection = (section) => {
  const questions = Array.isArray(section?.questions) ? section.questions : [];
  return questions.filter((question) => !isQuestionOptional(question)).length;
};

const getCompletedCountForSection = (section, formState) => {
  const questions = Array.isArray(section?.questions) ? section.questions : [];

  return questions.filter((question) => {
    if (isQuestionOptional(question)) return false;
    return (
      getMissingFieldIdsForQuestion(section, question, formState).length === 0
    );
  }).length;
};

function ConsultationIntakePanel({
  value,
  onChange,
  onSubmit,
  isSaving = false,
  isSubmitting = false,
  readOnly = false,
  title = 'SoundLegend Questionnaire',
  subtitle = 'A few quick sections to help shape a more thoughtful, personal consultation.',
}) {
  const [formState, setFormState] = useState(() =>
    normalizeIncomingIntake(value)
  );
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);

  const [attemptedNext, setAttemptedNext] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const isSyncingFromParentRef = useRef(false);
  const didMountRef = useRef(false);

  useEffect(() => {
    isSyncingFromParentRef.current = true;
    setFormState(normalizeIncomingIntake(value));
  }, [value]);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      isSyncingFromParentRef.current = false;
      return;
    }

    if (isSyncingFromParentRef.current) {
      isSyncingFromParentRef.current = false;
      return;
    }

    if (typeof onChange === 'function') {
      onChange(formState);
    }
  }, [formState, onChange]);

  useEffect(() => {
    setAttemptedNext(false);
    setAttemptedSubmit(false);
  }, [activeSectionIndex]);

  const totalSections = CONSULTATION_INTAKE_SECTIONS.length;
  const activeSection =
    CONSULTATION_INTAKE_SECTIONS[activeSectionIndex] || null;

  const totalQuestionCount = useMemo(() => {
    return CONSULTATION_INTAKE_SECTIONS.reduce(
      (sum, section) => sum + getQuestionCountForSection(section),
      0
    );
  }, []);

  const totalCompletedQuestionCount = useMemo(() => {
    return CONSULTATION_INTAKE_SECTIONS.reduce(
      (sum, section) => sum + getCompletedCountForSection(section, formState),
      0
    );
  }, [formState]);

  const sectionProgressPercent = useMemo(() => {
    if (!totalQuestionCount) return 0;
    return Math.round((totalCompletedQuestionCount / totalQuestionCount) * 100);
  }, [totalCompletedQuestionCount, totalQuestionCount]);

  const intakeComplete = useMemo(
    () => isConsultationIntakeComplete(formState),
    [formState]
  );

  const activeSectionMissingQuestionIds = useMemo(() => {
    if (!activeSection) return [];

    return (activeSection.questions || [])
      .filter(
        (question) =>
          getMissingFieldIdsForQuestion(activeSection, question, formState)
            .length > 0
      )
      .map((question) => question.id);
  }, [activeSection, formState]);

  const activeSectionComplete = activeSectionMissingQuestionIds.length === 0;

  const updateField = (sectionId, fieldId, nextValue) => {
    if (readOnly) return;

    setFormState((prev) => ({
      ...prev,
      [sectionId]: {
        ...(prev?.[sectionId] || {}),
        [fieldId]: nextValue,
      },
    }));
  };

  const renderTextLikeField = (section, field, isTextArea = false) => {
    const fieldValue = formState?.[section.id]?.[field.id] ?? '';

    if (isTextArea) {
      return (
        <textarea
          className="cip-field-textarea"
          rows={field.rows || 4}
          value={fieldValue}
          placeholder={field.placeholder || ''}
          onChange={(e) => updateField(section.id, field.id, e.target.value)}
          readOnly={readOnly}
        />
      );
    }

    return (
      <input
        className="cip-field-input"
        type={field.type === 'number' ? 'number' : field.type}
        value={fieldValue}
        min={field.min}
        max={field.max}
        step={field.step}
        placeholder={field.placeholder || ''}
        onChange={(e) => updateField(section.id, field.id, e.target.value)}
        readOnly={readOnly}
      />
    );
  };

  const renderSelectField = (section, field) => {
    const fieldValue = formState?.[section.id]?.[field.id] ?? '';

    return (
      <select
        className="cip-field-select"
        value={fieldValue}
        onChange={(e) => updateField(section.id, field.id, e.target.value)}
        disabled={readOnly}
      >
        <option value="">Select…</option>
        {(field.options || []).map((option) => {
          const optionValue = getOptionValue(option);
          const optionLabel = getOptionLabel(option);

          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    );
  };

  const renderMultiSelectField = (section, field) => {
    const selected = ensureArray(formState?.[section.id]?.[field.id]);

    const toggleValue = (optionValue) => {
      if (readOnly) return;

      const alreadySelected = selected.includes(optionValue);
      const next = alreadySelected
        ? selected.filter((item) => item !== optionValue)
        : [...selected, optionValue];

      updateField(section.id, field.id, next);
    };

    return (
      <div className="cip-chip-group">
        {(field.options || []).map((option) => {
          const optionValue = getOptionValue(option);
          const optionLabel = getOptionLabel(option);
          const optionDescription = getOptionDescription(option);
          const isActive = selected.includes(optionValue);

          return (
            <button
              key={`${field.id}-${optionValue}`}
              type="button"
              className={`cip-chip ${isActive ? 'is-active' : ''} ${
                readOnly ? 'is-readonly' : ''
              } ${optionDescription ? 'cip-chip--descriptive' : ''}`}
              onClick={() => toggleValue(optionValue)}
              disabled={readOnly}
              aria-pressed={isActive}
            >
              <span className="cip-chip-label">{optionLabel}</span>
              {optionDescription ? (
                <span className="cip-chip-description">
                  {optionDescription}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    );
  };

  const renderField = (section, field) => {
    switch (field.type) {
      case 'text':
      case 'date':
      case 'time':
      case 'number':
        return renderTextLikeField(section, field, false);

      case 'textarea':
        return renderTextLikeField(section, field, true);

      case 'select':
        return renderSelectField(section, field);

      case 'multiSelect':
        return renderMultiSelectField(section, field);

      default:
        return renderTextLikeField(section, field, false);
    }
  };

  if (!activeSection) return null;

  const canGoBack = activeSectionIndex > 0;
  const isLastSection = activeSectionIndex === totalSections - 1;

  const handleNextSection = () => {
    if (readOnly || !activeSection) return;

    setAttemptedNext(true);

    if (!activeSectionComplete) return;

    setAttemptedNext(false);
    setActiveSectionIndex((prev) => prev + 1);
  };

  const handleSubmitClick = () => {
    if (readOnly) return;

    setAttemptedSubmit(true);

    if (!activeSectionComplete || !intakeComplete) return;

    if (typeof onSubmit === 'function') {
      onSubmit();
    }
  };

  return (
    <div className="cip-shell cip-shell--ober">
      <div className="cip-header cip-header--ober">
        <div className="cip-header-copy cip-header-copy--ober">
          <div className="cip-kicker">Private Questionnaire</div>
          <h3 className="cip-title">{title}</h3>
          <p className="cip-subtitle">{subtitle}</p>
          <p className="cip-meta-note">
            This is not meant to feel clinical or rigid. It is simply a
            thoughtful way for us to begin understanding the four truths behind
            your build before the consultation begins.
          </p>
        </div>
      </div>

      <div className="cip-progress-card">
        <div className="cip-progress-topline">
          <div className="cip-progress-copy">
            <span className="cip-progress-label">
              Section {activeSectionIndex + 1} of {totalSections}
            </span>
            <span className="cip-progress-title">{activeSection.title}</span>
          </div>
          <div className="cip-progress-percent">{sectionProgressPercent}%</div>
        </div>

        <div className="cip-progress-track" aria-hidden="true">
          <div
            className="cip-progress-fill"
            style={{ width: `${sectionProgressPercent}%` }}
          />
        </div>

        <div className="cip-step-dots" aria-hidden="true">
          {CONSULTATION_INTAKE_SECTIONS.map((section, index) => (
            <div
              key={section.id}
              className={`cip-step-dot ${
                index === activeSectionIndex ? 'is-active' : ''
              } ${
                getCompletedCountForSection(section, formState) ===
                getQuestionCountForSection(section)
                  ? 'is-complete'
                  : ''
              }`}
            >
              <span className="cip-step-dot-number">{index + 1}</span>
              <span className="cip-step-dot-text">
                {section.shortTitle || section.title}
              </span>
              <span className="cip-step-dot-meta">
                {getCompletedCountForSection(section, formState)}/
                {getQuestionCountForSection(section)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className={`cip-section-card cip-section-card--${activeSection.id || 'default'}`}
      >
        <div className="cip-section-heading">
          <div className="cip-section-kicker">
            {activeSection.truthLabel || 'Focused intake'}
          </div>
          <h4 className="cip-section-title">{activeSection.title}</h4>
          <p className="cip-section-description">{activeSection.description}</p>
        </div>

        {activeSection.storyIntro ? (
          <div className="cip-story-block">
            <div className="cip-story-mark">
              <span className="cip-story-mark-dot" />
              <span className="cip-story-mark-line" />
            </div>
            <div className="cip-story-copy">
              <p>{activeSection.storyIntro}</p>
            </div>
          </div>
        ) : null}

        {(attemptedNext || attemptedSubmit) && !activeSectionComplete ? (
          <div className="cip-section-error">
            Please complete all required answers in this section before
            continuing.
          </div>
        ) : null}

        <div className="cip-section-body">
          <div className="cip-fields-stack">
            {(activeSection.questions || []).map((question, index) => {
              const questionMissing = getMissingFieldIdsForQuestion(
                activeSection,
                question,
                formState
              );
              const questionComplete = questionMissing.length === 0;
              const showQuestionError =
                !questionComplete && (attemptedNext || attemptedSubmit);

              return (
                <div
                  key={question.id}
                  className={`cip-field-card ${
                    showQuestionError ? 'cip-field-card--error' : ''
                  }`}
                >
                  <div className="cip-field-card-topline">
                    <div className="cip-field-step">Question {index + 1}</div>
                    {question.optional ? (
                      <div className="cip-field-optional">Optional</div>
                    ) : null}
                  </div>

                  <label className="cip-field-label">{question.label}</label>

                  {question.helperText ? (
                    <div className="cip-field-helper">
                      {question.helperText}
                    </div>
                  ) : null}

                  <div className="cip-group-fields">
                    {(question.fields || []).map((field) => {
                      const fieldHasError =
                        questionMissing.includes(field.id) &&
                        (attemptedNext || attemptedSubmit);

                      return (
                        <div
                          key={field.id}
                          className={`cip-subfield ${
                            fieldHasError ? 'cip-subfield--error' : ''
                          }`}
                        >
                          {question.fields.length > 1 ? (
                            <label className="cip-subfield-label">
                              {field.label}
                            </label>
                          ) : null}

                          {field.helperText ? (
                            <div className="cip-subfield-helper">
                              {field.helperText}
                            </div>
                          ) : null}

                          <div className="cip-field-control">
                            {renderField(activeSection, field)}
                          </div>

                          {fieldHasError ? (
                            <div className="cip-field-status cip-field-status--error">
                              This answer still needs attention.
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>

                  {showQuestionError ? (
                    <div className="cip-field-status cip-field-status--error">
                      This question still needs a few answers.
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="cip-footer">
        <div className="cip-autosave-note">
          {isSaving
            ? 'Saving your answers…'
            : intakeComplete
              ? 'Everything required has been completed. You can now submit your questionnaire.'
              : isLastSection
                ? 'Please complete all required questions before submitting your questionnaire.'
                : 'Please complete this section before continuing.'}
        </div>

        <div className="cip-footer-actions">
          <button
            type="button"
            className="cip-nav-btn cip-nav-btn--ghost"
            onClick={() =>
              canGoBack && setActiveSectionIndex((prev) => prev - 1)
            }
            disabled={!canGoBack || readOnly || isSubmitting}
          >
            Back
          </button>

          {!isLastSection ? (
            <button
              type="button"
              className="cip-nav-btn cip-nav-btn--primary"
              onClick={handleNextSection}
              disabled={readOnly || isSubmitting}
            >
              Next Section
            </button>
          ) : (
            <button
              type="button"
              className="cip-nav-btn cip-nav-btn--primary"
              onClick={handleSubmitClick}
              disabled={readOnly || isSubmitting}
            >
              {isSubmitting ? 'Submitting…' : 'Submit Questionnaire'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConsultationIntakePanel;
