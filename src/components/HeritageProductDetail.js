import React, { useState, useEffect } from "react";
import SpiderChart from "./SpiderChart";
import BarChart from "./BarChart";
import heritageSummaries from "../data/heritageSummaries"; // Ensure the import is correct
import { useCart } from "../context/CartContext"; // ✅ Use Context API
import "./HeritageProductDetail.css";

const HeritageProductDetail = () => {
  const [size, setSize] = useState("12");
  const [depth, setDepth] = useState("5.0");
  const [lugs, setLugs] = useState("8");
  const [staveOption, setStaveOption] = useState("16 - 13mm");
  const [totalPrice, setTotalPrice] = useState(850);
  const [selectedDrumSummary, setSelectedDrumSummary] = useState({});
  const reRingCost = 150;

  const basePrices = { "12": 850, "13": 950, "14": 1050 };

  const depthPrices = {
    "12": { "5.0": 0, "6.0": 100, "7.0": 200 },
    "13": { "5.0": 0, "6.0": 100, "7.0": 200 },
    "14": { "5.0": 0, "6.0": 100, "7.0": 200 },
  };

  const staveOptions = {
    "12": { "6": ["12 - 10mm"], "8": ["16 - 13mm"] },
    "13": { "8": ["16 - 12mm"] },
    "14": { 
      "8": ["16 - 12mm"], 
      "10": ["20 - 14mm", "10 - 7mm + $150 (Re-Rings Required)"] // ✅ Only this has Re-Rings
    },
  };

  const lugOptions = {
    "12": ["6", "8"],
    "13": ["8"],
    "14": ["8", "10"],
  };

  // **🔄 Sound Profile Based on Selections**
  const [soundProfile, setSoundProfile] = useState({
    attack: 8,
    sustain: 7,
    brightness: 7,
    warmth: 7,
    projection: 8
  });

  // ✅ Use Cart Context
  const { addToCart } = useCart(); 

  const handleAddToCart = () => {
    console.log("🛒 Add to Cart Clicked");

    if (!size || !depth) {
        console.error("❌ Missing selection: Size or Depth not chosen");
        return;
    }

    const normalizedSize = String(size).trim();
    const normalizedDepth = String(depth).trim();

    // ✅ More reliable way to check if Re-Rings are required
    const hasReRing = staveOption.includes("Re-Rings") || staveOption.includes("+ $150");

    console.log("🔍 Searching for:", { size: normalizedSize, depth: normalizedDepth, reRing: hasReRing });

    if (!heritageSummaries.pricingOptions) {
        console.error("❌ Error: pricingOptions is missing or undefined in heritageSummaries");
        return;
    }

    // ✅ Find the correct pricing option
    const selectedOption = heritageSummaries.pricingOptions.find(option =>
        String(option.size).trim() === normalizedSize &&
        String(option.depth).trim() === normalizedDepth &&
        option.reRing === hasReRing
    );

    if (!selectedOption) {
        console.error("❌ No matching pricing option found for:", { size: normalizedSize, depth: normalizedDepth, reRing: hasReRing });
        console.log("Available options:", heritageSummaries.pricingOptions);
        return;
    }

    console.log("✅ Selected Pricing Option:", selectedOption);

   // ✅ Extract lugQuantity and staveQuantity safely
const lugQuantity = selectedOption.lugQuantity !== undefined ? selectedOption.lugQuantity : (Number(lugs) || 6);
const staveQuantity = selectedOption.staveQuantity !== undefined ? selectedOption.staveQuantity : (Number(staveOption.split(" - ")[0]) || 12);

    // ✅ Generate a **proper** unique ID for this variant
    const uniqueItemId = `${selectedOption.stripePriceId}-${normalizedSize}-${normalizedDepth}-${hasReRing}-${lugQuantity}-${staveQuantity}`;

    // ✅ Format the cart item correctly
    const cartItem = {
        id: uniqueItemId,
        productId: "heritage",
        name: "HERÌTAGE",
        size: normalizedSize,
        depth: normalizedDepth,
        reRing: hasReRing,
        lugQuantity,
        staveQuantity,
        price: selectedOption.price,
        stripePriceId: selectedOption.stripePriceId,
        quantity: 1
    };

    console.log("🛒 Cart Item Data:", cartItem);

    // ✅ Add to cart using Context API
    addToCart(cartItem);
    console.log("🔎 Debugging Unique ID:", {
      stripePriceId: selectedOption.stripePriceId,
      size: normalizedSize,
      depth: normalizedDepth,
      reRing: hasReRing,
      lugQuantity,
      staveQuantity
  });
};

  useEffect(() => {
    let newPrice = basePrices[size];
    newPrice += depthPrices[size][depth];
  
    // ✅ Add Re-Ring Cost if applicable
    if (staveOption.includes("Re-Rings")) {
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
    updatedProfile.sustain = depth >= "7.0" ? 9 : depth >= "6.0" ? 8 : 7;
  
    // Adjust attack based on stave selection
    updatedProfile.attack = staveOption.includes("8") ? 9 : staveOption.includes("10") ? 8 : 7;
  
    // Adjust brightness based on stave selection
    updatedProfile.brightness = staveOption.includes("8") ? 6 : staveOption.includes("10") ? 7 : 8;
  
    // Adjust projection (larger shells = more projection)
    updatedProfile.projection = size === "14" ? 9 : size === "13" ? 8 : 7;
  
    setSoundProfile(updatedProfile);
  
    // ✅ **Standardize Key Formatting to Match heritageSummaries Object**
    const staveParts = staveOption.split(" - ");
    let staveThickness = staveParts[1];
  
    // 🔄 **Fix Thickness Formatting**
    staveThickness = staveThickness.replace(" + $150 (Re-Rings Required)", ""); // Remove unnecessary text
  
    // 🔄 **Ensure lug format is correct**
    const lugCount = `${lugs} Lugs`;
  
    // 🔄 **Generated Key Format with Base Price and Stave Details**
    const generatedKey = `${size}" - Base Price: $${newPrice}-${depth}"-${lugCount}-${staveThickness}`;
  
    console.log("🔎 Generated Summary Key:", generatedKey); // Debugging log
  
    if (heritageSummaries[generatedKey]) {
      console.log("✅ Drum Summary Found:", heritageSummaries[generatedKey]); // Debugging log
      setSelectedDrumSummary(heritageSummaries[generatedKey]);
    } else {
      console.error("❌ Summary not found for the key:", generatedKey); // Error if no summary is found
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
    setStaveOption(staveList.find((s) => !s.includes("Re-Rings")) || staveList[0] || "");
  };

  const handleDepthChange = (e) => {
    setDepth(e.target.value);
  };

  const handleLugChange = (e) => {
    const newLug = e.target.value;
    setLugs(newLug);

    // ✅ Ensure staveOptions[size] and staveOptions[size][lugs] exist
    const staveList = staveOptions[size]?.[newLug] || [];
    setStaveOption(staveList.find((s) => !s.includes("Re-Rings")) || staveList[0] || "");
  };

  const handleStaveChange = (e) => {
    setStaveOption(e.target.value);
  };

  return (
    <div className="heritage-product-detail">
      <h1>HERÍTAGE Series Snare Drum</h1>

      <div className="heritage-product-content">
        <div className="heritage-product-image">
          <img src="https://firebasestorage.googleapis.com/v0/b/danoberartisandrums-dev.firebasestorage.app/o/products%2FIMG_6123.png?alt=media&token=ec8d40b8-ebae-41dc-93c6-e7936055ead7" alt="HERÍTAGE Snare Drum" />
        </div>

        <div className="heritage-product-options">
          {/* 📌 Default Features List */}
          <div className="heritage-features">
            <h2>HERÍTAGE Series Features</h2>
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
            </ul>
          </div>

          <h2>Customize Your Drum</h2>

          {/* Snare Size */}
          <label htmlFor="size">Snare Size (Diameter)</label>
          <select id="size" value={size} onChange={handleSizeChange}>
            {Object.keys(basePrices).map((sizeOption) => (
              <option key={sizeOption} value={sizeOption}>
                {sizeOption}&quot; - Base Price: ${basePrices[sizeOption]}
              </option>
            ))}
          </select>

          {/* Snare Depth */}
          <label htmlFor="depth">Depth</label>
          <select id="depth" value={depth} onChange={handleDepthChange}>
            {Object.keys(depthPrices[size]).map((depthOption) => (
              <option key={depthOption} value={depthOption}>
                {depthOption}&quot; {depthPrices[size][depthOption] > 0 ? `+ $${depthPrices[size][depthOption]}` : ""}
              </option>
            ))}
          </select>

          {/* Lug Quantity */}
          <label htmlFor="lugs">Lug Quantity</label>
          <select id="lugs" value={lugs} onChange={handleLugChange}>
            {lugOptions[size].map((lugOption) => (
              <option key={lugOption} value={lugOption}>
                {lugOption} Lugs
              </option>
            ))}
          </select>

          {/* Stave Quantity & Shell Thickness */}
          <label htmlFor="staves">Stave Quantity & Shell Thickness</label>
          <select id="staves" value={staveOption} onChange={handleStaveChange}>
            {(staveOptions[size]?.[lugs] || []).map((staveOption) => (
              <option key={staveOption} value={staveOption}>
                {staveOption}
              </option>
            ))}
          </select>

          {/* Total Price */}
          <h3>Total Price: ${totalPrice}</h3>

          {/* Add to Cart */}
          <button onClick={handleAddToCart}>Add to Cart</button>
        </div>
      </div>

      {/* 📌 Drum Summary Section */}
      <div className="drum-summary">
      <SpiderChart data={[soundProfile.projection, soundProfile.sustain, soundProfile.brightness, soundProfile.warmth, soundProfile.attack]} />
      {/* <BarChart data={soundProfile} /> */}
      <h1>Artisan Notes</h1>
        <h3>🎛️ Highlighted Characteristics</h3>
        <p>{selectedDrumSummary.highlightedCharacteristics || "Select options to view summary"}</p>

        <h3>🎵 Genre Top Picks</h3>
        {selectedDrumSummary.primaryGenre || "Select options to view summary"}
        <ul>
          {selectedDrumSummary.secondaryGenres?.map((genre, idx) => (
            <li key={idx}>{genre}</li>
          )) || "Select options to view summary"}
        </ul>
        {/* <h3>🎤 Playing Situations</h3>
        <p>{selectedDrumSummary.playingSituation || "Select options to view summary"}</p> */}

        <h3>🎙 Recording Mic Top Picks</h3>
        <p>{selectedDrumSummary.recordingMic || "Select options to view summary"}</p>
      </div>
    </div>
  );
};

export default HeritageProductDetail;