const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  images: {
    type: [String], // Array of image URLs
    required: true,
  },
  // Add more fields as needed
});

module.exports = mongoose.model('Product', ProductSchema);
