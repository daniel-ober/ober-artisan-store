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
  const [selectedOption, setSelectedOption] = useState(null);
  const [hardwareColor, setHardwareColor] = useState('Chrome');
  const reRingCost = 150;
  const [product, setProduct] = useState(null);
  const [buttonText, setButtonText] = useState('Add to Cart');
  const basePrices = { 12: 850, 13: 950, 14: 1050 };
  const [cartItemId, setCartItemId] = useState(null);
  const [pendingCartItemId, setPendingCartItemId] = useState(null);
  const navigate = useNavigate();

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
      10: ['20 - 12mm', '10 - 7mm + $150 (Re-Rings Required)'], // ✅ Only this has Re-Rings
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
      lugQuantity: lugs, // ✅ make sure lug count is passed here
      staveQuantity: staveOption.split(' - ')[0],
      hardwareColor, // ✅ make sure hardwareColor is included
    });

    const correctedPrice = totalPrice; // ✅ use the calculated totalPrice

    const cartItem = {
      id: newCartItemId,
      productId: 'heritage',
      name: 'HERITAGE',
      size,
      depth,
      reRing: hasReRing,
      lugQuantity: lugs, // ✅ use the actual user selection
      staveQuantity: staveOption.split(' - ')[0],
      price: correctedPrice, // ✅ always use calculated totalPrice
      stripePriceId: null, // ✅ prevent old Stripe price mismatch
      quantity: 1,
      images: [
        'https://firebasestorage.googleapis.com/v0/b/danoberartisandrums-dev.firebasestorage.app/o/products%2FIMG_6123.png?alt=media&token=ec8d40b8-ebae-41dc-93c6-e7936055ead7',
      ],
      category: 'artisan',
      hardwareColor,
    };

    await addToCart(cartItem, {
      lugQuantity: lugs,
      size,
      depth,
      reRing: hasReRing,
      staveQuantity: staveOption.split(' - ')[0],
      hardwareColor,
    });
    toast.success('🛒 Item added to cart!');
    setPendingCartItemId(cartItem.id); // let useEffect detect this as a signal
    // ✅ Manually reflect new ID locally for instant feedback
    setCartItemId(newCartItemId);
    setButtonText('In Cart');
  };

  const generateCartItemId = (option) => {
    const normalizedStave = String(option.staveQuantity).trim();
    const normalizedHardware = String(option.hardwareColor)
      .toLowerCase()
      .replace(/\s+/g, '-');

    // ✅ Always use empty string when stripePriceId is missing to match CartContext
    const priceId = option.stripePriceId ?? '';

    return `${priceId}-${option.size}-${option.depth}-${String(option.reRing)}-${option.lugQuantity}-${normalizedStave}-${normalizedHardware}`;
  };

  useEffect(() => {
    const hasReRing =
      staveOption.includes('Re-Rings') || staveOption.includes('+ $150');
    const normalizedStave = staveOption.split(' - ')[0].trim();
    const normalizedHardware = hardwareColor.toLowerCase().replace(/\s+/g, '-');

    const matchingItem = cart.find((item) => {
      const iSize = item.size || item.config?.size;
      const iDepth = item.depth || item.config?.depth;
      const iLugs = item.lugQuantity || item.config?.lugQuantity;
      const iStave = item.staveQuantity || item.config?.staveQuantity;
      const iHardware = (item.hardwareColor || item.config?.hardwareColor || '')
        .toLowerCase()
        .replace(/\s+/g, '-');

      return (
        String(iSize) === String(size) &&
        String(iDepth) === String(depth) &&
        Boolean(item.reRing) === Boolean(hasReRing) &&
        String(iLugs) === String(lugs) &&
        String(iStave).trim() === normalizedStave &&
        iHardware === normalizedHardware
      );
    });

    if (matchingItem) {
      setCartItemId(matchingItem.id);
      setButtonText('In Cart');
    } else {
      setCartItemId(null);
      setButtonText('Add to Cart');
    }
  }, [cart, size, depth, staveOption, lugs, hardwareColor]);

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
    // ✅ Start with correct base price
    let newPrice = basePrices[size];

    // ✅ Add depth upcharge
    newPrice += depthPrices[size][depth];

    // ✅ Add re-ring cost only if explicitly required
    const hasReRingOption =
      staveOption.includes('Re-Rings') || staveOption.includes('+ $150');
    if (hasReRingOption) {
      newPrice += reRingCost;
    }

    // ✅ Ensure lug count does NOT incorrectly add cost
    if (lugs === '10') {
      newPrice += 0; // adjust here if 10 lugs adds cost later
    }

    setTotalPrice(newPrice);

    // 🔄 Update Sound Profile dynamically
    const updatedProfile = {
      attack: 8,
      sustain: depth >= '7.0' ? 9 : depth >= '6.0' ? 8 : 7,
      brightness: lugs === '8' ? 6 : 7,
      warmth: 7,
      projection: size === '14' ? 9 : size === '13' ? 8 : 7,
    };
    setSoundProfile(updatedProfile);

    // ✅ Generate correct summary key for heritageSummaries lookup
    const staveParts = staveOption.split(' - ');
    const staveThickness =
      staveParts[1]?.replace(' + $150 (Re-Rings Required)', '') || '';
    const lugCount = `${lugs} Lugs`;
    const generatedKey = `${size}" - Base Price: $${basePrices[size]}-${depth}"-${lugCount}-${staveThickness}`;

    if (heritageSummaries[generatedKey]) {
      setSelectedDrumSummary(heritageSummaries[generatedKey]);
    } else {
      console.warn('❌ Summary not found for key:', generatedKey);
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
        className="heritage-header-image"
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
              <li>Roundover Outer / 45° Inner Bearing Edge</li>
              <li>Precision Cut Snare Beds</li>
              <li>Die-cast Hoops</li>
              <li>Double Ended Tube Lugs</li>
              <li>Natural Matte Finish</li>
              <li>Torch Tuned for Maximum Resonance</li>
              <li>Trick Snare Throw-Off</li>
              <li>Puresound Snare Wires</li>
              <li>Remo Coated Ambassador Batter & Clear Snare Side</li>
              <li>Estimated Delivery: 6–8 weeks</li>
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

          <label htmlFor="staves">Stave Quantity & Shell Thickness</label>
          <select id="staves" value={staveOption} onChange={handleStaveChange}>
            {(staveOptions[size]?.[lugs] || []).map((staveOption) => (
              <option key={staveOption} value={staveOption}>
                {staveOption}
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

          <p className="heritage-detail-price">${totalPrice}</p>
          <p className="delivery-time">Est Delivery: 6–8 weeks</p>

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
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeritageProductDetail;
