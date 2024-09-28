import React, { useState } from 'react';
import './ChatSupportWindow.css'; // Import your CSS for styling

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

function ChatSupportWindow({ currentTab, messages, setMessages, handlePreloadedQuestionClick, sendMessage }) {
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (input.trim()) {
            sendMessage(input); // Use sendMessage passed from the parent
            setInput(''); // Clear input after sending
        }
    };

    return (
        <div className="chat-support-window">
            <div className="chat-messages">
                {messages.map((message, index) => (
                    <div key={index} className={`message ${message.role}`}>
                        {message.content}
                    </div>
                ))}
            </div>

            {/* Preloaded Questions */}
            <div className="preloaded-questions">
                {preloadedQuestions[currentTab]?.map((question, index) => (
                    <div
                        key={index}
                        className="preloaded-question"
                        onClick={() => handlePreloadedQuestionClick(question)}
                    >
                        {question}
                    </div>
                ))}
            </div>

            {/* Chat Input */}
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
