const express = require('express');
const cors = require('cors');
const { db } = require('./firebaseConfig'); // Centralized Firebase Admin SDK
const productsRouter = require('./routes/products'); // Import routes

const app = express();

app.use(cors());
app.use(express.json()); // Parse JSON

// Mount routes
app.use('/api/products', productsRouter);

const PORT = process.env.PORT || 4949;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
