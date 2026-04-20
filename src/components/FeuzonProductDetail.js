import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebaseConfig'; // Import Firestore configuration
import { doc, getDoc, setDoc, collection } from 'firebase/firestore'; // ✅ MOVE THIS TO THE TOP
import { useCart } from '../context/CartContext'; // Adjust path if needed
import SpiderChart from './SpiderChart';
import { useNavigate } from 'react-router-dom';
import BarChart from './BarChart';
import feuzonSummaries from '../data/feuzonSummaries';
import './FeuzonProductDetail.css';
import toast from 'react-hot-toast'; // ✅ Import toast

const FeuzonProductDetail = () => {
  const [outerShell, setOuterShell] = useState('Maple');
  const [innerStave, setInnerStave] = useState('Walnut + Birch');
  const [size, setSize] = useState('12');
  const [depth, setDepth] = useState('5.0');
  const [lugs, setLugs] = useState('8');
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showAddSeparateModal, setShowAddSeparateModal] = useState(false);
  const [hardwareColor, setHardwareColor] = useState('Chrome');
  const [staveOption, setStaveOption] = useState('');
  const [staveQuantities, setStaveQuantities] = useState([]);
  const [totalPrice, setTotalPrice] = useState(1050);
  const [selectedDrumSummary, setSelectedDrumSummary] = useState(null);
  const [selectionChanged, setSelectionChanged] = useState(false);
  const [stripePriceId, setStripePriceId] = useState(null);
  const [staveQuantity, setStaveQuantity] = useState(16);
  const [reRing, setReRing] = useState(false);
  const [currentQuantity, setCurrentQuantity] = useState(null);
  const reRingCost = 150;
  const [productQuantity, setProductQuantity] = useState(null);
  const [isLoadingProductAvailability, setIsLoadingProductAvailability] =
    useState(true);
  const { cart, cartId, addToCart, removeFromCart } = useCart();
  const [productInCart, setProductInCart] = useState(false);
  const [flickerChangeSelection, setFlickerChangeSelection] = useState(false);
  const [product, setProduct] = useState(null);

  const productImage = useMemo(() => {
  return (
    product?.images?.[0] ||
    '/resized-logos/feuzon-placeholder.png' // optional fallback
  );
}, [product]);


