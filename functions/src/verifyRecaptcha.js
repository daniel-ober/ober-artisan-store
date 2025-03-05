// functions/src/verifyRecaptcha.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

if (!admin.apps.length) {
    admin.initializeApp();
}

const RECAPTCHA_SECRET_KEY = functions.config().recaptcha.secret;

exports.verifyRecaptcha = functions.https.onRequest(async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ success: false, error: "Missing reCAPTCHA token." });
        }

        // Verify reCAPTCHA with Google API
        const response = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${token}`, {
            method: "POST",
        });

        const data = await response.json();

        if (!data.success || data.score < 0.5) {
            return res.status(403).json({ success: false, error: "reCAPTCHA verification failed." });
        }

        return res.status(200).json({ success: true, message: "reCAPTCHA verified." });
    } catch (error) {
        console.error("Error verifying reCAPTCHA:", error);
        return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});