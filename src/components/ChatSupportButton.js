import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments } from '@fortawesome/free-solid-svg-icons';
import ChatSupportWindow from './ChatSupportWindow'; // Adjust the path as necessary
import './ChatSupportButton.css';

function ChatSupportButton({ currentTab }) {
    const [chatOpen, setChatOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    const toggleChat = () => {
        setChatOpen(!chatOpen);
    };

    const sendMessage = async () => {
        if (input.trim() === '') return; // Prevent sending empty messages

        const userMessage = { role: 'user', content: input };
        setMessages((prevMessages) => [...prevMessages, userMessage]);

        try {
            const response = await fetch('http://localhost:4949/api/chat', { // Adjust this URL as necessary
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    model: 'gpt-3.5-turbo', // Add model info here
                    messages: [...messages, userMessage] // Send the full messages array
                }),
            });

            if (!response.ok) {
                const errorText = await response.text(); // Get error text
                throw new Error(`Network response was not ok: ${errorText}`);
            }

            const data = await response.json();
            const assistantMessage = { role: 'assistant', content: data.choices[0].message.content }; // Adjust based on the actual response structure

            setMessages((prevMessages) => [...prevMessages, assistantMessage]);
        } catch (error) {
            console.error('Error:', error);
        }

        setInput(''); // Clear the input after sending
    };

    return (
        <>
            <button onClick={toggleChat} className="chat-button">
                <FontAwesomeIcon icon={faComments} />
            </button>

            {chatOpen && (
                <div className="chat-window">
                    <ChatSupportWindow currentTab={currentTab} messages={messages} setMessages={setMessages} />
                    <div className="chat-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.role}`}>
                                {msg.content}
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
                        <button onClick={sendMessage}>Send</button>
                    </div>
                </div>
            )}
        </>
    );
}

export default ChatSupportButton;
