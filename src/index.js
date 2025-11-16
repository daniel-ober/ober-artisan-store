// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import store from './redux/store.js';
import App from './App.js';
import { CartProvider } from './context/CartContext.js';
import { AuthProvider } from './context/AuthContext.js';
import { ImpersonationProvider } from './context/ImpersonationContext.js';
import { DarkModeProvider } from './context/DarkModeContext.js';
import ErrorBoundary from './ErrorBoundary.js';

import './global.css';

// Create a simple router that renders <App /> for all paths.
// Opt into v7 behaviors to remove warnings.
const router = createBrowserRouter(
  [
    {
      path: '/*',
      element: (
        <Provider store={store}>
          <AuthProvider>
            <CartProvider>
              <DarkModeProvider>
                <ImpersonationProvider>
                  <ErrorBoundary>
                    <App />
                  </ErrorBoundary>
                </ImpersonationProvider>
              </DarkModeProvider>
            </CartProvider>
          </AuthProvider>
        </Provider>
      ),
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

const container = document.getElementById('root');
const root = createRoot(container);

root.render(<RouterProvider router={router} />);