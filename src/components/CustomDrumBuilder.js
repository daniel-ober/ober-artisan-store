import React, { useState, useEffect } from 'react';
import SpiderChart from './SpiderChart';
import BarChart from './BarChart';  // Import BarChart component
import { Tooltip, Modal, Button } from 'react-bootstrap';  // Added Tooltip and Modal from react-bootstrap
import FrequencySpectrum from './FrequencySpectrum';  // Import Frequency Spectrum component

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
import frequencyResponse from '../data/distributions/frequencyResponseValues'; 

import './CustomDrumBuilder.css';

const CustomDrumBuilder = () => {
  const [specs, setSpecs] = useState({
    construction: 'Stave',
    species: ['Maple'],
    width: 14,
    depth: 6.5,
    bearingEdge: '45 Degree',
    thickness: '8mm',
    tension: 'Medium',
    drumhead: 'Coated',
    finish: 'Glossy',
    hoopType: 'Die-Cast',
    hardwareType: 'Standard Lugs',
    environmental: 'Average Setting',
  });

  const [soundProfile, setSoundProfile] = useState({});
  const [frequencyResponseData, setFrequencyResponseData] = useState({
    low: 0,
    lowMid: 0,
    mid: 0,
    midHigh: 0,
    high: 0
  });
  const [viewMode, setViewMode] = useState('spider');  // Default to 'spider' view
  const [randomizerEnabled, setRandomizerEnabled] = useState(false);
  const [lockedFields, setLockedFields] = useState({
    construction: false,
    species: false,
    width: false,
    depth: false,
    bearingEdge: false,
    thickness: false,
    tension: false,
    drumhead: false,
    finish: false,
    hoopType: false,
    hardwareType: false,
    environmental: false,
  });
  const [showRandomizerModal, setShowRandomizerModal] = useState(false);
  const [hasSeenModal, setHasSeenModal] = useState(false);

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
      case 'drumheadTension': return 'tension';
      case 'construction': return 'constructionType';
      case 'hardwareType': return 'hardware';
      case 'environmental': return 'factor';
      default: return key;
    }
  };

  // Define categories for the form
  const categories = [
    { key: 'construction', data: constructionTypes, label: 'Shell Construction' },
    { key: 'species', data: woodSpecies, label: 'Wood Species' },
    { key: 'tension', data: drumheadTensions, label: 'Drumhead Tension' },
    { key: 'drumhead', data: drumheadTypes, label: 'Drumhead Type' },
    { key: 'bearingEdge', data: bearingEdgesTypes, label: 'Bearing Edge' },
    { key: 'thickness', data: shellThickness, label: 'Shell Thickness' },
    { key: 'width', data: shellDiameters, label: 'Width (Diameter)' },
    { key: 'depth', data: drumDepths, label: 'Depth' },
    { key: 'finish', data: finishTypes, label: 'Finish Type' },
    { key: 'hoopType', data: hoopRimTypes, label: 'Hoop Type' },
    { key: 'hardwareType', data: hardwareTypes, label: 'Hardware Type' },
    { key: 'environmental', data: environmentalFactors, label: 'Environmental Factors' },
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
    let frequencyResponseData = {
      low: 0,
      lowMid: 0,
      mid: 0,
      midHigh: 0,
      high: 0
    };

    console.log("Starting full sound profile calculation...");

    // Handle wood species separately
    specs.species.forEach((species) => {
      const woodData = woodSpecies.find(item => item.woodSpecies.includes(species));
      if (woodData) {
        const weighted = calculateWeightedProfile('Wood Species', woodData.soundProfile);
        console.log('Wood Species Contribution:', weighted);
        for (let key in profile) profile[key] += weighted[key];
        
        // Add frequency response for wood species
        if (woodData.frequencyResponse) {
          for (let key in frequencyResponseData) {
            frequencyResponseData[key] += woodData.frequencyResponse[key] || 0;
          }
        }
      }
    });

    // Process depth, width, and thickness explicitly
    const depthData = drumDepths.find(item => item.depth == specs.depth);
    const widthData = shellDiameters.find(item => item.diameter == specs.width);
    const thicknessData = shellThickness.find(item => item.thickness == specs.thickness);

    // Add frequency response from drum depth
    if (depthData) {
      const weightedDepth = calculateWeightedProfile('Depth', depthData.soundProfile);
      console.log('Depth Contribution:', weightedDepth);
      for (let key in profile) profile[key] += weightedDepth[key];

      if (depthData.frequencyResponse) {
        for (let key in frequencyResponseData) {
          frequencyResponseData[key] += depthData.frequencyResponse[key] || 0;
        }
      }
    }

    // Add frequency response from shell diameter
    if (widthData) {
      const weightedWidth = calculateWeightedProfile('Width', widthData.soundProfile);
      console.log('Width Contribution:', weightedWidth);
      for (let key in profile) profile[key] += weightedWidth[key];

      if (widthData.frequencyResponse) {
        for (let key in frequencyResponseData) {
          frequencyResponseData[key] += widthData.frequencyResponse[key] || 0;
        }
      }
    }

    // Add frequency response from shell thickness
    if (thicknessData) {
      const weightedThickness = calculateWeightedProfile('Shell Thickness', thicknessData.soundProfile);
      console.log('Thickness Contribution:', weightedThickness);
      for (let key in profile) profile[key] += weightedThickness[key];

      if (thicknessData.frequencyResponse) {
        for (let key in frequencyResponseData) {
          frequencyResponseData[key] += thicknessData.frequencyResponse[key] || 0;
        }
      }
    }

    // Iterate through other categories and add their contributions
    categories.forEach(({ key, data, label }) => {
      if (!['species', 'depth', 'width', 'thickness'].includes(key)) {
        const itemData = data.find(item => item[dataKeyForKey(key)] === specs[key]);
        if (itemData) {
          const weighted = calculateWeightedProfile(label, itemData.soundProfile);
          console.log(`${label} Contribution:`, weighted);
          for (let prop in profile) profile[prop] += weighted[prop];

          // Add frequency response for each category
          if (itemData.frequencyResponse) {
            for (let key in frequencyResponseData) {
              frequencyResponseData[key] += itemData.frequencyResponse[key] || 0;
            }
          }
        }
      }
    });

    // Normalize or adjust frequency response values for smoother output
    for (let band in frequencyResponseData) {
      frequencyResponseData[band] = Math.min(Math.max(frequencyResponseData[band] / 10, 0), 1); // Normalize to 0-1 range
    }

    // Normalize frequency response data to ensure they are in the 0-1 range
    const normalizeFrequencyResponse = (frequencyResponseData) => {
      const maxResponse = Math.max(...Object.values(frequencyResponseData)); // Find the maximum response value
      const minResponse = Math.min(...Object.values(frequencyResponseData)); // Find the minimum response value

      // Normalize to the range of 0 to 1
      for (let key in frequencyResponseData) {
        frequencyResponseData[key] = (frequencyResponseData[key] - minResponse) / (maxResponse - minResponse);
      }

      // Optional: Smooth out the transitions by applying a simple smoothing function
      const smoothResponse = { ...frequencyResponseData };
      Object.keys(smoothResponse).forEach((key, index, array) => {
        if (index > 0 && index < array.length - 1) {
          smoothResponse[key] = (frequencyResponseData[key] + frequencyResponseData[array[index - 1]] + frequencyResponseData[array[index + 1]]) / 3;
        }
      });

      return smoothResponse;
    };

    // Normalize frequency response data before applying it
    frequencyResponseData = normalizeFrequencyResponse(frequencyResponseData);

    console.log("Final Calculated Sound Profile:", profile);
    console.log("Final Frequency Response Data:", frequencyResponseData);

    setSoundProfile(profile);
    setFrequencyResponseData(frequencyResponseData);  // Store frequency response data for further use
  };

  useEffect(() => {
    calculateSoundProfile();
  }, [specs]);

  // Handle Randomizer Toggle
  const toggleRandomizer = () => {
    setRandomizerEnabled(!randomizerEnabled);
    if (!randomizerEnabled && !hasSeenModal) {
      setShowRandomizerModal(true);
      setHasSeenModal(true);  // Ensure modal doesn't appear again
    }
  };

  // Handle Randomization
  const handleRandomizeNow = () => {
    const randomizedSpecs = { ...specs };

    categories.forEach(({ key, data }) => {
      if (!lockedFields[key]) {
        const randomItem = data[Math.floor(Math.random() * data.length)];
        randomizedSpecs[key] = randomItem[dataKeyForKey(key)];
      }
    });

    setSpecs(randomizedSpecs);
  };

  // Handle Lock/Unlock of Fields
  const toggleLockField = (field) => {
    setLockedFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="custom-drum-builder">
      <h1>Custom Drum Builder</h1>
      <div className="builder-container">
        <div className="chart-container">
          <div className="view-toggle">
            <button className={`view-btn ${viewMode === 'spider' ? 'active' : ''}`} onClick={() => setViewMode('spider')}>
              Spider Chart
            </button>
            <button className={`view-btn ${viewMode === 'bar' ? 'active' : ''}`} onClick={() => setViewMode('bar')}>
              Bar Chart
            </button>
          </div>
          {viewMode === 'spider' && <SpiderChart data={Object.values(soundProfile)} />}
          {viewMode === 'bar' && <BarChart data={soundProfile} />}
          <FrequencySpectrum drumSpecs={specs} frequencyResponse={frequencyResponseData} />
        </div>

        <div className="form-container">
          <form className="drum-builder-form">
            <div className="randomizer-toggle">
              <button type="button" onClick={toggleRandomizer}>
                Randomizer
              </button>
            </div>

            {randomizerEnabled && (
              <button type="button" onClick={handleRandomizeNow}>
                Randomize Now
              </button>
            )}

            {categories
              .filter(({ key }) => !['environmental', 'hardwareType', 'hoopType', 'finish'].includes(key))
              .map(({ key, data, label }) => (
                <div key={key} className="form-group">
                  <label htmlFor={key}>{label}</label>
                  <div className="input-group">
                    <select
                      id={key}
                      value={specs[key]}
                      onChange={(e) => handleInputChange(e, key)}
                      className="form-control"
                      disabled={lockedFields[key] && randomizerEnabled}
                    >
                      {Array.isArray(data) && data.map((item, idx) => (
                        <option key={idx} value={item[dataKeyForKey(key)]}>
                          {item[dataKeyForKey(key)]}
                        </option>
                      ))}
                    </select>
                    {randomizerEnabled && (
                      <div
                        className={`lock-icon ${lockedFields[key] ? 'locked' : 'unlocked'}`}
                        onClick={() => toggleLockField(key)}
                        role="button"
                        tabIndex="0"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') toggleLockField(key);
                        }}
                      >
                        {lockedFields[key] ? '🔒' : '🔓'}
                      </div>
                    )}
                  </div>
                </div>
              ))}

            <div className="additional-factors">
              <h3>Additional Factors</h3>
              <Tooltip id="tooltip-additional-factors" title="These factors affect the overall sound profile but are not considered key factors.">
                <span>❓</span>
              </Tooltip>
              {['environmental', 'hardwareType', 'hoopType', 'finish'].map((key) => (
                <div key={key} className="form-group">
                  <label htmlFor={key}>{categories.find((c) => c.key === key).label}</label>
                  <select
                    id={key}
                    value={specs[key]}
                    onChange={(e) => handleInputChange(e, key)}
                    className="form-control"
                    disabled={lockedFields[key] && randomizerEnabled}
                  >
                    {categories
                      .find((c) => c.key === key)
                      .data.map((item, idx) => (
                        <option key={idx} value={item[dataKeyForKey(key)]}>
                          {item[dataKeyForKey(key)]}
                        </option>
                      ))}
                  </select>
                </div>
              ))}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomDrumBuilder;