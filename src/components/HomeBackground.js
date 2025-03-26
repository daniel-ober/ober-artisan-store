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

  return (
    <div className="layered-background" style={{ "--scrollOffset": scrollOffset }}>
      {/* 🔽 New bottom blending layer */}
      <img
        src="/home-background/home-background-all.png"
        className="blending-layer"
        alt="Background blend"
      />

      {/* Optional haze */}

      <img src="/home-background/home-background-bottom.png" className="table-layer" alt="Drum base" />
      <img src="/home-background/home-background-top.png" className="outline-layer" alt="Drum outline" />
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