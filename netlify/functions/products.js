const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    const response = await fetch('http://localhost:4949/api/products'); // Update this URL
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
