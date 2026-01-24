import React from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './LegacyVaultHome.css';

/* 🔹 Fallback poster for vault videos */
const FALLBACK_POSTER = '/craft_in_motion/craftinmotion.png';

/* Image helpers (unchanged) */
const USE_IMAGE_PROXY =
  typeof process !== 'undefined' && process.env.NODE_ENV === 'production';

function shouldBypassProxy(rawUrl) {
  if (!rawUrl) return true;
  if (rawUrl.startsWith('/')) return true;
  if (/^(data:|blob:|gs:\/\/)/i.test(rawUrl)) return true;
  try {
    const u = new URL(rawUrl, window.location.origin);
    if (u.host === window.location.host) return true;
    if (/localhost(:\d+)?$/i.test(u.hostname)) return true;
    return false;
  } catch {
    return true;
  }
}

function toProxyUrl(rawUrl, { w = 800, q = 70 } = {}) {
  if (!rawUrl || !USE_IMAGE_PROXY || shouldBypassProxy(rawUrl)) return rawUrl;
  try {
    const u = new URL(rawUrl);
    const noProtocol = `${u.host}${u.pathname}${u.search}`;
    return `https://images.weserv.nl/?url=${encodeURIComponent(
      noProtocol
    )}&w=${w}&q=${q}&output=webp`;
  } catch {
    return rawUrl;
  }
}

function buildThumbSet(originalUrl) {
  if (!originalUrl) return { src: originalUrl, srcSet: undefined };
  const src400 = toProxyUrl(originalUrl, { w: 400, q: 70 });
  const src800 = toProxyUrl(originalUrl, { w: 800, q: 70 });
  return {
    src: src400,
    srcSet:
      src800 && src400 !== src800
        ? `${src400} 400w, ${src800} 800w`
        : undefined,
  };
}

/* Robust resolver (same rules as Showroom) */
function resolvePublicFields(raw) {
  const D = raw && typeof raw === 'object' ? raw : {};
  const pub =
    D.public ??
    D.publicPrefs ??
    D.publishedSnapshot?.public ??
    D.soundprism?.publishedSnapshot?.public ??
    {};

  const allowName = pub?.showName === true;
  const allowStory = pub?.showStory === true;

  const nameCandidate =
    pub?.displayName ??
    D.displayName ??
    D.name ??
    D.links?.name ??
    D.specs?.artistName ??
    '';

  const storyCandidate =
    (typeof pub?.storyHtml === 'string' ? pub.storyHtml : '') ||
    (typeof D.story === 'string' ? D.story : '') ||
    (typeof D.specs?.story === 'string' ? D.specs.story : '') ||
    '';

  const name = allowName
    ? String(nameCandidate).trim() || 'Anonymous Legend'
    : 'Anonymous Legend';
  const storyHtml = allowStory ? String(storyCandidate).trim() : '';

  return { name, storyHtml };
}

const stripHtml = (s = '') => s.replace(/<[^>]*>/g, '').trim();

