import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth instead of AuthContext
import './NavBar.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const NavBar = () => {
  const { user } = useAuth(); // Access the user using the useAuth hook

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        <img src="/ober-artisan-logo-large.png" alt="Logo" style={{ width: '200px' }} />
      </Link>
      <div className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/shop" className="nav-link">Shop</Link>
        <Link to="/about" className="nav-link">About</Link>
        <Link to="/contact" className="nav-link">Contact</Link>
        {!user && (
          <Link to="/signin-email" className="nav-link">
            Sign In
          </Link>
        )}
        <Link to="/cart" className="nav-link">
          <i className="bi bi-cart"></i>
        </Link>
      </div>
    </nav>
  );
};

export default NavBar;
