// src/index.js

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './redux/store'; // Ensure the path is correct
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

const container = document.getElementById('root');
const root = createRoot(container);  // Using createRoot for React 18

root.render(
  <Provider store={store}>
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  </Provider>
);