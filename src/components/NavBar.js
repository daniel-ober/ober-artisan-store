import React, { useRef, useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaCartPlus, FaSignOutAlt, FaUserAlt, FaCog } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { DarkModeContext } from '../context/DarkModeContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import CartPreview from './CartPreview';
import './NavBar.css';

const NavBar = () => {
  const [navbarLinks, setNavbarLinks] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartPreviewOpen, setIsCartPreviewOpen] = useState(false);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

  const { isDarkMode } = useContext(DarkModeContext);
  const { user, isAdmin, logout } = useAuth();
  const { cart } = useCart();
  const location = useLocation();

  const cartItemCount = Object.values(cart).reduce((total, item) => total + item.quantity, 0);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const cartRef = useRef(null);
  const navbarRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyHeader(!entry.isIntersecting),
      { root: null, threshold: 0 }
    );
    if (navbarRef.current) observer.observe(navbarRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
      if (!isMobileView) setIsMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileView]);

  useEffect(() => {
    const fetchNavbarLinks = async () => {
      try {
        const navbarLinksCollection = collection(db, 'settings', 'site', 'navbarLinks');
        const snapshot = await getDocs(navbarLinksCollection);
        const links = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(link => link.enabled)
          .sort((a, b) => a.order - b.order);
        setNavbarLinks(
          links.length > 0
            ? links
            : [
                { id: 'home', name: 'home', label: 'Home', order: 0 },
                { id: 'products', name: 'products', label: 'Products', order: 1 },
                { id: 'contact', name: 'contact', label: 'Contact', order: 2 },
                { id: 'pre-order', name: 'pre-order', label: 'Pre-Order', order: 3 },
              ]
        );
      } catch (err) {
        console.error('❌ Navbar fetch error:', err);
      }
    };
    fetchNavbarLinks();
  }, []);

  useEffect(() => {
    const handleClickOutside = event => {
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
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleNavLinkClick = path => {
    if (location.pathname === path) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <>
      {showStickyHeader && isMobileView && (
        <div className="navbar-sticky-wrapper">
          <div className="navbar-sticky-mini">
            <Link to="/" onClick={() => handleNavLinkClick('/')}>
              <img
                src={process.env.REACT_APP_LOGO_LIGHT}
                alt="Sticky Logo"
                className="sticky-logo-img"
              />
            </Link>

            <button
              className="navbar-sticky-menu"
              onClick={() => setIsMenuOpen(prev => !prev)}
              aria-expanded={isMenuOpen}
              aria-label="Toggle menu"
            >
              <img
                src={
                  isMenuOpen
                    ? '/menu/close-button-dark-mode.png'
                    : '/menu/menu-button-dark-mode.png'
                }
                alt="Menu Toggle"
                className={`menu-arrow-icon ${isMenuOpen ? 'open' : ''}`}
                style={{
                  zIndex: 9999,
                  position: 'relative',
                  pointerEvents: 'auto',
                  width: '40px',
                  height: '40px',
                }}
              />
            </button>
          </div>

          {isMenuOpen && (
            <div className="navbar-sticky-dropdown-wrapper">
              <div className="navbar-links sticky-dropdown open" ref={menuRef}>
                <Link to="/" replace onClick={() => handleNavLinkClick('/')} className="nav-link">
                  Home
                </Link>
                {navbarLinks
                  .filter(l => l.name.toLowerCase() !== 'home')
                  .map(link => (
                    <Link
                      key={link.id}
                      to={`/${link.name.toLowerCase().replace(/\s+/g, '-')}`}
                      className="nav-link"
                      onClick={() =>
                        handleNavLinkClick(`/${link.name.toLowerCase().replace(/\s+/g, '-')}`)
                      }
                    >
                      {link.label}
                    </Link>
                  ))}

                {user && isAdmin && (
                  <Link to="/admin" className="nav-link" onClick={() => handleNavLinkClick('/admin')}>
                    <FaCog /> Admin
                  </Link>
                )}

                {user && (
                  <>
                    <Link to="/account" className="nav-link" onClick={() => handleNavLinkClick('/account')}>
                      <FaUserAlt /> Account
                    </Link>
                    <button className="nav-link-signout" onClick={handleSignOut}>
                      <FaSignOutAlt /> Sign Out
                    </button>
                  </>
                )}

                <button
                  className="cart-icon nav-link"
                  onClick={e => {
                    e.stopPropagation();
                    setIsCartPreviewOpen(prev => !prev);
                  }}
                >
                  <FaCartPlus />
                  {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
                </button>

                {isCartPreviewOpen && (
                  <div className="cart-preview-container" ref={cartRef}>
                    <CartPreview
                      onClose={() => setIsCartPreviewOpen(false)}
                      closeMenu={() => setIsMenuOpen(false)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <nav className="navbar" ref={navbarRef}>
        <div className="navbar-logo">
          <Link to="/" replace onClick={() => handleNavLinkClick('/')}>
            <img
              src={isDarkMode ? process.env.REACT_APP_LOGO_LIGHT : process.env.REACT_APP_LOGO_DARK}
              alt="Logo"
              className="logo-img"
            />
          </Link>
        </div>

        {isMobileView && !showStickyHeader && (
  <button
    className="navbar-menu-container"
    onClick={() => setIsMenuOpen(prev => !prev)}
    aria-expanded={isMenuOpen}
    aria-label="Toggle menu"
    ref={buttonRef}
  >
    <img
      src={
        isDarkMode
          ? (isMenuOpen
              ? '/menu/close-button-dark-mode.png'
              : '/menu/menu-button-dark-mode.png')
          : (isMenuOpen
              ? '/menu/close-button-light-mode.png'
              : '/menu/menu-button-light-mode.png')
      }
      alt="Menu Toggle"
      className={`menu-arrow-icon ${isMenuOpen ? 'open' : ''}`}
    />
  </button>
)}

        {(isMenuOpen || !isMobileView) && (
          <div className={`navbar-links-wrapper ${showStickyHeader ? 'sticky-mode' : ''}`}>
            <div className={`navbar-links ${isMobileView && isMenuOpen ? 'open' : ''}`} ref={menuRef}>
              <Link to="/" replace onClick={() => handleNavLinkClick('/')} className="nav-link">
                Home
              </Link>
              {navbarLinks
                .filter(l => l.name.toLowerCase() !== 'home')
                .map(link => (
                  <Link
                    key={link.id}
                    to={`/${link.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="nav-link"
                    onClick={() =>
                      handleNavLinkClick(`/${link.name.toLowerCase().replace(/\s+/g, '-')}`)
                    }
                  >
                    {link.label}
                  </Link>
                ))}

              {user && isAdmin && (
                <Link to="/admin" className="nav-link" onClick={() => handleNavLinkClick('/admin')}>
                  <FaCog /> Admin
                </Link>
              )}

              {user && (
                <>
                  <Link to="/account" className="nav-link" onClick={() => handleNavLinkClick('/account')}>
                    <FaUserAlt /> Account
                  </Link>
                  <button className="nav-link-signout" onClick={handleSignOut}>
                    <FaSignOutAlt /> Sign Out
                  </button>
                </>
              )}

              <button
                className="cart-icon nav-link"
                onClick={e => {
                  e.stopPropagation();
                  setIsCartPreviewOpen(prev => !prev);
                }}
              >
                <FaCartPlus />
                {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
              </button>

              {isCartPreviewOpen && (
                <div className="cart-preview-container" ref={cartRef}>
                  <CartPreview
                    onClose={() => setIsCartPreviewOpen(false)}
                    closeMenu={() => setIsMenuOpen(false)}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default NavBar;