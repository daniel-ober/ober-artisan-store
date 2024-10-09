import React, { useState, useRef } from 'react';
import './Carousel.css';

const Carousel = ({ items }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [startX, setStartX] = useState(0);
  const carouselRef = useRef(null);

  const handlePreviewClick = (index) => {
    setActiveIndex(index);
  };

  const handleMouseDown = (e) => {
    setStartX(e.clientX);
    carouselRef.current.addEventListener('mousemove', handleMouseMove);
    carouselRef.current.addEventListener('mouseup', handleMouseUp);
    carouselRef.current.addEventListener('mouseleave', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    const moveX = e.clientX - startX;
    if (moveX > 50) {
      // Swipe right
      handlePreviewClick((activeIndex - 1 + items.length) % items.length);
      handleMouseUp(); // Cleanup event listeners
    } else if (moveX < -50) {
      // Swipe left
      handlePreviewClick((activeIndex + 1) % items.length);
      handleMouseUp(); // Cleanup event listeners
    }
  };

  const handleMouseUp = () => {
    carouselRef.current.removeEventListener('mousemove', handleMouseMove);
    carouselRef.current.removeEventListener('mouseup', handleMouseUp);
    carouselRef.current.removeEventListener('mouseleave', handleMouseUp);
  };

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    const moveX = e.touches[0].clientX - startX;
    if (moveX > 50) {
      // Swipe right
      handlePreviewClick((activeIndex - 1 + items.length) % items.length);
      e.preventDefault(); // Prevent scrolling
    } else if (moveX < -50) {
      // Swipe left
      handlePreviewClick((activeIndex + 1) % items.length);
      e.preventDefault(); // Prevent scrolling
    }
  };

  return (
    <div
      className="carousel"
      ref={carouselRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      <div className="carousel-track-container">
        <div className="carousel-track">
          {/* Previous Preview Item */}
          <div className="preview-item previous-preview" onClick={() => handlePreviewClick((activeIndex - 1 + items.length) % items.length)}>
            {items[(activeIndex - 1 + items.length) % items.length] && (
              <>
                <img
                  src={items[(activeIndex - 1 + items.length) % items.length].image}
                  alt={items[(activeIndex - 1 + items.length) % items.length].title}
                />
                <h2>{items[(activeIndex - 1 + items.length) % items.length]?.title}</h2>
              </>
            )}
          </div>

          {/* Active Item */}
          <div className="carousel-item active">
            <img src={items[activeIndex].image} alt={items[activeIndex].title} />
            <h1>{items[activeIndex]?.title}</h1>
            <p>{items[activeIndex]?.description}</p>
          </div>

          {/* Next Preview Item */}
          <div className="preview-item next-preview" onClick={() => handlePreviewClick((activeIndex + 1) % items.length)}>
            {items[(activeIndex + 1) % items.length] && (
              <>
                <img
                  src={items[(activeIndex + 1) % items.length].image}
                  alt={items[(activeIndex + 1) % items.length].title}
                />
                <h2>{items[(activeIndex + 1) % items.length]?.title}</h2>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Carousel;
