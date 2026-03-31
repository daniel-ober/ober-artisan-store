import React, { useEffect, useRef, useState } from 'react';
import {
  CONSULTATION_INTAKE_SECTIONS,
  buildConsultationIntakeDefaults,
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

function ConsultationIntakePanel({
  value,
  onChange,
  isSaving = false,
  readOnly = false,
  title = 'SoundLegend Questionnaire',
  subtitle = 'This does not lock anything in. It simply gives us a clearer starting point before your consultation.',
}) {
  const [formState, setFormState] = useState(() =>
    normalizeIncomingIntake(value)
  );

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
          const optionValue =
            typeof option === 'string' ? option : option.value || '';
          const optionLabel =
            typeof option === 'string'
              ? option
              : option.label || option.value || '';

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
          const optionValue =
            typeof option === 'string' ? option : option.value || '';
          const optionLabel =
            typeof option === 'string'
              ? option
              : option.label || option.value || '';
          const isActive = selected.includes(optionValue);

          return (
            <button
              key={`${field.id}-${optionValue}`}
              type="button"
              className={`cip-chip ${isActive ? 'is-active' : ''} ${
                readOnly ? 'is-readonly' : ''
              }`}
              onClick={() => toggleValue(optionValue)}
              disabled={readOnly}
              aria-pressed={isActive}
            >
              {optionLabel}
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

  const section = CONSULTATION_INTAKE_SECTIONS[0];

  if (!section) return null;

  return (
    <div className="cip-shell">
      <div className="cip-header">
        <div className="cip-header-copy">
          <div className="cip-kicker">
            {readOnly ? 'Questionnaire Submitted' : 'Private Questionnaire'}
          </div>
          <h3 className="cip-title">{title}</h3>
          <p className="cip-subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="cip-section-card">
        <div className="cip-section-body">
          <div className="cip-fields-stack">
            {section.fields.map((field, index) => {
              const isWide =
                field.type === 'textarea' || field.type === 'multiSelect';

              return (
                <div
                  key={field.id}
                  className={`cip-field-card ${
                    isWide ? 'cip-field-card--wide' : ''
                  }`}
                >
                  <div className="cip-field-card-topline">
                    <div className="cip-field-step">
                      Question {index + 1}
                    </div>
                  </div>

                  <label className="cip-field-label">{field.label}</label>

                  {field.placeholder ? (
                    <div className="cip-field-helper">{field.placeholder}</div>
                  ) : null}

                  <div className="cip-field-control">
                    {renderField(section, field)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {!readOnly && (
        <div className="cip-footer">
          <div className="cip-autosave-note">
            {isSaving
              ? 'Saving your answers…'
              : 'Your answers save automatically as you go.'}
          </div>
        </div>
      )}
    </div>
  );
}

export default ConsultationIntakePanel;