useEffect(() => {
  const fetchProduct = async () => {
    try {
      const productRef = doc(db, 'products', 'feuzon');
      const snap = await getDoc(productRef);
      if (snap.exists()) {
        setProduct(snap.data());
      } else {
        console.error('❌ Product doc not found: products/feuzon');
      }
    } catch (err) {
      console.error('❌ Error fetching feuzon product:', err);
    }
  };

  fetchProduct();
}, []);

  // Derive re-ring from label
  useEffect(() => {
    const isReRingRequired =
      staveOption.includes('Re-Rings') || staveOption.includes('+ $150');
    setReRing(isReRingRequired);
  }, [staveOption]);

  const navigate = useNavigate();

  const basePrices = { 12: 1050, 13: 1150, 14: 1250 };

  const depthPrices = {
    12: { '5.0': 0, '5.5': 50, '6.0': 100, '6.5': 150, '7.0': 200, '7.5': 250, '8.0': 300 },
    13: { '5.0': 0, '5.5': 50, '6.0': 100, '6.5': 150, '7.0': 200, '7.5': 250, '8.0': 300 },
    14: { '5.0': 0, '5.5': 50, '6.0': 100, '6.5': 150, '7.0': 200, '7.5': 250, '8.0': 300 },
  };

  // 🔹 Fallback price (base + depth + re-ring upcharge)
  const computeFallbackPrice = (sizeVal, depthVal, hasReRing) => {
    const b = basePrices[String(sizeVal)] ?? 0;
    const d = depthPrices[String(sizeVal)]?.[String(depthVal)] ?? 0;
    const r = hasReRing ? reRingCost : 0;
    return b + d + r;
  };

  const staveOptions = {
    Maple: ['Walnut + Birch', 'Oak + Cherry', 'Maple + Bubinga'],
    Walnut: ['Mahogany + Cherry', 'Walnut + Padauk', 'Oak + Wenge'],
    Cherry: ['Birch + Maple', 'Zebrawood + Mahogany', 'Padauk + Ash'],
  };

  const lugOptions = {
    12: ['6', '8'],
    13: ['8'],
    14: ['8', '10'],
  };

  const staveMapping = {
    12: {
      6: ['12 - 10mm'],
      8: ['16 - 13mm'],
    },
    13: {
      6: ['12 - 11mm'],
      8: ['16 - 13mm'],
    },
    14: {
      8: ['16 - 13mm'],
      10: ['20 - 14mm', '10 - 10mm + $150 (Re-Rings Required)'],
    },
  };

  const [soundProfile, setSoundProfile] = useState({
    attack: 8,
    sustain: 7,
    brightness: 7,
    warmth: 7,
    projection: 8,
  });

  const handleNotifyMe = () => {
    alert('You will be notified when this drum is available for order!');
  };

  const handleChangeSelections = () => {
    setProductInCart(false);
    const existingItemIndex = cart.findIndex(
      (item) => item.productId === 'feuzon'
    );
    if (existingItemIndex !== -1) {
      const updatedCart = cart.filter((item) => item.productId !== 'feuzon');
    }
    removeFromCart('feuzon');
    setTimeout(() => {
      setProductInCart(false);
    }, 500);
  };

  useEffect(() => {
    if (!stripePriceId || !outerShell || !innerStave) return;

    const generatedId = `feuzon-${stripePriceId}-${size}-${depth}-${reRing}-${lugs}-${staveQuantity}-${outerShell}-${innerStave}`;
    const isInCart = cart.some((item) => item.id === generatedId);
    setProductInCart(isInCart);
  }, [
    cart,
    stripePriceId,
    size,
    depth,
    reRing,
    lugs,
    staveQuantity,
    outerShell,
    innerStave,
  ]);

  const handleAddToCart = async () => {
    if (!stripePriceId) {
      toast.error(
        'Stripe Payment ID is missing for this configuration. Try changing lugs/depth, or refresh.'
      );
      return;
    }

    const cartItem = {
      id: `feuzon-${stripePriceId}-${size}-${depth}-${reRing}-${lugs}-${staveQuantity}-${outerShell}-${innerStave}`,
      productId: 'feuzon',
      name: 'FEUZØN',
      size,
      depth,
      reRing: !!reRing,
      lugQuantity: lugs,
      staveQuantity,
      price: totalPrice,
      stripePriceId,
      quantity: 1,
 images: [productImage],
      category: 'artisan',
      options: {
        outerShell,
        innerStave,
        hardwareColor,
      },
    };

    try {
      await addToCart(cartItem, cartItem);
      setTimeout(() => {
        setProductInCart(true); // ✅ Prevents flickering
      }, 300);

      toast.success('🛒 Item added to cart!');
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      toast.error('❌ Failed to add item to cart.');
    }
  };

  useEffect(() => {
    if (!feuzonSummaries || Object.keys(feuzonSummaries).length === 0) {
      return;
    }

    const normalizedSize = String(size).trim();
    const normalizedDepth = String(depth).trim();
    const hasReRing =
      staveOption.includes('Re-Rings') || staveOption.includes('+ $150');

    // ✅ Ensure valid lug count
    if (!lugOptions[size]?.includes(lugs)) {
      setLugs(lugOptions[size][0]);
      return;
    }

    // ✅ Fetch Valid Stave Options
    let updatedStaveOptions = staveMapping[size]?.[lugs] || [];

    // ✅ Ensure stave option is valid
    if (!updatedStaveOptions.includes(staveOption) || staveOption === '') {
      setStaveOption(
        updatedStaveOptions.length > 0 ? updatedStaveOptions[0] : ''
      );
    }

    if (!staveQuantities.includes(staveOption)) {
      setStaveOption(staveQuantities[0] || '');
    }

    // ✅ Update Stave Quantities
    setStaveQuantities(updatedStaveOptions);

    // ---------- PRICE & STRIPE ID RESOLUTION ----------
    // Always set a visible fallback price first (prevents $0)
    const fallback = computeFallbackPrice(normalizedSize, normalizedDepth, hasReRing);
    setTotalPrice(fallback);

    // Progressive match: exact → relax
    const list = feuzonSummaries.pricingOptions || [];
    const exact =
      list.find(
        (o) =>
          String(o.size).trim() === normalizedSize &&
          String(o.depth).trim() === normalizedDepth &&
          String(o.lugQuantity) === String(lugs) &&
          Boolean(o.reRing) === Boolean(hasReRing)
      ) ||
      list.find(
        (o) =>
          String(o.size).trim() === normalizedSize &&
          String(o.depth).trim() === normalizedDepth &&
          Boolean(o.reRing) === Boolean(hasReRing)
      ) ||
      list.find(
        (o) =>
          String(o.size).trim() === normalizedSize &&
          String(o.depth).trim() === normalizedDepth
      ) ||
      list.find((o) => String(o.size).trim() === normalizedSize);

    if (exact) {
      setTotalPrice(exact.price);
      setStripePriceId(exact.stripePriceId || null);
      setStaveQuantity(exact.staveQuantity ?? staveQuantity);
    } else {
      // keep fallback price; no Stripe ID for this combo
      setStripePriceId(null);
      const qtyFromLabel =
        (staveOption.split(' - ')[0] || '').replace(/\D/g, '') || 16;
      setStaveQuantity(Number(qtyFromLabel));
    }

    // ✅ Ensure correct lookup key for artisan notes
    const formattedSize = `${size}"`;
    const formattedBasePrice = `$${(exact?.price ?? fallback)}`;
    const formattedDepth = `${depth}"`;
    const formattedLugs = `${lugs} Lugs`;
    const formattedOuterShell = outerShell.trim();
    const formattedInnerStave = innerStave.trim();
    const staveParts = staveOption.split(' - ');
    const formattedStaveQuantity = staveParts[0]?.trim();
    const formattedStaveThickness = staveParts[1]?.trim();

    const generatedKey = `${formattedSize} - Base Price: ${formattedBasePrice}-${formattedDepth}-${formattedLugs}-${formattedStaveQuantity} - ${formattedStaveThickness}-${formattedOuterShell}-${formattedInnerStave}`;

    const normalizeKey = (key) => key.toLowerCase().replace(/\s+/g, ' ').trim();

    const normalizedGeneratedKey = normalizeKey(generatedKey);
    const availableKeys = Object.keys(feuzonSummaries).map(normalizeKey);

    const exactMatchIndex = availableKeys.indexOf(normalizedGeneratedKey);
    if (exactMatchIndex !== -1) {
      const exactKey = Object.keys(feuzonSummaries)[exactMatchIndex];
      setSelectedDrumSummary(feuzonSummaries[exactKey]);
      return;
    }

    const closestMatch = availableKeys.find(
      (key) => key.includes(formattedSize) && key.includes(formattedBasePrice)
    );

    if (closestMatch) {
      const closestKey =
        Object.keys(feuzonSummaries)[availableKeys.indexOf(closestMatch)];
      setSelectedDrumSummary(feuzonSummaries[closestKey]);
    } else {
      setSelectedDrumSummary({
        highlightedCharacteristics: 'N/A',
        primaryGenre: 'N/A',
        secondaryGenres: ['N/A'],
        playingSituation: 'N/A',
        recordingMic: 'N/A',
      });
    }
  }, [size, depth, lugs, staveOption, outerShell, innerStave]);

  // cart id check (kept as-is)
  useEffect(() => {
    const generatedId = `feuzon-${size}-${depth}-${lugs}-${staveQuantity}`;
    const isInCart = cart.some((item) => item.id === generatedId);
  }, [cart, size, depth, lugs, staveQuantity]);

  // reset inner stave when outer shell changes
  useEffect(() => {
    if (staveOptions[outerShell] && staveOptions[outerShell].length > 0) {
      setInnerStave(staveOptions[outerShell][0]);
    }
  }, [outerShell]);

  // reset depth/lugs/stave option when size or lugs change
  useEffect(() => {
    if (depthPrices[size]) {
      const validDepths = Object.keys(depthPrices[size]);
      if (!validDepths.includes(depth)) {
        const defaultDepth = validDepths[0];
        setDepth(defaultDepth);
      }
    }

    if (lugOptions[size]) {
      const validLugs = lugOptions[size];
      if (!validLugs.includes(lugs)) {
        const defaultLugs = validLugs[0];
        setLugs(defaultLugs);
      }
    }

    if (staveMapping[size]?.[lugs]) {
      const validStaveOptions = staveMapping[size][lugs];
      if (!validStaveOptions.includes(staveOption)) {
        const defaultStaveOption =
          validStaveOptions.length > 0 ? validStaveOptions[0] : '';
        setStaveOption(defaultStaveOption);
      }
    }
  }, [size, lugs]);

  useEffect(() => {
    if (!stripePriceId) return;

    const generatedId = `feuzon-${stripePriceId}-${size}-${depth}-${reRing}-${lugs}-${staveQuantity}-${outerShell}-${innerStave}`;
    const isInCart = cart.some((item) => item.id === generatedId);

    if (isInCart !== productInCart) {
      setProductInCart(isInCart);
    }
  }, [
    cart,
    stripePriceId,
    size,
    depth,
    reRing,
    lugs,
    staveQuantity,
    outerShell,
    innerStave,
  ]);

  const handleModifySelection = () => {
    setProductInCart(false);
    setShowModifyModal(false);
    setSelectionChanged(false);
    handleAddToCart(false);
  };

  const handleRemoveFromCart = async () => {
    const generatedId = `feuzon-${stripePriceId}-${size}-${depth}-${reRing}-${lugs}-${staveQuantity}-${outerShell}-${innerStave}`;
    setProductInCart(false);
    await removeFromCart(generatedId);
    toast.success('🗑️ Item removed from cart.');
  };

  const handleAddSeparateItem = async () => {
    const feuzonQuantityInCart = cart
      .filter((item) => item.productId === 'feuzon')
      .reduce((total, item) => total + item.quantity, 0);

    if (currentQuantity > feuzonQuantityInCart) {
      await handleAddToCart(true);
      setShowAddSeparateModal(false);
    } else {
      alert('❌ Not enough stock available to add another Feuzon.');
      console.error(
        'Stock Check Failed! Current Stock:',
        currentQuantity,
        ' | Feuzon In Cart:',
        feuzonQuantityInCart
      );
    }
  };

  const totalFeuzonInCart = cart
    .filter((item) => item.productId === 'feuzon')
    .reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <div className="feuzon-product-detail">
      <img
        src="/resized-logos/feuzon-white.png"
        alt="FEUZØN Series"
        className="feuzon-header-image"
      />

      <div className="feuzon-product-content">
