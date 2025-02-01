import React, { useEffect, useRef, useState } from "react";
import "./ArtisanSeries.css";

const ArtisanSeries = ({ isDarkMode }) => {
  const containerRef = useRef(null);
  const sectionsRef = useRef([]);
  const [scrollIndex, setScrollIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const drumLines = [
    {
      id: "heritage",
      image: "/artisan-shop/46.png",
      headerImage: isDarkMode ? "/artisanseries/logo-white-heritage.png" : "/artisanseries/logo-black-heritage.png",
      description: "balanced, full, rich",
      textAlignment: "left",
    },
    {
      id: "feuzon",
      image: "/artisan-shop/47.png",
      headerImage: isDarkMode ? "/artisanseries/logo-white-feuzon.png" : "/artisanseries/logo-black-feuzon.png",
      description: "strong, dry, focused",
      textAlignment: "right",
    },
    {
      id: "soundlegend",
      image: "/artisan-shop/48.png",
      headerImage: isDarkMode ? "/artisanseries/logo-white-soundlegend.png" : "/artisanseries/logo-black-soundlegend.png",
      description: "versatile, soulful, articulate",
      textAlignment: "left",
    },
  ];

  return (
    <div className="artisanseries-container" ref={containerRef}>
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

export default ArtisanSeries;