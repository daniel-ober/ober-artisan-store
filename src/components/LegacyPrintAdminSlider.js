// src/components/LegacyPrintAdminSlider.js

import React from 'react';

import {

  MASTER_WEIGHT_META,

  NODE_SLIDER_META,

  getConfigSliderInterpretation,

  getMasterSliderInterpretation,

  getSliderIntensityLabel,

} from '../utils/legacyPrint/adminSliderMeta';

import './LegacyPrintAdminSlider.css';

const formatSliderValue = (value, mode) => {

  const number = Number(value);

  if (!Number.isFinite(number)) return '0.00';

  if (mode === 'config' && number > 0) {

    return `+${number.toFixed(2)}`;

  }

  return number.toFixed(2);

};

const LegacyPrintAdminSlider = ({

  node,

  value,

  onChange,

  mode = 'config',

  weightKey = '',

  optionLabel = 'This option',

  min,

  max,

  step = 0.01,

}) => {

  const nodeMeta = NODE_SLIDER_META[node];

  const weightMeta = MASTER_WEIGHT_META[weightKey];

  const resolvedMin = min ?? (mode === 'master' ? 0.25 : -1);

  const resolvedMax = max ?? (mode === 'master' ? 1.75 : 1);

  const resolvedValue = Number.isFinite(Number(value)) ? Number(value) : 0;

  const heading =

    mode === 'master' && weightMeta

      ? `${nodeMeta?.label || node} / ${weightMeta.label}`

      : nodeMeta?.label || node;

  const leftLabel =

    mode === 'master' && weightMeta

      ? weightMeta.leftLabel

      : nodeMeta?.leftLabel || 'Less';

  const rightLabel =

    mode === 'master' && weightMeta

      ? weightMeta.rightLabel

      : nodeMeta?.rightLabel || 'More';

  const interpretation =

    mode === 'master'

      ? getMasterSliderInterpretation({

          node,

          value: resolvedValue,

          weightKey,

        })

      : getConfigSliderInterpretation({

          node,

          value: resolvedValue,

          optionLabel,

        });

  const plainMeaning =

    mode === 'master' && weightMeta

      ? weightMeta.plainMeaning

      : nodeMeta?.plainMeaning || '';

  const intensity = getSliderIntensityLabel(resolvedValue, mode);

  return (

    <div className="legacyprint-admin-slider">

      <div className="legacyprint-admin-slider-head">

        <div>

          <span className="legacyprint-admin-slider-label">{heading}</span>

          <strong>{formatSliderValue(resolvedValue, mode)}</strong>

        </div>

        <em>{intensity}</em>

      </div>

      <div className="legacyprint-admin-slider-track-row">

        <span>{leftLabel}</span>

        <input

          type="range"

          min={resolvedMin}

          max={resolvedMax}

          step={step}

          value={resolvedValue}

          onChange={(event) => onChange(Number(event.target.value))}

        />

        <span>{rightLabel}</span>

      </div>

      <div className="legacyprint-admin-slider-copy">

        <p>{interpretation}</p>

        {plainMeaning && <small>{plainMeaning}</small>}

      </div>

    </div>

  );

};

export default LegacyPrintAdminSlider;