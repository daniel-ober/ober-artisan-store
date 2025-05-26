import React, { useState, useRef } from 'react';
import './OurCraft.css';
import { useNavigate } from 'react-router-dom';
import OurCraftDrumDisplay from './OurCraftDrumDisplay';
import { Flame, Hammer, Ear, Hand, Sparkles } from 'lucide-react';

const OurCraft = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const philosophyRef = useRef(null);
  const founderRef = useRef(null);
  const heritageRef = useRef(null);
  const feuzonRef = useRef(null);
  const soundlegendRef = useRef(null);

  const scrollToRef = (ref) => {
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const values = [
    {
      label: 'Creative Spark',
      description:
        'Every drum starts with a spark — inspiration that shapes everything.',
    },
    {
      label: 'Intentional Design',
      description: 'Purposeful choices, never rushed. Built for personality.',
    },
    {
      label: 'Handcrafted Connection',
      description: 'Real hands, real craft — every drum feels alive.',
    },
    {
      label: 'Torch-Tuned',
      description:
        'Controlled flame reveals the wood’s voice and true resonance.',
    },
    {
      label: 'Sound First',
      description:
        'Built to serve the drummer — translating emotion into tone.',
    },
  ];

  const [hoveredValue, setHoveredValue] = useState(null);

  return (
    <div className="ourcraft-scroll-wrapper">
      <main className="ourcraft-container">
        {/* HERO */}
        <section ref={heroRef} className="ourcraft-section craft-hero-section">
          <div className="hero-grid section-content">
            {/* You can add an image/logo here if you want */}
            {/* <div className="hero-image-wrapper"></div> */}
            <div className="hero-text">
              <div className="story-inner">
                <h1>Our Story</h1>
                <p>Where timeless sound meets modern soul.</p>
                <p>
                  Ober Artisan Drums is a boundary-pushing company rooted in
                  sonic detail, craftsmanship, and individuality.
                </p>
                <p>
                  Every drum is handcrafted for drummers who want more
                  character, clarity, and connection to their sound.
                </p>
                <p>
                  Founder Dan Ober brings 30+ years of experience and a blend of
                  sound design, engineering, and soul to every build.
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

        <section
          ref={philosophyRef}
          className="ourcraft-section philosophy-section"
        >
          <div className="philosophy-grid section-content">
            {/* Optional: Add an image, icon, or leave empty */}
            {/* <div className="philosophy-image-wrapper"></div> */}
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
                  {[Sparkles, Hammer, Hand, Flame, Ear].map((Icon, i) => (
                    <div
                      key={i}
                      className="value-item"
                      onMouseEnter={() => setHoveredValue(i)}
                      onMouseLeave={() => setHoveredValue(null)}
                    >
                      <div className="icon-wrapper">
                        <Icon size={32} />
                        {hoveredValue === i && (
                          <div className="tooltip">{values[i].description}</div>
                        )}
                      </div>
                      <p>{values[i].label}</p>
                    </div>
                  ))}
                </div>
                {/* Mobile scroll indicator INSIDE text */}
                <div className="mobile-scroll-indicator">
                  <div
                    className="scroll-indicator"
                    onClick={() => scrollToRef(founderRef)}
                  >
                    ↓ Our Founder's Batch
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Desktop scroll indicator OUTSIDE text */}
          <div className="desktop-scroll-indicator scroll-indicator-wrapper">
            <div
              className="scroll-indicator"
              onClick={() => scrollToRef(founderRef)}
            >
              ↓ Our Founder's Batch
            </div>
          </div>
        </section>

        {/* FOUNDER'S BATCH */}
        <section
          ref={founderRef}
          className="ourcraft-section artisan-intro-section"
        >
          <div className="founder-grid section-content">
            {/* Optional: Add an image, or leave empty */}
            {/* <div className="founder-image-wrapper"></div> */}
            <div className="founder-text">
              <div className="artisan-intro-inner">
                <h2>Our Founder's Batch</h2>
                <p className="artisan-tagline">
                  “Every journey begins with a single voice.”
                </p>
                <p className="artisan-intro-paragraph">
                  Before the brand, there was one drum. Built by hand, late at
                  night, to answer a question:{' '}
                  <em>What does it mean to build with soul?</em>
                </p>
                <p className="artisan-intro-tagline">
                  That drum sparked the path and philosophy for Ober Artisan
                  Drums.
                </p>
                {/* Mobile scroll indicator INSIDE text */}
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
          {/* Desktop scroll indicator OUTSIDE text */}
          <div className="desktop-scroll-indicator scroll-indicator-wrapper">
            <div
              className="scroll-indicator"
              onClick={() => scrollToRef(heritageRef)}
            >
              ↓ Heritage Series
            </div>
          </div>
        </section>

        {/* HERITAGE */}
        <section
          ref={heritageRef}
          className="ourcraft-section heritage-reveal-section"
        >
          <div className="heritage-grid section-content">
            <div className="heritage-image-wrapper">
              <img
                src="/artisan-shop/heritage-left.png"
                alt="Heritage Drum"
                className="heritage-drum-img"
              />
            </div>
            <div className="heritage-text">
              <img
                src="/resized-logos/heritage-white.png"
                alt="Heritage Logo"
                className="heritage-logo"
              />
              <p className="heritage-quote">
                “The drum that started it all — classic craftsmanship, timeless
                sound.”
              </p>
              <p className="heritage-description">
                The <strong>HERITAGE</strong> Series: torch-tuned, hand-built,
                full of soul.
              </p>
              <button
                className="heritage-button"
                onClick={() => navigate('/artisan-shop/heritage')}
              >
                Pre-Order Heritage
              </button>

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

        {/* FEUZON */}
        <section
          ref={feuzonRef}
          className="ourcraft-section feuzon-reveal-section"
        >
          <div className="feuzon-grid section-content">
            <div className="feuzon-text feuzon-copy">
              <img
                src="/resized-logos/feuzon-white.png"
                alt="Feuzon Logo"
                className="feuzon-logo"
              />
              <p className="feuzon-quote">
                “Blending tradition and innovation into one harmonious voice.”
              </p>
              <p className="feuzon-description">
                The <strong>FEUZØN</strong> Series merges stave precision with
                steam-bent boldness.
              </p>
              <button
                className="feuzon-button"
                onClick={() => navigate('/artisan-shop/feuzon')}
              >
                Pre-Order Now
              </button>
              {/* Mobile scroll indicator INSIDE the text */}
              <div className="mobile-scroll-indicator">
                <div
                  className="scroll-indicator"
                  onClick={() => scrollToRef(soundlegendRef)}
                >
                  ↓ SoundLegend Experience
                </div>
              </div>
            </div>
            <div className="feuzon-image-wrapper feuzon-img">
              <img
                src="/artisan-shop/feuzon-right.png"
                alt="Feuzon Drum"
                className="feuzon-drum-img"
              />
            </div>
          </div>
          {/* Desktop scroll indicator OUTSIDE text */}
          <div className="desktop-scroll-indicator scroll-indicator-wrapper">
            <div
              className="scroll-indicator"
              onClick={() => scrollToRef(soundlegendRef)}
            >
              ↓ SoundLegend Experience
            </div>
          </div>
        </section>

        {/* SOUNDLEGEND */}
        <section
          ref={soundlegendRef}
          className="ourcraft-section soundlegend-reveal-section"
        >
          <div className="soundlegend-grid section-content">
            <div className="soundlegend-image-wrapper">
              <img
                src="/artisan-shop/soundlegend-left.png"
                alt="SoundLegend Drum"
                className="soundlegend-drum-img"
              />
            </div>
            <div className="soundlegend-text">
              <img
                src="/resized-logos/soundlegend-white.png"
                alt="SoundLegend Logo"
                className="soundlegend-logo"
              />
              <p className="soundlegend-quote">
                “Every drum tells a story — let’s craft yours together.”
              </p>
              <p className="soundlegend-description">
                The <strong>SoundLegend</strong> Series: a true collaboration,
                custom-built from your vision.
              </p>
              <button
                className="soundlegend-button"
                onClick={() => navigate('/artisan-shop/soundlegend')}
              >
                Begin the Journey
              </button>
              {/* No scroll indicator needed here */}
            </div>
          </div>
        </section>

        {/* DRUM DISPLAY */}
        <section className="ourcraft-section">
          <div className="section-content">
            <OurCraftDrumDisplay />
          </div>
        </section>
      </main>
    </div>
  );
};

export default OurCraft;
