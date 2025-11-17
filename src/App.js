// src/App.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { getDocs, collection } from 'firebase/firestore';
import { db } from './firebaseConfig.js';
import ProjectRoute from './components/ProjectRoute.js';
import ProjectDetailPage from './components/ProjectDetailPage.js';
import DrumViewer from './components/DrumViewer.js';
import SoundlegendSignin from './components/SoundlegendSignin.js';
import ScrollToTop from './components/ScrollToTop.js';
import NavBar from './components/NavBar.js';
import Footer from './components/Footer.js';
import Home from './components/Home.js';
import StaveCalculator from './components/StaveCalculator.js';
import Products from './components/Products.js';
import ProductDetail from './components/ProductDetail.js';
import PreOrderPage from './components/ArtisanShop.js';
import About from './components/About.js';
import Contact from './components/Contact.js';
import OurCraft from './components/OurCraft.js';
import Cart from './components/Cart.js';
import ArtisanDrums from './components/ArtisanDrums.js';
import Register from './components/Register.js';
import ForgotPassword from './components/ForgotPassword.js';
import Checkout from './components/Checkout.js';
import AccountPage from './components/AccountPage.js';
import CheckoutSummary from './components/CheckoutSummary.js';
import Gallery from './components/Gallery.js';
import AdminDashboard from './components/AdminDashboard.js';
import OriginalArtisanShop from './components/OriginalArtisanShop.js';
import ManageUsers from './components/ManageUsers.js';
import ManageProducts from './components/ManageProducts.js';
import ManageOrders from './components/ManageOrders.js';
import SiteSettings from './components/SiteSettings.js';
import SignInEmail from './components/SignInEmail.js';
import CustomShop from './components/CustomShop/CustomShop.js';
import PrivacyPolicy from './components/PrivacyPolicy.js';
import TermsOfService from './components/TermsOfService.js';
import ReturnPolicy from './components/ReturnPolicy.js';
import NotFound from './components/NotFound.js';
import InventoryTracker from './components/InventoryTracker.js';
import PrivateRoute from './components/PrivateRoute.js';
import { useAuth } from './context/AuthContext.js';
import AdminSignin from './components/AdminSignin.js';
import CustomDrumBuilder from './components/CustomDrumBuilder.js';
import HomeBackground from './components/HomeBackground.js';
import FoundersToastProductDetail from './components/FoundersToastProductDetail.js';
import HeritageProductDetail from './components/HeritageProductDetail.js';
import FeuzonProductDetail from './components/FeuzonProductDetail.js';
import SoundlegendProductDetail from './components/SoundlegendProductDetail.js';
import { DarkModeProvider } from './context/DarkModeContext.js';
import VerifySerial from './components/VerifySerial.js';
import VerifyDrumBySerial from './components/VerifyDrumBySerial.js';
import SoundLegendShowroom from './components/SoundLegendShowroom.js';
import LegacyVaultHome from './components/LegacyVaultHome.js';
import SoundLegendVaultCreator from './components/SoundLegendVaultCreator.js';
import Endorsements from './components/Endorsements.js';
import EndorsementForm from './components/EndorsementForm.js';
import ResinAccentGenerator from './components/ResinAccentGenerator.js';
import DrumSelector from './components/DrumSelector.js';
import HulaGiftPage from './components/HulaGiftPage.js';
import AttachUserResourcesTool from './components/AttachUserResourcesTool';
import { ImpersonationProvider } from './context/ImpersonationContext';
import SoundLegendPortal from './components/SoundLegendPortal/SoundLegendPortal.js';
import { Toaster } from 'react-hot-toast';
import './App.css';

/** Temporary placeholders so new links work; replace with real pages later */
function LegacyBrowse() {
  return (
    <div style={{ padding: 20 }}>
      Browse legacy artists / filters (placeholder)
    </div>
  );
}
function LegacyTuningLearn() {
  return (
    <div style={{ padding: 20 }}>What is Legacy Tuning™ (placeholder)</div>
  );
}

