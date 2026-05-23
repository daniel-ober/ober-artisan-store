
import React, { useMemo, useState } from 'react';

import VoiceThreadMap from '../../components/VoiceThreadMap';

import derivePlayerAnalysisDeepDive from './derivePlayerAnalysisDeepDive.js';
import './PlayerAnalysisDeepDive.css';

const FALLBACK_FEEL_RESPONSE = [

  { key: 'immediacy', icon: '↯', left: 'Rounded', right: 'Immediate', value: 68 },

  { key: 'openness', icon: '≋', left: 'Short', right: 'Open', value: 46 },

  { key: 'warmthLean', icon: '♨', left: 'Lean', right: 'Warm', value: 58 },

  { key: 'forwardness', icon: '◖', left: 'Close', right: 'Forward', value: 64 },

  { key: 'brightness', icon: '☼', left: 'Dark', right: 'Bright', value: 55 },

  { key: 'responsiveness', icon: '♧', left: 'Forgiving', right: 'Responsive', value: 61 },

  { key: 'composure', icon: '⊕', left: 'Open', right: 'Composed', value: 70 },

];

const FALLBACK_LEGACY_TUNING = {

  currentRangeHz: [195, 255],

  nearestNoteWindow: 'G3–B3',

  naturalHome: 'Medium / Balanced',

  usableRange: 'Moderate-wide',

  sweetSpot: 'Lower side of medium',

  chokeRisk: 'Low-to-moderate',

  lowBehavior: 'Fuller, softer-edged, with more breathing shell response.',

  mediumBehavior: 'Balanced body, response, projection, and control.',

  highBehavior: 'More focused and present, but less naturally full.',

};

const FALLBACK_NODE_RELATIONSHIPS = [

  {

    label: 'Snap with clarity',

    nodes: ['Attack', 'Brightness'],

    summary: 'Clear first contact with enough top-end definition to stay mix-ready.',

  },

  {

    label: 'Cut without harshness',

    nodes: ['Brightness', 'Control'],

    summary: 'Adds definition while keeping the voice focused and manageable.',

  },

  {

    label: 'Crack with body',

    nodes: ['Attack', 'Warmth'],

    summary: 'Keeps the initial note strong without thinning out the center of the drum.',

  },

  {

    label: 'Open but controlled',

    nodes: ['Sustain', 'Control'],

    summary: 'Lets the drum breathe while keeping the note from spreading too far.',

  },

  {

    label: 'Responsive precision',

    nodes: ['Sensitivity', 'Control'],

    summary: 'Supports ghost-note detail while keeping the response composed.',

  },

];

const FALLBACK_SETUP_IMPACT = [

  {

    label: 'Reference setup',

    value: 'Using verified stock setup when available; otherwise using the default open comparison setup.',

  },

  {

    label: 'Modifier behavior',

    value: 'Heads, hoops, wires, damping, and tuning choices should move this section as the engine resolves more setup data.',

  },

];

const TABS = [

  { id: 'overview', label: 'Overview' },

  { id: 'feel', label: 'Feel & Response' },

  { id: 'tuning', label: 'LegacyTuning™' },

  { id: 'threads', label: 'Node Threads' },

  { id: 'setup', label: 'Setup Impact' },

];

function clampPercent(value) {

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) return 50;

  return Math.max(0, Math.min(100, numeric));

}

function normalizeFeelResponse(playerAnalysis) {

  const source = playerAnalysis?.feelResponse;

  if (!source) return FALLBACK_FEEL_RESPONSE;

  if (Array.isArray(source)) {

    return source.map((item, index) => ({

      ...FALLBACK_FEEL_RESPONSE[index],

      ...item,

      value: clampPercent(item?.value),

    }));

  }

  return FALLBACK_FEEL_RESPONSE.map((item) => ({

    ...item,

    value: clampPercent(source[item.key] ?? item.value),

  }));

}

function normalizeLegacyTuning(playerAnalysis) {

  return {

    ...FALLBACK_LEGACY_TUNING,

    ...(playerAnalysis?.legacyTuning || {}),

  };

}

function normalizeNodeRelationships(playerAnalysis) {

  const relationships = playerAnalysis?.nodeRelationships;

  return Array.isArray(relationships) && relationships.length

    ? relationships

    : FALLBACK_NODE_RELATIONSHIPS;

}

