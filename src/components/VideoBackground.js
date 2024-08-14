// src/components/VideoBackground.js
import React from 'react';
import './VideoBackground.css'; // Import the corresponding CSS for styling

const VideoBackground = () => {
  return (
    <div className="video-background-container">
      <video autoPlay loop muted className="video-background">
        <source src={`${process.env.PUBLIC_URL}/background.mp4`} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="content-overlay">
        {/* Place any content you want on top of the video here */}
      </div>
    </div>
  );
};

export default VideoBackground;
