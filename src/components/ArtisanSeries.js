import React, { useState, useContext, useEffect, useRef } from "react";
import "./ArtisanSeries.css";
import { DarkModeContext } from "../context/DarkModeContext";

const DRUM_SERIES = [
  {
    id: "heritage",
    name: "HERITAGE",
    logo: "/resized-logos/heritage-white.png",
    overlay: "/artisanseries-bottom-layers/top-layer-left-drum-highlighted.png",
    quote: "“The drum that started it all—classic craftsmanship, timeless sound.”",
    description:
      "The HERITAGE Series embodies the soul of hand-crafted percussion. Designed and built in Nashville, TN, this stave snare drum is a testament to the artistry and dedication behind every Ober Artisan Drum...",
    specs: [
      "Shell Construction: Stave",
      "Available Sizes: 12”, 13”, 14”",
      "Finish: Light gloss, Medium gloss, Torch-scorched aesthetic",
      "Wood Selection: Northern Red Oak",
    ],
    images: [/* ... */],
    audioSamples: [/* ... */],
  },
  {
    id: "soundlegend",
    name: "SOUNDLEGEND",
    logo: "/resized-logos/soundlegend-white.png",
    overlay: "/artisanseries-bottom-layers/top-layer-middle-drum-highlighted.png",
    quote: "“Every drum tells a story—let’s craft yours together.”",
    description: "The SoundLegend Series is more than just a drum—it’s an experience...",
    specs: [/* ... */],
    images: [],
    audioSamples: [],
  },
  {
    id: "feuzon",
    name: "FEUZØN",
    logo: "/resized-logos/feuzon-white.png",
    overlay: "/artisanseries-bottom-layers/top-layer-right-drum-highlighted.png",
    quote: "“Blending tradition and innovation into one harmonious voice.”",
    description: "The FEUZØN Series is a revolutionary hybrid snare drum...",
    specs: [/* ... */],
    images: [],
    audioSamples: [],
  },
];

const ArtisanSeries = () => {
  const { isDarkMode } = useContext(DarkModeContext);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [zoomed, setZoomed] = useState(false);
  const [isTriggerActive, setIsTriggerActive] = useState(false);
  const [isFinalSectionVisible, setFinalSectionVisible] = useState(false);
  const [isFading, setIsFading] = useState(false);

  const footerRef = useRef(null);
  const finalSectionRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  const displayedIndex = hoverIndex !== null ? hoverIndex : activeIndex;
  const active = DRUM_SERIES[displayedIndex];

  const handleDrumSwitch = (index) => {
    if (index === activeIndex) return;
    setIsFading(true);
    setTimeout(() => {
      setActiveIndex(index);
      setIsFading(false);
    }, 300);
  };

  const handleHover = (index) => {
    if (index === activeIndex) return;
    setHoverIndex(index);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveIndex(index);
      setHoverIndex(null); // disables further hover previews
    }, 500);
  };

  const clearHover = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoverIndex(null);
  };

  useEffect(() => {
    const observer1 = new IntersectionObserver(
      ([entry]) => setIsTriggerActive(entry.isIntersecting),
      { threshold: 0.5 }
    );
    const observer2 = new IntersectionObserver(
      ([entry]) => setFinalSectionVisible(entry.isIntersecting),
      { threshold: 0.4 }
    );

    if (footerRef.current) observer1.observe(footerRef.current);
    if (finalSectionRef.current) observer2.observe(finalSectionRef.current);

    return () => {
      observer1.disconnect();
      observer2.disconnect();
    };
  }, []);

  const overlayImage = isFinalSectionVisible
    ? "/artisanseries-bottom-layers/top-layer-alldrums-color.png"
    : DRUM_SERIES[hoverIndex ?? activeIndex]?.overlay;

  return (
    <>
      <div className="artisanseries-container">
        {/* Sticky logo + fade */}
        <div className={`logo-single-wrapper sticky-logo-wrapper fade-transition ${isFading ? "fade-out" : ""}`}>
          <img src={active.logo} alt={active.name} className="artisanseries-header-image" />
        </div>

        {/* Drum content */}
        <div className={`drum-display fade-transition ${isFading ? "fade-out" : ""}`}>
          <div className="text-layer">
            <p className="description"><strong>{active.quote}</strong></p>
            <p className="description">{active.description}</p>

            <div className="features-audio-wrapper">
              <div className="key-features">
                <h3>Key Features</h3>
                <ul className="description-list">
                  {active.specs.map((line, i) => <li key={i}>{line}</li>)}
                </ul>
              </div>

              {active.audioSamples?.length > 0 && (
                <div className="audio-box">
                  <h4>Audio Sample</h4>
                  {active.audioSamples.map((sample, i) => (
                    <div className="audio-sample-item" key={i}>
                      <button onClick={() => new Audio(sample.url).play()}>▶</button>
                      <span>{sample.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {active.images?.length > 0 && (
              <div className="gallery-strip">
                {active.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`Drum ${i}`}
                    onClick={() => setLightboxIndex(i)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom overlays */}
        <div className={`drum-layers ${isTriggerActive ? "scrolling" : "fixed"}`}>
          <img src="/artisanseries-bottom-layers/base-layer-bottom.png" className="layer" alt="base-bottom" />
          <img src="/artisanseries-bottom-layers/base-layer-front.png" className="layer" alt="base-front" />
          <img key={overlayImage} src={overlayImage} className="layer fade-transition" alt="overlay" />
          <div className="drum-click-zones">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`zone zone-${i}`}
                onMouseEnter={() => handleHover(i)}
                onMouseLeave={clearHover}
                onClick={() => handleDrumSwitch(i)}
              />
            ))}
          </div>
        </div>

        <div ref={footerRef} className="footer-trigger-marker" />

        {/* Final Section */}
        <div className="drum-final-text-section" ref={finalSectionRef}>
          {DRUM_SERIES.map((drum) => (
            <div className="drum-final-card" key={drum.id}>
              <img src={`/resized-logos/${drum.id}-white.png`} alt={drum.name} className="final-logo" />
              <ul className="description-list">
                {drum.specs.map((line, i) => <li key={i}>{line}</li>)}
              </ul>
              <a
                href={`/products/${drum.id}`}
                className={drum.id === "soundlegend" ? "learn-more-button" : "preorder-card-preorder-button"}
              >
                {drum.id === "soundlegend" ? "Learn More" : "Pre-Order Now"}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div className={`lightbox ${zoomed ? "zoomed" : ""}`} onClick={() => setLightboxIndex(null)}>
          <button className="lightbox-close" onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}>×</button>
          <button className="lightbox-arrow left" onClick={(e) => {
            e.stopPropagation();
            setLightboxIndex((lightboxIndex - 1 + active.images.length) % active.images.length);
          }}>‹</button>
          <div className="lightbox-image-container">
            <img
              ref={lightboxImgRef}
              src={active.images[lightboxIndex]}
              alt={`Zoomed ${lightboxIndex}`}
              onDoubleClick={(e) => { e.stopPropagation(); setZoomed(!zoomed); }}
              draggable="false"
            />
          </div>
          <button className="lightbox-arrow right" onClick={(e) => {
            e.stopPropagation();
            setLightboxIndex((lightboxIndex + 1) % active.images.length);
          }}>›</button>
        </div>
      )}
    </>
  );
};

export default ArtisanSeries;