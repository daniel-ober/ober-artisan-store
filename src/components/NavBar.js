import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaCartPlus, FaSignOutAlt, FaUserAlt, FaCog } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext'; // Importing from AuthContext
import './NavBar.css';

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, handleSignOut } = useAuth(); // Using Auth context

  const isAuthenticated = Boolean(user); // Determine if user is authenticated

  const handleMenuToggle = () => {
    setIsMenuOpen((prevState) => !prevState);
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

  const handleLinkClick = (path) => {
    if (path !== location.pathname) {
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
        src={isMenuOpen ? "/background-mobile.mp4" : "/background-web.mp4"}
      />

      <div className="navbar-logo">
        <Link to="/" onClick={() => handleLinkClick('/')}>
          <img
            src="/ober-artisan-logo-large.png"
            alt="Logo"
            className="logo-img"
          />
        </Link>
      </div>
      <button
        className="navbar-menu-container"
        ref={buttonRef}
        onClick={handleMenuToggle}
        aria-expanded={isMenuOpen}
        aria-label="Toggle menu"
      >
        <div className="menu-toggle-content">
          <img
            src={isMenuOpen ? 'https://i.imgur.com/P61nlaA.png' : 'https://i.imgur.com/iGiegQg.png'}
            alt="Menu Toggle"
            className="menu-arrow-icon"
          />
        </div>
      </button>
      <div className={`navbar-links ${isMenuOpen ? 'open' : ''}`} ref={menuRef}>
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} onClick={() => handleLinkClick('/')}>Home</Link>
        <Link to="/products" className={`nav-link ${location.pathname === '/products' ? 'active' : ''}`} onClick={() => handleLinkClick('/products')}>Shop/Gallery</Link>
        <Link to="/about" className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`} onClick={() => handleLinkClick('/about')}>About</Link>
        <Link to="/contact" className={`nav-link ${location.pathname === '/contact' ? 'active' : ''}`} onClick={() => handleLinkClick('/contact')}>Contact</Link>

        {isAuthenticated ? (
          <>
            {isAdmin && (
              <>
                <Link to="/custom-shop-assistant" className={`nav-link ${location.pathname === '/custom-shop-assistant' ? 'active' : ''}`} onClick={() => handleLinkClick('/custom-shop-assistant')}>ARTiSAN SUITE</Link>
                <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`} onClick={() => handleLinkClick('/admin')}><FaCog /> Admin</Link>
              </>
            )}
            <Link to="/account" className={`nav-link ${location.pathname === '/account' ? 'active' : ''}`} onClick={() => handleLinkClick('/account')}><FaUserAlt /> Account</Link>
            <button className="nav-link" onClick={handleSignOutClick}><FaSignOutAlt /> Sign Out</button>
          </>
        ) : (
          <Link to="/signin" className={`nav-link ${location.pathname === '/signin' ? 'active' : ''}`} onClick={() => handleLinkClick('/signin')}>Sign In</Link>
        )}
        <Link to="/cart" className={`nav-link ${location.pathname === '/cart' ? 'active' : ''}`} onClick={() => handleLinkClick('/cart')}><FaCartPlus /> Cart</Link>
      </div>
    </nav>
  );
};

export default NavBar;
