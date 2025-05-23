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
        'Every drum begins with a spark — a flash of inspiration that guides the build. It’s not just about specs, but the story that drives them.',
    },
    {
      label: 'Intentional Design',
      description:
        'Every element is shaped with care — never mass-produced, never rushed. A drum that begins with purpose ends with personality.',
    },
    {
      label: 'Handcrafted Connection',
      description:
        'Your drum is made by real hands. The same ones that listen, adjust, and shape until it feels alive.',
    },
    {
      label: 'Torch-Tuned',
      description:
        'Using controlled flame, we refine the wood’s voice — not to impose a tone, but to reveal its natural resonance.',
    },
    {
      label: 'Sound First',
      description:
        'We build to serve the drummer’s voice — to translate emotion into tone, not just decibels into air.',
    },
  ];

  const [hoveredValue, setHoveredValue] = useState(null);

  return (
    <div className="ourcraft-scroll-wrapper">
      <main className="ourcraft-container">
        <section ref={heroRef} className="ourcraft-section craft-hero-section">
          <div className="craft-hero-overlay">
            <div className="story-inner">
              <h1>Our Story</h1>
              <p>Where timeless sound meets modern soul</p>
              <p>
                Ober Artisan Drums is a boundary-pushing instrument company rooted
                in sonic detail, craftsmanship, and individuality. Based in
                Nashville, every drum is handcrafted to serve as a meaningful
                extension of the artist behind it.
              </p>
              <p>
                These are not mass-produced instruments — they’re built for
                drummers who demand more: more character, more clarity, and more
                connection to their sound.
              </p>
              <p>
                Founder Dan Ober studied Film Scoring at Berklee and trained under
                legends like Mike Mangini. With 30+ years behind the kit, he
                brings a unique blend of sound design, engineering, and soul to
                every build.
              </p>
            </div>
          </div>
          <div className="mobile-scroll-indicator-wrapper">
            <div
              className="scroll-indicator"
              onClick={() => scrollToRef(philosophyRef)}
            >
              ↓ Our Philosophy
            </div>
          </div>
        </section>
  
        <section ref={philosophyRef} className="ourcraft-section philosophy-section">
          <div className="philosophy-inner">
            <h2>Our Philosophy</h2>
            <p className="quote">“A drum doesn’t need to be told what to be — it needs to be listened to.”</p>
            <p>
              Like a luthier tapping the top of a violin, or a mastering engineer knowing the exact moment to print the final mix — we listen for that signal only the instrument can give. That’s when the drum says: <em>“I’m ready.”</em>
            </p>
            <p>
              It’s not about formulas — it’s about feel, intuition, and the soul we pour into every cut, curve, and contour.
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
          </div>
          <div className="mobile-scroll-indicator-wrapper">
            <div
              className="scroll-indicator"
              onClick={() => scrollToRef(founderRef)}
            >
              ↓ Our Founder's Batch
            </div>
          </div>
        </section>
  
        <section ref={founderRef} className="ourcraft-section artisan-intro-section">
          <div className="artisan-intro-inner">
            <h2>Our Founder's Batch</h2>
            <p className="artisan-tagline">“Every journey begins with a single voice.”</p>
            <p className="artisan-intro-paragraph">
              Before there was a name, before there was a brand — there was one
              drum. Built by hand in a quiet workshop late at night. Not to prove
              anything, but to explore a question: <em>what does it mean to build with soul?</em>
            </p>
            <p className="artisan-intro-paragraph">
              That first drum sparked a path that would shape the heart of Ober
              Artisan Drums. A foundation built on fire, intuition, and relentless
              curiosity. One voice. One vision. And soon — a legacy.
            </p>
            <p className="artisan-intro-tagline">
              The drum that started it all is just ahead.
            </p>
          </div>
          <div className="mobile-scroll-indicator-wrapper">
            <div
              className="scroll-indicator"
              onClick={() => scrollToRef(heritageRef)}
            >
              ↓ Heritage Series
            </div>
          </div>
        </section>
  
        <section ref={heritageRef} className="ourcraft-section heritage-reveal-section">
          <div className="heritage-grid">
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
                “The drum that started it all — classic craftsmanship, timeless sound.”
              </p>
              <p className="heritage-description">
                The <strong>HERITAGE</strong> Series is where it all began — torch-tuned, hand-built, and full of soul.
              </p>
              <p className="heritage-description">
                Crafted to reveal the wood’s voice with a signature scorched finish.
              </p>
              <button
                className="heritage-button"
                onClick={() => navigate('/artisan-shop/heritage')}
              >
                Pre-Order Heritage
              </button>
            </div>
          </div>
          <div className="mobile-scroll-indicator-wrapper">
            <div
              className="scroll-indicator"
              onClick={() => scrollToRef(feuzonRef)}
            >
              ↓ FEUZØN Series
            </div>
          </div>
        </section>
  
        <section ref={feuzonRef} className="ourcraft-section feuzon-reveal-section">
          <div className="feuzon-grid">
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
                The <strong>FEUZØN</strong> Series merges stave precision with a steam-bent shell for bold, responsive tone.
              </p>
              <p className="feuzon-description">
                Torch-tuned and hand-finished to balance warmth and clarity.
              </p>
              <button
                className="feuzon-button"
                onClick={() => navigate('/artisan-shop/feuzon')}
              >
                Pre-Order Now
              </button>
            </div>
            <div className="feuzon-image-wrapper feuzon-img">
              <img
                src="/artisan-shop/feuzon-right.png"
                alt="Feuzon Drum"
                className="feuzon-drum-img"
              />
            </div>
          </div>
          <div className="mobile-scroll-indicator-wrapper">
            <div
              className="scroll-indicator"
              onClick={() => scrollToRef(soundlegendRef)}
            >
              ↓ SoundLegend Experience
            </div>
          </div>
        </section>
  
        <section ref={soundlegendRef} className="ourcraft-section soundlegend-reveal-section">
          <div className="soundlegend-grid">
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
                The <strong>SoundLegend</strong> Series is a true collaboration — custom-built from your vision, tone, and story.
              </p>
              <p className="soundlegend-description">
                From concept to delivery, every detail reflects your voice.
              </p>
              <button
                className="soundlegend-button"
                onClick={() => navigate('/artisan-shop/soundlegend')}
              >
                Begin the Journey
              </button>
            </div>
          </div>
        </section>
  
        <section className="ourcraft-section">
          {/* <OurCraftDrumDisplay /> */}
        </section>
      </main>
    </div>
  );
};

export default OurCraft;