import React, { useEffect, useRef, useState } from 'react';
import CountdownTimer from './CountdownTimer';
import './Home.css';

const Home = () => {
  const [visible, setVisible] = useState({});

  const observer = useRef(
    new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisible((prevVisible) => ({
            ...prevVisible,
            [entry.target.id]: true,
          }));
        }
      });
    }, { threshold: 0.1 })
  );

  useEffect(() => {
    const elements = document.querySelectorAll('.home-image');
    elements.forEach((element) => {
      observer.current.observe(element);
    });

    return () => {
      elements.forEach((element) => {
        observer.current.unobserve(element);
      });
    };
  }, []);

  return (
    <div className="home-container">
      <h1 className="welcome-message">Welcome to Dan Ober Artisan Drums!</h1>
      <div className="home-content">
        <CountdownTimer />
        {/* Video section */}
        <div className="video-container">
          <video
            className="coming-soon-video"
            autoPlay
            loop
            muted
            playsInline
            controls
            onMouseEnter={(e) => e.target.setAttribute('controls', 'controls')}
            onMouseLeave={(e) => e.target.removeAttribute('controls')}
          >
            <source src="https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/Home%2Fcomingsoon2.mp4?alt=media&token=31ad46c4-2d4c-447a-821e-13547a75a46f" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        <div className="home-section">
          <img
            src="https://i.imgur.com/248CyuT.jpeg"
            alt="Shop 1"
            className={`home-image ${visible['image1'] ? 'fade-in' : ''}`}
            id="image1"
          />
          <p className="home-paragraph">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat.
          </p>
        </div>
        <div className="home-section">
          <img
            src="https://i.imgur.com/R34mmJi.jpeg"
            alt="Shop 2"
            className={`home-image ${visible['image2'] ? 'fade-in' : ''}`}
            id="image2"
          />
          <p className="home-paragraph">
            Duis aute irure dolor in reprehenderit in voluptate velit esse
            cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
            cupidatat non proident, sunt in culpa qui officia deserunt mollit
            anim id est laborum.
          </p>
        </div>
        <div className="home-section">
          <img
            src="https://i.imgur.com/yqnmtbC.jpeg"
            alt="Shop 3"
            className={`home-image ${visible['image3'] ? 'fade-in' : ''}`}
            id="image3"
          />
          <p className="home-paragraph">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
