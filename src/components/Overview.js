import React, { useEffect, useRef, useState } from "react";
import "./Overview.css";

const Overview = ({ isDarkMode }) => {
  const containerRef = useRef(null);
  const sectionsRef = useRef([]);
  const [scrollIndex, setScrollIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const drumLines = [
    {
      id: "heritage",
      image: "/overview/overview-layer2a.png",
      headerImage: isDarkMode ? "/overview/logo-white-heritage.png" : "/overview/logo-black-heritage.png",
      description: "balanced, full, rich",
      textAlignment: "left",
    },
    {
      id: "feuzon",
      image: "/overview/overview-layer2b.png",
      headerImage: isDarkMode ? "/overview/logo-white-feuzon.png" : "/overview/logo-black-feuzon.png",
      description: "strong, dry, focused",
      textAlignment: "right",
    },
    {
      id: "soundlegend",
      image: "/overview/overview-layer2c.png",
      headerImage: isDarkMode ? "/overview/logo-white-soundlegend.png" : "/overview/logo-black-soundlegend.png",
      description: "versatile, soulful, articulate",
      textAlignment: "left",
    },
  ];

  return (
    <div className="overview-container" ref={containerRef}>
      {drumLines.map((line) => (
        <section key={line.id} className={`drum-section ${line.textAlignment}`}>
          <div className="drum-layer">
            <img src={line.image} alt={line.id} />
          </div>
          <div className={`text-layer ${line.textAlignment}`}>
            <img src={line.headerImage} alt={line.id} className="header-image" />
            <p>{line.description}</p>
          </div>
        </section>
      ))}
    </div>
  );
};

export default Overview;