import React, { useState, useEffect } from 'react';
import './ChatSupportWindow.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWindowMaximize, faWindowRestore, faTimes } from '@fortawesome/free-solid-svg-icons';

const preloadedQuestions = {
    Home: [
        "What are your store hours?",
        "Where is the store located?",
        "Do you offer any promotions or discounts?",
        "What services do you provide?",
        "Can I visit your workshop in person?"
    ],
    Contact: [
        "How can I get in touch with support?",
        "What’s your response time for inquiries?",
        "Do you have a direct customer service phone number?",
        "How can I reach you after business hours?",
        "Can I schedule a consultation?"
    ],
    "Sign In": [
        "I forgot my password, how can I reset it?",
        "What do I do if I can't sign in?",
        "Can I sign in with Google or Facebook?",
        "How do I create an account?",
        "How do you handle my personal data?"
    ],
    Account: [
        "How can I update my account details?",
        "How do I change my password?",
        "Where can I see my order history?",
        "How do I delete my account?",
        "Can I link my account to social media?"
    ],
    Register: [
        "How do I create a new account?",
        "What information do I need to register?",
        "Can I register using my Google account?",
        "Do I need to verify my email to register?",
        "What are the benefits of registering?"
    ],
    ForgotPassword: [
        "How do I reset my password?",
        "What if I didn’t get the reset email?",
        "Can I change my password without my old one?",
        "How long does the password reset link last?",
        "Can I recover my password if I forgot it?"
    ],
    Cart: [
        "What’s your return policy?",
        "Can I modify my cart before checkout?",
        "How long do I have to complete a purchase?",
        "What payment methods do you accept?",
        "Do you offer free shipping?"
    ],
    About: [
        "Who is Dan Ober?",
        "How did Dan start crafting drums?",
        "What makes your handcrafted drums unique?",
        "Does Dan offer custom drum designs?",
        "Where can I find more info about Dan's journey?"
    ],
    Products: [
        "What materials are used in your drums?",
        "Can I place a custom order?",
        "What’s your most popular drum model?",
        "Are your drums suitable for beginners?",
        "Do you offer any drum accessories?"
    ]
};

function ChatSupportWindow({ currentTab, messages, sendMessage, toggleMaximize, isMaximized, toggleChat }) {
    const [input, setInput] = useState('');

    // Log currentTab to check its value
    useEffect(() => {
        console.log('Current tab:', currentTab); // This will output the value of currentTab to the console
    }, [currentTab]);

    const handleSend = () => {
        if (input.trim()) {
            sendMessage(input);
            setInput(''); // Clear input after sending
        }
    };

    return (
        <div className="chat-support-window">
            <div className="chat-header">
                <div className="chat-intro">
                    Hi! My name is Oakli, Dan Ober&apos;s chat assistant. I can help you with questions about products, availability, and more!
                </div>
                <div className="chat-header-icons">
                    <FontAwesomeIcon icon={isMaximized ? faWindowRestore : faWindowMaximize} onClick={toggleMaximize} />
                    <FontAwesomeIcon icon={faTimes} onClick={toggleChat} />
                </div>
            </div>
            <div className="chat-messages">
                {messages.map((message, index) => (
                    <div key={index} className={`message ${message.role}`}>
                        {message.content}
                    </div>
                ))}
            </div>

            <div className="preloaded-questions">
                {preloadedQuestions[currentTab]?.map((question, index) => (
                    <button
                        key={index}
                        className="preloaded-question"
                        onClick={() => sendMessage(question)} // Directly send preloaded question
                    >
                        {question}
                    </button>
                )) || (
                    <div>No preloaded questions available for this section.</div>
                )}
            </div>

            <div className="chat-input-container">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                />
                <button onClick={handleSend}>Send</button>
            </div>
        </div>
    );
}

export default ChatSupportWindow;
