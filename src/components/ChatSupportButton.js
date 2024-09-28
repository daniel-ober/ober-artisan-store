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

    const toggleChat = () => {
        setChatOpen(!chatOpen);
    };

    const sendMessage = async (messageContent) => {
        const content = messageContent.trim();
        if (content === '') return; // Prevent sending empty messages

        // User message object
        const userMessage = { role: 'user', content, timestamp: new Date() };
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

            // Save the chat to Firestore
            await addDoc(collection(db, 'chats'), {
                userMessage: {
                    role: userMessage.role,
                    content: userMessage.content,
                    timestamp: serverTimestamp(),
                },
                assistantMessage: {
                    role: assistantMessage.role,
                    content: assistantMessage.content,
                    timestamp: serverTimestamp(),
                },
                currentTab: currentTab,
                createdAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handlePreloadedQuestionClick = (question) => {
        sendMessage(question);
    };

    return (
        <>
            <button onClick={toggleChat} className="chat-button">
                <FontAwesomeIcon icon={faComments} />
            </button>

            {chatOpen && (
                <div className="chat-window">
                    <ChatSupportWindow
                        currentTab={currentTab}
                        messages={messages}
                        setMessages={setMessages}
                        handlePreloadedQuestionClick={handlePreloadedQuestionClick}
                        sendMessage={sendMessage} // Pass down sendMessage to handle it in ChatSupportWindow
                    />
                </div>
            )}
        </>
    );
}

export default ChatSupportButton;
