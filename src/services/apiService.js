// src/services/apiService.js
const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:4949/api';

// Fetch all products
export const fetchProducts = async () => {
  try {
    const response = await fetch(`${apiUrl}/products`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Function to create checkout session
export const createCheckoutSession = async (products, userId) => {
  try {
    const response = await fetch(`${apiUrl}/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ products, userId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create checkout session: ${errorText}`);
    }

    const session = await response.json();
    return session.url;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

// Function to create a product in Stripe and return the product and price IDs
export const createStripeProduct = async (productData) => {
  try {
    const response = await fetch(`${apiUrl}/products/create-stripe-product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error: ${errorData.error}`);
    }

    const product = await response.json();
    return product;
  } catch (error) {
    console.error('Error in createStripeProduct:', error);
    throw error;
  }
};

// Function to send chat email
export const sendChatEmail = async (chatDetails) => {
  try {
    const response = await fetch(`${apiUrl}/send-chat-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatDetails),
    });

    if (!response.ok) {
      throw new Error('Failed to send chat email');
    }

    return await response.text();
  } catch (error) {
    console.error('Error sending chat email:', error);
    throw error;
  }
};

// Function for chat API interaction
export const sendChatMessage = async (messages) => {
  try {
    const response = await fetch(`${apiUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'gpt-3.5-turbo', messages }),
    });

    if (!response.ok) {
      throw new Error('Failed to communicate with OpenAI');
    }

    return await response.json();
  } catch (error) {
    console.error('Error communicating with OpenAI:', error);
    throw error;
  }
};
