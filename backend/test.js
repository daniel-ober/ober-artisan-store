const OpenAI = require('openai');

// Initialize OpenAI API
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Make sure to use the correct environment variable
});

console.log('OpenAI API initialized successfully!');
