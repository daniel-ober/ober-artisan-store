import React, { useEffect, useMemo, useState } from 'react';
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
  onSave,
  isSaving = false,
  title = 'Your SoundLegend Questionnaire',
  subtitle = 'A few quick questions to help shape your consultation.',
}) {
  const [formState, setFormState] = useState(() =>
    normalizeIncomingIntake(value)
  );

  useEffect(() => {
    setFormState(normalizeIncomingIntake(value));
  }, [value]);

  const completion = useMemo(() => {
    const section = CONSULTATION_INTAKE_SECTIONS[0];
    if (!section) return { completedCount: 0, totalCount: 0 };

    const fields = Array.isArray(section.fields) ? section.fields : [];
    const completedCount = fields.filter((field) => {
      const val = formState?.[section.id]?.[field.id];

      if (field.type === 'multiSelect') {
        return Array.isArray(val) && val.length > 0;
      }

      return String(val ?? '').trim() !== '';
    }).length;

    return {
      completedCount,
      totalCount: fields.length,
    };
  }, [formState]);

  const updateField = (sectionId, fieldId, nextValue) => {
    setFormState((prev) => {
      const next = {
        ...prev,
        [sectionId]: {
          ...(prev?.[sectionId] || {}),
          [fieldId]: nextValue,
        },
      };

      if (typeof onChange === 'function') {
        onChange(next);
      }

      return next;
    });
  };

  const handleSave = () => {
    if (typeof onSave === 'function') {
      onSave(formState);
    }
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
              className={`cip-chip ${isActive ? 'is-active' : ''}`}
              onClick={() => toggleValue(optionValue)}
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
          <div className="cip-kicker">Private Questionnaire</div>
          <h3 className="cip-title">{title}</h3>
          <p className="cip-subtitle">{subtitle}</p>
        </div>

        <div className="cip-header-meta">
          {completion.completedCount}/{completion.totalCount}
        </div>
      </div>

      <div className="cip-section-card">
        <div className="cip-section-body">
          <div className="cip-fields-grid">
            {section.fields.map((field) => {
              const isWide =
                field.type === 'textarea' || field.type === 'multiSelect';

              return (
                <div
                  key={field.id}
                  className={`cip-field-card ${isWide ? 'cip-field-card--wide' : ''}`}
                >
                  <label className="cip-field-label">{field.label}</label>
                  {renderField(section, field)}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="cip-footer">
        <button
          type="button"
          className="cip-btn cip-btn--ghost"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving…' : 'Save Progress'}
        </button>
      </div>
    </div>
  );
}

export default ConsultationIntakePanel;