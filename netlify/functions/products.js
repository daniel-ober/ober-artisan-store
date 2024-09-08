const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    const response = await fetch('mongodb+srv://danoberdev:ediPwEKaCCeEdq70@danobercluster.luigg.mongodb.net/?retryWrites=true&w=majority&appName=DanOberCluster'); // Update this URL
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
