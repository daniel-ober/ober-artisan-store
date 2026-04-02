import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { computeBandsFromSpec } from '../utils/tuningMath';
import './SoundLegendShowroom.css';

/* =============== helpers =============== */
const parseLegacyHzRange = (txt = '') => {
  const m = String(txt)
    .replace(/[–—]/g, '-')
    .match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*hz/i);

  return m ? { lowHz: Number(m[1]), highHz: Number(m[2]) } : null;
};

const parseFundamentalHz = (txt = '') => {
  const m = String(txt).match(/(\d+(?:\.\d+)?)\s*hz/i);
  return m ? Number(m[1]) : null;
};

const labelForVariant = (v) => {
  switch ((v || '').toLowerCase()) {
    case 'legacy':
      return 'Legacy Tuning';
    case 'adjacent-low':
      return 'Lower Tuning';
    case 'adjacent-high':
      return 'Higher Tuning';
    default:
      return 'Other';
  }
};

function guessMime(url = '') {
  const u = String(url).toLowerCase().split('?')[0];
  if (u.endsWith('.mp3')) return 'audio/mpeg';
  if (u.endsWith('.m4a')) return 'audio/mp4';
  if (u.endsWith('.aac')) return 'audio/aac';
  if (u.endsWith('.ogg') || u.endsWith('.oga')) return 'audio/ogg';
  if (u.endsWith('.wav') || u.endsWith('.wave')) return 'audio/wav';
  return '';
}

function getPublishedSnapshot(d) {
  const top = d?.publishedSnapshot;
  if (top && String(top.status).toLowerCase() === 'published') return top;

  const prism = d?.soundprism?.publishedSnapshot;
  if (prism && String(prism.status).toLowerCase() === 'published') return prism;

  return null;
}

function getStickyNavbarHeight() {
  if (typeof window === 'undefined') return 96;

  const width = window.innerWidth;

  if (width <= 480) return 132;
  if (width <= 640) return 118;
  if (width <= 768) return 104;
  if (width <= 1024) return 96;
  return 88;
}

