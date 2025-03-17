import React from "react";
import "./YouTubeEmbeded.css";

const YouTubeEmbed = () => {
    return (
      <div className="youtube-container">
        <iframe
          src="https://www.youtube.com/embed/PW28PjMCpxg?rel=0&vq=hd2160"
          title="YouTube Video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      </div>
    );
  };
  

export default YouTubeEmbed;