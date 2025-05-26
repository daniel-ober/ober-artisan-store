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

  useEffect(() => {
    if (inView) {
      setShowDrumLayers(true);
    }
  }, [inView]);

  return (
    <div className="ourcraft-scroll-wrapper">
      <main className="ourcraft-container">
        {/* HERO */}
        <section ref={heroRef} className="ourcraft-section craft-hero-section">
          <div className="hero-grid section-content">
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
                  <li>Torch-fired for tonal depth</li>
                  <li>Trick throw-off + Puresound wires</li>
                  <li>Handmade in Nashville, TN</li>
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
                  <li>Multi-wood blend for bold tone</li>
                  <li>45°/Roundover edges for range</li>
                  <li>Torch-tuned for clarity + balance</li>
                  <li>Stained or natural semi-gloss</li>
                  <li>Made for dynamic expression</li>
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
                    ↓ SoundLegend Experience
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mobile-scroll-indicator"></div>
        </section>
        {/* SOUNDLEGEND SECTION - IMAGE LEFT, TEXT RIGHT */}
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
                  <li>Work 1-on-1 with Dan Ober</li>
                  <li>Mockups before final build</li>
                  <li>Choose woods, edges, finish</li>
                  <li>Pro-grade hardware + detail</li>
                  <li>Tuned to your style + goals</li>
                  <li>Includes gift + Ober swag</li>
                  <li>Track progress in your portal</li>
                </ul>
                <div
            className="scroll-indicator"
            onClick={() => scrollToRef(finalSectionRef)}
          >
            ↓ Begin Your Journey
          </div>
                {/* <button
          className="soundlegend-button"
          onClick={() => navigate('/artisan-shop/soundlegend')}
        >
          Begin the Journey
        </button> */}
              </div>
            </div>
          </div>

        </section>
        {/* 👇 This is the trigger element to detect when SoundLegend leaves viewport */}
        <div ref={soundlegendTriggerRef} style={{ height: '1px' }} />
        {/* 👇 This trigger activates AFTER SoundLegend has left the viewport */}
        <div ref={soundlegendTriggerRef} style={{ height: '1px' }} />{' '}
        {/* 👇 This is the actual trigger placed AFTER SoundLegend */}
        <div ref={soundlegendTriggerRef} style={{ height: '1px' }} />{' '}
        {/* Place the trigger AFTER the section */}
        <div ref={soundlegendTriggerRef} style={{ height: '1px' }} />{' '}
        {/* DRUM DISPLAY */}
        {showDrumLayers && (
          <section ref={finalSectionRef} className="ourcraft-section">
            <div className="artisanseries-wrapper">
              <ArtisanDrums />
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default OurCraft;
