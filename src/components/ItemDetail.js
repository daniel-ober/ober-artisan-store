import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './NavBar.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const NavBar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav className="navbar">
      <button className="menu-button" onClick={toggleMenu}>
        <i className="bi bi-list"></i>
      </button>
      <Link to="/" className="logo">
        <img src="/ober-artisan-logo-large.png" alt="Logo" />
      </Link>
      <div className={`nav-links ${menuOpen ? 'active' : ''}`}>
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
        <Link to="/shop" className={`nav-link ${location.pathname === '/shop' ? 'active' : ''}`}>Shop</Link>
        <Link to="/about" className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}>About</Link>
        <Link to="/contact" className={`nav-link ${location.pathname === '/contact' ? 'active' : ''}`}>Contact</Link>
        {!user ? (
          <Link to="/signin-email" className={`nav-link ${location.pathname === '/signin-email' ? 'active' : ''}`}>
            Sign In
          </Link>
        ) : (
          <Link to="/signout" className="nav-link">
            Sign Out
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
