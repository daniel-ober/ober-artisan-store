import React, { useEffect, useState, useContext } from "react";
import { DarkModeContext } from "../context/DarkModeContext"; // ← add this
import "./HomeBackground.css";

  const HomeBackground = () => {
    const { isDarkMode } = useContext(DarkModeContext); // ← use it here
    const [scrollOffset, setScrollOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY / maxScroll;
      setScrollOffset(scrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="layered-background" style={{ "--scrollOffset": scrollOffset }}>
      <img
        src="/home-background/home-background-all.png"
        className="blending-layer"
        alt="Background blend"
      />
      <img
        src="/home-background/home-background-bottom.png"
        className="table-layer"
        alt="Drum base"
      />
      <img
        src="/home-background/home-background-top.png"
        className="outline-layer"
        alt="Drum outline"
      />
  
      {/* Your navbar background video, sitting in the foreground of this stack */}
      <video
        key={isDarkMode ? 'dark' : 'light'}
        className="navbar-background"
        autoPlay
        loop
        muted
        playsInline
      >
        <source
          src={isDarkMode ? '/hero-dark.mp4' : '/hero-light.mp4'}
          type="video/mp4"
        />
      </video>
  
      {/* Optional haze if still desired */}
      <video
        className="haze-layer"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/vid2.mp4" type="video/mp4" />
      </video>
    </div>
  );
};

export default HomeBackground;