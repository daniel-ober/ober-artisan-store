import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SpiderChart from './SpiderChart';
import BarChart from './BarChart';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Make sure Firestore is imported
import heritageSummaries from '../data/heritageSummaries'; // Ensure the import is correct
import { useCart } from '../context/CartContext'; // ✅ Use Context API
import './HeritageProductDetail.css';
import toast from 'react-hot-toast';

const HeritageProductDetail = () => {
  const [size, setSize] = useState('12');
  const [depth, setDepth] = useState('5.0');
  const [lugs, setLugs] = useState('8');
  const [staveOption, setStaveOption] = useState('16 - 13mm');
  const [totalPrice, setTotalPrice] = useState(850);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDrumSummary, setSelectedDrumSummary] = useState({});
  const reRingCost = 150;
  const [product, setProduct] = useState(null);
  const [buttonText, setButtonText] = useState('Add to Cart');
  const basePrices = { 12: 850, 13: 950, 14: 1050 };
  const [cartItemId, setCartItemId] = useState(null);
  const [pendingCartItemId, setPendingCartItemId] = useState(null);
  const navigate = useNavigate();

  const depthPrices = {
    12: { '5.0': 0, '6.0': 100, '7.0': 200 },
    13: { '5.0': 0, '6.0': 100, '7.0': 200 },
    14: { '5.0': 0, '6.0': 100, '7.0': 200 },
  };

  const staveOptions = {
    12: { 6: ['12 - 10mm'], 8: ['16 - 13mm'] },
    13: { 8: ['16 - 12mm'] },
    14: {
      8: ['16 - 12mm'],
      10: ['20 - 14mm', '10 - 7mm + $150 (Re-Rings Required)'], // ✅ Only this has Re-Rings
    },
  };

  const lugOptions = {
    12: ['6', '8'],
    13: ['8'],
    14: ['8', '10'],
  };

  // **🔄 Sound Profile Based on Selections**
  const [soundProfile, setSoundProfile] = useState({
    attack: 8,
    sustain: 7,
    brightness: 7,
    warmth: 7,
    projection: 8,
  });

  const handleRemoveFromCart = () => {
    if (cartItemId) {
      removeFromCart(cartItemId);
      toast.success('🗑️ Item removed from cart.');
    }
  };

  // ✅ Use Cart Context
  const { addToCart, removeFromCart, cart } = useCart();

  const handleAddToCart = async () => {
    if (!size || !depth) {
      console.error('❌ Missing selection: Size or Depth not chosen');
      return;
    }

    if (product.status !== 'active' && !product.isPreOrder) {
      toast.error('❌ This drum is currently unavailable.');
      return;
    }

    const hasReRing =
      staveOption.includes('Re-Rings') || staveOption.includes('+ $150');

    const selectedOption = heritageSummaries.pricingOptions.find(
      (option) =>
        option.size === size &&
        option.depth === depth &&
        option.reRing === hasReRing
    );

    if (!selectedOption) {
      console.error('❌ No matching pricing option found.');
      return;
    }

    const newCartItemId = generateCartItemId({
      stripePriceId: selectedOption.stripePriceId,
      size,
      depth,
      reRing: hasReRing,
      lugQuantity: selectedOption.lugQuantity,
      staveQuantity: selectedOption.staveQuantity,
    });

    const cartItem = {
      id: newCartItemId,
      productId: 'heritage',
      name: 'HERITAGE',
      size,
      depth,
      reRing: hasReRing,
      lugQuantity: selectedOption.lugQuantity,
      staveQuantity: selectedOption.staveQuantity,
      price: selectedOption.price,
      stripePriceId: selectedOption.stripePriceId,
      quantity: 1,
      images: [
        'https://firebasestorage.googleapis.com/v0/b/danoberartisandrums-dev.firebasestorage.app/o/products%2FIMG_6123.png?alt=media&token=ec8d40b8-ebae-41dc-93c6-e7936055ead7',
      ],
      category: 'artisan',
    };

    await addToCart(cartItem, cartItem);
    toast.success('🛒 Item added to cart!');
    setPendingCartItemId(cartItem.id); // let useEffect detect this as a signal
    // ✅ Manually reflect new ID locally for instant feedback
    setCartItemId(newCartItemId);
    setButtonText('In Cart');
  };

  const generateCartItemId = (option) => {
    return `${option.stripePriceId}-${option.size}-${option.depth}-${String(option.reRing)}-${option.lugQuantity}-${option.staveQuantity}`;
  };

  useEffect(() => {
    const hasReRing =
      staveOption.includes('Re-Rings') || staveOption.includes('+ $150');

    const selectedOption = heritageSummaries.pricingOptions.find(
      (option) =>
        option.size === size &&
        option.depth === depth &&
        option.reRing === hasReRing
    );

    if (!selectedOption) return;

    const expectedId = generateCartItemId({
      stripePriceId: selectedOption.stripePriceId,
      size,
      depth,
      reRing: hasReRing,
      lugQuantity: selectedOption.lugQuantity,
      staveQuantity: selectedOption.staveQuantity,
    });

    const isInCart = cart.some((item) => item.id === expectedId);

    if (isInCart) {
      setCartItemId(expectedId);
      setButtonText('In Cart');
      setPendingCartItemId(null); // ✅ clear pending once detected
    } else {
      setCartItemId(null);
      setButtonText('Add to Cart');
    }
  }, [cart, size, depth, staveOption, lugs, pendingCartItemId]);

  useEffect(() => {
    const fetchProductStatus = async () => {
      setIsLoading(true);
      try {
        const productRef = doc(db, 'products', 'heritage');
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          const productData = productSnap.data();
          setProduct(productData); // ✅ This line sets the product in state
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

    // ✅ Add Re-Ring Cost if applicable
    if (staveOption.includes('Re-Rings')) {
      newPrice += reRingCost;
    }

    setTotalPrice(newPrice);

    // 🔄 **Update Sound Profile Dynamically**
    let updatedProfile = {
      attack: 8, // Oak shell naturally has strong attack
      sustain: 7, // Medium tuning provides moderate sustain
      brightness: 7, // Oak is balanced but leans slightly bright
      warmth: 7, // Roundover bearing edge helps with warmth
      projection: 8, // Stave construction offers excellent projection
    };

    // Adjust sustain based on depth
    updatedProfile.sustain = depth >= '7.0' ? 9 : depth >= '6.0' ? 8 : 7;

    // Adjust attack based on stave selection
    updatedProfile.attack = staveOption.includes('8')
      ? 9
      : staveOption.includes('10')
        ? 8
        : 7;

    // Adjust brightness based on stave selection
    updatedProfile.brightness = staveOption.includes('8')
      ? 6
      : staveOption.includes('10')
        ? 7
        : 8;

    // Adjust projection (larger shells = more projection)
    updatedProfile.projection = size === '14' ? 9 : size === '13' ? 8 : 7;

    setSoundProfile(updatedProfile);

    // ✅ **Standardize Key Formatting to Match heritageSummaries Object**
    const staveParts = staveOption.split(' - ');
    let staveThickness = staveParts[1];

    // 🔄 **Fix Thickness Formatting**
    staveThickness = staveThickness.replace(' + $150 (Re-Rings Required)', ''); // Remove unnecessary text

    // 🔄 **Ensure lug format is correct**
    const lugCount = `${lugs} Lugs`;

    // 🔄 **Generated Key Format with Base Price and Stave Details**
    const generatedKey = `${size}" - Base Price: $${newPrice}-${depth}"-${lugCount}-${staveThickness}`;

    // console.log('🔎 Generated Summary Key:', generatedKey); // Debugging log

    if (heritageSummaries[generatedKey]) {
      // console.log('✅ Drum Summary Found:', heritageSummaries[generatedKey]); // Debugging log
      setSelectedDrumSummary(heritageSummaries[generatedKey]);
    } else {
      console.error('❌ Summary not found for the key:', generatedKey); // Error if no summary is found
      setSelectedDrumSummary({});
    }
  }, [size, depth, lugs, staveOption]);

  const handleSizeChange = (e) => {
    const newSize = e.target.value;
    setSize(newSize);
    setDepth(Object.keys(depthPrices[newSize])[0]);
    setLugs(lugOptions[newSize][0]);

    // ✅ Ensure staveOptions[size] and staveOptions[size][lugs] exist
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

    // ✅ Ensure staveOptions[size] and staveOptions[size][lugs] exist
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
        className="artisanseries-header-image"
      />
  
      <div className="heritage-product-content">
        <div className="heritage-product-image">
          <img
            src="https://firebasestorage.googleapis.com/v0/b/danoberartisandrums-dev.firebasestorage.app/o/products%2FIMG_6123.png?alt=media&token=ec8d40b8-ebae-41dc-93c6-e7936055ead7"
            alt="HERITAGE Snare Drum"
          />
        </div>
  
        <div className="heritage-product-options">
          <div className="heritage-features">
            <h2>HERITAGE Series Features</h2>
            <ul>
              <li>Northern Red Oak</li>
              <li>Stave Construction</li>
              <li>Double Ended Tube Lugs</li>
              <li>Roundover Outer / 45° Inner Bearing Edge</li>
              <li>Precision Cut Snare Beds</li>
              <li>Natural Semi-Gloss Finish</li>
              <li>Torch Tuned for Maximum Resonance</li>
              <li>Trick Snare Throw-Off</li>
              <li>Puresound Snare Wires</li>
              <li>Remo Coated Ambassador Batter & Clear Snare Side</li>
              <li>Estimated Delivery: 5–7 weeks</li>
              <p className="order-to-build-disclaimer">
                *Note: All Ober Artisan drums are on an "order-to-build" basis, offering various configuration options. Finished product will appear different than the image shown.
              </p>
            </ul>
          </div>
  
          <h2>Build Options</h2>
  
          <label htmlFor="size">Snare Size (Diameter)</label>
          <select id="size" value={size} onChange={handleSizeChange}>
            {Object.keys(basePrices).map((sizeOption) => (
              <option key={sizeOption} value={sizeOption}>
                {sizeOption}" - Base Price: ${basePrices[sizeOption]}
              </option>
            ))}
          </select>
  
          <label htmlFor="depth">Depth</label>
          <select id="depth" value={depth} onChange={handleDepthChange}>
            {Object.keys(depthPrices[size]).map((depthOption) => (
              <option key={depthOption} value={depthOption}>
                {depthOption}" {depthPrices[size][depthOption] > 0 ? `+ $${depthPrices[size][depthOption]}` : ''}
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
  
          <label htmlFor="staves">Stave Quantity & Shell Thickness</label>
          <select id="staves" value={staveOption} onChange={handleStaveChange}>
            {(staveOptions[size]?.[lugs] || []).map((staveOption) => (
              <option key={staveOption} value={staveOption}>
                {staveOption}
              </option>
            ))}
          </select>
  
          <p className="feuzon-detail-price">${totalPrice}</p>
          <p className="delivery-time">Est Delivery: 5–7 weeks</p>
  
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
            <button className="artisan-add-to-cart-button" onClick={handleAddToCart}>
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeritageProductDetail;
