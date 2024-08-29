const express = require('express');
const cors = require('cors');
const app = express();
const port = 4949;

app.use(cors()); // Enable CORS for all routes
app.use(express.json());

// Your API routes here
app.get('/api/products', (req, res) => {
  res.json({ products: [] }); // Example response
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
