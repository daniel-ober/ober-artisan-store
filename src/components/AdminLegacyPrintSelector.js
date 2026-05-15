// src/components/AdminLegacyPrintSelector.js

import React, { useMemo, useState } from 'react';

import './AdminLegacyPrintSelector.css';

const SELECTOR_GROUPS = [
  {
    key: 'referenceTarget',

    title: 'Reference Target',

    fields: [
      'drumType',

      'nonOberCompanyType',

      'nonOberCompanyName',

      'nonOberLineName',

      'nonOberModelName',
    ],
  },

  {
    key: 'foundation',

    title: 'Foundation',

    fields: [
      'diameter',

      'depth',

      'thickness',

      'lugCount',

      'staveCount',

      'nonOberBaselineConstruction',

      'nonOberMaterial',

      'nonOberThicknessGroup',

      'nonOberLineSoundFocus',
    ],
  },

  {
    key: 'shellConstruction',

    title: 'Shell Construction',

    fields: [
      'soundLegendConstructionType',

      'soundLegendWoodSpeciesCount',

      'soundLegendWoodSpeciesPrimary',

      'soundLegendWoodSpeciesSecondary',

      'soundLegendWoodSpeciesTertiary',

      'soundLegendWoodSpeciesQuaternary',

      'coreStaveShell',

      'steamBentExterior',

      'soundLegendVeneerExterior',

      'nonOberPlyLayupStyle',

      'nonOberReinforcementRings',

      'nonOberBeadedShell',
    ],
  },

  {
    key: 'finish',

    title: 'Finish',

    fields: ['finish', 'stainOption', 'exteriorScorch', 'finishCoating'],
  },

  {
    key: 'response',

    title: 'Response',

    fields: ['hoopType', 'bearingEdge', 'snareBed', 'snareWires'],
  },

  {
    key: 'headsAndTuning',

    title: 'Heads & Tuning',

    fields: ['batterHead', 'resoHead', 'tension'],
  },
];

const normalizeText = (value = '') => {
  return String(value || '')
    .toLowerCase()

    .replace(/[øØ]/g, 'o')

    .replace(/[^a-z0-9]+/g, ' ')

    .trim();
};

const isHeritageConstruction = (construction = '') => {
  return normalizeText(construction).includes('heritage');
};

const isFeuzonConstruction = (construction = '') => {
  return normalizeText(construction).includes('feuzon');
};

const isSoundLegendConstruction = (construction = '') => {
  return normalizeText(construction).includes('soundlegend');
};

const isHeritageOrFeuzonConstruction = (construction = '') => {
  return (
    isHeritageConstruction(construction) || isFeuzonConstruction(construction)
  );
};

const soundLegendTypeUsesHybridShell = (constructionType = '') => {
  return normalizeText(constructionType).includes('hybrid');
};

const soundLegendTypeUsesVeneer = (constructionType = '') => {
  return normalizeText(constructionType).includes('veneer');
};

const STOCK_TEXT_ONLY_FIELDS = ['snareWires', 'batterHead', 'resoHead'];

const isStockTextOnlyField = ({ selector, fieldKey, options = [] }) => {
  if (!isHeritageOrFeuzonConstruction(selector?.construction)) return false;

  if (!STOCK_TEXT_ONLY_FIELDS.includes(fieldKey)) return false;

  return options.length === 1;
};

