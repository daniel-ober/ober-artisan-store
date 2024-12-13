const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const functions = require('firebase-functions');

// Retrieve OpenAI API key
const openaiKey = process.env.OPENAI_API_KEY || functions.config()?.openai?.key;

if (!openaiKey) {
    throw new Error("OpenAI API key is missing. Ensure it is set in Firebase config or environment variables.");
}

const openai = new OpenAI({
    apiKey: openaiKey,
});

router.post('/', async (req, res) => {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Messages array is required and should not be empty." });
    }

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: `You are a knowledgeable assistant for Dan Ober Artisan Drums.`,
                },
                ...messages,
            ],
        });

        res.json(response.choices[0]?.message || {
            role: 'assistant',
            content: "Sorry, I couldn't process your request.",
        });
    } catch (error) {
        console.error("OpenAI Error:", error.message, error);
        res.status(500).json({ error: "Error generating assistant response." });
    }
});

module.exports = router;
