import React, { useRef, useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCartPlus, FaSignOutAlt, FaCog } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { DarkModeContext } from '../context/DarkModeContext';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebaseConfig';
import CartPreview from './CartPreview';
import './NavBar.css';

const VAULT_LOGO_LIGHT = '/legacy-vault-nav/black2.png';
const VAULT_LOGO_DARK = '/legacy-vault-nav/white2.png';
const VAULT_ROUTE = '/artisan-shop/soundlegend/vault';

const NavBar = () => {
  const [navbarLinks, setNavbarLinks] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartPreviewOpen, setIsCartPreviewOpen] = useState(false);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  const [userProjects, setUserProjects] = useState([]);
  const [hasSLClaim, setHasSLClaim] = useState(false);
  const [claimsReady, setClaimsReady] = useState(false);

  const [impersonateUid, setImpersonateUid] = useState(
    () => sessionStorage.getItem('impersonateUid') || ''
  );

  useEffect(() => {
    const sync = () =>
      setImpersonateUid(sessionStorage.getItem('impersonateUid') || '');

    sync();
    window.addEventListener('impersonation-changed', sync);
    return () => window.removeEventListener('impersonation-changed', sync);
  }, []);

  const { isDarkMode } = useContext(DarkModeContext);
  const { user, isAdmin, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  const cartItemCount = Object.values(cart).reduce(
    (total, item) => total + item.quantity,
    0
  );

  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const cartRef = useRef(null);
  const navbarRef = useRef(null);

  const isImpersonating = !!impersonateUid;

  const canShowSoundLegendUI =
    (!isAdmin && hasSLClaim) || (isAdmin && isImpersonating);

  useEffect(() => {
    const refreshClaims = async () => {
      setClaimsReady(false);
      setHasSLClaim(false);
      setUserProjects([]);

      if (!user) {
        setClaimsReady(true);
        return;
      }

      try {
        const token = await getAuth().currentUser?.getIdTokenResult(true);
        const c = token?.claims || {};
        setHasSLClaim(!!(c.soundlegend || c.isSoundlegend));
      } catch {
        setHasSLClaim(false);
      } finally {
        setClaimsReady(true);
      }
    };

    refreshClaims();
  }, [user]);

  useEffect(() => {
    const run = async () => {
      if (!user || !claimsReady) return;

      if (!canShowSoundLegendUI) {
        setUserProjects([]);
        return;
      }

      try {
        const emailLower = (user.email || '').trim().toLowerCase();

        let q1 = query(
          collection(db, 'projects'),
          where('customer.emailLower', '==', emailLower),
          orderBy('updatedAt', 'desc'),
          limit(50)
        );
        let snap = await getDocs(q1);

        if (snap.empty) {
          const q2 = query(
            collection(db, 'projects'),
            where('customer.email', '==', user.email || ''),
            limit(50)
          );
          snap = await getDocs(q2);
        }

        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setUserProjects(
          list.map((p) => ({
            projectId: p.projectId || p.id,
            title: p.title || p.projectId || p.id,
          }))
        );
      } catch (err) {
        console.warn(
          'User projects query skipped/denied:',
          err?.message || err
        );
        setUserProjects([]);
      }
    };

    run();
  }, [user, claimsReady, canShowSoundLegendUI]);

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

        const links = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        const transformed = links
          .filter((l) => (l.name || '').toLowerCase() !== 'artisan-shop')
          .map((l) =>
            (l.name || '').toLowerCase() === 'founders-batch'
              ? { ...l, label: 'Artisan Drums' }
              : l
          );

        setNavbarLinks(transformed);
      } catch (err) {
        console.error('❌ Navbar fetch error:', err);
      }
    };
    fetchNavbarLinks();
  }, []);

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
      type="button"
      className="nav-btn cart-icon"
      aria-label="Cart"
      onClick={(e) => {
        e.stopPropagation();
        setIsCartPreviewOpen((prev) => !prev);
      }}
    >
      <FaCartPlus className="nav-icon" />
      <span
        className="cart-badge"
        style={{ display: cartItemCount > 0 ? 'inline-block' : 'none' }}
      >
        {cartItemCount}
      </span>
    </button>
  );

  const filteredLinks = navbarLinks.filter((link) => {
    const access = link.access || [];
    const name = (link.name || '').toLowerCase();
    const label = (link.label || '').toLowerCase();

    const isContact = name.includes('contact') || label.includes('contact');
    const isEndorsements =
      name.includes('endorsement') || label.includes('endorsement');
    const isAccount = name.includes('account') || label.includes('account');
    if (isContact || isEndorsements || isAccount) return false;

    if (link.enabled && access.includes('public')) return true;
    if (user && isAdmin && access.includes('admin')) return true;

    if (user && canShowSoundLegendUI && access.includes('soundlegend'))
      return true;

    return false;
  });

  const renderLegacyVaultLogo = () => {
    const isStickyContext = showStickyHeader;
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

  const renderPortalLink = () => {
    if (!user) return null;
    if (!canShowSoundLegendUI) return null;

    return (
      <Link
        to="/legacy"
        className="nav-link"
        onClick={() => handleNavLinkClick('/legacy')}
        title="SoundLegend Portal"
      >
        Artist Portal
      </Link>
    );
  };

  const renderSoundLegendTab = () => {
    if (!user) return null;
    if (!canShowSoundLegendUI) return null;
    if (userProjects.length === 0) return null;

    return (
      <div className="nav-link dropdown">
        <span className="dropdown-label">SoundLegend ▾</span>
        <div className="dropdown-menu">
          {userProjects.map((proj) => (
            <div
              key={proj.projectId}
              className="dropdown-item"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(false);
                navigate(`/projects/${proj.projectId}`);
              }}
            >
              {proj.title}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFoundersToastLink = () => (
    <Link
      to="/artisan-shop/founders-toast"
      className="nav-link"
      onClick={() => handleNavLinkClick('/artisan-shop/founders-toast')}
    >
      Founder’s Toast
    </Link>
  );

  return (
    <>
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

            {!isMobileView ? (
              <div className="navbar-links sticky-dropdown" ref={menuRef}>
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
                {renderPortalLink()}
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
                  <button
                    type="button"
                    className="nav-btn nav-signout"
                    onClick={handleSignOut}
                    aria-label="Sign out"
                    title="Sign out"
                  >
                    <FaSignOutAlt className="nav-icon" />
                    <span className="nav-signout-text">Sign Out</span>
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
              <button
                type="button"
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
                {renderPortalLink()}
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
                  <button
                    type="button"
                    className="nav-btn nav-signout"
                    onClick={handleSignOut}
                    aria-label="Sign out"
                    title="Sign out"
                  >
                    <FaSignOutAlt className="nav-icon" />
                    <span className="nav-signout-text">Sign Out</span>
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
            type="button"
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
              {renderPortalLink()}
              {renderSoundLegendTab()}
              {renderLegacyVaultLogo()}

              {user && isAdmin && (
                <Link
                  to="/admin"
                  className="nav-link"
                  onClick={() => handleNavLinkClick('/admin')}
                  title="Admin"
                >
                  <FaCog className="nav-icon" /> <span>Admin</span>
                </Link>
              )}

              {user && (
                <button
                  type="button"
                  className="nav-btn nav-signout"
                  onClick={handleSignOut}
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <FaSignOutAlt className="nav-icon" />
                  <span className="nav-signout-text">Sign Out</span>
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
