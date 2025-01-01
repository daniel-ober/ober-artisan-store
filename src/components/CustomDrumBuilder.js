import React, { useState, useEffect } from 'react';
import SpiderChart from './SpiderChart';
import BarChart from './BarChart';  // Import BarChart component

// Importing data files for dropdowns
import woodSpecies from '../data/profiles/woodSpecies';
import constructionTypes from '../data/profiles/constructionTypes';
import drumDepths from '../data/profiles/drumDepths';
import shellDiameters from '../data/profiles/shellDiameters';
import bearingEdgesTypes from '../data/profiles/bearingEdgesTypes';
import finishTypes from '../data/profiles/finishTypes';
import hoopRimTypes from '../data/profiles/hoopRimTypes';
import hardwareTypes from '../data/profiles/hardwareTypes';
import environmentalFactors from '../data/profiles/environmentalFactors';
import drumheadTypes from '../data/profiles/drumheadTypes';
import shellThickness from '../data/profiles/shellThickness';
import drumheadTensions from '../data/profiles/drumheadTensions';

// Importing distribution files
import attackValues from '../data/distributions/attackValues';
import sustainValues from '../data/distributions/sustainValues';
import warmthValues from '../data/distributions/warmthValues';
import projectionValues from '../data/distributions/projectionValues';
import brightnessValues from '../data/distributions/brightnessValues';

import './CustomDrumBuilder.css';

