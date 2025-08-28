// functions/src/routes/shipping.js
const express = require("express");
const fetch = require("node-fetch");

const router = express.Router();

// POST /printify/quote
// Expects: { line_items: [...], address_to: {...} }
// Returns: { economy?: number, standard?: number, express?: number, priority?: number, printify_express?: number }
router.post("/printify/quote", async (req, res) => {
  try {
    const { line_items, address_to } = req.body;

    if (!Array.isArray(line_items) || !line_items.length || !address_to) {
      return res.status(400).json({ error: "Missing line_items or address_to" });
    }

    const PRINTIFY_TOKEN = process.env.PRINTIFY_API_TOKEN;
    const PRINTIFY_SHOP_ID = process.env.PRINTIFY_SHOP_ID;

    if (!PRINTIFY_TOKEN || !PRINTIFY_SHOP_ID) {
      return res.status(500).json({ error: "Printify credentials not available" });
    }

    const resp = await fetch(
      `https://api.printify.com/v1/shops/${PRINTIFY_SHOP_ID}/orders/shipping.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PRINTIFY_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ line_items, address_to }),
      }
    );

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("Printify error:", txt);
      return res.status(502).json({ error: "Printify request failed" });
    }

    const rates = await resp.json(); // e.g. { standard: 999, economy: 399, ... }
    return res.json(rates);
  } catch (err) {
    console.error("quote error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
});

module.exports = router;