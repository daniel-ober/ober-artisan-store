import React, { useEffect, useState } from 'react';
import './Cart.css';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    // Fetch cart items from local storage or an API
    const fetchCartItems = () => {
      const items = JSON.parse(localStorage.getItem('cartItems')) || [];
      setCartItems(items);
      calculateTotal(items);
    };

    fetchCartItems();
  }, []);

  const calculateTotal = (items) => {
    const totalAmount = items.reduce((acc, item) => {
      // Ensure item.price and item.quantity are numbers
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      return acc + (price * quantity);
    }, 0);
    setTotal(totalAmount);
  };

  const removeItem = (id) => {
    const updatedItems = cartItems.filter(item => item._id !== id);
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
      <table className="cart-table">
        <thead>
          <tr>
            <th>Action</th>
            <th>Image</th>
            <th>Description</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {cartItems.length > 0 ? (
            cartItems.map(item => {
              // Ensure item.price, item.quantity, and item._id are valid
              const price = Number(item.price) || 0;
              const quantity = Number(item.quantity) || 0;
              return (
                <tr key={item._id}>
                  <td className="action-cell">
                    <button className="remove-button" onClick={() => removeItem(item._id)}>X</button>
                  </td>
                  <td className="image-cell">
                    <img src={item.imageUrl || '/path/to/placeholder-image.jpg'} alt={item.name} className="cart-image" />
                  </td>
                  <td className="description-cell">{item.name}</td>
                  <td className="price-cell">${price.toFixed(2)}</td>
                  <td className="quantity-cell">{quantity}</td>
                  <td className="subtotal-cell">${(price * quantity).toFixed(2)}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="6">No items in cart</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="5" className="grand-total-label">Grand Total</td>
            <td className="grand-total-amount">${total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      {cartItems.length > 0 && (
        <button className="checkout-button" onClick={handleCheckout}>
          Checkout
        </button>
      )}
    </div>
  );
};

export default Cart;
