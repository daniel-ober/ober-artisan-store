import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faTimes, faArrowDown } from "@fortawesome/free-solid-svg-icons";
import "./SupportModal.css";

const SupportModal = ({ onClose, onCategorySelect, selectedCategory }) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const lastMessageRef = useRef(null); // Ref for the last message

  useEffect(() => {
    if (chatOpen && messages.length === 0) {
      setMessages([
        {
          sender: "assistant",
          message:
            "Hi! I'm Oakli, your virtual assistant. I can assist with shipping inquiries, product details, technical support, custom orders, and more. Let me know how I can help!",
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatOpen, messages.length]);
  

  // Scroll to the last message on messages update
  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleScroll = () => {
    const chatContainer = lastMessageRef.current?.parentNode; // Get the parent container of messages
    if (!chatContainer) return;

    const isAtBottom =
      chatContainer.scrollHeight - chatContainer.scrollTop <=
      chatContainer.clientHeight + 10;

    setShowScrollDown(!isAtBottom); // Show scroll-down button if not at bottom
  };

  const categories = [
    { id: "shipping", icon: "🚚", title: "Shipping & Returns" },
    { id: "pricing", icon: "💰", title: "Pricing & Payments" },
    { id: "technical", icon: "💻", title: "Technical Support" },
    { id: "custom", icon: "🛠️", title: "Custom Orders" },
    { id: "product", icon: "🥁", title: "Product Info" },
    { id: "order-status", icon: "📦", title: "Order Status" },
    { id: "about", icon: "📖", title: "About Us" },
    { id: "other", icon: "❓", title: "Other Topics" },
  ];

  const faqData = {
    shipping: [
      { question: "How long does shipping take?", answer: "Shipping typically takes 5-7 business days." },
      { question: "Do you offer international shipping?", answer: "Yes, we offer international shipping. Rates are calculated during checkout." },
      { question: "Can I track my order?", answer: "Yes, once your order is shipped, you will receive a tracking number." },
    ],
    pricing: [
      { question: "How much does shipping cost?", answer: "Shipping costs depend on your location. It will be calculated at checkout." },
      { question: "Do you offer discounts?", answer: "Yes, we offer discounts on bulk orders. Contact us for more information." },
      { question: "Can I use multiple discount codes?", answer: "Unfortunately, only one discount code can be used per order." },
    ],
    technical: [
      { question: "My drum is malfunctioning, what should I do?", answer: "Please contact our support team with the issue, and we will guide you through the repair process." },
      { question: "Do you offer technical support for custom orders?", answer: "Yes, we provide full support for all custom orders. Reach out to us directly." },
      { question: "What materials are used in your drums?", answer: "We use high-quality wood, hardware, and skins sourced from trusted suppliers." },
    ],
    custom: [
      { question: "Can I customize my drum?", answer: "Yes, we offer customization on size, material, and design. Contact us to get started." },
      { question: "What’s the lead time for custom orders?", answer: "Custom orders usually take between 4-6 weeks depending on complexity." },
      { question: "Do you offer custom drum sets?", answer: "Yes, we can create custom drum sets tailored to your preferences." },
    ],
    product: [
      { question: "What is the warranty on your drums?", answer: "We offer a 1-year warranty on all our drums against defects in materials or craftsmanship." },
      { question: "How can I clean my drum?", answer: "Use a damp cloth to wipe down your drum. Avoid harsh chemicals that could damage the surface." },
      { question: "Can I order spare parts?", answer: "Yes, we offer spare parts for all our drums. Please contact us for more information." },
    ],
    orderStatus: [
      { question: "Where is my order?", answer: "You can track your order using the tracking number sent to your email." },
      { question: "Can I change my shipping address after placing an order?", answer: "We can update the address if the order has not been shipped. Please contact us immediately." },
      { question: "How do I know if my order has been shipped?", answer: "You will receive a shipping confirmation email with tracking details once your order ships." },
    ],
    about: [
      { question: "What is Oakli?", answer: "Oakli is a company dedicated to crafting high-quality handcrafted drums." },
      { question: "Where is Oakli located?", answer: "Our workshop is based in Nashville, Tennessee." },
      { question: "How can I contact Oakli?", answer: "You can reach us via email at support@oakli.com or through our contact form on the website." },
    ],
    other: [
      { question: "Do you have a physical store?", answer: "We currently operate only online, but we may open a physical store in the future." },
      { question: "How do I become a distributor for Oakli drums?", answer: "Please contact us through our business inquiry form for distributor opportunities." },
      { question: "Do you offer gift cards?", answer: "Yes, we offer gift cards in various denominations. Check our shop for more details." },
    ],
  };

  const handleSendMessage = async () => {
    if (input.trim()) {
      setMessages((prev) => [...prev, { sender: "user", message: input }]);
      setInput("");
      setTimeout(() => setIsTyping(true), 500);

      try {
        const response = await fetch("http://localhost:4949/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              ...messages.map((msg) => ({
                role: msg.sender === "user" ? "user" : "assistant",
                content: msg.message,
              })),
              { role: "user", content: input },
            ],
          }),
        });

        if (!response.ok) {
          throw new Error("Error fetching assistant response");
        }

        const data = await response.json();
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            { sender: "assistant", message: data.content },
          ]);
          setIsTyping(false);
        }, Math.min(data.content.length * 50, 3000));
      } catch (error) {
        console.error(error);
        setMessages((prev) => [
          ...prev,
          { sender: "assistant", message: "Sorry, I could not process your request. Please try again later." },
        ]);
        setIsTyping(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSendMessage();
  };

  const handleChatClose = () => {
    setChatOpen(false);
    onCategorySelect(null);
  };

  const handleScrollDownClick = () => {
    lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    setShowScrollDown(false);
  };

  return (
    <div className="support-modal-overlay">
      <div className="support-modal">
        <div className="support-header">
          {(selectedCategory || chatOpen) && (
            <FontAwesomeIcon
              icon={faArrowLeft}
              onClick={() => (chatOpen ? handleChatClose() : onCategorySelect(null))}
              className="back-icon"
            />
          )}
          <h2 style={{ textAlign: "center", flex: 1 }}>Chat Assistant</h2>
          <FontAwesomeIcon icon={faTimes} onClick={onClose} className="close-icon" />
        </div>

        <div className="support-content">
          {!selectedCategory && !chatOpen && (
            <div className="faq-categories">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className="faq-category polished-category"
                  onClick={() => onCategorySelect(category.id)}
                >
                  {category.icon} {category.title}
                </button>
              ))}
            </div>
          )}

          {selectedCategory && !chatOpen && (
            <div>
              <ul className="faq-list">
                {faqData[selectedCategory]?.map((faq, idx) => (
                  <li key={idx}>
                    <h3>{faq.question}</h3>
                    <p>{faq.answer}</p>
                  </li>
                ))}
              </ul>
              <div className="support-footer polished-footer">
                <button onClick={() => onCategorySelect(null)} className="polished-back-button">
                  Back to Main FAQ
                </button>
                <button onClick={() => setChatOpen(true)} className="polished-help-button">
                  I need more help
                </button>
              </div>
            </div>
          )}

          {chatOpen && (
            <div className="chat-container" onScroll={handleScroll}>
              <div className="chat-messages">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`chat-message ${msg.sender}`}
                    ref={idx === messages.length - 1 ? lastMessageRef : null} // Assign ref to the last message
                  >
                    {msg.message}
                  </div>
                ))}
                {isTyping && (
                  <div className="chat-message assistant">Oakli is typing...</div>
                )}
              </div>
              {showScrollDown && (
                <button className="scroll-down-button" onClick={handleScrollDownClick}>
                  <FontAwesomeIcon icon={faArrowDown} />
                </button>
              )}
              <div className="chat-input-container">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                />
                <button onClick={handleSendMessage}>Send</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportModal;
