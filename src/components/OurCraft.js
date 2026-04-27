import React, { useRef, useEffect, useCallback, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import './OurCraft.css';

import {
  Sparkles,
  HandHeart,
  Flame,
  Music,
  TreeDeciduous,
  SearchCheck,
  Ear,
  ScanSearch,
  SlidersHorizontal,
  Hammer,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    handleChange();

    mediaQuery.addEventListener?.('change', handleChange);

    return () => {
      mediaQuery.removeEventListener?.('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

const PUBLIC = process.env.PUBLIC_URL || '';

const SHOWROOM_BASE = `${PUBLIC}/ober-artisan-showroom/color`;

const storySlides = [
  {
    key: 'craft',

    kicker: 'Our Craft',

    title: (
      <>
        Built by hand.
        <br />
        Guided by ear.
        <br />
        Refined by story.
      </>
    ),

    body: [
      'Ober Artisan Drums is about building instruments with soul, clarity, and purpose — not just making another product.',

      'Based in Nashville, Dan Ober designs, builds, tunes, documents, and continues refining the full experience in-house. From shell shaping to systems thinking, every part of the work is treated as craft.',
    ],

    mediaUrl: `${PUBLIC}/our-craft/1.png`,

    type: 'craft',
  },

  {
    key: 'philosophy',

    kicker: 'Our Philosophy',

    title: <>Built with intention.</>,

    body: [
      'At Ober, listening comes first — to the player, the materials, and the instrument’s natural response.',

      'The goal is not to force identity onto a drum, but to shape it with care, honesty, and musical purpose.',
    ],

    mediaUrl: `${PUBLIC}/our-craft/2.png`,

    type: 'philosophy',
  },

  {
    key: 'discovery',

    kicker: 'LegacyPrint™ Discovery System',

    title: (
      <>
        Where listening
        <br />
        becomes direction.
      </>
    ),

    body: [
      'Our discovery system helps slow the right moments down so build direction can become clearer, more personal, and more intentional.',

      'It is a key part of the SoundLegend experience — and the foundation for broader LegacyPrint™ tools still to come.',
    ],

    mediaUrl: `${PUBLIC}/our-craft/3.png`,

    type: 'discovery',
  },
];

const principles = [
  {
    label: 'Creative Spark',

    description:
      'Every drum begins with an idea worth honoring — not a template to copy.',

    icon: Sparkles,
  },

  {
    label: 'Maker’s Touch',

    description:
      'Every instrument is shaped by real hands, real listening, and real judgment.',

    icon: HandHeart,
  },

  {
    label: 'Torch-Tuned Resonance',

    description:
      'Our proprietary torch-tuning approach helps reveal the shell’s natural voice with intention.',

    icon: Flame,
  },

  {
    label: 'Built for Expression',

    description:
      'A great drum should not just sound good. It should invite more truth out of the player.',

    icon: Music,
  },

  {
    label: 'Timeless Materials',

    description:
      'We choose woods and components for tone, character, and longevity.',

    icon: TreeDeciduous,
  },

  {
    label: 'Care in the Details',

    description:
      'From bearing edges to finish behavior, each detail is approached with care and respect for the instrument.',

    icon: SearchCheck,
  },
];

const discoverySteps = [
  {
    title: 'Listen',

    text: 'A deeper read of the player — not just what looks good on paper, but what feels true in purpose, touch, sound, and story.',

    icon: Ear,
  },

  {
    title: 'Interpret',

    text: 'Discovery helps separate what is already clear from what still needs pressure-testing, so the build can move with clarity and purpose.',

    icon: ScanSearch,
  },

  {
    title: 'Refine',

    text: 'Direction becomes more specific and more personal through consultation, mapping, and review.',

    icon: SlidersHorizontal,
  },

  {
    title: 'Build with intent',

    text: 'Once direction is clear, shell, voicing, materials, finish, hardware, and feel can move together in a more cohesive way.',

    icon: Hammer,
  },
];

const OurCraft = () => {
  const prefersReducedMotion = usePrefersReducedMotion();

  const navigate = useNavigate();

  const foundersRef = useRef(null);

  const railRef = useRef(null);

  const slideRefs = useRef([]);

  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    document.body.classList.add('our-craft-page');

    return () => {
      document.body.classList.remove('our-craft-page');
    };
  }, []);

  const scrollToFounders = useCallback(() => {
    if (!foundersRef.current) return;

    foundersRef.current.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',

      block: 'start',
    });
  }, [prefersReducedMotion]);

  const scrollToSlide = useCallback(
    (index) => {
      const target = slideRefs.current[index];

      if (!target) return;

      target.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',

        inline: 'start',

        block: 'nearest',
      });

      setActiveSlide(index);
    },

    [prefersReducedMotion]
  );

  const goPrev = useCallback(() => {
    scrollToSlide(Math.max(activeSlide - 1, 0));
  }, [activeSlide, scrollToSlide]);

  const goNext = useCallback(() => {
    scrollToSlide(Math.min(activeSlide + 1, storySlides.length - 1));
  }, [activeSlide, scrollToSlide]);

  useEffect(() => {
    const rail = railRef.current;

    if (!rail) return undefined;

    const handleScroll = () => {
      const width = rail.clientWidth || 1;

      const index = Math.round(rail.scrollLeft / width);

      setActiveSlide(Math.max(0, Math.min(index, storySlides.length - 1)));
    };

    rail.addEventListener('scroll', handleScroll, { passive: true });

    handleScroll();

    return () => {
      rail.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const renderSupplement = useCallback(
    (slide) => {
      if (slide.type === 'philosophy') {
        return (
          <div
            className="oc-story-grid oc-story-grid-philosophy"
            role="list"
            aria-label="Philosophy highlights"
          >
            {principles.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.label}
                  className="oc-story-mini-card"
                  role="listitem"
                >
                  <div className="oc-story-mini-top">
                    <span className="oc-story-mini-icon">
                      <Icon size={15} aria-hidden />
                    </span>

                    <h3>{item.label}</h3>
                  </div>

                  <p>{item.description}</p>
                </article>
              );
            })}
          </div>
        );
      }

      if (slide.type === 'discovery') {
        return (
          <div className="oc-discovery-promo">
            <div
              className="oc-story-grid oc-story-grid-discovery"
              role="list"
              aria-label="Discovery steps"
            >
              {discoverySteps.map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.title}
                    className="oc-story-mini-card"
                    role="listitem"
                  >
                    <div className="oc-story-mini-top">
                      <span className="oc-story-mini-icon">
                        <Icon size={15} aria-hidden />
                      </span>

                      <h3>{item.title}</h3>
                    </div>

                    <p>{item.text}</p>
                  </article>
                );
              })}
            </div>

            <button
              type="button"
              className="oc-discovery-link"
              onClick={() => navigate('/legacyprint')}
            >
              Learn more about LegacyPrint™
              <span aria-hidden="true">→</span>
            </button>
          </div>
        );
      }

      return null;
    },

    [navigate]
  );

  return (
    <div className="ourcraft-page-shell">
      <main className="ourcraft-root">
        <section className="oc-story-shell" aria-label="Our Craft story panels">
          <div className="oc-story-rail" ref={railRef}>
            {storySlides.map((slide, index) => (
              <section
                key={slide.key}
                ref={(el) => {
                  slideRefs.current[index] = el;
                }}
                className="oc-story-slide"
                aria-label={slide.kicker}
              >
                <div
                  className="oc-story-media"
                  aria-hidden="true"
                  style={{ backgroundImage: `url("${slide.mediaUrl}")` }}
                />

                <div className="oc-story-overlay" />

                <div className="oc-wrap oc-story-wrap">
                  <div className="oc-story-inner">
                    <div className="oc-story-copy">
                      <span className="oc-kicker">{slide.kicker}</span>

                      <h1 className="oc-story-title">{slide.title}</h1>

                      {slide.body.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>

                    {renderSupplement(slide)}
                  </div>
                </div>
              </section>
            ))}
          </div>

          <div className="oc-story-ui">
            <div className="oc-story-arrow-row">
              <button
                type="button"
                className="oc-story-arrow"
                onClick={goPrev}
                disabled={activeSlide === 0}
                aria-label="Previous panel"
              >
                <ChevronLeft size={18} />
              </button>

              <div
                className="oc-story-dots"
                aria-label="Story slide navigation"
              >
                {storySlides.map((slide, index) => (
                  <button
                    key={slide.key}
                    type="button"
                    className={`oc-story-dot ${
                      activeSlide === index ? 'is-active' : ''
                    }`}
                    onClick={() => scrollToSlide(index)}
                    aria-label={`Go to ${slide.kicker}`}
                  />
                ))}
              </div>

              <button
                type="button"
                className="oc-story-arrow"
                onClick={goNext}
                disabled={activeSlide === storySlides.length - 1}
                aria-label="Next panel"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <button
              type="button"
              className="oc-next-link oc-next-link-founder"
              onClick={scrollToFounders}
            >
              <span>Explore and compare the collection</span>

              <span className="oc-next-link-arrow" aria-hidden="true">
                ↓
              </span>
            </button>
          </div>
        </section>

        <section
          ref={foundersRef}
          className="oc-section oc-section-founder"
          aria-label="Our Founder’s Batch"
        >
          <div
            className="oc-founder-bg"
            aria-hidden="true"
            style={{
              backgroundImage: `url("${SHOWROOM_BASE}/background-only.png")`,
            }}
          />

          <div
            className="oc-founder-drums-all"
            aria-hidden="true"
            style={{
              backgroundImage: `url("${SHOWROOM_BASE}/all-bright.png")`,
            }}
          />

          <div className="oc-founder-smoke-layer" aria-hidden="true">
            <video
              className="oc-founder-smoke-video"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            >
              <source src={`${PUBLIC}/videos/smoke.mp4`} type="video/mp4" />
            </video>
          </div>

          <div className="oc-founder-vignette" aria-hidden="true" />

          <div className="oc-founder-shell">
            <div className="oc-wrap">
              <div className="oc-founder-top">
                <span className="oc-kicker">Our Founder’s Batch</span>

                <h2 className="oc-title oc-founder-title">
                  The instruments that shaped the path forward.
                </h2>
              </div>

              <div className="oc-founder-content">
                <p className="oc-founder-quote">
                  A preview of the three lines that shape the Ober collection —
                  rooted tradition, immersive custom collaboration, and hybrid
                  experimentation.
                </p>

                <button
                  type="button"
                  className="oc-founder-cta"
                  onClick={() => navigate('/our-collection')}
                >
                  Explore our custom collection
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default OurCraft;
