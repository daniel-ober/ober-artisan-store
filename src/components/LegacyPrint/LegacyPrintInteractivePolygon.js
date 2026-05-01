import React, { useMemo, useState } from 'react';

import { AXIS_COLOR_BY_KEY, MetricIcon } from './legacyPrintVoiceMapData';

const NODE_ORDER = [
  'attack',
  'brightness',
  'projection',
  'sustain',
  'warmth',
  'sensitivity',
  'control',
];

const NODE_LABELS = {
  attack: 'Attack',
  brightness: 'Brightness',
  projection: 'Projection',
  sustain: 'Sustain',
  warmth: 'Warmth',
  sensitivity: 'Sensitivity',
  control: 'Control',
};

const NODE_SUBLABELS = {
  attack: 'Strike',
  brightness: 'Clarity',
  projection: 'Carry',
  sustain: 'Bloom',
  warmth: 'Body',
  sensitivity: 'Touch',
  control: 'Refinement',
};

const SVG_SIZE = 500;

const CENTER = 250;

const RADIUS = 172;

const PLAY_RADIUS = 150;

const PLAY_INNER_RADIUS = 0;

const NODE_ICON_RADIUS = 186;

const GAUGE_RADIUS = 142;

const PLAY_GUIDE_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const DRAW_MODE_DEAD_ZONE_RADIUS = 18;

const DOT_LOCK_RADIUS = 24;

const FILLED_SLICE_LOCK_BUFFER = 12;

const DEFAULT_PLAY_VALUES = {
  attack: 6,
  brightness: 6,
  projection: 6,
  sustain: 6,
  warmth: 6,
  sensitivity: 6,
  control: 6,
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const normalizePlayValues = (values = {}) => ({
  ...DEFAULT_PLAY_VALUES,
  ...values,
});

const hexToRgb = (hex) => {
  const normalized = String(hex || '').replace('#', '');

  const full =
    normalized.length === 3
      ? normalized

          .split('')

          .map((char) => char + char)

          .join('')
      : normalized;

  const int = Number.parseInt(full, 16);

  if (Number.isNaN(int)) {
    return { r: 214, g: 178, b: 119 };
  }

  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
};

const rgbToHex = ({ r, g, b }) =>
  `#${[r, g, b]

    .map((value) => Math.round(value).toString(16).padStart(2, '0'))

    .join('')}`;

const mixHex = (hexA, hexB, weight = 0.5) => {
  const a = hexToRgb(hexA);

  const b = hexToRgb(hexB);

  return rgbToHex({
    r: a.r * (1 - weight) + b.r * weight,
    g: a.g * (1 - weight) + b.g * weight,
    b: a.b * (1 - weight) + b.b * weight,
  });
};

const rgba = (hex, alpha = 1) => {
  const rgb = hexToRgb(hex);

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

const pointOnCircle = (index, radius = RADIUS) => {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / NODE_ORDER.length;

  return {
    x: CENTER + Math.cos(angle) * radius,
    y: CENTER + Math.sin(angle) * radius,
    angle,
  };
};

const polarPoint = (angle, radius) => ({
  x: CENTER + Math.cos(angle) * radius,
  y: CENTER + Math.sin(angle) * radius,
});

const pointsToString = (points) =>
  points.map((point) => `${point.x},${point.y}`).join(' ');

const getRelationshipId = (a, b) => [a, b].sort().join('_');

const relationshipPairs = NODE_ORDER.flatMap((fromKey, fromIndex) =>
  NODE_ORDER.slice(fromIndex + 1).map((toKey) => ({
    id: getRelationshipId(fromKey, toKey),
    fromKey,
    toKey,
  }))
);

const getGaugePoint = (key, value) => {
  const index = NODE_ORDER.indexOf(key);

  const radius = (clamp(Number(value) || 0, 0, 10) / 10) * GAUGE_RADIUS;

  return pointOnCircle(index, radius);
};

const getArcPathByAngles = (startAngle, endAngle, radius = PLAY_RADIUS) => {
  const start = polarPoint(startAngle, radius);

  const end = polarPoint(endAngle, radius);

  const largeArcFlag = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
};

const getNodeSegmentAngles = (index) => {
  const step = (Math.PI * 2) / NODE_ORDER.length;

  const centerAngle = -Math.PI / 2 + index * step;

  const overlap = 0.01;

  return {
    centerAngle,
    startAngle: centerAngle - step / 2 - overlap,
    endAngle: centerAngle + step / 2 + overlap,
  };
};

const getNodeCenteredArcPath = (index, radius = PLAY_RADIUS) => {
  const { startAngle, endAngle } = getNodeSegmentAngles(index);

  return getArcPathByAngles(startAngle, endAngle, radius);
};

const getSliceBoundaryAngle = (index) => {
  const step = (Math.PI * 2) / NODE_ORDER.length;

  return -Math.PI / 2 - step / 2 + index * step;
};

const getSliceCenterAngle = (index) => {
  const step = (Math.PI * 2) / NODE_ORDER.length;

  return -Math.PI / 2 + index * step;
};

const getSlicePath = (index, radius = PLAY_RADIUS, innerRadius = 0) => {
  const startAngle = getSliceBoundaryAngle(index);

  const endAngle = getSliceBoundaryAngle(index + 1);

  const outerStart = polarPoint(startAngle, radius);

  const outerEnd = polarPoint(endAngle, radius);

  const innerEnd = polarPoint(endAngle, innerRadius);

  const innerStart = polarPoint(startAngle, innerRadius);

  const largeArcFlag = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;

  if (innerRadius <= 0) {
    return [
      `M ${CENTER} ${CENTER}`,
      `L ${outerStart.x} ${outerStart.y}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
      'Z',
    ].join(' ');
  }

  return [
    `M ${innerStart.x} ${innerStart.y}`,
    `L ${outerStart.x} ${outerStart.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
};

const normalizeAngle = (angle) => {
  const full = Math.PI * 2;

  return ((angle % full) + full) % full;
};

const getTooltipPosition = (node) => {
  if (!node) {
    return { x: CENTER, y: CENTER };
  }

  const dx = node.x - CENTER;

  const dy = node.y - CENTER;

  const distance = Math.sqrt(dx * dx + dy * dy) || 1;

  const unitX = dx / distance;

  const unitY = dy / distance;

  const outwardOffset = 52;

  let x = node.x + unitX * outwardOffset;

  let y = node.y + unitY * outwardOffset;

  x = clamp(x, 70, SVG_SIZE - 70);

  y = clamp(y, 34, SVG_SIZE - 34);

  return { x, y };
};

const getVisualState = (key, soloNodeKeys = [], muteNodeKeys = []) => {
  const isSoloed = soloNodeKeys.includes(key);

  const isMuted = muteNodeKeys.includes(key);

  const hasSolo = soloNodeKeys.length > 0;

  const hasMute = muteNodeKeys.length > 0;

  return {
    isSoloed,
    isMuted,
    hasSolo,
    hasMute,
    isFocusOtherNode: hasSolo && !isSoloed,
    isDimmedByMuteOnly: !hasSolo && hasMute && isMuted,
    shouldHideSliceColor: hasSolo && !isSoloed,
    shouldGreySliceColor: !hasSolo && isMuted,
  };
};

const LegacyPrintInteractivePolygon = ({
  mode = 'playCycle',
  activeNodeKey = 'attack',
  onSelectNode,
  activeRelationshipId,
  onSelectRelationship,
  gaugeValues,
  finderAnswers = [],
  playValues,
  onPlayValuesChange,
  focusMode = 'full',
  focusNodeKey = null,
  soloNodeKeys = [],
  muteNodeKeys = [],
}) => {
  const [hoveredNodeKey, setHoveredNodeKey] = useState(null);

  const [internalPlayValues, setInternalPlayValues] =
    useState(DEFAULT_PLAY_VALUES);

  const [playInteraction, setPlayInteraction] = useState({
    isActive: false,
    mode: null,
    lockedKey: null,
  });

  const normalizedSoloNodeKeys = Array.isArray(soloNodeKeys)
    ? soloNodeKeys
    : focusMode === 'solo' && focusNodeKey
      ? [focusNodeKey]
      : [];

  const normalizedMuteNodeKeys = Array.isArray(muteNodeKeys)
    ? muteNodeKeys
    : focusMode === 'mute' && focusNodeKey
      ? [focusNodeKey]
      : [];

  const currentPlayValues = normalizePlayValues(
    playValues || internalPlayValues
  );

  const updatePlayValues = (updater) => {
    const nextValues =
      typeof updater === 'function' ? updater(currentPlayValues) : updater;

    if (typeof onPlayValuesChange === 'function') {
      onPlayValuesChange(normalizePlayValues(nextValues));

      return;
    }

    setInternalPlayValues(normalizePlayValues(nextValues));
  };

  const nodePoints = useMemo(
    () =>
      NODE_ORDER.map((key, index) => ({
        key,
        label: NODE_LABELS[key],
        sublabel: NODE_SUBLABELS[key],
        color: AXIS_COLOR_BY_KEY[key] || '#d6b277',
        ...pointOnCircle(index, RADIUS),
      })),
    []
  );

  const outerNodePoints = useMemo(
    () =>
      NODE_ORDER.map((key, index) => ({
        key,
        label: NODE_LABELS[key],
        sublabel: NODE_SUBLABELS[key],
        color: AXIS_COLOR_BY_KEY[key] || '#d6b277',
        ...pointOnCircle(index, NODE_ICON_RADIUS),
      })),
    []
  );

  const gaugeData = useMemo(() => {
    const values = gaugeValues || {
      attack: 6.1,
      brightness: 6.8,
      projection: 7.2,
      sustain: 5.4,
      warmth: 5.7,
      sensitivity: 7.8,
      control: 6.4,
    };

    return NODE_ORDER.map((key) => ({
      key,
      color: AXIS_COLOR_BY_KEY[key] || '#d6b277',
      point: getGaugePoint(key, values[key]),
      value: values[key],
    }));
  }, [gaugeValues]);

  const referencePoints = NODE_ORDER.map((key) => ({
    key,
    point: getGaugePoint(key, 5),
  }));

  const hoveredNode = outerNodePoints.find(
    (node) => node.key === hoveredNodeKey
  );

  const tooltipPosition = getTooltipPosition(hoveredNode);

  const handleNodeClick = (key) => {
    if (typeof onSelectNode === 'function') {
      onSelectNode(key);
    }
  };

  const handleRelationshipClick = (relationship) => {
    if (typeof onSelectRelationship === 'function') {
      onSelectRelationship(relationship.id);
    }
  };

  const getSvgPointerPoint = (event) => {
    const svg = event.currentTarget.ownerSVGElement || event.currentTarget;

    if (!svg || typeof svg.createSVGPoint !== 'function') {
      return null;
    }

    const point = svg.createSVGPoint();

    point.x = event.clientX;

    point.y = event.clientY;

    const ctm = svg.getScreenCTM();

    if (!ctm) {
      return null;
    }

    return point.matrixTransform(ctm.inverse());
  };

  const getPointerSliceInfo = (point) => {
    const dx = point.x - CENTER;

    const dy = point.y - CENTER;

    const distance = Math.sqrt(dx * dx + dy * dy);

    const rawAngle = Math.atan2(dy, dx);

    const step = (Math.PI * 2) / NODE_ORDER.length;

    const startAngle = -Math.PI / 2 - step / 2;

    const normalized = normalizeAngle(rawAngle - startAngle);

    const index = clamp(
      Math.floor(normalized / step),
      0,
      NODE_ORDER.length - 1
    );

    const key = NODE_ORDER[index];

    return {
      key,
      index,
      distance,
      rawAngle,
    };
  };

  const getNearestPlayDotKey = (point) => {
    let nearestKey = null;

    let nearestDistance = Infinity;

    NODE_ORDER.forEach((key, index) => {
      const value = currentPlayValues[key] || 1;

      const valueRadius = (value / 10) * PLAY_RADIUS;

      const centerAngle = getSliceCenterAngle(index);

      const dotPoint = polarPoint(centerAngle, valueRadius);

      const dx = point.x - dotPoint.x;

      const dy = point.y - dotPoint.y;

      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < nearestDistance) {
        nearestDistance = distance;

        nearestKey = key;
      }
    });

    return nearestDistance <= DOT_LOCK_RADIUS ? nearestKey : null;
  };

  const getFilledSliceKey = (point) => {
    const sliceInfo = getPointerSliceInfo(point);

    if (sliceInfo.distance > PLAY_RADIUS + 18) {
      return null;
    }

    const currentValue = currentPlayValues[sliceInfo.key] || 1;

    const currentRadius = (currentValue / 10) * PLAY_RADIUS;

    return sliceInfo.distance <= currentRadius + FILLED_SLICE_LOCK_BUFFER
      ? sliceInfo.key
      : null;
  };

  const getPointerIntent = (point) => {
    const nearestDotKey = getNearestPlayDotKey(point);

    if (nearestDotKey) {
      return {
        mode: 'single',
        lockedKey: nearestDotKey,
      };
    }

    const filledSliceKey = getFilledSliceKey(point);

    if (filledSliceKey) {
      return {
        mode: 'single',
        lockedKey: filledSliceKey,
      };
    }

    return {
      mode: 'draw',
      lockedKey: null,
    };
  };

  const updateVoiceSculptorFromPointer = (
    event,
    interactionOverride = null
  ) => {
    if (mode !== 'voiceSculptor') {
      return;
    }

    const point = getSvgPointerPoint(event);

    if (!point) {
      return;
    }

    const interaction = interactionOverride || playInteraction;

    const sliceInfo = getPointerSliceInfo(point);

    const distance = sliceInfo.distance;

    if (distance > PLAY_RADIUS + 18) {
      return;
    }

    const isSingleSliceAdjust =
      interaction.mode === 'single' && interaction.lockedKey;

    if (!isSingleSliceAdjust && distance < DRAW_MODE_DEAD_ZONE_RADIUS) {
      return;
    }

    const key = isSingleSliceAdjust ? interaction.lockedKey : sliceInfo.key;

    const nextValue = clamp(Math.ceil((distance / PLAY_RADIUS) * 10), 1, 10);

    updatePlayValues((current) => ({
      ...current,
      [key]: nextValue,
    }));

    handleNodeClick(key);

    setHoveredNodeKey(key);
  };

  const handleSculptorPointerDown = (event) => {
    event.preventDefault();

    if (event.currentTarget?.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    const point = getSvgPointerPoint(event);

    if (!point) {
      return;
    }

    const intent = getPointerIntent(point);

    const nextInteraction = {
      isActive: true,
      mode: intent.mode,
      lockedKey: intent.lockedKey,
    };

    setPlayInteraction(nextInteraction);

    updateVoiceSculptorFromPointer(event, nextInteraction);
  };

  const handleSculptorPointerMove = (event) => {
    if (!playInteraction.isActive) {
      return;
    }

    updateVoiceSculptorFromPointer(event, playInteraction);
  };

  const handleSculptorPointerUp = (event) => {
    if (event.currentTarget?.releasePointerCapture) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setPlayInteraction({
      isActive: false,
      mode: null,
      lockedKey: null,
    });
  };

  return (
    <div className={`lp-map-stage lp-map-stage-${mode}`}>
      <svg
        className="lp-map-svg"
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        role="img"
        aria-label="Ober LegacyPrint voice map"
      >
        <defs>
          {NODE_ORDER.map((key, index) => {
            const nextKey = NODE_ORDER[(index + 1) % NODE_ORDER.length];

            const from = pointOnCircle(index, PLAY_RADIUS);

            const to = pointOnCircle(
              (index + 1) % NODE_ORDER.length,
              PLAY_RADIUS
            );

            return (
              <linearGradient
                key={`cycle-${key}-${nextKey}`}
                id={`lpCycleGradient-${key}-${nextKey}`}
                gradientUnits="userSpaceOnUse"
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
              >
                <stop offset="0%" stopColor={AXIS_COLOR_BY_KEY[key]} />

                <stop offset="100%" stopColor={AXIS_COLOR_BY_KEY[nextKey]} />
              </linearGradient>
            );
          })}

          {NODE_ORDER.map((key, index) => {
            const previousKey =
              NODE_ORDER[(index - 1 + NODE_ORDER.length) % NODE_ORDER.length];

            const nextKey = NODE_ORDER[(index + 1) % NODE_ORDER.length];

            const previousColor = AXIS_COLOR_BY_KEY[previousKey];

            const currentColor = AXIS_COLOR_BY_KEY[key];

            const nextColor = AXIS_COLOR_BY_KEY[nextKey];

            const startBlend = mixHex(previousColor, currentColor, 0.5);

            const endBlend = mixHex(currentColor, nextColor, 0.5);

            const { startAngle, endAngle } = getNodeSegmentAngles(index);

            const start = polarPoint(startAngle, PLAY_RADIUS);

            const end = polarPoint(endAngle, PLAY_RADIUS);

            return (
              <linearGradient
                key={`node-centered-${key}`}
                id={`lpNodeCenteredGradient-${key}`}
                gradientUnits="userSpaceOnUse"
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
              >
                <stop offset="0%" stopColor={startBlend} />

                <stop offset="50%" stopColor={currentColor} />

                <stop offset="100%" stopColor={endBlend} />
              </linearGradient>
            );
          })}

          {NODE_ORDER.map((key, index) => {
            const nextKey = NODE_ORDER[(index + 1) % NODE_ORDER.length];

            const currentColor = AXIS_COLOR_BY_KEY[key];

            const nextColor = AXIS_COLOR_BY_KEY[nextKey];

            const blendColor = mixHex(currentColor, nextColor, 0.5);

            return (
              <React.Fragment key={`arrow-transition-${key}-${nextKey}`}>
                <linearGradient
                  id={`lpArrowGradient-${key}-${nextKey}`}
                  gradientUnits="userSpaceOnUse"
                  x1="0"
                  y1="0"
                  x2="6"
                  y2="0"
                >
                  <stop offset="0%" stopColor={currentColor} />

                  <stop offset="50%" stopColor={blendColor} />

                  <stop offset="100%" stopColor={nextColor} />
                </linearGradient>

                <marker
                  id={`lpArrowMarker-${key}-${nextKey}`}
                  markerWidth="6"
                  markerHeight="6"
                  refX="5.2"
                  refY="3"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path
                    d="M 0 0.8 L 5.4 3 L 0 5.2 L 1.7 3 Z"
                    fill={`url(#lpArrowGradient-${key}-${nextKey})`}
                    stroke="rgba(0,0,0,0.5)"
                    strokeWidth="0.3"
                  />
                </marker>
              </React.Fragment>
            );
          })}

          {relationshipPairs.map((relationship) => {
            const from = nodePoints.find(
              (node) => node.key === relationship.fromKey
            );

            const to = nodePoints.find(
              (node) => node.key === relationship.toKey
            );

            return (
              <linearGradient
                key={`rel-${relationship.id}`}
                id={`lpRelationshipGradient-${relationship.id}`}
                gradientUnits="userSpaceOnUse"
                x1={from?.x || 0}
                y1={from?.y || 0}
                x2={to?.x || 0}
                y2={to?.y || 0}
              >
                <stop
                  offset="0%"
                  stopColor={AXIS_COLOR_BY_KEY[relationship.fromKey]}
                />

                <stop
                  offset="100%"
                  stopColor={AXIS_COLOR_BY_KEY[relationship.toKey]}
                />
              </linearGradient>
            );
          })}

          <radialGradient id="lpMapCenterGlow" cx="50%" cy="50%" r="52%">
            <stop offset="0%" stopColor="rgba(214,178,119,0.18)" />

            <stop offset="55%" stopColor="rgba(214,178,119,0.045)" />

            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>

          <filter id="lpSoftGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />

            <feMerge>
              <feMergeNode in="blur" />

              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="lpTooltipShadow">
            <feDropShadow
              dx="0"
              dy="8"
              stdDeviation="7"
              floodColor="rgba(0,0,0,0.55)"
            />
          </filter>
        </defs>

        <circle
          className="lp-map-center-glow"
          cx={CENTER}
          cy={CENTER}
          r="218"
        />

        {mode === 'playCycle' && (
          <>
            <circle
              className="lp-play-cycle-guide-ring"
              cx={CENTER}
              cy={CENTER}
              r={PLAY_RADIUS}
            />

            <g className="lp-cycle-segment-layer">
              {NODE_ORDER.map((key, index) => {
                const nextKey = NODE_ORDER[(index + 1) % NODE_ORDER.length];

                const isActive = activeNodeKey === key;

                return (
                  <path
                    key={`cycle-node-arc-${key}`}
                    className={`lp-play-cycle-link ${
                      isActive ? 'is-active' : ''
                    }`}
                    d={getNodeCenteredArcPath(index, PLAY_RADIUS)}
                    stroke={`url(#lpNodeCenteredGradient-${key})`}
                    markerEnd={`url(#lpArrowMarker-${key}-${nextKey})`}
                    onClick={() => handleNodeClick(key)}
                  />
                );
              })}
            </g>
          </>
        )}

        {mode === 'voiceSculptor' && (
          <>
            <g className="lp-play-cycle-guide-layer" aria-hidden="true">
              {PLAY_GUIDE_LEVELS.map((level) => {
                const radius = (level / 10) * PLAY_RADIUS;

                return (
                  <circle
                    key={`sculptor-guide-ring-${level}`}
                    className="lp-play-cycle-value-ring"
                    cx={CENTER}
                    cy={CENTER}
                    r={radius}
                  />
                );
              })}

              {NODE_ORDER.map((key, index) => {
                const angle = getSliceBoundaryAngle(index);

                const inner = polarPoint(angle, PLAY_INNER_RADIUS);

                const outer = polarPoint(angle, PLAY_RADIUS);

                return (
                  <line
                    key={`sculptor-slice-line-${key}`}
                    className="lp-play-cycle-slice-line"
                    x1={inner.x}
                    y1={inner.y}
                    x2={outer.x}
                    y2={outer.y}
                  />
                );
              })}
            </g>

            <g
              className={`lp-play-cycle-adjust-layer ${
                playInteraction.isActive
                  ? `is-${playInteraction.mode || 'active'}`
                  : ''
              }`}
              onPointerDown={handleSculptorPointerDown}
              onPointerMove={handleSculptorPointerMove}
              onPointerUp={handleSculptorPointerUp}
              onPointerCancel={handleSculptorPointerUp}
              onPointerLeave={handleSculptorPointerUp}
            >
              {NODE_ORDER.map((key, index) => {
                const color = AXIS_COLOR_BY_KEY[key] || '#d6b277';

                const value = currentPlayValues[key] || 1;

                const valueRadius = (value / 10) * PLAY_RADIUS;

                const centerAngle = getSliceCenterAngle(index);

                const dotPoint = polarPoint(centerAngle, valueRadius);

                const isActive = activeNodeKey === key;

                const isLocked =
                  playInteraction.mode === 'single' &&
                  playInteraction.lockedKey === key;

                const visual = getVisualState(
                  key,
                  normalizedSoloNodeKeys,
                  normalizedMuteNodeKeys
                );

                const fillOpacity = clamp(0.035 + value * 0.028, 0.06, 0.34);

                const activeFillOpacity = clamp(fillOpacity + 0.04, 0.1, 0.4);

                const strokeOpacity = clamp(0.08 + value * 0.035, 0.1, 0.44);

                const activeStrokeOpacity = clamp(
                  strokeOpacity + 0.08,
                  0.16,
                  0.56
                );

                const dotOpacity = clamp(0.5 + value * 0.045, 0.58, 0.98);

                const effectiveFillColor = visual.shouldGreySliceColor
                  ? 'rgba(145, 145, 145, 0.16)'
                  : rgba(color, isActive ? activeFillOpacity : fillOpacity);

                const effectiveStrokeColor = visual.shouldGreySliceColor
                  ? 'rgba(150, 150, 150, 0.22)'
                  : rgba(color, isActive ? activeStrokeOpacity : strokeOpacity);

                const effectiveDotColor = visual.shouldGreySliceColor
                  ? 'rgba(155, 155, 155, 0.62)'
                  : color;

                const effectiveOpacity = visual.shouldHideSliceColor ? 0.06 : 1;

                return (
                  <g
                    key={`sculptor-adjust-${key}`}
                    className={`lp-play-cycle-slice-control ${
                      isActive ? 'is-active' : ''
                    } ${isLocked ? 'is-locked' : ''} ${
                      visual.isSoloed ? 'is-soloed-node' : ''
                    } ${visual.isMuted ? 'is-muted-node' : ''} ${
                      visual.isFocusOtherNode ? 'is-focus-other-node' : ''
                    } ${visual.shouldGreySliceColor ? 'is-greyed-node' : ''}`}
                    style={{ '--axis-color': color }}
                  >
                    <path
                      className="lp-play-cycle-slice-hit"
                      d={getSlicePath(index, PLAY_RADIUS)}
                    />

                    <path
                      className="lp-play-cycle-level-fill"
                      d={getSlicePath(index, valueRadius)}
                      fill={effectiveFillColor}
                      stroke={effectiveStrokeColor}
                      opacity={effectiveOpacity}
                    />

                    <circle
                      className="lp-play-cycle-level-dot"
                      cx={dotPoint.x}
                      cy={dotPoint.y}
                      r={isActive ? 5.8 : 4.4}
                      fill={effectiveDotColor}
                      opacity={visual.shouldHideSliceColor ? 0.08 : dotOpacity}
                    />

                    <circle
                      className="lp-play-cycle-level-dot-core"
                      cx={dotPoint.x}
                      cy={dotPoint.y}
                      r="1.65"
                      opacity={visual.shouldHideSliceColor ? 0.08 : 1}
                    />

                    <text
                      className="lp-play-cycle-level-label"
                      x={dotPoint.x}
                      y={dotPoint.y - 10}
                      textAnchor="middle"
                    >
                      {value}
                    </text>
                  </g>
                );
              })}
            </g>
          </>
        )}

        {mode === 'voiceGauge' && (
          <>
            {[10, 9, 8, 7, 6, 5, 4, 3, 2].map((level) => {
              const gridPoints = NODE_ORDER.map((key) =>
                getGaugePoint(key, level)
              );

              return (
                <polygon
                  key={`grid-${level}`}
                  className={`lp-gauge-grid ${
                    level === 5 ? 'is-reference-level' : ''
                  }`}
                  points={pointsToString(gridPoints)}
                />
              );
            })}

            {NODE_ORDER.map((key, index) => {
              const outer = pointOnCircle(index, GAUGE_RADIUS);

              return (
                <line
                  key={`angle-${key}`}
                  className="lp-gauge-angle-line"
                  x1={CENTER}
                  y1={CENTER}
                  x2={outer.x}
                  y2={outer.y}
                />
              );
            })}

            <polygon
              className="lp-gauge-reference-shape"
              points={pointsToString(referencePoints.map((item) => item.point))}
            />

            <polygon
              className="lp-gauge-current-fill"
              points={pointsToString(gaugeData.map((item) => item.point))}
            />

            {gaugeData.map((item, index) => {
              const next = gaugeData[(index + 1) % gaugeData.length];

              return (
                <line
                  key={`gauge-current-line-${item.key}`}
                  className="lp-gauge-current-segment"
                  x1={item.point.x}
                  y1={item.point.y}
                  x2={next.point.x}
                  y2={next.point.y}
                  stroke={`url(#lpCycleGradient-${item.key}-${next.key})`}
                />
              );
            })}

            {gaugeData.map((item) => {
              const isActive = activeNodeKey === item.key;

              return (
                <g
                  key={`gauge-dot-${item.key}`}
                  className={`lp-gauge-dot-group ${
                    isActive ? 'is-active' : ''
                  }`}
                  role="button"
                  tabIndex="0"
                  onClick={() => handleNodeClick(item.key)}
                  onMouseEnter={() => setHoveredNodeKey(item.key)}
                  onMouseLeave={() => setHoveredNodeKey(null)}
                  onFocus={() => setHoveredNodeKey(item.key)}
                  onBlur={() => setHoveredNodeKey(null)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();

                      handleNodeClick(item.key);
                    }
                  }}
                >
                  <circle
                    className="lp-gauge-dot-hit"
                    cx={item.point.x}
                    cy={item.point.y}
                    r="24"
                  />

                  <circle
                    className="lp-gauge-dot-glow"
                    cx={item.point.x}
                    cy={item.point.y}
                    r={isActive ? 15 : 10}
                    fill={rgba(item.color, isActive ? 0.26 : 0.14)}
                  />

                  <circle
                    className="lp-gauge-dot"
                    cx={item.point.x}
                    cy={item.point.y}
                    r={isActive ? 6.8 : 5.4}
                    fill={item.color}
                  />

                  <circle
                    className="lp-gauge-dot-core"
                    cx={item.point.x}
                    cy={item.point.y}
                    r="1.8"
                  />
                </g>
              );
            })}
          </>
        )}

        {mode === 'relationship' && (
          <>
            {relationshipPairs.map((relationship) => {
              const from = nodePoints.find(
                (node) => node.key === relationship.fromKey
              );

              const to = nodePoints.find(
                (node) => node.key === relationship.toKey
              );

              const isActive = activeRelationshipId === relationship.id;

              return (
                <g
                  key={relationship.id}
                  className={`lp-relationship-line-group ${
                    isActive ? 'is-active' : ''
                  }`}
                  role="button"
                  tabIndex="0"
                  onClick={() => handleRelationshipClick(relationship)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();

                      handleRelationshipClick(relationship);
                    }
                  }}
                >
                  <line
                    className="lp-relationship-line-hit"
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                  />

                  <line
                    className="lp-relationship-line-visible"
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={
                      isActive
                        ? `url(#lpRelationshipGradient-${relationship.id})`
                        : 'rgba(255,255,255,0.18)'
                    }
                  />

                  {isActive && (
                    <line
                      className="lp-relationship-line-active-glow"
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke={`url(#lpRelationshipGradient-${relationship.id})`}
                    />
                  )}
                </g>
              );
            })}

            {NODE_ORDER.map((key, index) => {
              const nextKey = NODE_ORDER[(index + 1) % NODE_ORDER.length];

              const from = pointOnCircle(index, RADIUS);

              const to = pointOnCircle(
                (index + 1) % NODE_ORDER.length,
                RADIUS
              );

              return (
                <line
                  key={`relationship-outer-${key}`}
                  className="lp-relationship-outer-line"
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={`url(#lpCycleGradient-${key}-${nextKey})`}
                />
              );
            })}
          </>
        )}

        {mode === 'voiceFinder' && (
          <>
            {relationshipPairs.map((relationship, index) => {
              const from = nodePoints.find(
                (node) => node.key === relationship.fromKey
              );

              const to = nodePoints.find(
                (node) => node.key === relationship.toKey
              );

              const answeredBoost = finderAnswers.length
                ? finderAnswers.some((answer) =>
                    [relationship.fromKey, relationship.toKey].includes(answer)
                  )
                : index % 4 === 0;

              return (
                <line
                  key={`finder-line-${relationship.id}`}
                  className={`lp-finder-network-line ${
                    answeredBoost ? 'is-awake' : ''
                  }`}
                  style={{ '--delay': `${(index % 8) * 120}ms` }}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={`url(#lpRelationshipGradient-${relationship.id})`}
                />
              );
            })}

            <circle
              className="lp-finder-pulse-core"
              cx={CENTER}
              cy={CENTER}
              r="46"
            />
          </>
        )}

        {outerNodePoints.map((node) => {
          const isActive = activeNodeKey === node.key;

          const visual = getVisualState(
            node.key,
            normalizedSoloNodeKeys,
            normalizedMuteNodeKeys
          );

          const iconPoint = pointOnCircle(
            NODE_ORDER.indexOf(node.key),
            NODE_ICON_RADIUS
          );

          return (
            <g
              key={node.key}
              className={`lp-map-node lp-map-node-${node.key} ${
                isActive ? 'is-active' : ''
              } ${visual.isSoloed ? 'is-soloed-node' : ''} ${
                visual.isMuted ? 'is-muted-node' : ''
              } ${visual.isFocusOtherNode ? 'is-focus-other-node' : ''} ${
                visual.shouldGreySliceColor ? 'is-greyed-node' : ''
              }`}
              role="button"
              tabIndex="0"
              onClick={() => handleNodeClick(node.key)}
              onMouseEnter={() => setHoveredNodeKey(node.key)}
              onMouseLeave={() => setHoveredNodeKey(null)}
              onFocus={() => setHoveredNodeKey(node.key)}
              onBlur={() => setHoveredNodeKey(null)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();

                  handleNodeClick(node.key);
                }
              }}
            >
              <circle
                className="lp-map-node-hit"
                cx={iconPoint.x}
                cy={iconPoint.y}
                r="30"
              />

              <foreignObject
                x={iconPoint.x - 34}
                y={iconPoint.y - 34}
                width="68"
                height="68"
                className="lp-map-node-icon-wrap"
              >
                <div className="lp-map-node-icon" style={{ color: node.color }}>
                  <MetricIcon
                    type={node.key}
                    color={visual.shouldGreySliceColor ? '#8d8d8d' : node.color}
                    size={20}
                  />
                </div>
              </foreignObject>
            </g>
          );
        })}

        {hoveredNode && (
          <g
            className="lp-node-tooltip"
            transform={`translate(${tooltipPosition.x} ${tooltipPosition.y})`}
            pointerEvents="none"
          >
            <rect
              x="-62"
              y="-24"
              width="124"
              height="48"
              rx="12"
              fill="rgba(9, 9, 9, 0.88)"
              stroke={hoveredNode.color}
              strokeOpacity="0.42"
              strokeWidth="1"
              filter="url(#lpTooltipShadow)"
            />

            <text
              x="0"
              y="-2"
              textAnchor="middle"
              fill="rgba(255,255,255,0.94)"
              fontSize="12"
              fontWeight="800"
              letterSpacing="1.2"
            >
              {hoveredNode.label}
            </text>

            <text
              x="0"
              y="14"
              textAnchor="middle"
              fill={hoveredNode.color}
              fontSize="9"
              fontWeight="800"
              letterSpacing="1.4"
            >
              {hoveredNode.sublabel}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

export default LegacyPrintInteractivePolygon;
