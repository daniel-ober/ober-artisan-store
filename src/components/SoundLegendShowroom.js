import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useLayoutEffect,
} from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { computeBandsFromSpec } from '../utils/tuningMath';
import './SoundLegendShowroom.css';

/* =============== helpers =============== */
const parseLegacyHzRange = (txt = '') => {
  const m = txt
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
  const u = url.toLowerCase().split('?')[0];
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

/* ===== scroll container helpers ===== */
function isScrollable(el) {
  if (!el) return false;
  const cs = getComputedStyle(el);
  const overflowY = cs.overflowY;
  const canScroll = /(auto|scroll|overlay)/.test(overflowY);
  return canScroll && el.scrollHeight > el.clientHeight + 1;
}
function findScrollParent(start) {
  let el = start?.parentElement || document.body;
  while (el && el !== document.body && el !== document.documentElement) {
    if (isScrollable(el)) return el;
    el = el.parentElement;
  }
  // if body/html is the scroller OR the site uses window scrolling
  return window;
}
function getAbsTopWithin(el, root) {
  if (!el) return 0;
  if (root === window) {
    const r = el.getBoundingClientRect();
    return r.top + window.pageYOffset;
  }
  const elRect = el.getBoundingClientRect();
  const rootRect = root.getBoundingClientRect();
  return elRect.top - rootRect.top + root.scrollTop;
}

/* =============== audio card =============== */
function AudioSampleCard({ sample, index, onAnyPlay }) {
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
      } catch {}
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
    if (el && el.error) {
      const codes = {
        1: 'Fetching process aborted by user.',
        2: 'Network error prevented audio from loading.',
        3: 'Decoding error: format not decodable by the browser.',
        4: 'Unsupported audio format or MIME type.',
      };
      msg = codes[el.error.code] || msg;
    }
    setErrText(msg + ' Please use mp3/m4a/wav/ogg.');
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
      onAnyPlay?.(index, false);
      return;
    }
    if (start && (el.currentTime < start - 0.15 || el.currentTime === 0)) {
      try {
        el.currentTime = start;
      } catch {}
    }
    window.dispatchEvent(
      new CustomEvent('slv:audioPlay', { detail: { index } })
    );
    try {
      await el.play();
      setIsPlaying(true);
      onAnyPlay?.(index, true);
    } catch {
      setErrText(
        'Unable to start playback. Check format and that the file loaded.'
      );
      setIsPlaying(false);
      onAnyPlay?.(index, false);
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
      } catch {}
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
          {showSnareHeader && <div className="sl-snare-h">Wire tension</div>}
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

  // anchors
  const artistRef = useRef(null);
  const tuningRef = useRef(null);
  const galleryRef = useRef(null);
  const audioRef = useRef(null);

  // sticky pills / scrolling infra
  const viewbarRef = useRef(null);
  const [headerTop, setHeaderTop] = useState(72);
  const headerElRef = useRef(null);
  const [active, setActive] = useState('artist');
  const [isLocked, setIsLocked] = useState(false);
  const lockTimerRef = useRef(null);

  const [scrollRoot, setScrollRoot] = useState(window); // window or a scrollable div

  // fetch drum doc
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
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
    return () => {
      alive = false;
    };
  }, [serial]);

  // after first layout, detect real scroll container
  useLayoutEffect(() => {
    // choose an anchor that surely exists
    const anchor = artistRef.current || viewbarRef.current || document.body;
    const root = findScrollParent(anchor);
    setScrollRoot(root);
  }, []);

  // neutralize fade-ins
  useEffect(() => {
    document.querySelectorAll('.fade-in-section').forEach((el) => {
      el.classList.remove('loading');
      el.classList.add('is-visible');
    });
  }, [loading]);

  // measure sticky top and expose CSS vars
  const measureStickyTop = useCallback(() => {
    const candidates = [
      document.querySelector('.navbar-sticky-wrapper'),
      document.querySelector('.site-header'),
      document.querySelector('header'),
      document.querySelector('.navbar'),
    ].filter(Boolean);

    let chosen = candidates[0] || null;
    for (const el of candidates) {
      const cs = getComputedStyle(el);
      if (
        (cs.position === 'fixed' || cs.position === 'sticky') &&
        el.offsetHeight > 0
      ) {
        chosen = el;
        break;
      }
    }
    headerElRef.current = chosen;

    let navH = 0;
    if (chosen)
      navH = Math.max(
        0,
        Math.round(chosen.getBoundingClientRect().height || 0)
      );
    const top = Math.max(56, navH);
    setHeaderTop(top);

    const pillsH = viewbarRef.current
      ? Math.max(
          36,
          Math.round(viewbarRef.current.getBoundingClientRect().height || 40)
        )
      : 40;

    const fullOffset = top + pillsH + 14;
    document.documentElement.style.setProperty('--sl-navbar', `${top}px`);
    document.documentElement.style.setProperty(
      '--sl-offset',
      `${fullOffset}px`
    );
  }, []);

  useLayoutEffect(() => {
    measureStickyTop();
    const onResizeOrScroll = () => measureStickyTop();
    window.addEventListener('resize', onResizeOrScroll, { passive: true });
    window.addEventListener('scroll', onResizeOrScroll, { passive: true });

    let ro = null;
    if (headerElRef.current && 'ResizeObserver' in window) {
      ro = new ResizeObserver(() => measureStickyTop());
      ro.observe(headerElRef.current);
    }
    return () => {
      window.removeEventListener('resize', onResizeOrScroll);
      window.removeEventListener('scroll', onResizeOrScroll);
      if (ro) ro.disconnect();
    };
  }, [measureStickyTop]);

  // ---------- DERIVED ----------
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
          { id: 'legacy', label: 'Legacy', loHz: legacyLo, hiHz: legacyHi },
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
  const showTuning = true;
  const showGallery = filteredGallery.length > 0;
  const showAudio = audioSamples.length > 0;

  /* ===== offset from CSS var ===== */
  const getCssOffset = useCallback(
    () =>
      parseInt(
        getComputedStyle(document.documentElement).getPropertyValue(
          '--sl-offset'
        )
      ) || headerTop + 80,
    [headerTop]
  );

  /* ===== Scroll spy and active pill ===== */
  useEffect(() => {
    const map = [
      showArtist && { key: 'artist', ref: artistRef },
      showTuning && { key: 'tuning', ref: tuningRef },
      showGallery && { key: 'gallery', ref: galleryRef },
      showAudio && { key: 'audio', ref: audioRef },
    ].filter(Boolean);

    const offset = getCssOffset();
    const thresholds = Array.from({ length: 11 }, (_, i) => i / 10);

    const obs = new IntersectionObserver(
      (entries) => {
        if (isLocked) return;
        let bestKey = null;
        let bestRatio = 0;
        for (const entry of entries) {
          const item = map.find((m) => m.ref.current === entry.target);
          if (!item) continue;
          const topOK = entry.boundingClientRect.top <= offset;
          const score = entry.intersectionRatio + (topOK ? 0.01 : 0);
          if (score > bestRatio) {
            bestRatio = score;
            bestKey = item.key;
          }
        }
        if (bestKey) setActive(bestKey);
      },
      {
        root: scrollRoot === window ? null : scrollRoot,
        rootMargin: `-${offset}px 0px -55% 0px`,
        threshold: thresholds,
      }
    );

    map.forEach(({ ref }) => {
      if (ref.current) obs.observe(ref.current);
    });

    const syncNow = () => {
      if (isLocked) return;
      const currentScrollTop =
        scrollRoot === window ? window.pageYOffset : scrollRoot.scrollTop;
      const y = currentScrollTop + offset + 1;

      let current = map[0]?.key || 'artist';
      for (const { key, ref } of map) {
        const el = ref.current;
        if (!el) continue;
        const top = getAbsTopWithin(el, scrollRoot);
        if (top <= y) current = key;
        else break;
      }
      setActive(current);
    };
    syncNow();

    const onScroll = () => requestAnimationFrame(syncNow);
    (scrollRoot === window ? window : scrollRoot).addEventListener(
      'scroll',
      onScroll,
      { passive: true }
    );
    return () => {
      (scrollRoot === window ? window : scrollRoot).removeEventListener(
        'scroll',
        onScroll
      );
      obs.disconnect();
    };
  }, [
    showArtist,
    showTuning,
    showGallery,
    showAudio,
    getCssOffset,
    isLocked,
    scrollRoot,
  ]);

  /* ===== Deterministic scroll-to that works in nested scrollers ===== */
  const scrollToKey = (key) => {
    const map = {
      artist: artistRef,
      tuning: tuningRef,
      gallery: galleryRef,
      audio: audioRef,
    };
    const el = map[key]?.current;
    if (!el) return;

    const off = getCssOffset();
    const targetTop = Math.max(0, getAbsTopWithin(el, scrollRoot) - off);

    setActive(key);
    setIsLocked(true);
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    lockTimerRef.current = setTimeout(() => setIsLocked(false), 800);

    const root = scrollRoot === window ? window : scrollRoot;
    if ('scrollTo' in root) {
      root.scrollTo({ top: targetTop, behavior: 'smooth' });
    } else {
      // very old fallback
      root.scrollTop = targetTop;
    }
  };

  useEffect(
    () => () => {
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    },
    []
  );

  if (!serial) return null;
  if (loading)
    return <div className="showroom-loading">Loading drum details...</div>;
  if (drumData?.notFound)
    return <div className="showroom-not-found">❌ Drum not found.</div>;

  return (
    <div className="soundlegend-showroom">
      {/* Top logo */}
      <img
        src="/logos/sl-vault-white.png"
        alt="SoundLegend Series"
        className={`showroom-logo fade-in-section ${logoLoaded ? 'is-visible' : 'loading'}`}
        onLoad={() => setLogoLoaded(true)}
      />

      {/* Hero */}
      <div
        className={`showroom-hero fade-in-section ${heroLoaded ? 'is-visible' : 'loading'}`}
      >
        {heroImage && (
          <img
            src={heroImage}
            alt={name || 'SoundLegend Snare'}
            className="showroom-hero-image"
            onLoad={() => setHeroLoaded(true)}
            draggable={false}
          />
        )}
      </div>

      {/* Sticky pills */}
      {(showArtist || showTuning || showGallery || showAudio) && (
        <nav
          ref={viewbarRef}
          className="sl-viewbar"
          aria-label="Jump to section"
          style={{ top: headerTop }}
        >
          {showArtist && (
            <a
              href="#artist"
              className={`sl-pill ${active === 'artist' ? 'active' : ''}`}
              onClick={() => setActive('artist')}
            >
              Legacy Artist
            </a>
          )}
          {showAudio && (
            <a
              href="#audio"
              className={`sl-pill ${active === 'audio' ? 'active' : ''}`}
              onClick={() => setActive('audio')}
            >
              Legacy Sound
            </a>
          )}
          {showGallery && (
            <a
              href="#gallery"
              className={`sl-pill ${active === 'gallery' ? 'active' : ''}`}
              onClick={() => setActive('gallery')}
            >
              Legacy Gallery
            </a>
          )}
          {/* {showTuning && (
      <a
        href="#tuning"
        className={`sl-pill ${active === 'tuning' ? 'active' : ''}`}
        onClick={() => setActive('tuning')}
      >
        Legacy Tuning
      </a>
    )} */}
        </nav>
      )}

      {/* Story */}
      {showArtist && (
        <section
          id="artist"
          ref={artistRef}
          className="showroom-story elegant-font fade-in-section is-visible sl-anchor"
          aria-labelledby="sl-story-h"
        >
          {name ? (
            <h2 id="sl-story-h" className="artist-name">
              {name}
            </h2>
          ) : null}
          <p className="legacy-subtitle">LEGACY ARTIST ({serial})</p>
          {storyHtml ? (
            <div
              className="showroom-story-content"
              dangerouslySetInnerHTML={{ __html: storyHtml }}
            />
          ) : null}
        </section>
      )}

      {/* Audio */}
      {showAudio && (
        <section
          id="audio"
          ref={audioRef}
          className="sl-audio-section fade-in-section is-visible sl-anchor"
          aria-labelledby="sl-audio-h"
        >
          <h2 id="sl-audio-h" className="sl-audio-h2">
            LEGACY SOUND
          </h2>
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
                <AudioSampleCard sample={s} index={i} onAnyPlay={() => {}} />
              </div>
            ))}
          </div>
          <div className="sl-audio-note">
            Legacy first; the other samples show the useful room <em>around</em>{' '}
            it.
          </div>
        </section>
      )}

      {/* Gallery */}
      {showGallery && (
        <section
          id="gallery"
          ref={galleryRef}
          className="showroom-gallery fade-in-section is-visible sl-anchor"
          aria-labelledby="sl-gallery-h"
        >
          <h2 id="sl-gallery-h" className="visually-hidden">
            LEGACY GALLERY
          </h2>
          <div className="gallery-grid">
            {filteredGallery.map((img, i) => (
              <img
                key={img}
                src={img}
                alt={`${name || 'SoundLegend'} - ${i + 1}`}
                onClick={() => setModalIndex(i)}
                className="gallery-thumb"
                draggable={false}
              />
            ))}
          </div>
        </section>
      )}

      {/* Modal */}
      {modalIndex !== null && filteredGallery.length > 0 && (
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
            >
              ✕
            </button>
            <button
              className="showroom-modal-prev"
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
              onClick={() =>
                setModalIndex((modalIndex + 1) % filteredGallery.length)
              }
            >
              ›
            </button>
          </div>
        </div>
      )}

      {/* NFC / copy */}
      <section className="showroom-legacy fade-in-section is-visible">
        <p>
          This SoundLegend drum is digitally authenticated and part of an
          exclusive artist series...
          <br />
          <br />
          <a href="/soundlegends/signin" className="portal-link">
            Sign in here
          </a>{' '}
          to access your portal, or{' '}
          <a href="/artisan-shop/soundlegend" className="portal-link">
            learn more about joining the SoundLegend Experience
          </a>
          .
        </p>
      </section>

      {/* CTA */}
      <div className="showroom-cta fade-in-section is-visible">
        <a href="/artisan-shop/soundlegend" className="cta-button">
          Start Your Custom Snare Journey
        </a>
      </div>
    </div>
  );
};

export default SoundLegendShowroom;
