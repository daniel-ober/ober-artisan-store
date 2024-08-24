const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./db'); // Ensure this path is correct

const app = express();
const port = process.env.PORT || 3001;

app.use(bodyParser.json());

// Contact form route
app.post('/api/contact', (req, res) => {
  const { email, message } = req.body;
  
  // Handle form data, e.g., save to database or send email
  // For now, just return a success response
  res.status(200).json({ success: true, message: 'Message received' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
