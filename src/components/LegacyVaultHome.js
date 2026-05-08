import React from 'react';

import { Link } from 'react-router-dom';

import { collection, getDocs } from 'firebase/firestore';

import { db } from '../firebaseConfig';

import './LegacyVaultHome.css';

const stripHtml = (html = '') => {
  return String(html)
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')

    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')

    .replace(/<[^>]+>/g, ' ')

    .replace(/&nbsp;/g, ' ')

    .replace(/&amp;/g, '&')

    .replace(/&quot;/g, '"')

    .replace(/&#39;/g, "'")

    .replace(/\s+/g, ' ')

    .trim();
};

const getFirstStoryParagraph = (html = '') => {
  const paragraphMatch = String(html).match(/<p[^>]*>([\s\S]*?)<\/p>/i);

  return stripHtml(paragraphMatch?.[1] || html);
};

const truncateSentence = (text = '', maxLength = 165) => {
  const cleaned = String(text).replace(/\s+/g, ' ').trim();

  if (!cleaned) return '';

  if (cleaned.length <= maxLength) return cleaned;

  const clipped = cleaned.slice(0, maxLength);

  const lastSentence = clipped.search(/[.!?]\s[^.!?]*$/);

  if (lastSentence > 72) {
    return clipped.slice(0, lastSentence + 1).trim();
  }

  return `${clipped.replace(/\s+\S*$/, '').trim()}…`;
};

const buildGeneratedIntro = (item = {}) => {
  const size = item.specs?.size || '';

  const shell = item.specs?.shell || '';

  const finish = item.specs?.finish || '';

  const hardware = item.specs?.hardware || '';

  const pitch = item.specs?.fundamentalPitch || item.fundamentalPitch || '';

  if (item.serial === 'SL-002') {
    return 'Built for stage power and heritage-driven rhythm, this deep SoundLegend voice pairs bold projection with the touch needed for dynamic norteño grooves.';
  }

  if (item.serial === 'SL-003') {
    return 'A compact, articulate voice shaped as a bridge back to the sticks — fast under the hands, warm in the center, and built for expressive return.';
  }

  if (item.serial === 'SL-004') {
    return 'A road-ready SoundLegend with visual fire and a full-bodied rock voice, built to carry rediscovered rhythm back into motion.';
  }

  const details = [size, shell, finish, hardware, pitch].filter(Boolean);

  if (details.length) {
    return `A one-of-one SoundLegend voice shaped through ${details

      .slice(0, 3)

      .join(', ')

      .toLowerCase()} — built to carry more than sound.`;
  }

  return 'A one-of-one SoundLegend entry — built by hand, shaped by story, and preserved as part of the living Ober Artisan archive.';
};

const getCardIntro = (data = {}, serial = '') => {
  const direct =
    data.teaserIntro ||
    data.indexIntro ||
    data.cardIntro ||
    data.teaser ||
    data.tagline ||
    data.quote ||
    data.storyTeaser ||
    data.specs?.tagline ||
    '';

  if (
    direct &&
    !String(direct).toLowerCase().includes('living soundlegend entry')
  ) {
    return truncateSentence(direct);
  }

  const storySource =
    data.publicPrefs?.storyHtml ||
    data.publicDisplay?.storyHtml ||
    data.specs?.story ||
    data.specs?.storyHtml ||
    data.storyHtml ||
    '';

  const firstParagraph = getFirstStoryParagraph(storySource);

  if (
    firstParagraph &&
    !firstParagraph.toLowerCase().includes('legacy unknown') &&
    !firstParagraph.toLowerCase().includes('private')
  ) {
    return truncateSentence(firstParagraph);
  }

  return buildGeneratedIntro({ ...data, serial });
};

const getPublicTitle = (data = {}, serial = '') => {
  const showName = data.publicPrefs?.showName !== false;

  if (!showName) {
    return 'Private Legacy';
  }

  return (
    data.publicDisplay?.name ||
    data.publicPrefs?.displayName ||
    data.name ||
    serial
  );
};

const getLegacyStatus = (data = {}) => {
  const status = String(
    data.status || data.soundprism?.meta?.status || ''
  ).toLowerCase();

  if (status === 'published') return 'Published';

  if (status === 'draft') return 'In Progress';

  if (data.audioSamples?.some((sample) => sample?.visible && sample?.url)) {
    return 'Audio Added';
  }

  if (data.gallery?.length > 1) return 'Gallery Added';

  return 'Living Entry';
};

/* ---------- Inline 360 viewer ---------- */
function InlineFrame360({

  totalFrames = 392,

  basePath = '/soundlegend360/med',

  prefix = 'frame_',

  pad = 3,

  ext = 'webp',

  fps = 30,

  dragSensitivity = 0.22,

  onProgress,

}) {

  const [loaded, setLoaded] = React.useState(0);

  const [errors, setErrors] = React.useState(0);

  const [isPlaying, setIsPlaying] = React.useState(true);

  const [frame, setFrame] = React.useState(0);

  const imgsRef = React.useRef([]);

  const autoplayRafRef = React.useRef(null);

  const inertiaRafRef = React.useRef(null);

  const lastTsRef = React.useRef(0);

  const draggingRef = React.useRef(false);

  const lastXRef = React.useRef(0);

  const lastMoveTimeRef = React.useRef(0);

  const velocityRef = React.useRef(0);

  const frameFloatRef = React.useRef(0);

  const carryRef = React.useRef(0);

  const urlFor = React.useCallback(

    (i) => {

      const n = String(i + 1).padStart(pad, '0');

      return `${basePath}/${prefix}${n}.${ext}`;

    },

    [basePath, prefix, pad, ext]

  );

const advanceFrame = React.useCallback(

  (delta) => {

    frameFloatRef.current =

      (frameFloatRef.current + delta) % totalFrames;

    if (frameFloatRef.current < 0) {

      frameFloatRef.current += totalFrames;

    }

    setFrame(Math.round(frameFloatRef.current) % totalFrames);

  },

  [totalFrames]

);

  const stopInertia = React.useCallback(() => {

    if (inertiaRafRef.current) {

      cancelAnimationFrame(inertiaRafRef.current);

      inertiaRafRef.current = null;

    }

    velocityRef.current = 0;

  }, []);

const startInertia = React.useCallback(() => {

  if (Math.abs(velocityRef.current) < 0.006) {

    velocityRef.current = 0;

    return;

  }

  let previousTimestamp = 0;

  const tick = (timestamp) => {

    if (!previousTimestamp) {

      previousTimestamp = timestamp;

    }

    const deltaTime = Math.min(32, timestamp - previousTimestamp);

    previousTimestamp = timestamp;

    advanceFrame(velocityRef.current * deltaTime);

    velocityRef.current *= 0.972;

    if (Math.abs(velocityRef.current) < 0.0018) {

      velocityRef.current = 0;

      inertiaRafRef.current = null;

      return;

    }

    inertiaRafRef.current = requestAnimationFrame(tick);

  };

  inertiaRafRef.current = requestAnimationFrame(tick);

}, [advanceFrame]);

  React.useEffect(() => {

    let cancelled = false;

    let loadedCount = 0;

    let errorCount = 0;

    imgsRef.current = Array.from({ length: totalFrames }, (_, i) => {

      const img = new Image();

      img.decoding = 'async';

      img.loading = 'eager';

      img.crossOrigin = 'anonymous';

      img.src = urlFor(i);

      img.onload = () => {

        if (cancelled) return;

        loadedCount += 1;

        setLoaded(loadedCount);

        onProgress?.(loadedCount, totalFrames, errorCount);

      };

      img.onerror = () => {

        if (cancelled) return;

        errorCount += 1;

        setErrors(errorCount);

        onProgress?.(loadedCount, totalFrames, errorCount);

      };

      img.onabort = img.onerror;

      return img;

    });

    return () => {

      cancelled = true;

      imgsRef.current = [];

    };

  }, [totalFrames, urlFor, onProgress]);

  React.useEffect(() => {

    const tick = (timestamp) => {

      if (!isPlaying || draggingRef.current || velocityRef.current !== 0) {

        return;

      }

      const frameTime = 1000 / fps;

      const delta = timestamp - (lastTsRef.current || timestamp);

      if (delta >= frameTime) {

        lastTsRef.current = timestamp;

        advanceFrame(1);

      }

      autoplayRafRef.current = requestAnimationFrame(tick);

    };

    if (isPlaying && loaded > 0) {

      lastTsRef.current = 0;

      autoplayRafRef.current = requestAnimationFrame(tick);

    }

    return () => {

      if (autoplayRafRef.current) {

        cancelAnimationFrame(autoplayRafRef.current);

      }

    };

  }, [isPlaying, fps, loaded, advanceFrame]);

  React.useEffect(() => {

    return () => {

      if (autoplayRafRef.current) {

        cancelAnimationFrame(autoplayRafRef.current);

      }

      if (inertiaRafRef.current) {

        cancelAnimationFrame(inertiaRafRef.current);

      }

    };

  }, []);

  const handlePointerDown = (event) => {

    event.preventDefault();

    event.currentTarget.setPointerCapture?.(event.pointerId);

    stopInertia();

    draggingRef.current = true;

    lastXRef.current = event.clientX;

    lastMoveTimeRef.current = performance.now();

    carryRef.current = 0;

    velocityRef.current = 0;

    setIsPlaying(false);

  };

  const handlePointerMove = (event) => {

    if (!draggingRef.current) return;

    event.preventDefault();

    const now = performance.now();

    const dx = event.clientX - lastXRef.current;

    const dt = Math.max(8, now - lastMoveTimeRef.current);

    lastXRef.current = event.clientX;

    lastMoveTimeRef.current = now;

    const frameDelta = -dx * dragSensitivity + carryRef.current;

    const wholeFrames = frameDelta < 0 ? Math.ceil(frameDelta) : Math.floor(frameDelta);

    carryRef.current = frameDelta - wholeFrames;

    if (wholeFrames !== 0) {

      advanceFrame(wholeFrames);

    }

    velocityRef.current = (-dx * dragSensitivity) / dt;

  };

  const handlePointerUp = (event) => {

    if (!draggingRef.current) return;

    draggingRef.current = false;

    event.currentTarget.releasePointerCapture?.(event.pointerId);

    const flickVelocity = velocityRef.current;

if (Math.abs(flickVelocity) > 0.006) {

  startInertia();

}

  };

  const pct = Math.round((loaded / totalFrames) * 100);

  const src = imgsRef.current[frame]?.src || urlFor(0);

  return (

    <div className="lv-hero-viewer-wrap">

      <div

        className="sl360-stage lv-hero-360"

        role="img"

        aria-label="Interactive 360 degree SoundLegend drum viewer"

        tabIndex={0}

        onDragStart={(event) => event.preventDefault()}

        onPointerDown={handlePointerDown}

        onPointerMove={handlePointerMove}

        onPointerUp={handlePointerUp}

        onPointerCancel={handlePointerUp}

        onPointerLeave={handlePointerUp}

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

      <p className="lv-hero-interaction-label">Interactive 360° drum view</p>

      <p className="lv-hero-note">

        Drag to rotate. Flick and release to let the drum spin.

      </p>

    </div>

  );

}
function HeroVideoFallback() {
  return (
    <div className="lv-hero-fallback">
      <video
        className="lv-hero-video"
        src="/craft_in_motion/Drum Your Truth.mp4"
        poster="/placeholder/snare-dark.jpg"
        autoPlay
        muted
        playsInline
        loop
        preload="auto"
      />

      <p className="lv-hero-note">A glimpse from the artisan’s bench.</p>
    </div>
  );
}

function VaultCard({ serial, heroImage, finish, intro, href, status }) {
  return (
    <Link
      to={href}
      className="lv-item"
      aria-label={`Open ${serial} legacy vault entry`}
    >
      <div className="lv-item-media">
        {heroImage ? (
          <img
            src={heroImage}
            alt={`${serial} SoundLegend drum`}
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
        <div className="lv-item-meta-row">
          <span>{serial}</span>

          {finish && <span>{finish}</span>}
        </div>

        <p className="lv-item-intro">{intro}</p>

        <div className="lv-card-foot">
          <span>{status}</span>

          <strong>{status === 'Living Entry' ? 'View Story →' : 'View Build →'}</strong>
        </div>
      </div>
    </Link>
  );
}

function LegacyCarousel({ items = [], loading = false }) {

  const shellRef = React.useRef(null);

  const rafRef = React.useRef(null);

  const isPausedRef = React.useRef(false);

  const pointerDownRef = React.useRef(false);

  const resumeTimerRef = React.useRef(null);

  const displayItems = React.useMemo(() => {

    if (!items.length) return [];

    return [...items, ...items, ...items];

  }, [items]);

  React.useEffect(() => {

    const shell = shellRef.current;

    if (!shell || loading || items.length < 2) return undefined;

    let lastTimestamp = 0;

    const scrollStep = (timestamp) => {

      if (!lastTimestamp) {

        lastTimestamp = timestamp;

      }

      const delta = timestamp - lastTimestamp;

      lastTimestamp = timestamp;

      if (!isPausedRef.current && !pointerDownRef.current) {

        const speed = 0.028;

        shell.scrollLeft += delta * speed;

        const resetPoint = shell.scrollWidth / 3;

        if (shell.scrollLeft >= resetPoint * 2) {

          shell.scrollLeft -= resetPoint;

        }

        if (shell.scrollLeft <= 0) {

          shell.scrollLeft += resetPoint;

        }

      }

      rafRef.current = requestAnimationFrame(scrollStep);

    };

    shell.scrollLeft = shell.scrollWidth / 3;

    rafRef.current = requestAnimationFrame(scrollStep);

    return () => {

      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);

    };

  }, [items, loading]);

  const pauseCarousel = () => {

    isPausedRef.current = true;

    if (resumeTimerRef.current) {

      clearTimeout(resumeTimerRef.current);

      resumeTimerRef.current = null;

    }

  };

  const resumeCarousel = (delay = 900) => {

    if (resumeTimerRef.current) {

      clearTimeout(resumeTimerRef.current);

    }

    resumeTimerRef.current = setTimeout(() => {

      isPausedRef.current = false;

      pointerDownRef.current = false;

    }, delay);

  };

  const handlePointerDown = () => {

    pointerDownRef.current = true;

    pauseCarousel();

  };

  const handlePointerUp = () => {

    pointerDownRef.current = false;

    resumeCarousel(1200);

  };

  if (loading) {

    return (

      <div className="lv-carousel-shell">

        <div className="lv-carousel-track">

          {Array.from({ length: 4 }).map((_, index) => (

            <div

              key={index}

              className="lv-item lv-item--skeleton"

              aria-hidden="true"

            >

              <div className="lv-item-media" />

              <div className="lv-item-body">

                <div className="lv-skeleton-line lv-skeleton-line--short" />

                <div className="lv-skeleton-line" />

                <div className="lv-skeleton-line lv-skeleton-line--medium" />

              </div>

            </div>

          ))}

        </div>

      </div>

    );

  }

  if (!items.length) {

    return (

      <div className="lv-empty-state">

        <p>

          The Vault is being prepared. New SoundLegend entries will appear here

          soon.

        </p>

      </div>

    );

  }

  return (

    <div

      ref={shellRef}

      className="lv-carousel-shell"

      onMouseEnter={pauseCarousel}

      onMouseLeave={() => resumeCarousel(700)}

      onPointerDown={handlePointerDown}

      onPointerUp={handlePointerUp}

      onPointerCancel={handlePointerUp}

      onTouchStart={handlePointerDown}

      onTouchEnd={handlePointerUp}

    >

      <div className="lv-carousel-fade lv-carousel-fade--left" />

      <div className="lv-carousel-fade lv-carousel-fade--right" />

      <div className="lv-carousel-track">

        {displayItems.map((item, index) => (

          <VaultCard key={`${item.serial}-${index}`} {...item} />

        ))}

      </div>

    </div>

  );

}

export default function LegacyVaultHome() {
  const [items, setItems] = React.useState([]);

  const [loading, setLoading] = React.useState(true);

  const [loadedFrames, setLoadedFrames] = React.useState(0);

  const [errorFrames, setErrorFrames] = React.useState(0);

  const [showVideoFallback, setShowVideoFallback] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (loadedFrames < 1) setShowVideoFallback(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, [loadedFrames]);

  React.useEffect(() => {
    if (loadedFrames >= 8) setShowVideoFallback(false);

    if (errorFrames > 0 && loadedFrames === 0) setShowVideoFallback(true);
  }, [loadedFrames, errorFrames]);

  React.useEffect(() => {
    let isMounted = true;

    const loadVaultItems = async () => {
      try {
        const snap = await getDocs(collection(db, 'soundlegend_showroom'));

        const rows = [];

        snap.forEach((docSnap) => {
          const data = docSnap.data() || {};

          const serial = docSnap.id;

          const heroImage = data.heroImage || data.gallery?.[0] || '';

          const finish = data.specs?.finish || '';

          const publicTitle = getPublicTitle(data, serial);

          const showName = data.publicPrefs?.showName !== false;

          rows.push({
            serial,

            publicTitle,

            heroImage,

            finish,

            intro: getCardIntro(data, serial),

            status: getLegacyStatus(data),

            href: `/artisan-shop/soundlegend/${serial}`,

            specs: data.specs || {},
          });
        });

        rows.sort((a, b) =>
          a.serial.localeCompare(b.serial, undefined, { numeric: true })
        );

        if (isMounted) setItems(rows);
      } catch (error) {
        console.error('Failed to load vault items:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadVaultItems();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="legacy-vault-home">
      <section className="lv-hero">
        <div className="lv-hero-topline">
          <img
            className="lv-logo"
            src="/logos/legacyvault.d.png"
            alt="SoundLegend Legacy Vault"
            loading="eager"
          />
        </div>

        <div className="lv-hero-grid">
          <div className="lv-hero-copy">
            <span className="lv-kicker">The living archive</span>

            <h1>Every drum carries a story.</h1>

            <p>
              The Legacy Vault preserves the voice behind each SoundLegend
              build: the wood, the tuning path, the player, and the memory
              attached to the instrument.
            </p>

            <div className="lv-hero-actions">
              <Link
                to="/artisan-shop/soundlegend"
                className="lv-link-button lv-link-button--primary"
              >
                Build Your SoundLegend
              </Link>

              <a
                href="#legacy-index"
                className="lv-link-button lv-link-button--quiet"
              >
                Explore the Vault
              </a>
            </div>
          </div>

          <div className="lv-hero-viewer">
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
        </div>
      </section>

      <section className="lv-archive-intro">
        <span className="lv-kicker">The archive</span>

        <h2>Welcome to the Legacy Vault</h2>

        <div className="lv-archive-columns">
          <p>
            Step inside, listen close, and meet the stories behind each build.
            Some drums are <strong>craft in motion</strong> — still becoming —
            while others are awaiting <strong>audio, story, or gallery</strong>{' '}
            updates.
          </p>

          <p>
            This is not just a showroom. It is a living record of the player,
            the build, the voice, and the memory attached to the instrument.
          </p>
        </div>
      </section>

      <section className="lv-index" id="legacy-index">
        <div className="lv-index-head">
          <div>
            <span className="lv-kicker">Legacy index</span>

            <h2>Explore the instruments.</h2>
          </div>

          <p>
            The archive moves on its own. Hover to pause, swipe to explore, and
            open any entry to step into the full story.
          </p>
        </div>

        <LegacyCarousel items={items} loading={loading} />
      </section>

      <section className="lv-join">
        <div className="lv-join-inner">
          <span className="lv-kicker">Join the legacy experience</span>

          <h2>Start with a conversation.</h2>

          <p>
            Together we shape the voice, build the instrument by hand, and
            preserve the story that belongs with it. When the drum is ready, its
            living page becomes part of the Vault.
          </p>

          <div className="lv-join-actions">
            <Link
              to="/artisan-shop/soundlegend"
              className="lv-link-button lv-link-button--primary"
            >
              Start your build
            </Link>

            <Link
              to="/soundlegends/signin"
              className="lv-link-button lv-link-button--quiet"
            >
              Artist portal
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
