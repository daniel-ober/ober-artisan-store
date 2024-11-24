import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaCartPlus, FaSignOutAlt, FaUserAlt, FaCog } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import './NavBar.css';

const NavBar = () => {
  const [navbarLinks, setNavbarLinks] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, handleSignOut } = useAuth();

  useEffect(() => {
    const fetchNavbarLinks = async () => {
      try {
        const navbarLinksCollection = collection(db, 'settings/site/navbarLinks');
        const navbarLinksSnapshot = await getDocs(navbarLinksCollection);
        const navbarLinks = navbarLinksSnapshot.docs
          .map((doc) => doc.data())
          .filter((link) => link.enabled);

        setNavbarLinks(navbarLinks);
      } catch (error) {
        console.error('Error fetching navbar links:', error);
      }
    };

    fetchNavbarLinks();
  }, []);

  const handleMenuToggle = () => {
    setIsMenuOpen((prev) => !prev);
  };

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

  const handleSignOutClick = async () => {
    await handleSignOut();
    navigate('/signin');
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="navbar">
      {/* Video Background */}
      <video
        className="navbar-background"
        autoPlay
        loop
        muted
        playsInline
        src={isMenuOpen ? '/background-mobile.mp4' : '/background-web.mp4'}
      />
      <div className="navbar-logo">
        <Link to="/">
          <img src="/ober-artisan-logo-large.png" alt="Logo" className="logo-img" />
        </Link>
      </div>
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
        {/* Render dynamic links from Firestore */}
        {navbarLinks
          .filter((link) => link.name.toLowerCase() !== 'signin' && link.name.toLowerCase() !== 'cart')
          .map((link, index) => (
            <Link
              key={index}
              to={`/${link.name.toLowerCase().replace(' ', '-')}`}
              className={`nav-link ${
                location.pathname === `/${link.name.toLowerCase().replace(' ', '-')}` ? 'active' : ''
              }`}
            >
              {link.label}
            </Link>
          ))}

        {/* Render user-specific links */}
        {user && (
          <>
            {isAdmin && (
              <Link
                to="/admin"
                className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
              >
                <FaCog /> Admin
              </Link>
            )}
            <Link
              to="/account"
              className={`nav-link ${location.pathname === '/account' ? 'active' : ''}`}
            >
              <FaUserAlt /> Account
            </Link>
            <button className="nav-link" onClick={handleSignOutClick}>
              <FaSignOutAlt /> Sign Out
            </button>
          </>
        )}

        {/* Conditionally render Sign In and Cart links based on Firestore settings */}
        {!user &&
          navbarLinks.some((link) => link.name.toLowerCase() === 'signin') && (
            <Link
              to="/signin"
              className={`nav-link ${location.pathname === '/signin' ? 'active' : ''}`}
            >
              Sign In
            </Link>
          )}
        {navbarLinks.some((link) => link.name.toLowerCase() === 'cart') && (
          <Link
            to="/cart"
            className={`nav-link ${location.pathname === '/cart' ? 'active' : ''}`}
          >
            <FaCartPlus /> Cart
          </Link>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
