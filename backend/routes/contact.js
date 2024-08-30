// backend/routes/contact.js
const express = require('express');
const router = express.Router();

// POST /api/contact
router.post('/contact', (req, res) => {
  const { name, email, message } = req.body;
  
  // Here you can process the contact form data, e.g., send an email or save to a database
  console.log(`Contact form submitted: Name: ${name}, Email: ${email}, Message: ${message}`);
  
  // Respond with success
  res.status(200).json({ success: true });
});

module.exports = router;
