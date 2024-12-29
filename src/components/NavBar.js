import React, { useRef, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaCartPlus, FaSignOutAlt, FaUserAlt, FaCog } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import CartPreview from './CartPreview';
import './NavBar.css';

const NavBar = () => {
  const [navbarLinks, setNavbarLinks] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showCartPreview, setShowCartPreview] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const location = useLocation();
  const { user, isAdmin, handleSignOut } = useAuth();
  const { cart } = useCart();

  const cartItemCount = Object.values(cart).reduce(
    (total, item) => total + item.quantity,
    0
  );

  const toggleCartPreview = () => {
    if (location.pathname !== '/cart') {
      setShowCartPreview((prev) => !prev);
    }
  };

  const handleCloseCartPreview = () => {
    setShowCartPreview(false);
  };

  useEffect(() => {
    const fetchNavbarLinks = async () => {
      try {
        const navbarLinksCollection = collection(
          db,
          'settings',
          'site',
          'navbarLinks'
        );
        const navbarLinksSnapshot = await getDocs(navbarLinksCollection);
        const fetchedLinks = navbarLinksSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((link) => link.enabled)
          .sort((a, b) => a.order - b.order);
        setNavbarLinks(fetchedLinks);
      } catch (error) {
        console.error('Error fetching navbar links:', error);
      }
    };

    fetchNavbarLinks();
  }, []);

  const handleMenuToggle = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleSignOutClick = async () => {
    await handleSignOut();
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
    document.body.classList.toggle('dark', !isDarkMode);
    document.body.classList.toggle('light', isDarkMode);
  };

  return (
    <nav className="navbar">
      <video
        className="navbar-background"
        autoPlay
        loop
        muted
        playsInline
        src={isMenuOpen ? '/background-mobile.mp4' : '/background-web.mp4'}
        type="video/mp4"
      />

      <div className="navbar-logo">
        <Link to="/">
          <img
            src={isDarkMode ? process.env.REACT_APP_LOGO_LIGHT : process.env.REACT_APP_LOGO_DARK}
            alt="Logo"
            className="logo-img"
          />
        </Link>
      </div>

      <button className="theme-toggle" onClick={toggleDarkMode}>
        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
      </button>

      <button
        className="navbar-menu-container"
        ref={buttonRef}
        onClick={handleMenuToggle}
        aria-expanded={isMenuOpen}
        aria-label="Toggle menu"
      >
        <img
          src={
            isMenuOpen
              ? 'https://i.imgur.com/P61nlaA.png'
              : 'https://i.imgur.com/iGiegQg.png'
          }
          alt="Menu Toggle"
          className={`menu-arrow-icon ${isMenuOpen ? 'open' : ''}`}
        />
      </button>

      <div className={`navbar-links ${isMenuOpen ? 'open' : ''}`} ref={menuRef}>
        {navbarLinks.map((link) => (
          <Link
            key={link.name}
            to={`/${link.name.toLowerCase().replace(/\s+/g, '-')}`}
            className={`nav-link ${
              location.pathname ===
              `/${link.name.toLowerCase().replace(/\s+/g, '-')}`
                ? 'active'
                : ''
            }`}
          >
            {link.label}
          </Link>
        ))}

        <div className="cart-link-container">
          <button
            className={`nav-link cart-link ${
              location.pathname === '/cart' ? 'active' : ''
            }`}
            onClick={toggleCartPreview}
          >
            <FaCartPlus /> Cart ({cartItemCount})
          </button>

          {showCartPreview && (
            <div className="cart-preview-container">
              <CartPreview onClose={handleCloseCartPreview} />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;