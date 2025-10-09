import React, { useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DarkModeContext } from '../context/DarkModeContext';
import { useAuth } from '../context/AuthContext';
import './Footer.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebookF, faInstagram, faYoutube } from '@fortawesome/free-brands-svg-icons';

const Footer = ({ navbarLinks = [] }) => {
  const { user, isAdmin } = useAuth();
  const isSoundlegend = user?.isSoundlegend || false;

  // Base filtering by access controls
  const baseFiltered = navbarLinks.filter((link) => {
    const access = link.access || [];
    if (!link.enabled) return false;

    if (!user && access.includes('public')) return true;
    if (user && isAdmin && access.includes('admin')) return true;
    if (user && isSoundlegend && access.includes('soundlegend')) return true;
    if (access.includes('public')) return true;

    return false;
  });

  // Transform footer links to reflect new nav rules:
  // - remove "artisan-shop"
  // - rename "founders-batch" to "Artisan Drums" (label only)
  const transformed = baseFiltered
    .filter((l) => (l.name || '').toLowerCase() !== 'artisan-shop')
    .map((l) => {
      if ((l.name || '').toLowerCase() === 'founders-batch') {
        return { ...l, label: 'Artisan Drums' }; // or 'Our Drums'
      }
      return l;
    });

  // Final ordering (exclude Home from the list – it’s added manually first)
  const sortedFilteredLinks = [...transformed]
    .filter((link) => (link.name || '').toLowerCase() !== 'home')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const { isDarkMode, setIsDarkMode } = useContext(DarkModeContext);

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    const defaultMode = savedMode === 'true';
    setIsDarkMode(defaultMode);
    document.body.classList.remove('dark', 'light');
    document.body.classList.add(defaultMode ? 'dark' : 'light');
  }, [setIsDarkMode]);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    document.body.classList.remove('dark', 'light');
    document.body.classList.add(newMode ? 'dark' : 'light');
  };

  const handleScrollTop = () => {
    setTimeout(() => {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 10);
  };

  return (
    <footer className="footer-container">
      {/* Sitemap Section */}
      <div className="footer-sitemap">
        <div className="footer-title">Sitemap</div>
        <ul>
          <li>
            <Link to="/" onClick={handleScrollTop}>
              Home
            </Link>
          </li>

          {sortedFilteredLinks.map((link, index) => (
            <li key={index}>
              <Link
                to={`/${(link.name || '').toLowerCase().replace(/\s+/g, '-')}`}
                onClick={handleScrollTop}
              >
                {link.label}
              </Link>
            </li>
          ))}

          {/* Explicit additions / footer-only links */}
          <li>
            <Link to="/artisan-shop/founders-toast" onClick={handleScrollTop}>
              Founder’s Toast
            </Link>
          </li>
          <li>
            <Link to="/artisan-shop/soundlegend/vault" onClick={handleScrollTop}>
              Legacy Vault
            </Link>
          </li>
          <li>
            <Link to="/endorsements" onClick={handleScrollTop}>
              Endorsements
            </Link>
          </li>
          <li>
            <Link to="/return-policy" onClick={handleScrollTop}>
              Return Policy
            </Link>
          </li>
          <li>
            <Link to="/privacy-policy" onClick={handleScrollTop}>
              Privacy Policy
            </Link>
          </li>
          <li>
            <Link to="/terms-of-service" onClick={handleScrollTop}>
              Terms of Service
            </Link>
          </li>
        </ul>
      </div>

      {/* Social Media Icons */}
      <div className="footer-socials">
        <a
          href="https://www.facebook.com/profile.php?id=61570228293616"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
        >
          <FontAwesomeIcon icon={faFacebookF} />
        </a>
        <a
          href="https://www.instagram.com/oberartisandrums/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
        >
          <FontAwesomeIcon icon={faInstagram} />
        </a>
        <a
          href="https://www.youtube.com/@oberartisandrums"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="YouTube"
        >
          <FontAwesomeIcon icon={faYoutube} />
        </a>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="footer-copyright">
          <p>
            &copy; {new Date().getFullYear()} Dan Ober Artisan Drums. All rights reserved.
          </p>
        </div>
      </div>

      {/* Dark Mode Toggle */}
      <div className="footer-darkmode-toggle">
        <button className="footer-theme-toggle" onClick={toggleDarkMode}>
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
    </footer>
  );
};

export default Footer;