import axios from 'axios';
import { useState } from 'react';
import './CustomShopHelper.css';

const CustomShopHelper = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { sender: 'user', text: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const filteredMessages = newMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text || ''
      }));

      const response = await axios.post(
        'http://localhost:4949/custom-shop-helper',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: "You are a customer support assistant for Dan Ober Artisan Drums. Your job is to help customers with custom drum inquiries, pricing, and product information."
            },
            ...filteredMessages
          ],
          temperature: 1,
          max_tokens: 2048,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
        }
      );

      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const botMessage = {
          sender: 'bot',
          text: response.data.choices[0]?.message?.content || "No content returned.",
        };

        setMessages([...newMessages, botMessage]);
      } else {
        console.error('Unexpected response structure:', response.data);
        setMessages([...newMessages, { sender: 'bot', text: 'Sorry, I could not understand your request.' }]);
      }
    } catch (error) {
      console.error('Error sending message:', error.message);
      setMessages([...newMessages, { sender: 'bot', text: 'Sorry, there was an error with your request.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-box">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button onClick={handleSendMessage} disabled={loading}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default CustomShopHelper;
