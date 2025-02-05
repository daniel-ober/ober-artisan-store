import React, { useState, useEffect } from "react";
import SpiderChart from "./SpiderChart";
import BarChart from "./BarChart";
import drumSummaries from "../data/drumSummaries";
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
  const [recommendedThickness, setRecommendedThickness] = useState(10);
  const reRingCost = 150;

  // Base Pricing by Size
  const basePrices = { "12": 1050, "13": 1150, "14": 1250 };

  const depthPrices = {
    "12": { "5.0": 0, "6.0": 100, "7.0": 200 },
    "13": { "5.0": 0, "6.0": 100, "7.0": 200 },
    "14": { "5.5": 0, "6.0": 50, "6.5": 100 },
  };

  // Inner Stave Options for Each Outer Shell
  const staveOptions = {
    "Maple": ["Walnut + Birch", "Oak + Cherry", "Maple + Bubinga"],
    "Walnut": ["Mahogany + Cherry", "Walnut + Padauk", "Oak + Wenge"],
    "Cherry": ["Birch + Maple", "Zebrawood + Mahogany", "Padauk + Ash"],
  };

  // Lug Quantity Options
  const lugOptions = {
    "12": ["6", "8"],
    "13": ["8"],
    "14": ["8", "10"],
  };

  // **Calculate Best Shell Thickness**
  const calculateShellThickness = (outer, inner, size, depth, lugs) => {
    let baseInnerThickness = 7;

    if (outer === "Maple") baseInnerThickness += 1;
    if (outer === "Walnut") baseInnerThickness -= 0.5;
    if (outer === "Cherry") baseInnerThickness += 0.5;

    if (inner.includes("Birch") || inner.includes("Padauk")) baseInnerThickness += 0.5;
    if (inner.includes("Mahogany") || inner.includes("Wenge")) baseInnerThickness -= 0.5;

    if (size === "12") baseInnerThickness -= 0.5;
    if (size === "14") baseInnerThickness += 0.5;
    if (parseFloat(depth) >= 6.5) baseInnerThickness += 0.5;

    if (parseInt(lugs) === 10) baseInnerThickness += 0.5;

    let finalThickness = Math.round(Math.max(6, Math.min(14, baseInnerThickness + 3.175))); // Includes 1/8" outer shell
    return finalThickness;
  };

  // **Get Stave Quantity Options Dynamically**
  const getStaveQuantities = (size, lugs, outer, inner, depth, shellThickness) => {
    const staveMapping = {
      "12": {
        "6": [`12 - ${shellThickness}mm`],
        "8": [`16 - ${shellThickness}mm`],
        "10": [`20 - ${shellThickness}mm`],
      },
      "13": {
        "8": [`16 - ${shellThickness}mm`],
        "10": [`20 - ${shellThickness}mm`],
      },
      "14": {
        "8": [`16 - ${shellThickness}mm`],
        "10": [`20 - ${shellThickness}mm`, `10 - ${shellThickness - 1}mm + Re-Rings`],
      },
    };

    return staveMapping[size]?.[lugs] || [];
  };

  useEffect(() => {
    let newPrice = basePrices[size] || 0;
    let depthAdjustment = depthPrices[size]?.[depth] || 0;
    newPrice += depthAdjustment;
  
    // ✅ Determine if Re-Rings should be applied
    const isReRingsRequired =
      size === "14" && lugs === "10" && staveOption.includes("10 -") && staveOption.includes("Re-Rings");
  
    if (isReRingsRequired) {
      newPrice += reRingCost; // ✅ Add $150 for Re-Rings
    }
  
    setTotalPrice(newPrice);
  
    // ✅ Calculate Recommended Shell Thickness
    const recommendedThicknessValue = calculateShellThickness(
      outerShell, innerStave, size, depth, lugs
    );
    setRecommendedThickness(recommendedThicknessValue);
  
    // ✅ Get updated stave quantities, ensuring Re-Rings option is included when applicable
    let updatedStaveQuantities = getStaveQuantities(
      size, lugs, outerShell, innerStave, depth, recommendedThicknessValue
    );
  
    // ✅ Ensure Re-Rings is dynamically added only ONCE if applicable
    if (size === "14" && lugs === "10") {
      const reRingOption = `10 - ${recommendedThicknessValue - 1}mm + $150 (Re-Rings Required)`;
      if (!updatedStaveQuantities.some(option => option.includes("Re-Rings"))) {
        updatedStaveQuantities.push(reRingOption);
      }
    }
  
    console.log("Updated Stave Quantities:", updatedStaveQuantities);
  
    if (updatedStaveQuantities.length > 0) {
      // ✅ Ensure Re-Rings selection stays when selected
      const currentSelectionIsValid = updatedStaveQuantities.includes(staveOption);
      setStaveQuantities(updatedStaveQuantities);
      setStaveOption(currentSelectionIsValid ? staveOption : updatedStaveQuantities[0]);
    } else {
      setStaveQuantities([`12 - ${recommendedThicknessValue}mm`]); // Default fallback
      setStaveOption(`12 - ${recommendedThicknessValue}mm`);
    }
  }, [outerShell, innerStave, size, depth, lugs, staveOption]);

  return (
    <div className="feuzon-product-detail">
      <h1>FEUZON Series Snare Drum</h1>
  
      <div className="feuzon-product-content">
        {/* 📌 Left Side: Product Image */}
        <div className="feuzon-product-image">
          <img src="https://firebasestorage.googleapis.com/v0/b/danoberartisandrums-dev.firebasestorage.app/o/products%2F67c255d1-a9ca-4f5d-80af-ddeee6a424e1_IMG_6133.png?alt=media&token=a15b2e68-d34b-44fa-bf33-eccc4a025331" alt="FEUZON Snare Drum" />
        </div>
  
        {/* 📌 Right Side: Product Features + Customization */}
        <div className="feuzon-product-options">
          {/* 📌 Default Features List */}
          <div className="feuzon-features">
            <h2>FEUZON Series Features</h2>
            <ul>
              <li>Hybrid Shell Construction</li>
              <li>Double Tube Lugs</li>
              <li>45° Inner Bearing Edge</li>
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

{/* Stave Quantity & Shell Thickness with Re-Rings Cost */}
<label htmlFor="staveOption">Stave Quantity & Shell Thickness</label>
<select id="staveOption" value={staveOption} onChange={(e) => setStaveOption(e.target.value)}>
  {staveQuantities.map((option) => {
    let displayOption = option;

    // ✅ Append $150 for Re-Rings when applicable
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

          <h3>Recommended Shell Thickness: {recommendedThickness}mm</h3>
          <h3>Total Price: ${totalPrice}</h3>
          <button>Add to Cart</button>
        </div>
      </div>
    </div>
  );
};

export default FeuzonProductDetail;