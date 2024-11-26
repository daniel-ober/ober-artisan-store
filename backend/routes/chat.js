const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');

// Initialize OpenAI with your API key
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Ensure this matches the `.env` variable
});

// Route to handle chat requests
router.post('/', async (req, res) => {
    const { messages } = req.body;

    console.log('Messages received:', messages);

    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).send('Messages array is required and should not be empty.');
    }

    try {
        // Correct method for generating chat completions
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
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

        console.log('Full OpenAI API Response:', JSON.stringify(response, null, 2));

        // Extract and send the assistant's message
        const assistantMessage = response.choices[0]?.message || {
            role: 'assistant',
            content: 'I am sorry, I could not process your request.',
        };

        res.json(assistantMessage);
    } catch (error) {
        console.error('Error generating assistant response:', error.response?.data || error.message);
        res.status(500).send('Error generating assistant response.');
    }
});

module.exports = router;
