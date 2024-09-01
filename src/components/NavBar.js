import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCartPlus, FaSignInAlt, FaSignOutAlt } from 'react-icons/fa';
import './NavBar.css';

const NavBar = ({ isAuthenticated, onSignOut }) => {
  const [isNavOpen, setIsNavOpen] = useState(false);

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">
          <img src="ober-artisan-logo-large.png" alt="Logo" className="logo-img" />
        </Link>
      </div>
      <button className="navbar-toggle" onClick={toggleNav} aria-label="Toggle navigation">
        <span className="navbar-toggle-icon"></span>
      </button>
      <div className={`navbar-links ${isNavOpen ? 'active' : ''}`}>
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/shop" className="nav-link">Shop/Gallery</Link>
        <Link to="/about" className="nav-link">About</Link>
        <Link to="/contact" className="nav-link">Contact</Link>
        {isAuthenticated ? (
          <button className="nav-link" onClick={onSignOut}>
            <FaSignOutAlt className="nav-icon" />
            Sign Out
          </button>
        ) : (
          <Link to="/signin" className="nav-link">
            <FaSignInAlt className="nav-icon" />
            Sign In
          </Link>
        )}
        <Link to="/cart" className="nav-link">
          <FaCartPlus className="nav-icon" />
          Cart
        </Link>
      </div>
    </nav>
  );
};

export default NavBar;
