// src/components/Cart.js

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { getCartItems } from '../services/cartService';
import { useAuth } from '../context/AuthContext';
import CartItem from './CartItem';
import './Cart.css';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth();
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Calculate total whenever cart changes
    calculateTotal(cart);
  }, [cart]);

  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        if (user) {
          const items = await getCartItems(user.uid);
          // Assuming you need to update local cart state or context here
          // For example:
          // updateCart(items); // updateCart function should be defined in CartContext
        }
      } catch (error) {
        console.error('Error fetching cart items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCartItems();
  }, [user]);

  const calculateTotal = (items) => {
    if (!Array.isArray(items)) {
      console.error('Expected items to be an array, but got:', items);
      setTotal(0);
      return;
    }
    const totalAmount = items.reduce((acc, item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      return acc + price * quantity;
    }, 0);
    setTotal(totalAmount);
  };

  const handleCheckout = async () => {
    try {
      const response = await fetch('http://localhost:4949/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products: cart.map(item => ({
            name: item.productName,
            price: item.price,
            quantity: item.quantity,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const session = await response.json();
      // Redirect to the Stripe checkout page
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
        {cart.length > 0 ? (
          cart.map((item) => (
            <CartItem 
              key={item.id} 
              item={item} 
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
        {cart.length > 0 && (
          <button className="checkout-button" onClick={handleCheckout}>
            Checkout
          </button>
        )}
      </div>
    </div>
  );
};

export default Cart;
