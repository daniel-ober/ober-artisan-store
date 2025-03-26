import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";

const Home = () => {
  return (
    <div className="home-container">
      {/* Explore Drums - Full Width Card */}
      <div className="home-row">
        <div className="card explore-card">
          <div className="card-subtitle">Handcrafted Excellence in Nashville, TN</div>
          <Link to="/artisanseries">
            <button className="cta-button">Explore Drums</button>
          </Link>
        </div>
      </div>

      {/* Highlight Row - 3 Cards in a Single Line */}
      <div className="home-row highlight-row">
        <div className="card">
          <h2>SoundLegend</h2>
          <p>Collaborate directly with our Artisan to build your dream snare drum.</p>
          <Link to="/products/soundlegend">
            <button>Learn More</button>
          </Link>
        </div>
        <div className="card">
          <h2>Pre-Order</h2>
          <p>Reserve your ready-to-be-made snare today.</p>
          <Link to="/pre-order">
            <button>Pre-Order Now</button>
          </Link>
        </div>
        <div className="card">
          <h2>Share Feedback</h2>
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