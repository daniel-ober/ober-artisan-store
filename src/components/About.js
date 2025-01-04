import React, { useState, useEffect } from 'react';
import './About.css';

const About = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const sections = [
    {
      image: '/34.png',  // Image path corrected (remove /public)
      title: 'The Birth of Dan Ober Artisan Drums',
      description: 'In the world of music, there are instruments—and then there are instruments that carry a soul. Dan Ober Artisan Drums are born from a passion for craftsmanship and a desire to create drums that speak to the heart.',
    },
    {
      image: '/35.png',
      title: 'The Creative Spark',
      description: 'Every masterpiece begins with a spark—an idea, a vision. Dan blends artistry with functionality, ensuring each drum is not just played but experienced as a work of art.',
    },
  ];

  const handleScroll = () => {
    const scrollPosition = window.scrollY;
    const sectionHeight = window.innerHeight;
    const index = Math.round(scrollPosition / sectionHeight);
    setActiveIndex(index);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="about-page">
      {sections.map((section, index) => (
        <div
          key={index}
          className={`section ${index === activeIndex ? 'active' : ''}`}
          style={{
            backgroundImage: `url(${section.image})`,
            backgroundColor: section.image ? 'transparent' : '#222',
          }}
        >
          <div className="content-wrapper">
            <div className="content">
              <h1>{section.title}</h1>
              <p>{section.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default About;