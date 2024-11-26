import React, { useState, useEffect } from 'react';
import './ChatSupportWindow.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWindowMaximize, faWindowRestore, faTimes, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const ChatSupportWindow = ({ messages, sendMessage, onClose, onBack }) => {
  const [input, setInput] = useState('');
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    // Show Oakli's intro message on load
    if (showIntro && messages.length === 0) {
      sendMessage(
        "Hi! I'm Oakli, your chat assistant. I can help answer questions about products, services, and more. If I can't find what you're looking for, I'll let you know how to get further assistance!"
      );
      setShowIntro(false);
    }
  }, [showIntro, messages, sendMessage]);

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="chat-support-window">
      <div className="chat-header">
        {onBack && (
          <FontAwesomeIcon
            icon={faArrowLeft}
            className="back-icon"
            onClick={onBack}
          />
        )}
        <div>Chat with Oakli</div>
        <FontAwesomeIcon icon={faTimes} className="close-icon" onClick={onClose} />
      </div>

      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            {message.content}
          </div>
        ))}
      </div>

      <div className="chat-input-container">
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default ChatSupportWindow;
