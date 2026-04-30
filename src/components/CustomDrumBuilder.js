// src/components/CustomDrumBuilder.js

import React, { useState, useEffect } from 'react';
import SpiderChart from './SpiderChart';
import BarChart from './BarChart';
import { Tooltip } from 'react-bootstrap';
import FrequencySpectrum from './FrequencySpectrum';
import { FaDice, FaQuestionCircle } from 'react-icons/fa';

import scoreSpiderProfile from '../utils/spider/scoreSpiderProfile';
import buildDrumSpecsFromLegacyForm from '../utils/spider/buildDrumSpecsFromLegacyForm';
import explainSpiderProfile from '../utils/spider/explainSpiderProfile';
import toFrequencySpectrumData from '../utils/spider/toFrequencySpectrumData';
import generateCraftsmanSummary from '../utils/craftsmanEngine/generateCraftsmanSummary';
import CraftsmanRecommendationPanel from './CraftsmanRecommendationPanel';

import woodSpecies from '../data/profiles/woodSpecies';
import './CustomDrumBuilder.css';

const AXIS_META = [
  { key: 'attack', label: 'Attack' },
  { key: 'sustain', label: 'Sustain' },
  { key: 'warmth', label: 'Warmth' },
  { key: 'projection', label: 'Projection' },
  { key: 'brightness', label: 'Brightness' },
  { key: 'sensitivity', label: 'Sensitivity' },
  { key: 'control', label: 'Control' },
];

/*
  Tuned to keep the blended interior elegant and "Ober":
  - warm forge / copper family
  - cool steel / glass family
  - muted parchment gold
  - restrained violet
  This should keep the center blend premium instead of candy-like.
*/
const AXIS_POINT_COLORS = [
  '#d98952', // attack
  '#7fb7f0', // sustain
  '#b06a42', // warmth
  '#de8a4a', // projection
  '#d8c27a', // brightness
  '#7fc7d8', // sensitivity
  '#9d86cf', // control
];

const SHELL_FAMILY_OPTIONS = ['Wood', 'Metal', 'Acrylic'];

const WOOD_CONSTRUCTION_OPTIONS = [
  'Stave',
  'Feuzon Hybrid',
  'Steam Bent',
  'Ply',
  'Solid',
  'Segmented / Other',
];

const METAL_MATERIAL_OPTIONS = [
  'Brass',
  'Aluminum',
  'Steel',
  'Copper',
  'Bronze',
];

const ACRYLIC_TYPE_OPTIONS = ['Simple Acrylic'];

const DIAMETER_OPTIONS = ['10', '12', '13', '14', '15'];

const DEPTH_OPTIONS = ['4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8'];

const WOOD_THICKNESS_OPTIONS = [
  'Extra Thin — 5mm–6mm',
  'Thin — 6mm–8mm',
  'Medium — 8mm–11mm',
  'Thick — 11mm–15mm',
  'Extra Thick — 15mm–20mm',
];

const METAL_THICKNESS_OPTIONS = [
  'Thin — 1.0mm',
  'Standard — 1.2mm',
  'Heavy — 1.5mm',
  'Cast / Bell — 3.0mm+',
];

const ACRYLIC_THICKNESS_OPTIONS = [
  'Standard — 5mm–6mm',
  'Heavy — 8mm–10mm',
  'Extra Heavy — 1/2" and up',
];

const BEARING_EDGE_OPTIONS = [
  'Full Roundover',
  'Slight Roundover',
  '30 Degree Inner',
  '30 Degree Double',
  '45 Degree Inner',
  '45 Degree Double',
  '45 / Roundover Hybrid',
  'Baseball Bat',
  'Sharp / Acute',
  'Vintage Wide Round',
];

const HOOP_OPTIONS = [
  'Triple-Flanged',
  'Die-Cast',
  'Wood Hoop',
  'Single-Flanged',
  'Control Hoop',
];

const HEAD_TYPE_OPTIONS = [
  'Coated',
  'Clear',
  'Hybrid (Coated + Clear)',
  'Hydraulic',
];

const HEAD_TENSION_OPTIONS = ['Low', 'Medium', 'High'];

const SNARE_BED_DEPTH_OPTIONS = [
  'Shallow — ~1/32" to 1/16"',
  'Standard — ~1/16" to 3/32"',
  'Deep — ~3/32" to 1/8"',
];

const SNARE_SIDE_HEAD_OPTIONS = [
  'Thin — 2mil',
  'Standard — 3mil',
  'Thick — 5mil',
];

const SNARE_WIRE_COUNT_OPTIONS = ['12', '16', '20', '24', '30', '42'];

const SNARE_WIRE_STYLE_OPTIONS = [
  'Standard',
  'Dry / Controlled',
  'Open / Sensitive',
  'Wide / Saturated',
];

const SNARE_WIRE_MATERIAL_OPTIONS = ['Steel', 'Brass'];

const FINISH_OPTIONS = [
  'Raw / Unfinished',
  'Oil / Wax',
  'Satin Lacquer',
  'Gloss Lacquer',
  'Wrap',
];

const HARDWARE_OPTIONS = [
  'Standard Lugs',
  'Tube Lugs',
  'Heavy / High-Mass Hardware',
];

