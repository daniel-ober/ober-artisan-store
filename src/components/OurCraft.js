import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';
import './OurCraft.css';
import ArtisanDrums from './ArtisanDrums';
import {
  Sparkles,
  HandHeart,
  Flame,
  Music,
  TreeDeciduous,
  SearchCheck,
} from 'lucide-react';

function usePrefersReducedMotion() {
  const [prefers, setPrefers] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setPrefers(mq.matches);
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return prefers;
}

const values = [
  {
    label: 'Creative Spark',
    description:
      'Every drum starts with a spark — inspiration that shapes everything.',
    icon: Sparkles,
  },
  {
    label: 'Maker’s Touch',
    description:
      'Crafted by real hands, not robots — every drum bears a maker’s mark.',
    icon: HandHeart,
  },
  {
    label: 'Torch-Tuned Resonance',
    description:
      'Proprietary process — controlled flame reveals the wood’s truest voice.',
    icon: Flame,
  },
  {
    label: 'Built for Expression',
    description:
      'Inspiring playability, unmatched tone — every drum is made to move you.',
    icon: Music,
  },
  {
    label: 'Timeless Materials',
    description:
      'Premium woods and honest hardware, chosen for sound, not shortcuts.',
    icon: TreeDeciduous,
  },
  {
    label: 'Obsessive Detail',
    description:
      'From edge to finish, every detail is pored over for perfection.',
    icon: SearchCheck,
  },
];

