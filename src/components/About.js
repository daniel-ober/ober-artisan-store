import React from 'react';
import Carousel from './Carousel';
import './About.css';

const About = () => {
  const carouselItems = [
    {
      image: 'https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/About%2Fthe-craftsman-2.png?alt=media&token=18575b92-6e04-404a-9e31-d93c0ec8d6bf',
      title: 'The Craftsman',
      description: 'Dan’s journey into the world of drumming began with a profound passion for music, but it was not limited to just drumming. While drumming is Dan’s primary focus, his versatility extends to guitar, singing, keyboard, and more. His formal education in Film Scoring and Composition at Berklee College of Music allowed him to study under some of the industry’s finest, including Mike Mangini (Dream Theater, Steve Vai) and Kim Plainfield (Bill Connors, Pointer Sisters). With a decade of experience performing in a bar and wedding band, Dan honed his skills and developed a deep understanding of music before moving to Nashville to fully immerse himself in his true love—drumming. This rich background fuels Dan’s craftsmanship, blending technical expertise with a profound artistic vision to create drums that are not only functional but also resonant with both quality and emotion.',
    },
    {
      image:
        'https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/About%2Ftoastforbreakfast.png?alt=media&token=959e8e5e-b119-4aa2-8a08-3c75adeb71f4',
      title: 'The Process',
      description:
        'Dan’s approach to drum building is a meticulous blend of traditional techniques and modern innovation. From his first 14" 10-stave snare drum made of oak to advanced custom designed 3D-printed tools, Dan’s process involves careful design, craftsmanship, and personal attention. Each drum is constructed with precision and passion, reflecting Dan’s dedication to producing instruments that resonate with both quality and artistry.',
    },
    {
      image: 'https://i.imgur.com/7sXi5LE.jpeg',
      title: 'The Result',
      description:
        'Dan Ober Artisan Drums stand apart for their individuality, quality, and attention to detail. Each drum is a functional work of art, crafted with passion for those who value originality and creativity. Designed for those who know what they want, these drums are for the risk-takers, the serious musicians, and collectors who seek inspiration through their instruments. They are more than drums—they are the heart of rhythm, built to inspire unmatched self-expression.',
    },
  ];

  return (
    <div className="about-page">
      <h2>About Dan Ober Artisan</h2>
      <Carousel items={carouselItems} />
    </div>
  );
};

export default About;