const shouldHideField = ({ selector, fieldKey, options = [] }) => {
  if (!options.length) return true;

    if (

    selector?.nonOberCompanyType === 'Generic / Baseline Reference' &&

    fieldKey === 'nonOberBaselineConstruction'

  ) {

    return true;

  }

  const isNonOberReference =
    normalizeText(selector?.construction).includes('generic') ||
    ['Generic Ply Shell', 'Generic Metal Shell'].includes(
      selector?.construction
    );
  if (!isNonOberReference) {
    if (
      [
        'nonOberReferenceTarget',

        'nonOberCompanyType',

        'nonOberCompanyName',

        'nonOberLineName',

        'nonOberModelName',

        'nonOberBaselineConstruction',

        'nonOberMaterial',

        'nonOberThicknessGroup',

        'nonOberLineSoundFocus',

        'nonOberPlyLayupStyle',

        'nonOberReinforcementRings',

        'nonOberBeadedShell',
      ].includes(fieldKey)
    ) {
      return true;
    }
  }

  if (!isSoundLegendConstruction(selector?.construction)) {
    if (
      [
        'soundLegendConstructionType',

        'soundLegendWoodSpeciesCount',

        'soundLegendWoodSpeciesPrimary',

        'soundLegendWoodSpeciesSecondary',

        'soundLegendWoodSpeciesTertiary',

        'soundLegendWoodSpeciesQuaternary',

        'soundLegendVeneerExterior',
      ].includes(fieldKey)
    ) {
      return true;
    }
  }

  if (isNonOberReference) {
    const baselineConstruction = normalizeText(
      selector?.nonOberBaselineConstruction
    );

    if (
      fieldKey === 'nonOberLineSoundFocus' &&
      selector?.nonOberReferenceTarget !== 'Overall Line Sound'
    ) {
      return true;
    }

    if (
      ['diameter', 'depth', 'lugCount'].includes(fieldKey) &&
      selector?.nonOberReferenceTarget === 'Overall Line Sound'
    ) {
      return true;
    }

    if (fieldKey === 'staveCount' && !baselineConstruction.includes('stave')) {
      return true;
    }

    if (
      fieldKey === 'nonOberPlyLayupStyle' &&
      !baselineConstruction.includes('ply')
    ) {
      return true;
    }

    if (
      fieldKey === 'nonOberBeadedShell' &&
      !baselineConstruction.includes('metal')
    ) {
      return true;
    }

    if (
      fieldKey === 'nonOberReinforcementRings' &&
      !['ply', 'steam bent', 'solid'].some((type) =>
        baselineConstruction.includes(type)
      )
    ) {
      return true;
    }
  }

  if (isHeritageConstruction(selector?.construction)) {
    return [
      'exteriorScorch',

      'coreStaveShell',

      'steamBentExterior',

      'topBearingEdge',

      'bottomBearingEdge',
    ].includes(fieldKey);
  }

  if (isFeuzonConstruction(selector?.construction)) {
    return ['scorchDepth', 'topBearingEdge', 'bottomBearingEdge'].includes(
      fieldKey
    );
  }

  if (isSoundLegendConstruction(selector?.construction)) {
    const usesHybridShell = soundLegendTypeUsesHybridShell(
      selector?.soundLegendConstructionType
    );

    const usesVeneer = soundLegendTypeUsesVeneer(
      selector?.soundLegendConstructionType
    );

    if (['coreStaveShell', 'steamBentExterior'].includes(fieldKey)) {
      return !usesHybridShell;
    }

    if (fieldKey === 'soundLegendVeneerExterior') {
      return !usesVeneer;
    }
  }

  return false;
};

