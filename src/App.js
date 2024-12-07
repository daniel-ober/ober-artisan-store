import React, { useState, useEffect, useMemo } from 'react';
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
import NotFound from './components/NotFound';
import PrivateRoute from './components/PrivateRoute';
import { useAuth } from './context/AuthContext';
import SupportButton from './components/SupportButton';
import SupportModal from './components/SupportModal';
import SupportChatModal from './components/SupportChatModal';
import AdminSignin from './components/AdminSignin';
import './App.css';

function App() {
  // eslint-disable-next-line no-unused-vars
  const { user } = useAuth(); // 'user' is defined but currently not used
  const [navbarLinks, setNavbarLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Map routes to tab names
  const routeToTabMap = useMemo(
    () => ({
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
    }),
    []
  );

  useEffect(() => {
    const activeTab = routeToTabMap[location.pathname] || 'NotFound';
    console.log(`Current Tab changed to: ${activeTab}`);
  }, [location.pathname, routeToTabMap]);

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
    const adminIPs = process.env.REACT_APP_ADMIN_IPS?.split(',') || []; // Split the IPs into an array
  
    const handleKeyPress = async (event) => {
      if (event.ctrlKey && event.altKey && event.key === 'ß') {
        try {
          console.log('Shortcut triggered. Checking access...');
  
          // Fetch user's current IP address
          const ipResponse = await fetch('https://api.ipify.org?format=json');
          const { ip } = await ipResponse.json();
          console.log(`Current IP: ${ip}`);
          console.log(`Allowed Admin IPs: ${adminIPs.join(', ')}`);
  
          // Check if the current IP matches any of the allowed IPs
          const isAllowedIP = adminIPs.includes(ip);
  
          if (isAllowedIP) {
            console.log('Access granted via IP address.');
            navigate('/admin-signin');
            return;
          }
  
          // Get stored token from localStorage
          const storedToken = localStorage.getItem('admin-token');
          console.log(`Stored Token: ${storedToken}`);
  
          // Check device token (already implemented logic for device tokens)
          const macbookToken = process.env.REACT_APP_ADMIN_MACBOOK_TOKEN;
          const iphoneToken = process.env.REACT_APP_ADMIN_IPHONE_TOKEN;
          const ipadToken = process.env.REACT_APP_ADMIN_IPAD_TOKEN;
  
          const isAllowedToken =
            storedToken === macbookToken ||
            storedToken === iphoneToken ||
            storedToken === ipadToken;
  
          if (isAllowedToken) {
            console.log('Access granted via device token.');
            navigate('/admin-signin');
            return;
          }
  
          // If neither matches
          console.warn('Access Denied: Unauthorized device or IP.');
          alert('Access Denied: Unauthorized device or IP.');
        } catch (error) {
          console.error('Error verifying admin access:', error);
          alert('An error occurred while verifying access. Please try again.');
        }
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
          <Route path="/signin" element={isLinkEnabled('signin') ? <SignInEmail /> : <Navigate to="/" replace />} />
          <Route path="/register" element={isLinkEnabled('signin') ? <Register /> : <Navigate to="/" replace />} />
          <Route path="/forgot-password" element={isLinkEnabled('signin') ? <ForgotPassword /> : <Navigate to="/" replace />} />
          <Route path="/admin-signin" element={<AdminSignin />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/return-policy" element={<ReturnPolicy />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/checkout-summary" element={isLinkEnabled('checkout-summary') ? <CheckoutSummary /> : <NotFound />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/checkout" element={<PrivateRoute element={<Checkout />} />} />
          <Route path="/account" element={<PrivateRoute element={<AccountPage />} />} />
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
            setChatOpen(false);
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