const CustomDrumBuilder = () => {
  const [specs, setSpecs] = useState({
    construction: 'Stave',
    species: ['Maple'], // Ensure species is an array
    depth: 6.5,
    width: 14,
    bearingEdge: '45 Degree',
    thickness: '8mm',
    finish: 'Glossy',
    hoopType: 'Die-Cast',
    hardwareType: 'Standard Lugs',
    environmental: 'Average Setting',
    drumhead: 'Coated',
    tension: 'Medium', // Drumhead tension state
  });

  const [soundProfile, setSoundProfile] = useState({});
  const [viewMode, setViewMode] = useState('spider');  // Default to 'spider' view

  // Handle dropdown change
  const handleInputChange = (e, specType) => {
    const value = e.target.value;

    // If the spec is 'species' and it's a string, convert it to an array
    setSpecs((prevSpecs) => ({
      ...prevSpecs,
      [specType]: specType === 'species' && !Array.isArray(value) ? [value] : value,
    }));
  };

  // Map category keys to correct data keys
  const dataKeyForKey = (key) => {
    switch (key) {
      case 'species': return 'woodSpecies';
      case 'width': return 'diameter';
      case 'depth': return 'depth';
      case 'thickness': return 'thickness';
      case 'construction': return 'constructionType';
      case 'hardwareType': return 'hardware';
      case 'environmental': return 'factor';
      case 'drumheadTension': return 'tension';  // Ensure correct mapping for drumheadTension
      default: return key;
    }
  };

  // Define categories for the form
  const categories = [
    { key: 'construction', data: constructionTypes, label: 'Shell Construction' },
    { key: 'species', data: woodSpecies, label: 'Wood Species' },
    { key: 'depth', data: drumDepths, label: 'Depth' },
    { key: 'width', data: shellDiameters, label: 'Width (Diameter)' },
    { key: 'bearingEdge', data: bearingEdgesTypes, label: 'Bearing Edge' },
    { key: 'thickness', data: shellThickness, label: 'Shell Thickness' },
    { key: 'finish', data: finishTypes, label: 'Finish Type' },
    { key: 'hoopType', data: hoopRimTypes, label: 'Hoop Type' },
    { key: 'hardwareType', data: hardwareTypes, label: 'Hardware Type' },
    { key: 'environmental', data: environmentalFactors, label: 'Environmental Factors' },
    { key: 'drumhead', data: drumheadTypes, label: 'Drumhead Type' },
    { key: 'tension', data: drumheadTensions, label: 'Drumhead Tension' },  // Ensure drumheadTension is added
  ];

  // Calculate weighted profile
  const calculateWeightedProfile = (category, profileValues) => {
    const attackDist = attackValues.find(d => d.characteristic === category) || { percentage: 0 };
    const sustainDist = sustainValues.find(d => d.characteristic === category) || { percentage: 0 };
    const warmthDist = warmthValues.find(d => d.characteristic === category) || { percentage: 0 };
    const projectionDist = projectionValues.find(d => d.characteristic === category) || { percentage: 0 };
    const brightnessDist = brightnessValues.find(d => d.characteristic === category) || { percentage: 0 };

    return {
      attack: profileValues.attack * (attackDist.percentage / 100),
      sustain: profileValues.sustain * (sustainDist.percentage / 100),
      warmth: profileValues.warmth * (warmthDist.percentage / 100),
      projection: profileValues.projection * (projectionDist.percentage / 100),
      brightness: profileValues.brightness * (brightnessDist.percentage / 100),
    };
  };

  // Main calculation for sound profile
  const calculateSoundProfile = () => {
    let profile = { attack: 0, sustain: 0, warmth: 0, projection: 0, brightness: 0 };
    console.log("Starting full sound profile calculation...");

    for (let key in profile) profile[key] = 0;

    // Handle wood species separately
    specs.species.forEach((species) => {
      const woodData = woodSpecies.find(item => item.woodSpecies.includes(species));
      if (woodData) {
        const weighted = calculateWeightedProfile('Wood Species', woodData.soundProfile);
        console.log('Wood Species Contribution:', weighted);
        for (let key in profile) profile[key] += weighted[key];
      }
    });

    // Process depth, width, and thickness explicitly
    const depthData = drumDepths.find(item => item.depth == specs.depth);
    const widthData = shellDiameters.find(item => item.diameter == specs.width);
    const thicknessData = shellThickness.find(item => item.thickness == specs.thickness);  // Handle shell thickness

    if (depthData) {
      const weightedDepth = calculateWeightedProfile('Depth', depthData.soundProfile);
      console.log('Depth Contribution:', weightedDepth);
      for (let key in profile) profile[key] += weightedDepth[key];
    }

    if (widthData) {
      const weightedWidth = calculateWeightedProfile('Width', widthData.soundProfile);
      console.log('Width Contribution:', weightedWidth);
      for (let key in profile) profile[key] += weightedWidth[key];
    }

    if (thicknessData) {
      const weightedThickness = calculateWeightedProfile('Shell Thickness', thicknessData.soundProfile);
      console.log('Thickness Contribution:', weightedThickness);
      for (let key in profile) profile[key] += weightedThickness[key];
    }

    categories.forEach(({ key, data, label }) => {
      if (!['species', 'depth', 'width', 'thickness'].includes(key)) {
        const itemData = data.find(item => item[dataKeyForKey(key)] === specs[key]);
        if (itemData) {
          const weighted = calculateWeightedProfile(label, itemData.soundProfile);
          console.log(`${label} Contribution:`, weighted);
          for (let prop in profile) profile[prop] += weighted[prop];
        }
      }
    });

    console.log("Final Calculated Sound Profile:", profile);
    setSoundProfile(profile);
  };

  useEffect(() => {
    calculateSoundProfile();
  }, [specs]);

  return (
    <div className="custom-drum-builder">
      <h1>Custom Drum Builder</h1>
      
      <div className="builder-container">
        {/* Form Container */}
        <div className="form-container">
          <form className="drum-builder-form">
            {categories.map(({ key, data, label }) => (
              <div key={key} className="form-group">
                <label htmlFor={key}>{label}</label>
                <select
                  id={key}
                  value={specs[key]}
                  onChange={(e) => handleInputChange(e, key)}
                  className="form-control"
                >
                  {data.map((item, idx) => (
                    <option key={idx} value={item[dataKeyForKey(key)]}>
                      {item[dataKeyForKey(key)]}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </form>
        </div>

        {/* Chart Container */}
        <div className="chart-container">
          {/* View Mode Toggle */}
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'spider' ? 'active' : ''}`}
              onClick={() => setViewMode('spider')}
            >
              Spider Chart
            </button>
            <button
              className={`view-btn ${viewMode === 'bar' ? 'active' : ''}`}
              onClick={() => setViewMode('bar')}
            >
              Bar Chart
            </button>
          </div>

          {/* Display Chart Based on View Mode */}
          {viewMode === 'spider' && <SpiderChart data={Object.values(soundProfile)} />}
          {viewMode === 'bar' && <BarChart data={soundProfile} />}
        </div>
      </div>
    </div>
  );
};

export default CustomDrumBuilder;
