import React, { useState, useEffect } from "react";
import SpiderChart from "./SpiderChart";
import BarChart from "./BarChart";
import feuzonSummaries from "../data/feuzonSummaries";
import "./FeuzonProductDetail.css";

const FeuzonProductDetail = () => {
  const [outerShell, setOuterShell] = useState("Maple");
  const [innerStave, setInnerStave] = useState("Walnut + Birch");
  const [size, setSize] = useState("12");
  const [depth, setDepth] = useState("5.0");
  const [lugs, setLugs] = useState("8");
  const [staveOption, setStaveOption] = useState("");
  const [staveQuantities, setStaveQuantities] = useState([]);
  const [totalPrice, setTotalPrice] = useState(1050);
  const [selectedDrumSummary, setSelectedDrumSummary] = useState({});
  const reRingCost = 150;

  const basePrices = { "12": 1050, "13": 1150, "14": 1250 };

  const depthPrices = {
    "12": { "5.0": 0, "6.0": 100, "7.0": 200 },
    "13": { "5.0": 0, "6.0": 100, "7.0": 200 },
    "14": { "5.5": 0, "6.0": 50, "6.5": 100 },
  };

  const staveOptions = {
    "Maple": ["Walnut + Birch", "Oak + Cherry", "Maple + Bubinga"],
    "Walnut": ["Mahogany + Cherry", "Walnut + Padauk", "Oak + Wenge"],
    "Cherry": ["Birch + Maple", "Zebrawood + Mahogany", "Padauk + Ash"],
  };

  const lugOptions = {
    "12": ["6", "8"],
    "13": ["8"],
    "14": ["8", "10"],
  };

  const staveMapping = {
    "12": {
      "6": ["12 - 10mm"],
      "8": ["16 - 12mm"],
    },
    "13": {
      "6": ["12 - 11mm"],
      "8": ["16 - 12mm"],
    },
    "14": {
      "8": ["16 - 13mm"],
      "10": ["20 - 14mm", "10 - 10mm + $150 (Re-Rings Required)"],
    },
  };

  const [soundProfile, setSoundProfile] = useState({
    attack: 8,
    sustain: 7,
    brightness: 7,
    warmth: 7,
    projection: 8,
  });

  useEffect(() => {
    console.log("🔄 Triggered useEffect for Stave Options update...");
    console.log(`📏 Selected Size: ${size}, 🏷 Lug Count: ${lugs}`);
  
    // ✅ Ensure selected lug count is valid for the current size
    if (!lugOptions[size]?.includes(lugs)) {
      console.warn(`⚠️ Invalid lug count (${lugs}) for size ${size}. Resetting to default.`);
      setLugs(lugOptions[size][0]); // Reset lugs to a valid selection
      return;
    }
  
    // ✅ Fetch Valid Stave Options
    let updatedStaveOptions = staveMapping[size]?.[lugs] || [];
    console.log("🧐 Checking stave options for size:", size, "lugs:", lugs);
    console.log("✅ Updated Stave Options:", updatedStaveOptions);
  
    // ❌ Remove Invalid Re-Rings for 12” Drums
    if (size === "12") {
      updatedStaveOptions = updatedStaveOptions.filter(option => !option.includes("Re-Rings"));
    }
  
    console.log("✅ Finalized Stave Options:", updatedStaveOptions);
  
    // ✅ Reset Stave Option if Necessary
    if (!updatedStaveOptions.includes(staveOption)) {
      console.warn(`⚠️ Invalid selection detected. Resetting stave option for ${size}" ${lugs} lugs.`);
      setStaveOption(updatedStaveOptions.length > 0 ? updatedStaveOptions[0] : "");
    }
  
    setStaveQuantities(updatedStaveOptions);
  
    // ✅ Update Price
    let newPrice = basePrices[size] || 0;
    let depthAdjustment = depthPrices[size]?.[depth] || 0;
    newPrice += depthAdjustment;
  
    if (staveOption.includes("Re-Rings")) {
      newPrice += reRingCost;
    }
  
    console.log(`💰 Updated Price: $${newPrice}`);
    setTotalPrice(newPrice);
  }, [size, lugs, staveOption, outerShell, innerStave, depth]);

    return (
        <div className="feuzon-product-detail">
          <h1>FEUZØN Series Snare Drum</h1>
      
          <div className="feuzon-product-content">
            {/* 📌 Left Side: Product Image */}
            <div className="feuzon-product-image">
              <img src="https://firebasestorage.googleapis.com/v0/b/danoberartisandrums-dev.firebasestorage.app/o/products%2F67c255d1-a9ca-4f5d-80af-ddeee6a424e1_IMG_6133.png?alt=media&token=a15b2e68-d34b-44fa-bf33-eccc4a025331" alt="FEUZON Snare Drum" />
            </div>
      
            {/* 📌 Right Side: Product Features + Customization */}
            <div className="feuzon-product-options">
              {/* 📌 Default Features List */}
              <div className="feuzon-features">
                <h2>FEUZØN Series Features</h2>
                <ul>
                  <li>Hybrid Shell Construction</li>
                  <li>Double Tube Lugs</li>
                  <li>Roundover Outer / 45° Inner Bearing Edge</li>
                  <li>Custom-Tuned for Maximum Projection</li>
                  <li>Handcrafted Semi-Gloss Finish</li>
                  <li>Precision Cut Snare Beds</li>
                  <li>Trick Snare Throw-Off</li>
                  <li>Puresound Custom Snare Wires</li>
                  <li>Remo Ambassador Batter & Hazy Side Heads</li>
                </ul>
              </div>
      
              <h2>Customize Your Drum</h2>
    
              <label htmlFor="outerShell">Outer Shell</label>
              <select id="outerShell" value={outerShell} onChange={(e) => setOuterShell(e.target.value)}>
                {Object.keys(staveOptions).map((shell) => (
                  <option key={shell} value={shell}>{shell}</option>
                ))}
              </select>
    
              <label htmlFor="innerStave">Inner Stave</label>
              <select id="innerStave" value={innerStave} onChange={(e) => setInnerStave(e.target.value)}>
                {staveOptions[outerShell].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
    
    {/* Snare Size (Diameter) with Base Price */}
    <label htmlFor="size">Snare Size (Diameter)</label>
    <select id="size" value={size} onChange={(e) => setSize(e.target.value)}>
      {Object.keys(basePrices).map((s) => (
        <option key={s} value={s}>
          {s}&quot; - Base Price: ${basePrices[s]}
        </option>
      ))}
    </select>
    
    {/* Depth with Upgrade Pricing */}
    <label htmlFor="depth">Depth</label>
    <select id="depth" value={depth} onChange={(e) => setDepth(e.target.value)}>
      {Object.keys(depthPrices[size]).map((d) => (
        <option key={d} value={d}>
          {d}&quot; {depthPrices[size][d] > 0 ? `+ $${depthPrices[size][d]}` : ""}
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
    
    <label htmlFor="staveOption">Stave Quantity & Shell Thickness</label>
          <select id="staveOption" value={staveOption} onChange={(e) => setStaveOption(e.target.value)}>
            {staveQuantities.map((option) => {
              let displayOption = option;
              if (size === "14" && lugs === "10" && option.includes("10 -") && option.includes("Re-Rings")) {
                displayOption = `${option} + $150 (Re-Rings Required)`;
              }
              return (
                <option key={option} value={option}>
                  {displayOption}
                </option>
              );
            })}
          </select>
              <h3>Total Price: ${totalPrice}</h3>
              <button>Add to Cart</button>
            </div>
          </div>

      {/* ✅ ARTISAN NOTES SECTION FIXED */}
      <div className="artisan-notes">
        <h3>🛠 Artisan Notes</h3>
        <p>{selectedDrumSummary.artisanNotes || "Select options to view artisan insights."}</p>
      </div>

      <div className="drum-summary">
        <h3>🎯 Highlighted Characteristics</h3>
        <p>{selectedDrumSummary.highlightedCharacteristics || "Select options to view summary"}</p>

        <h3>🎵 Primary Genre</h3>
        <p>{selectedDrumSummary.primaryGenre || "Select options to view summary"}</p>

        <h3>🎤 Best Playing Situations</h3>
        <p>{selectedDrumSummary.playingSituation || "Select options to view summary"}</p>

        <h3>🎙 Recommended Recording Mic</h3>
        <p>{selectedDrumSummary.recordingMic || "Select options to view summary"}</p>

        <h3>🎵 Secondary Genres</h3>
        <ul>
          {selectedDrumSummary.secondaryGenres?.map((genre, idx) => (
            <li key={idx}>{genre}</li>
          )) || "Select options to view summary"}
        </ul>
      </div>

      <SpiderChart data={[soundProfile.projection, soundProfile.sustain, soundProfile.brightness, soundProfile.warmth, soundProfile.attack]} />
      <BarChart data={soundProfile} />
    </div>
  );
};

export default FeuzonProductDetail;