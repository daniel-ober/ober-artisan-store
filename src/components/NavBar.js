import React, { useRef, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaCartPlus, FaSignOutAlt, FaUserAlt, FaCog } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './NavBar.css';

const NavBar = () => {
  const [navbarLinks, setNavbarLinks] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const location = useLocation();
  const { user, isAdmin, handleSignOut } = useAuth();

  // Log user state for debugging
  console.log('User:', user);
  console.log('Is Admin:', isAdmin);

  // Load logos from environment variables
  const logoLight = process.env.REACT_APP_LOGO_LIGHT;
  const logoDark = process.env.REACT_APP_LOGO_DARK;

  useEffect(() => {
    const fetchNavbarLinks = async () => {
      try {
        const navbarLinksCollection = collection(db, 'settings', 'site', 'navbarLinks');
        const navbarLinksSnapshot = await getDocs(navbarLinksCollection);
        const fetchedLinks = navbarLinksSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((link) => link.enabled)
          .sort((a, b) => a.order - b.order);
        console.log('Fetched Navbar Links:', fetchedLinks);
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
        src={isMenuOpen ? "/background-mobile.mp4" : "/background-web.mp4"}
        type="video/mp4"
      />

      <div className="navbar-logo">
        <Link to="/">
          <img
            src={isDarkMode ? logoLight : logoDark}
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
          src={isMenuOpen ? 'https://i.imgur.com/P61nlaA.png' : 'https://i.imgur.com/iGiegQg.png'}
          alt="Menu Toggle"
          className={`menu-arrow-icon ${isMenuOpen ? 'open' : ''}`}
        />
      </button>

      <div className={`navbar-links ${isMenuOpen ? 'open' : ''}`} ref={menuRef}>
        {navbarLinks.map((link) => {
          const lowerCaseName = link.name.toLowerCase();
          
          // Hide Sign In and Register when user is logged in
          if ((lowerCaseName === 'signin' || lowerCaseName === 'register') && user) {
            return null;
          }

          return (
            <Link
              key={link.name}
              to={`/${lowerCaseName.replace(/\s+/g, '-')}`}
              className={`nav-link ${
                location.pathname === `/${lowerCaseName.replace(/\s+/g, '-')}` ? 'active' : ''
              }`}
            >
              {link.label}
            </Link>
          );
        })}

        {navbarLinks.some((link) => link.name.toLowerCase() === 'cart') && (
          <Link to="/cart" className={`nav-link ${location.pathname === '/cart' ? 'active' : ''}`}>
            <FaCartPlus /> Cart
          </Link>
        )}

        {/* Show admin and account links for authenticated users */}
        {user && (
          <>
            {isAdmin && (
              <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>
                <FaCog /> Admin
              </Link>
            )}
            <Link to="/account" className={`nav-link ${location.pathname === '/account' ? 'active' : ''}`}>
              <FaUserAlt /> Account
            </Link>
            <button className="nav-link" onClick={handleSignOutClick}>
              <FaSignOutAlt /> Sign Out
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
