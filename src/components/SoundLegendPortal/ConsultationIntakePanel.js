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
  onCancel,
  isSaving = false,
  title = 'Consultation Intake',
  subtitle = 'Capture discovery details that will seed the SoundLegend story.',
}) {
  const [formState, setFormState] = useState(() =>
    normalizeIncomingIntake(value)
  );
  const [expandedSections, setExpandedSections] = useState(() =>
    CONSULTATION_INTAKE_SECTIONS.reduce((acc, section, index) => {
      acc[section.id] = index < 2;
      return acc;
    }, {})
  );

  useEffect(() => {
    setFormState(normalizeIncomingIntake(value));
  }, [value]);

  const sectionCompletion = useMemo(() => {
    return CONSULTATION_INTAKE_SECTIONS.reduce((acc, section) => {
      const fields = Array.isArray(section.fields) ? section.fields : [];
      const completedCount = fields.filter((field) => {
        const val = formState?.[section.id]?.[field.id];

        if (field.type === 'boolean') return typeof val === 'boolean';
        if (field.type === 'multiSelect') return Array.isArray(val) && val.length > 0;
        if (field.type === 'scale') return val !== '' && val !== null && val !== undefined;
        return String(val ?? '').trim() !== '';
      }).length;

      acc[section.id] = {
        completedCount,
        totalCount: fields.length,
      };

      return acc;
    }, {});
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

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleSave = () => {
    if (typeof onSave === 'function') {
      onSave(formState);
    }
  };

  const renderTextLikeField = (section, field, isTextArea = false) => {
    const value = formState?.[section.id]?.[field.id] ?? '';

    if (isTextArea) {
      return (
        <textarea
          className="cip-field-textarea"
          rows={field.rows || 4}
          value={value}
          placeholder={field.placeholder || ''}
          onChange={(e) => updateField(section.id, field.id, e.target.value)}
        />
      );
    }

    return (
      <input
        className="cip-field-input"
        type={field.type === 'number' ? 'number' : field.type}
        value={value}
        min={field.min}
        max={field.max}
        step={field.step}
        placeholder={field.placeholder || ''}
        onChange={(e) => updateField(section.id, field.id, e.target.value)}
      />
    );
  };

  const renderSelectField = (section, field) => {
    const value = formState?.[section.id]?.[field.id] ?? '';
    const otherFieldKey = `${field.id}Other`;
    const otherValue = formState?.[section.id]?.[otherFieldKey] ?? '';
    const showOther = field.allowOther && value === 'Other';

    return (
      <div className="cip-field-stack">
        <select
          className="cip-field-select"
          value={value}
          onChange={(e) => updateField(section.id, field.id, e.target.value)}
        >
          <option value="">Select…</option>
          {(field.options || []).map((option) => {
            const optionValue =
              typeof option === 'string' ? option : option.value || '';
            const optionLabel =
              typeof option === 'string' ? option : option.label || option.value || '';

            return (
              <option key={optionValue} value={optionValue}>
                {optionLabel}
              </option>
            );
          })}
        </select>

        {showOther ? (
          <input
            className="cip-field-input"
            type="text"
            value={otherValue}
            placeholder="Enter custom value"
            onChange={(e) =>
              updateField(section.id, otherFieldKey, e.target.value)
            }
          />
        ) : null}
      </div>
    );
  };

  const renderBooleanField = (section, field) => {
    const value = !!formState?.[section.id]?.[field.id];

    return (
      <button
        type="button"
        className={`cip-boolean-toggle ${value ? 'is-on' : 'is-off'}`}
        onClick={() => updateField(section.id, field.id, !value)}
      >
        <span className="cip-boolean-toggle-track">
          <span className="cip-boolean-toggle-knob" />
        </span>
        <span className="cip-boolean-toggle-label">{value ? 'Yes' : 'No'}</span>
      </button>
    );
  };

  const renderScaleField = (section, field) => {
    const value = Number(formState?.[section.id]?.[field.id] || 0);

    return (
      <div className="cip-scale-group">
        {(field.options || []).map((option) => {
          const optionValue =
            typeof option === 'number' ? option : Number(option.value);
          const optionLabel =
            typeof option === 'string'
              ? option
              : option.label || String(option.value);

          return (
            <button
              key={`${field.id}-${optionValue}`}
              type="button"
              className={`cip-scale-pill ${value === optionValue ? 'is-active' : ''}`}
              onClick={() => updateField(section.id, field.id, optionValue)}
            >
              {optionLabel}
            </button>
          );
        })}
      </div>
    );
  };

  const renderMultiSelectField = (section, field) => {
    const selected = ensureArray(formState?.[section.id]?.[field.id]);
    const otherFieldKey = `${field.id}Other`;
    const otherValue = formState?.[section.id]?.[otherFieldKey] ?? '';
    const showOther = field.allowOther && selected.includes('Other');

    const toggleValue = (optionValue) => {
      const alreadySelected = selected.includes(optionValue);
      const next = alreadySelected
        ? selected.filter((item) => item !== optionValue)
        : [...selected, optionValue];

      updateField(section.id, field.id, next);
    };

    return (
      <div className="cip-field-stack">
        <div className="cip-chip-group">
          {(field.options || []).map((option) => {
            const optionValue =
              typeof option === 'string' ? option : option.value || '';
            const optionLabel =
              typeof option === 'string' ? option : option.label || option.value || '';
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

        {showOther ? (
          <input
            className="cip-field-input"
            type="text"
            value={otherValue}
            placeholder="Add custom entry"
            onChange={(e) =>
              updateField(section.id, otherFieldKey, e.target.value)
            }
          />
        ) : null}
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

      case 'boolean':
        return renderBooleanField(section, field);

      case 'scale':
        return renderScaleField(section, field);

      default:
        return renderTextLikeField(section, field, false);
    }
  };

  return (
    <div className="cip-shell">
      <div className="cip-header">
        <div className="cip-header-copy">
          <div className="cip-kicker">Admin Only</div>
          <h3 className="cip-title">{title}</h3>
          <p className="cip-subtitle">{subtitle}</p>
        </div>

        <div className="cip-header-actions">
          {typeof onCancel === 'function' ? (
            <button
              type="button"
              className="cip-btn cip-btn--ghost"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancel
            </button>
          ) : null}

          <button
            type="button"
            className="cip-btn cip-btn--primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving…' : 'Save Intake'}
          </button>
        </div>
      </div>

      <div className="cip-sections">
        {CONSULTATION_INTAKE_SECTIONS.map((section) => {
          const isExpanded = !!expandedSections[section.id];
          const completion = sectionCompletion?.[section.id] || {
            completedCount: 0,
            totalCount: 0,
          };

          return (
            <div key={section.id} className="cip-section-card">
              <button
                type="button"
                className="cip-section-header"
                onClick={() => toggleSection(section.id)}
              >
                <div className="cip-section-header-left">
                  <div className="cip-section-title-row">
                    <div className="cip-section-title">{section.title}</div>
                    <div className="cip-section-count">
                      {completion.completedCount}/{completion.totalCount}
                    </div>
                  </div>
                  <div className="cip-section-description">
                    {section.description}
                  </div>
                </div>

                <div className={`cip-section-chevron ${isExpanded ? 'is-open' : ''}`}>
                  ▾
                </div>
              </button>

              {isExpanded ? (
                <div className="cip-section-body">
                  <div className="cip-fields-grid">
                    {section.fields.map((field) => {
                      const isWide =
                        field.type === 'textarea' ||
                        field.type === 'multiSelect' ||
                        field.type === 'scale';

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
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ConsultationIntakePanel;