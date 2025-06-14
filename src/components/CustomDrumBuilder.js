import React, { useState, useEffect } from 'react';
import SpiderChart from './SpiderChart';
import BarChart from './BarChart'; // Import BarChart component
import { Tooltip, Modal, Button } from 'react-bootstrap'; // Added Tooltip and Modal from react-bootstrap
import FrequencySpectrum from './FrequencySpectrum'; // Import Frequency Spectrum component
import { FaDice } from 'react-icons/fa';
import { FaQuestionCircle } from 'react-icons/fa';

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
    secondarySpecies: '',
    innerSpecies: '',
    outerSpecies: '',
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
    high: 0,
  });
  const [viewMode, setViewMode] = useState('spider'); // Default to 'spider' view
  const [randomizerEnabled, setRandomizerEnabled] = useState(false);
  const [hasRandomized, setHasRandomized] = useState(false);
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
    innerSpecies: false, // ✅ must be present
    outerSpecies: false, // ✅ add this!
    secondarySpecies: false, // ✅ already needed for toggle
  });
  const [showRandomizerModal, setShowRandomizerModal] = useState(false);
  const [hasSeenModal, setHasSeenModal] = useState(false);
  const [showAdditional, setShowAdditional] = useState(false);
  const [enableSecondaryStave, setEnableSecondaryStave] = useState(false);

  const handleSecondaryToggle = () => {
    setEnableSecondaryStave((prev) => {
      const newValue = !prev;

      if (!newValue) {
        setSpecs((prevSpecs) => ({
          ...prevSpecs,
          secondarySpecies: '',
        }));
      }

      return newValue;
    });
  };

  const handleRandomizerClick = () => {
    if (!randomizerEnabled) {
      setRandomizerEnabled(true);
      setHasRandomized(false);
      if (!hasSeenModal) {
        setShowRandomizerModal(true);
        setHasSeenModal(true);
      }
    } else if (!hasRandomized) {
      handleRandomizeNow();
      setHasRandomized(true);
    } else {
      setRandomizerEnabled(false);
      setHasRandomized(false);
    }
  };

  // Handle dropdown change
  const handleInputChange = (e, specType) => {
    const value = e.target.value;

    setSpecs((prevSpecs) => {
      if (specType === 'species') {
        return {
          ...prevSpecs,
          [specType]: Array.isArray(value) ? value : [value],
        };
      } else {
        return {
          ...prevSpecs,
          [specType]: value,
        };
      }
    });
  };

  // Map category keys to correct data keys
  const dataKeyForKey = (key) => {
    switch (key) {
      case 'species':
        return 'woodSpecies';
      case 'width':
        return 'diameter';
      case 'depth':
        return 'depth';
      case 'thickness':
        return 'thickness';
      case 'drumheadTension':
        return 'tension';
      case 'construction':
        return 'constructionType';
      case 'hardwareType':
        return 'hardware';
      case 'environmental':
        return 'factor';
      default:
        return key;
    }
  };

  // Define categories for the form
  const categories = [
    {
      key: 'construction',
      data: constructionTypes,
      label: 'Shell Construction',
    }, // 🔊 structural + resonance backbone
    { key: 'species', data: woodSpecies, label: 'Wood Species' }, // 🔊 tone color, density
    { key: 'depth', data: drumDepths, label: 'Depth' }, // 🔊 body, low-end, decay
    { key: 'width', data: shellDiameters, label: 'Width (Diameter)' }, // 🥁 pitch, tuning range
    { key: 'thickness', data: shellThickness, label: 'Shell Thickness' }, // 📏 stiffness, projection
    { key: 'bearingEdge', data: bearingEdgesTypes, label: 'Bearing Edge' }, // 🎯 attack, sensitivity
    { key: 'tension', data: drumheadTensions, label: 'Drumhead Tension' }, // 🪕 head feel, head resonance
    { key: 'drumhead', data: drumheadTypes, label: 'Drumhead Type' }, // 🪗 flavor, ring, dampening
    { key: 'finish', data: finishTypes, label: 'Finish Type' }, // 🎨 minor resonance effect
    { key: 'hoopType', data: hoopRimTypes, label: 'Hoop Type' }, // ⭕ edge articulation
    { key: 'hardwareType', data: hardwareTypes, label: 'Hardware Type' }, // 🔩 negligible tonal influence
    {
      key: 'environmental',
      data: environmentalFactors,
      label: 'Environmental Factors',
    }, // 🌡️ situational context
  ];

  // Calculate weighted profile
  const calculateWeightedProfile = (category, profileValues) => {
    const attackDist = attackValues.find(
      (d) => d.characteristic === category
    ) || { percentage: 0 };
    const sustainDist = sustainValues.find(
      (d) => d.characteristic === category
    ) || { percentage: 0 };
    const warmthDist = warmthValues.find(
      (d) => d.characteristic === category
    ) || { percentage: 0 };
    const projectionDist = projectionValues.find(
      (d) => d.characteristic === category
    ) || { percentage: 0 };
    const brightnessDist = brightnessValues.find(
      (d) => d.characteristic === category
    ) || { percentage: 0 };

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
    let profile = {
      attack: 0,
      sustain: 0,
      warmth: 0,
      projection: 0,
      brightness: 0,
    };
    let frequencyResponseData = {
      low: 0,
      lowMid: 0,
      mid: 0,
      midHigh: 0,
      high: 0,
    };

    // console.log("Starting full sound profile calculation...");

    // Handle wood species separately
    specs.species.forEach((species) => {
      const woodData = woodSpecies.find((item) =>
        item.woodSpecies.includes(species)
      );
      if (woodData) {
        const weighted = calculateWeightedProfile(
          'Wood Species',
          woodData.soundProfile
        );
        // console.log('Wood Species Contribution:', weighted);
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
    const depthData = drumDepths.find((item) => item.depth == specs.depth);
    const widthData = shellDiameters.find(
      (item) => item.diameter == specs.width
    );
    const thicknessData = shellThickness.find(
      (item) => item.thickness == specs.thickness
    );

    // Add frequency response from drum depth
    if (depthData) {
      const weightedDepth = calculateWeightedProfile(
        'Depth',
        depthData.soundProfile
      );
      // console.log('Depth Contribution:', weightedDepth);
      for (let key in profile) profile[key] += weightedDepth[key];

      if (depthData.frequencyResponse) {
        for (let key in frequencyResponseData) {
          frequencyResponseData[key] += depthData.frequencyResponse[key] || 0;
        }
      }
    }

    // Add frequency response from shell diameter
    if (widthData) {
      const weightedWidth = calculateWeightedProfile(
        'Width',
        widthData.soundProfile
      );
      // console.log('Width Contribution:', weightedWidth);
      for (let key in profile) profile[key] += weightedWidth[key];

      if (widthData.frequencyResponse) {
        for (let key in frequencyResponseData) {
          frequencyResponseData[key] += widthData.frequencyResponse[key] || 0;
        }
      }
    }

    // Add frequency response from shell thickness
    if (thicknessData) {
      const weightedThickness = calculateWeightedProfile(
        'Shell Thickness',
        thicknessData.soundProfile
      );
      // console.log('Thickness Contribution:', weightedThickness);
      for (let key in profile) profile[key] += weightedThickness[key];

      if (thicknessData.frequencyResponse) {
        for (let key in frequencyResponseData) {
          frequencyResponseData[key] +=
            thicknessData.frequencyResponse[key] || 0;
        }
      }
    }

    // Iterate through other categories and add their contributions
    categories.forEach(({ key, data, label }) => {
      if (!['species', 'depth', 'width', 'thickness'].includes(key)) {
        const itemData = data.find(
          (item) => item[dataKeyForKey(key)] === specs[key]
        );
        if (itemData) {
          const weighted = calculateWeightedProfile(
            label,
            itemData.soundProfile
          );
          // console.log(`${label} Contribution:`, weighted);
          for (let prop in profile) profile[prop] += weighted[prop];

          // Add frequency response for each category
          if (itemData.frequencyResponse) {
            for (let key in frequencyResponseData) {
              frequencyResponseData[key] +=
                itemData.frequencyResponse[key] || 0;
            }
          }
        }
      }
    });

    // Normalize or adjust frequency response values for smoother output
    for (let band in frequencyResponseData) {
      frequencyResponseData[band] = Math.min(
        Math.max(frequencyResponseData[band] / 10, 0),
        1
      ); // Normalize to 0-1 range
    }

    // Normalize frequency response data to ensure they are in the 0-1 range
    const normalizeFrequencyResponse = (frequencyResponseData) => {
      const maxResponse = Math.max(...Object.values(frequencyResponseData)); // Find the maximum response value
      const minResponse = Math.min(...Object.values(frequencyResponseData)); // Find the minimum response value

      // Normalize to the range of 0 to 1
      for (let key in frequencyResponseData) {
        frequencyResponseData[key] =
          (frequencyResponseData[key] - minResponse) /
          (maxResponse - minResponse);
      }

      // Optional: Smooth out the transitions by applying a simple smoothing function
      const smoothResponse = { ...frequencyResponseData };
      Object.keys(smoothResponse).forEach((key, index, array) => {
        if (index > 0 && index < array.length - 1) {
          smoothResponse[key] =
            (frequencyResponseData[key] +
              frequencyResponseData[array[index - 1]] +
              frequencyResponseData[array[index + 1]]) /
            3;
        }
      });

      return smoothResponse;
    };

    // Normalize frequency response data before applying it
    frequencyResponseData = normalizeFrequencyResponse(frequencyResponseData);

    // console.log("Final Calculated Sound Profile:", profile);
    // console.log("Final Frequency Response Data:", frequencyResponseData);

    setSoundProfile(profile);
    setFrequencyResponseData(frequencyResponseData); // Store frequency response data for further use
  };

  useEffect(() => {
    calculateSoundProfile();
  }, [specs]);

  // Handle Randomizer Toggle
  const toggleRandomizer = () => {
    setRandomizerEnabled(!randomizerEnabled);
    if (!randomizerEnabled && !hasSeenModal) {
      setShowRandomizerModal(true);
      setHasSeenModal(true); // Ensure modal doesn't appear again
    }
  };

  const resetAdditionalFactors = () => {
    setSpecs((prev) => ({
      ...prev,
      environmental: 'Average Setting',
      hardwareType: 'Standard Lugs',
      hoopType: 'Die-Cast',
      finish: 'Glossy',
    }));
  };

  const getRandomValidWoodSpecies = (filterFn = () => true) => {
    const list = woodSpecies.filter(
      (item) => item && item.woodSpecies && filterFn(item)
    );
    if (list.length === 0) return '';
    const selected = list[Math.floor(Math.random() * list.length)];
    return Array.isArray(selected.woodSpecies)
      ? selected.woodSpecies[0]
      : selected.woodSpecies;
  };

  const handleRandomizeNow = () => {
    const randomizedSpecs = { ...specs };
    const isHybridConstruction = normalize(specs.construction).includes(
      'hybrid'
    );
    randomizedSpecs.innerSpecies = getRandomValidWoodSpecies();
    randomizedSpecs.secondarySpecies = getRandomValidWoodSpecies();
    randomizedSpecs.outerSpecies = getRandomValidWoodSpecies(
      (item) =>
        ['Maple', 'Cherry', 'Walnut'].includes(item.woodSpecies) &&
        !(Array.isArray(item.woodSpecies)
          ? item.woodSpecies.includes(specs.outerSpecies)
          : item.woodSpecies === specs.outerSpecies)
    );

    // Randomize all main categories that aren't locked or additional
    categories.forEach(({ key, data }) => {
      const isAdditional = [
        'environmental',
        'hardwareType',
        'hoopType',
        'finish',
      ].includes(key);

      // ❗️Avoid interfering with hybrid-specific fields
      if (
        !lockedFields[key] &&
        !isAdditional &&
        key !== 'outerSpecies' && // <== skip this to avoid overriding it
        key !== 'innerSpecies' &&
        key !== 'secondarySpecies'
      ) {
        const randomItem = data[Math.floor(Math.random() * data.length)];
        randomizedSpecs[key] = randomItem[dataKeyForKey(key)];
      }
    });

    if (isHybridConstruction) {
      // Inner Species (staves)
      if (!lockedFields.innerSpecies) {
        const validSpecies = woodSpecies.filter(
          (item) => item && item.woodSpecies
        );
        if (validSpecies.length > 0) {
          randomizedSpecs.innerSpecies =
            validSpecies[
              Math.floor(Math.random() * validSpecies.length)
            ].woodSpecies;
        }
      }

      // Outer Species (steam bent)
      if (!lockedFields.outerSpecies) {
        const allowedExteriorSpecies = ['Maple', 'Cherry', 'Walnut'];

        // Exclude current value so we force a visual change
        const validOptions = woodSpecies.filter(
          (item) =>
            allowedExteriorSpecies.some((allowed) =>
              Array.isArray(item.woodSpecies)
                ? item.woodSpecies.includes(allowed)
                : item.woodSpecies === allowed
            ) &&
            !(Array.isArray(item.woodSpecies)
              ? item.woodSpecies.includes(specs.outerSpecies)
              : item.woodSpecies === specs.outerSpecies) // exclude current selection
        );

        // If no other option left, fallback to full list
        const optionsToUse =
          validOptions.length > 0
            ? validOptions
            : woodSpecies.filter((item) =>
                allowedExteriorSpecies.some((allowed) =>
                  Array.isArray(item.woodSpecies)
                    ? item.woodSpecies.includes(allowed)
                    : item.woodSpecies === allowed
                )
              );

        const safeOptions = optionsToUse.filter(
          (item) => item && item.woodSpecies
        );
        if (safeOptions.length > 0) {
          randomizedSpecs.outerSpecies =
            safeOptions[
              Math.floor(Math.random() * safeOptions.length)
            ].woodSpecies;
        }
      }
      // Secondary stave species (optional)
      if (enableSecondaryStave) {
        if (!lockedFields.secondarySpecies) {
          const validSecondary = woodSpecies.filter(
            (item) => item && item.woodSpecies
          );
          if (validSecondary.length > 0) {
            randomizedSpecs.secondarySpecies =
              validSecondary[Math.floor(Math.random() * validSecondary.length)]
                .woodSpecies;
          }
        } else {
          // If locked, preserve the existing value
          randomizedSpecs.secondarySpecies = specs.secondarySpecies;
        }
      }
    } else {
      // Stave construction fallback
      if (!lockedFields.species) {
        const validSpecies = woodSpecies.filter(
          (item) => item && item.woodSpecies
        );
        if (validSpecies.length > 0) {
          randomizedSpecs.species =
            validSpecies[
              Math.floor(Math.random() * validSpecies.length)
            ].woodSpecies;
        }
      }

      if (enableSecondaryStave) {
        if (!lockedFields.secondarySpecies) {
          const validSecondary = woodSpecies.filter(
            (item) => item && item.woodSpecies
          );
          if (validSecondary.length > 0) {
            randomizedSpecs.secondarySpecies =
              validSecondary[Math.floor(Math.random() * validSecondary.length)]
                .woodSpecies;
          }
        } else {
          // If locked, preserve the existing value
          randomizedSpecs.secondarySpecies = specs.secondarySpecies;
        }
      }
    }

    setSpecs(randomizedSpecs);
  };

  // Handle Lock/Unlock of Fields
  const toggleLockField = (field) => {
    setLockedFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const toggleAdditionalFactors = () => {
    setShowAdditional((prev) => !prev);
  };

  // Normalize helper (handles Ø, accents, etc.)
  const normalize = (str) =>
    str
      ?.normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[Øø]/g, 'o') // handle special Nordic O
      .toLowerCase();

  return (
    <div className="custom-drum-builder">
      <h1>Custom Drum Builder</h1>
      <div className="builder-container">
        <div className="chart-container">
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
          {viewMode === 'spider' && (
            <SpiderChart data={Object.values(soundProfile)} />
          )}
          {viewMode === 'bar' && <BarChart data={soundProfile} />}
          <FrequencySpectrum
            drumSpecs={specs}
            frequencyResponse={frequencyResponseData}
          />
        </div>

        <div className="form-container">
          <form className="drum-builder-form">
            <div className="randomizer-controls">
              <button
                type="button"
                className={`randomizer-toggle ${randomizerEnabled ? 'enabled' : ''}`}
                onClick={() => setRandomizerEnabled(!randomizerEnabled)}
              >
                {randomizerEnabled
                  ? 'Disable Randomize Tools'
                  : 'Enable Randomize Tools'}
              </button>

              {randomizerEnabled && (
                <button
                  type="button"
                  className="randomize-dice"
                  onClick={handleRandomizeNow}
                  aria-label="Randomize Now"
                >
                  <FaDice />
                </button>
              )}
            </div>

            {categories
              .filter(
                ({ key }) =>
                  ![
                    'environmental',
                    'hardwareType',
                    'hoopType',
                    'finish',
                  ].includes(key)
              )
              .map(({ key, data, label }) => {
                if (key === 'species') {
                  if (normalize(specs.construction).includes('hybrid')) {
                    return (
                      <div
                        key="hybrid-species"
                        className="form-group hybrid-species-group"
                      >
                        <label htmlFor="innerSpecies">
                          Primary Wood Species - Inner Staves
                        </label>
                        <div className="input-group">
                          <select
                            id="innerSpecies"
                            value={specs.innerSpecies}
                            onChange={(e) =>
                              setSpecs((prev) => ({
                                ...prev,
                                innerSpecies: e.target.value,
                              }))
                            }
                            className="form-control"
                            disabled={
                              lockedFields.innerSpecies && randomizerEnabled
                            }
                          >
                            {woodSpecies.map((item, idx) => (
                              <option key={idx} value={item.woodSpecies}>
                                {item.woodSpecies}
                              </option>
                            ))}
                          </select>
                          {randomizerEnabled && (
                            <div
                              className={`lock-icon ${lockedFields.innerSpecies ? 'locked' : 'unlocked'}`}
                              onClick={() => toggleLockField('innerSpecies')}
                            >
                              {lockedFields.innerSpecies ? '🔒' : '🔓'}
                            </div>
                          )}
                        </div>

                        <div className="form-group">
                          <div className="secondary-toggle-row">
                            <label className="secondary-label">
                              Secondary Wood Species - Inner Staves (optional)
                            </label>
                            <FaQuestionCircle
                              className="tooltip-icon"
                              title="Assumes a 50/50 stave split (e.g., 8+8 for a 16-stave shell)."
                            />
                            <div
                              className={`toggle-switch ${enableSecondaryStave ? 'enabled' : ''}`}
                              onClick={() => {
                                setEnableSecondaryStave((prev) => {
                                  const next = !prev;
                                  if (!next) {
                                    setSpecs((prevSpecs) => ({
                                      ...prevSpecs,
                                      secondarySpecies: '',
                                    }));
                                  } else {
                                    setSpecs((prevSpecs) => ({
                                      ...prevSpecs,
                                      secondarySpecies:
                                        woodSpecies[0].woodSpecies,
                                    }));
                                  }
                                  return next;
                                });
                              }}
                            >
                              <div className="toggle-knob" />
                            </div>
                          </div>

                          <div className="input-group">
                            <select
                              id="secondarySpecies"
                              value={
                                enableSecondaryStave
                                  ? specs.secondarySpecies
                                  : ''
                              }
                              onChange={(e) =>
                                setSpecs((prev) => ({
                                  ...prev,
                                  secondarySpecies: e.target.value,
                                }))
                              }
                              className="form-control"
                              disabled={
                                !enableSecondaryStave ||
                                (lockedFields.secondarySpecies &&
                                  randomizerEnabled)
                              }
                            >
                              <option value="">— None —</option>
                              {woodSpecies.map((item, idx) => (
                                <option key={idx} value={item.woodSpecies}>
                                  {item.woodSpecies}
                                </option>
                              ))}
                            </select>
                            {randomizerEnabled && (
                              <div
                                className={`lock-icon ${lockedFields.secondarySpecies ? 'locked' : 'unlocked'}`}
                                onClick={() =>
                                  toggleLockField('secondarySpecies')
                                }
                                role="button"
                                tabIndex="0"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ')
                                    toggleLockField('secondarySpecies');
                                }}
                              >
                                {lockedFields.secondarySpecies ? '🔒' : '🔓'}
                              </div>
                            )}
                          </div>
                        </div>

                        <label htmlFor="outerSpecies">
                          Exterior Wood Species – Steam Bent
                        </label>
                        <div className="input-group">
                          <select
                            id="outerSpecies"
                            value={specs.outerSpecies}
                            onChange={(e) =>
                              setSpecs((prev) => ({
                                ...prev,
                                outerSpecies: e.target.value,
                              }))
                            }
                            className="form-control"
                            disabled={
                              lockedFields.outerSpecies && randomizerEnabled
                            }
                          >
                            {woodSpecies
                              .filter((item) => {
                                const name = String(item.woodSpecies || '')
                                  .trim()
                                  .toLowerCase();
                                return ['maple', 'cherry', 'walnut'].includes(
                                  name
                                );
                              })
                              .map((item, idx) => (
                                <option key={idx} value={item.woodSpecies}>
                                  {item.woodSpecies}
                                </option>
                              ))}
                          </select>
                          {randomizerEnabled && (
                            <div
                              className={`lock-icon ${lockedFields.outerSpecies ? 'locked' : 'unlocked'}`}
                              onClick={() => toggleLockField('outerSpecies')}
                              role="button"
                              tabIndex="0"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ')
                                  toggleLockField('outerSpecies');
                              }}
                            >
                              {lockedFields.outerSpecies ? '🔒' : '🔓'}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  } else {
                    // stave construction
                    return (
                      <div key="species" className="form-group">
                        <label htmlFor="species">Primary Wood Species</label>
                        <div className="input-group">
                          <select
                            id="species"
                            value={specs.species}
                            onChange={(e) => handleInputChange(e, 'species')}
                            className="form-control"
                            disabled={lockedFields.species && randomizerEnabled}
                          >
                            {woodSpecies.map((item, idx) => (
                              <option key={idx} value={item.woodSpecies}>
                                {item.woodSpecies}
                              </option>
                            ))}
                          </select>
                          {randomizerEnabled && (
                            <div
                              className={`lock-icon ${lockedFields.species ? 'locked' : 'unlocked'}`}
                              onClick={() => toggleLockField('species')}
                              role="button"
                              tabIndex="0"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ')
                                  toggleLockField('species');
                              }}
                            >
                              {lockedFields.species ? '🔒' : '🔓'}
                            </div>
                          )}
                        </div>

                        <div className="secondary-toggle-row">
                          <label className="secondary-label">
                            Secondary Wood Species (optional)
                          </label>
                          <FaQuestionCircle
                            className="tooltip-icon"
                            title="Assumes a 50/50 stave split (e.g., 8+8 for a 16-stave shell)."
                          />
                          <div
                            className={`toggle-switch ${enableSecondaryStave ? 'enabled' : ''}`}
                            onClick={() => {
                              setEnableSecondaryStave((prev) => {
                                const next = !prev;
                                setSpecs((prevSpecs) => ({
                                  ...prevSpecs,
                                  secondarySpecies: next
                                    ? woodSpecies[0].woodSpecies
                                    : '',
                                }));
                                return next;
                              });
                            }}
                          >
                            <div className="toggle-knob" />
                          </div>
                        </div>

                        <div className="input-group">
                          <select
                            id="secondarySpecies"
                            value={enableSecondaryStave ? specs.secondarySpecies : ''}
                            onChange={(e) =>
                              setSpecs((prev) => ({
                                ...prev,
                                secondarySpecies: e.target.value,
                              }))
                            }
                            className="form-control"
                            disabled={
                              !enableSecondaryStave ||
                              (lockedFields.secondarySpecies &&
                                randomizerEnabled)
                            }
                          >
                            <option value="">— None —</option>
                            {woodSpecies.map((item, idx) => (
                              <option key={idx} value={item.woodSpecies}>
                                {item.woodSpecies}
                              </option>
                            ))}
                          </select>
                          {randomizerEnabled && (
                            <div
                              className={`lock-icon ${lockedFields.secondarySpecies ? 'locked' : 'unlocked'}`}
                              onClick={() =>
                                toggleLockField('secondarySpecies')
                              }
                              role="button"
                              tabIndex="0"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ')
                                  toggleLockField('secondarySpecies');
                              }}
                            >
                              {lockedFields.secondarySpecies ? '🔒' : '🔓'}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                }

                // all other default category dropdowns
                return (
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
                        {data.map((item, idx) => (
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
                            if (e.key === 'Enter' || e.key === ' ')
                              toggleLockField(key);
                          }}
                        >
                          {lockedFields[key] ? '🔒' : '🔓'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

            <div className="additional-toggle">
              <span
                className="additional-toggle-link"
                onClick={toggleAdditionalFactors}
              >
                {showAdditional
                  ? 'Hide less common / less weighted factors'
                  : 'Show less common / less weighted factors'}
              </span>
              <FaQuestionCircle
                className="additional-tooltip-icon"
                title="These factors influence tone but are not included in the Randomizer tool. You can manually adjust them to shape your sound further."
              />
            </div>

            {showAdditional && (
              <div className="additional-factors">
                <div className="additional-factors-header">
                  <h3>Additional Factors</h3>
                  <span
                    className="reset-additional-link"
                    onClick={resetAdditionalFactors}
                    role="button"
                    tabIndex="0"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ')
                        resetAdditionalFactors();
                    }}
                  >
                    Reset Additional Factors
                  </span>
                </div>
                <Tooltip
                  id="tooltip-additional-factors"
                  title="These factors affect the overall sound profile but are not considered key factors."
                >
                  <span>❓</span>
                </Tooltip>

                {['environmental', 'hardwareType', 'hoopType', 'finish'].map(
                  (key) => (
                    <div key={key} className="form-group">
                      <label htmlFor={key}>
                        {categories.find((c) => c.key === key).label}
                      </label>
                      <select
                        id={key}
                        value={specs[key]}
                        onChange={(e) => handleInputChange(e, key)}
                        className="form-control"
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
                  )
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomDrumBuilder;
