import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

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

  return (
    <div className="home-container">
      {/* Image Section */}
      <div className="image-container">
        <img
          src="/about.png"
          alt="Coming Soon"
          className="coming-soon-image"
        />
      </div>

      {/* Hero Section */}
      <div className="hero-overlay">
        <h1>Ober Artisan Drums</h1>
        <p>Handcrafted Excellence, Nashville TN</p>
        <Link to="/products" className="cta-button">
          Explore Drums
        </Link>
      </div>

      {/* Highlights Section */}
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
            <button>View Gallery</button>
          </Link>
        </div>
        <div className="highlight">
          <h2>Pre-Order</h2>
          <p>Reserve your spot for upcoming limited batches.</p>
          <Link to="/pre-order" className="highlight-button">
            <button>Pre-Order Now</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;