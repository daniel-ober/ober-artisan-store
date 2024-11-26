import React, { useState } from 'react';
import './FAQSearchModal.css';
import ChatSupportWindow from './ChatSupportWindow';

const FAQSearchModal = ({ faqs, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFAQ, setSelectedFAQ] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);

  const filteredFAQs = faqs.filter((faq) =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChatOpen = () => {
    setIsChatOpen(true);
    setSelectedFAQ(null);
  };

  const handleChatClose = () => {
    setIsChatOpen(false);
  };

  const handleBackToFAQs = () => {
    setSelectedFAQ(null);
    setIsChatOpen(false);
  };

  const sendMessage = async (messageContent) => {
    const content = messageContent?.trim();
    if (!content) return;

    const userMessage = { role: 'user', content, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch('http://localhost:4949/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'system', content: '...', }, ...messages, userMessage] }),
      });

      if (!response.ok) throw new Error('Chat assistant API call failed.');

      const data = await response.json();
      const assistantMessage = { role: 'assistant', content: data?.content || 'No response.', timestamp: new Date().toISOString() };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I couldn’t process your request.' },
      ]);
    }
  };

  return (
    <div className="faq-modal-overlay" onClick={onClose}>
      <div
        className="faq-modal"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <div className="faq-header">
          <h2>{isChatOpen ? 'Need more help?' : 'How can we help you?'}</h2>
          <button onClick={onClose} className="close-button">
            X
          </button>
        </div>

        {isChatOpen ? (
          <ChatSupportWindow
            messages={messages}
            sendMessage={sendMessage}
            onClose={handleChatClose}
            onBack={handleBackToFAQs}
          />
        ) : selectedFAQ ? (
          <div className="faq-answer">
            <h3>{selectedFAQ.question}</h3>
            <p>{selectedFAQ.answer}</p>
            <div className="feedback-buttons">
              <button onClick={handleChatOpen}>Still need help? Chat with us</button>
              <button onClick={handleBackToFAQs}>Back to FAQs</button>
            </div>
          </div>
        ) : (
          <>
            <input
              type="text"
              className="faq-search"
              placeholder="Search for answers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <ul className="faq-list">
              {filteredFAQs.map((faq, index) => (
                <li
                  key={index}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedFAQ(faq)}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedFAQ(faq)}
                >
                  {faq.question}
                </li>
              ))}
            </ul>
            {filteredFAQs.length === 0 && (
              <div className="no-results">
                <p>No answers found. Still need help?</p>
                <button onClick={handleChatOpen}>Chat with us</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FAQSearchModal;
