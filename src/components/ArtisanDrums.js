import React, { useState, useContext, useEffect, useRef } from 'react';
import './ArtisanDrums.css';
import { DarkModeContext } from '../context/DarkModeContext';
import { analytics, logEvent } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';

const DRUM_SERIES = [
  {
    id: 'heritage',
    name: 'HERITAGE',
    logo: '/resized-logos/heritage-white.png',
    overlay: '/artisanseries-bottom-layers/top-layer-left-drum-highlighted.png',
    quote:
      '“The drum that started it all—classic craftsmanship, timeless sound.”',
    startingPrice: 'Heritage builds starting at $850',
    description:
      'The HERITAGE Series is a tribute to the roots of handcrafted snare drums—where tradition, tone, and touch converge. Built from select Northern Red Oak using time-honored stave techniques, each drum is torch-tuned to unlock natural warmth and resonance. The scorched finish enhances both sonic depth and visual character. With crisp attack, focused mids, and a balanced low end, the HERITAGE Series delivers timeless tone for drummers who seek legacy in every stroke.',
    specs: [],
    images: ['/artisan-shop/heritage-left.png'],
    audioSamples: [],
  },
  {
    id: 'soundlegend',
    name: 'SOUNDLEGEND',
    logo: '/resized-logos/soundlegend-white.png',
    overlay:
      '/artisanseries-bottom-layers/top-layer-middle-drum-highlighted.png',
    quote: '“Every drum tells a story—let’s craft yours together.”',
    startingPrice: 'Builds starting at $1200',
    description:
      'The SoundLegend Series is more than just a drum—it’s an experience. Designed for drummers who want to collaborate directly with a master artisan, this fully custom shop offering gives you the freedom to explore new sonic possibilities. Through a hands-on process that includes consultation calls, high-resolution concept renders, and live build updates, you’ll watch your dream snare drum take shape before your eyes.',
    specs: [],
    images: ['/artisan-shop/soundlegend-left.png'],
    audioSamples: [],
  },
  {
    id: 'feuzon',
    name: 'FEUZØN',
    logo: '/resized-logos/feuzon-white.png',
    overlay:
      '/artisanseries-bottom-layers/top-layer-right-drum-highlighted.png',
    quote: '“Blending tradition and innovation into one harmonious voice.”',
    startingPrice: 'FEUZØN builds starting at $1050',
    description:
      'The FEUZØN Series is a revolutionary hybrid snare drum that fuses the precision of stave construction with the controlled resonance of a steam bent outer shell. This innovative design enhances warmth, articulation, and dynamic response, offering a snare drum unlike any other. Each drum is torch-tuned to refine its sonic character, bringing out the rich harmonics and bold presence that drummers crave.',
    specs: [],
    images: ['/artisan-shop/feuzon-right.png'],
    audioSamples: [],
  },
];

const ArtisanDrums = ({ showAll = false }) => {
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
  const [isStuck, setIsStuck] = useState(true);

  const hoverTimeoutRef = useRef(null);
  const footerRef = useRef(null);

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

    const hoveredSeries = DRUM_SERIES[index].name;
    if (analytics) {
      logEvent(analytics, 'view_drum_series', { series: hoveredSeries });
    }

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

    const clickedSeries = DRUM_SERIES[index].name;
    if (analytics) {
      logEvent(analytics, 'click_drum_series', { series: clickedSeries });
    }

    setActiveIndex(index);
    setHoverIndex(null);
    setPreviousOverlay(null);
    setOverlayImage(DRUM_SERIES[index].overlay);
    setIsOverlayFading(false);
    setIsFading(false);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStuck(!entry.isIntersecting);
      },
      { threshold: 0.01 }
    );

    if (footerRef.current) {
      observer.observe(footerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="artisanseries-container">
      <div
        className={`logo-single-wrapper sticky-logo-wrapper fade-transition ${isFading ? 'fade-out' : ''}`}
      >
        <img
          src={active.logo}
          alt={active.name}
          className="artisanseries-header-image"
        />
      </div>

      <div
        className={`drum-display fade-transition ${isFading ? 'fade-out' : ''}`}
      >
        <div className="text-layer">
          <p className="description">
            <strong>{active.quote}</strong>
          </p>
          <p className="description">{active.description}</p>
          {/* <p className="starting-price">{active.startingPrice}</p> */}
          <button
            className="preorder-card-preorder-button"
            onClick={() => {
              if (active.id === 'soundlegend') {
                navigate('/artisan-shop/soundlegend');
              } else {
                navigate(`/artisan-shop/${active.id}`);
              }
            }}
          >
            {active.id === 'soundlegend'
              ? 'Request Your FREE 1-on-1 Consultation'
              : `Order Your ${active.name} Today`}
          </button>
          <p className="drum-hover-instruction">
            Click or hover on a drum to explore each series.
          </p>
        </div>
      </div>

      {/* ✳️ Instructional Message */}
      <div className="drum-layers-block">
        <div className={`drum-layers ${isStuck ? 'stuck' : ''}`}>
          <img
            src="/artisanseries-bottom-layers/base-layer-bottom.png"
            className="layer"
          />
          <img
            src="/artisanseries-bottom-layers/base-layer-front.png"
            className="layer"
          />
          <img
            src="/artisanseries-bottom-layers/top-layer-alldrums-color.png"
            className="layer overlay-image grayscale"
          />
          <img
            src={overlayImage}
            className="layer overlay-image"
            style={{ zIndex: 4 }}
          />
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
        <p className="drum-hover-instruction">
          Click or hover on a drum to explore each series.
        </p>
      </div>

      <div ref={footerRef} className="footer-trigger-marker" />

      {lightboxIndex !== null && (
        <div
          className={`lightbox ${zoomed ? 'zoomed' : ''}`}
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="lightbox-close"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(null);
            }}
          >
            ×
          </button>
          <button
            className="lightbox-arrow left"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((prev) =>
                prev === 0 ? active.images.length - 1 : prev - 1
              );
            }}
          >
            ‹
          </button>
          <div
            className="lightbox-image-container"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={active.images[lightboxIndex]}
              alt={`Zoom ${lightboxIndex + 1}`}
              onClick={() => setZoomed((z) => !z)}
            />
          </div>
          <button
            className="lightbox-arrow right"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((prev) =>
                prev === active.images.length - 1 ? 0 : prev + 1
              );
            }}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
};

export default ArtisanDrums;
