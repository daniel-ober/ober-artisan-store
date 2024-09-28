import React, { useState, useEffect } from 'react';
import { auth, firestore } from '../firebaseConfig'; // Adjust the path according to your structure

const preloadedQuestions = {
    About: [
        "Who the heck is Dan Ober?",
        "Tell me a fun fact about Dan.",
        "What’s Dan’s favorite way to unwind?",
        "How did Dan get into handcrafted drums?",
    ],
    Products: [
        "I'm interested in one of your products.",
        "I'm checking availability of (insert product name).",
        "What makes your drums different from others?",
        "Can you tell me about your most popular drum?",
    ],
};

const ChatSupportWindow = ({ currentTab }) => {
    const [messages, setMessages] = useState([
        { sender: 'bot', text: "Hi! I'm Oakli, Dan Ober's assistant. How can I help you today?" },
    ]);
    const [input, setInput] = useState('');

    const trainingData = `You are a Customer Support Assistant for Dan Ober Artisan Drums. Provide assistance and estimates for custom drums with an assertive approach to set the right expectations in terms of value. Address general questions about the business, production times, delivery times, and delivery costs.

About Dan Ober and his craftsmanship:
Dan’s journey into the world of drumming began with a profound passion for music, extending beyond drumming to guitar, singing, keyboard, and more. He studied Film Scoring and Composition at Berklee College of Music, learning under renowned musicians like Mike Mangini and Kim Plainfield. With a decade of experience in a bar and wedding band, Dan moved to Nashville to immerse himself in drumming.

His craftsmanship blends traditional techniques with modern innovation. Each drum is meticulously crafted, reflecting his dedication to quality and artistry. Dan Ober Artisan Drums stand out for their individuality, quality, and attention to detail, appealing to serious musicians and collectors seeking inspiration through their instruments. Business Name: Dan Ober Artisan Drums. Location: Nashville, TN. Hometown: Medway, Massachusetts.`;

    const handleSend = async () => {
        if (input.trim()) {
            const userMessage = { sender: 'user', text: input };
            setMessages((prev) => [...prev, userMessage]);

            const botResponse = await fetchChatResponse(input);
            setMessages((prev) => [...prev, { sender: 'bot', text: botResponse }]);
            setInput(''); // Clear input after sending
        }
    };

    const fetchChatResponse = async (userInput) => {
        console.log("User Input:", userInput);
        const response = await fetch('/chat', { // Updated endpoint here
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'user',
                        content: `${trainingData} ${userInput}`
                    }
                ],
                preset: 'luLPmmm6kyFregW4egGWJITO'
            }),
        });

        console.log("Response Status:", response.status);
        const data = await response.json();
        console.log("Response Data:", data);

        if (!response.ok) {
            console.error('Error fetching chat response:', response.statusText);
            return "Sorry, I couldn't fetch the response. Please try again.";
        }

        return data.choices[0]?.message?.content || "Sorry, I didn't understand that.";
    };

    const handlePreloadedQuestion = (question) => {
        setInput(question);
        handleSend(); // Send the pre-loaded question
    };

    const renderPreloadedQuestions = () => {
        const questions = preloadedQuestions[currentTab] || [];
        return (
            <div className="preloaded-questions">
                {questions.map((question, index) => (
                    <button 
                        key={index} 
                        onClick={() => handlePreloadedQuestion(question)} 
                        className="preloaded-question-button"
                    >
                        {question}
                    </button>
                ))}
            </div>
        );
    };

    const handleConversationEnd = async () => {
        // Capture and log the conversation
        const conversationData = {
            userMessages: messages.filter(msg => msg.sender === 'user').map(msg => msg.text),
            botResponses: messages.filter(msg => msg.sender === 'bot').map(msg => msg.text),
            timestamp: new Date(),
        };

        // Store in Firestore
        try {
            await firestore.collection('chats').add(conversationData);
            console.log("Conversation logged successfully.");
        } catch (error) {
            console.error("Error logging conversation:", error);
        }
    };

    useEffect(() => {
        // Trigger logging on component unmount or when you define the end of a conversation
        return () => {
            handleConversationEnd();
        };
    }, [messages]); // Optionally, you can use a specific condition to determine when to log

    return (
        <div className="chat-window-content">
            <div className="chat-messages">
                {messages.map((msg, index) => (
                    <p key={index} className={msg.sender === 'user' ? 'user-msg' : 'bot-msg'}>
                        {msg.text}
                    </p>
                ))}
            </div>
            {renderPreloadedQuestions()} {/* Render pre-loaded questions */}
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask something..."
            />
            <button onClick={handleSend}>Send</button>
        </div>
    );
};

export default ChatSupportWindow;
