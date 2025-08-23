import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import './SoundLegendShowroom.css';

function guessMime(url = '') {
  const u = url.toLowerCase().split('?')[0];
  if (u.endsWith('.mp3')) return 'audio/mpeg';
  if (u.endsWith('.m4a')) return 'audio/mp4';
  if (u.endsWith('.aac')) return 'audio/aac';
  if (u.endsWith('.ogg') || u.endsWith('.oga')) return 'audio/ogg';
  if (u.endsWith('.wav') || u.endsWith('.wave')) return 'audio/wav';
  return '';
}

function AudioSampleCard({ sample, index, onAnyPlay }) {
  const { title, url, description, cueStart = 0, cueEnd = 0 } = sample || {};
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [errText, setErrText] = useState('');
  const start = Number(cueStart) || 0;
  const [loadedOnce, setLoadedOnce] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.index !== index && isPlaying) {
        if (audioRef.current) audioRef.current.pause();
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
    if (
      !loadedOnce &&
      start > 0 &&
      isFinite(start) &&
      start < (el.duration || start + 0.1)
    ) {
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
    const el = audioRef.current;
    if (el && start) el.currentTime = start;
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
      console.error('Audio error', { code: el.error.code, msg, sample });
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
    } catch (e) {
      console.warn('Audio play() rejected:', e);
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
    const x = e.clientX - rect.left;
    const r = Math.max(0, Math.min(1, x / rect.width));
    const t = start + r * span;
    if (audioRef.current) {
      try {
        audioRef.current.currentTime = t;
      } catch {}
      setCur(t);
    }
  };

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

const SoundLegendShowroom = () => {
  const params = useParams();
  const serialRaw = (params?.serial ?? '').toString().trim();
  const serial = serialRaw.toUpperCase();

  const shouldFetch = Boolean(serial);
  const [drumData, setDrumData] = useState(null);
  const [loading, setLoading] = useState(shouldFetch);
  const [modalIndex, setModalIndex] = useState(null);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const sectionsRef = useRef([]);

  const handleLogoLoad = () => setLogoLoaded(true);
  const handleHeroLoad = () => setHeroLoaded(true);

  useEffect(() => {
    if (!shouldFetch) return;
    let alive = true;
    (async () => {
      try {
        const ref = doc(db, 'soundlegend_showroom', serial);
        const snap = await getDoc(ref);
        if (!alive) return;
        setDrumData(snap.exists() ? snap.data() : { notFound: true });
      } catch (err) {
        console.error('Error fetching drum data:', err);
        if (alive) setDrumData({ notFound: true });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    window.scrollTo(0, 0);
    return () => {
      alive = false;
    };
  }, [serial, shouldFetch]);

  if (!shouldFetch) return null;

  // ---- Derived values
  const name = drumData?.name ?? 'Unknown Drum';
  const heroImage = drumData?.heroImage ?? null;
  const gallery = Array.isArray(drumData?.gallery) ? drumData.gallery : [];
  const story = drumData?.story ?? '';
  const specs = drumData?.specs || {};
  const fundamentalPitch = (specs.fundamentalPitch || '').trim(); // e.g., "206.7 Hz – G#3"
  const legacyTuningNotes = (specs.legacyTuningNotes || '').trim(); // e.g., "G3–A♭3 (196–208 Hz)"
  const size = (specs.size || '').trim();

  // Filter & SORT audio
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
      if (ra !== rb) return ra - rb;
      return a._i - b._i;
    });

  // Gallery (exclude hero)
  const filteredGallery = gallery
    .filter(Boolean)
    .filter((u) => u !== heroImage)
    .filter((u, i, arr) => arr.indexOf(u) === i);
  const slideCount = filteredGallery.length;

  useEffect(() => {
    if (modalIndex !== null && slideCount > 0 && modalIndex >= slideCount) {
      setModalIndex(0);
    }
  }, [modalIndex, slideCount]);

  const handleKeyDown = useCallback(
    (e) => {
      if (modalIndex === null || slideCount === 0) return;
      if (e.key === 'Escape') setModalIndex(null);
      if (e.key === 'ArrowRight')
        setModalIndex((prev) => (prev + 1) % slideCount);
      if (e.key === 'ArrowLeft')
        setModalIndex((prev) => (prev - 1 + slideCount) % slideCount);
    },
    [modalIndex, slideCount]
  );
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Section reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove('loading');
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.15 }
    );

    sectionsRef.current.forEach((el) => el && observer.observe(el));

    const fallbackTimer = setTimeout(() => {
      sectionsRef.current.forEach((el) => {
        el?.classList.remove('loading');
        el?.classList.add('is-visible');
      });
    }, 2000);

    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimer);
    };
  }, []);

  if (loading)
    return <div className="showroom-loading">Loading drum details...</div>;
  if (drumData?.notFound)
    return <div className="showroom-not-found">❌ Drum not found.</div>;

  // Build headers
  const audioHeader = 'Audio Samples';
  const explainer =
    'Legacy tuning is the builder’s reference for this drum — the pitch where the shell, edges, and heads ‘lock in’ and the instrument projects with maximum character. The fundamental pitch is the lowest resonant frequency the shell-head system naturally emphasizes; moving above/below it changes feel, overtones, and articulation.';

  return (
    <div className="soundlegend-showroom">
      {/* Header Logo */}
      <img
        src="/logos/sl-vault-white.png"
        alt="SoundLegend Series"
        className={`showroom-logo fade-in-section ${logoLoaded ? 'is-visible' : 'loading'}`}
        onLoad={handleLogoLoad}
        ref={(el) => (sectionsRef.current[0] = el)}
      />

      {/* Hero */}
      <div
        className={`showroom-hero fade-in-section ${heroLoaded ? 'is-visible' : 'loading'}`}
        ref={(el) => (sectionsRef.current[1] = el)}
      >
        {heroImage && (
          <img
            src={heroImage}
            alt={name}
            className="showroom-hero-image"
            onLoad={handleHeroLoad}
            draggable={false}
          />
        )}
      </div>

      {/* Story */}
      {story && (
        <section
          className="showroom-story elegant-font fade-in-section loading"
          ref={(el) => (sectionsRef.current[2] = el)}
        >
          <h1 className="artist-name">{name}</h1>
          <p className="legacy-subtitle">
            SoundLegend Legacy Artist ({serial})
          </p>
          <div
            className="showroom-story-content"
            dangerouslySetInnerHTML={{ __html: story }}
          />
        </section>
      )}

      {/* Audio Samples (sorted) */}
      {audioSamples.length > 0 && (
        <section
          className="sl-audio-section fade-in-section loading"
          ref={(el) => (sectionsRef.current[3] = el)}
        >
          <h2 className="sl-audio-h2">{audioHeader}</h2>
          <p className="sl-audio-explainer">{explainer}</p>

          {/* Facts bar */}
          {(fundamentalPitch || legacyTuningNotes || size) && (
            <div className="sl-audio-facts">
              {/* <div className="fact">
                <span className="k">Size</span>
                <span className="v">{size}</span>
              </div> */}
              <div className="fact">
                <span className="k">Fundamental</span>
                <span className="v">{fundamentalPitch}</span>
              </div>
              {legacyTuningNotes && (
                <div className="fact">
                  <span className="k">Legacy Range</span>
                  <span className="v legacy-range">{legacyTuningNotes}</span>
                </div>
              )}
            </div>
          )}

          <div className="sl-audio-grid">
            {audioSamples.map((s, i) => (
              <div
                key={`${s.url || s.title || 'sample'}-${i}`}
                className={`sl-audio-cell ${s.variant || 'other'}`}
              >
                <div className="sl-audio-tag">
                  {s.variant === 'legacy'
                    ? 'Legacy Tuning'
                    : s.variant === 'adjacent-low'
                      ? 'Adjacent Tuning — Low'
                      : s.variant === 'adjacent-high'
                        ? 'Adjacent Tuning — High'
                        : 'Other'}
                </div>
                <AudioSampleCard sample={s} index={i} onAnyPlay={() => {}} />
              </div>
            ))}
          </div>

          <div className="sl-audio-note">
            Legacy first; adjacent tunings demonstrate useful range around the
            reference pitch.
          </div>
        </section>
      )}

      {/* Gallery */}
      {filteredGallery.length > 0 && (
        <section
          className="showroom-gallery fade-in-section loading"
          ref={(el) => (sectionsRef.current[4] = el)}
        >
          <div className="gallery-grid">
            {filteredGallery.map((img, i) => (
              <img
                key={img}
                src={img}
                alt={`${name} - ${i + 1}`}
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
      <section
        className="showroom-legacy fade-in-section loading"
        ref={(el) => (sectionsRef.current[5] = el)}
      >
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
      <div
        className="showroom-cta fade-in-section loading"
        ref={(el) => (sectionsRef.current[6] = el)}
      >
        <a href="/artisan-shop/soundlegend" className="cta-button">
          Start Your Custom Snare Journey
        </a>
      </div>
    </div>
  );
};

export default SoundLegendShowroom;
