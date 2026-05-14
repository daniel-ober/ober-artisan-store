// src/components/AdminLegacyPrintSelector.js

import React, { useMemo, useState } from 'react';

import './AdminLegacyPrintSelector.css';

const SELECTOR_GROUPS = [

  {

    key: 'foundation',

    title: 'Foundation',

    fields: ['drumType', 'construction', 'diameter', 'depth', 'thickness'],

  },

  {

    key: 'finish',

    title: 'Finish',

    fields: ['finish'],

  },

  {

    key: 'response',

    title: 'Response',

    fields: ['hoopType', 'bearingEdge', 'snareBed', 'tension', 'snareWires'],

  },

  {

    key: 'heads',

    title: 'Heads',

    fields: ['batterHead', 'resoHead'],

  },

];

const formatSelectorOptionLabel = (option = '') => {

  return String(option || '')

    .replace('Single Drum Type Benchmark', 'Single Drum Type Benchmark')

    .replace('All Drum Type Comparison', 'All Drum Type Comparison')

    .replace('Ober HERITAGE Stave', 'HERITAGE')

    .replace('Ober FEUZØN Hybrid', 'FEUZØN')

    .replace('Ober SOUNDLEGEND Custom', 'SOUNDLEGEND')

    .replace('Generic Ply Shell', 'Ply')

    .replace('Generic Metal Shell', 'Metal')

    .replace('Triple Flange', 'Triple')

    .replace('Die Cast', 'Die-Cast')

    .replace('Balanced Hybrid Edge', 'Balanced Hybrid Edge')

    .replace('Warm Hybrid Edge', 'Warm Hybrid Edge')

    .replace('Modern Precision Edge', 'Modern Precision Edge')

    .replace('45° Inner / Soft Outer Roundover', '45° Soft')

    .replace('Standard', 'Standard')

    .replace('20-strand', '20')

    .replace('16-strand', '16')

    .replace('24-strand', '24')

    .replace('30-strand', '30')

    .replace('Coated 1-ply', 'Coated 1')

    .replace('Coated 2-ply', 'Coated 2')

    .replace('Controlled 1-ply', 'Control 1')

    .replace('Snare Side Clear', 'Snare Side')

    .replace('Ober Natural Oil', 'Natural')

    .replace('Ober Medium Torch', 'Medium')

    .replace('Ober Light Torch', 'Light')

    .replace('Ober Blackened', 'Blackened')

    .replace('Ober PolyGloss', 'PolyGloss');

};

const getGroupSummary = ({ group, selector }) => {

  if (group.key === 'foundation') {

    return `${formatSelectorOptionLabel(selector.construction)} · ${formatSelectorOptionLabel(

      selector.diameter

    )} × ${formatSelectorOptionLabel(selector.depth)} · ${formatSelectorOptionLabel(

      selector.thickness

    )}`;

  }

  if (group.key === 'finish') {

    return formatSelectorOptionLabel(selector.finish);

  }

  if (group.key === 'response') {

    return `${formatSelectorOptionLabel(selector.hoopType)} · ${formatSelectorOptionLabel(

      selector.bearingEdge

    )} · ${formatSelectorOptionLabel(selector.tension)}`;

  }

  if (group.key === 'heads') {

    return `${formatSelectorOptionLabel(selector.batterHead)} · ${formatSelectorOptionLabel(

      selector.resoHead

    )}`;

  }

  return '';

};

const SelectorButtonField = ({

  field,

  options = [],

  value,

  onSelectorChange,

}) => {

  return (

    <div className="lp-selector-field">

      <div className="lp-selector-field-header">

        <span>{field.label}</span>

        {/* {value && <strong>{formatSelectorOptionLabel(value)}</strong>} */}

      </div>

      <div className="lp-selector-option-grid">

        {!options.length && (

          <button type="button" className="lp-selector-option is-disabled" disabled>

            No options

          </button>

        )}

        {options.map((option) => {

          const isActive = value === option;

          return (

            <button

              key={option}

              type="button"

              className={`lp-selector-option ${isActive ? 'is-active' : ''}`}

              title={option}

              onClick={() => onSelectorChange(field.key, option)}

            >

              {formatSelectorOptionLabel(option)}

            </button>

          );

        })}

      </div>

    </div>

  );

};

const AdminLegacyPrintSelector = ({

  selectorFields = [],

  calibration,

  selector,

  getSelectorOptions,

  onSelectorChange,

}) => {

  const [openGroup, setOpenGroup] = useState('foundation');

  const fieldsByKey = useMemo(() => {

    return selectorFields.reduce((acc, field) => {

      acc[field.key] = field;

      return acc;

    }, {});

  }, [selectorFields]);

  const toggleComparisonMode = () => {

    const nextMode =

      selector.comparisonMode === 'Single Drum Type Benchmark'

        ? 'All Drum Type Comparison'

        : 'Single Drum Type Benchmark';

    onSelectorChange('comparisonMode', nextMode);

  };

  return (

    <aside className="lp-selector-shell">

      <div className="lp-selector-topbar">

        <div>

          <p>Selector</p>

          <h4>Build Voice Input</h4>

        </div>

        <button

          type="button"

          className="lp-selector-mode-toggle"

          onClick={toggleComparisonMode}

          title="Toggle comparison mode"

        >

          {formatSelectorOptionLabel(selector.comparisonMode)}

        </button>

      </div>

      <div className="lp-selector-accordion">

        {SELECTOR_GROUPS.map((group) => {

          const isOpen = openGroup === group.key;

          return (

            <section

              key={group.key}

              className={`lp-selector-section ${isOpen ? 'is-open' : ''}`}

            >

              <button

                type="button"

                className="lp-selector-section-trigger"

                onClick={() =>

                  setOpenGroup((current) =>

                    current === group.key ? '' : group.key

                  )

                }

              >

                <span>{group.title}</span>

                <strong>{getGroupSummary({ group, selector })}</strong>

                <em>{isOpen ? '−' : '+'}</em>

              </button>

              {isOpen && (

                <div className="lp-selector-section-body">

                  <div className="lp-selector-fields">

                    {group.fields.map((fieldKey) => {

                      const field = fieldsByKey[fieldKey];

                      if (!field) return null;

                      const options = getSelectorOptions({

                        calibration,

                        field,

                        selector,

                      });

                      return (

                        <SelectorButtonField

                          key={field.key}

                          field={field}

                          options={options}

                          value={selector[field.key] || ''}

                          onSelectorChange={onSelectorChange}

                        />

                      );

                    })}

                  </div>

                </div>

              )}

            </section>

          );

        })}

      </div>

    </aside>

  );

};

export default AdminLegacyPrintSelector;