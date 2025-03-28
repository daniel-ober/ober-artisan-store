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
      "The HERITAGE Series embodies the soul of hand-crafted percussion. Designed and built in Nashville, TN, this stave snare drum is a testament to the artistry and dedication behind every Ober Artisan Drum. Each stave is meticulously hand-tuned using an exclusive torch tuning process, bringing out the natural resonance and warmth of the wood while enhancing its striking scorched finish. Available in multiple stave configurations and carefully selected Oak, the HERITAGE Series delivers a dynamic response, crisp attack, and balanced tonal complexity.",
    specs: [
      "Shell Construction: Stave",
      "Available Sizes: 12”, 13”, 14”",
      "Finish: Light gloss, Medium gloss, Torch-scorched aesthetic",
      "Wood Selection: Northern Red Oak",
    ],
    images: [
      "https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/artisan%2Fheritage%2F14x6.20-stave%2Fimages%2FIMG_6123.png?alt=media&token=9511873e-1ccb-43cb-9e91-1494c2f09f9b",
      "https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/artisan%2Fheritage%2F14x6.20-stave%2Fimages%2FIMG_9087.jpeg?alt=media&token=056bcb03-b839-43ce-815e-46b1c26d16c5",
    ],
    audioSamples: [
      {
        name: "Dry Hit - Snares On",
        url: "https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/artisan%2Fheritage%2F14x6.20-stave%2Fwave%2FIMG_5847.78.wav?alt=media&token=5399e30f-d688-4837-bd13-fb3f0cefe6c5",
      },
    ],
  },
  {
    id: "soundlegend",
    name: "SOUNDLEGEND",
    logo: "/resized-logos/soundlegend-white.png",
    overlay: "/artisanseries-bottom-layers/top-layer-middle-drum-highlighted.png",
    quote: "“Every drum tells a story—let’s craft yours together.”",
    description:
      "The SoundLegend Series is more than just a drum—it’s an experience. Designed for drummers who want to collaborate directly with a master artisan, this fully custom shop offering gives you the freedom to explore new sonic possibilities.",
    specs: [
      "Shell Construction: Stave, Steam-Bent, or Hybrid",
      "Fully Customizable: Size, Lugs, Finish, Wood",
      "Hands-on experience: Consultation + Concept Renders",
    ],
    images: [],
    audioSamples: [],
  },
  {
    id: "feuzon",
    name: "FEUZØN",
    logo: "/resized-logos/feuzon-white.png",
    overlay: "/artisanseries-bottom-layers/top-layer-right-drum-highlighted.png",
    quote: "“Blending tradition and innovation into one harmonious voice.”",
    description:
      "The FEUZØN Series is a revolutionary hybrid snare drum that fuses the precision of stave construction with the controlled resonance of a steam bent outer shell. This innovative design enhances warmth, articulation, and dynamic response, offering a snare drum unlike any other.",
    specs: [
      "Shell Construction: Hybrid (Stave + Steam Bent)",
      "Available Sizes: 12”, 13”, 14”",
      "Finish: Natural or Stained",
      "Wood Selection: Stave (varied) + limited steam bent woods",
    ],
    images: [],
    audioSamples: [],
  },
];

const ArtisanSeries = () => {
  const { isDarkMode } = useContext(DarkModeContext);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [zoomed, setZoomed] = useState(false);
  const footerRef = useRef(null);
  const touchStartX = useRef(null);
  const lightboxImgRef = useRef(null);
  const [isFooterVisible, setFooterVisible] = useState(false);

  const active = DRUM_SERIES[activeIndex];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (footerRef.current) observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleTouchEnd = (e) => {
      if (touchStartX.current === null) return;
      const touchEndX = e.changedTouches[0].clientX;
      const deltaX = touchStartX.current - touchEndX;
      if (Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          setActiveIndex((prev) => (prev + 1) % DRUM_SERIES.length);
        } else {
          setActiveIndex((prev) => (prev - 1 + DRUM_SERIES.length) % DRUM_SERIES.length);
        }
      }
      touchStartX.current = null;
    };

    window.addEventListener("touchstart", (e) => {
      touchStartX.current = e.touches[0].clientX;
    });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  const playAudio = (url) => new Audio(url).play();

  return (
    <>
      <div className="artisanseries-container">
        <div className="logo-single-wrapper">
          <img src={active.logo} alt={active.name} className="artisanseries-header-image" />
          <div className="bullet-nav">
          {DRUM_SERIES.map((_, i) => (
            <span
              key={i}
              className={`pagination-dot ${i === activeIndex ? "active" : ""}`}
              onClick={() => setActiveIndex(i)}
            />
          ))}
        </div>        </div>

        <div className="drum-display">
          <div className="text-layer">
            <p className="description"><strong>{active.quote}</strong></p>
            <p className="description">{active.description}</p>

            <div className="features-audio-wrapper">
              <div className="key-features">
                <h3>Key Features</h3>
                <ul className="description-list">
                  {active.specs.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>

              {active.audioSamples?.length > 0 && (
                <div className="audio-box">
                  <h4>Audio Sample</h4>
                  {active.audioSamples.map((sample, i) => (
                    <div className="audio-sample-item" key={i}>
                      <button onClick={() => playAudio(sample.url)}>▶</button>
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

        <div className={`drum-layers ${isFooterVisible ? "scrolling" : "fixed"}`}>
          <img src="/artisanseries-bottom-layers/base-layer-bottom.png" alt="Base Bottom" className="layer" />
          <img src="/artisanseries-bottom-layers/base-layer-front.png" alt="Base Front" className="layer" />
          <img src={active.overlay} alt="Overlay" className="layer" />

          <div className="drum-click-zones">
            <div className="zone" onClick={() => setActiveIndex(0)} />
            <div className="zone" onClick={() => setActiveIndex(1)} />
            <div className="zone" onClick={() => setActiveIndex(2)} />
          </div>
        </div>
      </div>

      {lightboxIndex !== null && (
        <div className={`lightbox ${zoomed ? "zoomed" : ""}`} onClick={() => setLightboxIndex(null)}>
          <button className="lightbox-close" onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}>×</button>
          <button className="lightbox-arrow left" onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + active.images.length) % active.images.length); }}>‹</button>
          <div className="lightbox-image-container">
            <img
              ref={lightboxImgRef}
              src={active.images[lightboxIndex]}
              alt={`Zoomed ${lightboxIndex}`}
              onDoubleClick={(e) => { e.stopPropagation(); setZoomed(!zoomed); }}
              draggable="false"
            />
          </div>
          <button className="lightbox-arrow right" onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % active.images.length); }}>›</button>
        </div>
      )}

      <div ref={footerRef} className="footer-trigger-marker" />
    </>
  );
};

export default ArtisanSeries;