const OurCraft = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = usePrefersReducedMotion();

  // anchors
  const philosophyRef = useRef(null);
  const founderRef = useRef(null);
  const heritageRef = useRef(null);
  const feuzonRef = useRef(null);
  const soundlegendRef = useRef(null);
  const finalSectionRef = useRef(null);

  const [hoveredValue, setHoveredValue] = useState(null);
  const [showDrumLayers, setShowDrumLayers] = useState(false);
  const [shouldScrollToFinalSection, setShouldScrollToFinalSection] =
    useState(false);

  // reveal drum layers as SoundLegend approaches (feels responsive)
  const [soundlegendTriggerRef, inView] = useInView({
    threshold: 0,
    rootMargin: '240px 0px 0px 0px',
  });

  useEffect(() => {
    document.body.classList.add('our-craft-page');
    return () => document.body.classList.remove('our-craft-page');
  }, []);

  useEffect(() => {
    if (inView) setShowDrumLayers(true);
  }, [inView]);

  useEffect(() => {
    if (
      showDrumLayers &&
      shouldScrollToFinalSection &&
      finalSectionRef.current
    ) {
      const t = setTimeout(() => {
        finalSectionRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
        setShouldScrollToFinalSection(false);
      }, 100);
      return () => clearTimeout(t);
    }
  }, [showDrumLayers, shouldScrollToFinalSection]);

  const scrollTo = useCallback((ref, alignStart = false) => {
    if (!ref?.current) return;
    ref.current.scrollIntoView({
      behavior: 'smooth',
      block: alignStart ? 'start' : 'nearest',
    });
  }, []);

  const handleLearnMore = useCallback(() => {
    if (!showDrumLayers) {
      setShowDrumLayers(true);
      setTimeout(
        () => finalSectionRef.current?.scrollIntoView({ behavior: 'smooth' }),
        150
      );
    } else {
      finalSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showDrumLayers]);

  return (
    <div className="ourcraft-scroll-wrapper">
      <main className="ourcraft-container">
        {/* HERO */}
        <section
          className="ourcraft-section craft-hero-section"
          aria-label="Our Story"
        >
          <div className="hero-grid section-content reveal">
            <div className="hero-text">
              <div className="story-inner">
                <h1>Our Story</h1>
                <p>
                  Crafted in Nashville. Rooted in sound and built by hand —
                  every part of it.
                </p>
                <p>
                  Ober Artisan Drums is the work of Dan Ober, a Boston native
                  who studied composition and film scoring at Berklee College of
                  Music, and sharpened his drumming under world-class players
                  like Mike Mangini and Kim Plainfield.
                </p>
                <p>
                  Now based in Nashville, Dan doesn’t just build drums — he
                  builds the entire experience. From shaping shells and
                  designing the site, to 3D modeling tools and producing all
                  photography, video, and sound in-house — it’s all part of one
                  mission: to craft timeless instruments with soul, originality,
                  and character that resonate with every drummer’s journey.
                </p>
                <p>
                  This is small-batch drum making — fueled by obsession, built
                  by hand.
                </p>

                <div className="mobile-scroll-indicator">
                  <button
                    type="button"
                    className="scroll-indicator btn-ghost"
                    onClick={() => scrollTo(philosophyRef)}
                    aria-label="Scroll to Our Philosophy"
                  >
                    ↓ Our Philosophy
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="desktop-scroll-indicator scroll-indicator-wrapper">
            <button
              type="button"
              className="scroll-indicator btn-ghost"
              onClick={() => scrollTo(philosophyRef)}
              aria-label="Scroll to Our Philosophy"
            >
              ↓ Our Philosophy
            </button>
          </div>
        </section>

        {/* PHILOSOPHY */}
        <section
          ref={philosophyRef}
          className="ourcraft-section philosophy-section"
          aria-label="Our Philosophy"
        >
          <div className="philosophy-grid section-content reveal">
            <div className="philosophy-text">
              <div className="philosophy-inner">
                <h2>Our Philosophy</h2>
                <p className="quote">
                  “A drum doesn’t need to be told what to be — it needs to be
                  listened to.”
                </p>
                <p>
                  Like a luthier tapping a violin, or a mastering engineer
                  knowing when a mix is done — we listen until the drum says,{' '}
                  <em>“I’m ready.”</em>
                </p>
                <div className="values-hint" aria-hidden="true">
                  Hover or tap an icon to learn more
                </div>
                <div className="craft-values" role="list">
                  {values.map((val, i) => {
                    const Icon = val.icon;
                    const open = hoveredValue === i;
                    return (
                      <button
                        key={val.label}
                        type="button"
                        className="value-item"
                        role="listitem"
                        onMouseEnter={() => setHoveredValue(i)}
                        onMouseLeave={() => setHoveredValue(null)}
                        onFocus={() => setHoveredValue(i)}
                        onBlur={() => setHoveredValue(null)}
                        aria-describedby={open ? `val-tip-${i}` : undefined}
                      >
                        <div className="icon-wrapper">
                          <Icon size={28} aria-hidden />
                          <span className="sr-only">{val.label}</span>
                          <div
                            id={`val-tip-${i}`}
                            className={`tooltip ${open ? 'tooltip--visible' : ''}`}
                            role="tooltip"
                          >
                            {val.description}
                          </div>
                        </div>
                        <p>{val.label}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="mobile-scroll-indicator">
                  <button
                    type="button"
                    className="scroll-indicator btn-ghost"
                    onClick={() => scrollTo(founderRef, true)}
                    aria-label="Scroll to Our Founder's Batch"
                  >
                    ↓ Our Founder&apos;s Batch
                  </button>
                </div>
              </div>
            </div>

            <div className="scroll-spacer" />
            <div className="desktop-scroll-indicator scroll-indicator-wrapper">
              <button
                type="button"
                className="scroll-indicator btn-ghost"
                onClick={() => scrollTo(founderRef, true)}
                aria-label="Scroll to Our Founder's Batch"
              >
                ↓ Our Founder&apos;s Batch
              </button>
            </div>
          </div>
        </section>

        {/* FOUNDER'S BATCH */}
        <section
          ref={founderRef}
          className="ourcraft-section artisan-intro-section"
          aria-label="Our Founder's Batch"
        >
          <div className="founder-grid section-content reveal">
            <div className="founder-text">
              <div className="artisan-intro-inner">
                <h2>Our Founder&apos;s Batch</h2>

                <figure className="founder-figure">
                  <img
                    className="founder-wide-img"
                    src="/our-craft/wide.png"
                    alt="Three-drum composition from the Founder's Batch series"
                    loading="lazy"
                    decoding="async"
                  />
                </figure>

                <div className="desktop-scroll-indicator scroll-indicator-wrapper">
                  <button
                    type="button"
                    className="scroll-indicator btn-ghost"
                    onClick={() => scrollTo(heritageRef)}
                    aria-label="Scroll to Heritage Series"
                  >
                    ↓ Heritage Series
                  </button>
                </div>

                <div className="mobile-scroll-indicator">
                  <button
                    type="button"
                    className="scroll-indicator btn-ghost"
                    onClick={() => scrollTo(heritageRef)}
                    aria-label="Scroll to Heritage Series"
                  >
                    ↓ Heritage Series
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HERITAGE */}
        <section
          ref={heritageRef}
          className="ourcraft-section heritage-reveal-section"
          aria-label="Heritage Series"
        >
          <div className="heritage-grid section-content reveal">
            <div className="drum-image-col">
              <img
                src="/artisan-shop/heritage-left.png"
                alt="Heritage drum angled left"
                className="heritage-drum-img"
                loading="lazy"
                decoding="async"
              />
            </div>

            <div className="drum-text-col">
              <img
                src="/resized-logos/heritage-white.png"
                alt="Heritage Series logo"
                className="heritage-logo"
                loading="lazy"
                decoding="async"
              />
              <div className="heritage-text">
                <p className="heritage-quote">
                  “The drum that started it all — classic craftsmanship,
                  timeless sound.”
                </p>

                <ul className="heritage-description-list">
                  <li>Northern Red Oak shell</li>
                  <li>Stave-built for pure resonance</li>
                  <li>45°/Roundover bearing edges</li>
                  <li>Hand-scorched for visual depth + warmth</li>
                  <li>Builds starting at $850</li>
                </ul>

                <div className="mobile-scroll-indicator">
                  <button
                    type="button"
                    className="scroll-indicator btn-ghost"
                    onClick={() => scrollTo(feuzonRef)}
                    aria-label="Scroll to FEUZØN Series"
                  >
                    ↓ FEUZØN Series
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="desktop-scroll-indicator scroll-indicator-wrapper">
            <button
              type="button"
              className="scroll-indicator btn-ghost"
              onClick={() => scrollTo(feuzonRef)}
              aria-label="Scroll to FEUZØN Series"
            >
              ↓ FEUZØN Series
            </button>
          </div>
        </section>

        {/* FEUZØN */}
        <section
          ref={feuzonRef}
          className="ourcraft-section feuzon-reveal-section"
          aria-label="FEUZØN Series"
        >
          <div className="feuzon-grid section-content reveal">
            <div className="drum-image-col feuzon-image-wrapper">
              <img
                src="/artisan-shop/feuzon-right.png"
                alt="Feuzon drum angled right"
                className="feuzon-drum-img"
                loading="lazy"
                decoding="async"
              />
            </div>

            <div className="drum-text-col feuzon-text-col">
              <img
                src="/resized-logos/feuzon-white.png"
                alt="Feuzon logo"
                className="feuzon-logo"
                loading="lazy"
                decoding="async"
              />
              <div className="feuzon-text">
                <p className="feuzon-quote">
                  “Blending tradition and innovation into one harmonious voice.”
                </p>
                <ul className="feuzon-description-list">
                  <li>Hybrid shell: stave + steam-bent</li>
                  <li>150+ unique build variations to fit your voice</li>
                  <li>45°/Roundover bearing edges</li>
                  <li>Torch-tuned for clarity + balance</li>
                  <li>Builds starting at $1050</li>
                </ul>

                <div className="mobile-scroll-indicator">
                  <button
                    type="button"
                    className="scroll-indicator btn-ghost"
                    onClick={() => scrollTo(soundlegendRef)}
                    aria-label="Scroll to SoundLegend Series"
                  >
                    ↓ SoundLegend Series
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="desktop-scroll-indicator scroll-indicator-wrapper">
            <button
              type="button"
              className="scroll-indicator btn-ghost"
              onClick={() => scrollTo(soundlegendRef)}
              aria-label="Scroll to SoundLegend Series"
            >
              ↓ SoundLegend Series
            </button>
          </div>
        </section>

        {/* SOUNDLEGEND */}
        <section
          ref={soundlegendRef}
          className="ourcraft-section soundlegend-reveal-section"
          aria-label="SoundLegend Series"
        >
          <div className="soundlegend-grid section-content reveal">
            <div className="drum-image-col">
              <img
                src="/artisan-shop/soundlegend-left.png"
                alt="SoundLegend drum angled left"
                className="soundlegend-drum-img"
                loading="lazy"
                decoding="async"
              />
            </div>

            <div className="drum-text-col">
              <img
                src="/resized-logos/soundlegend-white.png"
                alt="SoundLegend logo"
                className="soundlegend-logo"
                loading="lazy"
                decoding="async"
              />
              <div className="soundlegend-text">
                <p className="soundlegend-quote">
                  “Every drum tells a story — let’s craft yours together.”
                </p>
                <ul className="soundlegend-description-list">
                  <li>Custom-built from your vision</li>
                  <li>1-on-1 with Dan Ober</li>
                  <li>High resolution concept mockups</li>
                  <li>Behind-the-scenes access</li>
                  <li>Limited Edition gift item</li>
                  <li>Builds starting at $1499</li>
                </ul>

                <div className="mobile-scroll-indicator">
                  <button
                    type="button"
                    className="scroll-indicator btn-ghost"
                    onClick={handleLearnMore}
                    aria-label="Learn more about our series"
                  >
                    ↓ Learn More
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="desktop-scroll-indicator scroll-indicator-wrapper">
            <button
              type="button"
              className="scroll-indicator btn-ghost"
              onClick={handleLearnMore}
              aria-label="Learn more about our series"
            >
              ↓ Learn More
            </button>
          </div>
        </section>

        {/* Trigger AFTER SoundLegend for inView tracking */}
        <div ref={soundlegendTriggerRef} aria-hidden style={{ height: 1 }} />

        {/* DRUM DISPLAY */}
        {showDrumLayers && (
          <section
            ref={finalSectionRef}
            className="ourcraft-section artisan-final-section"
            aria-label="Founder’s Batch Comparison"
            style={{ padding: 0, margin: 0 }}
          >
            <ArtisanDrums prefersReducedMotion={prefersReducedMotion} />
          </section>
        )}
      </main>
    </div>
  );
};

export default OurCraft;
