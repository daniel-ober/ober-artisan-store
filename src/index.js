// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './redux/store';
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './ErrorBoundary';
import './global.css'; // Import global styles

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <Provider store={store}>
    <Router>
      <AuthProvider>
        <CartProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </CartProvider>
      </AuthProvider>
    </Router>
  </Provider>
);