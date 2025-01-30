import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = ({ navbarLinks = [] }) => {
  const sortedNavbarLinks = navbarLinks
    .filter((link) => link.enabled)
    .sort((a, b) => a.order - b.order);

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
        {/* Contact Section */}

        {/* Copyright Section */}
        <div className="footer-copyright">
          <p>&copy; {new Date().getFullYear()} Dan Ober Artisan Drums. All rights reserved.</p>
        </div>

        {/* <div className="footer-contact">
          <p className="footer-contact-us">Contact Us</p>
          <p>
            <a href="mailto:support@danoberartisan.com">
              support@danoberartisan.com
            </a>
          </p>
        </div> */}


      </div>
    </footer>
  );
};

export default Footer;