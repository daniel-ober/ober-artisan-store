import React, { useState } from "react";
import "./OurCraft.css";
import { useNavigate } from "react-router-dom";
import OurCraftDrumDisplay from "./OurCraftDrumDisplay";
import { Flame, Hammer, Ear, Hand, Ruler } from 'lucide-react';

const drumSeries = [
  {
    id: "heritage",
    logo: "/v2logo-large/heritage-white.png",
    quote: "“The drum that started it all—classic craftsmanship, timeless sound.”",
    description:
      "The HERITAGE Series embodies the soul of hand-crafted percussion. Designed and built in Nashville, TN, this stave snare drum is a testament to the artistry and dedication behind every Ober Artisan Drum. Each stave is meticulously hand-tuned using an exclusive torch tuning process, bringing out the natural resonance and warmth of the wood while enhancing its striking scorched finish. Available in multiple stave configurations and carefully selected Oak, the HERITAGE Series delivers a dynamic response, crisp attack, and balanced tonal complexity.",
    image: "/artisan-shop/heritage-left.png",
    cta: "Pre-Order Now",
    route: "/artisanseries/heritage",
  },
  {
    id: "feuzon",
    logo: "/v2logo-large/feuzon-white.png",
    quote: "“Blending tradition and innovation into one harmonious voice.”",
    description:
      "The FEUZØN Series is a revolutionary hybrid snare drum that fuses the precision of stave construction with the controlled resonance of a steam bent outer shell. This innovative design enhances warmth, articulation, and dynamic response, offering a snare drum unlike any other. Each drum is torch-tuned to refine its sonic character, bringing out the rich harmonics and bold presence that drummers crave.",
    image: "/artisan-shop/feuzon-right.png",
    cta: "Pre-Order Now",
    route: "/artisanseries/feuzon",
  },
  {
    id: "soundlegend",
    logo: "/v2logo-large/soundlegend-white.png",
    quote: "“Every drum tells a story — let’s craft yours together.”",
    description:
      "The SoundLegend Series is more than just a drum — it’s an experience. Designed for drummers who want to collaborate directly with a master artisan, this fully custom shop offering gives you the freedom to explore new sonic possibilities. Through a hands-on process that includes consultation calls, high-resolution concept renders, and build updates, you’ll watch your dream snare drum take shape before your eyes.",
    image: "/artisan-shop/soundlegend-left.png",
    cta: "Begin the Journey",
    route: "/soundlegend",
  },
];

