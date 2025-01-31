import React, { useEffect, useRef, useState } from "react";
import "./Overview.css";

const drumLines = [
  {
    id: "heritage",
    image: "/overview/overview-layer2a.png",
    headerImage: "/overview/logo-heritage.png",
    description: "balanced, full, rich",
    textAlignment: "left",
  },
  {
    id: "feuzeon",
    image: "/overview/overview-layer2b.png",
    headerImage: "/overview/logo-feuzon.png",
    description: "strong, dry, focused",
    textAlignment: "right",
  },
  {
    id: "soundlegend",
    image: "/overview/overview-layer2c.png",
    headerImage: "/overview/logo-soundlegend.png",
    description: "versatile, soulful, articulate",
    textAlignment: "left",
  },
];

const Overview = () => {
  const containerRef = useRef(null);
  const sectionsRef = useRef([]);
  const [navbarHeight, setNavbarHeight] = useState(0);
  const [scrollIndex, setScrollIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const navbar = document.querySelector(".navbar");
    if (navbar) {
      setNavbarHeight(navbar.offsetHeight);
      document.documentElement.style.setProperty("--navbar-height", `${navbar.offsetHeight}px`);
    }

    const handleResize = () => {
      if (navbar) {
        setNavbarHeight(navbar.offsetHeight);
        document.documentElement.style.setProperty("--navbar-height", `${navbar.offsetHeight}px`);
      }
    };

    const handleScroll = () => {
      if (!isAnimating) {
        const scrollY = window.scrollY;
        document.documentElement.style.setProperty("--scroll", scrollY);
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isAnimating]);

  // **Smooth Scroll-Locking Effect**
  useEffect(() => {
    let animationFrame;
    
    const smoothScroll = (targetY) => {
      const start = window.scrollY;
      const distance = targetY - start;
      let startTime = null;

      const animateScroll = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = timestamp - startTime;
        const easeInOutQuad = progress / 500; // Adjust smoothness (500ms transition)
        const newY = start + distance * Math.min(easeInOutQuad, 1);

        window.scrollTo(0, newY);

        if (easeInOutQuad < 1) {
          animationFrame = requestAnimationFrame(animateScroll);
        } else {
          setIsAnimating(false);
        }
      };

      requestAnimationFrame(animateScroll);
    };

    const handleWheel = (event) => {
      if (isAnimating) return;
      setIsAnimating(true);

      let newIndex = scrollIndex;
      if (event.deltaY > 0) {
        newIndex = Math.min(scrollIndex + 1, drumLines.length - 1);
      } else if (event.deltaY < 0) {
        newIndex = Math.max(scrollIndex - 1, 0);
      }

      setScrollIndex(newIndex);
      smoothScroll(sectionsRef.current[newIndex].offsetTop);
    };

    window.addEventListener("wheel", handleWheel);
    return () => {
      window.removeEventListener("wheel", handleWheel);
      cancelAnimationFrame(animationFrame);
    };
  }, [scrollIndex, isAnimating]);

  return (
    <div className="overview-container" ref={containerRef}>
      {drumLines.map((line, index) => (
        <section
          key={line.id}
          ref={(el) => (sectionsRef.current[index] = el)}
          className={`drum-section ${line.textAlignment}`}
        >
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