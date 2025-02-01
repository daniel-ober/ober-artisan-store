import React, { useEffect, useRef, useState } from "react";
import "./ArtisanSeries.css";

const ArtisanSeries = ({ isDarkMode }) => {
  const containerRef = useRef(null);
  const sectionsRef = useRef([]);
  const [scrollY, setScrollY] = useState(0);
  const [darkModeActive, setDarkModeActive] = useState(isDarkMode);

  useEffect(() => {
    setDarkModeActive(isDarkMode);
    console.log("🌗 Dark Mode Toggled:", isDarkMode ? "Enabled" : "Disabled");
  }, [isDarkMode]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const drumLines = [
    {
      id: "heritage",
      image: "/artisan-shop/46.png",
      headerImage: darkModeActive ? "/logos/heritage2-white.png" : "/logos/heritage2-white.png",
      description: "balanced, full, rich",
      textAlignment: "left",
    },
    {
      id: "feuzon",
      image: "/artisan-shop/47.png",
      headerImage: darkModeActive ? "/logos/feuzon-white.png" : "/logos/feuzon/feuzon-white-thin.png",
      description: "strong, dry, focused",
      textAlignment: "right",
    },
    {
      id: "soundlegend",
      image: "/artisan-shop/48.png",
      headerImage: darkModeActive ? "/logos/soundlegend2-white.png" : "/logos/soundlegend2-white.png",
      description: "versatile, soulful, articulate",
      textAlignment: "left",
    },
  ];

  return (
    <div className="artisanseries-container" ref={containerRef}>
      {drumLines.map((line, index) => {
        const parallaxFactor = index * 200; // Adjust spacing dynamically
        return (
          <section
            key={line.id}
            className={`drum-section ${line.textAlignment}`}
            ref={(el) => (sectionsRef.current[index] = el)}
            style={{
              transform: `translateY(${scrollY * 0.1 - parallaxFactor}px)`, // Smooth parallax movement
            }}
          >
            <div
              className="background-layer"
              style={{ transform: `translateY(${scrollY * 0.05}px) scale(1.1)` }} // Slowest movement
            ></div>
            <div
              className="drum-layer"
              style={{
                transform: `translateY(${scrollY * 0.2 - parallaxFactor}px) scale(1.05)`,
              }}
            >
              <img src={line.image} alt={`Drum line: ${line.id}`} />
            </div>
            <div
              className={`text-layer ${line.textAlignment}`}
              style={{ transform: `translateY(${scrollY * 0.3 - parallaxFactor}px)` }} // Fastest movement
            >
              <img src={line.headerImage} alt={`Logo for ${line.id}`} className="header-image" />
              <p>{line.description}</p>
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default ArtisanSeries;