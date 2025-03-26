import React, { useEffect, useState } from "react";
import "./HomeBackground.css";

const HomeBackground = () => {
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

  // We'll pass the scrollOffset as a CSS variable
  return (
    <div
      className="layered-background"
      style={{ "--scrollOffset": scrollOffset }}
    >
      <img
        src="/home-background/home-background-bottom.png"
        className="table-layer"
        alt="Drum base"
      />
      <img
        src="/home-background/home-background-top.png"
        className="outline-layer"
        alt="Drum outlines"
      />
    </div>
  );
};

export default HomeBackground;