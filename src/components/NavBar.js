import React from 'react';
import { Link } from 'react-router-dom';
import './NavBar.css';

const NavBar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">
          <img src="/ober-artisan-logo-large.png" alt="Logo" className="logo-img" />
        </Link>
      </div>
      <div className="navbar-links">
        <Link to="/">Home</Link>
        <Link to="/products">Shop/Gallery</Link>
      </div>
    </nav>
  );
};

export default NavBar;