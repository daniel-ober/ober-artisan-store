import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

const Home = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [videoClass, setVideoClass] = useState(""); // Used for fade effect

  useEffect(() => {
    const updateDarkMode = () => {
      const darkModeEnabled = document.body.classList.contains("dark");
      setVideoClass("video-fade"); // Start fading out the video

      setTimeout(() => {
        setIsDarkMode(darkModeEnabled);
        localStorage.setItem("darkMode", darkModeEnabled);
        setVideoClass(""); // Reset fade effect
      }, 300); // Wait 300ms before switching videos
    };

    const mutationObserver = new MutationObserver(updateDarkMode);
    mutationObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    updateDarkMode();

    return () => mutationObserver.disconnect();
  }, []);

  return (
    <div className="home-container">
      {/* Hero Video Section */}
      {/* <video
        className={`hero-video ${isDarkMode ? "hero-video-dark" : "hero-video-light"} ${videoClass}`}
        autoPlay
        loop
        muted
        playsInline
        src={isDarkMode ? "/hero-dark.mp4" : "/hero-light.mp4"} // Dynamic video source
        type="video/mp4"
      /> */}

      {/* Hero Section */}
      <div className="hero-overlay">
        <h1>Ober Artisan Drums</h1>
        <p>Handcrafted Excellence, Nashville TN</p>
        <Link to="/artisanseries" className="cta-button">
          Explore Drums
        </Link>
      </div>

      {/* Highlights Section */}
      <div className="highlights-section">
        <div className="highlight">
          <h2>Soundlegend</h2>
          <p>Build your dream drum, customized to perfection.</p>
          <Link to="/soundlegend" className="highlight-button">
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