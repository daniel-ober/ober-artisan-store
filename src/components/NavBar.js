import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCartPlus, FaSignOutAlt, FaUserAlt, FaBars } from 'react-icons/fa';
import './NavBar.css';

const NavBar = ({ isAuthenticated, onSignOut }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuToggle = () => setIsMenuOpen(!isMenuOpen);

  const handleSignOut = (event) => {
    event.preventDefault(); // Prevent default link behavior
    onSignOut(); // Call the sign-out function passed as prop
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">
          <img src="ober-artisan-logo-large.png" alt="Logo" className="logo-img" />
        </Link>
      </div>
      <div className="navbar-menu-toggle" onClick={handleMenuToggle}>
        <FaBars className="nav-icon" />
      </div>
      <div className={`navbar-links ${isMenuOpen ? 'open' : ''}`}>
        <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>Home</Link>
        <Link to="/shop" className="nav-link" onClick={() => setIsMenuOpen(false)}>Shop/Gallery</Link>
        <Link to="/about" className="nav-link" onClick={() => setIsMenuOpen(false)}>About</Link>
        <Link to="/contact" className="nav-link" onClick={() => setIsMenuOpen(false)}>Contact</Link>
        {isAuthenticated ? (
          <>
            <Link to="/account" className="nav-link" onClick={() => setIsMenuOpen(false)}>
              <FaUserAlt className="nav-icon" />
              Account
            </Link>
            <Link to="#" className="nav-link" onClick={handleSignOut}>
              <FaSignOutAlt className="nav-icon" />
              Sign Out
            </Link>
          </>
        ) : (
          <Link to="/signin" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            Sign In
          </Link>
        )}
        <Link to="/cart" className="nav-link" onClick={() => setIsMenuOpen(false)}>
          <FaCartPlus className="nav-icon" />
          View Cart
        </Link>
      </div>
    </nav>
  );
};

export default NavBar;
