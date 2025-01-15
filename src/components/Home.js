import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom'; // Import for React Router
import './Home.css';

const Home = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [isVideoReady, setIsVideoReady] = useState(false);

  const lightVideoRef = useRef(null);
  const darkVideoRef = useRef(null);

  useEffect(() => {
    const updateDarkMode = () => {
      const darkModeEnabled = document.body.classList.contains('dark');
      setIsDarkMode(darkModeEnabled);
      localStorage.setItem('darkMode', darkModeEnabled);
    };

    const mutationObserver = new MutationObserver(updateDarkMode);
    mutationObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    updateDarkMode();

    return () => mutationObserver.disconnect();
  }, []);

  const lightVideoSrc = '/light5.mp4';
  const darkVideoSrc = '/dark3.mp4';

  const handleVideoLoaded = () => {
    setIsVideoReady(true);
  };

  return (
    <div className="home-container">
      <div className="video-container">
        <video
          ref={lightVideoRef}
          src={lightVideoSrc}
          className={`coming-soon-video ${!isDarkMode && isVideoReady ? 'fade-in' : 'fade-out'}`}
          autoPlay
          loop
          muted
          playsInline
          onCanPlayThrough={handleVideoLoaded}
        />
        <video
          ref={darkVideoRef}
          src={darkVideoSrc}
          className={`coming-soon-video ${isDarkMode && isVideoReady ? 'fade-in' : 'fade-out'}`}
          autoPlay
          loop
          muted
          playsInline
          onCanPlayThrough={handleVideoLoaded}
        />
        <div className="hero-overlay">
          <h1>Ober Artisan Drums</h1>
          <p>Handcrafted Excellence, Nashville TN</p>
          <Link to="/products" className="cta-button">
            Explore Drums
          </Link>
        </div>
      </div>
      <div className="highlights-section">
        <div className="highlight">
          <h2>Custom Shop</h2>
          <p>Build your dream drum, customized to perfection.</p>
          <Link to="/custom-shop" className="highlight-button">
          <button>Custom Shop</button>
          </Link>
        </div>
        <div className="highlight">
          <h2>Gallery</h2>
          <p>Discover our creations, built with precision and care.</p>
          <Link to="/gallery" className="highlight-button">
          <button>Videw Gallery</button>
          </Link>
        </div>
        <div className="highlight">
          <h2>Pre-Order</h2>
          <p>Reserve your spot for upcoming limited batches.</p>
          <Link to="/products" className="highlight-button">
          <button>Pre-Order Now</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;