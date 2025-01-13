import React, { useEffect, useRef, useState } from 'react';
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

  const lightVideoSrc =
    '/light5.mp4';
  const darkVideoSrc =
    '/dark3.mp4';

  const handleVideoLoaded = () => {
    setIsVideoReady(true);
  };

  return (
    <div className="home-container">
      <div className="video-container" aria-label="Coming Soon Video">
        {/* <video
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
        /> */}
      </div>
    </div>
  );
};

export default Home;