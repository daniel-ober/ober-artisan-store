import React from 'react';
import './About.css';

const Home = () => {
  return (
    <div className="about-container">
      <div className="about-content">
        <div className="about-section">
          <img src="https://i.imgur.com/248CyuT.jpeg" alt="Shop Image 1" className="about-image" />
          <p className="about-paragraph">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
        </div>
        <div className="about-section">
          <img src="https://i.imgur.com/R34mmJi.jpeg" alt="Shop Image 2" className="about-image" />
          <p className="about-paragraph">
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
          </p>
        </div>
        <div className="about-section">
          <img src="https://i.imgur.com/yqnmtbC.jpeg" alt="Shop Image 3" className="about-image" />
          <p className="about-paragraph">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
