import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = ({ navbarLinks = [] }) => {
  // Filter and sort navbarLinks, keeping enabled links and sorting them by order
  const sortedNavbarLinks = navbarLinks
    .filter((link) => link.enabled)  // <== This filters out disabled links
    .sort((a, b) => a.order - b.order); // Ensuring correct order based on the "order" field

  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-section">
          <h2>Sitemap</h2>
          <ul>
            {sortedNavbarLinks.map((link, index) => (
              <li key={index}>
                <Link to={`/${link.name.toLowerCase().replace(/\s+/g, '-')}`}>
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/privacy-policy">Privacy Policy</Link>
            </li>
            <li>
              <Link to="/terms-of-service">Terms of Service</Link>
            </li>
            <li>
              <Link to="/return-policy">Return Policy</Link>
            </li>
          </ul>
        </div>
        <div className="footer-section">
          <h2>Contact Us</h2>
          <p>
            Email: <a href="mailto:support@danoberartisan.com">support@danoberartisan.com</a>
          </p>
        </div>
        <div className="footer-section">
          <p>&copy; {new Date().getFullYear()} Dan Ober Artisan Drums. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;