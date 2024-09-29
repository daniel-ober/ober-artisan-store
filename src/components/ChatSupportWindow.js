import React, { useState } from 'react';
import './ChatSupportWindow.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWindowMaximize, faWindowRestore, faTimes } from '@fortawesome/free-solid-svg-icons';

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

function ChatSupportWindow({ currentTab, messages, sendMessage, toggleMaximize, isMaximized, toggleChat }) {
    const [input, setInput] = useState('');

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
                    Hi! My name is Oakli, Dan Ober's chat assistant. I can help you with questions about products, availability, and more!
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
                    <div
                        key={index}
                        className="preloaded-question"
                        onClick={() => sendMessage(question)} // Directly send preloaded question
                    >
                        {question}
                    </div>
                ))}
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
