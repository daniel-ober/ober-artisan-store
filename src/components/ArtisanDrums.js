import React, { useMemo, useState, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import './ArtisanDrums.css';

const ASSET_BASE = `${process.env.PUBLIC_URL}/ober-artisan-showroom/color`;

export const DRUM_SERIES = [

  {

    id: 'heritage',

    name: 'HERITAGE',

    logo: '/resized-logos/heritage-white.png',

    quote: 'The drum that started it all — classic craftsmanship, timeless sound.',

    shortLabel: 'Heritage',

    bullets: [

      'Northern Red Oak shell',

      'Stave-built for pure resonance',

      '45° / roundover bearing edges',

      'Hand-scorched for visual depth and warmth',

      'Builds starting at $850',

    ],

    description:

      'HERITAGE is the line that grounds the Ober Artisan identity. It is rooted in traditional stave construction, tactile warmth, and a voice that feels seasoned, organic, and familiar without ever feeling ordinary.',

    voiceSummary:

      'A rooted, warm, seasoned response with a more classic and grounded feel under the stick.',

    toneProfile: [

      { label: 'Warmth', value: 90 },

      { label: 'Dryness', value: 72 },

      { label: 'Projection', value: 68 },

      { label: 'Complexity', value: 64 },

      { label: 'Versatility', value: 74 },

    ],

    href: '/artisan-shop/heritage',

    cta: 'Explore Heritage',

    activeLayer: `${ASSET_BASE}/drums-only-heritage.png`,

  },

  {

    id: 'feuzon',

    name: 'FEUZØN',

    logo: '/resized-logos/feuzon-white.png',

    quote: 'Blending tradition and innovation into one harmonious voice.',

    shortLabel: 'Feuzøn',

    bullets: [

      'Hybrid shell architecture: stave + steam-bent',

      '150+ unique build variations',

      '45° / roundover bearing edges',

      'Torch-tuned for balance, depth, and clarity',

      'Builds starting at $1050',

    ],

    description:

      'FEUZØN is where the Ober language becomes more modern and more expansive. Its hybrid shell architecture opens up greater tonal range, stronger articulation, and a more exploratory response under the stick.',

    voiceSummary:

      'A broader and more exploratory voice — stronger articulation, wider tonal spread, and more modern lift.',

    toneProfile: [

      { label: 'Warmth', value: 78 },

      { label: 'Dryness', value: 58 },

      { label: 'Projection', value: 86 },

      { label: 'Complexity', value: 88 },

      { label: 'Versatility', value: 90 },

    ],

    href: '/artisan-shop/feuzon',

    cta: 'Explore FEUZØN',

    activeLayer: `${ASSET_BASE}/drums-only-feuzon.png`,

  },

  {

    id: 'soundlegend',

    name: 'SOUNDLEGEND',

    logo: '/resized-logos/soundlegend-white.png',

    quote: 'Every drum tells a story — let’s craft yours together.',

    shortLabel: 'SoundLegend',

    bullets: [

      'Our most in-depth custom series',

      'Guided 1-on-1 discovery with Dan Ober',

      'High-resolution concept mockups',

      'Portal access and story tracking',

      'Builds starting at $1499',

    ],

    description:

      'SOUNDLEGEND is the fullest expression of the Ober process. It combines consultation, concept refinement, voicing intent, visual storytelling, and premium build execution into one deeply personal custom experience.',

    voiceSummary:

      'This is not a fixed sound. It is a rough directional sketch of what a SOUNDLEGEND build could lean toward when the process is pushed to its fullest level of customization.',

    toneProfile: [

      { label: 'Warmth', value: 84 },

      { label: 'Dryness', value: 76 },

      { label: 'Projection', value: 92 },

      { label: 'Complexity', value: 96 },

      { label: 'Versatility', value: 98 },

    ],

    href: '/artisan-shop/soundlegend',

    cta: 'Explore SoundLegend',

    activeLayer: `${ASSET_BASE}/drums-only-soundlegend.png`,

  },

];

const PRIMARY_TABS = [

  { id: 'collection', label: 'Collection' },

  { id: 'compare', label: 'Compare' },

  { id: 'legacyprint', label: 'LegacyPrint™' },

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

const getSeriesById = (id) => DRUM_SERIES.find((series) => series.id === id) || DRUM_SERIES[0];

const ToneBars = ({ profile }) => (

  <div className="oad-tone-bars" aria-label="Voice profile">

    {profile.map((item) => (

      <div key={item.label} className="oad-tone-row">

        <div className="oad-tone-meta">

          <span className="oad-tone-label">{item.label}</span>

          <span className="oad-tone-value">{item.value}</span>

        </div>

        <div className="oad-tone-track">

          <div className="oad-tone-fill" style={{ width: `${item.value}%` }} aria-hidden="true" />

        </div>

      </div>

    ))}

  </div>

);

const SeriesFeature = ({ series, onNavigate, onCompare }) => (

  <div className="oad-feature">

    <div className="oad-feature-main">

      <img

        src={series.logo}

        alt={`${series.name} logo`}

        className="oad-feature-logo"

        loading="eager"

        decoding="async"

      />

      <p className="oad-feature-quote">{series.quote}</p>

      <p className="oad-feature-copy">{series.description}</p>

    </div>

    <div className="oad-feature-side">

      <span className="oad-side-kicker">Voice profile</span>

      <h3>{series.shortLabel} at a glance</h3>

      <p className="oad-side-copy">{series.voiceSummary}</p>

      <ToneBars profile={series.toneProfile} />

    </div>

    <div className="oad-feature-points">

      {series.bullets.map((bullet) => (

        <div key={bullet} className="oad-feature-point">

          {bullet}

        </div>

      ))}

    </div>

    <div className="oad-feature-actions">

      <button type="button" className="oad-primary-btn" onClick={() => onNavigate(series.href)}>

        {series.cta}

      </button>

      <button type="button" className="oad-secondary-btn" onClick={onCompare}>

        Study the differences

      </button>

    </div>

  </div>

);

const LegacyPrintView = ({ onShowSoundLegend, onCompare }) => (

  <div className="oad-legacy">

    <div className="oad-legacy-head">

      <span className="oad-side-kicker">Ober LegacyPrint™ Voicing Engine</span>

      <h2>Listening made more measurable.</h2>

      <p>

        LegacyPrint™ helps translate broad tonal language into clearer voicing direction. It does not replace ears,

        judgment, or craftsmanship — it gives the conversation more shape.

      </p>

    </div>

    <div className="oad-legacy-columns">

      <article className="oad-legacy-column">

        <h3>HERITAGE</h3>

        <p>

          Used to preserve the line’s warm, grounded tonal identity and keep builds aligned to the classic Ober voice.

        </p>

      </article>

      <article className="oad-legacy-column">

        <h3>FEUZØN</h3>

        <p>

          Used to compare broader sound areas, helping map where the hybrid architecture can push projection,

          complexity, and articulation.

        </p>

      </article>

      <article className="oad-legacy-column">

        <h3>SOUNDLEGEND</h3>

        <p>

          Used most deeply during discovery, planning, and voicing — where the tonal direction becomes more personal,

          more intentional, and more artist-shaped.

        </p>

      </article>

    </div>

    <div className="oad-feature-actions oad-feature-actions-legacy">

      <button type="button" className="oad-primary-btn" onClick={onShowSoundLegend}>

        See SoundLegend

      </button>

      <button type="button" className="oad-secondary-btn" onClick={onCompare}>

        Compare the lines

      </button>

    </div>

  </div>

);

const CompareView = () => (

  <div className="oad-compare">

    <div className="oad-compare-head">

      <span className="oad-side-kicker">Compare</span>

      <h2>How the lines differ</h2>

      <p>

        This is less about ranking and more about character. Each line carries a different center of gravity — in feel,

        response, philosophy, and how far the build process can stretch.

      </p>

    </div>

    <div className="oad-compare-table">

      {COMPARE_ROWS.map((row) => (

        <div key={row.label} className="oad-compare-band">

          <div className="oad-compare-label">

            <span className="oad-compare-label-title">{row.label}</span>

            <p>{row.helper}</p>

          </div>

          <div className="oad-compare-value">

            <span className="oad-compare-series">HERITAGE</span>

            <p>{row.heritage}</p>

          </div>

          <div className="oad-compare-value">

            <span className="oad-compare-series">FEUZØN</span>

            <p>{row.feuzon}</p>

          </div>

          <div className="oad-compare-value">

            <span className="oad-compare-series">SOUNDLEGEND</span>

            <p>{row.soundlegend}</p>

          </div>

        </div>

      ))}

    </div>

  </div>

);

const StageImage = ({ primaryTab, activeSeries, collectionBaseImage, brightAllImage, onActivateSeries, onCommitSeries }) => {

  const isCollection = primaryTab === 'collection';

  return (

    <div className="oad-stage-interactive">

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

              className="oad-stage-image oad-stage-image-active is-visible"

              draggable="false"

            />

          )}

          {isCollection && (

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

          )}

        </div>

      </div>

    </div>

  );

};

