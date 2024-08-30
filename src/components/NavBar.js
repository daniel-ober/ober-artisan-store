// src/components/NavBar.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Ensure this path is correct
import './NavBar.css'; // Import the CSS for styling

function NavBar() {
  const { user, logout } = useAuth() || {}; // Provide default value to avoid errors

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">
          <img src="/ober-artisan-logo-large.png" alt="Logo" className="logo-image" /> {/* Changed to large logo */}
        </Link>
      </div>
      <ul className="navbar-links">
        <li><Link to="/shop">Shop/Gallery</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/contact">Contact</Link></li>
        {!user ? (
          <li><Link to="/signin">Sign In</Link></li>
        ) : (
          <li><button className="logout-button" onClick={logout}>Logout</button></li>
        )}
        <li>
          <Link to="/cart">
            View Cart <i className="bi bi-cart cart-icon"></i> {/* Bootstrap icon for cart */}
          </Link>
        </li>
      </ul>
    </nav>
  );
}

export default NavBar;
