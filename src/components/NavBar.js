import React, { useRef, useState, useEffect, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaCartPlus, FaSignOutAlt, FaUserAlt, FaCog } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { DarkModeContext } from "../context/DarkModeContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import "./NavBar.css";

const NavBar = () => {
  const [navbarLinks, setNavbarLinks] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isDarkMode, setIsDarkMode } = useContext(DarkModeContext);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate(); // ✅ Hook for navigation
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

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchNavbarLinks = async () => {
      try {
        const navbarLinksCollection = collection(db, "settings", "site", "navbarLinks");
        const navbarLinksSnapshot = await getDocs(navbarLinksCollection);
        const fetchedLinks = navbarLinksSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => a.order - b.order);

        setNavbarLinks(fetchedLinks.length ? fetchedLinks.filter((link) => link.enabled) : []);
      } catch (error) {
        console.error("Error fetching navbar links:", error);
      }
    };

    fetchNavbarLinks();
  }, [user]);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark");
      document.body.classList.remove("light");
    } else {
      document.body.classList.add("light");
      document.body.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("darkMode", newMode.toString());
  };

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
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
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error signing out:", error.message);
    }
  };

  // ✅ FIX: Handle Home link navigation cleanly
  const handleHomeClick = (e) => {
    if (location.pathname === "/") {
      e.preventDefault();
      window.scrollTo(0, 0); // Reset scroll to top
      window.history.replaceState({}, "", "/"); // Force URL recognition
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <video key={isDarkMode ? "dark" : "light"} className="navbar-background" autoPlay loop muted playsInline>
        <source src={isDarkMode ? "/hero-dark.mp4" : "/hero-light.mp4"} type="video/mp4" />
      </video>

      <div className="navbar-logo">
        <Link to="/" replace onClick={handleHomeClick}>
          <img
            src={isDarkMode ? process.env.REACT_APP_LOGO_LIGHT : process.env.REACT_APP_LOGO_DARK}
            alt="Logo"
            className="logo-img"
          />
        </Link>
      </div>

      {isMobileView && (
        <button className="navbar-menu-container" onClick={toggleMenu} aria-expanded={isMenuOpen} aria-label="Toggle menu" ref={buttonRef}>
          <img
            src={isDarkMode ? "/menu/menu-button-dark-mode.png" : "/menu/menu-button-light-mode.png"}
            alt="Menu Toggle"
            className={`menu-arrow-icon ${isMenuOpen ? "open" : ""}`}
          />
        </button>
      )}

      {(isMenuOpen || !isMobileView) && (
        <div className={`navbar-links ${isMobileView && isMenuOpen ? "open" : ""}`} ref={menuRef}>
          {/* ✅ FIX: Home Link Navigation */}
          <Link to="/" replace onClick={handleHomeClick} className="nav-link">
            Home
          </Link>

          {/* ✅ Render the remaining navbar links */}
          {navbarLinks.map((link) => (
            <Link
              key={link.id}
              to={`/${link.name.toLowerCase().replace(/\s+/g, "-")}`}
              className="nav-link"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          {user && isAdmin && (
            <Link to="/admin" className="nav-link" onClick={() => setIsMenuOpen(false)}>
              <FaCog /> Admin
            </Link>
          )}

          {user && (
            <>
              <Link to="/account" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                <FaUserAlt /> Account
              </Link>
              <button className="nav-link-signout" onClick={handleSignOut}>
                <FaSignOutAlt /> Sign Out
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default NavBar;