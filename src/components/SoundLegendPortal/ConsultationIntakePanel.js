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

function ConsultationIntakePanel({
  value,
  onChange,
  onSubmit,
  isSaving = false,
  isSubmitting = false,
  readOnly = false,
  title = 'SoundLegend Questionnaire',
  subtitle = 'We do not want to take more than a few minutes of your time. These are mostly easy select questions, and nothing you choose here is locked in or a commitment by any means.',
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

  const sectionProgressPercent = useMemo(() => {
    if (!totalSections) return 0;
    return Math.round(((activeSectionIndex + 1) / totalSections) * 100);
  }, [activeSectionIndex, totalSections]);

  const intakeComplete = useMemo(
    () => isConsultationIntakeComplete(formState),
    [formState]
  );

  const getFieldValue = (sectionId, fieldId) =>
    formState?.[sectionId]?.[fieldId];

  const isFieldComplete = (section, field) => {
    if (field.optional) return true;

    const value = getFieldValue(section.id, field.id);

    if (field.type === 'multiSelect') {
      return Array.isArray(value) && value.length > 0;
    }

    return String(value || '').trim() !== '';
  };

  const getMissingFieldIdsForSection = (section) =>
    (section?.fields || [])
      .filter((field) => !isFieldComplete(section, field))
      .map((field) => field.id);

  const activeSectionMissingFieldIds = activeSection
    ? getMissingFieldIdsForSection(activeSection)
    : [];

  const activeSectionComplete = activeSectionMissingFieldIds.length === 0;

  const shouldHighlightFieldError = (fieldId) =>
    (attemptedNext || attemptedSubmit) &&
    activeSectionMissingFieldIds.includes(fieldId);

  const shouldHighlightFieldSuccess = (fieldId) =>
    (attemptedNext || attemptedSubmit) &&
    !activeSectionMissingFieldIds.includes(fieldId);

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
  const canGoNext = activeSectionIndex < totalSections - 1;

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
    <div className="cip-shell">
      <div className="cip-header">
        <div className="cip-header-copy">
          <div className="cip-kicker">
            {readOnly ? 'Questionnaire Submitted' : 'Private Questionnaire'}
          </div>
          <h3 className="cip-title">{title}</h3>
          <p className="cip-subtitle">{subtitle}</p>
          <p className="cip-meta-note">
            Most people finish this in under 5 minutes. These are mostly easy
            selections, with one optional write-in question saved for the end.
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
              } ${index < activeSectionIndex ? 'is-complete' : ''} ${
                index > activeSectionIndex ? 'is-locked' : ''
              }`}
            >
              <span className="cip-step-dot-number">{index + 1}</span>
              <span className="cip-step-dot-text">
                {section.shortTitle || section.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="cip-section-card">
        <div className="cip-section-heading">
          <div className="cip-section-kicker">Focused intake</div>
          <h4 className="cip-section-title">{activeSection.title}</h4>
          <p className="cip-section-description">{activeSection.description}</p>
        </div>

        {(attemptedNext || attemptedSubmit) && !activeSectionComplete ? (
          <div className="cip-section-error">
            Please complete all required questions in this section before
            continuing.
          </div>
        ) : null}
        <div className="cip-section-body">
          <div className="cip-fields-stack">
            {activeSection.fields.map((field, index) => {
              const isWide =
                field.type === 'textarea' || field.type === 'multiSelect';

              return (
                <div
                  key={field.id}
                  className={`cip-field-card ${
                    isWide ? 'cip-field-card--wide' : ''
                  } ${
                    shouldHighlightFieldError(field.id)
                      ? 'cip-field-card--error'
                      : ''
                  } ${
                    shouldHighlightFieldSuccess(field.id)
                      ? 'cip-field-card--success'
                      : ''
                  }`}
                >
                  <div className="cip-field-card-topline">
                    <div className="cip-field-step">Question {index + 1}</div>
                    {field.optional ? (
                      <div className="cip-field-optional">Optional</div>
                    ) : null}
                  </div>

                  <label className="cip-field-label">{field.label}</label>

                  {field.helperText ? (
                    <div className="cip-field-helper">{field.helperText}</div>
                  ) : field.placeholder && field.type !== 'textarea' ? (
                    <div className="cip-field-helper">{field.placeholder}</div>
                  ) : null}

                  <div className="cip-field-control">
                    {renderField(activeSection, field)}
                  </div>
                  {shouldHighlightFieldError(field.id) ? (
                    <div className="cip-field-status cip-field-status--error">
                      This question still needs an answer.
                    </div>
                  ) : shouldHighlightFieldSuccess(field.id) ? (
                    <div className="cip-field-status cip-field-status--success">
                      Complete
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
