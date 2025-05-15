import React, { useState } from 'react';
import './OurCraftDrumDisplay.css';
import { useNavigate } from 'react-router-dom';

const DRUM_SERIES = [
  {
    id: 'heritage',
    name: 'HERITAGE',
    logo: '/resized-logos/heritage-white.png',
    overlay: '/artisanseries-bottom-layers/top-layer-left-drum-highlighted.png',
    quote: '“The drum that started it all—classic craftsmanship, timeless sound.”',
    description: 'The HERITAGE Series embodies the soul of hand-crafted percussion. Each stave is meticulously hand-tuned using an exclusive torch tuning process, bringing out natural resonance and warmth while enhancing a striking scorched finish.',
    route: '/artisanseries/heritage',
    cta: 'Pre-Order Now',
  },
  {
    id: 'soundlegend',
    name: 'SOUNDLEGEND',
    logo: '/resized-logos/soundlegend-white.png',
    overlay: '/artisanseries-bottom-layers/top-layer-middle-drum-highlighted.png',
    quote: '“Every drum tells a story — let’s craft yours together.”',
    description: 'The SoundLegend Series is more than just a drum — it’s a collaborative experience. From concept to creation, you’re part of the journey.',
    route: '/soundlegend',
    cta: 'Learn More',
  },
  {
    id: 'feuzon',
    name: 'FEUZØN',
    logo: '/resized-logos/feuzon-white.png',
    overlay: '/artisanseries-bottom-layers/top-layer-right-drum-highlighted.png',
    quote: '“Blending tradition and innovation into one harmonious voice.”',
    description: 'The FEUZØN Series fuses stave construction with a steam-bent outer shell for warm, articulate, and bold tone. Torch-tuned for harmonic richness.',
    route: '/artisanseries/feuzon',
    cta: 'Pre-Order Now',
  },
];

const OurCraftDrumDisplay = () => {
  const [activeIndex, setActiveIndex] = useState(1);
  const [overlayImage, setOverlayImage] = useState(DRUM_SERIES[1].overlay);
  const [isFading, setIsFading] = useState(false);
  const navigate = useNavigate();

  const handleDrumSwitch = (index) => {
    if (index === activeIndex) return;
    setIsFading(true);
    setTimeout(() => {
      setOverlayImage(DRUM_SERIES[index].overlay);
      setActiveIndex(index);
      setIsFading(false);
    }, 300);
  };

  return (
    <div className="ourcraft-drum-interactive-section">
      <h2 className="drum-comparison-heading">Our Founding Line</h2>

      <div className="drum-upper-content">
        <div className="ourcraft-drum-cta-row">
          {DRUM_SERIES.map((drum, i) => (
            <div key={drum.id} className={`drum-cta drum-cta-${i}`}>
              <img src={drum.logo} alt={`${drum.name} logo`} className="drum-cta-logo" />
              <p className="drum-cta-quote">{drum.quote}</p>
              <button className="drum-cta-button" onClick={() => navigate(drum.route)}>
                {drum.cta}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="ourcraft-drum-layers">
        <img src="/artisanseries-bottom-layers/base-layer-bottom.png" className="layer" alt="base bottom" />
        <img src="/artisanseries-bottom-layers/base-layer-front.png" className="layer" alt="base front" />
        <img src={overlayImage} className={`layer overlay ${isFading ? 'fade-out' : 'fade-in'}`} alt="overlay" />
        <img src="/artisanseries-bottom-layers/top-layer-alldrums-color.png" className="layer top-fade" alt="top color" />
        <div className="ourcraft-drum-zones">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`zone zone-${i}`} onClick={() => handleDrumSwitch(i)} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OurCraftDrumDisplay;