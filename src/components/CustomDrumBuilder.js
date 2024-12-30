import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SpiderChart from './SpiderChart';
import woodSpecies from '../data/woodSpecies'; // Wood Species data
import constructionTypes from '../data/constructionTypes'; // Construction Types data
import drumDepths from '../data/drumDepths'; // Drum Depths data
import shellDiameters from '../data/shellDiameters'; // Shell Diameters data
import bearingEdges from '../data/bearingEdges'; // Bearing Edges data
import finishTypes from '../data/finishTypes'; // Finish Types data
import hoopRimTypes from '../data/hoopRimTypes'; // Hoop/Rim Types data
import hardwareTypes from '../data/hardwareTypes'; // Hardware Types data
import environmentalFactors from '../data/environmentalFactors'; // Environmental Factors data
import drumheads from '../data/drumheads'; // Drumhead Types data
import shellThickness from '../data/shellThickness'; // Shell Thickness data

const CustomDrumBuilder = () => {
  const [specs, setSpecs] = useState({
    construction: 'stave',
    wood: [{ species: 'Maple', percentage: 100 }],
    depth: 6.5,
    width: 14,
    bearingEdge: '45 degree',
    thickness: 8,
    finish: 'Glossy',
    hoopType: 'Die-Cast',
    hardwareType: 'Premium',
    environmental: 0,
    drumhead: 'Coated',
  });
  const [soundProfile, setSoundProfile] = useState({});

  // Handle changes in specifications
  const handleInputChange = (e, specType, index = null) => {
    const value = e.target.value;
    if (specType === 'wood') {
      const updatedWood = [...specs.wood];
      updatedWood[index][e.target.name] = value;
      if (e.target.name === 'percentage' && value === '0') {
        // Remove species if 0% is selected
        updatedWood.splice(index, 1);
      }
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
      const woodData = woodSpecies.find((item) => item.woodSpecies.includes(wood.species));
      if (woodData) {
        profile.Attack += (woodData.soundProfile.attack || 0) * (wood.percentage / 100);
        profile.Sustain += (woodData.soundProfile.sustain || 0) * (wood.percentage / 100);
        profile.Warmth += (woodData.soundProfile.warmth || 0) * (wood.percentage / 100);
        profile.Projection += (woodData.soundProfile.projection || 0) * (wood.percentage / 100);
        profile.Brightness += (woodData.soundProfile.brightness || 0) * (wood.percentage / 100);
      }
    });

    // Incorporating shell construction
    const constructionData = constructionTypes.find((item) => item.constructionType === specs.construction);
    if (constructionData) {
      profile.Attack += constructionData.soundProfile.attack * 0.25;
      profile.Sustain += constructionData.soundProfile.sustain * 0.25;
      profile.Warmth += constructionData.soundProfile.warmth * 0.25;
      profile.Projection += constructionData.soundProfile.projection * 0.25;
      profile.Brightness += constructionData.soundProfile.brightness * 0.25;
    }

    // Incorporating drum depth
    const depthData = drumDepths.find((item) => item.depth === specs.depth);
    if (depthData) {
      profile.Attack += depthData.soundProfile.attack * 0.15;
      profile.Sustain += depthData.soundProfile.sustain * 0.15;
      profile.Warmth += depthData.soundProfile.warmth * 0.15;
      profile.Projection += depthData.soundProfile.projection * 0.15;
      profile.Brightness += depthData.soundProfile.brightness * 0.15;
    }

    // Incorporating shell diameter
    const diameterData = shellDiameters.find((item) => item.diameter === specs.width);
    if (diameterData) {
      profile.Attack += diameterData.soundProfile.attack * 0.1;
      profile.Sustain += diameterData.soundProfile.sustain * 0.1;
      profile.Warmth += diameterData.soundProfile.warmth * 0.1;
      profile.Projection += diameterData.soundProfile.projection * 0.1;
      profile.Brightness += diameterData.soundProfile.brightness * 0.1;
    }

    // Incorporating bearing edge
    const edgeData = bearingEdges.find((item) => item.bearingEdge === specs.bearingEdge);
    if (edgeData) {
      profile.Attack += edgeData.soundProfile.attack * 0.1;
      profile.Sustain += edgeData.soundProfile.sustain * 0.1;
      profile.Warmth += edgeData.soundProfile.warmth * 0.1;
      profile.Projection += edgeData.soundProfile.projection * 0.1;
      profile.Brightness += edgeData.soundProfile.brightness * 0.1;
    }

    // Incorporating finish type
    const finishData = finishTypes.find((item) => item.finish === specs.finish);
    if (finishData) {
      profile.Attack += finishData.soundProfile.attack * 0.05;
      profile.Sustain += finishData.soundProfile.sustain * 0.05;
      profile.Warmth += finishData.soundProfile.warmth * 0.05;
      profile.Projection += finishData.soundProfile.projection * 0.05;
      profile.Brightness += finishData.soundProfile.brightness * 0.05;
    }

    // Incorporating hoop type
    const hoopData = hoopRimTypes.find((item) => item.hoopType === specs.hoopType);
    if (hoopData) {
      profile.Attack += hoopData.soundProfile.attack * 0.05;
      profile.Sustain += hoopData.soundProfile.sustain * 0.05;
      profile.Warmth += hoopData.soundProfile.warmth * 0.05;
      profile.Projection += hoopData.soundProfile.projection * 0.05;
      profile.Brightness += hoopData.soundProfile.brightness * 0.05;
    }

    // Incorporating hardware type
    const hardwareData = hardwareTypes.find((item) => item.hardware === specs.hardwareType);
    if (hardwareData) {
      profile.Attack += hardwareData.soundProfile.attack * 0.05;
      profile.Sustain += hardwareData.soundProfile.sustain * 0.05;
      profile.Warmth += hardwareData.soundProfile.warmth * 0.05;
      profile.Projection += hardwareData.soundProfile.projection * 0.05;
      profile.Brightness += hardwareData.soundProfile.brightness * 0.05;
    }

    // Incorporating environmental factors
    const environmentalData = environmentalFactors.find((item) => item.factor === specs.environmental);
    if (environmentalData) {
      profile.Attack += environmentalData.soundProfile.attack * 0.05;
      profile.Sustain += environmentalData.soundProfile.sustain * 0.05;
      profile.Warmth += environmentalData.soundProfile.warmth * 0.05;
      profile.Projection += environmentalData.soundProfile.projection * 0.05;
      profile.Brightness += environmentalData.soundProfile.brightness * 0.05;
    }

    setSoundProfile(profile);
  };

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
            {constructionTypes.map((type, index) => (
              <option key={index} value={type.constructionType}>
                {type.constructionType}
              </option>
            ))}
          </select>
        </div>

        {/* Wood Species Breakdown */}
        <div className="builder-section">
          <h3>Wood Species Breakdown (Total 100%)</h3>
          {specs.wood.map((wood, index) => (
            <div key={index}>
              <label htmlFor={`woodSpecies-${index}`}>Wood Species:</label>
              <select
                id={`woodSpecies-${index}`}
                name="species"
                value={wood.species}
                onChange={(e) => handleInputChange(e, 'wood', index)}
              >
                {woodSpecies.map((species, idx) => (
                  <option key={idx} value={species.woodSpecies}>
                    {species.woodSpecies.join(', ')}
                  </option>
                ))}
              </select>

              <label htmlFor={`woodPercentage-${index}`}>Percentage:</label>
              <select
                id={`woodPercentage-${index}`}
                name="percentage"
                value={wood.percentage}
                onChange={(e) => handleInputChange(e, 'wood', index)}
              >
                {[...Array(21)].map((_, i) => (
                  <option key={i} value={i * 5}>
                    {i * 5}%
                  </option>
                ))}
              </select>
              <button onClick={() => removeWoodSpecies(index)}>Remove</button>
            </div>
          ))}
          <button onClick={addWoodSpecies}>Add Wood Species</button>
        </div>

        {/* Shell Depth */}
        <div className="builder-section">
          <label htmlFor="shellDepth">Shell Depth (inches):</label>
          <select
            id="shellDepth"
            value={specs.depth}
            onChange={(e) => handleInputChange(e, 'depth')}
          >
            {drumDepths.map((depth, idx) => (
              <option key={idx} value={depth.depth}>
                {depth.depth} inches
              </option>
            ))}
          </select>
        </div>

        {/* Shell Width */}
        <div className="builder-section">
          <label htmlFor="shellWidth">Shell Width (inches):</label>
          <select
            id="shellWidth"
            value={specs.width}
            onChange={(e) => handleInputChange(e, 'width')}
          >
            {shellDiameters.map((diameter, idx) => (
              <option key={idx} value={diameter.diameter}>
                {diameter.diameter} inches
              </option>
            ))}
          </select>
        </div>

        {/* Bearing Edge */}
        <div className="builder-section">
          <label htmlFor="bearingEdge">Bearing Edge:</label>
          <select
            id="bearingEdge"
            value={specs.bearingEdge}
            onChange={(e) => handleInputChange(e, 'bearingEdge')}
          >
            {bearingEdges.map((edge, idx) => (
              <option key={idx} value={edge.bearingEdge}>
                {edge.bearingEdge}
              </option>
            ))}
          </select>
        </div>

        {/* Drumhead */}
        <div className="builder-section">
          <label htmlFor="drumhead">Drumhead Type:</label>
          <select
            id="drumhead"
            value={specs.drumhead}
            onChange={(e) => handleInputChange(e, 'drumhead')}
          >
            {drumheads.map((head, idx) => (
              <option key={idx} value={head.drumhead}>
                {head.drumhead}
              </option>
            ))}
          </select>
        </div>

        {/* Environmental Factors */}
        <div className="builder-section">
          <label htmlFor="environmental">Environmental Factors:</label>
          <select
            id="environmental"
            value={specs.environmental}
            onChange={(e) => handleInputChange(e, 'environmental')}
          >
            {environmentalFactors.map((factor, idx) => (
              <option key={idx} value={factor.factor}>
                {factor.factor}
              </option>
            ))}
          </select>
        </div>

        {/* Spider Chart */}
        <div className="chart-container">
          <SpiderChart data={Object.values(soundProfile)} />
        </div>
      </div>
    </div>
  );
};

export default CustomDrumBuilder;