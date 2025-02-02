import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { DarkModeContext } from "../context/DarkModeContext"; 
import './Footer.css';

const Footer = ({ navbarLinks = [] }) => {
  const sortedNavbarLinks = navbarLinks
    .filter((link) => link.enabled)
    .sort((a, b) => a.order - b.order);

  const { isDarkMode, setIsDarkMode } = useContext(DarkModeContext);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("darkMode", newMode.toString());

    document.body.classList.toggle("dark", newMode);
    document.body.classList.toggle("light", !newMode);
  };

  return (
    <footer className="footer-container">
      {/* Sitemap Section (Full Width & On Top) */}
      <div className="footer-sitemap">
        <div className="footer-title">Sitemap</div>
        <ul>
          {sortedNavbarLinks.map((link, index) => (
            <li key={index}>
              <Link to={`/${link.name.toLowerCase().replace(/\s+/g, '-')}`}>
                {link.label}
              </Link>
            </li>
          ))}
          <li><Link to="/return-policy">Return Policy</Link></li>
          <li><Link to="/privacy-policy">Privacy Policy</Link></li>
          <li><Link to="/terms-of-service">Terms of Service</Link></li>
        </ul>
      </div>


      {/* Bottom Row: Contact & Copyright */}
      <div className="footer-bottom">
        <div className="footer-copyright">
          <p>&copy; {new Date().getFullYear()} Dan Ober Artisan Drums. All rights reserved.</p>
        </div>
      </div>
      {/* Dark Mode Toggle */}
      <button className="footer-theme-toggle" onClick={toggleDarkMode}>
        {isDarkMode ? "Light Mode" : "Dark Mode"}
      </button>
    </footer>
  );
};

export default Footer;