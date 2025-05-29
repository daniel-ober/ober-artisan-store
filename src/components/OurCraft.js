import React, { useState, useRef, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import './OurCraft.css';
import { useNavigate } from 'react-router-dom';
// import OurCraftDrumDisplay from './OurCraftDrumDisplay';
import ArtisanDrums from './ArtisanDrums';
import {
  Sparkles,
  HandHeart,
  Flame,
  Music,
  TreeDeciduous,
  SearchCheck,
} from 'lucide-react';

const OurCraft = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const philosophyRef = useRef(null);
  const founderRef = useRef(null);
  const heritageRef = useRef(null);
  const feuzonRef = useRef(null);
  const soundlegendRef = useRef(null);
  const finalSectionRef = useRef(null);

  const scrollToRef = (ref, override = false) => {
    if (ref?.current) {
      ref.current.scrollIntoView({
        behavior: 'smooth',
        block: override ? 'start' : 'nearest',
      });
    }
  };

  useEffect(() => {
    document.body.classList.add('our-craft-page');
    return () => {
      document.body.classList.remove('our-craft-page');
    };
  }, []);

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

  const [hoveredValue, setHoveredValue] = useState(null);
  const [showDrumLayers, setShowDrumLayers] = useState(false);
  const [soundlegendTriggerRef, inView] = useInView({ threshold: 0 });
  const [shouldScrollToFinalSection, setShouldScrollToFinalSection] =
    useState(false);

  useEffect(() => {
    if (inView) {
      setShowDrumLayers(true);
    }
  }, [inView]);

  useEffect(() => {
    if (showDrumLayers && shouldScrollToFinalSection) {
      const timeout = setTimeout(() => {
        if (finalSectionRef.current) {
          finalSectionRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        setShouldScrollToFinalSection(false);
      }, 100); // slight delay after render
      return () => clearTimeout(timeout);
    }
  }, [showDrumLayers, shouldScrollToFinalSection]);

  return (
    <div className="ourcraft-scroll-wrapper">
      <main className="ourcraft-container">
        {/* HERO */}
        <section ref={heroRef} className="ourcraft-section craft-hero-section">
          <div className="hero-grid section-content">
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
                  This is small-batch drum making - fueled by obsession, built
                  by hand.
                </p>

                {/* Mobile scroll indicator INSIDE text */}
                <div className="mobile-scroll-indicator">
                  <div
                    className="scroll-indicator"
                    onClick={() => scrollToRef(philosophyRef)}
                  >
                    ↓ Our Philosophy
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop scroll indicator OUTSIDE text */}
          <div className="desktop-scroll-indicator scroll-indicator-wrapper">
            <div
              className="scroll-indicator"
              onClick={() => scrollToRef(philosophyRef)}
            >
              ↓ Our Philosophy
            </div>
          </div>
        </section>

        {/* PHILOSOPHY */}
        <section
          ref={philosophyRef}
          className="ourcraft-section philosophy-section"
        >
          <div className="philosophy-grid section-content">
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
                <div className="craft-values">
                  {values.map((val, i) => {
                    const Icon = val.icon;
                    return (
                      <div
                        key={i}
                        className="value-item"
                        onMouseEnter={() => setHoveredValue(i)}
                        onMouseLeave={() => setHoveredValue(null)}
                      >
                        <div className="icon-wrapper">
                          <Icon size={32} />
                          {hoveredValue === i && (
                            <div className="tooltip">{val.description}</div>
                          )}
                        </div>
                        <p>{val.label}</p>
                      </div>
                    );
                  })}
                </div>
                {/* Mobile scroll indicator INSIDE text */}
                <div className="mobile-scroll-indicator">
                  <div
                    className="scroll-indicator"
                    onClick={() => scrollToRef(founderRef, true)}
                  >
                    ↓ Our Founder's Batch
                  </div>
                </div>
              </div>
            </div>

            {/* Spacer to ensure scroll indicator isn't pushed out */}
            <div className="scroll-spacer" />

            {/* Desktop scroll indicator OUTSIDE text */}
            <div className="desktop-scroll-indicator scroll-indicator-wrapper">
              <div
                className="scroll-indicator"
                onClick={() => scrollToRef(founderRef, true)}
              >
                ↓ Our Founder's Batch
              </div>
            </div>
          </div>
        </section>

        {/* FOUNDER'S BATCH */}
        <section
          ref={founderRef}
          className="ourcraft-section artisan-intro-section"
        >
          <div className="founder-grid section-content">
            <div className="founder-text">
              <div className="artisan-intro-inner">
                <h2>Our Founder's Batch</h2>
                {/* <p className="artisan-tagline">
                  “Every journey begins with a single voice.”
                </p>
                <p className="artisan-intro-paragraph">
                  Before the brand, there was one drum. Built by hand, late at
                  night, to answer a question:{' '}
                  <em>What does it mean to build with soul?</em>
                </p> */}

                {/* IMAGE DISPLAY */}
                <img
                  className="founder-wide-img"
                  src="/our-craft/wide.png"
                  alt="Founder's Batch Wide Drum"
                />

                {/* ✅ Desktop scroll indicator now correctly inside layout flow */}
                <div className="desktop-scroll-indicator scroll-indicator-wrapper">
                  <div
                    className="scroll-indicator"
                    onClick={() => scrollToRef(heritageRef)}
                  >
                    ↓ Heritage Series
                  </div>
                </div>

                {/* Mobile scroll indicator */}
                <div className="mobile-scroll-indicator">
                  <div
                    className="scroll-indicator"
                    onClick={() => scrollToRef(heritageRef)}
                  >
                    ↓ Heritage Series
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HERITAGE SECTION - IMAGE LEFT, TEXT RIGHT */}
        <section
          ref={heritageRef}
          className="ourcraft-section heritage-reveal-section"
        >
          <div className="heritage-grid section-content">
            {/* IMAGE COLUMN */}
            <div className="drum-image-col">
              <img
                src="/artisan-shop/heritage-left.png"
                alt="Heritage Drum"
                className="heritage-drum-img"
              />
            </div>
            {/* TEXT COLUMN */}
            <div className="drum-text-col">
              <img
                src="/resized-logos/heritage-white.png"
                alt="Heritage Logo"
                className="heritage-logo"
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
                {/* <button
                  className="heritage-button"
                  onClick={() => navigate('/artisan-shop/heritage')}
                >
                  Learn More
                </button> */}
                {/* Mobile scroll indicator INSIDE the text */}
                <div className="mobile-scroll-indicator">
                  <div
                    className="scroll-indicator"
                    onClick={() => scrollToRef(feuzonRef)}
                  >
                    ↓ FEUZØN Series
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Desktop scroll indicator OUTSIDE text */}
          <div className="desktop-scroll-indicator scroll-indicator-wrapper">
            <div
              className="scroll-indicator"
              onClick={() => scrollToRef(feuzonRef)}
            >
              ↓ FEUZØN Series
            </div>
          </div>
        </section>
        {/* FEUZON SECTION - IMAGE RIGHT ON DESKTOP, IMAGE TOP ON MOBILE */}
        <section
          ref={feuzonRef}
          className="ourcraft-section feuzon-reveal-section"
        >
          <div className="feuzon-grid section-content">
            {/* IMAGE COLUMN -- move this to the top like Heritage */}
            <div className="drum-image-col feuzon-image-wrapper">
              <img
                src="/artisan-shop/feuzon-right.png"
                alt="Feuzon Drum"
                className="feuzon-drum-img"
              />
            </div>
            {/* TEXT COLUMN */}
            <div className="drum-text-col feuzon-text-col">
              <img
                src="/resized-logos/feuzon-white.png"
                alt="Feuzon Logo"
                className="feuzon-logo"
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
                {/* <button
                  className="feuzon-button"
                  onClick={() => navigate('/artisan-shop/feuzon')}
                >
                  Learn More
                </button> */}
                <div className="mobile-scroll-indicator">
                  <div
                    className="scroll-indicator"
                    onClick={() => scrollToRef(soundlegendRef)}
                  >
                    ↓ Soundlegend Series
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Desktop scroll indicator OUTSIDE text */}
          <div className="desktop-scroll-indicator scroll-indicator-wrapper">
            <div
              className="scroll-indicator"
              onClick={() => scrollToRef(soundlegendRef)}
            >
              ↓ Soundlegend Series
            </div>
          </div>
        </section>

