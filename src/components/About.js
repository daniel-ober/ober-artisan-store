import React from "react";
import "./About.css";

const About = () => {
  return (
    <div className="about-container">
  {/* <div className="about-banner">
    <img src="/about2.png" alt="About banner" />
  </div> */}
      <div className="about-inner">
        <div className="about-text">
          <h1>The Story Behind the Sound</h1>
          <p>
            Ober Artisan Drums is a boundary-pushing instrument company born from a deep reverence for sonic detail, craftsmanship, and individuality. Based in Nashville, Tennessee, each drum is designed and handcrafted to serve not just as a percussive tool — but as a meaningful extension of the artist behind it.
          </p>
          <p>
            Every shell is engineered with intention. Each curve, each bearing edge, each finish — selected and shaped to evoke a specific voice. These are not mass-produced instruments. They are built for drummers who demand more — more character, more clarity, more connection to their sound.
          </p>
          <p>
            Ober Artisan Drums was founded by a lifelong drummer, composer, and builder who studied Film Scoring and Composition at Berklee College of Music. With over 30 years of experience behind the kit, he trained under some of the industry’s most respected names — including Mike Mangini and Kim Plainfield — and brings a background in recording, sound design, engineering, and web development into every aspect of the process.
          </p>
          <p>
            From cinematic snare textures and high-fidelity studio builds, to signature custom models and collaborative design paths — Ober offers a catalog that speaks to session players, touring artists, film composers, and sonic explorers alike.
          </p>
          <p>
            Ober Artisan Drums is more than an instrument brand — it’s a space for creative partnerships, evolving design language, and an unapologetically personal approach to sound.
          </p>
        </div>
      </div>

      <div className="about-signoff">
  <div className="about-signoff-inner">
    <img src="/about/dan-ober-founder.png" alt="Founder portrait" />
    <div className="about-quote">
      <p className="quote-text">
        "Every instrument I send into the world is a reflection of the standard I hold myself to — sonically, visually, and spiritually. This work is a responsibility and a privilege. If it bears the Ober name, it has to speak with truth."
      </p>
      <p className="quote-author">— Founder, Ober Artisan Drums</p>
    </div>
  </div>
</div>
    </div>
  );
};

export default About;