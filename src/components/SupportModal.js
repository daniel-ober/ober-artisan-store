import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faTimes } from '@fortawesome/free-solid-svg-icons';
import './SupportModal.css';

const SupportModal = ({ onClose, onCategorySelect, selectedCategory }) => {
  const [chatOpen, setChatOpen] = useState(false); // Track if chat modal is open
  const [messages, setMessages] = useState([]); // Track chat messages
  const [input, setInput] = useState(''); // Track input field value

  // Define categories and their corresponding FAQs
  const categories = [
    { id: 'shipping', icon: '🚚', title: 'Shipping & Returns' },
    { id: 'pricing', icon: '💰', title: 'Pricing & Payments' },
    { id: 'technical', icon: '💻', title: 'Technical Support' },
    { id: 'custom', icon: '🛠️', title: 'Custom Orders' },
    { id: 'product', icon: '🥁', title: 'Product Info' },
    { id: 'order-status', icon: '📦', title: 'Order Status' },
    { id: 'about', icon: '📖', title: 'About Us' },
    { id: 'other', icon: '❓', title: 'Other Topics' },
  ];

  // Define the FAQ data for each category
  const faqData = {
    shipping: [
      { question: 'How long does shipping take?', answer: 'Shipping typically takes 5-7 business days.' },
      { question: 'Do you offer international shipping?', answer: 'Yes, we offer international shipping. Rates are calculated during checkout.' },
      { question: 'Can I track my order?', answer: 'Yes, once your order is shipped, you will receive a tracking number.' },
    ],
    pricing: [
      { question: 'How much does shipping cost?', answer: 'Shipping costs depend on your location. It will be calculated at checkout.' },
      { question: 'Do you offer discounts?', answer: 'Yes, we offer discounts on bulk orders. Contact us for more information.' },
      { question: 'Can I use multiple discount codes?', answer: 'Unfortunately, only one discount code can be used per order.' },
    ],
    technical: [
      { question: 'My drum is malfunctioning, what should I do?', answer: 'Please contact our support team with the issue, and we will guide you through the repair process.' },
      { question: 'Do you offer technical support for custom orders?', answer: 'Yes, we provide full support for all custom orders. Reach out to us directly.' },
      { question: 'What materials are used in your drums?', answer: 'We use high-quality wood, hardware, and skins sourced from trusted suppliers.' },
    ],
    custom: [
      { question: 'Can I customize my drum?', answer: 'Yes, we offer customization on size, material, and design. Contact us to get started.' },
      { question: 'What’s the lead time for custom orders?', answer: 'Custom orders usually take between 4-6 weeks depending on complexity.' },
      { question: 'Do you offer custom drum sets?', answer: 'Yes, we can create custom drum sets tailored to your preferences.' },
    ],
    product: [
      { question: 'What is the warranty on your drums?', answer: 'We offer a 1-year warranty on all our drums against defects in materials or craftsmanship.' },
      { question: 'How can I clean my drum?', answer: 'Use a damp cloth to wipe down your drum. Avoid harsh chemicals that could damage the surface.' },
      { question: 'Can I order spare parts?', answer: 'Yes, we offer spare parts for all our drums. Please contact us for more information.' },
    ],
    orderStatus: [
      { question: 'Where is my order?', answer: 'You can track your order using the tracking number sent to your email.' },
      { question: 'Can I change my shipping address after placing an order?', answer: 'We can update the address if the order has not been shipped. Please contact us immediately.' },
      { question: 'How do I know if my order has been shipped?', answer: 'You will receive a shipping confirmation email with tracking details once your order ships.' },
    ],
    about: [
      { question: 'What is Oakli?', answer: 'Oakli is a company dedicated to crafting high-quality handcrafted drums.' },
      { question: 'Where is Oakli located?', answer: 'Our workshop is based in Nashville, Tennessee.' },
      { question: 'How can I contact Oakli?', answer: 'You can reach us via email at support@oakli.com or through our contact form on the website.' },
    ],
    other: [
      { question: 'Do you have a physical store?', answer: 'We currently operate only online, but we may open a physical store in the future.' },
      { question: 'How do I become a distributor for Oakli drums?', answer: 'Please contact us through our business inquiry form for distributor opportunities.' },
      { question: 'Do you offer gift cards?', answer: 'Yes, we offer gift cards in various denominations. Check our shop for more details.' },
    ],
  };

  const handleCategorySelect = (categoryId) => {
    onCategorySelect(categoryId); // Set selected category
  };

  const handleChatOpen = () => {
    setChatOpen(true); // Open the chat modal directly inside the same modal
  };

  const handleSendMessage = async () => {
    if (input.trim()) {
      const updatedMessages = [
        ...messages.map((msg) => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.message })),
        { role: 'user', content: input }
      ];
      setMessages([...messages, { sender: 'user', message: input }]);
      setInput('');
      
      try {
        const response = await fetch('http://localhost:4949/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ messages: updatedMessages }),
        });
        
        if (!response.ok) {
          throw new Error(`Error generating assistant response: ${response.statusText}`);
        }

        const data = await response.json();
        if (data && data.content) {
          setMessages((prevMessages) => [...prevMessages, { sender: 'assistant', message: data.content }]);
        } else {
          throw new Error('Invalid response format from assistant.');
        }
      } catch (error) {
        console.error('Error fetching assistant response:', error);
        setMessages((prevMessages) => [...prevMessages, { sender: 'assistant', message: 'Sorry, I am unable to respond at the moment. Please try again later.' }]);
      }
    }
  };

  return (
    <div className="support-modal-overlay" role="dialog" aria-modal="true">
      <div className="support-modal" role="document">
        <div className="support-modal-header">
          {selectedCategory ? (
            <FontAwesomeIcon
              icon={faArrowLeft}
              className="back-icon"
              onClick={() => onCategorySelect(null)} // Going back to category selection
            />
          ) : null}
          <h2>{selectedCategory ? 'FAQ Details' : 'FAQs'}</h2>
          <FontAwesomeIcon icon={faTimes} className="close-icon" onClick={onClose} />
        </div>
        <div className="support-modal-content">
          {!selectedCategory && !chatOpen && (
            <div className="faq-categories">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className="faq-category"
                  onClick={() => handleCategorySelect(category.id)}
                >
                  {category.icon} {category.title}
                </button>
              ))}
            </div>
          )}

          {selectedCategory && !chatOpen ? (
            <ul className="faq-list">
              {faqData[selectedCategory]?.map((faq, idx) => (
                <li key={idx}>
                  <h3>{faq.question}</h3>
                  <p>{faq.answer}</p>
                </li>
              ))}
            </ul>
          ) : null}

          {chatOpen && (
            <div className="support-chat-modal">
              <h3>Chat Assistant</h3>
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
                  placeholder="Type your message here..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <button onClick={handleSendMessage}>Send</button>
              </div>
              <button onClick={() => setChatOpen(false)}>Close Chat</button>
            </div>
          )}
        </div>

        <div className="support-modal-footer">
          {selectedCategory && !chatOpen && (
            <>
              <button onClick={() => onCategorySelect(null)}>Back to Main FAQ</button>
              <button onClick={handleChatOpen}>I need more help</button>
              <button onClick={onClose}>I found what I need, thanks!</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportModal;
