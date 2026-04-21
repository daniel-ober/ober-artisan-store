import React, { useState, useEffect, useMemo } from 'react';

import { useNavigate } from 'react-router-dom';

import { doc, getDoc } from 'firebase/firestore';

import { db } from '../firebaseConfig';

import heritageSummaries from '../data/heritageSummaries';

import { useCart } from '../context/CartContext';

import SpiderChart from './SpiderChart';

import BarChart from './BarChart';

import './HeritageProductDetail.css';

import toast from 'react-hot-toast';

const AXIS_META = [
  { key: 'attack', label: 'Attack' },

  { key: 'sustain', label: 'Sustain' },

  { key: 'warmth', label: 'Warmth' },

  { key: 'projection', label: 'Projection' },

  { key: 'brightness', label: 'Brightness' },

  { key: 'sensitivity', label: 'Sensitivity' },

  { key: 'control', label: 'Control' },
];

const AXIS_POINT_COLORS = [
  '#ff7448',

  '#4d86ff',

  '#c1682e',

  '#ffb53a',

  '#e7d98f',

  '#68d9df',

  '#9e8bff',
];

const clampAxis = (value) => {
  const num = Number(value || 0);

  if (Number.isNaN(num)) return 5;

  return Math.max(4, Math.min(10, Number(num.toFixed(2))));
};

const formatCurrency = (value) => `$${Number(value || 0).toFixed(0)}`;

const HERITAGE_STANDARD_BEARING_EDGE =
  '45° inner bearing edge with softened outer roundover';

const HERITAGE_STANDARD_SNARE_BED = 'Standard';

