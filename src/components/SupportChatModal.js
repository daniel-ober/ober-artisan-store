import React, { useState, useEffect, useRef } from "react";
import "./SupportChatModal.css";

const SupportChatModal = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatMessagesRef = useRef(null);

  // Scroll to the bottom of the chat container
  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      setTimeout(() => {
        chatMessagesRef.current.scrollTo({
          top: chatMessagesRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 50); // Ensure React DOM updates before scrolling
    }
  };

  useEffect(() => {
    scrollToBottom(); // Scroll on messages update
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      setMessages((prev) => [...prev, { sender: "user", message: input }]);
      setInput("");

      // Simulated assistant response
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { sender: "assistant", message: "Let me check on that for you!" },
        ]);
      }, 1000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="chat-modal-overlay" role="dialog">
      <div className="chat-modal" role="document">
        <div className="chat-header">
          <h3 style={{ textAlign: "center", flex: 1 }}>Chat Assistant</h3>
          <button
            onClick={onClose}
            aria-label="Close chat"
            className="close-icon"
          >
            &times;
          </button>
        </div>
        <div
          className="chat-messages"
          ref={chatMessagesRef} // Attach the ref for scrolling
        >
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-message ${msg.sender}`}>
              {msg.message}
            </div>
          ))}
        </div>
        <div className="chat-input-container">
          <input
            type="text"
            placeholder="Type your message here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            aria-label="Type your message"
          />
          <button onClick={handleSend} aria-label="Send message">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupportChatModal;
