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

    if (staveOption.includes("Re-Rings")) {
      newPrice += reRingCost;
    }

    setTotalPrice(newPrice);

    const recommendedThicknessValue = calculateShellThickness(
      outerShell, innerStave, size, depth, lugs
    );
    setRecommendedThickness(recommendedThicknessValue);

    const updatedStaveQuantities = getStaveQuantities(
      size, lugs, outerShell, innerStave, depth, recommendedThicknessValue
    );

    console.log("Updated Stave Quantities:", updatedStaveQuantities);

    if (updatedStaveQuantities.length > 0) {
      setStaveQuantities(updatedStaveQuantities);
      setStaveOption(updatedStaveQuantities[0]);
    } else {
      setStaveQuantities([`12 - ${recommendedThicknessValue}mm`]); // Default fallback
      setStaveOption(`12 - ${recommendedThicknessValue}mm`);
    }
  }, [outerShell, innerStave, size, depth, lugs]);

  return (
    <div className="feuzon-product-detail">
      <h1>FEUZON SERIES SNARE DRUM</h1>

      <div className="feuzon-product-content">
        <div className="feuzon-product-visuals">
          <div className="feuzon-product-image">
            <img src="/images/feuzon/default.png" alt="Feuzon Drum Model" />
          </div>
          <div className="feuzon-sound-charts">
            <SpiderChart data={[8, 7, 7, 7, 8]} />
            <BarChart data={{ attack: 8, sustain: 7, brightness: 7, warmth: 7, projection: 8 }} />
          </div>
        </div>

        <div className="feuzon-product-details">
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

          <label htmlFor="size">Snare Size (Diameter)</label>
          <select id="size" value={size} onChange={(e) => setSize(e.target.value)}>
            {Object.keys(basePrices).map((s) => (
              <option key={s} value={s}>{s}&quot;</option>
            ))}
          </select>

          <label htmlFor="depth">Depth</label>
          <select id="depth" value={depth} onChange={(e) => setDepth(e.target.value)}>
            {Object.keys(depthPrices[size]).map((d) => (
              <option key={d} value={d}>{d}&quot;</option>
            ))}
          </select>

          <label htmlFor="lugs">Lug Quantity</label>
          <select id="lugs" value={lugs} onChange={(e) => setLugs(e.target.value)}>
            {lugOptions[size].map((lugOption) => (
              <option key={lugOption} value={lugOption}>{lugOption} Lugs</option>
            ))}
          </select>

          <label htmlFor="staveOption">Stave Quantity & Shell Thickness</label>
          <select id="staveOption" value={staveOption} onChange={(e) => setStaveOption(e.target.value)}>
            {staveQuantities.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
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