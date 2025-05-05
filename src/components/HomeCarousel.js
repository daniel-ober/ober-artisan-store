import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './HomeCarousel.css';

const slides = [
  {
    title: 'Artisan Shop',
    subtitle: 'Pre-order your drum today',
    buttonText: 'Pre-Order Now',
    link: '/artisan-shop',
    background: '/carousel/artisan-shop.webp',
  },
  {
    title: 'Artisan Drums',
    subtitle: 'Explore our handcrafted snare drums',
    buttonText: 'Explore Drums',
    link: '/artisan-drums',
    background: '/carousel/artisan-drums.webp',
  },
  {
    title: 'SoundLegend Experience',
    subtitle: 'Collaborate to build your dream snare',
    buttonText: 'Learn More',
    link: '/artisanseries/soundlegend',
    background: '/carousel/soundlegend.webp',
  },
  {
    title: "Founder's Toast",
    subtitle: 'Conditioning wax for natural wood finishes',
    buttonText: 'Order Yours Today',
    link: '/artisan-shop/founders-toast',
    background: '/carousel/founders-toast.webp',
  },
  {
    title: 'Merch Shop',
    subtitle: 'Shop shirts, hats & more',
    buttonText: 'Shop Merch',
    link: '/merch',
    background: '/carousel/merch-shop.webp',
  },
];

const HomeCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    slides.forEach((slide) => {
      const img = new Image();
      img.src = slide.background;
    });
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % slides.length);
        setAnimating(false);
      }, 400);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const goToNextSlide = () => {
    setAnimating(true);
    setTimeout(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
      setAnimating(false);
    }, 100);
  };

  const goToPrevSlide = () => {
    setAnimating(true);
    setTimeout(() => {
      setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
      setAnimating(false);
    }, 100);
  };

  const togglePaused = () => setIsPaused((prev) => !prev);

  const { title, subtitle, buttonText, link, background } = slides[current];

  return (
    <div className="home-carousel-wrapper">
      <div
        className="home-carousel"
        style={{ backgroundImage: `url(${background})` }}
      >
        <div className="carousel-overlay">
          <h1 className={`carousel-text ${animating ? 'fade-out delay-1' : 'fade-in delay-1'}`}>{title}</h1>
          <p className={`carousel-text ${animating ? 'fade-out delay-2' : 'fade-in delay-2'}`}>{subtitle}</p>
          <Link to={link}>
            <button className={`carousel-text ${animating ? 'fade-out delay-3' : 'fade-in delay-3'}`}>{buttonText}</button>
          </Link>
        </div>

        {/* Dots in original position */}
        <div className="carousel-dots">
          {slides.map((_, index) => (
            <span
              key={index}
              className={`dot ${index === current ? 'active' : ''}`}
              onClick={() => setCurrent(index)}
            ></span>
          ))}
        </div>

        {/* Navigation + pause below */}
        <div className="carousel-nav">
          <button className="carousel-control-button" onClick={goToPrevSlide}>‹</button>
          <button className="carousel-control-button" onClick={togglePaused}>{isPaused ? '▶' : '❚❚'}</button>
          <button className="carousel-control-button" onClick={goToNextSlide}>›</button>
        </div>


        <div style={{ display: 'none' }}>
          {slides.map((slide) => (
            <img key={slide.background} src={slide.background} alt="" loading="eager" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeCarousel;