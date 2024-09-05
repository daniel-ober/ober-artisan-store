import React from 'react';
import './About.css';

const Carousel = ({ sections }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const handleSwipe = (direction) => {
    const maxIndex = sections.length - 1;
    if (direction === 'left') {
      setCurrentIndex((prevIndex) => Math.min(prevIndex + 1, maxIndex));
    } else if (direction === 'right') {
      setCurrentIndex((prevIndex) => Math.max(prevIndex - 1, 0));
    }
  };

  const translateX = `-${currentIndex * 100}%`;

  return (
    <div className="about-carousel">
      <div className="carousel">
        <div
          className="carousel-inner"
          style={{ transform: `translateX(${translateX})` }}
        >
          {sections.map((section, index) => (
            <div
              key={index}
              className={`carousel-card ${currentIndex === index ? 'active' : ''}`}
            >
              <div className="carousel-image">
                <img src={section.image} alt={section.title} />
              </div>
              <h1>{section.title}</h1>
              <p>{section.description}</p>
            </div>
          ))}
        </div>
        <div className="carousel-controls">
          {currentIndex > 0 && (
            <button onClick={() => handleSwipe('right')} className="carousel-button">
              ←
            </button>
          )}
          {currentIndex < sections.length - 1 && (
            <button onClick={() => handleSwipe('left')} className="carousel-button">
              →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const About = () => {
  const sections = [
    {
      title: "About Dan Ober Artisan Drums",
      description: "I'm Dan Ober, a lifelong competitor, artist, and craftsman. My journey has always been about pushing boundaries – in life, art, and drumming. With inspirations drawn from grit, nature, and perseverance, I strive to craft one-of-a-kind drums that tell a story as raw and real as the musicians who play them.",
      image: "https://i.imgur.com/R34mmJi.jpeg" // Choose appropriate image
    },
    {
      title: "My Process",
      description: "Crafted with a meticulous eye for detail, my drums combine traditional methods with innovative designs. I select only the finest materials, ensuring that each drum not only sounds incredible but also inspires unmatched self-expression. The process is a blend of passion and craftsmanship, bringing forth the best qualities in every piece.",
      image: "https://i.imgur.com/248CyuT.jpeg" // Choose appropriate image
    },
    {
      title: "Why Choose Dan Ober Artisan?",
      description: "My drums are for those who seek something truly unique. Each piece is a work of art, made with love, dedication, and a commitment to the highest quality. Whether you're a collector or a serious musician, these drums are built to perform and to last, offering an unparalleled drumming experience.",
      image: "https://i.imgur.com/FuGcdM8.jpeg" // Choose appropriate image
    }
  ];

  return (
    <div className="about-page">
      <Carousel sections={sections} />
    </div>
  );
};

export default About;
