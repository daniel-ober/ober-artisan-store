import React, { useState } from 'react';
import './SupportChatModal.css';

const SupportChatModal = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, { sender: 'user', message: input }]);
      setInput('');
    }
  };

  return (
    <div className="chat-modal-overlay" role="dialog">
      <div className="chat-modal-content" role="document">
        <div className="chat-header">
          <h3>Chat with Oakli</h3>
          <button onClick={onClose} aria-label="Close chat">Close Chat</button>
        </div>
        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-message ${msg.sender}`}>
              {msg.message}
            </div>
          ))}
        </div>
        <div className="chat-input">
          <input
            type="text"
            placeholder="Type your message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Type your message"
          />
          <button onClick={handleSend} aria-label="Send message">Send</button>
        </div>
      </div>
    </div>
  );
};

export default SupportChatModal;