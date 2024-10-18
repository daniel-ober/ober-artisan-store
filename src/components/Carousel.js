import React, { useState, useRef } from 'react';
import './Carousel.css';

const Carousel = ({ items }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [startX, setStartX] = useState(0);
  const carouselRef = useRef(null);

  const handlePreviewClick = (index) => {
    setActiveIndex(index);
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
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      role="region" // Added role for accessibility
      aria-label="Image carousel" // Added ARIA label for accessibility
    >
      <div className="carousel-track-container">
        <div className="carousel-track">
          {/* Previous Preview Item */}
          <button
            className="preview-item previous-preview"
            onClick={() => handlePreviewClick((activeIndex - 1 + items.length) % items.length)}
            tabIndex="0"
            aria-label={`Previous: ${items[(activeIndex - 1 + items.length) % items.length]?.title}`}
          >
            {items[(activeIndex - 1 + items.length) % items.length] && (
              <>
                <img
                  src={items[(activeIndex - 1 + items.length) % items.length].image}
                  alt={items[(activeIndex - 1 + items.length) % items.length].title}
                />
                <h2>{items[(activeIndex - 1 + items.length) % items.length]?.title}</h2>
              </>
            )}
          </button>

          {/* Active Item */}
          <button
            className="carousel-item active"
            onClick={() => handlePreviewClick(activeIndex)}
            tabIndex="0"
            aria-label={`Current: ${items[activeIndex]?.title}`}
          >
            <img src={items[activeIndex].image} alt={items[activeIndex].title} />
            <h1>{items[activeIndex]?.title}</h1>
            <p>{items[activeIndex]?.description}</p>
          </button>

          {/* Next Preview Item */}
          <button
            className="preview-item next-preview"
            onClick={() => handlePreviewClick((activeIndex + 1) % items.length)}
            tabIndex="0"
            aria-label={`Next: ${items[(activeIndex + 1) % items.length]?.title}`}
          >
            {items[(activeIndex + 1) % items.length] && (
              <>
                <img
                  src={items[(activeIndex + 1) % items.length].image}
                  alt={items[(activeIndex + 1) % items.length].title}
                />
                <h2>{items[(activeIndex + 1) % items.length]?.title}</h2>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Carousel;
