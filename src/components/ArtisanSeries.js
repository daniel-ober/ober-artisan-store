import React from "react";
import "./ArtisanSeries.css";

const ArtisanSeries = () => {
  return (
    <div className="artisanseries-container">
      {/* HERÌTAGE Series Section */}
      <section className="drum-section left">
        <div className="text-layer">
        
          <img src="/artisanseries/heritage-black.png" alt="HERÌTAGE Series" className="header-image" />
          <p className="description">
            <strong>“The drum that started it all—classic craftsmanship, timeless sound.”</strong>
          </p>
          <p className="description">
            The HERÌTAGE Series embodies the soul of hand-crafted percussion. Designed and built in Nashville, TN, this stave snare drum is a testament to the artistry and dedication behind every Ober Artisan Drum.
            Each stave is meticulously hand-tuned using an exclusive torch tuning process, bringing out the natural resonance and warmth of the wood while enhancing its striking scorched finish.
            Available in multiple stave configurations and carefully selected wood species, the HERÌTAGE Series delivers a dynamic response, crisp attack, and balanced tonal complexity.
          </p>
          <ul className="description-list">
            <li>Shell Construction: Stave</li>
            <li>Available Sizes: 12”, 13”, 14”</li>
            <li>Stave Configurations: 16, 20, or 10 staves</li>
            <li>Finish: Light gloss, Medium gloss, Torch-scorched aesthetic</li>
            <li>Wood Selection: Oak + compatible woods</li>
            <li>Price Range: <strong>$850 - $1,100</strong></li>
          </ul>
        </div>
        <div className="drum-layer">
          <img src="/artisan-shop/heritage-left.png" alt="HERÌTAGE Snare" />
        </div>
      </section>

      {/* FEUZØN Series Section */}
      <section className="drum-section right">
        <div className="text-layer">
          <img src="/artisanseries/feuzon-black.png" alt="FEUZØN Series" className="header-image" />
          <p className="description">
            <strong>“Blending tradition and innovation into one harmonious voice.”</strong>
          </p>
          <p className="description">
            The FEUZØN Series is a revolutionary hybrid snare drum that fuses the precision of stave construction with the controlled resonance of a vapor (steam) bent outer shell.
            This innovative design enhances warmth, articulation, and dynamic response, offering a snare drum unlike any other. Each drum is torch-tuned to refine its sonic character, bringing out the rich harmonics and bold presence that drummers crave.
          </p>
          <ul className="description-list">
            <li>Shell Construction: Stave + Vapor Bent</li>
            <li>Available Sizes: 12”, 13”, 14”</li>
            <li>Finish: Natural or Stained</li>
            <li>Wood Selection: Stave (varied) + limited vapor bent woods</li>
            <li>Price Range: <strong>$1,100 - $1,350</strong></li>
          </ul>
        </div>
        <div className="drum-layer">
          <img src="/artisan-shop/feuzon-right.png" alt="FEUZØN Snare" />
        </div>
      </section>

      {/* SoundLegend Series Section */}
      <section className="drum-section left">
        <div className="text-layer">
          <img src="/artisanseries/soundlegend-black.png" alt="SoundLegend Series" className="header-image" />
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
            <li>Price Range: <strong>$1,500 - $2,500+</strong></li>
          </ul>
        </div>
        <div className="drum-layer">
          <img src="/artisan-shop/soundlegend-left.png" alt="SoundLegend Snare" />
        </div>
      </section>

      {/* 🆕 FINAL IMAGE SECTION WITH ALL 3 DRUMS */}
      <section className="drum-final-section">
        <div className="drum-final-text">
          <img
            src="/artisanseries/heritage-white.png"
            alt="Heritage"
            className="drum-label-img heritage"
          />
          <img
            src="/artisanseries/soundlegend-white.png"
            alt="Soundlegend"
            className="drum-label-img soundlegend"
          />
          <img
            src="/artisanseries/feuzon-white.png"
            alt="Feuzon"
            className="drum-label-img feuzon"
          />
        </div>
        <div className="drum-final-image">
          <img src="/artisan-shop/render-4.png" alt="All three drum models" />
        </div>
      </section>


      <section className="drum-final-section">
        <div className="drum-final-text">
          <img
            src="/artisanseries/heritage-white.png"
            alt="Heritage"
            className="drum-label-img heritage"
          />
          <img
            src="/artisanseries/soundlegend-white.png"
            alt="Soundlegend"
            className="drum-label-img soundlegend"
          />
          <img
            src="/artisanseries/feuzon-white.png"
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