import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb } from '@fortawesome/free-solid-svg-icons'; // Use lightbulb icon
import FAQSearchModal from './FAQSearchModal'; // Ensure default import
import ChatSupportWindow from './ChatSupportWindow'; // Ensure default import
import './ChatSupportButton.css';
import preloadedQuestions from '../data/preloadedquestions'; // Import FAQs

const ChatSupportButton = React.memo(() => {
  const [faqOpen, setFaqOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);

  const openFAQ = () => setFaqOpen(true);
  const closeFAQ = () => setFaqOpen(false);
  const openChat = () => {
    setFaqOpen(false);
    setChatOpen(true);
  };
  const closeChat = () => setChatOpen(false);

  // Transform preloadedQuestions into an array of FAQs
  const faqArray = Object.entries(preloadedQuestions).flatMap(([section, questions]) =>
    questions.map((faq) => ({
      ...faq,
      section, // Include the section (e.g., "home", "about") for context if needed
    }))
  );

  const sendMessage = async (messageContent) => {
    const content = messageContent?.trim();
    if (!content) {
      console.error('Cannot send an empty message.');
      return;
    }

    const userMessage = { role: 'user', content, timestamp: new Date().toISOString() };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    try {
      const response = await fetch('http://localhost:4949/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: '...', },
            ...messages,
            userMessage,
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('Error: Chat assistant API call failed.');
      }

      const data = await response.json();
      const assistantMessage = {
        role: 'assistant',
        content: data?.content || 'No response.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error.message);
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: 'assistant', content: 'Sorry, I couldn’t process your request.' },
      ]);
    }
  };

  return (
    <>
      <button onClick={openFAQ} className="faq-button enhanced">
        <FontAwesomeIcon icon={faLightbulb} />
      </button>

      {faqOpen && (
        <FAQSearchModal faqs={faqArray} onChatRequest={openChat} onClose={closeFAQ} />
      )}

      {chatOpen && (
        <ChatSupportWindow messages={messages} sendMessage={sendMessage} onClose={closeChat} />
      )}
    </>
  );
});

ChatSupportButton.displayName = 'ChatSupportButton';
export default ChatSupportButton;
