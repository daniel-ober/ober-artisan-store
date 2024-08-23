import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthenticationContext } from '../AuthenticationContext';

const NavBar = () => {
  const { user } = useContext(AuthenticationContext);
  const cartItems = 5; // Replace with actual cart item count

  return (
    <nav>
      <Link to="/">
        <img src="/ober-artisan-logo-large.png" alt="Logo" style={{ width: '200px' }} /> {/* Adjust size as needed */}
      </Link>
      {user ? (
        <>
          <Link to="/shop">Shop</Link>
          {cartItems > 0 && <Link to="/checkout">Checkout</Link>}
        </>
      ) : (
        <Link to="/signin">Sign In</Link>
      )}
    </nav>
  );
};

export default NavBar;
