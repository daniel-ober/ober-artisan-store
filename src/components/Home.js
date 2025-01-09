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
    'https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/Home%2Fteaser-light%2Fd.mp4?alt=media&token=b52e81d0-2ae9-449d-b3cb-051547ed97e0';
  const darkVideoSrc =
    'https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/Home%2Fteaser-dark%2Fc.mp4?alt=media&token=03f2688a-c1bd-48ba-9c75-b351007e3fa7';

  const handleVideoLoaded = () => {
    setIsVideoReady(true);
  };

  return (
    <div className="home-container">
      <div className="video-container" aria-label="Coming Soon Video">
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
      </div>
      <footer className="footer-container">
        <p>&copy; {new Date().getFullYear()} Dan Ober Artisan Drums. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;