/* =============== audio card =============== */
function AudioSampleCard({ sample, index }) {
  const {
    title,
    url,
    description,
    cueStart = 0,
    cueEnd = 0,
    variant,
  } = sample || {};

  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [errText, setErrText] = useState('');
  const [loadedOnce, setLoadedOnce] = useState(false);

  const start = Number(cueStart) || 0;

  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.index !== index && isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      }
    };

    window.addEventListener('slv:audioPlay', handler);
    return () => window.removeEventListener('slv:audioPlay', handler);
  }, [isPlaying, index]);

  const fmt = (s) => {
    const n = Math.max(0, Math.floor(s || 0));
    const m = Math.floor(n / 60);
    const ss = String(n % 60).padStart(2, '0');
    return `${m}:${ss}`;
  };

  const onLoadedMetadata = () => {
    const el = audioRef.current;
    if (!el) return;

    setDur(el.duration || 0);

    if (!loadedOnce && start > 0 && start < (el.duration || start + 0.1)) {
      try {
        el.currentTime = start;
      } catch {
        // no-op
      }
    }

    setLoadedOnce(true);
  };

  const onTimeUpdate = () => {
    const el = audioRef.current;
    if (!el) return;

    if (cueEnd && el.currentTime >= cueEnd) {
      el.pause();
      setIsPlaying(false);
      el.currentTime = start || 0;
      setCur(el.currentTime);
    } else {
      setCur(el.currentTime);
    }
  };

  const onEnded = () => {
    setIsPlaying(false);
    if (audioRef.current && start) audioRef.current.currentTime = start;
  };

  const onError = () => {
    const el = audioRef.current;
    let msg = 'Audio failed to load.';

    if (el?.error) {
      const codes = {
        1: 'Fetching process aborted by user.',
        2: 'Network error prevented audio from loading.',
        3: 'Decoding error: format not decodable by the browser.',
        4: 'Unsupported audio format or MIME type.',
      };
      msg = codes[el.error.code] || msg;
    }

    setErrText(`${msg} Please use mp3/m4a/wav/ogg.`);
    setDur(0);
    setIsPlaying(false);
  };

  const toggle = async () => {
    const el = audioRef.current;
    if (!el) return;

    setErrText('');

    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
      return;
    }

    if (start && (el.currentTime < start - 0.15 || el.currentTime === 0)) {
      try {
        el.currentTime = start;
      } catch {
        // no-op
      }
    }

    window.dispatchEvent(
      new CustomEvent('slv:audioPlay', { detail: { index } })
    );

    try {
      await el.play();
      setIsPlaying(true);
    } catch {
      setErrText(
        'Unable to start playback. Check format and that the file loaded.'
      );
      setIsPlaying(false);
    }
  };

  const hintedType = guessMime(url);
  const end = cueEnd && cueEnd > start ? cueEnd : dur || 0;
  const span = Math.max(0.0001, end - start);
  const pct = Math.max(0, Math.min(1, (cur - start) / span)) * 100;

  const onScrub = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const r = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const t = start + r * span;

    if (audioRef.current) {
      try {
        audioRef.current.currentTime = t;
      } catch {
        // no-op
      }
      setCur(t);
    }
  };

  const showSnareHeader = ['legacy', 'adjacent-low', 'adjacent-high'].includes(
    variant || ''
  );

  return (
    <div className="sl-audio-card">
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
        onError={onError}
      >
        <source src={url} type={hintedType || undefined} />
        <source src={url} />
      </audio>

      <div className="sl-audio-top">
        <button
          className={`sl-audio-play ${isPlaying ? 'playing' : ''}`}
          onClick={toggle}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          type="button"
        >
          {isPlaying ? (
            <svg
              className="sl-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <rect x="5" y="4" width="4" height="16" rx="1" />
              <rect x="15" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg
              className="sl-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <polygon points="6,4 20,12 6,20" />
            </svg>
          )}
        </button>

        <div className="sl-audio-meta">
          {showSnareHeader ? (
            <div className="sl-snare-h">Wire tension</div>
          ) : null}
          <div className="sl-audio-title">{title || `Sample ${index + 1}`}</div>
          {description ? (
            <div className="sl-audio-desc">{description}</div>
          ) : null}
          {errText ? <div className="sl-audio-error">{errText}</div> : null}
        </div>

        <div className="sl-audio-time" aria-label="time">
          <span>{fmt(cur)}</span>
          <span> / </span>
          <span>{fmt(end || dur)}</span>
        </div>
      </div>

      <div
        className="sl-audio-bar"
        onClick={onScrub}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div className="sl-audio-progress" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* =============== page =============== */
const SoundLegendShowroom = () => {
  const { serial: serialParam } = useParams();
  const serial = String(serialParam ?? '')
    .trim()
    .toUpperCase();

  const [drumData, setDrumData] = useState(null);
  const [loading, setLoading] = useState(Boolean(serial));
  const [modalIndex, setModalIndex] = useState(null);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('artist');

  const artistRef = useRef(null);
  const galleryRef = useRef(null);
  const audioRef = useRef(null);
  const tuningRef = useRef(null);

  const updateStickyVars = useCallback(() => {
    const navbarHeight = getStickyNavbarHeight();
    const viewbarHeight = window.innerWidth <= 640 ? 52 : 58;
    const extraGap = window.innerWidth <= 640 ? 10 : 10;

    document.documentElement.style.setProperty(
      '--sl-navbar',
      `${navbarHeight}px`
    );
    document.documentElement.style.setProperty(
      '--sl-viewbar-h',
      `${viewbarHeight}px`
    );
    document.documentElement.style.setProperty(
      '--sl-offset',
      `${navbarHeight + viewbarHeight + extraGap}px`
    );
  }, []);

  useEffect(() => {
    updateStickyVars();

    let rafId = null;
    const handleRecalc = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        updateStickyVars();
      });
    };

    window.addEventListener('resize', handleRecalc, { passive: true });
    window.addEventListener('scroll', handleRecalc, { passive: true });

    return () => {
      window.removeEventListener('resize', handleRecalc);
      window.removeEventListener('scroll', handleRecalc);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [updateStickyVars]);

  useEffect(() => {
    if (!serial) return;

    let alive = true;

    (async () => {
      try {
        const ref = doc(db, 'soundlegend_showroom', serial);
        const snap = await getDoc(ref);

        if (!alive) return;
        setDrumData(snap.exists() ? snap.data() : { notFound: true });
      } catch {
        if (alive) setDrumData({ notFound: true });
      } finally {
        if (alive) setLoading(false);
      }
    })();

    window.scrollTo({ top: 0, behavior: 'auto' });

    return () => {
      alive = false;
    };
  }, [serial]);

  useEffect(() => {
    document.querySelectorAll('.fade-in-section').forEach((el) => {
      el.classList.remove('loading');
      el.classList.add('is-visible');
    });
  }, [loading]);

  const name = drumData?.name ?? '';
  const heroImage = drumData?.heroImage ?? null;
  const gallery = Array.isArray(drumData?.gallery) ? drumData.gallery : [];
  const storyHtml = drumData?.story ?? drumData?.specs?.story ?? '';
  const specs = drumData?.specs || {};

  const publishedSnapshot = getPublishedSnapshot(drumData);
  const spBands = Array.isArray(publishedSnapshot?.sweetSpots)
    ? publishedSnapshot.sweetSpots
    : [];
  const spPalette = publishedSnapshot?.palette || drumData?.palette || null;

  const sweetSpots = spBands.length
    ? spBands.map(({ id, label, loHz, hiHz }) => ({
        id,
        label,
        loHz: Number(loHz),
        hiHz: Number(hiHz),
      }))
    : (() => {
        const legacyText = (specs.legacyTuningNotes || '').trim();
        const legacyParsed = parseLegacyHzRange(legacyText) || {};
        const comp = computeBandsFromSpec(specs, drumData);
        const legacyLo = Number(comp.legacyLowHz ?? legacyParsed.lowHz ?? 200);
        const legacyHi = Number(
          comp.legacyHighHz ?? legacyParsed.highHz ?? 220
        );

        return [
          {
            id: 'low',
            label: 'Low',
            loHz: Math.max(100, legacyLo - 50),
            hiHz: Math.max(legacyLo - 10, legacyLo - 5),
          },
          {
            id: 'legacy',
            label: 'Legacy',
            loHz: legacyLo,
            hiHz: legacyHi,
          },
          {
            id: 'high',
            label: 'High',
            loHz: legacyHi + 10,
            hiHz: Math.min(750, legacyHi + 90),
          },
        ];
      })();

  const shellFundHz =
    Number(drumData?.inputs?.fundamentalHz) ||
    Number(specs.shellFundHz) ||
    parseFundamentalHz(specs.fundamentalPitch || '') ||
    null;

  const rawSamples = Array.isArray(drumData?.audioSamples)
    ? drumData.audioSamples
    : [];
  const visibleSamples = rawSamples.filter(
    (s) => s && s.url && s.visible !== false
  );

  const order = { legacy: 0, 'adjacent-low': 1, 'adjacent-high': 2, other: 3 };
  const audioSamples = visibleSamples
    .map((s, i) => ({ ...s, _i: i }))
    .sort((a, b) => {
      const ra = order[a.variant || 'other'] ?? 3;
      const rb = order[b.variant || 'other'] ?? 3;
      return ra !== rb ? ra - rb : a._i - b._i;
    });

  const filteredGallery = (Array.isArray(gallery) ? gallery : [])
    .filter(Boolean)
    .filter((u) => u !== heroImage)
    .filter((u, i, arr) => arr.indexOf(u) === i);

  const showArtist = Boolean(
    (name && name.trim()) || (storyHtml && storyHtml.trim())
  );
  const showTuning = false;
  const showGallery = filteredGallery.length > 0;
  const showAudio = audioSamples.length > 0;

  const tabs = useMemo(
    () =>
      [
        showArtist ? { key: 'artist', label: 'Artist', ref: artistRef } : null,
        showAudio ? { key: 'audio', label: 'Sound', ref: audioRef } : null,
        showGallery
          ? { key: 'gallery', label: 'Gallery', ref: galleryRef }
          : null,
        showTuning ? { key: 'tuning', label: 'Tuning', ref: tuningRef } : null,
      ].filter(Boolean),
    [showArtist, showAudio, showGallery, showTuning]
  );

  const scrollToSection = useCallback((key) => {
    const targetMap = {
      artist: artistRef,
      audio: audioRef,
      gallery: galleryRef,
      tuning: tuningRef,
    };

    const el = targetMap[key]?.current;
    if (!el) return;

    const rawOffset = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue(
        '--sl-offset'
      ),
      10
    );

    const offset = Number.isFinite(rawOffset) ? rawOffset : 160;

    setActiveTab(key);

    el.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
    });

    window.setTimeout(() => {
      const scroller =
        document.scrollingElement || document.documentElement || document.body;

      scroller.scrollBy({
        top: -offset,
        left: 0,
        behavior: 'instant',
      });
    }, 260);
  }, []);

  useEffect(() => {
    if (!tabs.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleEntries[0]?.target?.dataset?.sectionKey) {
          setActiveTab(visibleEntries[0].target.dataset.sectionKey);
        }
      },
      {
        root: null,
        rootMargin: '-22% 0px -58% 0px',
        threshold: [0.15, 0.3, 0.5, 0.7],
      }
    );

    tabs.forEach((tab) => {
      if (tab.ref.current) {
        observer.observe(tab.ref.current);
      }
    });

    return () => observer.disconnect();
  }, [tabs]);

  if (!serial) return null;

  if (loading) {
    return <div className="showroom-loading">Loading drum details...</div>;
  }

  if (drumData?.notFound) {
    return <div className="showroom-not-found">❌ Drum not found.</div>;
  }

  return (
    <div className="soundlegend-showroom">
      <div className="sl-showroom-shell">
        <Link
          to="/artisan-shop/soundlegend/vault"
          className="showroom-logo-link"
          aria-label="Back to Legacy Vault home"
        >
          <img
            src="/logos/sl-vault-white.png"
            alt="SoundLegend Series"
            className={`showroom-logo fade-in-section ${logoLoaded ? 'is-visible' : 'loading'}`}
            onLoad={() => setLogoLoaded(true)}
          />
        </Link>

        {tabs.length > 0 ? (
          <nav className="sl-viewbar" aria-label="Jump to section">
            <div className="sl-viewbar-inner">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`sl-pill ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    scrollToSection(tab.key);
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>
        ) : null}

        <div
          className={`showroom-hero fade-in-section ${heroLoaded ? 'is-visible' : 'loading'}`}
        >
          {heroImage ? (
            <img
              src={heroImage}
              alt={name || 'SoundLegend Snare'}
              className="showroom-hero-image"
              onLoad={() => setHeroLoaded(true)}
              draggable={false}
            />
          ) : (
            <video
              className="showroom-hero-video"
              src="/craft_in_motion/craftinmotion4k.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onLoadedData={() => setHeroLoaded(true)}
            />
          )}
        </div>

        {showArtist ? (
          <section
            id="artist"
            ref={artistRef}
            data-section-key="artist"
            className="showroom-section showroom-story fade-in-section is-visible"
            aria-labelledby="sl-story-h"
          >
            <div className="showroom-section-inner showroom-story-inner">
              {name ? (
                <h1 id="sl-story-h" className="artist-name">
                  {name}
                </h1>
              ) : null}

              <p className="legacy-subtitle">LEGACY ARTIST ({serial})</p>

              {storyHtml ? (
                <div
                  className="showroom-story-content"
                  dangerouslySetInnerHTML={{ __html: storyHtml }}
                />
              ) : null}
            </div>
          </section>
        ) : null}

        {showAudio ? (
          <section
            id="audio"
            ref={audioRef}
            data-section-key="audio"
            className="showroom-section sl-audio-section fade-in-section is-visible"
            aria-labelledby="sl-audio-h"
          >
            <div className="showroom-section-inner">
              <div className="sl-section-heading">
                <p className="sl-section-kicker">Legacy Vault</p>
                <h2 id="sl-audio-h" className="sl-section-title">
                  Legacy Sound
                </h2>
                <p className="sl-section-copy">
                  Legacy first. These clips show the voice of the shell and the
                  room around it.
                </p>
              </div>

              <div className="sl-audio-grid">
                {audioSamples.map((s, i) => (
                  <div
                    key={`${s.url || s.title || 'sample'}-${i}`}
                    className={`sl-audio-cell ${s.variant || 'other'}`}
                    aria-label={labelForVariant(s.variant)}
                  >
                    <div
                      className={`sl-audio-tag tag-${(s.variant || 'other').replace('adjacent-', '')}`}
                    >
                      {labelForVariant(s.variant)}
                    </div>
                    <AudioSampleCard sample={s} index={i} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {showGallery ? (
          <section
            id="gallery"
            ref={galleryRef}
            data-section-key="gallery"
            className="showroom-section showroom-gallery fade-in-section is-visible"
            aria-labelledby="sl-gallery-h"
          >
            <div className="showroom-section-inner">
              <div className="sl-section-heading">
                <p className="sl-section-kicker">Legacy Vault</p>
                <h2 id="sl-gallery-h" className="sl-section-title">
                  Legacy Gallery
                </h2>
              </div>

              <div className="gallery-grid">
                {filteredGallery.map((img, i) => (
                  <button
                    key={img}
                    type="button"
                    className="gallery-tile"
                    onClick={() => setModalIndex(i)}
                  >
                    <img
                      src={img}
                      alt={`${name || 'SoundLegend'} - ${i + 1}`}
                      className="gallery-thumb"
                      draggable={false}
                    />
                  </button>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {modalIndex !== null && filteredGallery.length > 0 ? (
          <div
            className="showroom-modal-overlay"
            onClick={() => setModalIndex(null)}
          >
            <div
              className="showroom-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="showroom-modal-close"
                onClick={() => setModalIndex(null)}
                type="button"
              >
                ✕
              </button>

              <button
                className="showroom-modal-prev"
                type="button"
                onClick={() =>
                  setModalIndex(
                    (modalIndex - 1 + filteredGallery.length) %
                      filteredGallery.length
                  )
                }
              >
                ‹
              </button>

              <img
                src={filteredGallery[modalIndex]}
                alt="Preview"
                className="showroom-modal-image"
                draggable={false}
              />

              <button
                className="showroom-modal-next"
                type="button"
                onClick={() =>
                  setModalIndex((modalIndex + 1) % filteredGallery.length)
                }
              >
                ›
              </button>
            </div>
          </div>
        ) : null}

        <section className="showroom-section showroom-legacy fade-in-section is-visible">
          <div className="showroom-section-inner showroom-legacy-inner">
            <p>
              This SoundLegend drum is digitally authenticated and part of an
              exclusive artist series.
            </p>
            <p>
              <a href="/soundlegends/signin" className="portal-link">
                Sign in here
              </a>{' '}
              to access your portal, or{' '}
              <a href="/artisan-shop/soundlegend" className="portal-link">
                learn more about joining the SoundLegend experience
              </a>
              .
            </p>
          </div>
        </section>

        <div className="showroom-cta fade-in-section is-visible">
          <a href="/artisan-shop/soundlegend" className="cta-button">
            Start Your Custom Snare Journey
          </a>
        </div>
      </div>
    </div>
  );
};

export default SoundLegendShowroom;
