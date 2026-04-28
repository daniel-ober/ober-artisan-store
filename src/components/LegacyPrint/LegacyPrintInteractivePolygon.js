
import React, { useMemo } from 'react';

import {

  AXIS_COLOR_BY_KEY,

  MetricIcon,

} from './legacyPrintVoiceMapData';

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

const SVG_SIZE = 500;

const CENTER = 250;

const RADIUS = 172;

const GAUGE_RADIUS = 142;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

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

const getPathForArc = (from, to, sweep = 1) => {

  const dx = to.x - from.x;

  const dy = to.y - from.y;

  const distance = Math.sqrt(dx * dx + dy * dy);

  const arcRadius = Math.max(distance * 1.1, 80);

  return `M ${from.x} ${from.y} A ${arcRadius} ${arcRadius} 0 0 ${sweep} ${to.x} ${to.y}`;

};

const LegacyPrintInteractivePolygon = ({

  mode = 'playCycle',

  activeNodeKey = 'attack',

  onSelectNode,

  activeRelationshipId,

  onSelectRelationship,

  gaugeValues,

  finderAnswers = [],

}) => {

  const nodePoints = useMemo(

    () =>

      NODE_ORDER.map((key, index) => ({

        key,

        label: NODE_LABELS[key],

        color: AXIS_COLOR_BY_KEY[key] || '#d6b277',

        ...pointOnCircle(index),

      })),

    []

  );

  const gaugeData = useMemo(() => {

    const values =

      gaugeValues || {

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

            return (

              <linearGradient

                key={`cycle-${key}-${nextKey}`}

                id={`lpCycleGradient-${key}-${nextKey}`}

                gradientUnits="userSpaceOnUse"

                x1={pointOnCircle(index).x}

                y1={pointOnCircle(index).y}

                x2={pointOnCircle((index + 1) % NODE_ORDER.length).x}

                y2={pointOnCircle((index + 1) % NODE_ORDER.length).y}

              >

                <stop offset="0%" stopColor={AXIS_COLOR_BY_KEY[key]} />

                <stop offset="100%" stopColor={AXIS_COLOR_BY_KEY[nextKey]} />

              </linearGradient>

            );

          })}

          {relationshipPairs.map((relationship) => {

            const from = nodePoints.find((node) => node.key === relationship.fromKey);

            const to = nodePoints.find((node) => node.key === relationship.toKey);

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

                <stop offset="0%" stopColor={AXIS_COLOR_BY_KEY[relationship.fromKey]} />

                <stop offset="100%" stopColor={AXIS_COLOR_BY_KEY[relationship.toKey]} />

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

          <marker

            id="lpArrowHead"

            markerWidth="10"

            markerHeight="10"

            refX="8"

            refY="5"

            orient="auto"

            markerUnits="strokeWidth"

          >

            <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(214,178,119,0.9)" />

          </marker>

        </defs>

        <circle className="lp-map-center-glow" cx={CENTER} cy={CENTER} r="218" />

        {mode === 'playCycle' && (

          <>

            <circle

              className="lp-play-cycle-guide-ring"

              cx={CENTER}

              cy={CENTER}

              r={RADIUS}

            />

            {NODE_ORDER.map((key, index) => {

              const nextKey = NODE_ORDER[(index + 1) % NODE_ORDER.length];

              const from = pointOnCircle(index, RADIUS);

              const to = pointOnCircle((index + 1) % NODE_ORDER.length, RADIUS);

              const isActive = activeNodeKey === key;

              return (

                <path

                  key={`cycle-line-${key}`}

                  className={`lp-play-cycle-link ${isActive ? 'is-active' : ''}`}

                  d={getPathForArc(from, to, 1)}

                  stroke={`url(#lpCycleGradient-${key}-${nextKey})`}

                  markerEnd={isActive ? 'url(#lpArrowHead)' : undefined}

                />

              );

            })}

          </>

        )}

        {mode === 'voiceGauge' && (

          <>

            {[10, 9, 8, 7, 6, 5, 4, 3, 2].map((level) => {

              const gridPoints = NODE_ORDER.map((key) => getGaugePoint(key, level));

              return (

                <polygon

                  key={`grid-${level}`}

                  className={`lp-gauge-grid ${level === 5 ? 'is-reference-level' : ''}`}

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

                  className={`lp-gauge-dot-group ${isActive ? 'is-active' : ''}`}

                  role="button"

                  tabIndex="0"

                  onClick={() => handleNodeClick(item.key)}

                  onKeyDown={(event) => {

                    if (event.key === 'Enter' || event.key === ' ') {

                      handleNodeClick(item.key);

                    }

                  }}

                >

                  <circle

                    className="lp-gauge-dot-hit"

                    cx={item.point.x}

                    cy={item.point.y}

                    r="22"

                  />

                  <circle

                    className="lp-gauge-dot-glow"

                    cx={item.point.x}

                    cy={item.point.y}

                    r={isActive ? 17 : 12}

                    fill={rgba(item.color, isActive ? 0.28 : 0.16)}

                  />

                  <circle

                    className="lp-gauge-dot"

                    cx={item.point.x}

                    cy={item.point.y}

                    r={isActive ? 7.5 : 5.8}

                    fill={item.color}

                  />

                  <circle

                    className="lp-gauge-dot-core"

                    cx={item.point.x}

                    cy={item.point.y}

                    r="2"

                  />

                </g>

              );

            })}

          </>

        )}

        {mode === 'relationship' && (

          <>

            {relationshipPairs.map((relationship) => {

              const from = nodePoints.find((node) => node.key === relationship.fromKey);

              const to = nodePoints.find((node) => node.key === relationship.toKey);

              const isActive = activeRelationshipId === relationship.id;

              return (

                <g

                  key={relationship.id}

                  className={`lp-relationship-line-group ${isActive ? 'is-active' : ''}`}

                  role="button"

                  tabIndex="0"

                  onClick={() => handleRelationshipClick(relationship)}

                  onKeyDown={(event) => {

                    if (event.key === 'Enter' || event.key === ' ') {

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

              const from = pointOnCircle(index);

              const to = pointOnCircle((index + 1) % NODE_ORDER.length);

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

              const from = nodePoints.find((node) => node.key === relationship.fromKey);

              const to = nodePoints.find((node) => node.key === relationship.toKey);

              const answeredBoost = finderAnswers.length

                ? finderAnswers.some((answer) =>

                    [relationship.fromKey, relationship.toKey].includes(answer)

                  )

                : index % 4 === 0;

              return (

                <line

                  key={`finder-line-${relationship.id}`}

                  className={`lp-finder-network-line ${answeredBoost ? 'is-awake' : ''}`}

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

        {nodePoints.map((node) => {

          const isActive = activeNodeKey === node.key;

          const iconRadius = mode === 'voiceGauge' ? RADIUS + 38 : RADIUS;

          const iconPoint = pointOnCircle(NODE_ORDER.indexOf(node.key), iconRadius);

          return (

            <g

              key={node.key}

              className={`lp-map-node lp-map-node-${node.key} ${isActive ? 'is-active' : ''}`}

              role="button"

              tabIndex="0"

              onClick={() => handleNodeClick(node.key)}

              onKeyDown={(event) => {

                if (event.key === 'Enter' || event.key === ' ') {

                  handleNodeClick(node.key);

                }

              }}

            >

              <circle

                className="lp-map-node-hit"

                cx={iconPoint.x}

                cy={iconPoint.y}

                r="26"

              />

              {mode !== 'voiceGauge' && (

                <>

                  <circle

                    className="lp-map-node-ring"

                    cx={iconPoint.x}

                    cy={iconPoint.y}

                    r={isActive ? 25 : 20}

                    stroke={node.color}

                  />

                  <circle

                    className="lp-map-node-core"

                    cx={iconPoint.x}

                    cy={iconPoint.y}

                    r={isActive ? 19 : 15}

                    fill={rgba(node.color, isActive ? 0.18 : 0.09)}

                  />

                </>

              )}

              <foreignObject

                x={iconPoint.x - 13}

                y={iconPoint.y - 13}

                width="26"

                height="26"

                className="lp-map-node-icon-wrap"

              >

                <div

                  className="lp-map-node-icon"

                  style={{ color: node.color }}

                >

                  <MetricIcon type={node.key} color={node.color} size={mode === 'voiceGauge' ? 19 : 18} />

                </div>

              </foreignObject>

            </g>

          );

        })}

      </svg>

    </div>

  );

};

export default LegacyPrintInteractivePolygon;

