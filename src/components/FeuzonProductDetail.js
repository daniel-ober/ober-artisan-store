import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig'; // Import Firestore configuration
import { doc, getDoc } from 'firebase/firestore'; // Add Firestore imports
import { useCart } from '../context/CartContext'; // Adjust path if needed
import SpiderChart from './SpiderChart';
import BarChart from './BarChart';
import feuzonSummaries from '../data/feuzonSummaries';
import './FeuzonProductDetail.css';

const FeuzonProductDetail = () => {
  const [outerShell, setOuterShell] = useState('Maple');
  const [innerStave, setInnerStave] = useState('Walnut + Birch');
  const [size, setSize] = useState('12');
  const [depth, setDepth] = useState('5.0');
  const [lugs, setLugs] = useState('8');
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showAddSeparateModal, setShowAddSeparateModal] = useState(false);
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

  const basePrices = { 12: 1050, 13: 1150, 14: 1250 };

  const depthPrices = {
    12: { '5.0': 0, '6.0': 100, '7.0': 200 },
    13: { '5.0': 0, '6.0': 100, '7.0': 200 },
    14: { '5.0': 0, '6.0': 100, '7.0': 200 },
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
    // console.log('📩 User signed up for availability notifications.');
    // 🚀 Future Implementation: Store this in Firestore for email notifications
  };

  const handleChangeSelections = () => {
    // console.log('🔄 Changing Selections - Resetting Cart State');

    // ✅ Reset the `productInCart` state
    setProductInCart(false);

    // ✅ Ensure the cart updates correctly when modifying the product
    const existingItemIndex = cart.findIndex(
      (item) => item.productId === 'feuzon'
    );
    if (existingItemIndex !== -1) {
      // console.log(
      //   '♻️ Removing Feuzon item temporarily to allow selection update.'
      // );
      const updatedCart = cart.filter((item) => item.productId !== 'feuzon');

      // ✅ Update the Firestore cart first, then local state
      removeFromCart('feuzon');
      setTimeout(() => {
        setProductInCart(false);
      }, 500);
    }
  };

  const handleAddToCart = async (addAsSeparateItem = false) => {
    // console.log('🛒 Add to Cart button clicked!');
  
    if (!stripePriceId) {
      console.error('❌ Missing Stripe Price ID! Firestore update may fail.');
      alert('Stripe Payment ID is missing. Please refresh the page and try again.');
      return;
    }
  
    // ✅ Generate a valid unique ID for the cart item
    const generatedId = `feuzon-${size}-${depth}-${lugs}-${staveQuantity}`;
    // console.log('🆔 Generated ID:', generatedId);
    // console.log('💳 Stripe Price ID:', stripePriceId);
  
    // ✅ Construct selectedOptions to pass necessary details
    const selectedOptions = {
      size: size || "N/A",
      depth: depth || "N/A",
      lugQuantity: lugs || "N/A",
      staveQuantity: staveQuantity || "N/A",
      reRing: reRing ?? false,
      outerShell: outerShell || "N/A",
      innerStave: innerStave || "N/A",
      stripePriceId: stripePriceId || "",
      totalPrice: Number(totalPrice) || 0, // 🔥 Ensure price is correctly stored
    };
  
    // ✅ Construct the cartItem object
    const cartItem = {
      id: `${stripePriceId || "no-stripe-id"}-${size}-${depth}-${reRing}-${lugs}-${staveQuantity}`,
      productId: "feuzon",
      name: "FEUZØN",
      category: "artisan",
      quantity: 1,
      price: selectedOptions.totalPrice, // ✅ Fix price assignment
      ...selectedOptions, // ✅ Spread all selectedOptions to ensure values are passed
      timestamp: new Date().toISOString(),
    };
  
    // console.log('🛠️ Cart Item before adding:', cartItem);
    // console.log('🔍 Debugging Selected Options:', selectedOptions);
  
    let updatedCart = [...cart];
  
    // ✅ Check if product already exists in the cart
    const existingCustomProductIndex = updatedCart.findIndex(
      (item) =>
        item.productId === 'feuzon' &&
        item.size === size &&
        item.depth === depth &&
        item.lugQuantity === lugs &&
        item.staveQuantity === staveQuantity &&
        item.reRing === reRing
    );
  
    if (existingCustomProductIndex !== -1 && !addAsSeparateItem) {
      // ✅ Increase quantity instead of adding duplicate
      updatedCart[existingCustomProductIndex].quantity += 1;
      // console.log('♻️ Updated existing Feuzon quantity in cart:', updatedCart);
    } else {
      // ✅ Add as new separate Feuzon drum
      updatedCart.push(cartItem);
      // console.log('➕ Adding new Feuzon drum as separate item:', cartItem);
    }
  
    // console.log('📢 Updated Cart Before Firestore Save:', updatedCart);
  
    try {
      await addToCart(cartItem, selectedOptions); // ✅ Pass correct arguments
      // console.log('✅ Firestore updated successfully!');
    } catch (error) {
      // console.error('❌ Error updating Firestore:', error);
      alert('An error occurred while updating the cart. Please try again.');
      return;
    }
  
    setSelectionChanged(false);
  
    if (!cartId) {
      console.error('❌ cartId is missing! Firestore may not update.');
      return;
    }
  
    // console.log('🔄 Checking Firestore for updated cart...');
    try {
      setTimeout(async () => {
        const cartRef = doc(db, 'carts', cartId);
        const cartDoc = await getDoc(cartRef);
        if (cartDoc.exists()) {
          // console.log('✅ Firestore Cart Updated:', cartDoc.data().cart);
  
          const updatedCartData = cartDoc.data().cart || [];
          const isProductInCart = updatedCartData.some(
            (item) => item.id === generatedId
          );
          setProductInCart(isProductInCart);
          // console.log('🛒 isProductInCart:', isProductInCart);
        } else {
          // console.error('❌ Firestore Cart Update Failed.');
        }
      }, 1000);
    } catch (error) {
      // console.error('❌ Error retrieving cart data from Firestore:', error);
    }
  };

  useEffect(() => {
    // console.log('🔄 Updating Price, Stave Options & Sound Profile...');

    if (!feuzonSummaries || Object.keys(feuzonSummaries).length === 0) {
      // console.warn('⚠️ feuzonSummaries is empty or not loaded yet!');
      return;
    }

    // console.log(
    //   '🗂️ Available keys in feuzonSummaries:',
    //   Object.keys(feuzonSummaries)
    // ); // ✅ Debugging log

    const normalizedSize = String(size).trim();
    const normalizedDepth = String(depth).trim();
    const hasReRing =
      staveOption.includes('Re-Rings') || staveOption.includes('+ $150');

    // ✅ Ensure valid lug count
    if (!lugOptions[size]?.includes(lugs)) {
      console.warn(
        // `⚠️ Invalid lug count (${lugs}) for size ${size}. Resetting to default.`
      );
      setLugs(lugOptions[size][0]);
      return;
    }

    // ✅ Fetch Valid Stave Options
    let updatedStaveOptions = staveMapping[size]?.[lugs] || [];
    // console.log('🧐 Checking stave options for size:', size, 'lugs:', lugs);
    // console.log('✅ Retrieved Stave Options:', updatedStaveOptions);

    // ✅ Ensure stave option is valid
    if (!updatedStaveOptions.includes(staveOption) || staveOption === '') {
      // console.warn(`⚠️ Invalid or empty stave option detected. Resetting...`);
      setStaveOption(
        updatedStaveOptions.length > 0 ? updatedStaveOptions[0] : ''
      );
    }

    if (!staveQuantities.includes(staveOption)) {
      // console.warn(`⚠️ Stave Option Not Found. Resetting to default.`);
      setStaveOption(staveQuantities[0] || '');
    }

    // ✅ Update Stave Quantities
    setStaveQuantities(updatedStaveOptions);

    // ✅ Find the correct pricing option
    const selectedOption = feuzonSummaries.pricingOptions.find(
      (option) =>
        String(option.size).trim() === normalizedSize &&
        String(option.depth).trim() === normalizedDepth &&
        option.reRing === hasReRing &&
        option.lugQuantity.toString() === lugs
    );

    if (!selectedOption) {
      console.error('❌ No matching pricing option found for:', {
        size: normalizedSize,
        depth: normalizedDepth,
        reRing: hasReRing,
        lugs,
      });
      setTotalPrice(0);
      setStripePriceId(null);
      return;
    }

    // console.log('✅ Selected Pricing Option:', selectedOption);

    // ✅ Extract pricing and stripePriceId
    setTotalPrice(selectedOption.price);
    setStripePriceId(selectedOption.stripePriceId);
    setStaveQuantity(selectedOption.staveQuantity);

    // ✅ Extract stave thickness
    let staveParts = staveOption.split(' - ');
    let staveCount = staveParts[0]?.trim() || 'UNKNOWN_STAVE_COUNT';
    let staveThickness =
      staveParts.length > 1 ? staveParts[1]?.trim() : 'UNKNOWN_THICKNESS';

    const finalPrice = selectedOption.price + (reRing ? reRingCost : 0);
    setTotalPrice(finalPrice);
    // console.log(
    //   `💰 Updated Price (including reRing if applicable): $${finalPrice}`
    // );

    // ✅ Ensure correct lookup key for artisan notes
    const formattedSize = `${size}"`;
    const formattedBasePrice = `$${totalPrice}`;
    const formattedDepth = `${depth}"`;
    const formattedLugs = `${lugs} Lugs`;
    const formattedOuterShell = outerShell.trim(); // Remove any extra spaces
    const formattedInnerStave = innerStave.trim();

    const formattedStaveQuantity = staveParts[0]?.trim();
    const formattedStaveThickness = staveParts[1]?.trim();

    // ✅ Generate the correctly formatted key
    const generatedKey = `${formattedSize} - Base Price: ${formattedBasePrice}-${formattedDepth}-${formattedLugs}-${formattedStaveQuantity} - ${formattedStaveThickness}-${formattedOuterShell}-${formattedInnerStave}`;

    // console.log('🧐 Checking feuzonSummaries for generated key:', generatedKey);
    // console.log(
    //   '🔎 Available feuzonSummaries keys:',
    //   Object.keys(feuzonSummaries)
    // );

    // ✅ Normalize function to prevent minor mismatches
    const normalizeKey = (key) => key.toLowerCase().replace(/\s+/g, ' ').trim(); // Normalize spaces

    const normalizedGeneratedKey = normalizeKey(generatedKey);
    const availableKeys = Object.keys(feuzonSummaries).map(normalizeKey);

    // ✅ Find an exact match in normalized keys
    const exactMatchIndex = availableKeys.indexOf(normalizedGeneratedKey);
    if (exactMatchIndex !== -1) {
      const exactKey = Object.keys(feuzonSummaries)[exactMatchIndex];
      // console.log('✅ Exact Match Found:', exactKey);
      setSelectedDrumSummary(feuzonSummaries[exactKey]);
      return;
    }

    // ❌ If no exact match, attempt fuzzy matching for close keys
    // console.warn('⚠️ No exact match. Attempting closest match...');
    const closestMatch = availableKeys.find(
      (key) => key.includes(formattedSize) && key.includes(formattedBasePrice)
    );

    if (closestMatch) {
      const closestKey =
        Object.keys(feuzonSummaries)[availableKeys.indexOf(closestMatch)];
      // console.log('🟢 Using Closest Match:', closestKey);
      setSelectedDrumSummary(feuzonSummaries[closestKey]);
    } else {
      console.error('❌ No match found. Displaying fallback summary.');
      setSelectedDrumSummary({
        highlightedCharacteristics: 'N/A',
        primaryGenre: 'N/A',
        secondaryGenres: ['N/A'],
        playingSituation: 'N/A',
        recordingMic: 'N/A',
      });
    }
  }, [size, depth, lugs, staveOption, outerShell, innerStave]);

  // ✅ This must be at the top level, NOT inside another function!
  useEffect(() => {
    // console.log(
    //   '🗂️ Available feuzonSummaries keys:',
    //   Object.keys(feuzonSummaries)
    // );
    // console.log('🛒 Cart Updated:', cart);

    // ✅ Generate the exact ID format used when adding the product
    const generatedId = `feuzon-${size}-${depth}-${lugs}-${staveQuantity}`;

    // ✅ Check if this specific product is in the cart
    const isInCart = cart.some((item) => item.id === generatedId);

    // console.log(
    //   '🔍 Checking if product is in cart:',
    //   isInCart,
    //   'for ID:',
    //   generatedId
    // );
    // console.log(
    //   '🔍 Current Cart Contents:',
    //   cart.map((item) => item.id)
    // );

    setProductInCart(cart.some((item) => item.id === generatedId));
        // console.log('✅ productInCart Updated to:', isInCart);
  }, [cart, size, depth, lugs, staveQuantity]);

  // ✅ **New Effect to Reset `innerStave` When `outerShell` Changes**
  useEffect(() => {
    if (staveOptions[outerShell] && staveOptions[outerShell].length > 0) {
      // console.log(
      //   `🔄 Resetting Inner Stave due to Outer Shell change: ${outerShell}`
      // );
      setInnerStave(staveOptions[outerShell][0]); // Auto-select the first valid inner stave
    }
  }, [outerShell]); // Trigger only when outerShell changes

  // ✅ **New Effect to Reset `depth`, `lugs`, and `staveOption` When `size` Changes**
  useEffect(() => {
    // console.log(
    //   `🔄 Resetting Depth, Lugs, and Stave Option due to Snare Size or Lug Change: ${size}, ${lugs}`
    // );

    // ✅ Auto-select first valid depth
    if (depthPrices[size]) {
      const validDepths = Object.keys(depthPrices[size]);
      if (!validDepths.includes(depth)) {
        const defaultDepth = validDepths[0];
        setDepth(defaultDepth);
        console.log(`✅ Depth reset to ${defaultDepth}"`);
      }
    }

    // ✅ Auto-select first valid lug count
    if (lugOptions[size]) {
      const validLugs = lugOptions[size];
      if (!validLugs.includes(lugs)) {
        const defaultLugs = validLugs[0];
        setLugs(defaultLugs);
        console.log(`✅ Lugs reset to ${defaultLugs}`);
      }
    }

    // ✅ Auto-select first valid stave option when `lugs` changes
    if (staveMapping[size]?.[lugs]) {
      const validStaveOptions = staveMapping[size][lugs];
      if (!validStaveOptions.includes(staveOption)) {
        const defaultStaveOption =
          validStaveOptions.length > 0 ? validStaveOptions[0] : '';
        setStaveOption(defaultStaveOption);
        // console.log(`✅ Stave Option reset to ${defaultStaveOption}`);
      }
    }
  }, [size, lugs]);

  // ✅ Fetch Product Availability from Firestore
  useEffect(() => {
    const fetchProductAvailability = async () => {
      if (!size || !depth || !lugs) return;
      setIsLoadingProductAvailability(true);

      try {
        const productRef = doc(db, 'products', 'feuzon');
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          const productData = productSnap.data();
          // console.log('📦 Firestore Product Data:', productData);

          const fetchedQuantity = productData.currentQuantity ?? 0; // Ensure it's not null
          setCurrentQuantity(fetchedQuantity);
          // console.log('✅ Successfully set currentQuantity:', fetchedQuantity);
        } else {
          // console.warn('⚠️ Product not found in Firestore');
          setCurrentQuantity(0);
        }
      } catch (error) {
        console.error('❌ Error fetching product availability:', error);
        setCurrentQuantity(0);
      } finally {
        setIsLoadingProductAvailability(false);
      }
    };

    fetchProductAvailability(); // ✅ Ensure function is defined before being called
  }, [size, depth, lugs]); // ✅ Runs when size, depth, or lugs change

  // ✅ Handle modifying an existing Feuzon selection
  const handleModifySelection = () => {
    console.log('♻️ Updating Feuzon configuration in the cart...');

    // ✅ Reset states to ensure correct re-addition of modified product
    setProductInCart(false);
    setShowModifyModal(false);
    setSelectionChanged(false);

    // ✅ Add the updated product to cart
    handleAddToCart(false);
  };

  // ✅ Handle adding a separate Feuzon drum if stock allows
  const handleAddSeparateItem = async () => {
    console.log('➕ Attempting to add a separate Feuzon drum to the cart...');

    // ✅ Fetch total Feuzon quantity currently in the cart
    const feuzonQuantityInCart = cart
      .filter((item) => item.productId === 'feuzon')
      .reduce((total, item) => total + item.quantity, 0); // Sum all Feuzon quantities

    console.log('🛒 Cart Contents:', cart); // Debugging
    console.log('📦 Feuzon Quantity in Cart:', feuzonQuantityInCart);
    console.log('📦 Firestore Current Quantity:', currentQuantity);

    // ✅ Check if enough stock is available
    if (currentQuantity > feuzonQuantityInCart) {
      console.log('✅ Stock is available! Proceeding to add another Feuzon...');
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

  // ✅ Calculate total Feuzon drums currently in the cart
  const totalFeuzonInCart = cart
    .filter((item) => item.productId === 'feuzon')
    .reduce((sum, item) => sum + (item.quantity || 1), 0); // Sum quantities

    return (
      <div className="feuzon-product-detail">
        <h1>FEUZØN Series Snare Drum</h1>
  
        <div className="feuzon-product-content">
            <img 
             className="feuzon-product-image"
              src="https://firebasestorage.googleapis.com/v0/b/danoberartisandrums-dev.firebasestorage.app/o/products%2F67c255d1-a9ca-4f5d-80af-ddeee6a424e1_IMG_6133.png?alt=media&token=a15b2e68-d34b-44fa-bf33-eccc4a025331"
              alt="FEUZON Snare Drum"
            />
  
          <div className="feuzon-product-options">
            {/* 📌 Default Features List */}
            <div className="feuzon-features">
              <h2>FEUZØN Series Features</h2>
              <ul>
                <li>Hybrid Shell Construction</li>
                <li>Combines Various Wood Species For A Unique Tone</li>
                <li>Double Ended Tube Lugs</li>
              <li>Roundover Outer / 45° Inner Bearing Edge</li>
              <li>Precision Cut Snare Beds</li>
              <li>Stained or Natural Semi-Gloss Finish</li>
              <li>Torch Tuned for Maximum Resonance</li>
              <li>Trick Snare Throw-Off</li>
              <li>Puresound Snare Wires</li>
              <li>Remo Coated Ambassador Batter & Clear Snare Side</li>
              <li>Estimated Delivery: 6-8 weeks</li>
              <p className="order-to-build-disclaimer">*Note: All Ober Artisan drums are on an "order-to-build" basis, offering various configuration options. Finsihed product will appear different than the image shown.</p>
              </ul>
            </div>
  
            <h2>Build Options</h2>
  
            {/* Snare Size */}
            <label htmlFor="size">Snare Size (Diameter)</label>
            <select id="size" value={size} onChange={(e) => setSize(e.target.value)}>
              {Object.keys(basePrices).map((sizeOption) => (
                <option key={sizeOption} value={sizeOption}>
                  {sizeOption}&quot; - Base Price: ${basePrices[sizeOption]}
                </option>
              ))}
            </select>
  
            {/* Snare Depth */}
            <label htmlFor="depth">Depth</label>
            <select id="depth" value={depth} onChange={(e) => setDepth(e.target.value)}>
              {Object.keys(depthPrices[size]).map((depthOption) => (
                <option key={depthOption} value={depthOption}>
                  {depthOption}&quot; {depthPrices[size][depthOption] > 0 ? `+ $${depthPrices[size][depthOption]}` : ""}
                </option>
              ))}
            </select>
  
            {/* Exterior Shell Selection */}
            <label htmlFor="outerShell">Exterior Shell (Steam Bent)</label>
            <select id="outerShell" value={outerShell} onChange={(e) => setOuterShell(e.target.value)}>
              {Object.keys(staveOptions).map((shell) => (
                <option key={shell} value={shell}>
                  {shell}
                </option>
              ))}
            </select>
  
            {/* Interior Shell Selection */}
            <label htmlFor="innerStave">Interior Shell (Stave)</label>
            <select id="innerStave" value={innerStave} onChange={(e) => setInnerStave(e.target.value)}>
              {staveOptions[outerShell].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
  
            {/* Lug Quantity */}
            <label htmlFor="lugs">Lug Quantity</label>
            <select id="lugs" value={lugs} onChange={(e) => setLugs(e.target.value)}>
              {lugOptions[size].map((lugOption) => (
                <option key={lugOption} value={lugOption}>
                  {lugOption} Lugs
                </option>
              ))}
            </select>
  
            {/* Stave Quantity & Shell Thickness */}
            <label htmlFor="staves">Stave Quantity & Shell Thickness</label>
            <select id="staves" value={staveOption} onChange={(e) => setStaveOption(e.target.value)}>
              {staveQuantities.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
  
            {/* Total Price */}
            <p className="feuzon-detail-price">${totalPrice}</p>
            <p className="delivery-time">Est Delivery: 6-8 weeks</p>

  
            {/* Add to Cart */}
            <button className="add-to-cart-button" onClick={handleAddToCart}>Add to Cart</button>
          </div>
        </div>
  
        {/* 📌 Drum Summary Section */}
        {/* <div className="drum-summary">
          <h1>Artisan Notes</h1>
          <h3>🎛️ Tonal Characteristics</h3>
          <p>{selectedDrumSummary?.highlightedCharacteristics || "Select options to view summary"}</p>
  
          <h3>🎵 Genre Top Picks</h3>
          <p>{selectedDrumSummary?.primaryGenre || "Select options to view summary"}</p>
          <ul>
            {selectedDrumSummary?.secondaryGenres?.length > 0
              ? selectedDrumSummary.secondaryGenres.map((genre, idx) => <li key={idx}>{genre}</li>)
              : <li>Select options to view summary</li>}
          </ul>
  
          <h3>🎙 Recording Mic Top Picks</h3>
          <p>{selectedDrumSummary?.recordingMic || "Select options to view summary"}</p>
        </div> */}
  
        {/* ✅ Button Actions - Manage UI Based on Cart & Stock State */}
        {/* <div className="button-group">
          {productQuantity === 0 ? (
            <button className="notify-button" onClick={handleNotifyMe}>
              Sold Out - Notify Me When Available
            </button>
          ) : productInCart ? (
            <>
              <button
                className="go-to-checkout-button"
                onClick={() => (window.location.href = '/cart')}
              >
                Go to Checkout
              </button>
  
              <button
                className="change-selections-button"
                onClick={() => setShowModifyModal(true)}
              >
                Change Selections
              </button>
  
              <button
                className="remove-from-cart-button"
                onClick={async () => {
                  console.log('🛑 Removing custom product from cart...');
                  const generatedId = `feuzon-${size}-${depth}-${lugs}-${staveQuantity}`;
                  await removeFromCart(generatedId);
                  setProductInCart(false);
                }}
              >
                Remove from Cart
              </button>
            </>
          ) : (
            <button
              onClick={() => handleAddToCart()}
              className="add-to-cart-button"
            >
              Add to Cart
            </button>
          )}
        </div> */}
      </div>
    );
};

export default FeuzonProductDetail;
