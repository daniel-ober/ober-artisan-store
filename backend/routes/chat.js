const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
});

router.post('/', async (req, res) => {
    const { messages } = req.body;

    // Validate the messages array and content
    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).send('Messages array is required and should not be empty.');
    }

    // Ensure all messages have valid content
    const invalidMessage = messages.find(msg => !msg.content || typeof msg.content !== 'string' || msg.content.trim() === '');
    if (invalidMessage) {
        return res.status(400).send('One or more messages have invalid or empty content.');
    }

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo', // or your preferred model
            messages,
        });

        res.json(response);
    } catch (error) {
        console.error('Error generating assistant response:', error);
        res.status(500).send('Error generating assistant response');
    }
});

module.exports = router;
