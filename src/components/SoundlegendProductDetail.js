import React, { useState } from 'react';
import { db } from '../firebaseConfig'; // Firestore config
import { collection, addDoc, Timestamp } from 'firebase/firestore'; // Firestore methods
import './SoundlegendProductDetail.css';

const SoundLegendProductDetail = () => {
  // User Details
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Custom Snare Specifications
  const [size, setSize] = useState('14');
  const [depth, setDepth] = useState('6.5');
  const [shellConstruction, setShellConstruction] = useState('Stave');
  const [woodSpecies, setWoodSpecies] = useState('Maple');
  const [snareBedDepth, setSnareBedDepth] = useState('Medium');
  const [consultationDate, setConsultationDate] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Full list of available wood species
  const woodSpeciesOptions = [
    'Maple',
    'Birch',
    'Walnut',
    'Mahogany',
    'Cherry',
    'Oak',
    'Bubinga',
    'Zebrawood',
    'Padauk',
    'Ash',
    'Wenge',
    'Purpleheart',
    'Other',
  ];

  // Snare Bed Depth Descriptions
  const snareBedDescriptions = {
    Small:
      'A shallow snare bed results in more sensitivity and crisp articulation, ideal for jazz and orchestral applications.',
    Medium:
      'A balanced snare bed depth provides a blend of sensitivity and projection, making it versatile for multiple styles.',
    Large:
      'A deeper snare bed offers enhanced snare response and reduces sympathetic buzz, great for high-energy playing and rimshot-heavy styles.',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const submissionData = {
      firstName,
      lastName,
      email,
      phone,
      size,
      depth,
      shellConstruction,
      woodSpecies,
      snareBedDepth,
      consultationDate,
      status: 'New',
      submittedAt: Timestamp.now(), // Firestore timestamp
    };

    try {
      // Save submission to Firestore
      await addDoc(collection(db, 'soundlegend_submissions'), submissionData);
      alert(
        "Your custom snare request has been submitted! We'll be in touch soon."
      );

      // Reset form fields
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setSize('14');
      setDepth('6.5');
      setShellConstruction('Stave');
      setWoodSpecies('Maple');
      setSnareBedDepth('Medium');
      setConsultationDate('');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Submission failed. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="soundlegend-product-detail">
             <img
            src="/resized-logos/soundlegend-white.png"
            alt="SOUNDLEGEND Series"
            className="artisanseries-header-image"
          />
      {/* 🔥 SoundLegend Experience Section */}
      <div className="soundlegend-product-content">
        {/* 📌 Left Side: Product Image */}

        <div
          className="soundlegend-product-image"
          role="button"
          tabIndex="0"
          onClick={() =>
            window.open('https://www.youtube.com/watch?v=PW28PjMCpxg', '_blank')
          }
          onKeyDown={(e) =>
            e.key === 'Enter' &&
            window.open('https://www.youtube.com/watch?v=PW28PjMCpxg', '_blank')
          }
          style={{ cursor: 'pointer' }}
        >
          <img
            src="https://firebasestorage.googleapis.com/v0/b/danoberartisandrums-dev.firebasestorage.app/o/Gallery%2FDrum%20Your%20Truth.16.png?alt=media&token=9ae6304b-91d1-42b6-9f7e-1ea4ed321e8f"
            alt="SOUNDLEGEND Experience"
          />
          <h2>Build Your Custom SoundLegend Snare</h2>
          <p>
            Your sound is unique—your snare should be too. The{' '}
            <strong>SoundLegend Series</strong> is a fully custom, handcrafted
            drum built to bring your artistic vision to life.
          </p>
          <p>
            In a one-on-one collaboration with{' '}
            <strong>Ober Artisan founder, Dan Ober</strong>, you'll design a
            snare drum that reflects your playing style and sonic identity. From
            premium wood selections to shell construction and finish, every
            detail is chosen by you and crafted to perfection.
          </p>
          <p>
            With high-resolution concept renderings, VIP access to
            behind-the-scenes content, and a personal consultation, you'll see
            your dream snare come to life before it even hits the workbench.
          </p>
          <p>
            This isn’t about picking from a catalog—it’s about crafting a
            one-of-a-kind snare that’s truly yours.
          </p>
          <p>
            <strong>Your Story. Your Sound. Your Legacy.</strong>
          </p>
          <p>
            <em>
              Limited spots available—secure your free consultation today.
            </em>
          </p>
        </div>

        {/* 📌 Right Side: Custom Build Form */}
        <div className="soundlegend-product-options">
          <div className="soundlegend-features">
            <h2>Key Features</h2>
            <ul>
              <li>Custom Handcrafted Snare Drum</li>
              <li>Collaborate directly with Artisan, Dan Ober</li>
              <li>High-Resolution Mockup Renders</li>
              <li>Special Web Access</li>
              <li>Limited Edition Gift</li>
              <li>A FREE Swag Item</li>
              <li>AND MORE!</li>
            </ul>
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

            {/* Phone Number with Country Flag Selector */}
            <label htmlFor="phone">Phone</label>
            <div className="phone-input-container">
              {/* <select
                id="countryCode"
                value={phone.startsWith("+1") ? "US" : "CA"}
                onChange={(e) => {
                  const country = e.target.value;
                  setPhone(country === "US" ? "+1 " : "+1 ");
                }}
                className="country-code-select"
              >
                <option value="US">🇺🇸 +1</option>
                <option value="CA">🇨🇦 +1</option>
              </select> */}

              <input
                type="tel"
                id="phone"
                value={phone.replace('+1 ', '')} // Remove "+1" from display in input field
                onChange={(e) => {
                  let input = e.target.value.replace(/\D/g, ''); // Remove non-numeric characters
                  if (input.length > 10) input = input.slice(0, 10); // Limit to 10 digits

                  // Format as xxx-xxx-xxxx
                  if (input.length >= 6) {
                    input = `${input.slice(0, 3)}-${input.slice(3, 6)}-${input.slice(6, 10)}`;
                  } else if (input.length >= 3) {
                    input = `${input.slice(0, 3)}-${input.slice(3)}`;
                  }

                  setPhone('+1 ' + input); // Keep "+1" stored but not displayed
                }}
                required
                placeholder="123-456-7890"
              />
            </div>
            <p className="phone-hint">Enter a valid 10-digit phone number.</p>

            {/* <h2>Select Core Build Details</h2> */}

            {/* Snare Size */}
            {/* <label htmlFor="size">Snare Size (Diameter)</label>
            <select
              id="size"
              value={size}
              onChange={(e) => setSize(e.target.value)}
            >
              {['10', '12', '13', '14', '15'].map((option) => (
                <option key={option} value={option}>
                  {option}&quot;
                </option>
              ))}
            </select> */}

            {/* Snare Depth */}
            {/* <label htmlFor="depth">Depth</label>
            <select
              id="depth"
              value={depth}
              onChange={(e) => setDepth(e.target.value)}
            >
              {[
                '3.5',
                '4.0',
                '4.5',
                '5.0',
                '5.5',
                '6.0',
                '6.5',
                '7.0',
                '7.5',
                '8.0',
                'Other',
              ].map((option) => (
                <option key={option} value={option}>
                  {option}&quot;
                </option>
              ))}
            </select> */}

            {/* Shell Construction */}
            {/* <label htmlFor="shellConstruction">Shell Construction</label>
            <select
              id="shellConstruction"
              value={shellConstruction}
              onChange={(e) => setShellConstruction(e.target.value)}
            >
              {[
                'Stave',
                'Steam Bent',
                'Hybrid FEUZØN (Stave + Steam Bent)',
              ].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select> */}

            {/* Wood Species */}
            {/* <label htmlFor="woodSpecies">Wood Species</label>
            <select
              id="woodSpecies"
              value={woodSpecies}
              onChange={(e) => setWoodSpecies(e.target.value)}
            >
              {woodSpeciesOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select> */}

            {/* Snare Bed Depth */}
            {/* <label htmlFor="snareBedDepth">Snare Bed Depth</label>
            <select id="snareBedDepth" value={snareBedDepth} onChange={(e) => setSnareBedDepth(e.target.value)}>
              {Object.keys(snareBedDescriptions).map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <p className="snare-bed-description">{snareBedDescriptions[snareBedDepth]}</p> */}

            {/* Consultation Date */}
            {/* <label htmlFor="consultationDate">Book a Free Consultation</label>
            <input type="text" id="consultationDate" placeholder="Select a date (Placeholder)" value={consultationDate} onChange={(e) => setConsultationDate(e.target.value)} /> */}

            {/* Submit Button */}
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Submitting...'
                : 'Start Your Custom Snare Journey'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SoundLegendProductDetail;
