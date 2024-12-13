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
  const [isDarkMode, setIsDarkMode] = useState(false); // State for dark mode
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const location = useLocation();
  const { user, isAdmin, handleSignOut } = useAuth();

  useEffect(() => {
    const fetchNavbarLinks = async () => {
      try {
        const navbarLinksCollection = collection(db, 'settings', 'site', 'navbarLinks');
        const navbarLinksSnapshot = await getDocs(navbarLinksCollection);
        const fetchedLinks = navbarLinksSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((link) => link.enabled)
          .sort((a, b) => a.order - b.order);
        console.log('Fetched Navbar Links:', fetchedLinks); // Debugging
        setNavbarLinks(fetchedLinks);
      } catch (error) {
        console.error('Error fetching navbar links:', error);
      }
    };
  
    fetchNavbarLinks();
  }, []);
  

  // Handle menu toggle
  const handleMenuToggle = () => {
    setIsMenuOpen((prev) => !prev);
  };

  // Handle sign out
  const handleSignOutClick = async () => {
    await handleSignOut();
  };

  // Function to toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
    document.body.classList.toggle('dark', !isDarkMode);
    document.body.classList.toggle('light', isDarkMode);
  };

  return (
    <nav className="navbar">
      {/* Background Video */}
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
            src={isDarkMode ? 'logo-white-a.png' : 'logo-black-a.png'}
            alt="Logo"
            className="logo-img"
          />
        </Link>
      </div>

      {/* Button to toggle dark mode */}
      <button className="theme-toggle" onClick={toggleDarkMode}>
        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
      </button>

      {/* Menu toggle button */}
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
        {navbarLinks.map((link) => (
          <Link
            key={link.name}
            to={`/${link.name.toLowerCase().replace(/\s+/g, '-')}`}
            className={`nav-link ${
              location.pathname === `/${link.name.toLowerCase().replace(/\s+/g, '-')}` ? 'active' : ''
            }`}
          >
            {link.label}
          </Link>
        ))}

        {navbarLinks.some((link) => link.name.toLowerCase() === 'cart') && (
          <Link to="/cart" className={`nav-link ${location.pathname === '/cart' ? 'active' : ''}`}>
            <FaCartPlus /> Cart
          </Link>
        )}

        {!user && navbarLinks.some((link) => link.name.toLowerCase() === 'signin') && (
          <Link to="/signin" className={`nav-link ${location.pathname === '/signin' ? 'active' : ''}`}>
            Sign In
          </Link>
        )}

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
