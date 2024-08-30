// backend/models/inquiry.js

const mongoose = require('mongoose');

const InquirySchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  message: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

const Inquiry = mongoose.model('Inquiry', InquirySchema);

module.exports = Inquiry;
