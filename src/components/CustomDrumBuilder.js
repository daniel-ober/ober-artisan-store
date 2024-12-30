import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SpiderChart from './SpiderChart';
import drumData from '../data/woodSpecies'; // Import the entire drumData array directly
// import './CustomDrumBuilder.css';

const CustomDrumBuilder = () => {
  const [specs, setSpecs] = useState({
    construction: 'stave',
    wood: [{ species: 'Maple', percentage: 100 }],
    depth: 6.5,
    width: 14,
    bearingEdge: '45 degree',
    thickness: 8,
  });
  const [soundProfile, setSoundProfile] = useState({});

  // Handle changes in specifications
  const handleInputChange = (e, specType, index = null) => {
    const value = e.target.value;
    if (specType === 'wood') {
      const updatedWood = [...specs.wood];
      updatedWood[index][e.target.name] = value;
      setSpecs((prev) => ({
        ...prev,
        wood: updatedWood,
      }));
    } else {
      setSpecs((prev) => ({
        ...prev,
        [specType]: value,
      }));
    }
  };

  const addWoodSpecies = () => {
    setSpecs((prev) => ({
      ...prev,
      wood: [...prev.wood, { species: 'Maple', percentage: 100 }],
    }));
  };

  const removeWoodSpecies = (index) => {
    const updatedWood = [...specs.wood];
    updatedWood.splice(index, 1);
    setSpecs((prev) => ({
      ...prev,
      wood: updatedWood,
    }));
  };

  const calculateSoundProfile = () => {
    const profile = { Attack: 0, Sustain: 0, Warmth: 0, Projection: 0, Brightness: 0 };

    // Incorporating wood species percentages
    specs.wood.forEach((wood) => {
      const woodData = drumData.find((item) => item.woodSpecies.includes(wood.species));
      if (woodData) {
        profile.Attack += (woodData.soundProfile.attack || 0) * (wood.percentage / 100);
        profile.Sustain += (woodData.soundProfile.sustain || 0) * (wood.percentage / 100);
        profile.Warmth += (woodData.soundProfile.warmth || 0) * (wood.percentage / 100);
        profile.Projection += (woodData.soundProfile.projection || 0) * (wood.percentage / 100);
        profile.Brightness += (woodData.soundProfile.brightness || 0) * (wood.percentage / 100);
      }
    });

    // Incorporating shell construction (additional logic here for weighted values)
    const constructionData = drumData.find((item) => item.constructionType === specs.construction);
    if (constructionData) {
      profile.Attack += constructionData.soundProfile.attack * 0.25;
      profile.Sustain += constructionData.soundProfile.sustain * 0.25;
      profile.Warmth += constructionData.soundProfile.warmth * 0.25;
      profile.Projection += constructionData.soundProfile.projection * 0.25;
      profile.Brightness += constructionData.soundProfile.brightness * 0.25;
    }

    // Incorporating shell depth, width, and bearing edge (adjusted with weights)
    profile.Attack += (specs.depth / 10) * 0.1;
    profile.Sustain += (specs.width / 14) * 0.1;
    profile.Warmth += (specs.thickness / 8) * 0.1;

    const bearingEdgeData = {
      "45 degree": { attack: 2, sustain: 1, warmth: 0, projection: 1, brightness: 1 },
      "round over": { attack: 1, sustain: 2, warmth: 1, projection: 1, brightness: 1 },
      "30 degree": { attack: 3, sustain: 0, warmth: 2, projection: 2, brightness: 1 },
      "60 degree": { attack: 1, sustain: 3, warmth: 1, projection: 1, brightness: 2 }
    };

    const edge = bearingEdgeData[specs.bearingEdge];
    if (edge) {
      profile.Attack += edge.attack * 0.1;
      profile.Sustain += edge.sustain * 0.1;
      profile.Warmth += edge.warmth * 0.1;
      profile.Projection += edge.projection * 0.1;
      profile.Brightness += edge.brightness * 0.1;
    }

    setSoundProfile(profile);
  };

  // Call calculateSoundProfile whenever user selections change
  useEffect(() => {
    calculateSoundProfile();
  }, [specs]);

  return (
    <div className="custom-drum-builder">
      <h1>Custom Drum Builder</h1>
      
      <div className="form-container">
        {/* Shell Construction */}
        <div className="builder-section">
          <label htmlFor="shellConstruction">Shell Construction:</label>
          <select
            id="shellConstruction"
            value={specs.construction}
            onChange={(e) => handleInputChange(e, 'construction')}
          >
            <option value="stave">Stave</option>
            <option value="steam bent">Steam Bent</option>
            <option value="hybrid">Hybrid</option>
            <option value="segmented">Segmented</option>
            <option value="solid">Solid</option>
          </select>
        </div>

        {/* Wood Species Breakdown */}
        <div className="builder-section">
          <h3>Wood Species Breakdown (Total 100%)</h3>
          {specs.wood.map((wood, index) => (
            <div key={index}>
              <label htmlFor={`woodSpecies-${index}`}>Wood Species:</label>
              <select
                id={`woodSpecies-${index}`}  // Added an id
                name="species"
                value={wood.species}
                onChange={(e) => handleInputChange(e, 'wood', index)}
              >
                <option value="Maple">Maple</option>
                <option value="Birch">Birch</option>
                <option value="Oak">Oak</option>
              </select>

              <label htmlFor={`woodPercentage-${index}`}>Percentage:</label>
              <input
                id={`woodPercentage-${index}`}  // Added an id
                name="percentage"
                type="number"
                value={wood.percentage}
                onChange={(e) => handleInputChange(e, 'wood', index)}
              />
              <button onClick={() => removeWoodSpecies(index)}>Remove</button>
            </div>
          ))}
          <button onClick={addWoodSpecies}>Add Wood Species</button>
        </div>

        {/* Shell Depth */}
        <div className="builder-section">
          <label htmlFor="shellDepth">Shell Depth (inches):</label>
          <input
            id="shellDepth"  // Added an id
            type="number"
            value={specs.depth}
            onChange={(e) => handleInputChange(e, 'depth')}
          />
        </div>

        {/* Shell Width */}
        <div className="builder-section">
          <label htmlFor="shellWidth">Shell Width (inches):</label>
          <input
            id="shellWidth"  // Added an id
            type="number"
            value={specs.width}
            onChange={(e) => handleInputChange(e, 'width')}
          />
        </div>

        {/* Bearing Edge */}
        <div className="builder-section">
          <label htmlFor="bearingEdge">Bearing Edge:</label>
          <select
            id="bearingEdge"  // Added an id
            value={specs.bearingEdge}
            onChange={(e) => handleInputChange(e, 'bearingEdge')}
          >
            <option value="45 degree">45 Degree</option>
            <option value="round over">Round Over</option>
            <option value="30 degree">30 Degree</option>
            <option value="60 degree">60 Degree</option>
          </select>
        </div>
      </div>

      {/* Spider Chart */}
      <div className="chart-container">
        <SpiderChart data={Object.values(soundProfile)} />
      </div>
    </div>
  );
};

export default CustomDrumBuilder;