const formatSelectorOptionLabel = (option = '') => {
  return String(option || '')
    .replace('Single Drum Type Benchmark', 'Single Drum Type Benchmark')

    .replace('All Drum Type Comparison', 'All Drum Type Comparison')

    .replace('Ober HERITAGE Stave', 'HERITAGE')

    .replace('Ober FEUZØN Hybrid', 'FEUZØN')

    .replace('Ober SOUNDLEGEND Custom', 'SOUNDLEGEND')

    .replace('Generic Ply Shell', 'Ply')

    .replace('Generic Metal Shell', 'Metal')

    .replace('Die Cast', 'Die-Cast')

    .replace('45° Inner / Soft Outer Roundover', '45° Soft')

    .replace(
      '45° inner edge with softened outer roundover',
      '45° inner edge with softened outer roundover'
    )

    .replace('20-strand', '20')

    .replace('16-strand', '16')

    .replace('24-strand', '24')

    .replace('30-strand', '30')

    .replace(
      'PureSound Custom Pro Steel 20-Strand wires',
      'PureSound Custom Pro Steel 20-Strand wires'
    )

    .replace('Remo Coated Ambassador', 'Remo Coated Ambassador')

    .replace('Remo Coated Vintage Ambassador', 'Remo Vintage Ambassador')

    .replace('Remo Controlled Sound Reverse Dot', 'Remo Reverse Dot')

    .replace('Remo Powerstroke 3 Coated', 'Remo Powerstroke 3')

    .replace('Evans HD Dry', 'Evans HD Dry')

    .replace('Evans Genera Dry', 'Evans Genera Dry')

    .replace('Evans UV1 Coated', 'Evans UV1')

    .replace('Aquarian Texture Coated', 'Aquarian Texture')

    .replace('Aquarian Hi-Energy', 'Aquarian Hi-Energy')

    .replace('Remo Ambassador Snare Side', 'Remo Ambassador Side')

    .replace('Remo Ambassador Hazy Snare Side', 'Remo Hazy Side')

    .replace('Remo Diplomat Snare Side', 'Remo Diplomat Side')

    .replace('Remo Emperor Snare Side', 'Remo Emperor Side')

    .replace('Evans Snare Side 200', 'Evans Side 200')

    .replace('Evans Snare Side 300', 'Evans Side 300')

    .replace('Evans Snare Side 500', 'Evans Side 500')

    .replace('Evans Orchestral 300', 'Evans Orch 300')

    .replace('Aquarian Classic Clear Snare Side', 'Aquarian Classic Side')

    .replace('Aquarian Hi-Performance Snare Side', 'Aquarian Hi-Performance')

    .replace('Coated 1-ply', 'Coated 1')

    .replace('Coated 2-ply', 'Coated 2')

    .replace('Controlled 1-ply', 'Control 1')

    .replace('Snare Side Clear', 'Snare Side')

    .replace('Ober Natural Oil', 'Natural')

    .replace('Ober Medium Torch', 'Medium Torch')

    .replace('Ober Light Torch', 'Light Torch')

    .replace('Ober Blackened', 'Blackened')

    .replace('Ober PolyGloss', 'PolyGloss')

    .replace('Light Scorched', 'Light Torch')

    .replace('Medium Scorched', 'Medium Torch')

    .replace('Non-Scorched', 'Non-Scorched')

    .replace('Natural Scorched', 'Natural Scorched');
};

const getGroupSummary = ({ group, selector }) => {
  if (group.key === 'referenceTarget') {
    return [
      selector.nonOberReferenceTarget,

      selector.nonOberCompanyType,

      selector.nonOberCompanyName,

      selector.nonOberLineName,

      selector.nonOberModelName,
    ]

      .filter(Boolean)

      .map(formatSelectorOptionLabel)

      .join(' · ');
  }

  if (group.key === 'foundation') {
    return [
      selector.construction,

      selector.diameter && selector.depth
        ? `${selector.diameter} × ${selector.depth}`
        : '',

      selector.thickness,

      selector.lugCount,

      selector.staveCount,
    ]

      .filter(Boolean)

      .map(formatSelectorOptionLabel)

      .join(' · ');
  }

  if (group.key === 'shellConstruction') {
    return [
      selector.soundLegendWoodSpeciesCount,

      selector.soundLegendWoodSpeciesPrimary,

      selector.soundLegendWoodSpeciesSecondary,

      selector.soundLegendWoodSpeciesTertiary,

      selector.soundLegendWoodSpeciesQuaternary,

      selector.coreStaveShell,

      selector.steamBentExterior,

      selector.soundLegendVeneerExterior,
    ]

      .filter(Boolean)

      .map(formatSelectorOptionLabel)

      .join(' · ');
  }

  if (group.key === 'finish') {
    return [
      selector.finish,

      selector.stainOption,

      selector.exteriorScorch,

      selector.finishCoating,
    ]

      .filter(Boolean)

      .map(formatSelectorOptionLabel)

      .join(' · ');
  }

  if (group.key === 'response') {
    const edgeLabel =
      selector.bearingEdge ||
      [selector.topBearingEdge, selector.bottomBearingEdge]

        .filter(Boolean)

        .join(' / ');

    return [selector.hoopType, edgeLabel, selector.snareBed]

      .filter(Boolean)

      .map(formatSelectorOptionLabel)

      .join(' · ');
  }

  if (group.key === 'headsAndTuning') {
    return [selector.batterHead, selector.resoHead, selector.tension]

      .filter(Boolean)

      .map(formatSelectorOptionLabel)

      .join(' · ');
  }

  return '';
};

