// backend/routes/chat.js
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

// OpenAI initialization
const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
});

// Route to handle chat
router.post('/', async (req, res) => {
    const { messages } = req.body;

    console.log('Messages received:', messages);

    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).send('Messages array is required and should not be empty.');
    }

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            assistant: 'asst_7gkLO2QlEEZSOMieg1JlWlgH', // Specify the assistant ID
            messages: [
                {
                    role: 'system',
                    content: `
                        You are a knowledgeable, friendly, and professional assistant for Dan Ober Artisan Drums.
                        Your primary focus is helping musicians, drummers, and collectors find the perfect handcrafted drums.
                        Provide responses that highlight the uniqueness, quality, and craftsmanship of Dan Ober's drums. 
                        Answer inquiries about products, customization options, the drum-making process, and company values.
                    `,
                },
                ...messages,
            ],
        });

        console.log('Full OpenAI API Response:', response);

        // Extract the assistant's message
        const assistantMessage = response.choices?.[0]?.message || {
            role: 'assistant',
            content: 'I am sorry, I could not process your request.',
        };

        console.log('Assistant Message:', assistantMessage);

        res.json(assistantMessage);
    } catch (error) {
        console.error('Error generating assistant response:', error.response?.data || error.message);
        res.status(500).send('Error generating assistant response.');
    }
});

module.exports = router;
