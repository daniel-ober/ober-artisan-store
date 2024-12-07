import React, { useEffect, useRef, useState } from 'react';
import { getUserDoc, createCart } from '../firebaseConfig';
import './Home.css';

const Home = () => {
  const [userData, setUserData] = useState(null);
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

  useEffect(() => {
    const testFirebaseIntegration = async () => {
      try {
        const userId = 'testUserId123';
        const userDoc = await getUserDoc(userId);

        if (!userDoc) {
          await createCart(userId);
          console.log(`Created a cart for user ID: ${userId}`);
        } else {
          setUserData(userDoc);
          console.log('User Data:', userDoc);
        }
      } catch (error) {
        console.error('Error interacting with Firebase:', error.message);
      }
    };

    testFirebaseIntegration();
  }, []);

  const lightVideoSrc =
    'https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/Home%2Fteaser-light%2Fd.mp4?alt=media&token=b52e81d0-2ae9-449d-b3cb-051547ed97e0';
  const darkVideoSrc =
    'https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/Home%2Fteaser-dark%2Fc.mp4?alt=media&token=03f2688a-c1bd-48ba-9c75-b351007e3fa7';

  const handleVideoLoaded = () => setIsVideoReady(true);

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
      </div>
      <div className="home-content">
        {userData && <p className="user-info">Welcome back, {userData.name}!</p>}
      </div>
    </div>
  );
};

export default Home;
