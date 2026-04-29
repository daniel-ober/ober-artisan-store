import React, { useMemo, useState, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import LegacyPrintVoiceMapModal from './LegacyPrint/LegacyPrintVoiceMapModal';

import {

  AXIS_COLOR_BY_KEY,

  LEGACYPRINT_AXIS_META,

  MetricIcon,

} from './LegacyPrint/legacyPrintVoiceMapData';

import './ArtisanDrums.css';

import VoiceProfileDisclaimer from './VoiceProfileDisclaimer';

const ASSET_BASE = `${process.env.PUBLIC_URL}/ober-artisan-showroom/color`;

const SHOP_BASE = `${process.env.PUBLIC_URL}/artisan-shop`;

export const DRUM_SERIES = [

  {

    id: 'heritage',

    name: 'HERITAGE',

    logo: '/resized-logos/heritage-white.png',

    previewImage: `${SHOP_BASE}/heritage-left.png`,

    quote: 'Rooted. Warm. Timeless.',

    shortLabel: 'Heritage',

    snapshotTitle: 'HERITAGE Series Snapshot',

    snapshotSummary:

      'A rooted, warm, seasoned response shaped around classic feel, woody center, grounded articulation, and a familiar voice that stays organic and controlled under the stick.',

    legacyPrintProfile: [

      {

        label: 'Attack',

        value: 56,

        note: 'Firm enough to speak clearly without becoming overly sharp.',

      },

      {

        label: 'Sustain',

        value: 47,

        note: 'Controlled and seasoned, with a shorter classic note shape.',

      },

      {

        label: 'Warmth',

        value: 51,

        note: 'Naturally rooted, woody, and warm through the center of the note.',

      },

      {

        label: 'Projection',

        value: 58,

        note: 'Focused shop-tested presence with a grounded center.',

      },

      {

        label: 'Brightness',

        value: 51,

        note: 'Balanced top end, kept smooth and traditional.',

      },

      {

        label: 'Sensitivity',

        value: 45,

        note: 'Responsive, but intentionally not hyper-modern or glassy.',

      },

      {

        label: 'Control',

        value: 58,

        note: 'The most composed of the three line snapshots.',

      },

    ],

    bullets: [

      'Builds starting at $850',

      'Northern Red Oak stave shell construction',

      'Grounded, warm, seasoned Ober voice',

      'Classic 45° inner edge with softened outer roundover',

      'Standard snare beds for familiar response',

      '12", 13", and 14" build sizes',

      '36 core Heritage voicing paths',

      'Vintage double-ended tube lug character',

    ],

    description:

      'HERITAGE carries the most grounded side of the Ober voice: seasoned, tactile, and deeply organic. Built around Northern Red Oak stave construction and shaped with a classic bearing-edge profile, it is made for players who want natural feel, warm body, and a drum that sounds played-in from the first stroke.',

    href: '/artisan-shop/heritage',

    cta: 'Explore Heritage',

    activeLayer: `${ASSET_BASE}/drums-only-heritage.png`,

  },

  {

    id: 'feuzon',

    name: 'FEUZØN',

    logo: '/resized-logos/feuzon-white.png',

    previewImage: `${SHOP_BASE}/feuzon-right.png`,

    quote: 'Fast. Focused. Alive.',

    shortLabel: 'Feuzøn',

    snapshotTitle: 'FEUZØN Series Snapshot',

    snapshotSummary:

      'A hybrid-shell response with broader range, stronger articulation, and a more modern spread while still carrying enough body to feel alive under the stick.',

    legacyPrintProfile: [

      {

        label: 'Attack',

        value: 71,

        note: 'More articulate front-end response than Heritage.',

      },

      {

        label: 'Sustain',

        value: 63,

        note: 'More dimensional bloom from the hybrid shell format.',

      },

      {

        label: 'Warmth',

        value: 63,

        note: 'Carries body and depth, but stays more balanced and articulate than Heritage.',

      },

      {

        label: 'Projection',

        value: 69,

        note: 'A broader, more forward response across the room.',

      },

      {

        label: 'Brightness',

        value: 62,

        note: 'A touch more lift and top-end shape.',

      },

      {

        label: 'Sensitivity',

        value: 64,

        note: 'Responsive and modern without losing shell character.',

      },

      {

        label: 'Control',

        value: 65,

        note: 'Balanced control with more tonal spread than Heritage.',

      },

    ],

    bullets: [

      'Builds starting at $950',

      'Steam-bent exterior with voiced stave interior',

      'Fast, articulate, modern Ober response',

      'Balanced Hybrid, Warm Hybrid, or Modern Precision edge options',

      '12", 13", 14", and 15" build sizes',

      'Hundreds of FEUZØN core voicing paths',

      'Die-cast or triple-flange hoop response',

      'Natural, stained, satin, or gloss finish systems',

    ],

    description:

      'FEUZØN is built for players who want the immediacy of a modern drum, with more depth, complexity, and character beneath the stick. By pairing a steam-bent outer shell with a voiced stave interior, FEUZØN creates a response that feels articulate up front, full through the body, and alive across a wide tuning range.',

    href: '/artisan-shop/feuzon',

    cta: 'Explore FEUZØN',

    activeLayer: `${ASSET_BASE}/drums-only-feuzon.png`,

  },

  {

    id: 'soundlegend',

    name: 'SOUNDLEGEND',

    logo: '/resized-logos/soundlegend-white.png',

    previewImage: `${SHOP_BASE}/soundlegend-left.png`,

    quote: 'Custom-built. Artist-led. One-on-one.',

    shortLabel: 'SoundLegend',

    snapshotTitle: 'SoundLegend Series Snapshot',

    snapshotSummary:

      'The most flexible Ober voice path, shaped around the player, story, sound goals, feel, visual direction, and one-of-one build intent.',

    legacyPrintProfile: [

      {

        label: 'Attack',

        value: 84,

        note: 'Can be shaped from soft and rounded to immediate and precise.',

      },

      {

        label: 'Sustain',

        value: 76,

        note: 'Mapped around the artist’s preferred note length and bloom.',

      },

      {

        label: 'Warmth',

        value: 84,

        note: 'Tailored by wood pairing, shell design, edges, and finish.',

      },

      {

        label: 'Projection',

        value: 92,

        note: 'Designed around the player’s room, genre, and presence needs.',

      },

      {

        label: 'Brightness',

        value: 82,

        note: 'Flexible top-end shaping based on player language.',

      },

      {

        label: 'Sensitivity',

        value: 90,

        note: 'Dialed around touch, ghost notes, recording, and live feel.',

      },

      {

        label: 'Control',

        value: 88,

        note: 'Custom-controlled around the full voicing plan.',

      },

    ],

    bullets: [

      'Builds starting at $1,850',

      'Direct collaboration with Dan Ober',

      'Private pre-build questionnaire and consultation',

      'Artist-shaped voicing and tonal direction',

      'Custom shell, edge, hardware, finish, and feel decisions',

      'High-resolution design mockups before final build direction',

      'Priority SoundLegend Portal access during active builds',

      'LegacyPrint™ voice mapping and build interpretation',

      'Legacy Vault artist page opportunity',

      'One-of-one visual storytelling and documentation',

    ],

    description:

      'Your sound is unique, and your snare should be too. The SoundLegend Series is a fully custom, handcrafted instrument built around your playing style, sonic goals, and artistic identity. In direct collaboration with Dan Ober, you will shape a snare that feels personal, inspiring, and unmistakably yours.',

    href: '/artisan-shop/soundlegend',

    cta: 'Begin Your SoundLegend Experience',

    activeLayer: `${ASSET_BASE}/drums-only-soundlegend.png`,

  },

];

const COMPARE_ROWS = [

  {

    label: 'Build philosophy',

    helper: 'Where each line tends to live emotionally and musically.',

    heritage: 'Rooted, classic, timeless',

    feuzon: 'Experimental, hybrid, modern',

    soundlegend: 'Fully tailored to artist and story',

  },

  {

    label: 'Construction approach',

    helper: 'The structural path each line is built around.',

    heritage: 'Traditional stave shell',

    feuzon: 'Stave + steam-bent hybrid',

    soundlegend: 'Chosen per artist goals',

  },

  {

    label: 'Who it is for',

    helper: 'The kind of player each line naturally serves.',

    heritage: 'Players wanting legacy warmth',

    feuzon: 'Players wanting expanded range',

    soundlegend: 'Players wanting a one-of-one build',

  },

  {

    label: 'Voicing behavior',

    helper: 'How the line tends to lean tonally when shaped well.',

    heritage: 'Grounded, warm, seasoned',

    feuzon: 'Broader, sharper, more expansive',

    soundlegend: 'Most flexible and artist-shaped',

  },

  {

    label: 'LegacyPrint™ usage',

    helper: 'How discovery and tonal mapping are used in the process.',

    heritage: 'Used to preserve the line’s core voice',

    feuzon: 'Used to compare tonal range and spread',

    soundlegend: 'Used most deeply during planning and voicing',

  },

];

const SERIES_RANGE_COLORS = {

  heritage: '#53371E',

  feuzon: '#2B3365',

  soundlegend: '#398FA3',

};

const LEGACYPRINT_RANGE_BY_SERIES = {

  heritage: {

    Attack: [40, 66],

    Sustain: [30, 58],

    Warmth: [56, 82],

    Projection: [42, 68],

    Brightness: [32, 60],

    Sensitivity: [34, 62],

    Control: [50, 78],

  },

  feuzon: {

    Attack: [56, 84],

    Sustain: [46, 76],

    Warmth: [44, 72],

    Projection: [56, 86],

    Brightness: [48, 78],

    Sensitivity: [52, 82],

    Control: [48, 76],

  },

  soundlegend: {

    Attack: [34, 94],

    Sustain: [28, 88],

    Warmth: [38, 96],

    Projection: [40, 96],

    Brightness: [30, 90],

    Sensitivity: [38, 96],

    Control: [36, 92],

  },

};

const getSeriesById = (id) =>

  DRUM_SERIES.find((series) => series.id === id) || DRUM_SERIES[0];

const ToneBars = ({ profile, seriesId }) => {

  const seriesColor = SERIES_RANGE_COLORS[seriesId] || '#398FA3';

  const [activeTouchNode, setActiveTouchNode] = useState(null);

  const handleTouchToggle = (label) => {

    setActiveTouchNode((current) => (current === label ? null : label));

  };

  return (

    <div

      className={`oad-tone-bars oad-tone-bars-${seriesId}`}

      aria-label="Ober LegacyPrint series voice range"

      style={{ '--oad-series-range-color': seriesColor }}

    >

      <div className="oad-tone-row-stack">

        {profile.map((item) => {

          const axisMeta = LEGACYPRINT_AXIS_META[item.label];

          const axisKey = axisMeta?.key || item.label.toLowerCase();

          const axisColor = AXIS_COLOR_BY_KEY[axisKey] || '#d6b277';

          const seriesRange = LEGACYPRINT_RANGE_BY_SERIES[seriesId]?.[

            item.label

          ] || [Math.max(item.value - 10, 0), Math.min(item.value + 10, 100)];

          const [rangeStart, rangeEnd] = seriesRange;

          const rangeWidth = Math.max(rangeEnd - rangeStart, 6);

          const isTouchOpen = activeTouchNode === item.label;

          return (

            <button

              key={item.label}

              type="button"

              className={`oad-tone-row oad-tone-row-${axisKey} ${

                isTouchOpen ? 'is-touch-open' : ''

              }`}

              style={{

                '--oad-axis-color': axisColor,

                '--range-start': rangeStart,

                '--range-width': rangeWidth,

              }}

              onClick={() => handleTouchToggle(item.label)}

              aria-expanded={isTouchOpen}

            >

              <div className="oad-tone-meta">

                <div className="oad-tone-title-group">

                  <span className="oad-tone-icon" aria-hidden="true">

                    <MetricIcon type={axisMeta?.icon} color={axisColor} />

                  </span>

                  <div className="oad-tone-title-copy">

                    <span className="oad-tone-label">{item.label}</span>

                    <span className="oad-tone-sublabel">

                      {axisMeta?.sublabel}

                    </span>

                  </div>

                </div>

                <span className="oad-tone-range-label">

                  {axisMeta?.low} → {axisMeta?.high}

                </span>

              </div>

              <div

                className="oad-tone-track"

                aria-label={`${item.label}: ${axisMeta?.low} to ${axisMeta?.high}`}

              >

                <div className="oad-tone-track-glow" aria-hidden="true" />

                <span className="oad-tone-scale-label oad-tone-scale-label-left">

                  {axisMeta?.low}

                </span>

                <span className="oad-tone-scale-label oad-tone-scale-label-right">

                  {axisMeta?.high}

                </span>

                <div

                  className="oad-tone-range-fill"

                  style={{

                    left: `${rangeStart}%`,

                    width: `${rangeWidth}%`,

                  }}

                  aria-hidden="true"

                />

              </div>

              <div className="oad-tone-tooltip" role="tooltip">

                <strong>{item.label}</strong>

                <span>{item.note}</span>

              </div>

              <div className="oad-tone-touch-note" aria-hidden={!isTouchOpen}>

                <strong>{item.label}</strong>

                <span>{item.note}</span>

              </div>

            </button>

          );

        })}

      </div>

    </div>

  );

};

const CollectionViewToggle = ({ primaryTab, onChange }) => (

  <div className="oad-view-toggle" role="tablist" aria-label="Collection view">

    <button

      type="button"

      role="tab"

      aria-selected={primaryTab === 'collection'}

      className={`oad-view-toggle-button ${

        primaryTab === 'collection' ? 'is-active' : ''

      }`}

      onClick={() => onChange('collection')}

    >

      Our Collection

    </button>

    <button

      type="button"

      role="tab"

      aria-selected={primaryTab === 'compare'}

      className={`oad-view-toggle-button ${

        primaryTab === 'compare' ? 'is-active' : ''

      }`}

      onClick={() => onChange('compare')}

    >

      Compare the Lines

    </button>

  </div>

);

const SeriesFeature = ({ series, onNavigate, onCompare }) => {

  const [showVoiceNodeGuide, setShowVoiceNodeGuide] = useState(false);

  return (

    <>

      <div className={`oad-feature oad-feature-${series.id}`}>

        <div className="oad-feature-left">

          <div className="oad-feature-main">

            <div className="oad-feature-copy-grid">

              <div className="oad-feature-copy-block">

                <p className="oad-feature-quote">{series.quote}</p>

                <p className="oad-feature-copy">{series.description}</p>

              </div>

            </div>

          </div>

          <div className="oad-feature-highlights">

            <span className="oad-side-kicker">

              {series.id === 'soundlegend'

                ? 'What’s included'

                : 'Key build highlights'}

            </span>

            <ul className="oad-feature-highlight-list">

              {series.bullets.map((bullet) => (

                <li key={bullet} className="oad-feature-highlight-item">

                  {bullet}

                </li>

              ))}

            </ul>

          </div>

          <div className="oad-feature-actions">

            <button

              type="button"

              className="oad-primary-btn"

              onClick={() => onNavigate(series.href)}

            >

              {series.cta}

            </button>

            <button type="button" className="oad-text-link" onClick={onCompare}>

              Compare the lines

            </button>

          </div>

        </div>

        <div className="oad-feature-side">

          <div className="oad-snapshot-head">

            <span className="oad-side-kicker">LegacyPrint™ read</span>

            <h3>{series.snapshotTitle}</h3>

            <p className="oad-side-copy">{series.snapshotSummary}</p>

          </div>

          <ToneBars profile={series.legacyPrintProfile} seriesId={series.id} />

          <div className="oad-legacyprint-footer-read">

            <p className="oad-legacyprint-powered">

              Powered by the Ober LegacyPrint™ Voicing Engine

            </p>

            <button

              type="button"

              className="oad-tone-guide-button oad-tone-guide-button-footer"

              onClick={() => setShowVoiceNodeGuide(true)}

            >

              How to read the voice nodes

            </button>

          </div>

          <VoiceProfileDisclaimer />

        </div>

      </div>

      {showVoiceNodeGuide && (

        <LegacyPrintVoiceMapModal

          isAdmin

          onClose={() => setShowVoiceNodeGuide(false)}

          onLaunchVoiceFinder={() => {

            console.log('Launch Voice Finder preview');

          }}

        />

      )}

    </>

  );

};

const LegacyPrintView = ({ onShowSoundLegend, onCompare }) => (

  <div className="oad-legacy">

    <div className="oad-legacy-head">

      <span className="oad-side-kicker">Ober LegacyPrint™ Voicing Engine</span>

      <h2>Listening made more measurable.</h2>

      <p>

        LegacyPrint™ helps translate broad tonal language into clearer voicing

        direction. It does not replace ears, judgment, or craftsmanship — it

        gives the conversation more shape.

      </p>

    </div>

    <div className="oad-legacy-columns">

      <article className="oad-legacy-column">

        <h3>HERITAGE</h3>

        <p>

          Used to preserve the line’s warm, grounded tonal identity and keep

          builds aligned to the classic Ober voice.

        </p>

      </article>

      <article className="oad-legacy-column">

        <h3>FEUZØN</h3>

        <p>

          Used to compare broader sound areas, helping map where the hybrid

          architecture can push projection, complexity, and articulation.

        </p>

      </article>

      <article className="oad-legacy-column">

        <h3>SOUNDLEGEND</h3>

        <p>

          Used most deeply during discovery, planning, and voicing — where the

          tonal direction becomes more personal, more intentional, and more

          artist-shaped.

        </p>

      </article>

    </div>

    <div className="oad-feature-actions oad-feature-actions-legacy">

      <button

        type="button"

        className="oad-primary-btn"

        onClick={onShowSoundLegend}

      >

        See SoundLegend

      </button>

      <button type="button" className="oad-secondary-btn" onClick={onCompare}>

        Compare the lines

      </button>

    </div>

  </div>

);

const CompareView = ({ onSelectSeries, activeSeriesId }) => (

  <div className="oad-compare-inline">

    <div className="oad-compare-head">

      <span className="oad-side-kicker">Compare</span>

      <h2>How the lines differ</h2>

      <p>

        This is less about ranking and more about character. Each line carries a

        different center of gravity — in feel, response, philosophy, and how far

        the build process can stretch.

      </p>

    </div>

    <p className="oad-compare-helper-text">

      Hover or click one of the drums above — or choose a line below — to see how

      each Ober series shifts in feel, response, and build intent.

    </p>

    <div className="oad-compare-line-picker" aria-label="Choose a line to preview">

      {DRUM_SERIES.map((series) => (

        <button

          key={series.id}

          type="button"

          className={`oad-compare-line-button oad-compare-line-button-${series.id} ${

            activeSeriesId === series.id ? 'is-active' : ''

          }`}

          onMouseEnter={() => onSelectSeries(series.id)}

          onFocus={() => onSelectSeries(series.id)}

          onClick={() => onSelectSeries(series.id)}

        >

          <img src={series.logo} alt={series.name} />

          <span>{series.quote}</span>

        </button>

      ))}

    </div>

    <div className="oad-compare">

      <div className="oad-compare-desktop">

        <div className="oad-compare-series-header">

          <div className="oad-compare-series-header-spacer" />

          {DRUM_SERIES.map((series) => (

            <div

              key={series.id}

              className={`oad-compare-series-header-cell ${

                activeSeriesId === series.id ? 'is-active' : ''

              }`}

              onMouseEnter={() => onSelectSeries(series.id)}

            >

              <img

                src={series.logo}

                alt={series.name}

                className="oad-compare-series-logo"

              />

            </div>

          ))}

        </div>

        <div className="oad-compare-stack">

          {COMPARE_ROWS.map((row) => (

            <div key={row.label} className="oad-compare-row-card">

              <div className="oad-compare-topic">

                <span className="oad-compare-topic-title">{row.label}</span>

                <p>{row.helper}</p>

              </div>

              <div className="oad-compare-series-grid">

                {DRUM_SERIES.map((series) => (

                  <article

                    key={series.id}

                    className={`oad-compare-series-card ${

                      activeSeriesId === series.id ? 'is-active' : ''

                    }`}

                    onMouseEnter={() => onSelectSeries(series.id)}

                  >

                    <p>{row[series.id]}</p>

                  </article>

                ))}

              </div>

            </div>

          ))}

        </div>

      </div>

      <div className="oad-compare-mobile">

        {COMPARE_ROWS.map((row) => (

          <div key={row.label} className="oad-compare-mobile-card">

            <div className="oad-compare-mobile-topic">

              <span className="oad-compare-topic-title">{row.label}</span>

              <p>{row.helper}</p>

            </div>

            <div className="oad-compare-mobile-series-list">

              {DRUM_SERIES.map((series) => (

                <button

                  key={series.id}

                  type="button"

                  className={`oad-compare-mobile-series-item ${

                    activeSeriesId === series.id ? 'is-active' : ''

                  }`}

                  onClick={() => onSelectSeries(series.id)}

                >

                  <img

                    src={series.logo}

                    alt={series.name}

                    className="oad-compare-mobile-logo"

                  />

                  <p>{row[series.id]}</p>

                </button>

              ))}

            </div>

          </div>

        ))}

      </div>

    </div>

  </div>

);

const StageImage = ({

  primaryTab,

  activeSeries,

  collectionBaseImage,

  brightAllImage,

  onActivateSeries,

  onCommitSeries,

}) => {

  const isCollection = primaryTab === 'collection';

  return (

    <div

      className={`oad-stage-interactive ${

        primaryTab === 'compare' ? 'oad-stage-interactive--compare' : ''

      }`}

    >

      <div className="oad-stage-wrap">

        <div className="oad-stage-figure">

          <img

            src={isCollection ? collectionBaseImage : brightAllImage}

            alt=""

            className="oad-stage-image oad-stage-image-base"

            draggable="false"

          />

          {isCollection && (

            <img

              src={activeSeries.activeLayer}

              alt=""

              className={`oad-stage-image oad-stage-image-active is-visible oad-active-${activeSeries.id}`}

              draggable="false"

            />

          )}

          <div className="oad-zone-hitwrap" aria-label="Select a drum series">

            {DRUM_SERIES.map((series) => (

              <button

                key={series.id}

                type="button"

                className={`oad-zone-hit oad-zone-hit-${series.id}`}

                aria-label={`Show ${series.name}`}

                onMouseEnter={() => onActivateSeries(series.id)}

                onFocus={() => onActivateSeries(series.id)}

                onClick={() => onCommitSeries(series.id)}

              />

            ))}

          </div>

          <div className="oad-stage-logo-row" aria-label="Series selection">

            {[

              getSeriesById('heritage'),

              getSeriesById('soundlegend'),

              getSeriesById('feuzon'),

            ].map((series) => (

              <button

                key={series.id}

                type="button"

                className={`oad-stage-logo-button oad-stage-logo-button-${series.id} ${

                  activeSeries.id === series.id ? 'is-active' : ''

                }`}

                onMouseEnter={() => onActivateSeries(series.id)}

                onFocus={() => onActivateSeries(series.id)}

                onClick={() => onCommitSeries(series.id)}

                aria-label={`Show ${series.name}`}

              >

                <img

                  src={series.logo}

                  alt={series.name}

                  className="oad-stage-logo-image"

                  draggable="false"

                />

              </button>

            ))}

          </div>

        </div>

      </div>

 {primaryTab === 'collection' && (

  <div className="oad-stage-helper-wrap">

    <p className="oad-stage-helper">

      Hover or click one of the drums to preview each Ober line.

    </p>

  </div>

)}

    </div>

  );

};

const ArtisanDrums = () => {

  const navigate = useNavigate();

  const [primaryTab, setPrimaryTab] = useState('collection');

  const [activeSeriesId, setActiveSeriesId] = useState('soundlegend');

  const activeSeries = useMemo(

    () => getSeriesById(activeSeriesId),

    [activeSeriesId]

  );

  const backgroundOnly = `${ASSET_BASE}/background-only.png`;

  const collectionBaseImage = `${ASSET_BASE}/drums-only-faded.png`;

  const brightAllImage = `${ASSET_BASE}/drums-only-bright.png`;

  const handleNavigate = useCallback(

    (href) => {

      navigate(href);

    },

    [navigate]

  );

  const handleSeriesPreview = useCallback((seriesId) => {

    setActiveSeriesId(seriesId);

  }, []);

  const handleSeriesCommit = useCallback((seriesId) => {

    setActiveSeriesId(seriesId);

  }, []);

  return (

    <section className="oad-collection" aria-label="Our Collection">

      <div

        className="oad-collection-bg"

        aria-hidden="true"

        style={{ backgroundImage: `url("${backgroundOnly}")` }}

      />

      <div className="oad-collection-vignette" aria-hidden="true" />

      <div className="oad-collection-shell">

        <header className="oad-collection-header">

          <span className="oad-kicker">Our Collection</span>

          <h1 className="oad-title">

            Three lines.

            <br />

            One philosophy.

          </h1>

          <p className="oad-lead">

            Explore how HERITAGE, FEUZØN, and SOUNDLEGEND each express a

            different side of the Ober Artisan voice — from rooted warmth, to

            hybrid range, to fully tailored custom storytelling.

          </p>

        </header>

        <CollectionViewToggle primaryTab={primaryTab} onChange={setPrimaryTab} />

        <StageImage

          primaryTab={primaryTab}

          activeSeries={activeSeries}

          collectionBaseImage={collectionBaseImage}

          brightAllImage={brightAllImage}

          onActivateSeries={handleSeriesPreview}

          onCommitSeries={handleSeriesCommit}

        />

        <div

          className={`oad-panel ${

            primaryTab !== 'collection' ? 'oad-panel-static' : ''

          }`}

        >

          {primaryTab === 'collection' && (

            <SeriesFeature

              series={activeSeries}

              onNavigate={handleNavigate}

              onCompare={() => setPrimaryTab('compare')}

            />

          )}

          {primaryTab === 'compare' && (

            <CompareView

              activeSeriesId={activeSeriesId}

              onSelectSeries={handleSeriesPreview}

            />

          )}

          {primaryTab === 'legacyprint' && (

            <LegacyPrintView

              onShowSoundLegend={() => {

                setActiveSeriesId('soundlegend');

                setPrimaryTab('collection');

              }}

              onCompare={() => setPrimaryTab('compare')}

            />

          )}

        </div>

      </div>

    </section>

  );

};

export default ArtisanDrums;