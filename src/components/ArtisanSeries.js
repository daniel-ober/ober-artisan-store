import React, { useState, useContext, useEffect, useRef } from 'react';
import './ArtisanSeries.css';
import { DarkModeContext } from '../context/DarkModeContext';
import YouTubeEmbeded from './YouTubeEmbeded';

const DRUM_SERIES = [
  {
    id: 'heritage',
    name: 'HERITAGE',
    logo: '/resized-logos/heritage-white.png',
    overlay: '/artisanseries-bottom-layers/top-layer-left-drum-highlighted.png',
    quote:
      '“The drum that started it all—classic craftsmanship, timeless sound.”',
    description:
    'The HERITAGE Series pays tribute to traditional craftsmanship with a modern edge. Designed and built in Nashville, TN, this flagship stave snare drum features hand-selected Oak and a unique torch tuning process that enhances both tone and visual character. Built for drummers who value warmth, articulation, and timeless design, the HERITAGE delivers a crisp attack and balanced musicality. Whether in the studio or on stage, it stands as a testament to the roots of the Ober Artisan sound.',    
    specs: [
      // 'Shell Construction: Stave',
      // 'Available Sizes: 12”, 13”, 14”',
      // 'Finish: Light gloss, Medium gloss, Torch-scorched aesthetic',
      // 'Wood Selection: Northern Red Oak',
    ],
    images: [
      'https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/artisan%2Fheritage%2F14x6.20-stave%2Fimages%2FIMG_6123.png?alt=media&token=9511873e-1ccb-43cb-9e91-1494c2f09f9b'
      // '/fallback-images/images-coming-soon-regular.png'
    ],
    // images: [
    //   'https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/artisan%2Fheritage%2F14x6.20-stave%2Fimages%2FIMG_6123.png?alt=media&token=9511873e-1ccb-43cb-9e91-1494c2f09f9b',
    //   'https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/artisan%2Fheritage%2F14x6.20-stave%2Fimages%2FDSC01520.jpeg?alt=media&token=0412580a-642a-4be3-ae4c-0d9c33d4f0a9',
    //   'https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/artisan%2Fheritage%2F14x6.20-stave%2Fimages%2FIMG_9087.jpeg?alt=media&token=056bcb03-b839-43ce-815e-46b1c26d16c5'
    // ],
    audioSamples: [
      /* ... */
    ],
  },
  {
    id: 'soundlegend',
    name: 'SOUNDLEGEND',
    logo: '/resized-logos/soundlegend-white.png',
    overlay:
      '/artisanseries-bottom-layers/top-layer-middle-drum-highlighted.png',
    quote: '“Every drum tells a story—let’s craft yours together.”',
    description:
      'The SoundLegend Series is more than just a drum—it’s an experience. Designed for drummers who want to collaborate directly with a master artisan, this fully custom shop offering gives you the freedom to explore new sonic possibilities. Through a hands-on process that includes consultation calls, high-resolution concept renders, and build updates, you’ll watch your dream snare drum take shape before your eyes.',
    specs: [
      // 'Shell Construction: Stave, Steam-Bent, or Hybrid',
      // 'Fully Customizable: Size, Lugs, Finish, Wood',
      // 'Unforgettable Experience: Consultation + Concept Renders...',
    ],
    videoUrl: 'https://www.youtube.com/embed/PW28PjMCpxg?rel=0&vq=hd2160', // ✅ Add this
    audioSamples: [],
  },
  {
    id: 'feuzon',
    name: 'FEUZØN',
    logo: '/resized-logos/feuzon-white.png',
    overlay:
      '/artisanseries-bottom-layers/top-layer-right-drum-highlighted.png',
    quote: '“Blending tradition and innovation into one harmonious voice.”',
    description:
      'The FEUZØN Series is a revolutionary hybrid snare drum that fuses the precision of stave construction with the controlled resonance of a steam bent outer shell. This innovative design enhances warmth, articulation, and dynamic response, offering a snare drum unlike any other. Each drum is torch-tuned to refine its sonic character, bringing out the rich harmonics and bold presence that drummers crave.',
    specs: [
      // 'Shell Construction: Stave + Steam Bent',
      // 'Available Sizes: 12”, 13”, 14”',
      // 'Finish: Finish: Natural or Stained',
      // 'Wood Selection: Stave (varied) + limited steam bent woods',
    ],
    // images: [
    //   '/fallback-images/images-coming-soon-regular.png',
    //   '/fallback-images/images-coming-soon-regular.png',
    //   '/fallback-images/images-coming-soon-regular.png'
    // ],
    images: [
      'https://firebasestorage.googleapis.com/v0/b/danoberartisandrums-dev.firebasestorage.app/o/products%2F67c255d1-a9ca-4f5d-80af-ddeee6a424e1_IMG_6133.png?alt=media&token=a15b2e68-d34b-44fa-bf33-eccc4a025331'
    ],
    audioSamples: [],
  },
];

