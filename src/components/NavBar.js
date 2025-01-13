import React, { useRef, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaCartPlus, FaSignOutAlt, FaUserAlt, FaCog } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './NavBar.css';

const NavBar = () => {
  const [navbarLinks, setNavbarLinks] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null); // Reference for the menu button
  const location = useLocation();
  const { user, isAdmin, handleSignOut } = useAuth();
  const { cart } = useCart();

  const cartItemCount = Object.values(cart).reduce(
    (total, item) => total + item.quantity,
    0
  );

  // Detect screen size
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768;
      setIsMobileView(isMobile);

      if (!isMobile) {
        setIsMenuOpen(false); // Close menu automatically on desktop
      }
    };

    handleResize(); // Initial screen size check
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Fetch navbar links from Firestore
  useEffect(() => {
    const fetchNavbarLinks = async () => {
      try {
        const navbarLinksCollection = collection(db, 'settings', 'site', 'navbarLinks');
        const navbarLinksSnapshot = await getDocs(navbarLinksCollection);
        const fetchedLinks = navbarLinksSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => a.order - b.order);

        setNavbarLinks(fetchedLinks.filter((link) => link.enabled)); // Only show enabled links
      } catch (error) {
        console.error('Error fetching navbar links:', error);
      }
    };

    fetchNavbarLinks();
  }, [user]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
    document.body.classList.toggle('dark', !isDarkMode);
    document.body.classList.toggle('light', isDarkMode);
  };

  // Toggle menu
  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  // Close menu when clicking outside the menu or button
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="navbar">
      <video
        className="navbar-background"
        autoPlay
        loop
        muted
        playsInline
        src={isDarkMode ? '/dark3.mp4' : '/light5.mp4'} // Use Coming Soon video
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

      {isMobileView && (
        <button
          className="navbar-menu-container"
          onClick={toggleMenu}
          aria-expanded={isMenuOpen}
          aria-label="Toggle menu"
          ref={buttonRef} // Reference for the button
        >
          <img
            src={
              isDarkMode
                ? isMenuOpen
                  ? '/menu/white-e.png'
                  : '/menu/white-b.png'
                : isMenuOpen
                ? '/menu/black-e.png'
                : '/menu/black-b.png'
            }
            alt="Menu Toggle"
            className={`menu-arrow-icon ${isMenuOpen ? 'open' : ''}`}
          />
        </button>
      )}

      {(isMenuOpen || !isMobileView) && (
        <div
          className={`navbar-links ${isMobileView && isMenuOpen ? 'open' : ''}`}
          ref={menuRef}
        >
          {navbarLinks.map((link) => (
            <Link
              key={link.id}
              to={`/${link.name.toLowerCase().replace(/\s+/g, '-')}`}
              className={`nav-link ${
                location.pathname === `/${link.name.toLowerCase().replace(/\s+/g, '-')}`
                  ? 'active'
                  : ''
              }`}
              onClick={() => setIsMenuOpen(false)} // Close menu on link click
            >
              {link.label}
            </Link>
          ))}

          {user && isAdmin && (
            <Link
              to="/admin"
              className={`nav-link ${
                location.pathname === '/admin' ? 'active' : ''
              }`}
              onClick={() => setIsMenuOpen(false)}
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
                onClick={() => setIsMenuOpen(false)}
              >
                <FaUserAlt /> Account
              </Link>
              <button className="nav-link" onClick={handleSignOut}>
                <FaSignOutAlt /> Sign Out
              </button>
            </>
          )}

          <Link
            to="/custom-drum-builder"
            className={`nav-link ${
              location.pathname === '/custom-drum-builder' ? 'active' : ''
            }`}
            onClick={() => setIsMenuOpen(false)}
          >
            Custom Drum Builder
          </Link>
        </div>
      )}
    </nav>
  );
};

export default NavBar;