import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments } from '@fortawesome/free-solid-svg-icons';
import ChatSupportWindow from './ChatSupportWindow'; // Adjust the path as necessary
import './ChatSupportButton.css';
import { db } from '../firebaseConfig'; // Import Firestore
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

function ChatSupportButton({ currentTab }) {
    const [chatOpen, setChatOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    const toggleChat = () => {
        setChatOpen(!chatOpen);
    };

    const sendMessage = async () => {
        if (input.trim() === '') return; // Prevent sending empty messages

        // Log currentTab to check if it's being passed correctly
        console.log('currentTab:', currentTab);

        // User message object
        const userMessage = { role: 'user', content: input, timestamp: new Date() };
        setMessages((prevMessages) => [...prevMessages, userMessage]);

        try {
            const response = await fetch('http://localhost:4949/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [...messages, userMessage],
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Network response was not ok: ${errorText}`);
            }

            const data = await response.json();
            // Assistant message object
            const assistantMessage = { role: 'assistant', content: data.choices[0].message.content, timestamp: new Date() };

            setMessages((prevMessages) => [...prevMessages, assistantMessage]);

            // Ensure currentTab is defined, use a fallback if undefined
            const tabToUse = currentTab || 'defaultTab'; // Fallback to 'defaultTab' if undefined
            console.log('Using tab:', tabToUse); // Log the tab being used for debugging

            // Save the entire chat (user + assistant messages) to Firestore
            await addDoc(collection(db, 'chats'), {
                userMessage: {
                    role: userMessage.role,
                    content: userMessage.content,
                    timestamp: serverTimestamp(), // Timestamp outside of the array
                },
                assistantMessage: {
                    role: assistantMessage.role,
                    content: assistantMessage.content,
                    timestamp: serverTimestamp(), // Timestamp outside of the array
                },
                currentTab: tabToUse, // Use the defined or fallback tab
                createdAt: serverTimestamp(), // Record the chat creation timestamp
            });
        } catch (error) {
            console.error('Error:', error);
        }

        setInput(''); // Clear the input after sending
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
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
                            onKeyPress={handleKeyPress}
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
