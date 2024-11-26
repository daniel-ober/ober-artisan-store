import React, { useState, useEffect } from 'react';
import './ChatSupportWindow.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWindowMaximize,
  faWindowRestore,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import preloadedQuestions from '../data/preloadedquestions'; // Import the questions

function ChatSupportWindow({
  currentTab,
  messages,
  sendMessage,
  toggleMaximize,
  isMaximized,
  toggleChat,
}) {
  const [input, setInput] = useState('');
  const [preloadedQuestionsList, setPreloadedQuestionsList] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('ChatSupportWindow - Current Tab:', currentTab);

    const normalizedTab = currentTab?.toLowerCase(); // Normalize the currentTab to lowercase
    if (normalizedTab && preloadedQuestions[normalizedTab]) {
      setPreloadedQuestionsList(preloadedQuestions[normalizedTab]);
      console.log(
        'Preloaded Questions List:',
        preloadedQuestions[normalizedTab]
      );
    } else {
      console.log('No preloaded questions available for this tab:', currentTab);
      setPreloadedQuestionsList([]);
    }
  }, [currentTab]);

  const handleSend = async () => {
    if (input.trim()) {
      try {
        await sendMessage(input);
        setInput('');
        setError('');
      } catch (error) {
        console.error('Error sending message:', error);
        setError(
          'There was an issue sending your message. Please try again later.'
        );
      }
    }
  };

  return (
    <div className="chat-support-window">
      <div className="chat-header">
        <div className="chat-intro">
          Hi! My name is Oakli, Dan Ober’s chat assistant. I can help you with
          questions about products, availability, and more!
        </div>
        <div className="chat-header-icons">
          <FontAwesomeIcon
            icon={isMaximized ? faWindowRestore : faWindowMaximize}
            onClick={toggleMaximize}
          />
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
        {preloadedQuestionsList.length > 0 ? (
          preloadedQuestionsList.map((item, index) => (
            <button
              key={index}
              className="preloaded-question"
              onClick={() => sendMessage(item.question)}
            >
              {item.question}
            </button>
          ))
        ) : (
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

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default ChatSupportWindow;
