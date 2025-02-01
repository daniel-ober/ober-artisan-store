import React, { useEffect, useRef, useState } from "react";
import "./ArtisanSeries.css";

const ArtisanSeries = ({ isDarkMode }) => {
  const containerRef = useRef(null);
  const [darkModeActive, setDarkModeActive] = useState(isDarkMode);

  useEffect(() => {
    setDarkModeActive(isDarkMode);
  }, [isDarkMode]);

  const drumLines = [
    {
      id: "heritage",
      image: "/artisan-shop/heritage-left.png",
      headerImage: darkModeActive
        ? "/logos/heritage2-white.png"
        : "/logos/heritage2-black.png",
      description: "balanced, full, rich",
      textAlignment: "left",
    },
    {
      id: "feuzon",
      image: "/artisan-shop/feuzon-right.png",
      headerImage: darkModeActive
        ? "/logos/feuzon2-white.png"
        : "/logos/feuzon2-black.png",
      description: "strong, dry, focused",
      textAlignment: "right",
    },
    {
      id: "soundlegend",
      image: "/artisan-shop/soundlegend-left.png",
      headerImage: darkModeActive
        ? "/logos/soundlegend2-white.png"
        : "/logos/soundlegend2-black.png",
      description: "versatile, soulful, articulate",
      textAlignment: "left",
    },
  ];

  return (
    <div
      className={`artisanseries-container ${darkModeActive ? "dark-mode" : ""}`}
      ref={containerRef}
    >
      {drumLines.map((line) => (
        <section key={line.id} className={`drum-section ${line.textAlignment}`}>
          <div className={`text-layer ${line.textAlignment}`}>
            <img
              src={line.headerImage}
              alt={`Logo for ${line.id}`}
              className="header-image"
            />
            <p className={`description ${darkModeActive ? "dark" : "light"}`}>
              {line.description}
            </p>
          </div>
          <div className="drum-layer">
            <img src={line.image} alt={`Drum line: ${line.id}`} />
          </div>
        </section>
      ))}

      {/* 🆕 FINAL SECTION WITH 3 DRUM LINEUP */}
      <section className="drum-final-section">
        <div className="drum-final-text">
          <img
            src={darkModeActive ? "/logos/heritage2-white.png" : "/logos/heritage2-black.png"}
            alt="Heritage"
            className="drum-label-img"
          />
          <img
            src={darkModeActive ? "/logos/soundlegend2-white.png" : "/logos/soundlegend2-black.png"}
            alt="Soundlegend"
            className="drum-label-img"
          />
          <img
            src={darkModeActive ? "/logos/feuzon2-white.png" : "/logos/feuzon2-black.png"}
            alt="Feuzon"
            className="drum-label-img"
          />
        </div>
        <div className="drum-final-image">
          <img src="/artisan-shop/render-4.png" alt="All three drum models" />
        </div>
      </section>
    </div>
  );
};

export default ArtisanSeries;