{/* SOUNDLEGEND SECTION */}
<section
  ref={soundlegendRef}
  className="ourcraft-section soundlegend-reveal-section"
>
  <div className="soundlegend-grid section-content">
    {/* IMAGE COLUMN */}
    <div className="drum-image-col">
      <img
        src="/artisan-shop/soundlegend-left.png"
        alt="SoundLegend Drum"
        className="soundlegend-drum-img"
      />
    </div>

    {/* TEXT COLUMN */}
    <div className="drum-text-col">
      <img
        src="/resized-logos/soundlegend-white.png"
        alt="SoundLegend Logo"
        className="soundlegend-logo"
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
          <li>Builds starting at $1250</li>
        </ul>

        {/* Mobile scroll indicator */}
        <div className="mobile-scroll-indicator">
          <div
            className="scroll-indicator"
            onClick={() => {
              if (!showDrumLayers) {
                setShowDrumLayers(true);
                setTimeout(() => {
                  finalSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 150);
              } else {
                finalSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            ↓ Learn More
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Desktop scroll indicator */}
  <div className="desktop-scroll-indicator scroll-indicator-wrapper">
    <div
      className="scroll-indicator"
      onClick={() => {
        if (!showDrumLayers) {
          setShowDrumLayers(true);
          setTimeout(() => {
            finalSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 150);
        } else {
          finalSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      }}
    >
      ↓ Learn More
    </div>
  </div>
</section>

        {/* Trigger element AFTER SoundLegend for inView tracking */}
        <div ref={soundlegendTriggerRef} style={{ height: '1px' }} />

        {/* DRUM DISPLAY */}
        {showDrumLayers && (
          <section
            ref={finalSectionRef}
            className="ourcraft-section artisan-final-section"
            style={{ padding: 0, margin: 0 }}
          >
            <ArtisanDrums />
          </section>
        )}
      </main>
    </div>
  );
};

export default OurCraft;
