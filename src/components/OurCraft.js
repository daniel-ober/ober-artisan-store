import React, { useRef, useEffect, useCallback, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import './OurCraft.css';

import {

  Flame,

  Music,

  Ear,

  SlidersHorizontal,

  ChevronLeft,

  ChevronRight,

  Fingerprint,

  Waves,

  BookOpenText,

  Compass,

  Gauge,

  MessageCircleHeart,

  ShieldCheck,

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

const storySlides = [

  {

    key: 'craft',

    kicker: 'Our Craft',

    eyebrow: 'Ober Artisan Drums',

    title: (

      <>

        We don’t tell a drum

        <br />

        what to be.

      </>

    ),

    body: [

      'Ober Artisan Drums builds custom instruments by listening — to the player, the material, the shell, and the finished voice.',

      'The work is part handcraft, part ear, part story, and part restraint: shaping with care until the drum opens up and tells us it is ready.',

    ],

    quote: 'Built by hand. Guided by ear. Refined by story.',

    mediaUrl: `${PUBLIC}/our-craft/1.png`,

    type: 'craft',

  },

  {

    key: 'soundlegend-process',

    kicker: 'SoundLegend Experience',

    eyebrow: 'Discovery · Voice · Story',

    title: (

      <>

        A custom build

        <br />

        deserves a deeper read.

      </>

    ),

    body: [

      'SoundLegend is where Ober’s full custom process comes together: player discovery, voice direction, build interpretation, story development, and final documentation.',

      'It is not about rushing toward a spec sheet. It is about understanding the person, the music, the sound they are chasing, and the drum that can meet them there.',

    ],

    quote:

      'Discovery helps us listen to the player. Voice helps us shape the direction. Story helps the drum carry meaning forward.',

    mediaUrl: `${PUBLIC}/our-craft/2.png`,

    type: 'soundlegend',

  },

  {

    key: 'voice-engine',

    kicker: 'Ober LegacyPrint™ voice engine',

    eyebrow: 'A hybrid craft-intelligence system',

    title: (

      <>

        Where player language

        <br />

        becomes build direction.

      </>

    ),

    body: [

      'The Ober LegacyPrint™ voice engine brings together human ear, customer discovery, acoustic knowledge, build experience, research, interactive tools, and final craftsman judgment.',

      'It helps us ask better questions, compare drums more clearly, shape stronger build direction, and understand how a finished drum actually speaks.',

    ],

    quote: 'The tools guide the direction. The drum gives the final answer.',

    mediaUrl: `${PUBLIC}/our-craft/3.png`,

    type: 'voiceEngine',

  },

  {

    key: 'shell-voice',

    kicker: 'Shell Voice',

    eyebrow: 'Where the drum starts to answer',

    title: (

      <>

        The shell gets

        <br />

        the final word.

      </>

    ),

    body: [

      'Every shell carries its own weight, movement, response, and resistance. Ober’s job is to shape with intention while still leaving room for the drum to reveal itself.',

      'TorchTune™ helps reveal natural wood response in stave-construction shells. LegacyTuning™ is where a specific shell opens up, settles in, and tells us it is ready.',

    ],

    quote: 'We listen for the point where the shell starts to speak back.',

    mediaUrl: `${PUBLIC}/our-craft/4.png`,

    type: 'shellVoice',

  },

];

const craftPrinciples = [

  {

    label: 'Listen first',

    description:

      'The player, the material, and the finished drum all have something to say.',

    icon: Ear,

  },

  {

    label: 'Shape with restraint',

    description:

      'The craft is knowing when to guide the drum and when to leave room for it to open up.',

    icon: ShieldCheck,

  },

  {

    label: 'Build for expression',

    description:

      'A great drum should not just sound good. It should invite more truth out of the player.',

    icon: Music,

  },

];

const soundLegendSteps = [

  {

    title: 'Discovery',

    text:

      'A deeper read of the player — goals, genre, touch, feel, sound language, and the story behind the build.',

    icon: Compass,

  },

  {

    title: 'Voice',

    text:

      'The target direction becomes easier to hear, compare, and shape through Ober’s listening language and voice tools.',

    icon: Gauge,

  },

  {

    title: 'Story',

    text:

      'The finished build carries more than specs: notes, choices, media, milestones, and the reason the drum exists.',

    icon: BookOpenText,

  },

];

const voiceEngineParts = [

  {

    title: 'Human ear',

    text: 'The system starts and ends with actual listening — not blind prediction.',

    icon: Ear,

  },

  {

    title: 'Player discovery',

    text:

      'Customer language, musical context, goals, feel, and sound preferences help shape the direction.',

    icon: MessageCircleHeart,

  },

  {

    title: 'Voice tools',

    text:

      'Voice Nodes, charts, comparison tools, and guided matching make drum voice easier to understand.',

    icon: SlidersHorizontal,

  },

  {

    title: 'Craft judgment',

    text:

      'The finished drum still has to speak for itself before a final LegacyPrint™ profile is captured.',

    icon: Fingerprint,

  },

];

const shellVoiceItems = [

  {

    title: 'TorchTune™',

    text:

      'Ober’s proprietary torching technique for bringing out natural wood response in stave-construction shells.',

    icon: Flame,

  },

  {

    title: 'LegacyTuning™',

    text:

      'The natural resonance and tuning identity of a specific shell — the place where the drum opens up, settles in, and tells us, “I’m ready.”',

    icon: Waves,

  },

  {

    title: 'LegacyPrint™',

    text:

      'The final voice readout or stamp of a drum or target build — how the finished instrument speaks, responds, carries, blooms, and settles.',

    icon: Fingerprint,

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

      if (slide.type === 'craft') {

        return (

          <div

            className="oc-note-strip oc-note-strip-three"

            role="list"

            aria-label="Ober craft principles"

          >

            {craftPrinciples.map((item) => {

              const Icon = item.icon;

              return (

                <article key={item.label} className="oc-note" role="listitem">

                  <span className="oc-note-icon">

                    <Icon size={15} aria-hidden />

                  </span>

                  <div>

                    <h3>{item.label}</h3>

                    <p>{item.description}</p>

                  </div>

                </article>

              );

            })}

          </div>

        );

      }

      if (slide.type === 'soundlegend') {

        return (

          <div

            className="oc-note-strip oc-note-strip-three"

            role="list"

            aria-label="SoundLegend experience"

          >

            {soundLegendSteps.map((item) => {

              const Icon = item.icon;

              return (

                <article key={item.title} className="oc-note" role="listitem">

                  <span className="oc-note-icon">

                    <Icon size={15} aria-hidden />

                  </span>

                  <div>

                    <h3>{item.title}</h3>

                    <p>{item.text}</p>

                  </div>

                </article>

              );

            })}

          </div>

        );

      }

      if (slide.type === 'voiceEngine') {

        return (

          <div

            className="oc-note-strip oc-note-strip-four"

            role="list"

            aria-label="Ober voice engine parts"

          >

            {voiceEngineParts.map((item) => {

              const Icon = item.icon;

              return (

                <article key={item.title} className="oc-note" role="listitem">

                  <span className="oc-note-icon">

                    <Icon size={15} aria-hidden />

                  </span>

                  <div>

                    <h3>{item.title}</h3>

                    <p>{item.text}</p>

                  </div>

                </article>

              );

            })}

            <button

              type="button"

              className="oc-inline-link"

              onClick={() => navigate('/legacyprint')}

            >

              Open the Voice Workbench

              <span aria-hidden="true">→</span>

            </button>

          </div>

        );

      }

      if (slide.type === 'shellVoice') {

        return (

          <div

            className="oc-note-strip oc-note-strip-three"

            role="list"

            aria-label="Ober shell voice language"

          >

            {shellVoiceItems.map((item) => {

              const Icon = item.icon;

              return (

                <article key={item.title} className="oc-note" role="listitem">

                  <span className="oc-note-icon">

                    <Icon size={15} aria-hidden />

                  </span>

                  <div>

                    <h3>{item.title}</h3>

                    <p>{item.text}</p>

                  </div>

                </article>

              );

            })}

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

          <div className="oc-story-bg-stack" aria-hidden="true">

            {storySlides.map((slide, index) => (

              <div

                key={slide.key}

                className={`oc-story-bg ${

                  activeSlide === index ? 'is-active' : ''

                }`}

                style={{ backgroundImage: `url("${slide.mediaUrl}")` }}

              />

            ))}

          </div>

          <div className="oc-story-bg-overlay" aria-hidden="true" />

          <div className="oc-story-rail" ref={railRef}>

            {storySlides.map((slide, index) => (

              <section

                key={slide.key}

                ref={(el) => {

                  slideRefs.current[index] = el;

                }}

                className={`oc-story-slide oc-story-slide-${slide.type}`}

                aria-label={slide.kicker}

              >

                <div className="oc-wrap oc-story-wrap">

                  <div className="oc-story-inner">

                    <div className="oc-story-copy">

                      <span className="oc-kicker">{slide.kicker}</span>

                      <span className="oc-eyebrow">{slide.eyebrow}</span>

                      <h1 className="oc-story-title">{slide.title}</h1>

                      {slide.body.map((paragraph) => (

                        <p key={paragraph}>{paragraph}</p>

                      ))}

                      {slide.quote && (

                        <div className="oc-story-quote">

                          <span aria-hidden="true">“</span>

                          {slide.quote}

                          <span aria-hidden="true">”</span>

                        </div>

                      )}

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

              <span>Explore the collection</span>

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

              backgroundImage: `url("${PUBLIC}/our-craft/wide.png")`,

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

                  A preview of the collection’s first paths forward — tradition,

                  immersive custom collaboration, and hybrid experimentation.

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