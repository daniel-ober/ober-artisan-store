const functions = require("firebase-functions/v2/https"); // Ensure correct import for 2nd Gen
const fetch = require("node-fetch");

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || "your-secret-key-here";

exports.verifyRecaptcha = functions.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, error: "Missing reCAPTCHA token" });
  }

  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `secret=${RECAPTCHA_SECRET_KEY}&response=${token}`,
  });

  const data = await response.json();
  // console.log("🛡️ Google reCAPTCHA Verification Response:", data);

  if (data.success) {
    return res.json({ success: true, score: data.score });
  } else {
    return res.status(400).json({ success: false, error: data["error-codes"] });
  }
});