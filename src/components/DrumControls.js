import React from 'react';

function DrumControls({ drumSpecs, setDrumSpecs }) {
  // Handle changes in the drumSpecs inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setDrumSpecs((prevSpecs) => ({
      ...prevSpecs,
      [name]: value ? parseInt(value, 10) : 0,
    }));
  };

  return (
    <div className="controls">
      <label>Attack: {drumSpecs?.attack ?? 5}</label>
      <input
        type="range"
        name="attack"
        min="1"
        max="10"
        value={drumSpecs?.attack ?? 5}
        onChange={handleChange}
      />

      <label>Sustain: {drumSpecs?.sustain ?? 5}</label>
      <input
        type="range"
        name="sustain"
        min="1"
        max="10"
        value={drumSpecs?.sustain ?? 5}
        onChange={handleChange}
      />

      <label>Warmth: {drumSpecs?.warmth ?? 5}</label>
      <input
        type="range"
        name="warmth"
        min="1"
        max="10"
        value={drumSpecs?.warmth ?? 5}
        onChange={handleChange}
      />

      <label>Projection: {drumSpecs?.projection ?? 5}</label>
      <input
        type="range"
        name="projection"
        min="1"
        max="10"
        value={drumSpecs?.projection ?? 5}
        onChange={handleChange}
      />

      <label>Brightness: {drumSpecs?.brightness ?? 5}</label>
      <input
        type="range"
        name="brightness"
        min="1"
        max="10"
        value={drumSpecs?.brightness ?? 5}
        onChange={handleChange}
      />
    </div>
  );
}

// Set default props to avoid undefined errors
DrumControls.defaultProps = {
  drumSpecs: {
    attack: 5,
    sustain: 5,
    warmth: 5,
    projection: 5,
    brightness: 5,
  },
  setDrumSpecs: () => {}, // No-op function if none is provided
};

export default DrumControls;