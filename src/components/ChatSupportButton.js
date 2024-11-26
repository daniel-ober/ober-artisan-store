// src/components/ChatSupportButton.js
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments } from '@fortawesome/free-solid-svg-icons';
import ChatSupportWindow from './ChatSupportWindow';
import './ChatSupportButton.css';
import preloadedQuestions from '../data/preloadedquestions'; // Import preloaded questions

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
    const content = messageContent?.trim();
    if (!content) {
      console.error('Cannot send an empty message.');
      return;
    }
  
    const userMessage = {
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
  
    try {
      console.log('Sending message:', userMessage);
  
      // Call the backend API for assistant response
      const response = await fetch('http://localhost:4949/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `
                You are Oakli, the assistant for Dan Ober Artisan Drums. 
                Your primary goal is to provide short, concise, and helpful answers (1-3 sentences) 
                to user questions about Dan Ober's handcrafted drums. Avoid unnecessary details and 
                focus on delivering clear, actionable information.
              `,
            },
            ...messages,
            userMessage,
          ],
        }),
      });
  
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
  
      const data = await response.json();
      const assistantMessage = {
        role: 'assistant',
        content: data?.content || 'No response from assistant.',
        timestamp: new Date().toISOString(),
      };
  
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error.message || error);
  
      // Fallback response
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: 'assistant',
          content:
            "Sorry, I'm having trouble processing your request. Please try again later or refer to our FAQs.",
        },
      ]);
    }
  };
  

  useEffect(() => {
    console.log('Current Tab changed to:', currentTab);
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