<img className="feuzon-product-image" src={productImage} alt="FEUZON Snare Drum" />

        <div className="feuzon-product-options">
          <div className="feuzon-features">
            <h2>FEUZØN Series Features</h2>
            <ul>
              <li>Hybrid Shell Construction</li>
              <li>Combines Various Wood Species For A Unique Tone</li>
              <li>Roundover Outer / 45° Inner Bearing Edge</li>
              <li>Precision Cut Snare Beds</li>
              <li>Die-cast Hoops</li>
              <li>Double Ended Tube Lugs</li>
              <li>Precision Cut Snare Beds</li>
              <li>Stained or Natural Semi-Gloss Finish</li>
              <li>Torch Tuned for Maximum Resonance</li>
              <li>Trick Snare Throw-Off</li>
              <li>Puresound Snare Wires</li>
              <li>Remo Coated Ambassador Batter & Clear Snare Side</li>
              <li>Estimated Delivery: 7-10 weeks</li>
              <p className="order-to-build-disclaimer">
                *Note: Each Ober Artisan Drum is built to order. The drum you
                receive will closely reflect the design shown, but natural wood
                grain patterns and dimensions may vary depending on your
                selected size and configuration.
              </p>
            </ul>
          </div>

          <h2>Build Options</h2>

          <label htmlFor="size">Snare Size (Diameter)</label>
          <select
            id="size"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          >
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
            onChange={(e) => setDepth(e.target.value)}
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

          <label htmlFor="outerShell">Exterior Shell (Steam Bent)</label>
          <select
            id="outerShell"
            value={outerShell}
            onChange={(e) => setOuterShell(e.target.value)}
          >
            {Object.keys(staveOptions).map((shell) => (
              <option key={shell} value={shell}>
                {shell}
              </option>
            ))}
          </select>

          <label htmlFor="innerStave">Interior Shell (Stave)</label>
          <select
            id="innerStave"
            value={innerStave}
            onChange={(e) => setInnerStave(e.target.value)}
          >
            {staveOptions[outerShell].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <label htmlFor="lugs">Lug Quantity</label>
          <select
            id="lugs"
            value={lugs}
            onChange={(e) => setLugs(e.target.value)}
          >
            {lugOptions[size].map((lugOption) => (
              <option key={lugOption} value={lugOption}>
                {lugOption} Lugs
              </option>
            ))}
          </select>

          <label htmlFor="staves">Stave Quantity & Shell Thickness</label>
          <select
            id="staves"
            value={staveOption}
            onChange={(e) => setStaveOption(e.target.value)}
          >
            {staveQuantities.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <label htmlFor="hardwareColor">Hardware Finish</label>
          <select
            id="hardwareColor"
            value={hardwareColor}
            onChange={(e) => setHardwareColor(e.target.value)}
          >
            <option value="Chrome">Chrome</option>
            <option value="Black Nickel">Black Nickel</option>
            <option value="Brass/Gold">Brass/Gold</option>
          </select>

          <p className="feuzon-detail-price">${totalPrice}</p>
          <p className="delivery-time">Est Delivery: 7–10 weeks</p>

          {productInCart ? (
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
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeuzonProductDetail;