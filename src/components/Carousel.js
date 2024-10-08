import React, { useState } from 'react';
import './Carousel.css';

const Carousel = ({ items }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNext = () => {
    setActiveIndex((prevIndex) => (prevIndex === items.length - 1 ? 0 : prevIndex + 1));
  };

  const handlePrev = () => {
    setActiveIndex((prevIndex) => (prevIndex === 0 ? items.length - 1 : prevIndex - 1));
  };

  return (
    <div className="carousel">
      <div className="carousel-track-container">
        <div
          className="carousel-track"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {items.map((item, index) => (
            <div key={index} className={`carousel-item ${index === activeIndex ? 'active' : ''}`}>
              <img src={item.image} alt={item.title} />
              <h1>{item.title}</h1>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="carousel-controls">
        <button className="carousel-button" onClick={handlePrev}>
          <img
            src="https://i.imgur.com/SVTmyJj.png"
            alt="Previous"
            className="carousel-icon prev"
          />
        </button>
        <button className="carousel-button" onClick={handleNext}>
          <img
            src="https://i.imgur.com/ipmhid6.png"
            alt="Next"
            className="carousel-icon next"
          />
        </button>
      </div>
    </div>
  );
};

export default Carousel;
