import React, { useRef, useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaCartPlus, FaSignOutAlt, FaUserAlt, FaCog } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { DarkModeContext } from '../context/DarkModeContext';
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import CartPreview from './CartPreview'; // ✅ Import CartPreview
import './NavBar.css';

const NavBar = () => {
  const [navbarLinks, setNavbarLinks] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartPreviewOpen, setIsCartPreviewOpen] = useState(false); // ✅ State for Cart Preview
  const { isDarkMode, setIsDarkMode } = useContext(DarkModeContext);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const cartRef = useRef(null); // ✅ Ref for Cart Preview
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const { cart } = useCart();

  const cartItemCount = Object.values(cart).reduce(
    (total, item) => total + item.quantity,
    0
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
      if (!isMobileView) setIsMenuOpen(false);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

useEffect(() => {
  const fetchNavbarLinks = async () => {
    try {
      const navbarLinksCollection = collection(
        db,
        "settings",
        "site",
        "navbarLinks"
      );
      const navbarLinksSnapshot = await getDocs(navbarLinksCollection);
      const fetchedLinks = navbarLinksSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((link) => link.enabled === true) // ✅ Only enabled links
        .sort((a, b) => a.order - b.order);

      // ✅ Fallback to hardcoded links if Firestore fails
      if (fetchedLinks.length === 0) {
        console.warn("⚠️ Firestore navbar links not found. Using fallback.");
        setNavbarLinks([
          { id: "home", name: "home", label: "Home", order: 0 },
          { id: "products", name: "products", label: "Products", order: 1 },
          { id: "contact", name: "contact", label: "Contact", order: 2 },
          { id: "pre-order", name: "pre-order", label: "Pre-Order", order: 3 },
        ]);
      } else {
        setNavbarLinks(fetchedLinks);
      }
    } catch (error) {
      console.error("❌ Error fetching navbar links:", error);
      // ✅ If Firestore fails, use hardcoded fallback
      setNavbarLinks([
        { id: "home", name: "home", label: "Home", order: 0 },
        { id: "products", name: "products", label: "Products", order: 1 },
        { id: "contact", name: "contact", label: "Contact", order: 2 },
        { id: "pre-order", name: "pre-order", label: "Pre-Order", order: 3 },
      ]);
    }
  };

  fetchNavbarLinks();
}, []);

  

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const closeCartPreview = () => {
    setIsCartPreviewOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const toggleCartPreview = (event) => {
    event.stopPropagation(); // Prevents menu from closing when clicking cart icon
    setIsCartPreviewOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
      if (
        cartRef.current &&
        !cartRef.current.contains(event.target) &&
        !event.target.closest('.cart-icon')
      ) {
        setIsCartPreviewOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  };

  const handleNavLinkClick = (path) => {
    if (location.pathname === path) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/" replace onClick={() => handleNavLinkClick('/')}>
          <img
            src={
              isDarkMode
                ? process.env.REACT_APP_LOGO_LIGHT
                : process.env.REACT_APP_LOGO_DARK
            }
            alt="Logo"
            className="logo-img"
          />
        </Link>
      </div>

      {isMobileView && (
        <button
          className="navbar-menu-container"
          onClick={toggleMenu}
          aria-expanded={isMenuOpen}
          aria-label="Toggle menu"
          ref={buttonRef}
        >
          <img
            src={
              isDarkMode
                ? isMenuOpen
                  ? '/menu/close-button-dark-mode.png'
                  : '/menu/menu-button-dark-mode.png'
                : isMenuOpen
                  ? '/menu/close-button-light-mode.png'
                  : '/menu/menu-button-light-mode.png'
            }
            alt="Menu Toggle"
            className={`menu-arrow-icon ${isMenuOpen ? 'open' : ''}`}
          />
        </button>
      )}

      {(isMenuOpen || !isMobileView) && (
        <div
          className={`navbar-links ${isMobileView && isMenuOpen ? 'open' : ''}`}
          ref={menuRef}
        >
          <Link
            to="/"
            replace
            onClick={() => handleNavLinkClick('/')}
            className="nav-link"
          >
            Home
          </Link>

          {navbarLinks
            .filter((link) => link.name.toLowerCase() !== 'home')
            .map((link) => (
              <Link
                key={link.id}
                to={`/${link.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="nav-link"
                onClick={() =>
                  handleNavLinkClick(
                    `/${link.name.toLowerCase().replace(/\s+/g, '-')}`
                  )
                }
              >
                {link.label}
              </Link>
            ))}

          {user && isAdmin && (
            <Link
              to="/admin"
              className="nav-link"
              onClick={() => handleNavLinkClick('/admin')}
            >
              <FaCog /> Admin
            </Link>
          )}

          {user && (
            <>
              <Link
                to="/account"
                className="nav-link"
                onClick={() => handleNavLinkClick('/account')}
              >
                <FaUserAlt /> Account
              </Link>
              <button className="nav-link-signout" onClick={handleSignOut}>
                <FaSignOutAlt /> Sign Out
              </button>
            </>
          )}

          {/* ✅ Move Cart Inside Menu */}
          <button className="cart-icon nav-link" onClick={toggleCartPreview}>
            <FaCartPlus />
            {cartItemCount > 0 && (
              <span className="cart-badge">{cartItemCount}</span>
            )}
          </button>

          {/* ✅ Conditionally Render Cart Preview */}
          {isCartPreviewOpen && (
            <div className="cart-preview-container" ref={cartRef}>
              <CartPreview onClose={closeCartPreview} closeMenu={closeMenu} />
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default NavBar;
