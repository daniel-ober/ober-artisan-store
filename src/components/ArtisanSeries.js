import React, { useEffect, useState, useContext } from "react";
import { DarkModeContext } from "../context/DarkModeContext"; // ✅ Use Global Dark Mode State
import "./ArtisanSeries.css";

const ArtisanSeries = () => {
  const { isDarkMode } = useContext(DarkModeContext); // ✅ Get Dark Mode state from context
  const [darkModeActive, setDarkModeActive] = useState(isDarkMode);

  useEffect(() => {
    console.log("🎨 ArtisanSeries: Dark Mode Changed →", isDarkMode);

    // 🔄 Preserve Scroll Position
    const scrollPosition = window.scrollY;
    setDarkModeActive(isDarkMode);
    
    // Restore the user's scroll position after re-render
    setTimeout(() => {
      window.scrollTo(0, scrollPosition);
    }, 0); // Ensure this runs after re-render
  }, [isDarkMode]);

  const drumLines = [
    {
      id: "heritage",
      image: "/artisan-shop/heritage-left.png",
      headerImage: darkModeActive
        ? "/artisanseries/heritage-white.png"
        : "/artisanseries/heritage-black.png",
      description: "balanced, full, rich",
      textAlignment: "left",
    },
    {
      id: "feuzon",
      image: "/artisan-shop/feuzon-right.png",
      headerImage: darkModeActive
        ? "/artisanseries/feuzon-white.png"
        : "/artisanseries/feuzon-black.png",
      description: "strong, dry, focused",
      textAlignment: "right",
    },
    {
      id: "soundlegend",
      image: "/artisan-shop/soundlegend-left.png",
      headerImage: darkModeActive
        ? "/artisanseries/soundlegend-white.png"
        : "/artisanseries/soundlegend-black.png",
      description: "versatile, soulful, articulate",
      textAlignment: "left",
    },
  ];

  console.log("📌 ArtisanSeries Dark Mode State:", darkModeActive);
  console.log("📌 Current Image Paths:");
  drumLines.forEach((line) =>
    console.log(`${line.id}: ${line.headerImage}`)
  );

  return (
    <div className={`artisanseries-container ${darkModeActive ? "dark-mode" : ""}`}>
      {drumLines.map((line) => (
        <section key={line.id} className={`drum-section ${line.textAlignment}`}>
          <div className={`text-layer ${line.textAlignment}`}>
            <img src={line.headerImage} alt={`Logo for ${line.id}`} className="header-image" />
            <p className={`description ${darkModeActive ? "dark" : "light"}`}>{line.description}</p>
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
            src={darkModeActive ? "/artisanseries/heritage-white.png" : "/artisanseries/heritage-black.png"}
            alt="Heritage"
            className="drum-label-img heritage"
          />
          <img
            src={darkModeActive ? "/artisanseries/soundlegend-white.png" : "/artisanseries/soundlegend-black.png"}
            alt="Soundlegend"
            className="drum-label-img soundlegend"
          />
          <img
            src={darkModeActive ? "/artisanseries/feuzon-white.png" : "/artisanseries/feuzon-black.png"}
            alt="Feuzon"
            className="drum-label-img feuzon"
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