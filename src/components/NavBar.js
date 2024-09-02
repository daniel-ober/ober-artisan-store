import React from 'react';
import { Link } from 'react-router-dom';
import { FaCartPlus, FaSignOutAlt, FaUserAlt } from 'react-icons/fa';
import './NavBar.css';

const NavBar = ({ isAuthenticated, onSignOut }) => {
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
      <div className="navbar-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/shop" className="nav-link">Shop/Gallery</Link>
        <Link to="/about" className="nav-link">About</Link>
        <Link to="/contact" className="nav-link">Contact</Link>
        {isAuthenticated ? (
          <>
            <Link to="/account" className="nav-link">
              <FaUserAlt className="nav-icon" />
              Account
            </Link>
            <Link to="#" className="nav-link" onClick={handleSignOut}>
              <FaSignOutAlt className="nav-icon" />
              Sign Out
            </Link>
          </>
        ) : (
          <Link to="/signin" className="nav-link">
            Sign In
          </Link>
        )}
        <Link to="/cart" className="nav-link">
          <FaCartPlus className="nav-icon" />
          View Cart
        </Link>
      </div>
    </nav>
  );
};

export default NavBar;
