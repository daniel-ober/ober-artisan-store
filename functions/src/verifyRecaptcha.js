const functions = require('firebase-functions');
const fetch = require('node-fetch');

// Firebase Function to verify reCAPTCHA token
exports.verifyRecaptcha = functions.https.onRequest(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, message: "No token provided" });
  }

  const secretKey = functions.config().recaptcha.secret_key; // Ensure this is set in your Firebase config
  const verifyUrl = `https://www.google.com/recaptcha/api/siteverify`;

  try {
    const response = await fetch(verifyUrl, {
      method: "POST",
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const verificationResult = await response.json();
    
    // Debugging log to check the response from Google
    console.log("reCAPTCHA Verification Result:", verificationResult); // Added this line for debugging
    
    if (verificationResult.success) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(400).json({ success: false, message: "reCAPTCHA verification failed" });
    }
  } catch (error) {
    console.error("Error verifying reCAPTCHA:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});