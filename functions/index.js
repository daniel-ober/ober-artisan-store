const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

if (!admin.apps.length) {
    admin.initializeApp();
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Importing routes
const chatRoute = require("./src/routes/chat");
const contactRoute = require("./src/routes/contact");
const productsRoute = require("./src/routes/products");
const ordersRoute = require("./src/routes/orders");
const usersRoute = require("./src/routes/users");

// Attach routes
app.use("/api/chat", chatRoute);
app.use("/api/contact", contactRoute);
app.use("/api/products", productsRoute);
app.use("/api/orders", ordersRoute);
app.use("/api/users", usersRoute);

// ✅ Export Firebase Function
exports.api = functions.https.onRequest(app);