require('dotenv').config();  // Make sure this is at the very top
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4949;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)  // Corrected access to environment variable
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });

// Define routes
app.use('/api/products', require('./routes/products'));  // Ensure the path is correct

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