/* 360 viewer */
function InlineFrame360Light({
  totalFrames = 392,
  basePath = '/soundlegend360/med',
  prefix = 'frame_',
  pad = 3,
  ext = 'webp',
  fps = 24,
  stride = 4,
  prefetch = 6,
  dragSensitivity = 0.22,
}) {
  const effTotal = Math.max(1, Math.floor(totalFrames / stride));
  const [frame, setFrame] = React.useState(0);
  const [started, setStarted] = React.useState(false);
  const rafRef = React.useRef(null);
  const lastTsRef = React.useRef(0);

  const cacheRef = React.useRef(new Map());
  const loadingRef = React.useRef(new Set());
  const destroyedRef = React.useRef(false);

  const urlFor = React.useCallback(
    (i) => {
      const srcIndex = i * stride;
      const n = String(srcIndex + 1).padStart(pad, '0');
      return `${basePath}/${prefix}${n}.${ext}`;
    },
    [basePath, prefix, pad, ext, stride]
  );

  const loadRing = React.useCallback(
    (center) => {
      const start = Math.max(0, center - 1);
      const end = Math.min(effTotal - 1, center + prefetch);
      for (let i = start; i <= end; i++) {
        if (cacheRef.current.has(i) || loadingRef.current.has(i)) continue;
        loadingRef.current.add(i);
        const img = new Image();
        img.decoding = 'async';
        img.loading = 'eager';
        img.src = urlFor(i);
        const done = () => {
          loadingRef.current.delete(i);
          if (!destroyedRef.current) cacheRef.current.set(i, img);
        };
        img.onload = done;
        img.onerror = done;
        img.onabort = done;
      }
    },
    [effTotal, prefetch, urlFor]
  );

  React.useEffect(() => {
    destroyedRef.current = false;
    loadRing(0);
    return () => {
      destroyedRef.current = true;
      cacheRef.current.clear();
      loadingRef.current.clear();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [loadRing]);

  React.useEffect(() => {
    const start = () => {
      if (started) return;
      setStarted(true);
      const ft = 1000 / fps;
      const tick = (ts) => {
        const last = lastTsRef.current || ts;
        const delta = ts - last;
        if (delta >= ft) {
          lastTsRef.current = ts;
          setFrame((f) => (f + 1) % effTotal);
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    };
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(start, { timeout: 1200 });
    } else {
      setTimeout(start, 300);
    }
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [effTotal, fps, started]);

  React.useEffect(() => {
    loadRing(frame);
  }, [frame, loadRing]);

  const draggingRef = React.useRef(false);
  const lastXRef = React.useRef(0);
  const carryRef = React.useRef(0);

  const onPointerDown = (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    draggingRef.current = true;
    lastXRef.current = e.clientX ?? 0;
    carryRef.current = 0;
  };

  const onPointerMove = (e) => {
    if (!draggingRef.current) return;
    e.preventDefault();
    const dx = (e.clientX ?? 0) - lastXRef.current;
    lastXRef.current = e.clientX ?? 0;
    const delta = -dx * dragSensitivity + carryRef.current;
    const step = delta | 0;
    carryRef.current = delta - step;
    if (step) {
      setFrame((f) => {
        let nf = (f + step) % effTotal;
        if (nf < 0) nf += effTotal;
        return nf;
      });
    }
  };

  const onPointerUp = (e) => {
    draggingRef.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const current = cacheRef.current.get(frame) || cacheRef.current.get(0);
  const src = current?.src || urlFor(0);

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
      </div>
      <p className="lv-hero-note">Click &amp; drag to rotate.</p>
    </>
  );
}

/* ======================
   Card
   ====================== */
function VaultCard({ serial, name, heroImage, teaser, href }) {
  const { src, srcSet } = buildThumbSet(heroImage);
  const handleImgError = (e) => {
    if (!heroImage) return;
    const img = e.currentTarget;
    img.onerror = null;
    img.srcset = '';
    img.src = heroImage;
  };

  return (
    <Link to={href} className="lv-item">
      <div className="lv-item-media">
        {heroImage ? (
          <img
            className="lv-thumb"
            src={src}
            srcSet={srcSet}
            sizes="(max-width: 640px) 90vw, (max-width: 980px) 45vw, 400px"
            alt={`${serial} – ${name || 'SoundLegend'}`}
            loading="lazy"
            decoding="async"
            fetchpriority="low"
            onError={handleImgError}
          />
        ) : (
          <video
            className="lv-item-video"
            src="/craft_in_motion/craftinmotion1080p.mp4"
            poster={FALLBACK_POSTER}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
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

/* ======================
   Page
   ====================== */
export default function LegacyVaultHome() {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'soundlegend_showroom'));
        const rows = [];

        snap.forEach((docSnap) => {
          const d = docSnap.data() || {};
          const serial = docSnap.id.toUpperCase();

          // 🔒 Only allow SoundLegend entries into the Vault
          const artisanLine = (d.artisanLine || d.series || '').toLowerCase();
          const isSLLine = artisanLine === 'soundlegend';
          const isSLSerial = serial.startsWith('SL-');
          const isExplicitlyHidden = d.isVaultEligible === false;

          if (isExplicitlyHidden || (!isSLLine && !isSLSerial)) {
            // e.g. H-003 Craft In Motion will be skipped here
            return;
          }

          const heroImage = d.heroImage || d.gallery?.[0] || '';
          const { name, storyHtml } = resolvePublicFields(d);

          const teaser =
            d.teaser ||
            d.tagline ||
            d.quote ||
            d.testimonial ||
            d.storyTeaser ||
            d.specs?.tagline ||
            (storyHtml
              ? stripHtml(storyHtml).slice(0, 110) + '…'
              : '');

          rows.push({
            serial,
            heroImage,
            name,
            teaser,
            href: `/artisan-shop/soundlegend/${serial}`,
          });
        });

        rows.sort((a, b) =>
          a.serial.localeCompare(b.serial, undefined, { numeric: true })
        );
        if (alive) setItems(rows);
      } catch (e) {
        console.error('Failed to load vault items:', e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
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
          decoding="async"
        />
      </section>

      {/* Always show the 360 hero */}
      <section className="lv-hero-one">
        <div className="lv-hero-one-inner">
          <InlineFrame360Light />
        </div>
      </section>

      {/* Welcome */}
      <section className="lv-welcome">
        <h2 className="lv-heading">Welcome to the Legacy Vault</h2>
        <p className="lv-lede">
          A living archive where instruments and artists meet their memory.
        </p>
        <p className="lv-prose">
          Step inside, listen close, and read the short stories behind each
          build. You’ll see the choices that shaped the sound, the hands that
          shaped the wood, and the moments these drums were born for.
        </p>
        <p className="lv-prose">
          When you’re ready, add your chapter. The Vault is growing—one legend
          at a time.
        </p>
      </section>

      {/* Legacy Index */}
      <section className="lv-index">
        <div className="lv-index-head">
          <h2 className="lv-heading">Legacy Index</h2>
          <p className="muted centerish">
            Every drum carries a story — tap an instrument to read, hear, and
            feel its legacy.
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

      {/* Join */}
      <section className="lv-join">
        <h2 className="lv-heading">Join the Legacy Experience</h2>
        <p className="lv-prose centerish">
          It begins with a conversation. We design your voice, craft it by hand,
          and preserve your story—photos, audio, and a living page here in the
          Vault. Your drum ships with an NFC badge that always takes you home.
        </p>

        <div className="lv-cta-row center">
          <Link to="/artisan-shop/soundlegend" className="lv-cta-btn primary">
            Start Your Build
          </Link>
          <Link to="/artisan-portal/signin" className="lv-cta-btn ghost">
            Artist Portal
          </Link>
        </div>
      </section>
    </main>
  );
}