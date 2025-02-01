import React from "react";
import "./About.css";

const About = () => {
  const sections = [
    {
      title: "The Birth of a Dream",
      subtitle: "Every great story begins with a spark.",
      content:
        "In a quiet workshop surrounded by the scent of fresh-cut wood, Dan Ober found his calling. What began as a hobby turned into a passion, and what started as a dream became a legacy. This is the story of creating drums that resonate with the soul.",
    },
    {
      title: "Crafting with Purpose",
      subtitle: "Precision meets passion.",
      content:
        "Every drum begins as an idea—a sketch on a page, a vision waiting to take form. From selecting the finest woods to shaping each curve with care, the process is a labor of love. These are not just instruments; they are works of art.",
    },
    {
      title: "The Rhythm of Inspiration",
      subtitle: "Every beat tells a story.",
      content:
        "The sound of a drum is more than a rhythm; it’s a heartbeat. Dan Ober’s drums are designed to inspire—to give musicians a voice that speaks to the world. Every beat is a story waiting to be told.",
    },
    {
      title: "The Legacy Continues",
      subtitle: "Building for the future.",
      content:
        "Dan Ober Artisan Drums is more than a brand; it’s a commitment to craftsmanship and artistry. Every drum is built to last, to inspire, and to connect. This is just the beginning of the journey.",
    },
  ];

  return (
    <div
      className="about-page"
      style={{
        backgroundImage: `url(${process.env.PUBLIC_URL}/about/about-1.png)`,
      }}
    >
      {sections.map((section, index) => (
        <div key={index} className="about-section">
          <div className="section-content">
            <h2>{section.title}</h2>
            <h3>{section.subtitle}</h3>
            <p>{section.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default About;