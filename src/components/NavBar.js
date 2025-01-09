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

  useEffect(() => {
    const fetchNavbarLinks = async () => {
      try {
        const navbarLinksCollection = collection(db, 'settings', 'site', 'navbarLinks');
        const navbarLinksSnapshot = await getDocs(navbarLinksCollection);
        const fetchedLinks = navbarLinksSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => a.order - b.order);
        
        console.log('Fetched Navbar Links:', fetchedLinks);
        setNavbarLinks(fetchedLinks.filter(link => link.enabled));  // Only show enabled links
      } catch (error) {
        console.error('Error fetching navbar links:', error);
      }
    };
  
    fetchNavbarLinks();
  }, [user]);

  const toggleCartPreview = () => {
    if (location.pathname !== '/cart') {
      setShowCartPreview((prev) => !prev);
    }
  };

  const handleCloseCartPreview = () => {
    setShowCartPreview(false);
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
    document.body.classList.toggle('dark', !isDarkMode);
    document.body.classList.toggle('light', isDarkMode);
  };

  const isCartEnabled = navbarLinks.some((link) => link.name.toLowerCase() === 'cart');

  return (
    <nav className="navbar">
      {/* <video
        className="navbar-background"
        autoPlay
        loop
        muted
        playsInline
        src={isMenuOpen ? '/background-mobile.mp4' : '/background-web.mp4'}
        type="video/mp4"
      /> */}

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
        onClick={() => setIsMenuOpen((prev) => !prev)}
        aria-expanded={isMenuOpen}
        aria-label="Toggle menu"
      >
        <img
          src={isMenuOpen ? '/menu/41.png' : '/menu/31.png'}
          alt="Menu Toggle"
          className={`menu-arrow-icon ${isMenuOpen ? 'open' : ''}`}
        />
      </button>

      <div className={`navbar-links ${isMenuOpen ? 'open' : ''}`} ref={menuRef}>
        {navbarLinks
          .filter((link) => 
            link.name.toLowerCase() !== 'cart' && 
            (link.name.toLowerCase() !== 'signin' || !user)  // Hides "Sign In" if user is authenticated
          )
          .map((link) => (
            <Link
              key={link.id}
              to={`/${link.name.toLowerCase().replace(/\s+/g, '-')}`}
              className={`nav-link ${
                location.pathname === `/${link.name.toLowerCase().replace(/\s+/g, '-')}`
                  ? 'active'
                  : ''
              }`}
            >
              {link.label}
            </Link>
          ))}

        {isCartEnabled && (
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
        )}

        {/* Admin button visible if user is authenticated and isAdmin is true */}
        {user && isAdmin && (
          <Link
            to="/admin"
            className={`nav-link ${
              location.pathname === '/admin' ? 'active' : ''
            }`}
          >
            <FaCog /> Admin
          </Link>
        )}

        {user && (
          <>
            <Link
              to="/account"
              className={`nav-link ${
                location.pathname === '/account' ? 'active' : ''
              }`}
            >
              <FaUserAlt /> Account
            </Link>
            <button className="nav-link" onClick={handleSignOut}>
              <FaSignOutAlt /> Sign Out
            </button>
          </>
        )}

        {/* Link to the Custom Drum Builder */}
        <Link
          to="/custom-drum-builder"
          className={`nav-link ${
            location.pathname === '/custom-drum-builder' ? 'active' : ''
          }`}
        >
          Custom Drum Builder
        </Link>
      </div>
    </nav>
  );
};

export default NavBar;