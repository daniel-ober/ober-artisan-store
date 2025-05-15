import React, { useState, useEffect, useRef } from "react";
import "./OurCraftDrumDisplay.css";
import { useNavigate } from "react-router-dom";

const DRUM_SERIES = [
  {
    id: "heritage",
    name: "HERITAGE",
    logo: "/resized-logos/heritage-white.png",
    overlay: "/artisanseries-bottom-layers/top-layer-left-drum-highlighted.png",
    quote: "\u201cThe drum that started it all\u2014classic craftsmanship, timeless sound.\u201d",
    description:
      "The HERITAGE Series embodies the soul of hand-crafted percussion. Each stave is meticulously hand-tuned using an exclusive torch tuning process, bringing out natural resonance and warmth while enhancing a striking scorched finish.",
    route: "/artisanseries/heritage",
    cta: "Pre-Order Now",
  },
  {
    id: "soundlegend",
    name: "SOUNDLEGEND",
    logo: "/resized-logos/soundlegend-white.png",
    overlay: "/artisanseries-bottom-layers/top-layer-middle-drum-highlighted.png",
    quote: "\u201cEvery drum tells a story \u2014 let\u2019s craft yours together.\u201d",
    description:
      "The SoundLegend Series is more than just a drum \u2014 it\u2019s a collaborative experience. From concept to creation, you\u2019re part of the journey.",
    route: "/soundlegend",
    cta: "Learn More",
  },
  {
    id: "feuzon",
    name: "FEUZ\u00d8N",
    logo: "/resized-logos/feuzon-white.png",
    overlay: "/artisanseries-bottom-layers/top-layer-right-drum-highlighted.png",
    quote: "\u201cBlending tradition and innovation into one harmonious voice.\u201d",
    description:
      "The FEUZ\u00d8N Series fuses stave construction with a steam-bent outer shell for warm, articulate, and bold tone. Torch-tuned for harmonic richness.",
    route: "/artisanseries/feuzon",
    cta: "Pre-Order Now",
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
    <section className="ourcraft-drum-interactive-section">
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

      <div className="ourcraft-drum-layers">
        <img
          src="/artisanseries-bottom-layers/base-layer-bottom.png"
          className="layer"
          alt="base bottom"
        />
        <img
          src="/artisanseries-bottom-layers/base-layer-front.png"
          className="layer"
          alt="base front"
        />
        <img
          src={overlayImage}
          className={`layer overlay ${isFading ? "fade-out" : "fade-in"}`}
          alt="overlay"
        />
        <img
          src="/artisanseries-bottom-layers/top-layer-alldrums-color.png"
          className="layer top-fade"
          alt="top color"
        />

        <div className="ourcraft-drum-zones">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`zone zone-${i}`}
              onClick={() => handleDrumSwitch(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default OurCraftDrumDisplay;
