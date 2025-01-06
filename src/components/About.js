import React from 'react';
import './About.css';

const About = () => {
  const carouselItems = [
    {
      image: 'https://i.imgur.com/7sXi5LE.jpeg',
      title: 'The Birth of Dan Ober Artisan Drums',
      description:
        'In the world of music, there are instruments—and then there are instruments that carry a soul. Dan Ober Artisan Drums are born from a passion for craftsmanship and a desire to create drums that speak to the heart. These aren’t just tools; they are companions for those who crave authenticity, a canvas for expression, and a symbol of artistry in rhythm. Each drum is a journey—unique, purposeful, and designed to inspire.',
    },
    {
      image: 'https://i.imgur.com/7sXi5LE.jpeg',
      title: 'The Creative Spark',
      description:
        `Every masterpiece begins with a spark—an idea, a vision, a dream. Dan's design process begins with sketches, but what sets his creations apart is his dedication to blending artistry with unparalleled functionality. From the first line drawn to the final stroke of paint, every step tells the story of innovation and passion, capturing the essence of what it means to play a drum that’s more than just sound—it’s a work of art.`,
    },
    {
      image: 'https://i.imgur.com/7sXi5LE.jpeg',
      title: 'Crafting the Dream',
      description:
        'When a vision becomes reality, every decision matters. From selecting the perfect wood to crafting the intricate curves, Dan carefully plans each step, ensuring that the design speaks through every detail. Precision in execution is everything, as each cut, joint, and layer is made with intent. This is where passion meets perfection—a place where dreams are realized with every strike of the chisel and turn of the wheel.',
    },
    {
      image: 'https://i.imgur.com/7sXi5LE.jpeg',
      title: 'Refinement and Perfection',
      description:
        'No detail is too small. Once the drum takes shape, it’s time for the final stage of refinement—where the character of the instrument truly emerges. Through rigorous inspection and meticulous detailing, Dan ensures that every drum not only meets but exceeds the highest standards of craftsmanship and sound. It’s here that the story of each drum is fully realized, ready to resonate with its new owner.',
    },
    {
      image: 'https://i.imgur.com/7sXi5LE.jpeg',
      title: 'The Heart of Rhythm',
      description:
        'What makes a drum more than just an instrument? It’s the connection between the drummer and the rhythm, the voice of every musician’s soul. Dan Ober Artisan Drums are built to be more than just functional—they are crafted to ignite inspiration, allowing musicians to tell their own stories with every beat. Each drum is a journey, crafted to echo the heartbeat of those who play it.',
    },
    {
      image: 'https://i.imgur.com/7sXi5LE.jpeg',
      title: 'Meet the Visionary',
      description:
        'Behind every great creation is a visionary—a craftsman who pours their heart and soul into their work. Dan Ober isn’t just a craftsman; he’s a drummer, an artist, and a storyteller. His deep connection to rhythm and his mastery of woodworking allow him to create drums that are as unique as the musicians who play them. For Dan, crafting drums is more than a job—it’s a lifelong pursuit of artistry and passion, a dedication to creating instruments that will inspire the next generation of drummers.',
    }
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
