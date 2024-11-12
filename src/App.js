// App.js
import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Home from './components/Home';
import Products from './components/Products';
import About from './components/About';
import Contact from './components/Contact';
import Cart from './components/Cart';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import Checkout from './components/Checkout';
import ProductDetail from './components/ProductDetail';
import AccountPage from './components/AccountPage';
import CheckoutSummary from './components/CheckoutSummary';
import AdminDashboard from './components/AdminDashboard';
import ManageUsers from './components/ManageUsers';
import ManageProducts from './components/ManageProducts';
import ManageOrders from './components/ManageOrders';
import SiteSettings from './components/SiteSettings';
import SignInEmail from './components/SignInEmail';
import CustomShopAssistant from './components/CustomShopAssistant';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import ReturnPolicy from './components/ReturnPolicy';
import Footer from './components/Footer';
import NotFound from './components/NotFound';
import PrivateRoute from './components/PrivateRoute';
import { useAuth } from './context/AuthContext';
import ChatSupportButton from './components/ChatSupportButton';

function App() {
  const { user, handleSignOut } = useAuth();
  const [currentTab, setCurrentTab] = useState('Home');
  const [darkMode, setDarkMode] = useState(false);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const currentMode = darkMode;
    setDarkMode(!currentMode);
    document.body.classList.toggle('dark', !currentMode);
    document.body.classList.toggle('light', currentMode);
    console.log('Toggling dark mode...');
    console.log('Dark mode is now:', !currentMode);
  };

  return (
    <div className="app-container">
      <NavBar 
        isAuthenticated={!!user} 
        onSignOut={handleSignOut} 
        onTabChange={(tab) => setCurrentTab(tab)} 
      />
      <button className="theme-toggle" onClick={toggleDarkMode}>
        Switch to {darkMode ? 'Light' : 'Dark'} Mode
      </button>
      <div className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/custom-shop-assistant" element={<CustomShopAssistant />} />
          <Route path="/signin" element={<SignInEmail />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/checkout-summary" element={<CheckoutSummary />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/return-policy" element={<ReturnPolicy />} />
          <Route path="*" element={<NotFound />} />
          {/* Private routes */}
          <Route path="/checkout" element={<PrivateRoute element={<Checkout />} />} />
          <Route path="/account" element={<PrivateRoute element={<AccountPage />} />} />
          <Route path="/admin" element={<PrivateRoute element={<AdminDashboard />} adminOnly />} />
          <Route path="/admin/users" element={<PrivateRoute element={<ManageUsers />} adminOnly />} />
          <Route path="/admin/products" element={<PrivateRoute element={<ManageProducts />} adminOnly />} />
          <Route path="/admin/orders" element={<PrivateRoute element={<ManageOrders />} adminOnly />} />
          <Route path="/admin/settings" element={<PrivateRoute element={<SiteSettings />} adminOnly />} />
        </Routes>
      </div>
      <ChatSupportButton currentTab={currentTab} />
      <Footer />
    </div>
  );
}

export default App;
