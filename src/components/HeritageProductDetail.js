import React, { useState, useEffect } from "react";
import "./HeritageProductDetail.css";

const HeritageProductDetail = () => {
  const [size, setSize] = useState("12");
  const [depth, setDepth] = useState("5.0");
  const [lugs, setLugs] = useState("8");
  const [staveOption, setStaveOption] = useState("16 - 12mm");
  const [totalPrice, setTotalPrice] = useState(850);

  const reRingCost = 150;

  // 🔄 Base Pricing for Each Size & Depth
  const basePrices = {
    "12": 850,
    "13": 950,
    "14": 1050,
  };

  const depthPrices = {
    "12": { "5.0": 0, "6.0": 100, "7.0": 200 },
    "13": { "5.0": 0, "6.0": 100, "7.0": 200 },
    "14": { "5.5": 0, "6.0": 50, "6.5": 100 },
  };

  // 🔄 Stave Quantity & Shell Thickness Options
  const staveOptions = {
    "12": { "6": ["12 - 12mm"], "8": ["16 - 12mm", "8 - 6mm +$150 (Re-Rings)"] },
    "13": { "8": ["16 - 12mm", "8 - 6mm +$150 (Re-Rings)"] },
    "14": { "8": ["16 - 12mm"], "10": ["20 - 12mm", "10 - 6mm +$150 (Re-Rings)"] },
  };

  const lugOptions = {
    "12": ["6", "8"],
    "13": ["8"],
    "14": ["8", "10"],
  };

  // **🔄 Reset and Recalculate Price on Every Change**
  useEffect(() => {
    let newPrice = basePrices[size]; // **Start fresh from base price**
    newPrice += depthPrices[size][depth]; // **Add depth price**

    // If stave option includes "Re-Rings", add cost
    if (staveOption.includes("Re-Rings")) {
      newPrice += reRingCost;
    }

    setTotalPrice(newPrice);
  }, [size, depth, lugs, staveOption]);

  // 🛠 **Update Base Price on Size Change**
  const handleSizeChange = (e) => {
    const newSize = e.target.value;
    setSize(newSize);
    setDepth(Object.keys(depthPrices[newSize])[0]);
    setLugs(lugOptions[newSize][0]);

    // **Default to non-re-ring option if available**
    const staveList = staveOptions[newSize][lugOptions[newSize][0]];
    setStaveOption(staveList.find((s) => !s.includes("Re-Rings")) || staveList[0]);
  };

  // 🛠 **Update Depth Selection**
  const handleDepthChange = (e) => {
    setDepth(e.target.value);
  };

  // 🛠 **Update Lugs & Reset Staves**
  const handleLugChange = (e) => {
    const newLug = e.target.value;
    setLugs(newLug);

    // **Default to non-re-ring option if available**
    const staveList = staveOptions[size][newLug];
    setStaveOption(staveList.find((s) => !s.includes("Re-Rings")) || staveList[0]);
  };

  // 🛠 **Update Stave Selection**
  const handleStaveChange = (e) => {
    setStaveOption(e.target.value);
  };

  return (
    <div className="heritage-product-detail">
      <h1>HERÍTAGE Series Snare Drum</h1>

      <div className="heritage-product-content">
        {/* Drum Image */}
        <div className="heritage-product-image">
          <img src="/artisan-shop/heritage-left.png" alt="HERÍTAGE Snare Drum" />
        </div>

        {/* Product Options */}
        <div className="heritage-product-options">
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

          {/* Snare Depth (Extra Cost) */}
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

          {/* Stave Quantity & Shell Thickness Combined */}
          <label htmlFor="staves">Stave Quantity & Shell Thickness</label>
          <select id="staves" value={staveOption} onChange={handleStaveChange}>
            {staveOptions[size][lugs].map((staveOption) => (
              <option key={staveOption} value={staveOption}>
                {staveOption}
              </option>
            ))}
          </select>

          {/* Total Price */}
          <h3>Total Price: ${totalPrice}</h3>

          {/* Add to Cart */}
          <button>Add to Cart</button>
        </div>
      </div>
    </div>
  );
};

export default HeritageProductDetail;