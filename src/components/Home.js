import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      {/* Explore Drums - Full Width Card */}

      {/* ✅ SoundLegend Video Section */}
      <div className="home-video-wrapper">
        <iframe
          src="https://www.youtube.com/embed/PW28PjMCpxg?rel=0&vq=hd2160"
          title="Ober Artisan Drums — There’s A Legend In You"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      </div>

      <div className="home-row">
        <div className="card explore-card">
          <div className="card-subtitle">
            Handcrafted Excellence in Nashville, TN
          </div>
          <Link to="/artisanseries">
            <button className="cta-button">Explore Drums</button>
          </Link>
        </div>
      </div>
      {/* Highlight Row - 3 Cards in a Single Line */}
      <div className="home-row highlight-row">
        <div className="card">
          <h2 className="highlight-card-header">SoundLegend</h2>
          <p>
            Collaborate directly with our Artisan to build your dream snare
            drum.
          </p>
          <Link to="/products/soundlegend">
            <button>Learn More</button>
          </Link>
        </div>
        <div className="card">
          <h2 className="highlight-card-header">Pre-Order</h2>
          <p>Reserve your ready-to-be-made snare today.</p>
          <Link to="/pre-order">
            <button>Pre-Order Now</button>
          </Link>
        </div>
        <div className="card">
          <h2 className="highlight-card-header">Share Feedback</h2>
          <p>Comments, questions, feedback?</p>
          <Link to="/contact">
            <button>Contact Us</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;