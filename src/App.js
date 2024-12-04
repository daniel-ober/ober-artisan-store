import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { getDocs, collection } from 'firebase/firestore';
import { db } from './firebaseConfig';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import Home from './components/Home';
import Products from './components/Products';
import PreOrderPage from './components/PreOrderPage';
import About from './components/About';
import Contact from './components/Contact';
import Cart from './components/Cart';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import Checkout from './components/Checkout';
import ProductDetail from './components/ProductDetail';
import AccountPage from './components/AccountPage';
import CheckoutSummary from './components/CheckoutSummary';
import Gallery from './components/Gallery';
import AdminDashboard from './components/AdminDashboard';
import ManageUsers from './components/ManageUsers';
import ManageProducts from './components/ManageProducts';
import ManageOrders from './components/ManageOrders';
import SiteSettings from './components/SiteSettings';
import SignInEmail from './components/SignInEmail';
import CustomShop from './components/CustomShop';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import ReturnPolicy from './components/ReturnPolicy';
import MaintenancePage from './components/MaintenancePage';
import NotFound from './components/NotFound';
import PrivateRoute from './components/PrivateRoute';
import { useAuth } from './context/AuthContext';
import SupportButton from './components/SupportButton';
import SupportModal from './components/SupportModal'; // FAQ Modal
import SupportChatModal from './components/SupportChatModal'; // Chat Modal
import AdminSignin from './components/AdminSignin';
import './App.css';

function App() {
  const { user } = useAuth();
  const [navbarLinks, setNavbarLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('Home'); // Track the current tab
  const [supportModalOpen, setSupportModalOpen] = useState(false); // Control Support modal state
  const [chatOpen, setChatOpen] = useState(false); // Control chat modal state
  const [selectedCategory, setSelectedCategory] = useState(null); // Track selected category
  const navigate = useNavigate();
  const location = useLocation();

  // Map routes to tab names
  const routeToTabMap = {
    '/': 'Home',
    '/about': 'About',
    '/cart': 'Cart',
    '/contact': 'Contact',
    '/gallery': 'Gallery',
    '/pre-order': 'PreOrder',
    '/custom-shop': 'CustomShop',
    '/products': 'Products',
    '/signin': 'SignIn',
    '/register': 'Register',
    '/forgot-password': 'ForgotPassword',
    '/checkout': 'Checkout',
    '/account': 'Account',
    '/admin': 'Admin',
  };

  // Update the current tab based on the route
  useEffect(() => {
    const activeTab = routeToTabMap[location.pathname] || 'NotFound';
    setCurrentTab(activeTab);
    console.log(`Current Tab changed to: ${activeTab}`);
  }, [location]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const navbarLinksCollection = collection(db, 'settings', 'site', 'navbarLinks');
        const navbarLinksSnapshot = await getDocs(navbarLinksCollection);
        const navbarLinks = navbarLinksSnapshot.docs.map((doc) => doc.data());
        setNavbarLinks(navbarLinks || []);
      } catch (error) {
        console.error('Error fetching site settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const adminIP = process.env.REACT_APP_ADMIN_IP;

    const handleKeyPress = (event) => {
      if (event.ctrlKey && event.altKey && event.key === 'ß') {
        fetch('https://api.ipify.org?format=json')
          .then((res) => res.json())
          .then((data) => {
            if (data.ip === adminIP) {
              console.log('Admin keyboard shortcut triggered. Navigating to Admin Sign In page.');
              navigate('/admin-signin');
            } else {
              console.warn('Unauthorized IP detected. Access denied.');
            }
          })
          .catch((error) => console.error('Error fetching IP address:', error));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [navigate]);

  const isLinkEnabled = (linkName) => {
    const link = navbarLinks.find((l) => l.name?.toLowerCase() === linkName.toLowerCase());
    return link?.enabled || false;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="app-container">
      <NavBar navbarLinks={navbarLinks} />
      <div className="app-content">
        <Routes>
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/" element={<Home />} />
          <Route path="/about" element={isLinkEnabled('about') ? <About /> : <NotFound />} />
          <Route path="/cart" element={isLinkEnabled('cart') ? <Cart /> : <NotFound />} />
          <Route path="/contact" element={isLinkEnabled('contact') ? <Contact /> : <NotFound />} />
          <Route path="/gallery" element={isLinkEnabled('gallery') ? <Gallery /> : <NotFound />} />
          <Route path="/pre-order" element={isLinkEnabled('pre-order') ? <PreOrderPage /> : <NotFound />} />
          <Route path="/custom-shop" element={isLinkEnabled('custom-shop') ? <CustomShop /> : <NotFound />} />
          <Route path="/products" element={isLinkEnabled('products') ? <Products /> : <NotFound />} />
          
          {/* Authentication Routes */}
          <Route
            path="/signin"
            element={isLinkEnabled('signin') ? <SignInEmail /> : <Navigate to="/" replace />}
          />
          <Route
            path="/register"
            element={isLinkEnabled('signin') ? <Register /> : <Navigate to="/" replace />}
          />
          <Route
            path="/forgot-password"
            element={isLinkEnabled('signin') ? <ForgotPassword /> : <Navigate to="/" replace />}
          />

          {/* Admin Signin Route */}
          <Route path="/admin-signin" element={<AdminSignin />} />

          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/return-policy" element={<ReturnPolicy />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/checkout-summary" element={isLinkEnabled('checkout-summary') ? <CheckoutSummary /> : <NotFound />} />
          <Route path="*" element={<NotFound />} />

          {/* Private Routes */}
          <Route path="/checkout" element={<PrivateRoute element={<Checkout />} />} />
          <Route path="/account" element={<PrivateRoute element={<AccountPage />} />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<PrivateRoute element={<AdminDashboard />} adminOnly />} />
          <Route path="/admin/users" element={<PrivateRoute element={<ManageUsers />} adminOnly />} />
          <Route path="/admin/products" element={<PrivateRoute element={<ManageProducts />} adminOnly />} />
          <Route path="/admin/orders" element={<PrivateRoute element={<ManageOrders />} adminOnly />} />
          <Route path="/admin/settings" element={<PrivateRoute element={<SiteSettings />} adminOnly />} />
        </Routes>
      </div>

      {/* Support Button */}
      <SupportButton onClick={() => setSupportModalOpen(true)} />

      {/* Support Modal */}
      {supportModalOpen && (
        <SupportModal
          onClose={() => setSupportModalOpen(false)}
          onCategorySelect={(category) => {
            setSelectedCategory(category);
            setChatOpen(false); // Reset chat state when selecting a category
          }}
          selectedCategory={selectedCategory}
          onChatOpen={() => setChatOpen(true)}
        />
      )}

      {/* Chat Modal */}
      {chatOpen && <SupportChatModal onClose={() => setChatOpen(false)} />}
      
      <Footer navbarLinks={navbarLinks} />
    </div>
  );
}

export default App;
