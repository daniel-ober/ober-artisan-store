import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaCartPlus, FaSignOutAlt, FaUserAlt } from 'react-icons/fa';
import './NavBar.css';

const NavBar = ({ isAuthenticated, onSignOut }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const handleMenuToggle = () => {
    setIsMenuOpen(prevState => !prevState);
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

  const handleSignOut = async () => {
    try {
      await onSignOut();
      navigate('/signin');
    } catch (error) {
      console.error('Sign Out Error:', error);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">
          <img src="/ober-artisan-logo-large.png" alt="Logo" className="logo-img" />
        </Link>
      </div>
      <div className="navbar-menu-container" ref={buttonRef} onClick={handleMenuToggle}>
        <div className="menu-toggle-content">
          <div className="menu-label">Menu</div>
          <img
            src={isMenuOpen ? "https://i.imgur.com/iGiegQg.png" : "https://i.imgur.com/P61nlaA.png"}
            alt="Menu Toggle"
            className="menu-arrow-icon"
          />
        </div>
      </div>
      <div className={`navbar-links ${isMenuOpen ? 'open' : ''}`} ref={menuRef}>
        <Link to="/" className="nav-link" onClick={() => handleLinkClick('/')}>Home</Link>
        <Link to="/products" className="nav-link" onClick={() => handleLinkClick('/products')}>Shop/Gallery</Link>
        <Link to="/about" className="nav-link" onClick={() => handleLinkClick('/about')}>About</Link>
        <Link to="/contact" className="nav-link" onClick={() => handleLinkClick('/contact')}>Contact</Link>
        {isAuthenticated ? (
          <>
            <Link to="/account" className="nav-link" onClick={() => handleLinkClick('/account')}>
              <FaUserAlt className="nav-icon" />
              Account
            </Link>
            <Link to="/signin" className="nav-link" onClick={handleSignOut}>
              <FaSignOutAlt className="nav-icon" />
              Sign Out
            </Link>
          </>
        ) : (
          <Link to="/signin" className="nav-link" onClick={() => handleLinkClick('/signin')}>
            Sign In
          </Link>
        )}
        <Link to="/cart" className="nav-link" onClick={() => handleLinkClick('/cart')}>
          <FaCartPlus className="nav-icon" />
          View Cart
        </Link>
      </div>
    </nav>
  );
};

export default NavBar;
