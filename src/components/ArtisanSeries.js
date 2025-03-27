import React, { useState, useContext, useEffect, useRef } from "react";
import "./ArtisanSeries.css";
import { DarkModeContext } from "../context/DarkModeContext";

const DRUM_SERIES = [
  {
    id: "heritage",
    name: "HERITAGE",
    logo: "/resized-logos/heritage-white.png",
    overlay: "/artisanseries-bottom-layers/top-layer-left-drum-highlighted.png",
    quote: "“The drum that started it all—classic craftsmanship, timeless sound.”",
    description:
      "The HERITAGE Series embodies the soul of hand-crafted percussion. Designed and built in Nashville, TN, this stave snare drum is a testament to the artistry and dedication behind every Ober Artisan Drum. Each stave is meticulously hand-tuned using an exclusive torch tuning process, bringing out the natural resonance and warmth of the wood while enhancing its striking scorched finish. Available in multiple stave configurations and carefully selected Oak, the HERITAGE Series delivers a dynamic response, crisp attack, and balanced tonal complexity.",
    specs: [
      "Shell Construction: Stave",
      "Available Sizes: 12”, 13”, 14”",
      "Finish: Light gloss, Medium gloss, Torch-scorched aesthetic",
      "Wood Selection: Northern Red Oak",
    ],
    images: [
      "https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/artisan%2Fheritage%2F14x6.20-stave%2Fimages%2FIMG_6123.png?alt=media&token=9511873e-1ccb-43cb-9e91-1494c2f09f9b",
      "https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/artisan%2Fheritage%2F14x6.20-stave%2Fimages%2FIMG_9087.jpeg?alt=media&token=056bcb03-b839-43ce-815e-46b1c26d16c5",
    ],
    audioSamples: [
      {
        name: "Dry Hit - Snares On",
        url: "https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/artisan%2Fheritage%2F14x6.20-stave%2Fwave%2FIMG_5847.78.wav?alt=media&token=5399e30f-d688-4837-bd13-fb3f0cefe6c5",
      },
      {
        name: "Dry Hit - Snares Off",
        url: "https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/artisan%2Fheritage%2F14x6.20-stave%2Fwave%2Fsnaresoff.wav?alt=media&token=b8b5809f-d324-44e2-a479-a2474ca4a7c7",
      },
      {
        name: "Rimshot - Snares On",
        url: "https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/artisan%2Fheritage%2F14x6.20-stave%2Fwave%2Fsnares-withrim.wav?alt=media&token=1d59600b-c2fe-45c8-84bd-1d530d5471b1",
      },
      {
        name: "Rimshot - Snares Off",
        url: "https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/artisan%2Fheritage%2F14x6.20-stave%2Fwave%2Fsnaresoff-rim.wav?alt=media&token=217767bf-7b2e-4b93-9e5b-28903c3763bf",
      },
      {
        name: "Sidestick - Full",
        url: "https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/artisan%2Fheritage%2F14x6.20-stave%2Fwave%2FIMG_5847.57.wav?alt=media&token=58c9dae6-1c99-4ad6-a921-f43897697623",
      },
      {
        name: "Sidestick - Soft",
        url: "https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/artisan%2Fheritage%2F14x6.20-stave%2Fwave%2FIMG_5847.23.wav?alt=media&token=b952a02e-7228-4767-860d-c6d0e36b36ec",
      },
      {
        name: "Sidestick - Thin",
        url: "https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/artisan%2Fheritage%2F14x6.20-stave%2Fwave%2Fclick-thin.wav?alt=media&token=ac5007d1-5f97-4713-a29a-b8cbd7482894",
      },
    ],
  },
  {
    id: "feuzon",
    name: "FEUZØN",
    logo: "/resized-logos/feuzon-white.png",
    overlay: "/artisanseries-bottom-layers/top-layer-right-drum-highlighted.png",
    quote: "“Blending tradition and innovation into one harmonious voice.”",
    description:
      "The FEUZØN Series is a revolutionary hybrid snare drum that fuses the precision of stave construction with the controlled resonance of a steam bent outer shell. This innovative design enhances warmth, articulation, and dynamic response, offering a snare drum unlike any other. Each drum is torch-tuned to refine its sonic character, bringing out the rich harmonics and bold presence that drummers crave.",
    specs: [
      "Shell Construction: Hybrid (Stave + Steam Bent)",
      "Available Sizes: 12”, 13”, 14”",
      "Finish: Natural or Stained",
      "Wood Selection: Stave (varied) + limited steam bent woods",
    ],
    images: [],
    audioSamples: [],
  },
  {
    id: "soundlegend",
    name: "SOUNDLEGEND",
    logo: "/resized-logos/soundlegend-white.png",
    overlay: "/artisanseries-bottom-layers/top-layer-middle-drum-highlighted.png",
    quote: "“Every drum tells a story—let’s craft yours together.”",
    description:
      "The SoundLegend Series is more than just a drum—it’s an experience. Designed for drummers who want to collaborate directly with a master artisan, this fully custom shop offering gives you the freedom to explore new sonic possibilities. Through a hands-on process that includes consultation calls, high-resolution concept renders, and build updates, you’ll watch your dream snare drum take shape before your eyes.",
    specs: [
      "Shell Construction: Stave, Steam-Bent, or Hybrid",
      "Fully Customizable: Size, Lugs, Finish, Wood",
      "Hands-on experience: Consultation + Concept Renders",
    ],
    images: [],
    audioSamples: [],
  },
];

const ArtisanSeries = () => {
  const { isDarkMode } = useContext(DarkModeContext);
  const [activeIndex, setActiveIndex] = useState(0);
  const footerRef = useRef(null);
  const [isFooterVisible, setFooterVisible] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (footerRef.current) observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  const active = DRUM_SERIES[activeIndex];

  const playAudio = (url) => {
    const audio = new Audio(url);
    audio.play();
  };

  return (
    <>
      <div className="artisanseries-container">
        <div className="drum-display">
          <div className="text-layer">
            <img src={active.logo} alt={active.name} className="artisanseries-header-image" />
            <p className="description"><strong>{active.quote}</strong></p>
            <p className="description">{active.description}</p>
            <ul className="description-list">
              {active.specs.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>

            {/* 📸 Image Gallery */}
            {active.images?.length > 0 && (
              <div className="gallery-strip">
                {active.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`Drum image ${i}`}
                    onClick={() => setLightboxImg(img)}
                  />
                ))}
              </div>
            )}

            {/* 🎧 Audio Samples */}
            {active.audioSamples?.length > 0 && (
              <div className="audio-samples">
                {active.audioSamples.map((sample, i) => (
                  <div className="audio-sample-item" key={i}>
                    <button onClick={() => playAudio(sample.url)}>▶</button>
                    <span>{sample.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 🥁 Drum Layers */}
        <div className={`drum-layers ${isFooterVisible ? "scrolling" : "fixed"}`}>
          <img src="/artisanseries-bottom-layers/base-layer-bottom.png" alt="Base Bottom" className="layer" />
          <img src="/artisanseries-bottom-layers/base-layer-front.png" alt="Base Front" className="layer" />
          <img src={active.overlay} alt="Overlay" className="layer" />
        </div>

        {/* 🔘 Click Zones */}
        <div className="drum-click-zones">
          <div className="zone left" onClick={() => setActiveIndex(0)} />
          <div className="zone middle" onClick={() => setActiveIndex(2)} />
          <div className="zone right" onClick={() => setActiveIndex(1)} />
        </div>
      </div>

      {/* 📌 Footer Visibility Trigger */}
      <div ref={footerRef} className="footer-trigger-marker" />

      {/* 🔍 Lightbox Modal */}
      {lightboxImg && (
        <div className="lightbox" onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} alt="Enlarged Drum" />
        </div>
      )}
    </>
  );
};

export default ArtisanSeries;