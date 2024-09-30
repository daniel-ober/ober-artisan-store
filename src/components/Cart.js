import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import CartItem from './CartItem';
import './Cart.css';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, loading } = useCart();
  const { user } = useAuth();
  const [total, setTotal] = useState(0);

  // Debugging: Log cart contents
  console.log('Cart Contents:', cart);

  useEffect(() => {
    const calculateTotal = () => {
      const totalAmount = Object.values(cart).reduce((acc, product) => {
        const price = Number(product.price) || 0;
        const quantity = Number(product.quantity) || 0;
        return acc + price * quantity;
      }, 0);
      setTotal(totalAmount);
    };

    calculateTotal();
  }, [cart]);

  const handleCheckout = async () => {
    try {
      const response = await fetch('http://localhost:4949/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products: Object.values(cart).map(product => ({
            name: product.productId,
            price: product.priceId,
            quantity: product.quantity,
          })),
          userId: user?.uid,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const session = await response.json();
      window.location.href = session.url;
    } catch (error) {
      console.error('Failed to redirect to checkout:', error);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h2 className="cart-title">Your Shopping Cart</h2>
        <Link to="/products" className="continue-shopping-link">
          <FaArrowLeft className="back-icon" />
          Back to Shop/Gallery
        </Link>
      </div>

      <div className="cart-items">
        {Object.keys(cart).length > 0 ? (
          Object.values(cart).map((product) => (
            <CartItem 
              key={product.productId} 
              item={product} 
              updateQuantity={updateQuantity}
              removeFromCart={removeFromCart}
            />
          ))
        ) : (
          <p className="empty-cart-message">Your cart is currently empty.</p>
        )}
      </div>

      <div className="cart-summary">
        <p className="cart-total">Total: ${total.toFixed(2)}</p>
        {Object.keys(cart).length > 0 && (
          <button className="checkout-button" onClick={handleCheckout}>
            Checkout
          </button>
        )}
      </div>
    </div>
  );
};

export default Cart;