const ArtisanSeries = () => {
  const { isDarkMode } = useContext(DarkModeContext);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [isFading, setIsFading] = useState(false);
  const [isOverlayFading, setIsOverlayFading] = useState(false);
  const [previousOverlay, setPreviousOverlay] = useState(null);
  const [overlayImage, setOverlayImage] = useState(DRUM_SERIES[0].overlay);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [zoomed, setZoomed] = useState(false);
  const [isTriggerActive, setIsTriggerActive] = useState(false);
  const [isFinalSectionVisible, setFinalSectionVisible] = useState(false);
  const [finalOverlayOpacity, setFinalOverlayOpacity] = useState(0);

  const hoverTimeoutRef = useRef(null);
  const footerRef = useRef(null);
  const finalSectionRef = useRef(null);

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
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target); // only animate once
          }
        });
      },
      {
        rootMargin: '0px 0px -20% 0px', // triggers earlier
        threshold: 0.2,
      }
    );

    const images = document.querySelectorAll('.gallery-strip img');
    images.forEach((img) => observer.observe(img));

    return () => observer.disconnect();
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

  const finalOverlayImage = isFinalSectionVisible
    ? '/artisanseries-bottom-layers/top-layer-alldrums-color.png'
    : overlayImage;

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          const ratio = entry.intersectionRatio;
          const clamped = ratio >= 0.95 ? 1 : ratio <= 0.05 ? 0 : ratio;
          setFinalOverlayOpacity(clamped);
        },
        {
          threshold: Array.from({ length: 21 }, (_, i) => i * 0.05), // 0 to 1 in 0.05 steps
        }
      );
    
      if (finalSectionRef.current) {
        observer.observe(finalSectionRef.current);
      }
    
      return () => {
        observer.disconnect();
      };
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

{active.id === 'soundlegend' && (
  <div className="soundlegend-video-wrapper">
    <iframe
      src="https://www.youtube.com/embed/PW28PjMCpxg?rel=0&vq=hd2160"
      title="SoundLegend Demo"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    ></iframe>
  </div>
)}

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
      <div className={`drum-layers ${isTriggerActive ? "scrolling" : "fixed"}`}>
  <img src="/artisanseries-bottom-layers/base-layer-bottom.png" className="layer" />
  <img src="/artisanseries-bottom-layers/base-layer-front.png" className="layer" />

  {/* Active drum overlay image */}
  <img
    src={overlayImage}
    className="layer overlay-image"
    alt="Active"
    style={{ opacity: 1 - finalOverlayOpacity }}
  />

  {/* Final all-drums overlay image */}
  <img
    src="/artisanseries-bottom-layers/top-layer-alldrums-color.png"
    className="layer overlay-image"
    alt="Final"
    style={{ opacity: finalOverlayOpacity }}
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

      <div ref={footerRef} className="footer-trigger-marker" />

      <div className="drum-final-text-section" ref={finalSectionRef}>
        {DRUM_SERIES.map((drum) => (
          <div className="drum-final-card" key={drum.id}>
            <img
              src={`/resized-logos/${drum.id}-white.png`}
              alt={drum.name}
              className="final-logo"
            />
            <ul className="description-list">
              {drum.specs.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
            <a
              href={`/products/${drum.id}`}
              className={
                drum.id === 'soundlegend'
                  ? 'learn-more-button'
                  : 'preorder-card-preorder-button'
              }
            >
              {drum.id === 'soundlegend' ? 'Learn More' : 'Pre-Order Now'}
            </a>
          </div>
        ))}
      </div>
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

export default ArtisanSeries;
