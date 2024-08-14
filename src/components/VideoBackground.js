// src/components/VideoBackground.js
import React from 'react';
import './VideoBackground.css';

const VideoBackground = () => {
  // Function to detect mobile devices
  const isMobile = () => {
    return window.innerWidth <= 430; // Width of iPhone 14 Pro Max
  };

  // Select the correct video based on the device
  const videoSrc = isMobile()
    ? '/background-mobile.mp4'   // Mobile video
    : '/background.mp4'; // Desktop video

  return (
    <div className="video-background">
      <video autoPlay loop muted playsInline>
        <source src={videoSrc} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoBackground;
