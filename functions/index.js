import fetch from 'node-fetch';
const functions = require("firebase-functions");
const express = require("express");

const app = express();
app.use(express.json());

// Define the API endpoint
app.get("/api/products", async (req, res) => {
  try {
    // Replace with the actual backend URL
    const response = await fetch("http://localhost:4949/api/products");
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Export the Express app as a Firebase Cloud Function
exports.api = functions.https.onRequest(app);