const RERING_OPTIONS = [
  'No Re-Rings',
  'Thin Re-Rings',
  'Standard Re-Rings',
  'Thick Re-Rings',
];

const RANDOMIZER_EXCLUDED_KEYS = new Set([
  'finish',
  'hardwareType',
  'reRings',
  'innerSpecies',
  'outerSpecies',
  'secondarySpecies',
  'species',
]);

const METAL_RANDOM_KEYS = [
  'metalMaterial',
  'width',
  'depth',
  'thickness',
  'bearingEdge',
  'hoopType',
  'drumhead',
  'tension',
  'snareBedDepth',
  'snareSideHead',
  'snareWireCount',
  'snareWireStyle',
  'snareWireMaterial',
];

const ACRYLIC_RANDOM_KEYS = [
  'acrylicType',
  'width',
  'depth',
  'thickness',
  'bearingEdge',
  'hoopType',
  'drumhead',
  'tension',
  'snareBedDepth',
  'snareSideHead',
  'snareWireCount',
  'snareWireStyle',
  'snareWireMaterial',
];

const WOOD_RANDOM_KEYS = [
  'construction',
  'width',
  'depth',
  'thickness',
  'bearingEdge',
  'hoopType',
  'drumhead',
  'tension',
  'snareBedDepth',
  'snareSideHead',
  'snareWireCount',
  'snareWireStyle',
  'snareWireMaterial',
];

const normalize = (str) =>
  String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[Øø]/g, 'o')
    .toLowerCase()
    .trim();

const getWoodValue = (item) =>
  Array.isArray(item?.woodSpecies) ? item.woodSpecies[0] : item?.woodSpecies || '';

const WOOD_OPTIONS = woodSpecies.map(getWoodValue).filter(Boolean);

const FEUZON_OUTER_WOODS = ['Maple', 'Cherry', 'Walnut'];

const pickRandom = (list = []) =>
  list[Math.floor(Math.random() * list.length)];

const pickRandomWood = (filterFn = () => true) => {
  const filtered = WOOD_OPTIONS.filter(filterFn);
  return filtered.length ? pickRandom(filtered) : '';
};

const getThicknessOptionsForShellFamily = (shellFamily) => {
  if (shellFamily === 'Metal') return METAL_THICKNESS_OPTIONS;
  if (shellFamily === 'Acrylic') return ACRYLIC_THICKNESS_OPTIONS;
  return WOOD_THICKNESS_OPTIONS;
};

const getPrimarySpeciesValue = (specs) =>
  Array.isArray(specs.species) ? specs.species[0] || '' : specs.species || '';

