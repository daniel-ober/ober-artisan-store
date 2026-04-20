import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';

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

  ChevronUp,

  ChevronDown,

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

function useIsCompactOurCraft() {

  const [isCompact, setIsCompact] = useState(

    typeof window !== 'undefined' ? window.innerWidth <= 560 : false

  );

  useEffect(() => {

    const handleResize = () => {

      setIsCompact(window.innerWidth <= 560);

    };

    handleResize();

    window.addEventListener('resize', handleResize);

    window.addEventListener('orientationchange', handleResize);

    return () => {

      window.removeEventListener('resize', handleResize);

      window.removeEventListener('orientationchange', handleResize);

    };

  }, []);

  return isCompact;

}

const PUBLIC = process.env.PUBLIC_URL || '';

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

      'Ober Artisan Drums is not just about making instruments. It is about listening closely enough to build something that feels inevitable — a drum with soul, identity, and a reason to exist.',

      'Based in Nashville, Dan Ober designs, builds, tunes, photographs, documents, and continuously refines the full experience in-house. From shell shaping to software systems, every part of the process is treated as craft.',

    ],

    mediaUrl: `${PUBLIC}/our-craft/1.png`,

    type: 'craft',

  },

  {

    key: 'philosophy',

    kicker: 'Our Philosophy',

    title: <>Built with intention.</>,

    body: [

      'A drum doesn’t need to be told what to be. It needs to be heard clearly enough to be built truthfully.',

      'At Ober Artisan Drums, listening comes first — to the player, the materials, and the instrument’s natural response. The goal is not to impose identity, but to reveal it with greater clarity, care, and intent.',

    ],

    mediaUrl: `${PUBLIC}/our-craft/2.png`,

    type: 'philosophy',

  },

  {

    key: 'discovery',

    kicker: 'Ober LegacyPrint™ Discovery System',

    title: (

      <>

        Where listening

        <br />

        becomes direction.

      </>

    ),

    body: [

      'Our discovery process is designed to slow the right moments down, so the direction behind a build can become clearer, more personal, and more intentional.',

      'LegacyPrint™ helps translate broad tonal goals into more grounded direction — giving voicing conversations more structure without replacing the ear, the craft, or the human judgment behind the build.',

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

      'We choose woods and components for tone, character, and longevity — not shortcuts.',

    icon: TreeDeciduous,

  },

  {

    label: 'Care in the details',

    description:

      'From bearing edges to finish behavior, we approach each detail with intention and respect for the instrument.',

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

    text: 'Direction becomes more specific, more honest, and more personal through consultation, mapping, and review.',

    icon: SlidersHorizontal,

  },

  {

    title: 'Build with intent',

    text: 'Once direction is clear, shell, voicing, materials, finish, hardware, and feel can move together in a more cohesive way.',

    icon: Hammer,

  },

];

const discoveryCollectionNote =

  'Across Heritage, Feuzøn, and SoundLegend, LegacyPrint™ helps bring more structure to voicing decisions and keep each build aligned to the player’s goals.';

const OurCraft = () => {

  const prefersReducedMotion = usePrefersReducedMotion();

  const isCompact = useIsCompactOurCraft();

  const slideRefs = useRef([]);

  const rafRef = useRef(null);

  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {

    document.body.classList.add('our-craft-page');

    return () => {

      document.body.classList.remove('our-craft-page');

      document.documentElement.style.removeProperty('--oc-vh');

      document.documentElement.style.removeProperty('--oc-nav-offset');

      document.documentElement.style.removeProperty('--oc-section-height');

      if (rafRef.current) {

        cancelAnimationFrame(rafRef.current);

      }

    };

  }, []);

  useEffect(() => {

    const measureLayout = () => {

      const root = document.documentElement;

      root.style.setProperty('--oc-vh', `${window.innerHeight}px`);

      const candidates = Array.from(

        document.querySelectorAll(

          'header, nav, .navbar, .nav-bar, .site-nav, .main-nav'

        )

      );

      let navOffset = 0;

      candidates.forEach((el) => {

        const styles = window.getComputedStyle(el);

        const rect = el.getBoundingClientRect();

        const isPinned =

          styles.position === 'fixed' || styles.position === 'sticky';

        const touchesTop = rect.top <= 2 && rect.bottom > 0;

        if (isPinned && touchesTop) {

          navOffset = Math.max(navOffset, rect.height);

        }

      });

      const sectionHeight = Math.max(window.innerHeight - navOffset, 0);

      root.style.setProperty('--oc-nav-offset', `${Math.round(navOffset)}px`);

      root.style.setProperty(

        '--oc-section-height',

        `${Math.round(sectionHeight)}px`

      );

    };

    measureLayout();

    const handleResize = () => {

      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(measureLayout);

    };

    window.addEventListener('resize', handleResize);

    window.addEventListener('orientationchange', handleResize);

    return () => {

      window.removeEventListener('resize', handleResize);

      window.removeEventListener('orientationchange', handleResize);

    };

  }, []);

  useEffect(() => {

    const sections = slideRefs.current.filter(Boolean);

    if (!sections.length) return undefined;

    const observer = new IntersectionObserver(

      (entries) => {

        const visible = entries

          .filter((entry) => entry.isIntersecting)

          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;

        const index = sections.findIndex((section) => section === visible.target);

        if (index >= 0) setActiveSlide(index);

      },

      {

        threshold: [0.55, 0.7, 0.85],

      }

    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();

  }, []);

  const scrollToSlide = useCallback(

    (index) => {

      const safeIndex = Math.max(0, Math.min(index, storySlides.length - 1));

      const target = slideRefs.current[safeIndex];

      if (!target) return;

      target.scrollIntoView({

        behavior: prefersReducedMotion ? 'auto' : 'smooth',

        block: 'start',

      });

    },

    [prefersReducedMotion]

  );

  const goPrev = useCallback(() => {

    scrollToSlide(activeSlide - 1);

  }, [activeSlide, scrollToSlide]);

  const goNext = useCallback(() => {

    scrollToSlide(activeSlide + 1);

  }, [activeSlide, scrollToSlide]);

  const compactPrinciples = useMemo(

    () => (isCompact ? principles.slice(0, 4) : principles),

    [isCompact]

  );

  const compactDiscoverySteps = useMemo(

    () => (isCompact ? discoverySteps.slice(0, 3) : discoverySteps),

    [isCompact]

  );

  const getBodyCopy = useCallback(

    (slide) => {

      if (!isCompact) return slide.body;

      if (slide.type === 'craft') {

        return [slide.body[0]];

      }

      if (slide.type === 'philosophy') {

        return slide.body;

      }

      if (slide.type === 'discovery') {

        return [slide.body[0]];

      }

      return slide.body;

    },

    [isCompact]

  );

  const renderSupplement = useCallback(

    (slide) => {

      if (slide.type === 'philosophy') {

        return (

          <div

            className="oc-story-grid oc-story-grid-philosophy"

            role="list"

            aria-label="Philosophy highlights"

          >

            {compactPrinciples.map((item) => {

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

          <div className="oc-discovery-stack">

            <div

              className="oc-story-grid oc-story-grid-discovery"

              role="list"

              aria-label="Discovery steps"

            >

              {compactDiscoverySteps.map((item) => {

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

            <div className="oc-discovery-summary-card">

              <span className="oc-discovery-summary-kicker">

                Across the collection

              </span>

              <p>{discoveryCollectionNote}</p>

            </div>

          </div>

        );

      }

      return null;

    },

    [compactDiscoverySteps, compactPrinciples]

  );

  return (

    <div className="ourcraft-page-shell">

      <main className="ourcraft-root">

        <section className="oc-story-shell" aria-label="Our Craft story panels">

          {storySlides.map((slide, index) => (

            <section

              key={slide.key}

              ref={(el) => {

                slideRefs.current[index] = el;

              }}

              className={`oc-story-slide oc-story-slide-${slide.type}`}

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

                    {getBodyCopy(slide).map((paragraph) => (

                      <p key={paragraph}>{paragraph}</p>

                    ))}

                  </div>

                  {renderSupplement(slide)}

                </div>

              </div>

            </section>

          ))}

          <div className="oc-story-ui">

            <button

              type="button"

              className="oc-story-arrow"

              onClick={goPrev}

              disabled={activeSlide === 0}

              aria-label="Previous section"

            >

              <ChevronUp size={18} />

            </button>

            <div className="oc-story-dots" aria-label="Story slide navigation">

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

              aria-label="Next section"

            >

              <ChevronDown size={18} />

            </button>

          </div>

        </section>

      </main>

    </div>

  );

};

export default OurCraft;