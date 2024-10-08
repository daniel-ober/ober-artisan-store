import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments } from '@fortawesome/free-solid-svg-icons';
import ChatSupportWindow from './ChatSupportWindow';
import './ChatSupportButton.css';
import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

function ChatSupportButton({ currentTab }) {
    const [chatOpen, setChatOpen] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [messages, setMessages] = useState([]);

    console.log("ChatSupportButton - Received currentTab:", currentTab);

    const toggleChat = () => {
        setChatOpen(!chatOpen);
        if (isMaximized) setIsMaximized(false);
    };

    const toggleMaximize = () => {
        setIsMaximized(prevState => !prevState);
    };

    const sendMessage = async (messageContent) => {
        const content = messageContent.trim();
        if (content === '') return;
    
        const userMessage = { role: 'user', content, timestamp: new Date() };
        setMessages(prevMessages => [...prevMessages, userMessage]);
    
        try {
            console.log("Sending message:", userMessage);
    
            const response = await fetch('http://localhost:4949/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [...messages, userMessage],  // Ensure the new user message is included
                }),
            });
    
            // Ensure we got a successful response
            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
    
            const data = await response.json();
    
            // Check for the assistant message and handle missing content gracefully
            const assistantMessage = {
                role: 'assistant',
                content: data?.content || 'Error: No response from assistant.',
                timestamp: new Date(),
            };
    
            console.log("Received assistant message:", assistantMessage);
    
            setMessages(prevMessages => [...prevMessages, assistantMessage]);
    
            await addDoc(collection(db, 'chats'), {
                userMessage: userMessage.content,
                assistantMessage: assistantMessage.content,
                timestamp: serverTimestamp(),
            });
    
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };
    

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
}

export default ChatSupportButton;
