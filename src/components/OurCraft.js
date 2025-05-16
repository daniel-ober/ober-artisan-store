import React, { useState, useRef } from 'react';
import './OurCraft.css';
import { useNavigate } from 'react-router-dom';
import OurCraftDrumDisplay from './OurCraftDrumDisplay';
import { Flame, Hammer, Ear, Hand, Ruler } from 'lucide-react';

const OurCraft = () => {
  const navigate = useNavigate();

  const values = [
    {
      label: 'Intentional Design',
      description:
        'Every element is shaped with care — never mass-produced, never rushed. A drum that begins with purpose ends with personality.',
    },
    {
      label: 'Torch-Tuned Shells',
      description:
        'Using controlled flame, we refine the wood’s voice — not to impose a tone, but to reveal its natural resonance.',
    },
    {
      label: 'Sound First',
      description:
        'We build to serve the drummer’s voice — to translate emotion into tone, not just decibels into air.',
    },
    {
      label: 'Handcrafted Connection',
      description:
        'Your drum is made by real hands. The same ones that listen, adjust, and shape until it feels alive.',
    },
    {
      label: 'Precision & Feel',
      description:
        'Measurements matter, but soul matters more. We build with both.',
    },
  ];

  const [hoveredValue, setHoveredValue] = useState(0);
  const heroRef = useRef(null);

  return (
    <div className="ourcraft-container">
      <section ref={heroRef} className="ourcraft-section craft-hero-section">
        <div className="craft-hero-overlay">
          <h1>Our Story</h1>
          <p>Where timeless sound meets modern soul</p>

          <p>
            Ober Artisan Drums is a boundary-pushing instrument company rooted
            in sonic detail, craftsmanship, and individuality. Based in
            Nashville, every drum is handcrafted to serve as a meaningful
            extension of the artist behind it.
          </p>
          <p>
            These are not mass-produced instruments — they’re built for drummers
            who demand more: more character, more clarity, and more connection
            to their sound.
          </p>
          <p>
            Founder Dan Ober studied Film Scoring at Berklee and trained under
            legends like Mike Mangini. With 30+ years behind the kit, he brings
            a unique blend of sound design, engineering, and soul to every
            build.
          </p>

          <div className="scroll-indicator">↓ Our Philosophy</div>
        </div>
      </section>

      <section className="ourcraft-section philosophy-section">
        <div className="philosophy-inner">
          <h2>Our Philosophy</h2>
          <p>
            A drum doesn’t need to be told what to be — it needs to be listened
            to.
          </p>
          <p>
            Torch-tuning isn’t about forcing sound into the shell. It’s about
            drawing it out — coaxing the natural voice that already lives inside
            the wood. Like a master barista knowing when the roast is just
            right, or a luthier tapping a violin top to find its resonance,
            there’s a moment where the shell says, “now I’m ready.”
          </p>
          <p className="quote">
            “If it bears the Ober name, it has to speak with truth.”
          </p>

          <div className="craft-values">
            {[Hammer, Flame, Ear, Hand, Ruler].map((Icon, i) => (
              <div
                key={i}
                className={`value-item${i === hoveredValue ? ' active' : ''}`}
                onMouseEnter={() => setHoveredValue(i)}
              >
                <Icon size={32} />
                <p>{values[i].label}</p>
              </div>
            ))}
          </div>

          <div className="value-description">
            <p>{values[hoveredValue].description}</p>
          </div>
        <div className="scroll-indicator">↓ Our Founder's Batch</div>
        </div>

      </section>

      <section className="ourcraft-section artisan-intro-section">
        <div className="artisan-intro-inner">
          <h2>Our Founder's Batch</h2>
          <p className="artisan-tagline">
            “Every journey begins with a single voice.”
          </p>
          <p className="artisan-intro-paragraph">
            Before there was a name, before there was a brand — there was one
            drum. Built by hand in a quiet workshop late at night. Not to prove
            anything, but to explore a question:{' '}
            <em>what does it mean to build with soul?</em>
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
      </section>

      <section className="ourcraft-section heritage-reveal-section">
        <div className="heritage-grid">
          {/* Drum Image - Left on Desktop, Center on Mobile */}
          <div className="heritage-image-wrapper">
            <img
              src="/artisan-shop/heritage-left.png"
              alt="Heritage Drum"
              className="heritage-drum-img"
            />
          </div>

          {/* Textual Content */}
          <div className="heritage-text">
            <img
              src="/v2logo-large/heritage-white.png"
              alt="Heritage Logo"
              className="heritage-logo"
            />
            <p className="heritage-quote">
              “The drum that started it all — classic craftsmanship, timeless
              sound.”
            </p>
            <p className="heritage-description">
              The <strong>HERITAGE</strong> Series is where Ober Artisan began —
              a torch-tuned shell built by hand in Nashville. Crafted for
              drummers who demand feel, soul, and resonance.
            </p>
            <p className="heritage-description">
              Each shell is tuned to reveal the wood’s natural voice, finished
              with a signature scorched aesthetic.
            </p>
            <button
              className="heritage-button"
              onClick={() => navigate('/artisanseries/heritage')}
            >
              Pre-Order Heritage
            </button>
          </div>
        </div>
      </section>

      <section className="feuzon-reveal-section">
        <div className="feuzon-grid">
          {/* TEXT FIRST */}
          <div className="feuzon-text">
            <img
              src="/resized-logos/feuzon-white.png"
              alt="Feuzon Logo"
              className="feuzon-logo"
            />
            <p className="feuzon-quote">
              “Blending tradition and innovation into one harmonious voice.”
            </p>
            <p className="feuzon-description">
              The <strong>FEUZØN</strong> Series fuses stave precision with a
              steam-bent shell for warmth and clarity. Torch-tuned and
              hand-finished to deliver bold, responsive tone.
            </p>
            <button
              className="feuzon-button"
              onClick={() => navigate('/artisanseries/feuzon')}
            >
              Pre-Order Now
            </button>
          </div>

          {/* IMAGE SECOND */}
          <div className="feuzon-image-wrapper">
            <img
              src="/artisan-shop/feuzon-right.png"
              alt="Feuzon Drum"
              className="feuzon-drum-img"
            />
          </div>
        </div>
      </section>

      <section className="soundlegend-reveal-section">
        <div className="soundlegend-grid">
          {/* IMAGE LEFT on web */}
          <div className="soundlegend-image-wrapper">
            <img
              src="/artisan-shop/soundlegend-left.png"
              alt="SoundLegend Drum"
              className="soundlegend-drum-img"
            />
          </div>

          {/* TEXT RIGHT on web */}
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
              The <strong>SoundLegend</strong> Series isn’t a product — it’s a
              collaboration. For drummers ready to go deeper, this series is
              your canvas. We start with your vision and walk every step of the
              build together, from material selection to tonal shaping and final
              delivery. You'll receive concept mockups, progress updates, and a
              drum that speaks your voice.
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
        <OurCraftDrumDisplay />
      </section>
    </div>
  );
};

export default OurCraft;
