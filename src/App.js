import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { getDocs, collection } from 'firebase/firestore';
import { db } from './firebaseConfig';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import Home from './components/Home';
import Products from './components/Products';
import ProductDetail from './components/ProductDetail';
import TestRedirect from './components/TestRedirect';
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
import ArtisanShop from './components/ArtisanShop';
import ManageUsers from './components/ManageUsers';
import ManageProducts from './components/ManageProducts';
import ManageOrders from './components/ManageOrders';
import SiteSettings from './components/SiteSettings';
import SignInEmail from './components/SignInEmail';
import CustomShop from './components/CustomShop/CustomShop';
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
import PathSelection from './components/PathSelection';
import CustomDrumBuilder from './components/CustomDrumBuilder';
import SoundProfileRecommendations from './components/SoundProfileRecommendations';
import UpdateCartsPage from "./components/UpdateCartsPage"; // Import the page
import './App.css';

function App() {
  const { user, isAdmin } = useAuth();
  const [navbarLinks, setNavbarLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPath, setSelectedPath] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Debugging logs
  console.log('🔍 User from AuthContext:', user);
  console.log('🔍 Admin Status in App.js:', isAdmin);

  // Route to tab mapping for tracking navigation changes
  const routeToTabMap = useMemo(() => ({
    '/': 'Home',
    '/about': 'About',
    '/cart': 'Cart',
    '/contact': 'Contact',
    '/gallery': 'Gallery',
    '/pre-order': 'PreOrder',
    '/custom-shop': 'CustomShop',
    '/products': 'Products',
    '/signin': 'SignIn',
    '/terms-of-service': 'TermsOfService',
    '/register': 'Register',
    '/forgot-password': 'ForgotPassword',
    '/checkout': 'Checkout',
    '/account': 'Account',
    '/admin': 'Admin',
  }), []);

  useEffect(() => {
    const activeTab = routeToTabMap[location.pathname] || 'NotFound';
    console.log(`📌 Current Tab changed to: ${activeTab}`);
  }, [location.pathname, routeToTabMap]);

  // Fetch Navbar Links from Firestore
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        console.log('📥 Fetching Navbar Links...');
        const navbarLinksCollection = collection(db, 'settings', 'site', 'navbarLinks');
        const navbarLinksSnapshot = await getDocs(navbarLinksCollection);
        const navbarLinks = navbarLinksSnapshot.docs.map((doc) => doc.data());
        setNavbarLinks(navbarLinks || []);
      } catch (error) {
        console.error('❌ Error fetching site settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const isLinkEnabled = (linkName) => {
    const link = navbarLinks.find((l) => l.name?.toLowerCase() === linkName.toLowerCase());
    return link?.enabled || false;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="app-container">
      <NavBar navbarLinks={navbarLinks} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/about" element={isLinkEnabled('about') ? <About /> : <NotFound />} />
        <Route path="/cart" element={isLinkEnabled('cart') ? <Cart /> : <NotFound />} />
        <Route path="/contact" element={isLinkEnabled('contact') ? <Contact /> : <NotFound />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/return-policy" element={<ReturnPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/custom-drum-builder" element={<CustomDrumBuilder />} />
        <Route path="/artisan-shop" element={<ArtisanShop />} />
        <Route path="/admin/update-carts" element={<UpdateCartsPage />} />
        <Route path="/sound-profile-tool" element={<PathSelection setSelectedPath={setSelectedPath} />} />
        <Route path="/gallery" element={isLinkEnabled('gallery') ? <Gallery /> : <NotFound />} />
        <Route path="/custom-shop" element={isLinkEnabled('custom-shop') ? <CustomShop /> : <NotFound />} />
        <Route path="/test-redirect" element={<TestRedirect />} />
        <Route path="/products" element={isLinkEnabled('products') ? <Products /> : <NotFound />} />
        <Route path="/products/:productId" element={<ProductDetail />} />

        {/* Regular Pre-Order Page */}
        <Route path="/pre-order" element={<PreOrderPage isAdmin={isAdmin} />} />
        
        {/* Admin Pre-Order Page */}
        <Route path="/admin/pre-order" element={<PreOrderPage isAdmin={isAdmin} />} />

        <Route path="/account" element={<PrivateRoute element={<AccountPage />} />} />
        <Route path="/admin" element={<PrivateRoute element={<AdminDashboard />} adminOnly />} />
        <Route path="/signin" element={user ? <Navigate to="/account" /> : <SignInEmail />} />
        <Route path="/register" element={user ? <Navigate to="/account" /> : <Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin-signin" element={<AdminSignin />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/checkout-summary" element={<CheckoutSummary />} />
      </Routes>
      <Footer navbarLinks={navbarLinks} />
    </div>
  );
}

export default App;