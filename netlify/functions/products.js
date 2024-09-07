const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    const response = await fetch('https://your-backend-api-url/api/products');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Server Error' }),
    };
  }
};
