import React from 'react';
import './About.css';

const About = () => {
  const carouselItems = [
    {
      image: 'https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/About%2Fthe-craftsman-2.png?alt=media&token=18575b92-6e04-404a-9e31-d93c0ec8d6bf',
      title: 'Dan Ober Artisan Drums',
      description:
        'Dan Ober Artisan Drums stand apart for their individuality, quality, and attention to detail. Each drum is a functional work of art, crafted with passion for those who value originality and creativity. Designed for those who know what they want, these drums are for the risk-takers, the serious musicians, and collectors who seek inspiration through their instruments. They are more than drums—they are the heart of rhythm, built to inspire unmatched self-expression.',
    },
    {
      image: 'https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/About%2Fthe-craftsman-2.png?alt=media&token=18575b92-6e04-404a-9e31-d93c0ec8d6bf',
      title: 'Drummer + Craftsman',
      description:
        'Crafting drums is not just a skill but an art. As a drummer and craftsman, Dan Ober combines his passion for music with expert woodworking techniques to create one-of-a-kind instruments that embody creativity and individuality.',
    },
    {
      image:
        'https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/About%2Ftoastforbreakfast.png?alt=media&token=959e8e5e-b119-4aa2-8a08-3c75adeb71f4',
      title: 'Concept + Design',
      description:
        'From initial concept sketches to the final drum, each piece tells a story. Dan’s design philosophy focuses on blending innovative artistry with top-notch functionality to inspire musicians worldwide.',
    },
    {
      image: 'https://i.imgur.com/7sXi5LE.jpeg',
      title: 'Planning + Execution',
      description:
        'Attention to detail is key in planning and executing each design. Every cut, joint, and finish is meticulously crafted to ensure the highest quality for every drum.',
    },
    {
      image: 'https://i.imgur.com/7sXi5LE.jpeg',
      title: 'Inspection + Detailing',
      description:
        'Each drum undergoes rigorous inspection and detailing, ensuring it meets the highest standards of craftsmanship and sound quality.',
    },
    {
      image: 'https://i.imgur.com/7sXi5LE.jpeg',
      title: 'Ready to Inspire',
      description:
        'The result is not just a drum—it’s a masterpiece. Built to inspire, each drum resonates with the heart of rhythm, allowing musicians to express themselves like never before.',
    },
  ];

  return (
    <div className="about-page">
      <h2>About Dan Ober Artisan Drums</h2>
      <div className="carousel-container">
        {carouselItems.map((item, index) => (
          <div className="carousel-item" key={index}>
            <img src={item.image} alt={item.title} />
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default About;
