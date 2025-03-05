// functions/src/routes/chat.js

const express = require("express");
const OpenAI = require("openai").default; // ✅ Fix for CommonJS in Firebase Functions
const functions = require("firebase-functions");

const router = express.Router();

// Retrieve OpenAI API key
const openaiKey = process.env.OPENAI_API_KEY || functions.config()?.openai?.key;

console.log("🔍 OpenAI API Key Loaded:", openaiKey ? "✅ YES" : "❌ NO");

if (!openaiKey) {
    console.error("❌ OpenAI API Key Missing");
    throw new Error("OpenAI API key is missing. Ensure it is set in Firebase config or environment variables.");
}

// ✅ Correct OpenAI instance creation
const openai = new OpenAI({ apiKey: openaiKey });

router.post("/", async (req, res) => {
    try {
        const { messages } = req.body;
        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: "Messages array is required and should not be empty." });
        }

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a knowledgeable assistant for Dan Ober Artisan Drums." },
                ...messages,
            ],
        });

        res.json(response.choices[0]?.message || { role: "assistant", content: "Sorry, I couldn't process your request." });
    } catch (error) {
        console.error("❌ OpenAI Error:", error);
        res.status(500).json({ error: "Error generating assistant response." });
    }
});

module.exports = router;