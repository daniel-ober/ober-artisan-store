import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

const Home = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [videoClass, setVideoClass] = useState("");

  useEffect(() => {
    const updateDarkMode = () => {
      const darkModeEnabled = document.body.classList.contains("dark");
      setVideoClass("video-fade");
      setTimeout(() => {
        setIsDarkMode(darkModeEnabled);
        localStorage.setItem("darkMode", darkModeEnabled);
        setVideoClass("");
      }, 300);
    };

    const mutationObserver = new MutationObserver(updateDarkMode);
    mutationObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    updateDarkMode();
    return () => mutationObserver.disconnect();
  }, []);

  return (
    <div className="home-container">
      {/* Hero Section */}
      <div className="hero-overlay">
        <p>Handcrafted Excellence in Nashville, TN</p>
        <Link to="/artisanseries" className="cta-button">
          Explore Drums
        </Link>
      </div>

      {/* Highlights Section */}
      <div className="highlights-section">
        <div className="highlight">
          <h2>SoundLegend</h2>
          <p>Collaborate directly with our Artisan to build your dream snare drum.</p>
          <Link to="/products/soundlegend" className="highlight-button">
            <button>Learn More</button>
          </Link>
        </div>
        <div className="highlight">
          <h2>Pre-Order</h2>
          <p>Reserve your ready-to-be-made snare today!</p>
          <Link to="/pre-order" className="highlight-button">
            <button>Pre-Order Now</button>
          </Link>
        </div>
        {/* <div className="highlight">
          <h2>Share Feedback</h2>
          <p>Comments, questions, feedback?</p>
          <Link to="/contact" className="highlight-button">
            <button>Contact Us</button>
          </Link>
        </div> */}
      </div>
    </div>
  );
};

export default Home;