const FixedSpecField = ({ label, value, detail = '' }) => {
  return (
    <div className="lp-selector-field lp-selector-fixed-field">
      <div className="lp-selector-field-header">
        <span>{label}</span>
      </div>

      <div className="lp-selector-fixed-value">
        <strong>{value}</strong>

        {detail && <small>{detail}</small>}
      </div>
    </div>
  );
};

const getFieldLabel = ({ field, selector }) => {
  if (
    selector?.nonOberCompanyType === 'Generic / Baseline Reference' &&
    field.key === 'nonOberLineName'
  ) {
    return 'Shell Construction';
  }

  if (
    selector?.nonOberCompanyType === 'Generic / Baseline Reference' &&
    field.key === 'nonOberModelName'
  ) {
    return 'Material / Core Config';
  }

  return field.label;
};

const SelectorButtonField = ({
  field,

  options = [],

  value,

  selector,

  onSelectorChange,
}) => {
  if (
    isStockTextOnlyField({
      selector,

      fieldKey: field.key,

      options,
    })
  ) {
    return (
      <FixedSpecField
        label={field.label}
        value={formatSelectorOptionLabel(options[0])}
        detail="Stock configuration"
      />
    );
  }

  return (
    <div className="lp-selector-field">
      <div className="lp-selector-field-header">
        <span>{getFieldLabel({ field, selector })}</span>{' '}
      </div>

      <div className="lp-selector-option-grid">
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

  const getVisibleFieldsForGroup = (group) => {
    return group.fields

      .map((fieldKey) => fieldsByKey[fieldKey])

      .filter(Boolean)

      .filter((field) => {
        const options = getSelectorOptions({
          calibration,

          field,

          selector,
        });

        return !shouldHideField({
          selector,

          fieldKey: field.key,

          options,
        });
      });
  };

  return (
    <aside className="lp-selector-shell">
      <div className="lp-selector-topbar">
        <div>
          <p>Selector</p>

          <h4>Build Voice Input</h4>
        </div>
      </div>

      <div className="lp-selector-accordion">
        {SELECTOR_GROUPS.map((group) => {
          const visibleFields = getVisibleFieldsForGroup(group);

          if (!visibleFields.length) return null;

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
                    {visibleFields.map((field) => {
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
                          selector={selector}
                          onSelectorChange={onSelectorChange}
                        />
                      );
                    })}

                    {group.key === 'foundation' &&
                      isHeritageConstruction(selector.construction) && (
                        <FixedSpecField
                          label="Construction"
                          value="Northern Red Oak stave shell construction"
                        />
                      )}

                    {group.key === 'foundation' &&
                      isFeuzonConstruction(selector.construction) && (
                        <FixedSpecField
                          label="Construction"
                          value="Hybrid shell: core stave shell with paired steam-bent exterior"
                        />
                      )}

                    {group.key === 'foundation' &&
                      isSoundLegendConstruction(selector.construction) && (
                        <FixedSpecField
                          label="Line"
                          value="Full custom Ober / artist-led builder"
                        />
                      )}
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