function App() {
  const { user, isAdmin } = useAuth();
  const [navbarLinks, setNavbarLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem('darkMode') === 'true'
  );

  const navigate = useNavigate();
  const location = useLocation();

  const routeToTabMap = useMemo(
    () => ({
      '/': 'Home',
      '/about': 'About',
      '/cart': 'Cart',
      '/contact': 'Contact',
      '/gallery': 'Gallery',
      '/custom-shop': 'CustomShop',
      '/artisanseries': 'ArtisanSeries',
      '/products': 'Products',
      '/merch': 'Merch',
      '/soundlegends/signin': 'SignIn',
      '/terms-of-service': 'TermsOfService',
      '/register': 'Register',
      '/forgot-password': 'ForgotPassword',
      '/checkout': 'Checkout',
      '/account': 'Account',
      '/admin': 'Admin',
      '/artisan-shop/soundlegend': 'SoundLegend',
    }),
    []
  );

  useEffect(() => {
    document.body.classList.toggle('light', !isDarkMode);
    document.body.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    document.body.classList.toggle('dark', newMode);
    document.body.classList.toggle('light', !newMode);
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const navbarLinksCollection = collection(
          db,
          'settings',
          'site',
          'navbarLinks'
        );
        const snapshot = await getDocs(navbarLinksCollection);
        setNavbarLinks(snapshot.docs.map((doc) => doc.data()) || []);
      } catch (err) {
        console.error('❌ Error fetching navbar links:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const isLinkEnabled = (linkName) => {
    const link = navbarLinks.find(
      (l) => l.name?.toLowerCase() === linkName.toLowerCase()
    );

    if (!link) return false;
    if (link.enabled && link.access?.includes('public')) return true;
    if (user && isAdmin && link.access?.includes('admin')) return true;
    if (user && link.access?.includes('soundlegend')) return true;

    return false;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <DarkModeProvider>
      <ScrollToTop />
      <Toaster position="bottom-center" />
      <div className="app-container">
        <NavBar
          navbarLinks={navbarLinks}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
        />
        <HomeBackground />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/our-craft" element={<OurCraft />} />
          <Route
            path="/founders-batch"
            element={<ArtisanDrums isDarkMode={isDarkMode} />}
          />
          <Route path="/cart" element={<Cart />} />
          <Route
            path="/about"
            element={isLinkEnabled('about') ? <About /> : <NotFound />}
          />
          <Route
            path="/contact"
            element={isLinkEnabled('contact') ? <Contact /> : <NotFound />}
          />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/return-policy" element={<ReturnPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route
            path="/custom-drum-builder"
            element={
              isLinkEnabled('custom-drum-builder') ? (
                <CustomDrumBuilder />
              ) : (
                <NotFound />
              )
            }
          />

          {/* SoundLegend Portal */}
          <Route
            path="/legacy"
            element={<PrivateRoute element={<SoundLegendPortal />} />}
          />

          <Route
            path="/original-artisan-shop"
            element={
              isLinkEnabled('artisan-shop') ? (
                <OriginalArtisanShop />
              ) : (
                <NotFound />
              )
            }
          />
          <Route
            path="/gallery"
            element={isLinkEnabled('gallery') ? <Gallery /> : <NotFound />}
          />
          <Route
            path="/admin/artisan-tools/stave-calculator"
            element={<PrivateRoute element={<StaveCalculator />} adminOnly />}
          />
          <Route
            path="/custom-shop"
            element={
              isLinkEnabled('custom-shop') ? <CustomShop /> : <NotFound />
            }
          />
          <Route
            path="/products"
            element={
              isLinkEnabled('products') || isAdmin ? <Products /> : <NotFound />
            }
          />
          <Route path="/merch" element={<Products isMerchPage={true} />} />
          <Route
            path="/artisan-shop"
            element={<PreOrderPage isAdmin={isAdmin} isDarkMode={isDarkMode} />}
          />
          <Route path="/drum-selector" element={<DrumSelector />} />

          {/* Projects & Auth */}
          <Route
            path="/projects/:projectId"
            element={<ProjectRoute element={ProjectDetailPage} />}
          />
          <Route
            path="/soundlegends/signin"
            element={
              user ? <Navigate to="/legacy" replace /> : <SoundlegendSignin />
            }
          />

          {/* Individual product detail routes */}
          <Route
            path="/artisan-shop/heritage"
            element={<HeritageProductDetail />}
          />
          <Route
            path="/artisan-shop/feuzon"
            element={<FeuzonProductDetail />}
          />

          {/* Keep SoundLegend overview/builder here */}
          <Route
            path="/artisan-shop/soundlegend"
            element={<SoundlegendProductDetail />}
          />

          <Route path="/hula" element={<HulaGiftPage />} />

          {/* Legacy Vault on its own endpoint */}
          <Route
            path="/artisan-shop/soundlegend/vault"
            element={<LegacyVaultHome />}
          />
          <Route
            path="/artisan-shop/soundlegend/vault/browse"
            element={<LegacyBrowse />}
          />
          <Route
            path="/artisan-shop/soundlegend/vault/learn/legacy-tuning"
            element={<LegacyTuningLearn />}
          />

          {/* Founders Toast */}
          <Route
            path="/artisan-shop/founders-toast"
            element={<FoundersToastProductDetail />}
          />

          {/* Inventory Tool (admin) */}
          <Route
            path="/admin/artisan-tools/inventory-tracker"
            element={<PrivateRoute element={<InventoryTracker />} adminOnly />}
          />

          {/* Attach orders/projects to user (admin-only utility) */}
          <Route
            path="/admin/tools/attach-user-resources"
            element={
              <PrivateRoute element={<AttachUserResourcesTool />} adminOnly />
            }
          />

          {/* Product detail (general) */}
          <Route
            path="/artisan-shop/:productId"
            element={<ProductDetail key={location.pathname} />}
          />
          <Route
            path="/merch/:productId"
            element={<ProductDetail key={location.pathname} />}
          />

          {/* Legacy redirects for old paths */}
          <Route
            path="/artisanseries/:productId"
            element={
              <Navigate
                to={`/artisan-shop/${
                  window.location.pathname.split('/').pop()
                }`}
                replace
              />
            }
          />
          <Route
            path="/products/:productId"
            element={
              <Navigate
                to={`/merch/${location.pathname.split('/').pop()}`}
                replace
              />
            }
          />

          {/* Account & Admin */}
          <Route
            path="/account"
            element={<PrivateRoute element={<AccountPage />} />}
          />
          <Route
            path="/admin"
            element={<PrivateRoute element={<AdminDashboard />} adminOnly />}
          />
          <Route path="/admin-signin" element={<AdminSignin />} />

          {/* Checkout */}
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout-summary" element={<CheckoutSummary />} />

          {/* Verify pages */}
          <Route path="/verify" element={<VerifySerial />} />
          <Route path="/verify/:serial" element={<VerifyDrumBySerial />} />

          {/* SoundLegend Showroom (dynamic serial pages) */}
          <Route
            path="/artisan-shop/soundlegend/:serial"
            element={<SoundLegendShowroom />}
          />

          {/* Endorsements */}
          <Route path="/endorsements" element={<Endorsements />} />
          <Route path="/endorsements/apply" element={<EndorsementForm />} />

          {/* Admin: Vault content creator */}
          <Route
            path="/admin/soundlegend-vault"
            element={
              <PrivateRoute element={<SoundLegendVaultCreator />} adminOnly />
            }
          />
          <Route
            path="/admin/artisan-tools/resin-accent-generator"
            element={<ResinAccentGenerator />}
          />
        </Routes>
        <Footer navbarLinks={navbarLinks} />
      </div>
    </DarkModeProvider>
  );
}

export default App;