function normalizeSetupImpact(playerAnalysis) {

  const setupImpact = playerAnalysis?.setupImpact;

  return Array.isArray(setupImpact) && setupImpact.length

    ? setupImpact

    : FALLBACK_SETUP_IMPACT;

}

function formatRange(range) {

  if (!Array.isArray(range) || range.length < 2) return '—';

  return `${range[0]}–${range[1]} Hz`;

}

export default function PlayerAnalysisDeepDive({

  read,

  playerAnalysis,

  title = 'Player Analysis',

  subtitle = 'Deeper behavior read based on physical build data, setup choices, and enabled modifiers.',

}) {

  const [activeTab, setActiveTab] = useState('overview');

  const resolvedRead = read || {};

  const derivedPlayerAnalysis = useMemo(

    () => derivePlayerAnalysisDeepDive({

      ...resolvedRead,

      playerAnalysis: playerAnalysis || resolvedRead?.playerAnalysis || {},

    }),

    [resolvedRead, playerAnalysis]

  );

  const normalizedPlayerAnalysis = {

    ...derivedPlayerAnalysis,

    ...(resolvedRead?.playerAnalysis || {}),

    ...(playerAnalysis || {}),

    feelResponse:

      playerAnalysis?.feelResponse ||

      resolvedRead?.playerAnalysis?.feelResponse ||

      derivedPlayerAnalysis.feelResponse,

    legacyTuning:

      playerAnalysis?.legacyTuning ||

      resolvedRead?.playerAnalysis?.legacyTuning ||

      derivedPlayerAnalysis.legacyTuning,

    nodeRelationships:

      playerAnalysis?.nodeRelationships ||

      resolvedRead?.playerAnalysis?.nodeRelationships ||

      derivedPlayerAnalysis.nodeRelationships,

    setupImpact:

      playerAnalysis?.setupImpact ||

      resolvedRead?.playerAnalysis?.setupImpact ||

      derivedPlayerAnalysis.setupImpact,

  };

  const feelResponse = useMemo(

    () => normalizeFeelResponse(normalizedPlayerAnalysis),

    [normalizedPlayerAnalysis]

  );

  const legacyTuning = useMemo(

    () => normalizeLegacyTuning(normalizedPlayerAnalysis),

    [normalizedPlayerAnalysis]

  );

  const nodeRelationships = useMemo(

    () => normalizeNodeRelationships(normalizedPlayerAnalysis),

    [normalizedPlayerAnalysis]

  );

  const setupImpact = useMemo(

    () => normalizeSetupImpact(normalizedPlayerAnalysis),

    [normalizedPlayerAnalysis]

  );

  const dominantNodes =

    normalizedPlayerAnalysis?.dominantNodes ||

    normalizedPlayerAnalysis?.topNodes ||

    resolvedRead?.dominantNodes ||

    [];

  return (

    <section className="lp-player-deep-dive" aria-label="Player Analysis deep dive">

      <div className="lp-player-deep-dive__header">

        <div>

          <p className="lp-player-deep-dive__eyebrow">Player Analysis Tools</p>

          <h3>{title}</h3>

          <p>{subtitle}</p>

        </div>

      </div>

      <div className="lp-player-deep-dive__tabs" role="tablist" aria-label="Player Analysis tabs">

        {TABS.map((tab) => (

          <button

            key={tab.id}

            type="button"

            role="tab"

            aria-selected={activeTab === tab.id}

            className={`lp-player-deep-dive__tab ${

              activeTab === tab.id ? 'lp-player-deep-dive__tab--active' : ''

            }`}

            onClick={() => setActiveTab(tab.id)}

          >

            {tab.label}

          </button>

        ))}

      </div>

      <div className="lp-player-deep-dive__panel">

        {activeTab === 'overview' && (

          <div className="lp-player-overview-grid">

            <article className="lp-player-card lp-player-card--wide">

              <p className="lp-player-card__eyebrow">Under the stick</p>

              <h4>{normalizedPlayerAnalysis?.title || resolvedRead?.title || 'Response profile'}</h4>

              <p>

                {normalizedPlayerAnalysis?.overviewSummary ||

                  normalizedPlayerAnalysis?.summary ||

                  resolvedRead?.summary ||

                  'This read translates the physical drum build into how the snare is likely to respond, carry, control, and settle under a player.'}

              </p>

            </article>

            <article className="lp-player-card">

              <p className="lp-player-card__eyebrow">Dominant feel traits</p>

              <div className="lp-player-node-list">

                {dominantNodes.length ? (

                  dominantNodes.slice(0, 3).map((node) => (

                    <span key={typeof node === 'string' ? node : node?.key || node?.label}>

                      {typeof node === 'string' ? node : node?.label || node?.key}

                    </span>

                  ))

                ) : (

                  <>

                    <span>Attack</span>

                    <span>Control</span>

                    <span>Brightness</span>

                  </>

                )}

              </div>

            </article>

            <article className="lp-player-card">

              <p className="lp-player-card__eyebrow">Best read use</p>

              <p>

                Use this section when the question moves from “what do I notice first?” to

                “where does this drum like to live, and how does it behave when I play it?”

              </p>

            </article>

          </div>

        )}

        {activeTab === 'feel' && (

          <div className="lp-feel-response-list">

            {feelResponse.map((item) => (

              <div className="lp-feel-row" key={item.key}>

                <div className="lp-feel-row__icon" aria-hidden="true">

                  {item.icon}

                </div>

                <div className="lp-feel-row__body">

                  <div className="lp-feel-row__labels">

                    <span>{item.left}</span>

                    <span>{item.right}</span>

                  </div>

                  <div className="lp-feel-row__track">

                    <div

                      className="lp-feel-row__fill"

                      style={{ width: `${clampPercent(item.value)}%` }}

                    />

                    <div

                      className="lp-feel-row__marker"

                      style={{ left: `${clampPercent(item.value)}%` }}

                    />

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

        {activeTab === 'tuning' && (

          <div className="lp-tuning-panel">

            <div className="lp-tuning-panel__intro">

              <div>

                <p className="lp-player-card__eyebrow">LegacyTuning™ Range</p>

                <h4>{formatRange(legacyTuning.currentRangeHz)}</h4>

                <p>{legacyTuning.nearestNoteWindow} nearest note window</p>

              </div>

              <div className="lp-tuning-panel__stat-grid">

                <div>

                  <span>Natural home</span>

                  <strong>{legacyTuning.naturalHome}</strong>

                </div>

                <div>

                  <span>Usable range</span>

                  <strong>{legacyTuning.usableRange}</strong>

                </div>

                <div>

                  <span>Sweet spot</span>

                  <strong>{legacyTuning.sweetSpot}</strong>

                </div>

                <div>

                  <span>Choke risk</span>

                  <strong>{legacyTuning.chokeRisk}</strong>

                </div>

              </div>

            </div>

            <div className="lp-tuning-lane">

              <div className="lp-tuning-lane__labels">

                <span>Low / Breathing</span>

                <span>Warm / Full</span>

                <span>Balanced</span>

                <span>Focused / Present</span>

                <span>Tight / Bright</span>

              </div>

              <div className="lp-tuning-lane__track">

                <div className="lp-tuning-lane__range" />

              </div>

              <div className="lp-tuning-lane__footer">

                <span>Lower / more breathing shell response</span>

                <span>Higher / tighter shell response</span>

              </div>

            </div>

            <div className="lp-tuning-behavior-grid">

              <article>

                <span>Low behavior</span>

                <p>{legacyTuning.lowBehavior}</p>

              </article>

              <article>

                <span>Medium behavior</span>

                <p>{legacyTuning.mediumBehavior}</p>

              </article>

              <article>

                <span>High behavior</span>

                <p>{legacyTuning.highBehavior}</p>

              </article>

            </div>

          </div>

        )}

        {activeTab === 'threads' && (

          <div className="lp-node-threads-grid">

            <div className="lp-node-threads-map">

              <VoiceThreadMap read={resolvedRead} resolvedReadVariant="player" compact />

            </div>

            <div className="lp-node-threads-list">

              {nodeRelationships.map((relationship) => (

                <article key={relationship.label}>

                  <p>{relationship.label}</p>

                  <span>{(relationship.nodes || []).join(' + ')}</span>

                  <small>{relationship.summary}</small>

                </article>

              ))}

            </div>

          </div>

        )}

        {activeTab === 'setup' && (

          <div className="lp-setup-impact-list">

            {setupImpact.map((item) => (

              <article key={item.label}>

                <p>{item.label}</p>

                <span>{item.value}</span>

              </article>

            ))}

          </div>

        )}

      </div>

    </section>

  );

}