const HERITAGE_FINISH_SWATCHES = {
  'Light Torch': '/swatches/heritage/light.png',

  'Medium Torch': '/swatches/heritage/medium.png',

  Blackened: '/swatches/heritage/blackened.png',
};
const HeritageProductDetail = () => {
  const navigate = useNavigate();

  const { addToCart, removeFromCart, cart } = useCart();

  const [size, setSize] = useState('12');

  const [depth, setDepth] = useState('5.0');

  const [lugs, setLugs] = useState('8');

  const [staveOption, setStaveOption] = useState('16 - 10mm');

  const [hardwareColor, setHardwareColor] = useState('Chrome');

  const [hoopType, setHoopType] = useState('Triple Flange');

  const [scorchDepth, setScorchDepth] = useState('Medium Torch');

  const [totalPrice, setTotalPrice] = useState(850);

  const [isLoading, setIsLoading] = useState(true);

  const [product, setProduct] = useState(null);

  const [buttonText, setButtonText] = useState('Add to Cart');

  const [cartItemId, setCartItemId] = useState(null);

  const [chartView, setChartView] = useState('spider');

  const [selectedDrumSummary, setSelectedDrumSummary] = useState({});

  const [openBuilderSection, setOpenBuilderSection] = useState('construction');

  const basePrices = { 12: 850, 13: 950, 14: 1050 };

  const reRingCost = 150;

  const depthPrices = {
    12: {
      '5.0': 0,

      5.5: 50,

      '6.0': 100,

      6.5: 150,

      '7.0': 200,

      7.5: 250,

      '8.0': 300,
    },

    13: {
      '5.0': 0,

      5.5: 50,

      '6.0': 100,

      6.5: 150,

      '7.0': 200,

      7.5: 250,

      '8.0': 300,
    },

    14: {
      '5.0': 0,

      5.5: 50,

      '6.0': 100,

      6.5: 150,

      '7.0': 200,

      7.5: 250,

      '8.0': 300,
    },
  };

  const staveOptions = {
    12: { 6: ['12 - 8mm'], 8: ['16 - 10mm'] },

    13: { 8: ['16 - 10mm'] },

    14: {
      8: ['16 - 10mm'],

      10: ['20 - 12mm', '10 - 7mm + $150 (Re-Rings Required)'],
    },
  };

  const lugOptions = {
    12: ['6', '8'],

    13: ['8'],

    14: ['8', '10'],
  };

  const hardwareOptions = [
    { label: 'Chrome', value: 'Chrome', upcharge: 0 },

    { label: 'Black Nickel (+$50)', value: 'Black Nickel', upcharge: 50 },

    { label: 'Brass / Gold (+$150)', value: 'Brass/Gold', upcharge: 150 },
  ];

  const hoopOptions = [
    { label: 'Triple Flange', value: 'Triple Flange', upcharge: 0 },

    { label: 'Die-Cast (+$100)', value: 'Die-Cast', upcharge: 100 },
  ];

  const scorchOptions = ['Light Torch', 'Medium Torch', 'Blackened'];

  const hardwareUpchargeMap = {
    Chrome: 0,

    'Black Nickel': 50,

    'Brass/Gold': 150,
  };

  const hoopUpchargeMap = {
    'Triple Flange': 0,

    'Die-Cast': 100,
  };

  const productImage = useMemo(() => {
    return product?.images?.[0] || '/resized-logos/heritage-placeholder.png';
  }, [product]);

  const heritageSwatchPreviewImage = useMemo(() => {
    return HERITAGE_FINISH_SWATCHES[scorchDepth] || null;
  }, [scorchDepth]);

const heritageHighlights = [

  'Northern Red Oak stave shell construction.',

  'Grounded, warm, seasoned Ober voice.',

  '45° inner edge with softened outer roundover.',

  '12", 13", and 14" build sizes.',

  '36 core Heritage voicing paths.',

  'Triple flange or die-cast response.',

  'Chrome, Black Nickel, or Brass / Gold hardware.',

  'Controlled torching shapes visual character and resonance.',

  'Craftsman-selected PureSound snare wires.',

  'Estimated delivery: 6–8 weeks.',

];

  const generateCartItemId = (option) => {
    const normalizedStave = String(option.staveQuantity).trim();

    const normalizedHardware = String(option.hardwareColor)
      .toLowerCase()

      .replace(/\s+/g, '-');

    const normalizedHoops = String(option.hoopType)
      .toLowerCase()

      .replace(/\s+/g, '-');

    const normalizedScorch = String(option.scorchDepth)
      .toLowerCase()

      .replace(/\s+/g, '-');

    const priceId = option.stripePriceId ?? '';

    return `${priceId}-${option.size}-${option.depth}-${String(
      option.reRing
    )}-${option.lugQuantity}-${normalizedStave}-${normalizedHardware}-${normalizedHoops}-${normalizedScorch}`;
  };

  const buildLegacyVoiceRead = ({
    size: currentSize,

    depth: currentDepth,

    lugs: currentLugs,

    staveOption: currentStaveOption,

    hardwareColor: currentHardwareColor,

    hoopType: currentHoopType,

    scorchDepth: currentScorchDepth,

    heritageSummaryMatch,
  }) => {
    const numericSize = Number(currentSize || 12);

    const numericDepth = Number(currentDepth || 5);

    const hasReRing =
      currentStaveOption.includes('Re-Rings') ||
      currentStaveOption.includes('+ $150');

    let profile = {
      attack: 7.6,

      sustain: 7.4,

      warmth: 8.4,

      projection: 7.8,

      brightness: 6.4,

      sensitivity: 7.4,

      control: 7.9,
    };

    if (numericDepth <= 5.5) {
      profile.attack += 0.2;

      profile.sustain -= 0.8;

      profile.sensitivity += 0.25;

      profile.control += 0.2;
    }

    if (numericDepth >= 6.5) {
      profile.sustain += 0.6;

      profile.warmth += 0.4;

      profile.projection += 0.3;

      profile.attack -= 0.1;
    }

    if (numericDepth >= 7) {
      profile.sustain += 0.4;

      profile.warmth += 0.35;

      profile.projection += 0.35;

      profile.sensitivity -= 0.15;
    }

    if (numericSize === 13) {
      profile.warmth += 0.25;

      profile.projection += 0.25;
    }

    if (numericSize === 14) {
      profile.warmth += 0.65;

      profile.projection += 0.75;

      profile.brightness -= 0.2;
    }

    if (currentLugs === '10') {
      profile.control += 0.45;

      profile.attack += 0.15;

      profile.sustain -= 0.15;

      profile.sensitivity -= 0.1;
    }

    if (hasReRing) {
      profile.control += 0.55;

      profile.projection += 0.2;

      profile.sustain += 0.1;
    }

    if (currentHoopType === 'Die-Cast') {
      profile.attack += 0.45;

      profile.control += 0.6;

      profile.brightness += 0.2;

      profile.sustain -= 0.35;

      profile.sensitivity -= 0.1;
    } else {
      profile.sustain += 0.15;

      profile.sensitivity += 0.1;
    }

    if (currentScorchDepth === 'Light Torch') {
      profile.brightness += 0.25;

      profile.attack += 0.1;

      profile.warmth -= 0.1;
    }

    if (currentScorchDepth === 'Medium Torch') {
      profile.warmth += 0.2;

      profile.control += 0.1;
    }

    if (currentScorchDepth === 'Blackened') {
      profile.warmth += 0.5;

      profile.control += 0.35;

      profile.brightness -= 0.35;

      profile.attack -= 0.1;
    }

    if (currentHardwareColor === 'Black Nickel') {
      profile.control += 0.1;

      profile.brightness += 0.05;
    }

    if (currentHardwareColor === 'Brass/Gold') {
      profile.warmth += 0.15;
    }

    profile.sensitivity += 0.2;

    profile.control += 0.12;

    profile = {
      attack: clampAxis(profile.attack),

      sustain: clampAxis(profile.sustain),

      warmth: clampAxis(profile.warmth),

      projection: clampAxis(profile.projection),

      brightness: clampAxis(profile.brightness),

      sensitivity: clampAxis(profile.sensitivity),

      control: clampAxis(profile.control),
    };

    const quickerBuild = numericDepth <= 5.5 && currentHoopType === 'Die-Cast';

    const deeperBuild = numericDepth >= 7;

    const darkerBuild =
      currentScorchDepth === 'Blackened' ||
      currentHardwareColor === 'Brass/Gold';

    let summary =
      'A balanced Heritage configuration with grounded warmth, natural body, and a classic response that stays tactile under the stick.';

    if (quickerBuild) {
      summary =
        'A quicker, tighter Heritage configuration with a more immediate response, shorter bloom, and a focused classic voice.';
    } else if (deeperBuild && darkerBuild) {
      summary =
        'A deeper, darker Heritage build with stronger body, richer low-mid bloom, and a more seasoned response under the stick.';
    } else if (deeperBuild) {
      summary =
        'A fuller Heritage configuration with deeper bloom, stronger body, and a broad, grounded voice that feels planted and mature.';
    }

    let primaryGenre = 'Roots / session / soul';

    if (numericDepth <= 5.5) primaryGenre = 'Jazz / funk / session';

    if (numericDepth >= 6.5)
      primaryGenre = 'Americana / rock / singer-songwriter';

    if (numericDepth >= 7 && currentHoopType === 'Die-Cast') {
      primaryGenre = 'Alternative / rock / cinematic session';
    }

    let recordingMic = 'Warm, natural overhead or close-mic pairing';

    if (numericSize <= 12) {
      recordingMic = 'Small-diaphragm condenser for articulation and balance';
    }

    if (numericSize >= 14 && numericDepth >= 6.5) {
      recordingMic = 'Ribbon or fuller-bodied condenser for weight and tone';
    }

    let playingSituation =
      'A balanced Heritage response with natural openness, strong body, and tactile rebound.';

    if (currentHoopType === 'Die-Cast') {
      playingSituation =
        'A more focused Heritage response with stronger note shape, quicker containment, and added front-end definition.';
    }

    let feelRead =
      'A clean, timeless configuration that keeps the focus on shell character and natural response.';

    if (currentHardwareColor === 'Black Nickel') {
      feelRead =
        'A slightly more modern visual lean wrapped around an otherwise classic Heritage voice.';
    }

    if (currentHardwareColor === 'Brass/Gold') {
      feelRead =
        'A richer, more elevated visual presentation that complements the warmer, more seasoned side of the Heritage line.';
    }

    if (currentScorchDepth === 'Blackened') {
      feelRead =
        'A darker, more dramatic finish direction that leans moodier and more heavily seasoned without losing the line’s classic identity.';
    }

    let secondaryGenres = ['Singer-songwriter', 'Soul', 'Session work'];

    if (currentHoopType === 'Die-Cast') {
      secondaryGenres = ['Alternative', 'Pop session', 'Modern roots'];
    }

    if (
      heritageSummaryMatch &&
      typeof heritageSummaryMatch.highlightedCharacteristics === 'string' &&
      heritageSummaryMatch.highlightedCharacteristics.trim()
    ) {
      summary = heritageSummaryMatch.highlightedCharacteristics;
    }

    return {
      highlightedCharacteristics: summary,

      primaryGenre,

      recordingMic,

      playingSituation,

      feelRead,

      secondaryGenres,

      profile,
    };
  };

  const constructionSummary = `${size}" x ${depth}" • ${lugs} lugs • ${staveOption}`;

  const finishSummary = `${scorchDepth}`;

  const hardwareSummary = `${hardwareColor} • ${hoopType} • ${HERITAGE_STANDARD_SNARE_BED} bed`;

  const chartValues = useMemo(() => {
    return AXIS_META.map(({ key }) =>
      selectedDrumSummary?.profile?.[key] != null
        ? Number(selectedDrumSummary.profile[key])
        : 5
    );
  }, [selectedDrumSummary]);

  const chartBarData = useMemo(() => {
    return AXIS_META.reduce((acc, axis) => {
      acc[axis.key] =
        selectedDrumSummary?.profile?.[axis.key] != null
          ? Number(selectedDrumSummary.profile[axis.key])
          : 5;

      return acc;
    }, {});
  }, [selectedDrumSummary]);

  useEffect(() => {
    const fetchProductStatus = async () => {
      setIsLoading(true);

      try {
        const productRef = doc(db, 'products', 'heritage');

        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          setProduct(productSnap.data());
        } else {
          console.error('❌ Product doc not found: products/heritage');
        }
      } catch (error) {
        console.error('❌ Error fetching product status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductStatus();
  }, []);

  useEffect(() => {
    let newPrice = basePrices[size];

    newPrice += depthPrices[size][depth];

    const hasReRingOption =
      staveOption.includes('Re-Rings') || staveOption.includes('+ $150');

    if (hasReRingOption) newPrice += reRingCost;

    newPrice += hardwareUpchargeMap[hardwareColor] || 0;

    newPrice += hoopUpchargeMap[hoopType] || 0;

    setTotalPrice(newPrice);

    const staveParts = staveOption.split(' - ');

    const staveThickness =
      staveParts[1]?.replace(' + $150 (Re-Rings Required)', '') || '';

    const lugCount = `${lugs} Lugs`;

    const generatedKey = `${size}" - Base Price: $${
      basePrices[size]
    }-${depth}"-${lugCount}-${staveThickness}`;

    const heritageSummaryMatch = heritageSummaries[generatedKey] || null;

    setSelectedDrumSummary(
      buildLegacyVoiceRead({
        size,

        depth,

        lugs,

        staveOption,

        hardwareColor,

        hoopType,

        scorchDepth,

        heritageSummaryMatch,
      })
    );
  }, [size, depth, lugs, staveOption, hardwareColor, hoopType, scorchDepth]);

  useEffect(() => {
    const hasReRing =
      staveOption.includes('Re-Rings') || staveOption.includes('+ $150');

    const normalizedStave = staveOption.split(' - ')[0].trim();

    const normalizedHardware = hardwareColor.toLowerCase().replace(/\s+/g, '-');

    const normalizedHoops = hoopType.toLowerCase().replace(/\s+/g, '-');

    const normalizedScorch = scorchDepth.toLowerCase().replace(/\s+/g, '-');

    const matchingItem = cart.find((item) => {
      const iSize = item.size || item.config?.size;

      const iDepth = item.depth || item.config?.depth;

      const iLugs = item.lugQuantity || item.config?.lugQuantity;

      const iStave = item.staveQuantity || item.config?.staveQuantity;

      const iHardware = (item.hardwareColor || item.config?.hardwareColor || '')

        .toLowerCase()

        .replace(/\s+/g, '-');

      const iHoops = (item.hoopType || item.config?.hoopType || '')

        .toLowerCase()

        .replace(/\s+/g, '-');

      const iScorch = (item.scorchDepth || item.config?.scorchDepth || '')

        .toLowerCase()

        .replace(/\s+/g, '-');

      return (
        String(iSize) === String(size) &&
        String(iDepth) === String(depth) &&
        Boolean(item.reRing) === Boolean(hasReRing) &&
        String(iLugs) === String(lugs) &&
        String(iStave).trim() === normalizedStave &&
        iHardware === normalizedHardware &&
        iHoops === normalizedHoops &&
        iScorch === normalizedScorch
      );
    });

    if (matchingItem) {
      setCartItemId(matchingItem.id);

      setButtonText('In Cart');
    } else {
      setCartItemId(null);

      setButtonText('Add to Cart');
    }
  }, [
    cart,

    size,

    depth,

    staveOption,

    lugs,

    hardwareColor,

    hoopType,

    scorchDepth,
  ]);

  const handleAddToCart = async () => {
    if (!size || !depth) {
      console.error('❌ Missing selection: Size or Depth not chosen');

      return;
    }

    if (!product) {
      toast.error('❌ Product data not loaded yet.');

      return;
    }

    if (product.status !== 'active' && !product.isPreOrder) {
      toast.error('❌ This drum is currently unavailable.');

      return;
    }

    const hasReRing =
      staveOption.includes('Re-Rings') || staveOption.includes('+ $150');

    const matchedPricingOption = heritageSummaries.pricingOptions.find(
      (option) =>
        option.size === size &&
        option.depth === depth &&
        option.reRing === hasReRing
    );

    if (!matchedPricingOption) {
      console.error('❌ No matching pricing option found.');

      toast.error('Could not match this configuration.');

      return;
    }

    const newCartItemId = generateCartItemId({
      stripePriceId: matchedPricingOption.stripePriceId,

      size,

      depth,

      reRing: hasReRing,

      lugQuantity: lugs,

      staveQuantity: staveOption.split(' - ')[0],

      hardwareColor,

      hoopType,

      scorchDepth,
    });

    const cartItem = {
      id: newCartItemId,

      productId: 'heritage',

      name: 'HERITAGE',

      size,

      depth,

      reRing: hasReRing,

      lugQuantity: lugs,

      staveQuantity: staveOption.split(' - ')[0],

      price: totalPrice,

      stripePriceId: null,

      quantity: 1,

      images: [productImage],

      category: 'artisan',

      hardwareColor,

      hoopType,

      snareBedDepth: HERITAGE_STANDARD_SNARE_BED,

      bearingEdge: HERITAGE_STANDARD_BEARING_EDGE,

      scorchDepth,

      snareWireModel: 'Craftsman-selected PureSound',

      config: {
        series: 'HERITAGE',

        size,

        depth,

        reRing: hasReRing,

        lugQuantity: lugs,

        staveQuantity: staveOption.split(' - ')[0],

        hardwareColor,

        hoopType,

        snareBedDepth: HERITAGE_STANDARD_SNARE_BED,

        bearingEdge: HERITAGE_STANDARD_BEARING_EDGE,

        scorchDepth,

        snareWireModel: 'Craftsman-selected PureSound',
      },
    };

    await addToCart(cartItem, cartItem.config);

    toast.success('🛒 Item added to cart!');

    setCartItemId(newCartItemId);

    setButtonText('In Cart');
  };

  const handleRemoveFromCart = () => {
    if (cartItemId) {
      removeFromCart(cartItemId);

      toast.success('🗑️ Item removed from cart.');
    }
  };

  const handleSizeChange = (e) => {
    const newSize = e.target.value;

    setSize(newSize);

    setDepth(Object.keys(depthPrices[newSize])[0]);

    setLugs(lugOptions[newSize][0]);

    const staveList = staveOptions[newSize]?.[lugOptions[newSize][0]] || [];

    setStaveOption(
      staveList.find((s) => !s.includes('Re-Rings')) || staveList[0] || ''
    );
  };

  const handleDepthChange = (e) => {
    setDepth(e.target.value);
  };

  const handleLugChange = (e) => {
    const newLug = e.target.value;

    setLugs(newLug);

    const staveList = staveOptions[size]?.[newLug] || [];

    setStaveOption(
      staveList.find((s) => !s.includes('Re-Rings')) || staveList[0] || ''
    );
  };

  const handleStaveChange = (e) => {
    setStaveOption(e.target.value);
  };

  return (
    <div className="heritage-product-detail">
      <img
        src="/resized-logos/heritage-white.png"
        alt="HERITAGE Series"
        className="heritage-header-image"
      />

      <div className="heritage-hero-shell">
        <div className="heritage-product-content">
          <div className="heritage-product-visuals">
            <div className="heritage-product-image-card">
              <div className="heritage-product-image">
                <img src={productImage} alt="HERITAGE Snare Drum" />
              </div>
            </div>

            <div className="heritage-overview-card">
              <div className="heritage-overview-mark">
                {/* <img
                  src="/resized-logos/heritage-white.png"
                  alt="Heritage"
                  className="heritage-overview-logo"
                /> */}
              </div>

              {/* <h1 className="heritage-story-title">Tradition, reimagined.</h1> */}

              <p className="heritage-story-lede">
                The Heritage line carries the most rooted side of the Ober voice
                — warm, seasoned, tactile, and timeless.
              </p>

              <p className="heritage-story-copy">
                Built around Northern Red Oak stave construction and shaped with
                a classic bearing-edge profile, HERITAGE is designed for players
                who want organic feel, grounded body, and a drum that sounds
                deeply played-in from the first stroke.
              </p>

              <div className="heritage-overview-divider" />

              <h3 className="heritage-overview-subtitle">
                Key Build Highlights
              </h3>

              <ul className="heritage-overview-list">
                {heritageHighlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <p className="order-to-build-disclaimer">
                *Each Ober Artisan drum is built to order. The instrument you
                receive will closely reflect the design shown, but natural wood
                grain, torching, and exact visual character will vary based on
                your final configuration.
              </p>
            </div>
          </div>

          <aside className="heritage-builder-card">
            <div className="heritage-builder-head">
              <span className="heritage-builder-kicker">Build your drum</span>

              <h2>Configure Heritage</h2>

              <p>
                Build your Heritage in three guided steps: select your
                construction, choose your finish, then refine hardware and
                response.
              </p>
            </div>

            <div className="heritage-builder-sections">
              <div className="heritage-builder-section">
                <button
                  type="button"
                  className={`heritage-builder-section-toggle ${
                    openBuilderSection === 'construction' ? 'is-open' : ''
                  }`}
                  onClick={() =>
                    setOpenBuilderSection(
                      openBuilderSection === 'construction'
                        ? ''
                        : 'construction'
                    )
                  }
                >
                  <div className="heritage-builder-section-heading">
                    <span className="heritage-builder-section-step">1</span>

                    <div>
                      <h3>Select your construction</h3>

                      <p>{constructionSummary}</p>
                    </div>
                  </div>

                  <span className="heritage-builder-section-chevron">
                    {openBuilderSection === 'construction' ? '−' : '+'}
                  </span>
                </button>

                {openBuilderSection === 'construction' && (
                  <div className="heritage-builder-section-body">
                    <label htmlFor="size">Snare Size (Diameter)</label>

                    <select id="size" value={size} onChange={handleSizeChange}>
                      {Object.keys(basePrices).map((sizeOption) => (
                        <option key={sizeOption} value={sizeOption}>
                          {sizeOption}" - Base Price: ${basePrices[sizeOption]}
                        </option>
                      ))}
                    </select>

                    <label htmlFor="depth">Depth</label>

                    <select
                      id="depth"
                      value={depth}
                      onChange={handleDepthChange}
                    >
                      {Object.keys(depthPrices[size]).map((depthOption) => (
                        <option key={depthOption} value={depthOption}>
                          {depthOption}"{' '}
                          {depthPrices[size][depthOption] > 0
                            ? `+ $${depthPrices[size][depthOption]}`
                            : ''}
                        </option>
                      ))}
                    </select>

                    <label htmlFor="lugs">Lug Quantity</label>

                    <select id="lugs" value={lugs} onChange={handleLugChange}>
                      {lugOptions[size].map((lugOption) => (
                        <option key={lugOption} value={lugOption}>
                          {lugOption} Lugs
                        </option>
                      ))}
                    </select>

                    <label htmlFor="staves">
                      Stave Quantity &amp; Shell Thickness
                    </label>

                    <select
                      id="staves"
                      value={staveOption}
                      onChange={handleStaveChange}
                    >
                      {(staveOptions[size]?.[lugs] || []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>

                    <div className="heritage-builder-next-row">
                      <button
                        type="button"
                        className="heritage-builder-next-button"
                        onClick={() => setOpenBuilderSection('finish')}
                      >
                        Continue to Finish
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="heritage-builder-section">
                <button
                  type="button"
                  className={`heritage-builder-section-toggle ${
                    openBuilderSection === 'finish' ? 'is-open' : ''
                  }`}
                  onClick={() =>
                    setOpenBuilderSection(
                      openBuilderSection === 'finish' ? '' : 'finish'
                    )
                  }
                >
                  <div className="heritage-builder-section-heading">
                    <span className="heritage-builder-section-step">2</span>

                    <div>
                      <h3>Choose your finish</h3>

                      <p>{finishSummary}</p>
                    </div>
                  </div>

                  <span className="heritage-builder-section-chevron">
                    {openBuilderSection === 'finish' ? '−' : '+'}
                  </span>
                </button>

                {openBuilderSection === 'finish' && (
                  <div className="heritage-builder-section-body">
                    <label htmlFor="scorchDepth">Finish Scorch Depth</label>

                    <select
                      id="scorchDepth"
                      value={scorchDepth}
                      onChange={(e) => setScorchDepth(e.target.value)}
                    >
                      {scorchOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>

                    <p className="heritage-select-helper">
                      Heritage uses a standard snare bed and a fixed 45° inner
                      bearing edge with a softened outer roundover to keep the
                      line grounded, consistent, and unmistakably classic.
                    </p>

                    {heritageSwatchPreviewImage && (
                      <div className="heritage-swatch-preview-wrap">
                        <div className="heritage-swatch-preview">
                          <img
                            src={heritageSwatchPreviewImage}
                            alt={`${scorchDepth} Heritage finish swatch`}
                          />
                        </div>

                        <p className="heritage-swatch-disclaimer">
                          This swatch is a general visual guide. Final Heritage
                          finish character can vary based on wood grain, natural
                          absorption, torch response, and the unique behavior of
                          each shell. We’ll aim to get the final result as close
                          as possible to the preview.
                        </p>
                      </div>
                    )}

                    <div className="heritage-builder-next-row">
                      <button
                        type="button"
                        className="heritage-builder-next-button"
                        onClick={() => setOpenBuilderSection('hardware')}
                      >
                        Continue to Hardware
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="heritage-builder-section">
                <button
                  type="button"
                  className={`heritage-builder-section-toggle ${
                    openBuilderSection === 'hardware' ? 'is-open' : ''
                  }`}
                  onClick={() =>
                    setOpenBuilderSection(
                      openBuilderSection === 'hardware' ? '' : 'hardware'
                    )
                  }
                >
                  <div className="heritage-builder-section-heading">
                    <span className="heritage-builder-section-step">3</span>

                    <div>
                      <h3>Choose your hardware</h3>

                      <p>{hardwareSummary}</p>
                    </div>
                  </div>

                  <span className="heritage-builder-section-chevron">
                    {openBuilderSection === 'hardware' ? '−' : '+'}
                  </span>
                </button>

                {openBuilderSection === 'hardware' && (
                  <div className="heritage-builder-section-body">
                    <label htmlFor="hardwareColor">Hardware Finish</label>

                    <select
                      id="hardwareColor"
                      value={hardwareColor}
                      onChange={(e) => setHardwareColor(e.target.value)}
                    >
                      {hardwareOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <label htmlFor="hoopType">Hoop Type</label>

                    <select
                      id="hoopType"
                      value={hoopType}
                      onChange={(e) => setHoopType(e.target.value)}
                    >
                      {hoopOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <p className="heritage-select-helper">
                      Heritage uses a standard snare bed and a fixed
                      Heritage-standard bearing edge to keep the line grounded,
                      consistent, and unmistakably classic.
                    </p>

                    <p className="heritage-select-helper">
                      PureSound snare wires are selected by the craftsman to fit
                      the build.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="heritage-purchase-block">
              <p className="heritage-detail-price">
                {formatCurrency(totalPrice)}
              </p>

              <p className="delivery-time">Estimated delivery: 6–8 weeks</p>

              {buttonText === 'In Cart' ? (
                <div className="artisan-cart-hover-container">
                  <button className="artisan-in-cart-button" disabled>
                    ✔ In Cart
                  </button>

                  <div className="artisan-cart-hover-options">
                    <span onClick={() => navigate('/cart')}>View Cart</span>

                    <span onClick={handleRemoveFromCart}>Remove</span>
                  </div>
                </div>
              ) : (
                <button
                  className="artisan-add-to-cart-button"
                  onClick={handleAddToCart}
                  disabled={isLoading || !product}
                  title={isLoading ? 'Loading...' : ''}
                >
                  Add to Cart
                </button>
              )}
            </div>
          </aside>
        </div>

        <section className="heritage-summary-band">
          <div className="heritage-read-card">
            <span className="heritage-summary-kicker">
              Ober LegacyPrint™ Voice Read
            </span>

            <h3>Configuration snapshot</h3>

            <p className="heritage-read-summary">
              {selectedDrumSummary?.highlightedCharacteristics}
            </p>

            <div className="heritage-summary-grid">
              <div className="heritage-summary-item">
                <span className="heritage-summary-label">Primary Genre</span>

                <span className="heritage-summary-value">
                  {selectedDrumSummary?.primaryGenre}
                </span>
              </div>

              <div className="heritage-summary-item">
                <span className="heritage-summary-label">
                  Suggested Mic Lean
                </span>

                <span className="heritage-summary-value">
                  {selectedDrumSummary?.recordingMic}
                </span>
              </div>

              <div className="heritage-summary-item heritage-summary-item-wide">
                <span className="heritage-summary-label">
                  Playing Situation
                </span>

                <span className="heritage-summary-value">
                  {selectedDrumSummary?.playingSituation}
                </span>
              </div>

              <div className="heritage-summary-item heritage-summary-item-wide">
                <span className="heritage-summary-label">
                  Feel / Visual Lean
                </span>

                <span className="heritage-summary-value">
                  {selectedDrumSummary?.feelRead}
                </span>
              </div>

              <div className="heritage-summary-item heritage-summary-item-wide">
                <span className="heritage-summary-label">Secondary Lanes</span>

                <span className="heritage-summary-value">
                  {Array.isArray(selectedDrumSummary?.secondaryGenres)
                    ? selectedDrumSummary.secondaryGenres.join(' • ')
                    : ''}
                </span>
              </div>
            </div>
          </div>

          <div className="heritage-chart-card">
            <div className="heritage-chart-head">
              <div>
                <span className="heritage-summary-kicker">Profile</span>

                <h3>Sound behavior</h3>
              </div>

              <div className="heritage-chart-toggle">
                <button
                  type="button"
                  className={chartView === 'spider' ? 'is-active' : ''}
                  onClick={() => setChartView('spider')}
                >
                  Spider
                </button>

                <button
                  type="button"
                  className={chartView === 'bars' ? 'is-active' : ''}
                  onClick={() => setChartView('bars')}
                >
                  Bars
                </button>
              </div>
            </div>

            <div className="heritage-chart-wrap">
              {chartView === 'spider' ? (
                <SpiderChart
                  data={chartValues}
                  labels={AXIS_META.map((axis) => axis.label)}
                  pointColors={AXIS_POINT_COLORS}
                />
              ) : (
                <BarChart data={chartBarData} min={4} />
              )}
            </div>

            <div className="heritage-axis-summary">
              {AXIS_META.map((axis) => (
                <div key={axis.key} className="heritage-axis-chip">
                  <span>{axis.label}</span>

                  <strong>
                    {selectedDrumSummary?.profile?.[axis.key] != null
                      ? Number(selectedDrumSummary.profile[axis.key]).toFixed(1)
                      : '5.0'}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HeritageProductDetail;