const ArtisanDrums = () => {

  const navigate = useNavigate();

  const [primaryTab, setPrimaryTab] = useState('collection');

  const [activeSeriesId, setActiveSeriesId] = useState('soundlegend');

  const activeSeries = useMemo(() => getSeriesById(activeSeriesId), [activeSeriesId]);

  const backgroundOnly = `${ASSET_BASE}/background-only.png`;

  const collectionBaseImage = `${ASSET_BASE}/drums-only-faded.png`;

  const brightAllImage = `${ASSET_BASE}/drums-only-bright.png`;

  const handleNavigate = useCallback((href) => {

    navigate(href);

  }, [navigate]);

  const handleSeriesPreview = useCallback((seriesId) => {

    setActiveSeriesId(seriesId);

  }, []);

  const handleSeriesCommit = useCallback((seriesId) => {

    setPrimaryTab('collection');

    setActiveSeriesId(seriesId);

  }, []);

  return (

    <section className="oad-collection" aria-label="Our Collection">

      <div className="oad-collection-bg" aria-hidden="true" style={{ backgroundImage: `url("${backgroundOnly}")` }} />

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

            Explore how HERITAGE, FEUZØN, and SOUNDLEGEND each express a different side of the Ober Artisan voice —

            from rooted warmth, to hybrid range, to fully tailored custom storytelling.

          </p>

        </header>

        <nav className="oad-tabs" aria-label="Collection navigation">

          {PRIMARY_TABS.map((tab) => (

            <button

              key={tab.id}

              type="button"

              className={`oad-tab ${primaryTab === tab.id ? 'is-active' : ''}`}

              onClick={() => setPrimaryTab(tab.id)}

            >

              {tab.label}

            </button>

          ))}

        </nav>

        {primaryTab === 'collection' && (

          <nav className="oad-series-tabs" aria-label="Series selection">

            {DRUM_SERIES.map((series) => (

              <button

                key={series.id}

                type="button"

                className={`oad-series-tab ${activeSeriesId === series.id ? 'is-active' : ''}`}

                onMouseEnter={() => handleSeriesPreview(series.id)}

                onFocus={() => handleSeriesPreview(series.id)}

                onClick={() => handleSeriesCommit(series.id)}

              >

                {series.shortLabel}

              </button>

            ))}

          </nav>

        )}

        <StageImage

          primaryTab={primaryTab}

          activeSeries={activeSeries}

          collectionBaseImage={collectionBaseImage}

          brightAllImage={brightAllImage}

          onActivateSeries={handleSeriesPreview}

          onCommitSeries={handleSeriesCommit}

        />

        <div className={`oad-panel ${primaryTab !== 'collection' ? 'oad-panel-static' : ''}`}>

          {primaryTab === 'collection' && (

            <SeriesFeature

              series={activeSeries}

              onNavigate={handleNavigate}

              onCompare={() => setPrimaryTab('compare')}

            />

          )}

          {primaryTab === 'compare' && <CompareView />}

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