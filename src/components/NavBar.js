import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './NavBar.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const NavBar = () => {
  const { user, logout } = useAuth(); // Access the user and logout function using the useAuth hook

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
        {!user ? (
          <Link to="/signin-email" className="nav-link">
            Sign In
          </Link>
        ) : (
          <span onClick={logout} className="nav-link logout-link">
            Logout
          </span>
        )}
        <Link to="/cart" className="nav-link">
          <i className="bi bi-cart"></i>
        </Link>
      </div>
    </nav>
  );
};

export default NavBar;
