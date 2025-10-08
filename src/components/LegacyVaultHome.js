import React from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './LegacyVaultHome.css';

/* ---------- Minimal inline 360 viewer (pointer + autoplay) ---------- */
function InlineFrame360({
  totalFrames = 392,
  basePath = '/soundlegend360/med',
  prefix = 'frame_',
  pad = 3,
  ext = 'webp',
  fps = 30,
  dragSensitivity = 0.22,
  onProgress, // (loadedCount, total, errorCount) => void
}) {
  const [loaded, setLoaded] = React.useState(0);
  const [errors, setErrors] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [frame, setFrame] = React.useState(0);

  const imgsRef = React.useRef([]);
  const rafRef = React.useRef(null);
  const lastTsRef = React.useRef(0);

  // dragging state
  const draggingRef = React.useRef(false);
  const lastXRef = React.useRef(0);
  const carryRef = React.useRef(0);

  const urlFor = React.useCallback(
    (i) => {
      const n = String(i + 1).padStart(pad, '0');
      return `${basePath}/${prefix}${n}.${ext}`;
    },
    [basePath, prefix, pad, ext]
  );

  // Preload frames (errors still advance counters)
  React.useEffect(() => {
    let cancelled = false;
    imgsRef.current = Array.from({ length: totalFrames }, (_, i) => {
      const img = new Image();
      img.decoding = 'async';
      img.loading = 'eager';
      img.crossOrigin = 'anonymous';
      const src = urlFor(i);
      img.src = src;

      const handleLoad = () => {
        if (cancelled) return;
        setLoaded((v) => {
          const nv = v + 1;
          onProgress?.(nv, totalFrames, errors);
          return nv;
        });
      };
      const handleFail = () => {
        if (cancelled) return;
        setErrors((e) => {
          const ne = e + 1;
          onProgress?.(loaded, totalFrames, ne);
          return ne;
        });
      };

      img.onload = handleLoad;
      img.onerror = handleFail;
      img.onabort = handleFail;
      return img;
    });
    return () => {
      cancelled = true;
      imgsRef.current = [];
    };
  }, [totalFrames, urlFor]);

  // Autoplay
  React.useEffect(() => {
    const tick = (ts) => {
      if (!isPlaying) return;
      const ft = 1000 / fps;
      const delta = ts - (lastTsRef.current || ts);
      if (delta >= ft) {
        lastTsRef.current = ts;
        setFrame((f) => (f + 1) % totalFrames);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    if (isPlaying && loaded > 0) {
      lastTsRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, fps, loaded, totalFrames]);

  // Pointer (mouse + touch)
  const onPointerDown = (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    draggingRef.current = true;
    lastXRef.current = e.clientX;
    carryRef.current = 0;
    setIsPlaying(false);
  };
  const onPointerMove = (e) => {
    if (!draggingRef.current) return;
    e.preventDefault();
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;

    const delta = -dx * dragSensitivity + carryRef.current;
    const step = delta | 0;
    carryRef.current = delta - step;

    if (step) {
      setFrame((f) => {
        let nf = (f + step) % totalFrames;
        if (nf < 0) nf += totalFrames;
        return nf;
      });
    }
  };
  const onPointerUp = (e) => {
    draggingRef.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const pct = Math.round((loaded / totalFrames) * 100);
  const src = imgsRef.current[frame]?.src || urlFor(0);

  return (
    <>
      <div
        className="sl360-stage lv-hero-360"
        role="img"
        aria-label="360 degree product viewer"
        tabIndex={0}
        onDragStart={(e) => e.preventDefault()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <img src={src} alt="SoundLegend 360 preview" draggable={false} />
        {loaded < totalFrames && (
          <div className="sl360-loader">
            <div className="sl360-bar">
              <div style={{ width: `${pct}%` }} />
            </div>
            <span>Loading {pct}%</span>
          </div>
        )}
      </div>

      {/* Centered, under-image note */}
      <p className="lv-hero-note">
        Click & drag to rotate.
      </p>
    </>
  );
}
/* ------------------------------------------------------------------ */

function HeroVideoFallback() {
  // NOTE: file path provided by you (kept verbatim, spaces included)
  const src = '/craft_in_motion/Drum Your Truth.mp4';
  // Optional: add a poster image for the first frame if you have one
  const poster = '/placeholder/snare-dark.jpg';

  return (
    <div className="lv-hero-fallback">
      <video
        className="lv-hero-video"
        src={src}
        poster={poster}
        autoPlay
        muted
        playsInline
        loop
        preload="auto"
      />
      <div className="lv-hero-overlay">
        <span className="lv-hero-overlay-text">Craft in Motion</span>
      </div>
      <p className="lv-hero-note">A glimpse from the artisan’s bench.</p>
    </div>
  );
}

/* ---------- Card for a Vault item ---------- */
function VaultCard({ serial, name, heroImage, finish, teaser, href }) {
  return (
    <Link to={href} className="lv-item">
      <div className="lv-item-media">
        {heroImage ? (
          <img
            src={heroImage}
            alt={`${serial} – ${name || 'SoundLegend'}`}
            loading="lazy"
          />
        ) : (
          <video
            className="lv-item-video"
            src="/craft_in_motion/craftinmotion1080p.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
        )}
      </div>

      <div className="lv-item-body">
        <h3 className="lv-artist">{name || 'Legacy Artisan'}</h3>
        <div className="lv-item-top">
          <span className="lv-item-serial">{serial}</span>
        </div>
        {teaser && <p className="lv-teaser">“{teaser}”</p>}
      </div>
    </Link>
  );
}

/* ---------- Page ---------- */
export default function LegacyVaultHome() {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // hero state
  const [loadedFrames, setLoadedFrames] = React.useState(0);
  const [errorFrames, setErrorFrames] = React.useState(0);
  const [showVideoFallback, setShowVideoFallback] = React.useState(false);

  // if nothing loads quickly, show fallback; switch back if frames arrive
  React.useEffect(() => {
    const t = setTimeout(() => {
      if (loadedFrames < 1) setShowVideoFallback(true);
    }, 4000); // 4s grace period
    return () => clearTimeout(t);
  }, [loadedFrames]);

  // switch to 360 once we have a small buffer of frames
  React.useEffect(() => {
    if (loadedFrames >= 8) setShowVideoFallback(false);
    // if too many frames fail, stick with video
    if (errorFrames > 0 && loadedFrames === 0) setShowVideoFallback(true);
  }, [loadedFrames, errorFrames]);

  React.useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'soundlegend_showroom'));
        const rows = [];
        snap.forEach((doc) => {
          const d = doc.data() || {};
          const serial = doc.id;
          const heroImage = d.heroImage || d.gallery?.[0] || '';
          const name = d.name || d.links?.name || '';
          const finish = d.specs?.finish || '';
          const teaser =
            d.teaser ||
            d.tagline ||
            d.quote ||
            d.testimonial ||
            d.storyTeaser ||
            d.specs?.tagline ||
            '';
          rows.push({
            serial,
            heroImage,
            name,
            finish,
            teaser,
            href: `/artisan-shop/soundlegend/${serial}`,
          });
        });
        rows.sort((a, b) =>
          a.serial.localeCompare(b.serial, undefined, { numeric: true })
        );
        setItems(rows);
      } catch (e) {
        console.error('Failed to load vault items:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="legacy-vault-home">
      {/* Logo */}
      <section className="lv-header">
        <img
          className="lv-logo center"
          src="/logos/legacyvault.d.png"
          alt="SoundLegend Legacy Vault"
          loading="eager"
        />
      </section>

      {/* Hero: 360 with smart fallback to video */}
      <section className="lv-hero-one">
        <div className="lv-hero-one-inner">
          {showVideoFallback ? (
            <HeroVideoFallback />
          ) : (
            <InlineFrame360
              totalFrames={392}
              basePath="/soundlegend360/med"
              onProgress={(loaded, total, errs) => {
                setLoadedFrames(loaded);
                setErrorFrames(errs);
              }}
            />
          )}
        </div>
      </section>

      {/* Welcome (story-first tone) */}
      <section className="lv-welcome">
        <h2 className="lv-heading">Welcome to the Legacy Vault</h2>
        <p className="lv-lede">
          A living archive where instruments and artists meet their memory.
        </p>
        <p className="lv-prose">
          Step inside, listen close, and meet the stories behind each build.
          Some drums are
          <strong> craft in motion</strong>—still becoming—while others are
          awaiting
          <strong> audio, story, or gallery</strong> updates. Return as the
          Vault grows and each legend reveals more.
        </p>
        <p className="lv-prose">
          If this journey resonates with you, click{' '}
          <Link to="/artisan-shop/soundlegend" className="lv-link">
            here
          </Link>{' '}
          to begin your custom snare drum journey. The Vault is growing—one
          legend at a time.
        </p>
      </section>

      {/* Legacy Index */}
      <section className="lv-index">
        <div className="lv-index-head">
          <h2 className="lv-heading">Legacy Index</h2>
          <p className="muted centerish">
            Browse the instruments below. Tap an entry to explore its
            journey—read, hear, and feel its voice. Pieces marked in progress
            will update as new media arrives.
          </p>
        </div>

        {loading ? (
          <div className="lv-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="lv-item skeleton" aria-hidden="true">
                <div className="lv-item-media" />
                <div className="lv-item-body">
                  <div className="line w60" />
                  <div className="line w40" />
                  <div className="btnline" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="lv-grid">
            {items.map((it) => (
              <VaultCard key={it.serial} {...it} />
            ))}
          </div>
        )}
      </section>

      {/* How to Join (short, narrative) */}
      <section className="lv-join">
        <h2 className="lv-heading">Join the Legacy Experience</h2>
        <p className="lv-prose centerish">
          It begins with a conversation. Together we design your voice, craft it
          by hand, and preserve your story—photos, audio, and a living page here
          in the Vault. Your drum ships with an NFC badge that always brings you
          home.
        </p>

        <div className="lv-cta-row center">
          <Link
            to="/artisan-shop/soundlegend"
            className="lv-cta-btn primary"
            aria-label="Start your custom build"
          >
            Start Your Build
          </Link>
          <Link
            to="/soundlegends/signin"
            className="lv-cta-btn ghost"
            aria-label="Open the artist portal"
          >
            Artist Portal
          </Link>
        </div>
      </section>
    </main>
  );
}