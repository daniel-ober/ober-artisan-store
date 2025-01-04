import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { getDocs, collection } from 'firebase/firestore';
import { db } from './firebaseConfig';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import Home from './components/Home';
import Products from './components/Products';
import ProductDetail from './components/ProductDetail';  {/* Add ProductDetail import */}
import PreOrderPage from './components/PreOrderPage';
import About from './components/About';
import Contact from './components/Contact';
import Cart from './components/Cart';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import Checkout from './components/Checkout';
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
import PathSelection from './components/PathSelection'; // New component for path selection
import CustomDrumBuilder from './components/CustomDrumBuilder'; // Custom Drum Builder
import SoundProfileRecommendations from './components/SoundProfileRecommendations'; // New component for Sound Profile Recommendations
import './App.css';

function App() {
  const { user, isAdmin } = useAuth();
  const [navbarLinks, setNavbarLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPath, setSelectedPath] = useState(null); // State to store the selected path
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

  // Fetch Navbar Links from Firestore
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
          
          // Fetch user's current IP address
          const ipResponse = await fetch('https://api.ipify.org?format=json');
          const { ip } = await ipResponse.json();
          console.log(`Current IP: ${ip}`);
          console.log(`Allowed Admin IPs: ${adminIPs.join(', ')}`);

          const isAllowedIP = adminIPs.includes(ip);

          if (isAllowedIP) {
            console.log('Access granted via IP address.');
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
            console.log('Access granted via device token.');
            navigate('/admin-signin');
            return;
          }

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
          <Route path="/" element={<Home />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/about" element={isLinkEnabled('about') ? <About /> : <NotFound />} />
          <Route path="/cart" element={isLinkEnabled('cart') ? <Cart /> : <NotFound />} />
          <Route path="/contact" element={isLinkEnabled('contact') ? <Contact /> : <NotFound />} />
          <Route path="/custom-drum-builder" element={<CustomDrumBuilder />} />

          {/* Main Path Selection */}
          <Route path="/sound-profile-tool" element={<PathSelection setSelectedPath={setSelectedPath} />} />

          {/* Conditionally Render the Selected Path */}
          <Route path="/custom-drum-builder" element={selectedPath === 'builder' ? <CustomDrumBuilder /> : <Navigate to="/" />} />
          <Route path="/sound-profile-recommendations" element={selectedPath === 'recommendations' ? <SoundProfileRecommendations /> : <Navigate to="/" />} />

          {/* General Routes for All Users */}
          <Route path="/gallery" element={isLinkEnabled('gallery') ? <Gallery /> : <NotFound />} />
          <Route path="/custom-shop" element={isLinkEnabled('custom-shop') ? <CustomShop /> : <NotFound />} />
          <Route path="/products" element={isLinkEnabled('products') ? <Products /> : <NotFound />} />

          {/* Product Detail Page Route */}
          <Route path="/products/:productId" element={<ProductDetail />} /> {/* New Route for Product Detail */}

          <Route path="/pre-order" element={isLinkEnabled('pre-order') ? <PreOrderPage /> : <NotFound />} />

          {/* Account Page for Signed-In Users */}
          <Route path="/account" element={<PrivateRoute element={<AccountPage />} />} />

          {/* Admin Route */}
          <Route path="/admin" element={<PrivateRoute element={<AdminDashboard />} adminOnly />} />

          {/* Sign-In and Register */}
          <Route
            path="/signin"
            element={isLinkEnabled('signin') ? (
              user ? <Navigate to="/account" /> : <SignInEmail />
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
