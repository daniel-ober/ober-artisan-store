export const fetchProducts = async () => {
  try {
    const response = await fetch('http://localhost:4949/api/products');
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
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ products, userId }),
  });

  if (!response.ok) {
    throw new Error('Failed to create checkout session');
  }

  const session = await response.json();
  return session.url;
};

// Function to create a product in Stripe and return the product and price IDs
export const createStripeProduct = async (productData) => {
  const response = await fetch('/api/create-product', {
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
};

// Function to send chat email
export const sendChatEmail = async (chatDetails) => {
  const response = await fetch('/api/send-chat-email', {
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
};

// Function for chat API interaction
export const sendChatMessage = async (messages) => {
  const response = await fetch('/api/chat', {
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
};
