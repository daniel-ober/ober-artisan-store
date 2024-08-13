// index.js
import React from 'react';
import ReactDOM from 'react-dom/client'; // Use 'react-dom/client' in React 18
import App from './App';
import { BrowserRouter } from 'react-router-dom';

// Create a root using createRoot
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render your app using the new root
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
