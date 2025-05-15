import React, { useState, useEffect, useRef } from 'react';
import './OurCraft.css';
import { useNavigate } from 'react-router-dom';
import OurCraftDrumDisplay from './OurCraftDrumDisplay';
import { Flame, Hammer, Ear, Hand, Ruler } from 'lucide-react';

const drumSeries = [
  {
    id: 'heritage',
    logo: '/v2logo-large/heritage-white.png',
    quote:
      '“The drum that started it all—classic craftsmanship, timeless sound.”',
    description:
      'The HERITAGE Series embodies the soul of hand-crafted percussion. Designed and built in Nashville, TN, this stave snare drum is a testament to the artistry and dedication behind every Ober Artisan Drum. Each stave is meticulously hand-tuned using an exclusive torch tuning process, bringing out the natural resonance and warmth of the wood while enhancing its striking scorched finish. Available in multiple stave configurations and carefully selected Oak, the HERITAGE Series delivers a dynamic response, crisp attack, and balanced tonal complexity.',
    image: '/artisan-shop/heritage-left.png',
    cta: 'Pre-Order Now',
    route: '/artisanseries/heritage',
  },
  {
    id: 'feuzon',
    logo: '/v2logo-large/feuzon-white.png',
    quote: '“Blending tradition and innovation into one harmonious voice.”',
    description:
      'The FEUZØN Series is a revolutionary hybrid snare drum that fuses the precision of stave construction with the controlled resonance of a steam bent outer shell. This innovative design enhances warmth, articulation, and dynamic response, offering a snare drum unlike any other. Each drum is torch-tuned to refine its sonic character, bringing out the rich harmonics and bold presence that drummers crave.',
    image: '/artisan-shop/feuzon-right.png',
    cta: 'Pre-Order Now',
    route: '/artisanseries/feuzon',
  },
  {
    id: 'soundlegend',
    logo: '/v2logo-large/soundlegend-white.png',
    quote: '“Every drum tells a story — let’s craft yours together.”',
    description:
      'The SoundLegend Series is more than just a drum — it’s an experience. Designed for drummers who want to collaborate directly with a master artisan, this fully custom shop offering gives you the freedom to explore new sonic possibilities. Through a hands-on process that includes consultation calls, high-resolution concept renders, and build updates, you’ll watch your dream snare drum take shape before your eyes.',
    image: '/artisan-shop/soundlegend-left.png',
    cta: 'Begin the Journey',
    route: '/soundlegend',
  },
];

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

  const heroRef = useRef();
const stickyMiniRef = useRef();

useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (stickyMiniRef.current) {
        if (!entry.isIntersecting) {
          stickyMiniRef.current.classList.add('show-sticky-mini');
        } else {
          stickyMiniRef.current.classList.remove('show-sticky-mini');
        }
      }
    },
    { threshold: 0.25 }
  );

  if (heroRef.current) observer.observe(heroRef.current);
  return () => {
    if (heroRef.current) observer.unobserve(heroRef.current);
  };
}, []);

return (
    <>
      <div ref={stickyMiniRef} className="navbar-sticky-mini" style={{ display: 'none' }}>
        <img src="/logo/ober-icon-white.png" className="sticky-logo-img" alt="Mini Logo" />
      </div>
  
      <div className="ourcraft-container">
        <section ref={heroRef} className="ourcraft-section craft-hero-section">
          <div className="craft-hero-overlay">
            <h1>Our Craft</h1>
            <p>Where timeless sound meets modern soul</p>
  
            <p>
              Ober Artisan Drums is a boundary-pushing instrument company rooted in sonic detail,
              craftsmanship, and individuality. Based in Nashville, every drum is handcrafted to serve
              as a meaningful extension of the artist behind it.
            </p>
            <p>
              These are not mass-produced instruments — they’re built for drummers who demand more:
              more character, more clarity, and more connection to their sound.
            </p>
            <p>
              Founder Dan Ober studied Film Scoring at Berklee and trained under legends like Mike
              Mangini. With 30+ years behind the kit, he brings a unique blend of sound design,
              engineering, and soul to every build.
            </p>
  
            <div className="scroll-indicator">↓ Scroll to explore</div>
          </div>
        </section>
  
        <section className="ourcraft-section philosophy-section">
          <div className="philosophy-inner">
            <h2>Philosophy of Craft</h2>
            <p>A drum doesn’t need to be told what to be — it needs to be listened to.</p>
            <p>
              Torch-tuning isn’t about forcing sound into the shell. It’s about drawing it out —
              coaxing the natural voice that already lives inside the wood. Like a master barista
              knowing when the roast is just right, or a luthier tapping a violin top to find its
              resonance, there’s a moment where the shell says, “now I’m ready.”
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
              Before there was a name, before there was a brand — there was one drum. Built by hand in
              a quiet workshop late at night. Not to prove anything, but to explore a question:{' '}
              <em>what does it mean to build with soul?</em>
            </p>
            <p className="artisan-intro-paragraph">
              That first drum sparked a path that would shape the heart of Ober Artisan Drums. A
              foundation built on fire, intuition, and relentless curiosity. One voice. One vision. And
              soon — a legacy.
            </p>
            <p className="artisan-intro-tagline">The drum that started it all is just ahead.</p>
          </div>
        </section>
  
        <section className="ourcraft-section">
          <OurCraftDrumDisplay />
        </section>
      </div>
    </>
  );
};

export default OurCraft;
