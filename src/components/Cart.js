import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa'; // Importing FontAwesome arrow left icon
import './Cart.css';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchCartItems = () => {
      const items = JSON.parse(localStorage.getItem('cartItems')) || [];
      setCartItems(items);
      calculateTotal(items);
    };

    fetchCartItems();
  }, []);

  const calculateTotal = (items) => {
    const totalAmount = items.reduce((acc, item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      return acc + (price * quantity);
    }, 0);
    setTotal(totalAmount);
  };

  const removeItem = (id) => {
    const updatedItems = cartItems.filter((item) => item._id !== id);
    setCartItems(updatedItems);
    localStorage.setItem('cartItems', JSON.stringify(updatedItems));
    calculateTotal(updatedItems);
  };

  const increaseQuantity = (id) => {
    const updatedItems = cartItems.map((item) => {
      if (item._id === id && item.price < 500) {
        item.quantity += 1;
      }
      return item;
    });
    setCartItems(updatedItems);
    localStorage.setItem('cartItems', JSON.stringify(updatedItems));
    calculateTotal(updatedItems);
  };

  const decreaseQuantity = (id) => {
    const updatedItems = cartItems.map((item) => {
      if (item._id === id && item.quantity > 1 && item.price < 500) {
        item.quantity -= 1;
      }
      return item;
    });
    setCartItems(updatedItems);
    localStorage.setItem('cartItems', JSON.stringify(updatedItems));
    calculateTotal(updatedItems);
  };

  const handleCheckout = async () => {
    try {
      const response = await fetch('http://localhost:4949/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            name: item.name,
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

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h2 className="cart-title">Your Shopping Cart</h2>
        <Link to="/shop" className="continue-shopping-link">
          <FaArrowLeft className="back-icon" />
          Back to Shop/Gallery
        </Link>
      </div>

      <div className="cart-items">
        {cartItems.length > 0 ? (
          cartItems.map(item => {
            const price = Number(item.price) || 0;
            const quantity = Number(item.quantity) || 0;
            const isExpensive = price >= 500;
            return (
              <div key={item._id} className="cart-item">
                <img src={item.imageUrl || '/path/to/placeholder-image.jpg'} alt={item.name} className="cart-item-image" />
                <div className="cart-item-details">
                  <h3 className="cart-item-name">{item.name}</h3>
                  <p className="cart-item-price">${price.toFixed(2)}</p>
                  {price < 500 ? (
                    <div className="cart-item-quantity">
                      <button
                        className={`quantity-btn ${quantity === 1 ? 'disabled' : ''}`}
                        data-tooltip={quantity === 1 ? 'Minimum quantity reached. Please use "Remove" to take this item out of your cart.' : ''}
                        onClick={() => decreaseQuantity(item._id)}
                      >
                        -
                      </button>
                      <span className="quantity-value">{quantity}</span>
                      <button
                        className="quantity-btn"
                        onClick={() => increaseQuantity(item._id)}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <div className="cart-item-quantity">
                      <button
                        className="quantity-btn disabled"
                        data-tooltip="Quantity cannot be adjusted. This item is 1 of 1."
                      >
                        -
                      </button>
                      <span className="quantity-value">{quantity}</span>
                      <button
                        className="quantity-btn disabled"
                        data-tooltip="Quantity cannot be adjusted. This item is 1 of 1."
                      >
                        +
                      </button>
                    </div>
                  )}
                  <button className="remove-btn" onClick={() => removeItem(item._id)}>Remove</button>
                </div>
                <p className="cart-item-subtotal">Subtotal: ${(price * quantity).toFixed(2)}</p>
              </div>
            );
          })
        ) : (
          <p className="empty-cart-message">Your cart is currently empty.</p>
        )}
      </div>

      <div className="cart-summary">
        <p className="cart-total">Total: ${total.toFixed(2)}</p>
        {cartItems.length > 0 && (
          <button className="checkout-btn" onClick={handleCheckout}>
            Proceed to Checkout
          </button>
        )}
      </div>
    </div>
  );
};

export default Cart;
