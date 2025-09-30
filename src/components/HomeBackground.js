import React, { useEffect, useState, useContext } from "react";
import { DarkModeContext } from "../context/DarkModeContext";
import "./HomeBackground.css";

const HomeBackground = () => {
  const { isDarkMode } = useContext(DarkModeContext);
  const [scrollOffset, setScrollOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      const scrolled = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      setScrollOffset(scrolled);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const heroSrc = isDarkMode ? "/hero-dark.mp4" : "/hero-light.mp4";

  return (
    <div className="layered-background" style={{ "--scrollOffset": scrollOffset }}>
      <img src="/home-background/home-background-all.png" className="layer-image blending-layer" alt="Background blend" />
      <img src="/home-background/home-background-bottom.png" className="layer-image table-layer" alt="Drum base" />
      <img src="/home-background/home-background-top.png" className="layer-image outline-layer" alt="Drum outline" />

      <video
        key={isDarkMode ? "dark" : "light"}
        className="navbar-background"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        crossOrigin="anonymous"
        onError={(e) => console.error("Hero video failed to load:", heroSrc, e)}
      >
        <source src={heroSrc} type="video/mp4" />
      </video>

      <video
        className="haze-layer"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        crossOrigin="anonymous"
        onError={(e) => console.error("Haze video failed to load: /vid2.mp4", e)}
      >
        <source src="/vid2.mp4" type="video/mp4" />
      </video>
    </div>
  );
};

export default HomeBackground;