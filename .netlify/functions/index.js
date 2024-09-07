// netlify/functions/index.js
const { json } = require('@netlify/functions');

exports.handler = async () => {
  return json({ message: 'Hello from Netlify Functions!' });
};
