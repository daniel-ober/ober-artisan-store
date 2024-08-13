import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthenticationProvider } from './AuthenticationContext';
import { BrowserRouter as Router } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <AuthenticationProvider>
      <Router>
        <App />
      </Router>
    </AuthenticationProvider>
);
