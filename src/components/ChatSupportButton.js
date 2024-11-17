import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments } from '@fortawesome/free-solid-svg-icons';
import ChatSupportWindow from './ChatSupportWindow';
import './ChatSupportButton.css';
import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const ChatSupportButton = React.memo(({ currentTab }) => {
    const [chatOpen, setChatOpen] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [messages, setMessages] = useState([]);

    const toggleChat = () => {
        setChatOpen((prev) => !prev);
        if (isMaximized) setIsMaximized(false);
    };

    const toggleMaximize = () => {
        setIsMaximized((prevState) => !prevState);
    };

    const sendMessage = async (messageContent) => {
        // Ensure message content is valid (not empty or null)
        const content = messageContent?.trim();
        if (!content) {
            console.error("Cannot send an empty message.");
            return;
        }

        const userMessage = { role: 'user', content, timestamp: new Date() };
        setMessages((prevMessages) => [...prevMessages, userMessage]);

        try {
            console.log("Sending message:", userMessage);

            // Ensure the message structure is correctly formatted
            const response = await fetch('http://localhost:4949/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [...messages, userMessage], // Send the full chat history
                }),
            });

            // Ensure we got a successful response
            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const assistantMessage = {
                role: 'assistant',
                content: data?.content || 'Error: No response from assistant.',
                timestamp: new Date(),
            };

            setMessages((prevMessages) => [...prevMessages, assistantMessage]);

            await addDoc(collection(db, 'chats'), {
                userMessage: userMessage.content,
                assistantMessage: assistantMessage.content,
                timestamp: serverTimestamp(),
            });

        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    useEffect(() => {
        // Optional: log current tab changes
        console.log("Current Tab changed to:", currentTab);
    }, [currentTab]);

    return (
        <>
            <button onClick={toggleChat} className="chat-button">
                <FontAwesomeIcon icon={faComments} />
            </button>

            {chatOpen && (
                <div className={`chat-window ${isMaximized ? 'maximized' : ''}`}>
                    <ChatSupportWindow
                        currentTab={currentTab}
                        messages={messages}
                        sendMessage={sendMessage}
                        toggleMaximize={toggleMaximize}
                        isMaximized={isMaximized}
                        toggleChat={toggleChat}
                    />
                </div>
            )}
        </>
    );
});

// Assign a display name for easier debugging
ChatSupportButton.displayName = 'ChatSupportButton';

export default ChatSupportButton;
