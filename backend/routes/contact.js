const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Define Inquiry Schema
const inquirySchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  email: String,
  phone: String,
  message: String,
  submittedAt: { type: Date, default: Date.now }
});

// Define Inquiry Model
const Inquiry = mongoose.model('Inquiry', inquirySchema, 'inquiries');

// POST /api/contact
router.post('/contact', async (req, res) => {
  const { first_name, last_name, email, phone, message } = req.body;

  // Create a new inquiry document
  const newInquiry = new Inquiry({ first_name, last_name, email, phone, message });

  try {
    // Save the document to MongoDB
    await newInquiry.save();
    res.status(200).json({ success: true, message: 'Inquiry saved successfully' });
  } catch (error) {
    console.error('Error saving inquiry:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
