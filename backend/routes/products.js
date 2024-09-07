const express = require("express");
const router = express.Router();
<<<<<<< HEAD
const Product = require("../models/Product");

// GET all products
router.get("/", async (req, res) => {
=======
const Product = require('../models/Product');

// GET all products
router.get('/', async (req, res) => {
>>>>>>> 96496fb75cdfa99d6d6b4b7d23ae62060472ed73
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
<<<<<<< HEAD
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Server Error" });
  } 
});

// GET a single product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Server Error" });
=======
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET a single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Server Error' });
>>>>>>> 96496fb75cdfa99d6d6b4b7d23ae62060472ed73
  }
});

module.exports = router;
