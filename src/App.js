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
  const { user } = useAuth();
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

  // Admin Sign-In Key Command Logic
  useEffect(() => {
    const adminIPs = process.env.REACT_APP_ADMIN_IP?.split(',') || [];

    const handleKeyPress = async (event) => {
      if (event.ctrlKey && event.altKey && event.key === 'ß') {
        try {
          console.log('Shortcut triggered. Checking access...');
          
          const ipResponse = await fetch('https://api.ipify.org?format=json');
          const { ip } = await ipResponse.json();
          const isAllowedIP = adminIPs.includes(ip);

          if (isAllowedIP) {
            navigate('/admin-signin');
            return;
          }

          const storedToken = localStorage.getItem('admin-token');
          const macbookToken = process.env.REACT_APP_ADMIN_MACBOOK_TOKEN;
          const iphoneToken = process.env.REACT_APP_ADMIN_IPHONE_TOKEN;
          const ipadToken = process.env.REACT_APP_ADMIN_IPAD_TOKEN;

          const isAllowedToken =
            storedToken === macbookToken ||
            storedToken === iphoneToken ||
            storedToken === ipadToken;

          if (isAllowedToken) {
            navigate('/admin-signin');
            return;
          }

          alert('Access Denied: Unauthorized device or IP.');
        } catch (error) {
          console.error('Error verifying admin access:', error);
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
          <Route path="/" element={<Home />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/about" element={isLinkEnabled('about') ? <About /> : <NotFound />} />
          <Route path="/cart" element={isLinkEnabled('cart') ? <Cart /> : <NotFound />} />
          <Route path="/contact" element={isLinkEnabled('contact') ? <Contact /> : <NotFound />} />
          
          {/* Define Routes for Gallery, Custom Shop, Products, and Pre-Order */}
          <Route path="/gallery" element={isLinkEnabled('gallery') ? <Gallery /> : <NotFound />} />
          <Route path="/custom-shop" element={isLinkEnabled('custom-shop') ? <CustomShop /> : <NotFound />} />
          <Route path="/products" element={isLinkEnabled('products') ? <Products /> : <NotFound />} />
          <Route path="/pre-order" element={isLinkEnabled('pre-order') ? <PreOrderPage /> : <NotFound />} />

          <Route
            path="/signin"
            element={isLinkEnabled('signin') ? (
              user ? <Navigate to="/account" /> : <SignInEmail />
            ) : (
              <Navigate to="/" replace />
            )}
          />
          <Route
            path="/register"
            element={isLinkEnabled('signin') ? (
              user ? <Navigate to="/account" /> : <Register />
            ) : (
              <Navigate to="/" replace />
            )}
          />

          <Route path="/admin-signin" element={<AdminSignin />} />
        </Routes>
      </div>
      <Footer navbarLinks={navbarLinks} />
    </div>
  );
}

export default App;