const getTopAxes = (profile = {}) =>
  [...AXIS_META]
    .map(({ key, label }) => ({
      key,
      label,
      value: Number(profile[key] || 0),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

const CustomDrumBuilder = () => {
  const [specs, setSpecs] = useState({
    shellFamily: 'Wood',
    construction: 'Stave',
    species: ['Maple'],
    secondarySpecies: '',
    innerSpecies: '',
    outerSpecies: '',
    metalMaterial: 'Brass',
    acrylicType: 'Simple Acrylic',
    width: 14,
    depth: 6.5,
    thickness: 'Medium — 8mm–11mm',
    bearingEdge: '45 Degree Inner',
    hoopType: 'Die-Cast',
    drumhead: 'Coated',
    tension: 'Medium',
    snareBedDepth: 'Standard — ~1/16" to 3/32"',
    snareSideHead: 'Standard — 3mil',
    snareWireCount: '20',
    snareWireStyle: 'Standard',
    snareWireMaterial: 'Steel',
    finish: 'Gloss Lacquer',
    hardwareType: 'Standard Lugs',
    reRings: 'No Re-Rings',
  });

  const [soundProfile, setSoundProfile] = useState({
    attack: 5,
    sustain: 5,
    warmth: 5,
    projection: 5,
    brightness: 5,
    sensitivity: 5,
    control: 5,
  });

  const [frequencyResponseData, setFrequencyResponseData] = useState({
    low: 0,
    lowMid: 0,
    mid: 0,
    midHigh: 0,
    high: 0,
  });

  const [viewMode, setViewMode] = useState('spider');
  const [mobilePreviewMode, setMobilePreviewMode] = useState('spider');
  const [randomizerEnabled, setRandomizerEnabled] = useState(false);
  const [hasRandomized, setHasRandomized] = useState(false);

  const [lockedFields, setLockedFields] = useState({
    shellFamily: false,
    construction: false,
    species: false,
    secondarySpecies: false,
    innerSpecies: false,
    outerSpecies: false,
    metalMaterial: false,
    acrylicType: false,
    width: false,
    depth: false,
    thickness: false,
    bearingEdge: false,
    hoopType: false,
    drumhead: false,
    tension: false,
    snareBedDepth: false,
    snareSideHead: false,
    snareWireCount: false,
    snareWireStyle: false,
    snareWireMaterial: false,
    finish: false,
    hardwareType: false,
    reRings: false,
  });

  const [showRandomizerModal, setShowRandomizerModal] = useState(false);
  const [hasSeenModal, setHasSeenModal] = useState(false);
  const [showAdditional, setShowAdditional] = useState(false);
  const [enableSecondaryStave, setEnableSecondaryStave] = useState(false);
  const [spiderExplanation, setSpiderExplanation] = useState(null);
  const [craftsmanSummary, setCraftsmanSummary] = useState(null);

  const isWoodShell = specs.shellFamily === 'Wood';
  const isMetalShell = specs.shellFamily === 'Metal';
  const isAcrylicShell = specs.shellFamily === 'Acrylic';
  const isFeuzonHybrid = normalize(specs.construction).includes('hybrid');

  const topAxes = getTopAxes(soundProfile);

  const handleSecondaryToggle = () => {
    setEnableSecondaryStave((prev) => {
      const next = !prev;

      if (!next) {
        setSpecs((prevSpecs) => ({
          ...prevSpecs,
          secondarySpecies: '',
        }));
      }

      return next;
    });
  };

  const toggleLockField = (field) => {
    setLockedFields((prev) => ({ ...prev, [field]: !prev[field] }));
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

  const handleInputChange = (e, specType) => {
    const value = e.target.value;

    setSpecs((prevSpecs) => {
      if (specType === 'shellFamily') {
        if (value === 'Metal') {
          return {
            ...prevSpecs,
            shellFamily: 'Metal',
            thickness: METAL_THICKNESS_OPTIONS[1],
          };
        }

        if (value === 'Acrylic') {
          return {
            ...prevSpecs,
            shellFamily: 'Acrylic',
            acrylicType: prevSpecs.acrylicType || 'Simple Acrylic',
            thickness: ACRYLIC_THICKNESS_OPTIONS[0],
          };
        }

        return {
          ...prevSpecs,
          shellFamily: 'Wood',
          construction: prevSpecs.construction || 'Stave',
          species: [getPrimarySpeciesValue(prevSpecs) || prevSpecs.innerSpecies || 'Maple'],
          thickness: WOOD_THICKNESS_OPTIONS[2],
        };
      }

      if (specType === 'construction') {
        const currentPrimary = getPrimarySpeciesValue(prevSpecs);

        if (normalize(value).includes('hybrid')) {
          return {
            ...prevSpecs,
            construction: value,
            innerSpecies: prevSpecs.innerSpecies || currentPrimary || 'Maple',
            outerSpecies: prevSpecs.outerSpecies || 'Walnut',
          };
        }

        return {
          ...prevSpecs,
          construction: value,
          species: [currentPrimary || prevSpecs.innerSpecies || prevSpecs.outerSpecies || 'Maple'],
          innerSpecies: '',
          outerSpecies: '',
        };
      }

      if (specType === 'species') {
        return {
          ...prevSpecs,
          species: Array.isArray(value) ? value : [value],
        };
      }

      if (specType === 'width' || specType === 'depth') {
        return {
          ...prevSpecs,
          [specType]: Number(value),
        };
      }

      return {
        ...prevSpecs,
        [specType]: value,
      };
    });
  };

  const calculateSoundProfile = () => {
    const normalizedSpecs = buildDrumSpecsFromLegacyForm(specs);
    const spiderResult = scoreSpiderProfile(normalizedSpecs);

    setSoundProfile(spiderResult.profile);
    setFrequencyResponseData(toFrequencySpectrumData(spiderResult));
    setSpiderExplanation(explainSpiderProfile(spiderResult));
    setCraftsmanSummary(generateCraftsmanSummary(specs));
  };

  useEffect(() => {
    calculateSoundProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specs]);

  const resetAdditionalFactors = () => {
    setSpecs((prev) => ({
      ...prev,
      finish: 'Gloss Lacquer',
      hardwareType: 'Standard Lugs',
      reRings: 'No Re-Rings',
    }));
  };

  const randomizeBaseField = (draft, key, options) => {
    if (lockedFields[key] || RANDOMIZER_EXCLUDED_KEYS.has(key)) return;
    draft[key] = pickRandom(options);
  };

  const handleRandomizeNow = () => {
    const randomizedSpecs = { ...specs };

    if (!lockedFields.shellFamily) {
      randomizedSpecs.shellFamily = pickRandom(SHELL_FAMILY_OPTIONS);
    }

    if (randomizedSpecs.shellFamily === 'Wood') {
      WOOD_RANDOM_KEYS.forEach((key) => {
        if (key === 'construction') {
          randomizeBaseField(randomizedSpecs, 'construction', WOOD_CONSTRUCTION_OPTIONS);
          return;
        }
        if (key === 'width') {
          randomizeBaseField(randomizedSpecs, 'width', DIAMETER_OPTIONS);
          randomizedSpecs.width = Number(randomizedSpecs.width);
          return;
        }
        if (key === 'depth') {
          randomizeBaseField(randomizedSpecs, 'depth', DEPTH_OPTIONS);
          randomizedSpecs.depth = Number(randomizedSpecs.depth);
          return;
        }
        if (key === 'thickness') {
          randomizeBaseField(randomizedSpecs, 'thickness', WOOD_THICKNESS_OPTIONS);
          return;
        }
        if (key === 'bearingEdge') {
          randomizeBaseField(randomizedSpecs, 'bearingEdge', BEARING_EDGE_OPTIONS);
          return;
        }
        if (key === 'hoopType') {
          randomizeBaseField(randomizedSpecs, 'hoopType', HOOP_OPTIONS);
          return;
        }
        if (key === 'drumhead') {
          randomizeBaseField(randomizedSpecs, 'drumhead', HEAD_TYPE_OPTIONS);
          return;
        }
        if (key === 'tension') {
          randomizeBaseField(randomizedSpecs, 'tension', HEAD_TENSION_OPTIONS);
          return;
        }
        if (key === 'snareBedDepth') {
          randomizeBaseField(randomizedSpecs, 'snareBedDepth', SNARE_BED_DEPTH_OPTIONS);
          return;
        }
        if (key === 'snareSideHead') {
          randomizeBaseField(randomizedSpecs, 'snareSideHead', SNARE_SIDE_HEAD_OPTIONS);
          return;
        }
        if (key === 'snareWireCount') {
          randomizeBaseField(randomizedSpecs, 'snareWireCount', SNARE_WIRE_COUNT_OPTIONS);
          return;
        }
        if (key === 'snareWireStyle') {
          randomizeBaseField(randomizedSpecs, 'snareWireStyle', SNARE_WIRE_STYLE_OPTIONS);
          return;
        }
        if (key === 'snareWireMaterial') {
          randomizeBaseField(randomizedSpecs, 'snareWireMaterial', SNARE_WIRE_MATERIAL_OPTIONS);
        }
      });

      const hybrid = normalize(randomizedSpecs.construction).includes('hybrid');

      if (hybrid) {
        randomizedSpecs.species = [];

        if (!lockedFields.innerSpecies) {
          randomizedSpecs.innerSpecies = pickRandomWood();
        }

        if (!lockedFields.outerSpecies) {
          randomizedSpecs.outerSpecies = pickRandom(FEUZON_OUTER_WOODS);
        }

        if (enableSecondaryStave) {
          if (!lockedFields.secondarySpecies) {
            randomizedSpecs.secondarySpecies = pickRandomWood();
          }
        } else {
          randomizedSpecs.secondarySpecies = '';
        }
      } else {
        randomizedSpecs.innerSpecies = '';
        randomizedSpecs.outerSpecies = '';

        if (!lockedFields.species) {
          randomizedSpecs.species = [pickRandomWood()];
        }

        if (enableSecondaryStave) {
          if (!lockedFields.secondarySpecies) {
            randomizedSpecs.secondarySpecies = pickRandomWood();
          }
        } else {
          randomizedSpecs.secondarySpecies = '';
        }
      }
    }

    if (randomizedSpecs.shellFamily === 'Metal') {
      randomizedSpecs.construction = 'Metal';
      randomizedSpecs.species = [];
      randomizedSpecs.secondarySpecies = '';
      randomizedSpecs.innerSpecies = '';
      randomizedSpecs.outerSpecies = '';

      METAL_RANDOM_KEYS.forEach((key) => {
        if (lockedFields[key]) return;

        if (key === 'metalMaterial') randomizedSpecs.metalMaterial = pickRandom(METAL_MATERIAL_OPTIONS);
        if (key === 'width') randomizedSpecs.width = Number(pickRandom(DIAMETER_OPTIONS));
        if (key === 'depth') randomizedSpecs.depth = Number(pickRandom(DEPTH_OPTIONS));
        if (key === 'thickness') randomizedSpecs.thickness = pickRandom(METAL_THICKNESS_OPTIONS);
        if (key === 'bearingEdge') randomizedSpecs.bearingEdge = pickRandom(BEARING_EDGE_OPTIONS);
        if (key === 'hoopType') randomizedSpecs.hoopType = pickRandom(HOOP_OPTIONS);
        if (key === 'drumhead') randomizedSpecs.drumhead = pickRandom(HEAD_TYPE_OPTIONS);
        if (key === 'tension') randomizedSpecs.tension = pickRandom(HEAD_TENSION_OPTIONS);
        if (key === 'snareBedDepth') randomizedSpecs.snareBedDepth = pickRandom(SNARE_BED_DEPTH_OPTIONS);
        if (key === 'snareSideHead') randomizedSpecs.snareSideHead = pickRandom(SNARE_SIDE_HEAD_OPTIONS);
        if (key === 'snareWireCount') randomizedSpecs.snareWireCount = pickRandom(SNARE_WIRE_COUNT_OPTIONS);
        if (key === 'snareWireStyle') randomizedSpecs.snareWireStyle = pickRandom(SNARE_WIRE_STYLE_OPTIONS);
        if (key === 'snareWireMaterial') randomizedSpecs.snareWireMaterial = pickRandom(SNARE_WIRE_MATERIAL_OPTIONS);
      });
    }

    if (randomizedSpecs.shellFamily === 'Acrylic') {
      randomizedSpecs.construction = 'Acrylic';
      randomizedSpecs.species = [];
      randomizedSpecs.secondarySpecies = '';
      randomizedSpecs.innerSpecies = '';
      randomizedSpecs.outerSpecies = '';

      ACRYLIC_RANDOM_KEYS.forEach((key) => {
        if (lockedFields[key]) return;

        if (key === 'acrylicType') randomizedSpecs.acrylicType = pickRandom(ACRYLIC_TYPE_OPTIONS);
        if (key === 'width') randomizedSpecs.width = Number(pickRandom(DIAMETER_OPTIONS));
        if (key === 'depth') randomizedSpecs.depth = Number(pickRandom(DEPTH_OPTIONS));
        if (key === 'thickness') randomizedSpecs.thickness = pickRandom(ACRYLIC_THICKNESS_OPTIONS);
        if (key === 'bearingEdge') randomizedSpecs.bearingEdge = pickRandom(BEARING_EDGE_OPTIONS);
        if (key === 'hoopType') randomizedSpecs.hoopType = pickRandom(HOOP_OPTIONS);
        if (key === 'drumhead') randomizedSpecs.drumhead = pickRandom(HEAD_TYPE_OPTIONS);
        if (key === 'tension') randomizedSpecs.tension = pickRandom(HEAD_TENSION_OPTIONS);
        if (key === 'snareBedDepth') randomizedSpecs.snareBedDepth = pickRandom(SNARE_BED_DEPTH_OPTIONS);
        if (key === 'snareSideHead') randomizedSpecs.snareSideHead = pickRandom(SNARE_SIDE_HEAD_OPTIONS);
        if (key === 'snareWireCount') randomizedSpecs.snareWireCount = pickRandom(SNARE_WIRE_COUNT_OPTIONS);
        if (key === 'snareWireStyle') randomizedSpecs.snareWireStyle = pickRandom(SNARE_WIRE_STYLE_OPTIONS);
        if (key === 'snareWireMaterial') randomizedSpecs.snareWireMaterial = pickRandom(SNARE_WIRE_MATERIAL_OPTIONS);
      });
    }

    setSpecs(randomizedSpecs);
  };

  const renderLockedButton = (field, label) => {
    if (!randomizerEnabled) return null;

    return (
      <button
        type="button"
        className={`cdb-lock-icon ${lockedFields[field] ? 'locked' : 'unlocked'}`}
        onClick={() => toggleLockField(field)}
        aria-label={`Toggle lock ${label}`}
      >
        {lockedFields[field] ? '🔒' : '🔓'}
      </button>
    );
  };

  const renderSelectField = ({
    id,
    label,
    value,
    onChange,
    options,
    lockedField,
    helpText,
    disabled = false,
  }) => (
    <div className="cdb-form-group" key={id}>
      <label htmlFor={id}>
        {label}
        {helpText ? (
          <FaQuestionCircle className="cdb-tooltip-icon" title={helpText} />
        ) : null}
      </label>

      <div className="cdb-input-group">
        <select
          id={id}
          value={value}
          onChange={onChange}
          className="cdb-form-control"
          disabled={disabled || (lockedFields[lockedField] && randomizerEnabled)}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        {renderLockedButton(lockedField, label)}
      </div>
    </div>
  );

  return (
    <div className="cdb-page">
      <div className="cdb-shell">
        <header className="cdb-hero">
          <div className="cdb-hero-copy">
            <p className="cdb-kicker">Proprietary Voicing System</p>
            <h1>Ober LegacyPrint™ voice engine</h1>
            <p className="cdb-hero-text">
              Shape the build, compare tonal behavior, and explore the expected
              voice of the drum in real time.
            </p>
            <p className="cdb-hero-legal">
              LegacyPrint™ and the Ober LegacyPrint™ voice engine are
              proprietary to Ober Artisan Drums. This tool provides an Ober
              voicing estimate based on proprietary heuristics and artistic
              build logic. It is not a laboratory acoustic measurement tool.
            </p>
          </div>
        </header>

        <div className="cdb-layout">
          <section className="cdb-visual-column">
            <div className="cdb-panel cdb-panel--visual">
              <div className="cdb-panel-head">
                <div>
                  <p className="cdb-section-kicker">Visualization</p>
                  <h2>Drum Sound Profile</h2>
                </div>

                <div className="cdb-view-toggle cdb-view-toggle--desktop" role="tablist" aria-label="Chart view toggle">
                  <button
                    className={`cdb-view-btn ${viewMode === 'spider' ? 'active' : ''}`}
                    onClick={() => setViewMode('spider')}
                    type="button"
                  >
                    Spider Chart
                  </button>
                  <button
                    className={`cdb-view-btn ${viewMode === 'bar' ? 'active' : ''}`}
                    onClick={() => setViewMode('bar')}
                    type="button"
                  >
                    Bar Chart
                  </button>
                </div>
              </div>

              <div className="cdb-desktop-chart">
                {viewMode === 'spider' && (
                  <SpiderChart
                    data={AXIS_META.map(({ key }) => soundProfile[key] ?? 5)}
                    labels={AXIS_META.map(({ label }) => label)}
                    pointColors={AXIS_POINT_COLORS}
                  />
                )}

                {viewMode === 'bar' && <BarChart data={soundProfile} min={4} />}
              </div>

              <div className="cdb-mobile-live-preview">
                <div className="cdb-mobile-live-preview-head">
                  <div>
                    <p className="cdb-mobile-preview-kicker">Live Preview</p>
                    <h3>Keep your read in view while you build</h3>
                  </div>

                  <div
                    className="cdb-view-toggle cdb-view-toggle--mobile"
                    role="tablist"
                    aria-label="Mobile chart preview toggle"
                  >
                    <button
                      className={`cdb-view-btn ${mobilePreviewMode === 'spider' ? 'active' : ''}`}
                      onClick={() => setMobilePreviewMode('spider')}
                      type="button"
                    >
                      Spider
                    </button>
                    <button
                      className={`cdb-view-btn ${mobilePreviewMode === 'bar' ? 'active' : ''}`}
                      onClick={() => setMobilePreviewMode('bar')}
                      type="button"
                    >
                      Bars
                    </button>
                  </div>
                </div>

                <div className="cdb-mobile-chart-card">
                  {mobilePreviewMode === 'spider' ? (
                    <SpiderChart
                      data={AXIS_META.map(({ key }) => soundProfile[key] ?? 5)}
                      labels={AXIS_META.map(({ label }) => label)}
                      pointColors={AXIS_POINT_COLORS}
                      compact
                    />
                  ) : (
                    <BarChart data={soundProfile} min={4} compact />
                  )}
                </div>

                <div className="cdb-mobile-top-axes">
                  {topAxes.map((axis) => (
                    <div key={axis.key} className="cdb-mobile-top-axis-pill">
                      <span>{axis.label}</span>
                      <strong>{axis.value.toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="cdb-axis-summary">
                {AXIS_META.map(({ key, label }) => (
                  <div key={key} className="cdb-axis-chip">
                    <span>{label}</span>
                    <strong>{Number(soundProfile[key] || 0).toFixed(2)}</strong>
                  </div>
                ))}
              </div>

              <FrequencySpectrum
                drumSpecs={specs}
                frequencyResponse={frequencyResponseData}
              />

              {spiderExplanation?.summary && (
                <div className="cdb-reading-card">
                  <h3>Ober Sound Read</h3>
                  <p>{spiderExplanation.summary}</p>
                </div>
              )}

              {craftsmanSummary && (
                <CraftsmanRecommendationPanel
                  specs={specs}
                  summary={craftsmanSummary}
                />
              )}
            </div>
          </section>

          <aside className="cdb-form-column">
            <div className="cdb-panel cdb-panel--form">
              <div className="cdb-panel-head">
                <div>
                  <p className="cdb-section-kicker">Build Inputs</p>
                  <h2>Spec Builder</h2>
                </div>
              </div>

              <form className="cdb-form">
                <div className="cdb-randomizer-controls">
                  <button
                    type="button"
                    className={`cdb-randomizer-toggle ${randomizerEnabled ? 'enabled' : ''}`}
                    onClick={handleRandomizerClick}
                  >
                    {randomizerEnabled
                      ? 'Disable Randomize Tools'
                      : 'Enable Randomize Tools'}
                  </button>

                  {randomizerEnabled && (
                    <button
                      type="button"
                      className="cdb-randomize-dice"
                      onClick={handleRandomizeNow}
                      aria-label="Randomize build"
                    >
                      <FaDice />
                    </button>
                  )}
                </div>

                <div className="cdb-form-section">
                  <div className="cdb-form-section-head">
                    <h3>Primary Factors</h3>
                    <p>Core shell, geometry, head, hoop, and snare-response choices.</p>
                  </div>

                  {renderSelectField({
                    id: 'shellFamily',
                    label: 'Shell Family',
                    value: specs.shellFamily,
                    onChange: (e) => handleInputChange(e, 'shellFamily'),
                    options: SHELL_FAMILY_OPTIONS,
                    lockedField: 'shellFamily',
                  })}

                  {isWoodShell &&
                    renderSelectField({
                      id: 'construction',
                      label: 'Wood Shell Construction',
                      value: specs.construction,
                      onChange: (e) => handleInputChange(e, 'construction'),
                      options: WOOD_CONSTRUCTION_OPTIONS,
                      lockedField: 'construction',
                    })}

                  {isMetalShell &&
                    renderSelectField({
                      id: 'metalMaterial',
                      label: 'Metal Shell Material',
                      value: specs.metalMaterial,
                      onChange: (e) => handleInputChange(e, 'metalMaterial'),
                      options: METAL_MATERIAL_OPTIONS,
                      lockedField: 'metalMaterial',
                    })}

                  {isAcrylicShell &&
                    renderSelectField({
                      id: 'acrylicType',
                      label: 'Acrylic Shell Type',
                      value: specs.acrylicType,
                      onChange: (e) => handleInputChange(e, 'acrylicType'),
                      options: ACRYLIC_TYPE_OPTIONS,
                      lockedField: 'acrylicType',
                    })}

                  {isWoodShell && isFeuzonHybrid ? (
                    <div className="cdb-form-group cdb-hybrid-species-group">
                      <label htmlFor="innerSpecies">Primary Wood Species — Inner Staves</label>

                      <div className="cdb-input-group">
                        <select
                          id="innerSpecies"
                          value={specs.innerSpecies}
                          onChange={(e) =>
                            setSpecs((prev) => ({
                              ...prev,
                              innerSpecies: e.target.value,
                            }))
                          }
                          className="cdb-form-control"
                          disabled={lockedFields.innerSpecies && randomizerEnabled}
                        >
                          <option value="">— Select Inner Species —</option>
                          {WOOD_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>

                        {renderLockedButton('innerSpecies', 'Primary Wood Species — Inner Staves')}
                      </div>

                      <div className="cdb-form-group">
                        <div className="cdb-secondary-toggle-row">
                          <label className="cdb-secondary-label">
                            Secondary Wood Species — Inner Staves (optional)
                          </label>

                          <FaQuestionCircle
                            className="cdb-tooltip-icon"
                            title='Assumes a 50/50 stave split (for example, 8+8 for a 16-stave shell).'
                          />

                          <div
                            className={`cdb-toggle-switch ${enableSecondaryStave ? 'enabled' : ''}`}
                            onClick={handleSecondaryToggle}
                            role="button"
                            tabIndex="0"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                handleSecondaryToggle();
                              }
                            }}
                          >
                            <div className="cdb-toggle-knob" />
                          </div>
                        </div>

                        <div className="cdb-input-group">
                          <select
                            id="secondarySpecies"
                            value={enableSecondaryStave ? specs.secondarySpecies : ''}
                            onChange={(e) =>
                              setSpecs((prev) => ({
                                ...prev,
                                secondarySpecies: e.target.value,
                              }))
                            }
                            className="cdb-form-control"
                            disabled={
                              !enableSecondaryStave ||
                              (lockedFields.secondarySpecies && randomizerEnabled)
                            }
                          >
                            <option value="">— None —</option>
                            {WOOD_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>

                          {renderLockedButton(
                            'secondarySpecies',
                            'Secondary Wood Species — Inner Staves'
                          )}
                        </div>
                      </div>

                      <label htmlFor="outerSpecies">Exterior Wood Species — Steam Bent</label>

                      <div className="cdb-input-group">
                        <select
                          id="outerSpecies"
                          value={specs.outerSpecies}
                          onChange={(e) =>
                            setSpecs((prev) => ({
                              ...prev,
                              outerSpecies: e.target.value,
                            }))
                          }
                          className="cdb-form-control"
                          disabled={lockedFields.outerSpecies && randomizerEnabled}
                        >
                          {FEUZON_OUTER_WOODS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>

                        {renderLockedButton('outerSpecies', 'Exterior Wood Species — Steam Bent')}
                      </div>
                    </div>
                  ) : null}

                  {isWoodShell && !isFeuzonHybrid ? (
                    <div className="cdb-form-group">
                      <label htmlFor="species">Primary Wood Species</label>

                      <div className="cdb-input-group">
                        <select
                          id="species"
                          value={getPrimarySpeciesValue(specs)}
                          onChange={(e) => handleInputChange(e, 'species')}
                          className="cdb-form-control"
                          disabled={lockedFields.species && randomizerEnabled}
                        >
                          {WOOD_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>

                        {renderLockedButton('species', 'Primary Wood Species')}
                      </div>

                      <div className="cdb-secondary-toggle-row">
                        <label className="cdb-secondary-label">
                          Secondary Wood Species (optional)
                        </label>

                        <FaQuestionCircle
                          className="cdb-tooltip-icon"
                          title='Assumes a 50/50 stave split (for example, 8+8 for a 16-stave shell).'
                        />

                        <div
                          className={`cdb-toggle-switch ${enableSecondaryStave ? 'enabled' : ''}`}
                          onClick={handleSecondaryToggle}
                          role="button"
                          tabIndex="0"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              handleSecondaryToggle();
                            }
                          }}
                        >
                          <div className="cdb-toggle-knob" />
                        </div>
                      </div>

                      <div className="cdb-input-group">
                        <select
                          id="secondarySpecies"
                          value={enableSecondaryStave ? specs.secondarySpecies : ''}
                          onChange={(e) =>
                            setSpecs((prev) => ({
                              ...prev,
                              secondarySpecies: e.target.value,
                            }))
                          }
                          className="cdb-form-control"
                          disabled={
                            !enableSecondaryStave ||
                            (lockedFields.secondarySpecies && randomizerEnabled)
                          }
                        >
                          <option value="">— None —</option>
                          {WOOD_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>

                        {renderLockedButton('secondarySpecies', 'Secondary Wood Species')}
                      </div>
                    </div>
                  ) : null}

                  {renderSelectField({
                    id: 'width',
                    label: 'Width (Diameter)',
                    value: String(specs.width),
                    onChange: (e) => handleInputChange(e, 'width'),
                    options: DIAMETER_OPTIONS,
                    lockedField: 'width',
                  })}

                  {renderSelectField({
                    id: 'depth',
                    label: 'Depth',
                    value: String(specs.depth),
                    onChange: (e) => handleInputChange(e, 'depth'),
                    options: DEPTH_OPTIONS,
                    lockedField: 'depth',
                  })}

                  {renderSelectField({
                    id: 'thickness',
                    label: 'Shell Thickness',
                    value: specs.thickness,
                    onChange: (e) => handleInputChange(e, 'thickness'),
                    options: getThicknessOptionsForShellFamily(specs.shellFamily),
                    lockedField: 'thickness',
                  })}

                  {renderSelectField({
                    id: 'bearingEdge',
                    label: 'Bearing Edge',
                    value: specs.bearingEdge,
                    onChange: (e) => handleInputChange(e, 'bearingEdge'),
                    options: BEARING_EDGE_OPTIONS,
                    lockedField: 'bearingEdge',
                  })}

                  {renderSelectField({
                    id: 'hoopType',
                    label: 'Hoop Type',
                    value: specs.hoopType,
                    onChange: (e) => handleInputChange(e, 'hoopType'),
                    options: HOOP_OPTIONS,
                    lockedField: 'hoopType',
                  })}

                  {renderSelectField({
                    id: 'drumhead',
                    label: 'Drumhead Type',
                    value: specs.drumhead,
                    onChange: (e) => handleInputChange(e, 'drumhead'),
                    options: HEAD_TYPE_OPTIONS,
                    lockedField: 'drumhead',
                  })}

                  {renderSelectField({
                    id: 'tension',
                    label: 'Drumhead Tension',
                    value: specs.tension,
                    onChange: (e) => handleInputChange(e, 'tension'),
                    options: HEAD_TENSION_OPTIONS,
                    lockedField: 'tension',
                  })}

                  {renderSelectField({
                    id: 'snareBedDepth',
                    label: 'Snare Bed Depth',
                    value: specs.snareBedDepth,
                    onChange: (e) => handleInputChange(e, 'snareBedDepth'),
                    options: SNARE_BED_DEPTH_OPTIONS,
                    lockedField: 'snareBedDepth',
                  })}

                  {renderSelectField({
                    id: 'snareSideHead',
                    label: 'Snare-Side Head',
                    value: specs.snareSideHead,
                    onChange: (e) => handleInputChange(e, 'snareSideHead'),
                    options: SNARE_SIDE_HEAD_OPTIONS,
                    lockedField: 'snareSideHead',
                  })}

                  {renderSelectField({
                    id: 'snareWireCount',
                    label: 'Snare Wire Count',
                    value: specs.snareWireCount,
                    onChange: (e) => handleInputChange(e, 'snareWireCount'),
                    options: SNARE_WIRE_COUNT_OPTIONS,
                    lockedField: 'snareWireCount',
                  })}

                  {renderSelectField({
                    id: 'snareWireStyle',
                    label: 'Snare Wire Style',
                    value: specs.snareWireStyle,
                    onChange: (e) => handleInputChange(e, 'snareWireStyle'),
                    options: SNARE_WIRE_STYLE_OPTIONS,
                    lockedField: 'snareWireStyle',
                  })}

                  {renderSelectField({
                    id: 'snareWireMaterial',
                    label: 'Snare Wire Material',
                    value: specs.snareWireMaterial,
                    onChange: (e) => handleInputChange(e, 'snareWireMaterial'),
                    options: SNARE_WIRE_MATERIAL_OPTIONS,
                    lockedField: 'snareWireMaterial',
                  })}
                </div>

                <div className="cdb-additional-toggle">
                  <span
                    className="cdb-additional-toggle-link"
                    onClick={() => setShowAdditional((prev) => !prev)}
                    role="button"
                    tabIndex="0"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setShowAdditional((prev) => !prev);
                      }
                    }}
                  >
                    {showAdditional
                      ? 'Hide less common / less weighted factors'
                      : 'Show less common / less weighted factors'}
                  </span>

                  <FaQuestionCircle
                    className="cdb-additional-tooltip-icon"
                    title="These factors still matter, but they are secondary to shell structure, geometry, heads, hoops, and snare-response choices."
                  />
                </div>

                {showAdditional && (
                  <div className="cdb-additional-factors">
                    <div className="cdb-additional-factors-header">
                      <h3>Less Common / Less Weighted Factors</h3>

                      <span
                        className="cdb-reset-additional-link"
                        onClick={resetAdditionalFactors}
                        role="button"
                        tabIndex="0"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            resetAdditionalFactors();
                          }
                        }}
                      >
                        Reset Additional Factors
                      </span>
                    </div>

                    <Tooltip
                      id="tooltip-additional-factors"
                      title="These are lower-order tonal and feel shapers compared with the primary factor group."
                    >
                      <span />
                    </Tooltip>

                    {renderSelectField({
                      id: 'finish',
                      label: 'Finish Type',
                      value: specs.finish,
                      onChange: (e) => handleInputChange(e, 'finish'),
                      options: FINISH_OPTIONS,
                      lockedField: 'finish',
                    })}

                    {renderSelectField({
                      id: 'hardwareType',
                      label: 'Hardware Type',
                      value: specs.hardwareType,
                      onChange: (e) => handleInputChange(e, 'hardwareType'),
                      options: HARDWARE_OPTIONS,
                      lockedField: 'hardwareType',
                    })}

                    {renderSelectField({
                      id: 'reRings',
                      label: 'Re-Rings',
                      value: specs.reRings,
                      onChange: (e) => handleInputChange(e, 'reRings'),
                      options: RERING_OPTIONS,
                      lockedField: 'reRings',
                      disabled: !isWoodShell,
                    })}
                  </div>
                )}

                {showRandomizerModal && (
                  <div className="cdb-randomizer-modal-backdrop">
                    <div className="cdb-randomizer-modal">
                      <h3>Randomizer Enabled</h3>
                      <p>
                        Lock the fields you want to preserve, then use the dice
                        button to generate fresh build combinations.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowRandomizerModal(false)}
                      >
                        Got It
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CustomDrumBuilder;