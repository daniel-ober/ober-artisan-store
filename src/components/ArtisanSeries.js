import React, { useEffect, useContext } from "react";
import "./ArtisanSeries.css";
import { useNavigate } from "react-router-dom";
import { DarkModeContext } from "../context/DarkModeContext";

const ArtisanSeries = ({ product = {} }) => {
    const navigate = useNavigate();
  const { isDarkMode } = useContext(DarkModeContext);

  useEffect(() => {
    const sections = document.querySelectorAll(".drum-section, .drum-info");

    const revealOnScroll = () => {
      sections.forEach((section) => {
        const sectionTop = section.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        if (sectionTop < windowHeight * 0.85) {
          section.classList.add("visible");
        }
      });
    };

    window.addEventListener("scroll", revealOnScroll);
    revealOnScroll(); // Run initially in case some are already in view

    return () => {
      window.removeEventListener("scroll", revealOnScroll);
    };
  }, []);

      // Determine button text dynamically
      let preOrderButton;
      if (product && product.currentQuantity === 0) {
                preOrderButton = "Click here for Details";
      } else if (product.id === "heritage") {
        preOrderButton = "Pre-Order Now";
      } else if (product.id === "feuzon") {
        preOrderButton = "Pre-Order Now";
      } else if (product.id === "soundlegend") {
        preOrderButton = "Schedule Consultation";
      } else if (product.id === "dreamfeather") {
        preOrderButton = "Own This One-of-a-Kind Snare";
      } else {
        preOrderButton = "Pre-Order Now";
      }

  return (
    <div className="artisanseries-container">
      {/* HERÌTAGE Series Section */}
      <section className="drum-section left">
        <div className="text-layer">
          <img
            src={isDarkMode ? "/artisanseries/heritage-white.png" : "/artisanseries/heritage-white.png"}
            alt="HERÌTAGE Series"
            className="artisanseries-header-image "
          />
          <p className="description">
            <strong>“The drum that started it all—classic craftsmanship, timeless sound.”</strong>
          </p>
          <p className="description">
            The HERÌTAGE Series embodies the soul of hand-crafted percussion. Designed and built in Nashville, TN, this stave snare drum is a testament to the artistry and dedication behind every Ober Artisan Drum.
            Each stave is meticulously hand-tuned using an exclusive torch tuning process, bringing out the natural resonance and warmth of the wood while enhancing its striking scorched finish.
            Available in multiple stave configurations and carefully selected Oak, the HERÌTAGE Series delivers a dynamic response, crisp attack, and balanced tonal complexity.
          </p>
          <ul className="description-list">
            <li>Shell Construction: Stave</li>
            <li>Available Sizes: 12”, 13”, 14”</li>
            <li>Finish: Light gloss, Medium gloss, Torch-scorched aesthetic</li>
            <li>Wood Selection: Northern Red Oak</li>
            {/* <li>Starting Price: <strong>$850</strong></li> */}
          </ul>
        </div>
        <div className="drum-layer">
          <img src="/artisan-shop/heritage-left.png" alt="HERÌTAGE Snare" />
        </div>
      </section>

      {/* FEUZØN Series Section */}
      <section className="drum-section right">
        <div className="text-layer">
          <img
            src={isDarkMode ? "/artisanseries/feuzon-white.png" : "/artisanseries/feuzon-white.png"}
            alt="FEUZØN Series"
            className="artisanseries-header-image"
          />
          <p className="description">
            <strong>“Blending tradition and innovation into one harmonious voice.”</strong>
          </p>
          <p className="description">
            The FEUZØN Series is a revolutionary hybrid snare drum that fuses the precision of stave construction with the controlled resonance of a steam bent outer shell.
            This innovative design enhances warmth, articulation, and dynamic response, offering a snare drum unlike any other. Each drum is torch-tuned to refine its sonic character, bringing out the rich harmonics and bold presence that drummers crave.
          </p>
          <ul className="description-list">
            <li>Shell Construction: Stave + Steam Bent</li>
            <li>Available Sizes: 12”, 13”, 14”</li>
            <li>Finish: Natural or Stained</li>
            <li>Wood Selection: Stave (varied) + limited steam bent woods</li>
            {/* <li>Starting Price: <strong>$1,050</strong></li> */}
          </ul>
        </div>
        <div className="drum-layer">
          <img src="/artisan-shop/feuzon-right.png" alt="FEUZØN Snare" />
        </div>
      </section>

      {/* SoundLegend Series Section */}
      <section className="drum-section left">
        <div className="text-layer">
          <img
            src={isDarkMode ? "/artisanseries/soundlegend-white.png" : "/artisanseries/soundlegend-white.png"}
            alt="SoundLegend Series"
            className="artisanseries-header-image"
          />
          <p className="description">
            <strong>“Every drum tells a story—let’s craft yours together.”</strong>
          </p>
          <p className="description">
            The SoundLegend Series is more than just a drum—it’s an experience. Designed for drummers who want to collaborate directly with a master artisan,
            this fully custom shop offering gives you the freedom to explore new sonic possibilities.
            Through a hands-on process that includes consultation calls, high-resolution concept renders, and build updates, you’ll watch your dream snare drum take shape before your eyes.
          </p>
          <ul className="description-list">
            <li>Shell Construction: Stave, Steam-Bent, or Hybrid</li>
            <li>Fully Customizable: Size, Lugs, Finish, Wood</li>
            <li>Hands-on experience: Consultation + Concept Renders</li>
            {/* <li>Starting Price: <strong>$1,250</strong></li> */}
          </ul>
        </div>
        <div className="drum-layer">
          <img src="/artisan-shop/soundlegend-left.png" alt="SoundLegend Snare" />
        </div>
      </section>

      {/* 🏆 FINAL IMAGE SECTION - DRUM LINEUP & DETAILS BELOW */}
      <section className="drum-final-section">
        <div className="drum-final-image">
          <img src="/artisan-shop/render-10.png" alt="All three drum models" />
        </div>

        <div className="drum-final-text">
          {/* HERITAGE */}
          <div className="drum-info">
            <img src="/artisanseries/heritage-white.png" alt="Heritage" className="drum-logo" />
            <ul className="description-list">
              <li>Shell Construction: Stave</li>
              <li>Available Sizes: 12”, 13”, 14”</li>
              <li>Finish: Natural semi-gloss, Torch-scorched aesthetic</li>
              <li>Wood Selection: Northern Red Oak</li>
              {/* <li>Starting Price: <strong>$850</strong></li> */}
            </ul>
            <button
className={product?.currentQuantity === 0 ? "prod-card-view-details-button" : "preorder-card-preorder-button"}
              onClick={() => navigate("/products/heritage")} key="artisanseries-final-section-button"
            >
              {preOrderButton}
            </button>
          </div>

          {/* SOUNDLEGEND */}
          <div className="drum-info">
            <img src="/artisanseries/soundlegend-white.png" alt="SoundLegend" className="drum-logo" />
            <ul className="description-list">
              <li>Shell Construction: Stave, Steam-Bent, or Hybrid</li>
              <li>Fully Customizable: Size, Lugs, Finish, Wood</li>
              <li>Unforgettable Experience: Consultation + Concept Renders, Special Web Access, Swag, and more! </li>
              {/* <li>Starting Price: <strong>$1,250</strong></li> */}
            </ul>
            <button
              className={product.currentQuantity === 0 ? "prod-card-view-details-button" : "preorder-card-preorder-button"}
              onClick={() => navigate("/products/soundlegend")}
            >
              Learn More
            </button>
          </div>

          {/* FEUZØN */}
          <div className="drum-info">
            <img src="/artisanseries/feuzon-white.png" alt="Feuzon" className="drum-logo" />
            <ul className="description-list">
              <li>Shell Construction: Stave + Steam Bent</li>
              <li>Available Sizes: 12”, 13”, 14”</li>
              <li>Finish: Natural or Stained</li>
              <li>Wood Selection: Stave (varied) + limited steam bent woods</li>
              {/* <li>Starting Price: <strong>$1,050</strong></li> */}
            </ul>
            <button
              className={product.currentQuantity === 0 ? "prod-card-view-details-button" : "preorder-card-preorder-button"}
              onClick={() => navigate("/products/feuzon")}
            >
              {preOrderButton}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ArtisanSeries;