const OurCraft = () => {
  const navigate = useNavigate();

  const values = [
    { label: "Intentional Design", description: "Every element is shaped with care — never mass-produced, never rushed. A drum that begins with purpose ends with personality." },
    { label: "Torch-Tuned Shells", description: "Using controlled flame, we refine the wood’s voice — not to impose a tone, but to reveal its natural resonance." },
    { label: "Sound First", description: "We build to serve the drummer’s voice — to translate emotion into tone, not just decibels into air." },
    { label: "Handcrafted Connection", description: "Your drum is made by real hands. The same ones that listen, adjust, and shape until it feels alive." },
    { label: "Precision & Feel", description: "Measurements matter, but soul matters more. We build with both." },
  ];

  const [hoveredValue, setHoveredValue] = useState(0);

  return (
    <div className="ourcraft-container">
      <section className="ourcraft-section craft-hero-section">
        <div className="craft-hero-overlay">
          <h1>Our Craft</h1>
          <p>Where timeless sound meets modern soul</p>
          <div className="scroll-indicator">↓ Scroll to explore</div>
        </div>
      </section>

      <section className="ourcraft-section story-section">
        <div className="story-inner">
          <h2>The Story Behind the Sound</h2>
          <p>
            Ober Artisan Drums is a boundary-pushing instrument company born from a deep reverence for sonic detail, craftsmanship, and individuality. Based in Nashville, Tennessee, each drum is designed and handcrafted to serve not just as a percussive tool — but as a meaningful extension of the artist behind it.
          </p>
          <p>
            Every shell is engineered with intention. These are not mass-produced instruments. They are built for drummers who demand more — more character, more clarity, more connection to their sound.
          </p>
          <p>
            Founder Dan Ober studied Film Scoring and Composition at Berklee College of Music and trained under industry legends like Mike Mangini. With 30+ years behind the kit, he brings a rare background in sound design, engineering, and instrument building to every drum.
          </p>
        </div>
      </section>

      <section className="ourcraft-section philosophy-section">
        <div className="philosophy-inner">
          <h2>Philosophy of Craft</h2>
          <p>
            A drum doesn’t need to be told what to be — it needs to be listened to.
          </p>
          <p>
            Torch-tuning isn’t about forcing sound into the shell. It’s about drawing it out — coaxing the natural voice that already lives inside the wood. Like a master barista knowing when the roast is just right, or a luthier tapping a violin top to find its resonance, there’s a moment where the shell says, “now I’m ready.”
          </p>
          <p className="quote">“If it bears the Ober name, it has to speak with truth.”</p>

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
        </div>
      </section>

      <section className="ourcraft-section artisan-intro-section">
  <div className="artisan-intro-inner">
    <h2>Founding Artisan Line</h2>
    <p className="artisan-tagline">“Every journey begins with a single voice.”</p>
    <p className="artisan-intro-paragraph">
      Before there was a name, before there was a brand — there was one drum. Built by hand in a quiet workshop
      late at night. Not to prove anything, but to explore a question: <em>what does it mean to build with soul?</em>
    </p>
    <p className="artisan-intro-paragraph">
      That first drum sparked a path that would shape the heart of Ober Artisan Drums. A foundation built on fire,
      intuition, and relentless curiosity. One voice. One vision. And soon — a legacy.
    </p>
    <p className="artisan-intro-tagline">The drum that started it all is just ahead.</p>
  </div>
</section>

<section className="ourcraft-section heritage-reveal-section">
  <div className="heritage-grid">
    <div className="heritage-image-wrapper">
      <img src="/artisan-shop/heritage-left.png" alt="Heritage Drum" className="heritage-drum-img" />
    </div>
    <div className="heritage-text">
      <img src="/v2logo-large/heritage-white.png" alt="Heritage Logo" className="heritage-logo" />
      <p className="heritage-quote">“The drum that started it all — classic craftsmanship, timeless sound.”</p>
      <p className="heritage-description">
        The <strong>HERITAGE</strong> Series was the first drum ever built under the Ober name — born from fire,
        intuition, and relentless pursuit of tone. Crafted in Nashville, TN, it embodies everything we stand for:
        pure resonance, hand-sculpted form, and sonic soul.
      </p>
      <p className="heritage-description">
        Each shell is meticulously torch-tuned to unlock the wood’s natural voice, then finished by hand with a
        signature scorched aesthetic. Built for drummers who demand character, feel, and musical depth.
      </p>
      <button className="heritage-button" onClick={() => navigate("/artisanseries/heritage")}>
        Pre-Order Heritage
      </button>
    </div>
  </div>
</section>

<section className="feuzon-reveal-section">
  <div className="feuzon-grid">
    <div className="feuzon-text">
      <img src="/resized-logos/feuzon-white.png" alt="Feuzon Logo" className="feuzon-logo" />
      <p className="feuzon-quote">“Blending tradition and innovation into one harmonious voice.”</p>
      <p className="feuzon-description">
        The FEUZØN Series is a revolutionary hybrid snare drum that fuses the precision of stave
        construction with the controlled resonance of a steam bent outer shell. This innovative design
        enhances warmth, articulation, and dynamic response, offering a snare drum unlike any other.
        Each drum is torch-tuned to refine its sonic character, bringing out the rich harmonics and bold
        presence that drummers crave.
      </p>
      <button className="feuzon-button" onClick={() => navigate("/artisanseries/feuzon")}>
        Pre-Order Now
      </button>
    </div>
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
    <div className="soundlegend-image-wrapper">
      <img
        src="/artisan-shop/soundlegend-left.png"
        alt="SoundLegend Drum"
        className="soundlegend-drum-img"
      />
    </div>
    <div className="soundlegend-text">
      <img src="/resized-logos/soundlegend-white.png" alt="SoundLegend Logo" className="soundlegend-logo" />
      <p className="soundlegend-quote">“Every drum tells a story — let’s craft yours together.”</p>
      <p className="soundlegend-description">
        The SoundLegend Series isn’t a product — it’s a collaboration. For drummers ready to go deeper,
        this series is your canvas. We start with your vision and walk every step of the build together,
        from material selection to tonal shaping and final delivery. You'll receive concept mockups,
        progress updates, and a drum that speaks your voice. 
      </p>
      <button className="soundlegend-button" onClick={() => navigate("/artisan-shop/soundlegend")}>
        Begin the Journey
      </button>
    </div>
  </div>
</section>

      <section className="sticky-drum-display-wrapper">
        <div className="sticky-drum-display-inner">
          <OurCraftDrumDisplay />
        </div>
      </section>
    </div>
  );
};

export default OurCraft;
