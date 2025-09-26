import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analytics, logEvent } from '../firebaseConfig';
import './HomeCarousel.css';

const slides = [
  {
    key: 'legacy-vault',
    title: 'Legacy Vault',
    subtitle: 'Authenticated, one-of-a-kind artist snares', // ← updated
    buttonText: 'Enter Vault',
    link: '/artisan-shop/soundlegend/vault',
    background: '/carousel/legacy-vault2.webp',
    focalY: 38,
    focalX: 50,
  },
  {
    key: 'artisan-drums',
    title: 'Artisan Drums',
    subtitle: 'Explore our handcrafted snare drums',
    buttonText: 'Explore Drums',
    link: '/founders-batch',
    background: '/carousel/artisan-drums.webp',
    focalY: 50,
    focalX: 50,
  },
  {
    key: 'soundlegend',
    title: 'SoundLegend Experience',
    subtitle: 'Collaborate to build your dream snare',
    buttonText: 'Learn More',
    link: '/artisanseries/soundlegend',
    background: '/carousel/soundlegend.webp',
    focalY: 50,
    focalX: 50,
  },
  {
    key: 'artisan-shop',
    title: 'Artisan Shop',
    subtitle: 'Order your snare today',
    buttonText: 'Shop Now',
    link: '/artisan-shop',
    background: '/carousel/artisan-shop.webp',
    focalY: 50,
    focalX: 50,
  },
  {
    key: 'founders-toast',
    title: "Founder's Toast",
    subtitle: 'Conditioning wax for natural wood finishes',
    buttonText: 'Order Now',
    link: '/artisan-shop/founders-toast',
    background: '/carousel/founders-toast.webp',
    focalY: 50,
    focalX: 50,
  },
  {
    key: 'merch',
    title: 'Merch Shop',
    subtitle: 'Shop shirts, hats & more',
    buttonText: 'Shop Merch',
    link: '/merch',
    background: '/carousel/merch-shop.webp',
    focalY: 50,
    focalX: 50,
  },
];

const HomeCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setCurrent((p) => (p + 1) % slides.length);
        setAnimating(false);
      }, 400);
    }, 6000);
    return () => clearInterval(id);
  }, [isPaused]);

  const goToNextSlide = () => {
    setAnimating(true);
    setTimeout(() => {
      setCurrent((p) => (p + 1) % slides.length);
      setAnimating(false);
    }, 100);
  };
  const goToPrevSlide = () => {
    setAnimating(true);
    setTimeout(() => {
      setCurrent((p) => (p - 1 + slides.length) % slides.length);
      setAnimating(false);
    }, 100);
  };
  const togglePaused = () => setIsPaused((p) => !p);

  const cur = slides[current];

  return (
    <div className="home-carousel-wrapper">
      {/* LCP image for the current slide only (kept under slides) */}
      <img
        key={cur.key} // force update on slide change
        src={cur.background}
        alt=""
        className="carousel-lcp-img"
        loading={current === 0 ? 'eager' : 'lazy'}
        decoding="async"
        style={{
          objectPosition: `${cur.focalX ?? 50}% ${cur.focalY ?? 50}%`,
        }}
      />

      <div className="home-carousel">
        {slides.map((slide, index) => (
          <div
            key={slide.key}
            className={`carousel-slide ${index === current ? 'active' : 'inactive'}`}
            style={{
              backgroundImage: `url(${slide.background})`,
              backgroundPosition: `${slide.focalX ?? 50}% ${slide.focalY ?? 50}%`,
            }}
            data-key={slide.key}
          >
            <div className="carousel-overlay">
              <h1
                className={`carousel-text ${animating ? 'fade-out delay-1' : 'fade-in delay-1'}`}
              >
                {slide.title}
              </h1>
              <p
                className={`carousel-text ${animating ? 'fade-out delay-2' : 'fade-in delay-2'}`}
              >
                {slide.subtitle}
              </p>
              <Link
                to={slide.link}
                onClick={() =>
                  analytics &&
                  logEvent(analytics, 'click_carousel_slide', {
                    slide: slide.title,
                  })
                }
              >
                <button
                  className={`carousel-text ${animating ? 'fade-out delay-3' : 'fade-in delay-3'}`}
                >
                  {slide.buttonText}
                </button>
              </Link>
            </div>
          </div>
        ))}

        <div className="carousel-dots">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`dot ${i === current ? 'active' : ''}`}
              onClick={() => setCurrent(i)}
            />
          ))}
        </div>

        <div className="carousel-nav">
          <button className="carousel-control-button" onClick={goToPrevSlide}>
            ‹
          </button>
          <button className="carousel-control-button" onClick={togglePaused}>
            {isPaused ? '▶' : '❚❚'}
          </button>
          <button className="carousel-control-button" onClick={goToNextSlide}>
            ›
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeCarousel;
