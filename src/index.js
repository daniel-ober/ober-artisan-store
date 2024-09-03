import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './redux/store'; // Ensure the path is correct
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext'; // Import CartProvider

const container = document.getElementById('root');
const root = createRoot(container);  // Using createRoot for React 18

root.render(
  <Provider store={store}>
    <Router>
      <AuthProvider>
        <CartProvider> {/* Wrap App with CartProvider */}
          <App />
        </CartProvider>
      </AuthProvider>
    </Router>
  </Provider>
);
