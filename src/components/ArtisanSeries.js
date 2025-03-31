import React, { useState, useContext, useEffect, useRef } from 'react';
import './ArtisanSeries.css';
import { DarkModeContext } from '../context/DarkModeContext';
import { useNavigate } from 'react-router-dom';

const DRUM_SERIES = [
  {
    id: 'heritage',
    name: 'HERITAGE',
    logo: '/resized-logos/heritage-white.png',
    overlay: '/artisanseries-bottom-layers/top-layer-left-drum-highlighted.png',
    quote: '“The drum that started it all—classic craftsmanship, timeless sound.”',
    description:
      'The HERITAGE Series embodies the soul of hand-crafted percussion. Designed and built in Nashville, TN, this stave snare drum is a testament to the artistry and dedication behind every Ober Artisan Drum. Each stave is meticulously hand-tuned using an exclusive torch tuning process, bringing out the natural resonance and warmth of the wood while enhancing its striking scorched finish. Available in multiple stave configurations and carefully selected Oak, the HERITAGE Series delivers a dynamic response, crisp attack, and balanced tonal complexity.',
    specs: [],
    images: [
      '/artisan-shop/heritage-left.png'
    ],
    audioSamples: [],
  },
  {
    id: 'soundlegend',
    name: 'SOUNDLEGEND',
    logo: '/resized-logos/soundlegend-white.png',
    overlay: '/artisanseries-bottom-layers/top-layer-middle-drum-highlighted.png',
    quote: '“Every drum tells a story—let’s craft yours together.”',
    description:
      'The SoundLegend Series is more than just a drum—it’s an experience. Designed for drummers who want to collaborate directly with a master artisan, this fully custom shop offering gives you the freedom to explore new sonic possibilities. Through a hands-on process that includes consultation calls, high-resolution concept renders, and build updates, you’ll watch your dream snare drum take shape before your eyes.',
    specs: [],
    images: [
      '/artisan-shop/soundlegend-left.png'
    ],
    // videoUrl: 'https://www.youtube.com/embed/PW28PjMCpxg?rel=0&vq=hd2160',
    audioSamples: [],
  },
  {
    id: 'feuzon',
    name: 'FEUZØN',
    logo: '/resized-logos/feuzon-white.png',
    overlay: '/artisanseries-bottom-layers/top-layer-right-drum-highlighted.png',
    quote: '“Blending tradition and innovation into one harmonious voice.”',
    description:
      'The FEUZØN Series is a revolutionary hybrid snare drum that fuses the precision of stave construction with the controlled resonance of a steam bent outer shell. This innovative design enhances warmth, articulation, and dynamic response, offering a snare drum unlike any other. Each drum is torch-tuned to refine its sonic character, bringing out the rich harmonics and bold presence that drummers crave.',
    specs: [],
    images: [
      '/artisan-shop/feuzon-right.png'
    ],
    audioSamples: [],
  },
];

