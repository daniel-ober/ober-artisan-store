import React, { useRef, useState, useEffect, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
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
  const { user, isAdmin, logout } = useAuth();
  const { cart } = useCart();

  console.log("📌 Navbar Dark Mode State:", isDarkMode);

  const cartItemCount = Object.values(cart).reduce(
    (total, item) => total + item.quantity,
    0
  );

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768;
      setIsMobileView(isMobile);
      if (!isMobile) setIsMenuOpen(false);
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

        // ✅ Filter out "Home" from Firebase so it doesn’t duplicate
        setNavbarLinks(fetchedLinks.length ? fetchedLinks.filter((link) => link.name.toLowerCase() !== "home" && link.enabled) : []);
      } catch (error) {
        console.error("Error fetching navbar links:", error);
      }
    };

    fetchNavbarLinks();
  }, [user]);

  useEffect(() => {
    document.body.classList.toggle("dark", isDarkMode);
    document.body.classList.toggle("light", !isDarkMode);
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("darkMode", newMode.toString());

    document.body.classList.toggle("dark", newMode);
    document.body.classList.toggle("light", !newMode);
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
      console.log("✅ Successfully signed out.");
    } catch (error) {
      console.error("❌ Error signing out:", error.message);
    }
  };

  return (
    <nav className="navbar">
      <video
        className="navbar-background"
        autoPlay
        loop
        muted
        playsInline
        src={isDarkMode ? "/hero-dark.mp4" : "/hero-light.mp4"}
        type="video/mp4"
      />

      <div className="navbar-logo">
        <Link to="/">
          <img
            src={isDarkMode ? process.env.REACT_APP_LOGO_LIGHT : process.env.REACT_APP_LOGO_DARK}
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
                  ? "/menu/close-button-dark-mode.png"
                  : "/menu/menu-button-dark-mode.png"
                : isMenuOpen
                ? "/menu/close-button-light-mode.png"
                : "/menu/menu-button-light-mode.png"
            }
            alt="Menu Toggle"
            className={`menu-arrow-icon ${isMenuOpen ? "open" : ""}`}
          />
        </button>
      )}

      {(isMenuOpen || !isMobileView) && (
        <div className={`navbar-links ${isMobileView && isMenuOpen ? "open" : ""}`} ref={menuRef}>
          {/* ✅ Manually added "Home" link back */}
          <Link
            to="/"
            className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </Link>

          {navbarLinks.map((link) => (
            <Link
              key={link.id}
              to={`/${link.name.toLowerCase().replace(/\s+/g, "-")}`}
              className={`nav-link ${location.pathname === `/${link.name.toLowerCase().replace(/\s+/g, "-")}` ? "active" : ""}`}
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          {user && isAdmin && (
            <Link
              to="/admin"
              className={`nav-link ${location.pathname === "/admin" ? "active" : ""}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <FaCog /> Admin
            </Link>
          )}

          {user && (
            <>
              <Link
                to="/account"
                className={`nav-link ${location.pathname === "/account" ? "active" : ""}`}
                onClick={() => setIsMenuOpen(false)}
              >
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