// src/components/NavBar.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './NavBar.css'; // Ensure you have this file for styling

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="logo">
        <img src="/ober-artisan-logo-large.png" alt="Logo" style={{ width: '200px' }} /> {/* Adjust size as needed */}
        </Link>
        <div className="mobile-menu-icon" onClick={toggleMenu}>
          ☰
        </div>
      </div>
      <div className={`dropdown-menu ${isOpen ? 'open' : ''}`}>
        <Link to="/shop" onClick={toggleMenu}>Shop</Link>
        <Link to="/cart" onClick={toggleMenu}>Cart</Link>
        <Link to="/about" onClick={toggleMenu}>About</Link>
        <Link to="/contact" onClick={toggleMenu}>Contact</Link>

      </div>
    </nav>
  );
};

export default NavBar;
