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
    const totalAmount = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    setTotal(totalAmount);
  };

  const removeItem = (id) => {
    const updatedItems = cartItems.filter(item => item._id !== id);
    setCartItems(updatedItems);
    localStorage.setItem('cartItems', JSON.stringify(updatedItems));
    calculateTotal(updatedItems);
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
            cartItems.map(item => (
              <tr key={item._id}>
                <td className="action-cell">
                  <button className="remove-button" onClick={() => removeItem(item._id)}>X</button>
                </td>
                <td className="image-cell">
                  <img src={item.imageUrl || '/path/to/placeholder-image.jpg'} alt={item.name} className="cart-image" />
                </td>
                <td className="description-cell">{item.name}</td>
                <td className="price-cell">${item.price.toFixed(2)}</td>
                <td className="quantity-cell">{item.quantity}</td>
                <td className="subtotal-cell">${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))
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
    </div>
  );
};

export default Cart;
