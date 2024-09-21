import React, { useState, useEffect } from 'react';
import './VideoBackground.css';

const VideoBackground = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 430);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 430);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const videoSrc = isMobile ? 'public/background-web.mp4'/background-web.mp4';

  console.log('Is Mobile:', isMobile); // Debugging output

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