const ArtisanSeries = () => {
  const { isDarkMode } = useContext(DarkModeContext);
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(1);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [isFading, setIsFading] = useState(false);
  const [isOverlayFading, setIsOverlayFading] = useState(false);
  const [previousOverlay, setPreviousOverlay] = useState(null);
  const [overlayImage, setOverlayImage] = useState(DRUM_SERIES[1].overlay);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [zoomed, setZoomed] = useState(false);
  const [isTriggerActive, setIsTriggerActive] = useState(false);
  const [isFinalSectionVisible, setFinalSectionVisible] = useState(false);
  const [finalOverlayOpacity, setFinalOverlayOpacity] = useState(0);

  const hoverTimeoutRef = useRef(null);
  const footerRef = useRef(null);
  const finalSectionRef = useRef(null);
  const product = { currentQuantity: 1 };
  const preOrderButton = "Pre-Order Now";

  const active = DRUM_SERIES[activeIndex];

  const startFade = (newOverlay) => {
    setPreviousOverlay(overlayImage);
    setOverlayImage(newOverlay);
    setIsOverlayFading(true);
    setIsFading(true);
    setTimeout(() => {
      setIsOverlayFading(false);
      setIsFading(false);
    }, 600);
  };
  

  useEffect(() => {
    const galleryObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            galleryObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -20% 0px', threshold: 0.2 }
    );

    const images = document.querySelectorAll('.gallery-strip img');
    images.forEach((img) => galleryObserver.observe(img));
    return () => galleryObserver.disconnect();
  }, [activeIndex]);

  const handleHover = (index) => {
    if (index === activeIndex) return;
    startFade(DRUM_SERIES[index].overlay);
    setHoverIndex(index);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveIndex(index);
      setHoverIndex(null);
    }, 0);
  };

  const clearHover = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoverIndex(null);
  };

  const handleDrumSwitch = (index) => {
    if (index === activeIndex) return;
    setActiveIndex(index);
    setHoverIndex(null);
    setPreviousOverlay(null);
    setOverlayImage(DRUM_SERIES[index].overlay);
    setIsOverlayFading(false);
    setIsFading(false);
  };

  useEffect(() => {
    const triggerObserver = new IntersectionObserver(
      ([entry]) => setIsTriggerActive(entry.isIntersecting),
      { threshold: 0.5 }
    );
    const finalObserver = new IntersectionObserver(
      ([entry]) => setFinalSectionVisible(entry.isIntersecting),
      { threshold: 0.4 }
    );
    if (footerRef.current) triggerObserver.observe(footerRef.current);
    if (finalSectionRef.current) finalObserver.observe(finalSectionRef.current);
    return () => {
      triggerObserver.disconnect();
      finalObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const ratio = entry.intersectionRatio;
        const clamped = ratio >= 0.95 ? 1 : ratio <= 0.05 ? 0 : ratio;
        setFinalOverlayOpacity(clamped);
      },
      {
        threshold: Array.from({ length: 21 }, (_, i) => i * 0.05),
      }
    );
    if (finalSectionRef.current) observer.observe(finalSectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="artisanseries-container">
      <div className={`logo-single-wrapper sticky-logo-wrapper fade-transition ${isFading ? 'fade-out' : ''}`}>
        <img src={active.logo} alt={active.name} className="artisanseries-header-image" />
      </div>

      <div className={`drum-display fade-transition ${isFading ? 'fade-out' : ''}`}>
        <div className="text-layer">
          <p className="description"><strong>{active.quote}</strong></p>
          <p className="description">{active.description}</p>

          {/* {active.id === 'soundlegend' && (
            <div className="soundlegend-video-wrapper">
              <iframe
                src={active.videoUrl}
                title="SoundLegend Demo"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
          )} */}

          {active.images?.length > 0 && (
            <div className="gallery-strip">
              {active.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`${active.name} gallery ${idx + 1}`}
                  className="gallery-image fade-lazy"
                  loading="lazy"
                  onClick={() => {
                    setLightboxIndex(idx);
                    setZoomed(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {!isTriggerActive && <div className="drum-layers-spacer" />}
      <div className={`drum-layers ${isTriggerActive ? 'scrolling' : 'fixed'}`}>
        <img src="/artisanseries-bottom-layers/base-layer-bottom.png" className="layer" />
        <img src="/artisanseries-bottom-layers/base-layer-front.png" className="layer" />
        <img src={overlayImage} className="layer overlay-image" style={{ opacity: 1 - finalOverlayOpacity }} />
        <img src="/artisanseries-bottom-layers/top-layer-alldrums-color.png" className="layer overlay-image" style={{ opacity: finalOverlayOpacity }} />
        <div className="drum-click-zones">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`zone zone-${i}`} onMouseEnter={() => handleHover(i)} onMouseLeave={clearHover} onClick={() => handleDrumSwitch(i)} />
          ))}
        </div>
      </div>

      <div ref={footerRef} className="footer-trigger-marker" />

      {/* ✅ Final Section: Your layout */}
      <div className="drum-final-text" ref={finalSectionRef}>
        {/* HERITAGE */}
        <div className="drum-info">
          <img src="/v2logo-large/heritage-white.png" alt="Heritage" className="drum-logo" />
          {/* <ul className="description-list">
            <li>Stave Construction</li>
            <li>Wood Selection: Northern Red Oak</li>
            <li>Available Sizes: 12”, 13”, 14”</li>
            <li>Torch-scorched aesthetic</li>
          </ul> */}
          <button
            className={product.currentQuantity === 0 ? "prod-card-view-details-button" : "preorder-card-preorder-button"}
            onClick={() => navigate("/products/heritage")}
          >
            {preOrderButton}
          </button>
        </div>

        {/* SOUNDLEGEND */}
        <div className="drum-info">
          <img src="/v2logo-large/soundlegend-white.png" alt="SoundLegend" className="drum-logo" />
          {/* <ul className="description-list">
            <li>Various Shell Consttruction Options</li>
            <li>Fully Customizable: Size, Lugs, Finish, Wood</li>
            <li>Direct Collaboration with Artisan, Dan Ober</li>
            <li>SoundLegend Journey Web Access</li>
            <li>High Resolution Concept Renders</li>
            <li>Limited Edition Gift Item and more!</li>
          </ul> */}
          <button
            className={product.currentQuantity === 0 ? "prod-card-view-details-button" : "preorder-card-preorder-button"}
            onClick={() => navigate("/products/soundlegend")}
          >
            Learn More
          </button>
        </div>

        {/* FEUZØN */}
        <div className="drum-info">
          <img src="/v2logo-large/feuzon-white.png" alt="Feuzon" className="drum-logo" />
          {/* <ul className="description-list">
            <li>Hybrid Shell Construction</li>
            <li>Various Wood Combinations Available</li>
            <li>Available Sizes: 12”, 13”, 14”</li>
            <li>Torch-tuned to perfection</li>
          </ul> */}
          <button
            className={product.currentQuantity === 0 ? "prod-card-view-details-button" : "preorder-card-preorder-button"}
            onClick={() => navigate("/products/feuzon")}
          >
            {preOrderButton}
          </button>
        </div>
      </div>

      {lightboxIndex !== null && (
        <div className={`lightbox ${zoomed ? 'zoomed' : ''}`} onClick={() => setLightboxIndex(null)}>
          <button className="lightbox-close" onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}>×</button>
          <button className="lightbox-arrow left" onClick={(e) => { e.stopPropagation(); setLightboxIndex((prev) => prev === 0 ? active.images.length - 1 : prev - 1); }}>‹</button>
          <div className="lightbox-image-container" onClick={(e) => e.stopPropagation()}>
            <img src={active.images[lightboxIndex]} alt={`Zoom ${lightboxIndex + 1}`} onClick={() => setZoomed((z) => !z)} />
          </div>
          <button className="lightbox-arrow right" onClick={(e) => { e.stopPropagation(); setLightboxIndex((prev) => prev === active.images.length - 1 ? 0 : prev + 1); }}>›</button>
        </div>
      )}
    </div>
  );
};

export default ArtisanSeries;