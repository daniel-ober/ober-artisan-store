import React, { useState } from "react";
import "./SoundlegendProductDetail.css";

const SoundLegendProductDetail = () => {
  // User Details
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Custom Snare Specifications
  const [size, setSize] = useState("14");
  const [depth, setDepth] = useState("6.5");
  const [shellConstruction, setShellConstruction] = useState("Stave");
  const [woodSpecies, setWoodSpecies] = useState("Maple");
  const [lugs, setLugs] = useState("10");
  const [snareBedDepth, setSnareBedDepth] = useState("Medium");
  const [consultationDate, setConsultationDate] = useState("");

  // Full list of available wood species (from previous discussions)
  const woodSpeciesOptions = [
    "Maple", "Birch", "Walnut", "Mahogany", "Cherry", "Oak",
    "Bubinga", "Zebrawood", "Padauk", "Ash", "Wenge", "Purpleheart", "Other",
  ];

  // Snare Bed Descriptions
  const snareBedDescriptions = {
    Small: "A shallow snare bed results in more sensitivity and crisp articulation, ideal for jazz and orchestral applications.",
    Medium: "A balanced snare bed depth provides a blend of sensitivity and projection, making it versatile for multiple styles.",
    Large: "A deeper snare bed offers enhanced snare response and reduces sympathetic buzz, great for high-energy playing and rimshot-heavy styles.",
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting Custom SoundLegend Snare Build:", {
      firstName,
      lastName,
      email,
      phone,
      size,
      depth,
      shellConstruction,
      woodSpecies,
      lugs,
      snareBedDepth,
      consultationDate,
    });
    alert("Your custom snare request has been submitted! We'll be in touch soon.");
  };

  return (
    <div className="soundlegend-product-detail">
      <h1>The SoundLegend Experience</h1>

      {/* 🔥 SoundLegend Experience Section */}
      <div className="soundlegend-experience">
        <p>
          The SoundLegend Series is more than just a drum—it’s an experience. Designed for drummers who want to collaborate directly with the artisan, <strong>Dan Ober</strong>, this custom shop offering gives you the freedom to explore endless sonic possibilities and original design concepts.
        </p>
        <p>
          Through an unforgettable experience that includes personalized consultation, high-resolution concept renders, special web access, and behind-the-scenes video and images, you’ll watch your dream snare drum take shape before your eyes. <strong>There’s a legend in you.</strong>
        </p>
      </div>

      <div className="soundlegend-product-content">
        {/* 📌 Left Side: Product Image */}
        <div className="soundlegend-product-image">
          <img
            src="https://firebasestorage.googleapis.com/v0/b/danoberartisandrums-dev.firebasestorage.app/o/Gallery%2Fnew%2014%20v19.png?alt=media&token=57f2dd11-9649-4c15-a4b2-28e2e6731b70"
            alt="SOUNDLEGEND Snare Drum"
          />
        </div>

        {/* 📌 Right Side: Custom Build Form */}
        <div className="soundlegend-product-options">
          <div className="soundlegend-features">
            <h2>Build Your Custom SoundLegend Snare</h2>
            <p>Fill out the form below to design your ultimate snare drum and schedule your free consultation.</p>
          </div>

          <h2>Customer Information</h2>
          <form onSubmit={handleSubmit}>
            {/* First Name */}
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />

            {/* Last Name */}
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />

            {/* Email */}
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {/* Phone */}
            <label htmlFor="phone">Phone</label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />

            <h2>Custom Build Details</h2>

            {/* Snare Size */}
            <label htmlFor="size">Snare Size (Diameter)</label>
            <select id="size" value={size} onChange={(e) => setSize(e.target.value)}>
              {["10","12", "13", "14", "15"].map((option) => (
                <option key={option} value={option}>{option}&quot;</option>
              ))}
            </select>

            {/* Snare Depth */}
            <label htmlFor="depth">Depth</label>
            <select id="depth" value={depth} onChange={(e) => setDepth(e.target.value)}>
              {["3.0","3.5","4.0","4.5","5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0", "Other"].map((option) => (
                <option key={option} value={option}>{option}&quot;</option>
              ))}
            </select>

            {/* Shell Construction Type */}
            <label htmlFor="shellConstruction">Shell Construction</label>
            <select id="shellConstruction" value={shellConstruction} onChange={(e) => setShellConstruction(e.target.value)}>
              {["Stave", "Steam Bent", "Hybrid FEUZØN (Stave + Steam Bent)"].map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>

            {/* Wood Species Selection */}
            <label htmlFor="woodSpecies">Wood Species</label>
            <select id="woodSpecies" value={woodSpecies} onChange={(e) => setWoodSpecies(e.target.value)}>
              {woodSpeciesOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>

            {/* Snare Bed Depth */}
            <label htmlFor="snareBedDepth">Snare Bed Depth</label>
            <select id="snareBedDepth" value={snareBedDepth} onChange={(e) => setSnareBedDepth(e.target.value)}>
              {Object.keys(snareBedDescriptions).map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <p className="snare-bed-description">{snareBedDescriptions[snareBedDepth]}</p>

            {/* Consultation Booking Placeholder */}
            <label htmlFor="consultationDate">Book a Free Consultation</label>
            <input
              type="text"
              id="consultationDate"
              placeholder="Select a date (Placeholder - Calendar integration coming)"
              value={consultationDate}
              onChange={(e) => setConsultationDate(e.target.value)}
            />

            {/* Submit Button */}
            <button type="submit">Submit Custom Request</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SoundLegendProductDetail;