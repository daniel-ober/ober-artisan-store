// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp();
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Import Express routes
const chatRoute = require('../backend/routes/chat');
const contactRoute = require('../backend/routes/contact');
const productsRoute = require('../backend/routes/products');
const ordersRoute = require('../backend/routes/orders');
const usersRoute = require('../backend/routes/users');

// Attach routes
app.use('/api/chat', chatRoute);
app.use('/api/contact', contactRoute);
app.use('/api/products', productsRoute);
app.use('/api/orders', ordersRoute);
app.use('/api/users', usersRoute);

// Export the Express API as a Cloud Function
// exports.api = functions.https.onRequest(app);

// Import the `updateInventory` function
const updateInventory = require("./src/updateInventory");

// Export the `updateInventory` Cloud Function
exports.updateInventory = updateInventory;