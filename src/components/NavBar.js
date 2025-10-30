import React, { useRef, useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaCartPlus, FaSignOutAlt, FaCog } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { DarkModeContext } from '../context/DarkModeContext';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import CartPreview from './CartPreview';
import './NavBar.css';

/** ⚙️ Paths to the Legacy Vault logo assets in /public */
const VAULT_LOGO_LIGHT = '/legacy-vault-nav/black2.png'; // LIGHT theme uses black mark
const VAULT_LOGO_DARK = '/legacy-vault-nav/white2.png'; // DARK theme uses white mark

/** 🔗 Where the Vault logo should link */
const VAULT_ROUTE = '/artisan-shop/soundlegend/vault';

const NavBar = () => {
  const [navbarLinks, setNavbarLinks] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartPreviewOpen, setIsCartPreviewOpen] = useState(false);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  const [userProjects, setUserProjects] = useState([]);
  const [isSoundlegend, setIsSoundlegend] = useState(false);

  const { isDarkMode } = useContext(DarkModeContext);
  const { user, isAdmin, logout } = useAuth();
  const { cart } = useCart();
  const location = useLocation();

  const cartItemCount = Object.values(cart).reduce(
    (total, item) => total + item.quantity,
    0
  );

  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const cartRef = useRef(null);
  const navbarRef = useRef(null);
  const navigate = useNavigate();

  const fetchUserProjects = async () => {
    if (!user?.uid) return;
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProjects(data.projects || []);
        setIsSoundlegend(!!data.isSoundlegend);
      }
    } catch (err) {
      console.error('Failed to fetch user projects:', err);
    }
  };

  /** 🧹 Remove: Contact/Endorsements/Account from navbar set */
  const filteredLinks = navbarLinks.filter((link) => {
    const access = link.access || [];
    const name = (link.name || '').toLowerCase();
    const label = (link.label || '').toLowerCase();

    // Exclude from NAVBAR (but can appear in footer): contact, endorsements, account
    const isContact = name.includes('contact') || label.includes('contact');
    const isEndorsements =
      name.includes('endorsement') || label.includes('endorsement');
    const isAccount = name.includes('account') || label.includes('account');
    if (isContact || isEndorsements || isAccount) return false;

    if (link.enabled && access.includes('public')) return true;
    if (user && isAdmin && access.includes('admin')) return true;
    if (user && isSoundlegend && access.includes('soundlegend')) return true;

    return false;
  });

  useEffect(() => {
    if (user?.uid) fetchUserProjects();
  }, [user]);

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
      const isNowMobile = window.innerWidth <= 768;
      setIsMobileView(isNowMobile);
      if (!isNowMobile) setIsMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchNavbarLinks = async () => {
      try {
        const navbarLinksCollection = collection(
          db,
          'settings',
          'site',
          'navbarLinks'
        );
        const snapshot = await getDocs(navbarLinksCollection);

        // Base list from Firestore
        const links = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => a.order - b.order);

        // Transform:
        // 1) Rename "founders-batch" label -> "Artisan Drums"
        // 2) Remove "artisan-shop" from navbar
        const transformed = links
          .filter((l) => (l.name || '').toLowerCase() !== 'artisan-shop')
          .map((l) => {
            if ((l.name || '').toLowerCase() === 'founders-batch') {
              return { ...l, label: 'Artisan Drums' }; // or 'Our Drums'
            }
            return l;
          });

        setNavbarLinks(transformed);
      } catch (err) {
        console.error('❌ Navbar fetch error:', err);
      }
    };
    fetchNavbarLinks();
  }, []);

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
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleNavLinkClick = (path) => {
    navigate(path);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'auto' }), 10);
    setIsMenuOpen(false);
  };

  const renderCartButton = () => (
    <button
      className="cart-icon nav-link"
      onClick={(e) => {
        e.stopPropagation();
        setIsCartPreviewOpen((prev) => !prev);
      }}
    >
      <FaCartPlus />
      <span
        className="cart-badge"
        style={{ display: cartItemCount > 0 ? 'inline-block' : 'none' }}
      >
        {cartItemCount}
      </span>
    </button>
  );

  const renderSoundLegendTab = () => {
    if (!user || !isSoundlegend || userProjects.length === 0) return null;
    return (
      <div className="nav-link dropdown">
        <span className="dropdown-label">SoundLegend ▾</span>
        <div className="dropdown-menu">
          {userProjects?.map((proj) => (
            <div
              key={proj.projectId}
              className="dropdown-item"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(false);
                navigate(`/projects/${proj.projectId}`);
              }}
            >
              {proj.projectId}
            </div>
          ))}
        </div>
      </div>
    );
  };

  /** 🎁 Static link for Founder’s Toast */
  const renderFoundersToastLink = () => (
    <Link
      to="/artisan-shop/founders-toast"
      className="nav-link"
      onClick={() => handleNavLinkClick('/artisan-shop/founders-toast')}
    >
      Founder’s Toast
    </Link>
  );

  /** 🎯 Legacy Vault logo link (auto-picks light/dark asset) */
  const renderLegacyVaultLogo = () => {
    // Sticky mini (or sticky mobile dropdown) sits on a dark sheet → always white mark
    const isStickyContext = showStickyHeader;

    // In main (non-sticky) navbar: black in light mode, white in dark mode
    const vaultLogoSrc = isStickyContext
      ? VAULT_LOGO_DARK
      : isDarkMode
        ? VAULT_LOGO_DARK
        : VAULT_LOGO_LIGHT;

    return (
      <Link
        to={VAULT_ROUTE}
        className="vault-logo-link"
        onClick={() => handleNavLinkClick(VAULT_ROUTE)}
        aria-label="Legacy Vault"
        title="Legacy Vault"
      >
        <img
          src={vaultLogoSrc}
          alt="Legacy Vault"
          className="vault-logo-img"
          loading="eager"
          decoding="async"
        />
      </Link>
    );
  };

  return (
    <>
      {/* ===== Sticky (mini) navbar ===== */}
      {showStickyHeader && (
        <div className="navbar-sticky-wrapper">
          <div className="navbar-sticky-mini">
            <Link to="/" onClick={() => handleNavLinkClick('/')}>
              <img
                src={process.env.REACT_APP_LOGO_LIGHT}
                alt="Sticky Logo"
                className="sticky-logo-img"
              />
            </Link>

            {/* Desktop sticky links */}
            {!isMobileView ? (
              <div className={`navbar-links sticky-dropdown`} ref={menuRef}>
                <Link
                  to="/"
                  className="nav-link"
                  onClick={() => handleNavLinkClick('/')}
                >
                  Home
                </Link>

                {filteredLinks
                  .filter((l) => l.name.toLowerCase() !== 'home')
                  .map((link) => (
                    <Link
                      key={link.id}
                      to={`/${link.name}`}
                      className="nav-link"
                      onClick={() => handleNavLinkClick(`/${link.name}`)}
                    >
                      {link.label}
                    </Link>
                  ))}

                {renderFoundersToastLink()}
                {renderSoundLegendTab()}
                {renderLegacyVaultLogo()}

                {user && isAdmin && (
                  <Link
                    to="/admin"
                    className="nav-link"
                    onClick={() => handleNavLinkClick('/admin')}
                  >
                    <FaCog /> Admin
                  </Link>
                )}

                {/* Sign out (Account removed) */}
                {user && (
                  <button className="nav-link-signout" onClick={handleSignOut}>
                    <FaSignOutAlt /> Sign Out
                  </button>
                )}

                {renderCartButton()}

                {isCartPreviewOpen && showStickyHeader && (
                  <div className="cart-preview-container" ref={cartRef}>
                    <CartPreview
                      onClose={() => setIsCartPreviewOpen(false)}
                      closeMenu={() => setIsMenuOpen(false)}
                    />
                  </div>
                )}
              </div>
            ) : (
              /* Mobile sticky: menu button */
              <button
                className="navbar-sticky-menu"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                aria-expanded={isMenuOpen}
                aria-label="Toggle menu"
                ref={buttonRef}
              >
                <img
                  src={
                    isMenuOpen
                      ? '/menu/close-button-dark-mode.png'
                      : '/menu/menu-button-dark-mode.png'
                  }
                  alt="Menu Toggle"
                  className={`menu-arrow-icon ${isMenuOpen ? 'open' : ''}`}
                />
              </button>
            )}
          </div>

          {/* Mobile sticky dropdown */}
          {isMobileView && isMenuOpen && (
            <div className="navbar-sticky-dropdown-wrapper">
              <div className="navbar-links sticky-dropdown open" ref={menuRef}>
                <Link
                  to="/"
                  className="nav-link"
                  onClick={() => handleNavLinkClick('/')}
                >
                  Home
                </Link>

                {filteredLinks
                  .filter((l) => l.name.toLowerCase() !== 'home')
                  .map((link) => (
                    <Link
                      key={link.id}
                      to={`/${link.name}`}
                      className="nav-link"
                      onClick={() => handleNavLinkClick(`/${link.name}`)}
                    >
                      {link.label}
                    </Link>
                  ))}

                {renderFoundersToastLink()}
                {renderSoundLegendTab()}
                {renderLegacyVaultLogo()}

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
                  <button className="nav-link-signout" onClick={handleSignOut}>
                    <FaSignOutAlt /> Sign Out
                  </button>
                )}

                {renderCartButton()}

                {isCartPreviewOpen && showStickyHeader && (
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

      {/* ===== Main (non-sticky) navbar ===== */}
      <nav className="navbar" ref={navbarRef}>
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

        {isMobileView && !showStickyHeader && (
          <button
            className="navbar-menu-container"
            onClick={() => setIsMenuOpen((prev) => !prev)}
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

        {!showStickyHeader && (isMenuOpen || !isMobileView) && (
          <div className="navbar-links-wrapper">
            <div
              className={`navbar-links ${isMobileView && isMenuOpen ? 'open' : ''}`}
              ref={menuRef}
            >
              <Link
                to="/"
                className="nav-link"
                onClick={() => handleNavLinkClick('/')}
              >
                Home
              </Link>

              {filteredLinks
                .filter((l) => l.name.toLowerCase() !== 'home')
                .map((link) => (
                  <Link
                    key={link.id}
                    to={`/${link.name}`}
                    className="nav-link"
                    onClick={() => handleNavLinkClick(`/${link.name}`)}
                  >
                    {link.label}
                  </Link>
                ))}

              {renderFoundersToastLink()}
              {renderSoundLegendTab()}
              {renderLegacyVaultLogo()}

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
                <button className="nav-link-signout" onClick={handleSignOut}>
                  <FaSignOutAlt /> Sign Out
                </button>
              )}

              {renderCartButton()}

              {isCartPreviewOpen && !showStickyHeader && (
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
