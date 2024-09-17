// src/App.js

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Home from './components/Home';
import Products from './components/Products';
import About from './components/About';
import Contact from './components/Contact';
import Cart from './components/Cart';
import SignInEmail from './components/SignInEmail';
import Checkout from './components/Checkout';
import ProductDetail from './components/ProductDetail';
import AccountPage from './components/AccountPage';
import AdminPage from './components/AdminPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import ReturnPolicy from './components/ReturnPolicy';
import Footer from './components/Footer';
import NotFound from './components/NotFound';
import NotAuthorized from './components/NotAuthorized'; // Import NotAuthorized
import PrivateRoute from './components/PrivateRoute';
import { useAuth } from './context/AuthContext'; // Import useAuth

function App() {
  const { user, handleSignOut } = useAuth();

  return (
    <div className="app-container">
      <NavBar isAuthenticated={!!user} onSignOut={handleSignOut} />
      <div className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/signin" element={<SignInEmail />} />
          <Route path="/checkout" element={<PrivateRoute element={<Checkout />} />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/account" element={<PrivateRoute element={<AccountPage />} />} />
          <Route path="/admin" element={<PrivateRoute element={<AdminPage />} adminOnly />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/return-policy" element={<ReturnPolicy />} />
          <Route path="/not-authorized" element={<NotAuthorized />} /> {/* Add NotAuthorized route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

export default App;
