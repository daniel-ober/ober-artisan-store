import React, { useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './AddOrderModal.css';

const AddOrderModal = ({ onClose, onOrderAdded }) => {
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    shippingAddress: '',
    billingAddress: '',
    status: 'pending',
    items: [],
    subtotal: 0,
    taxes: 0,
    shipping: 0,
    total: 0,
  });

  const [item, setItem] = useState({ name: '', description: '', price: 0, quantity: 1 });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewOrder((prev) => ({
      ...prev,
      [name]: name === 'subtotal' || name === 'taxes' || name === 'shipping' || name === 'total'
        ? parseFloat(value) || 0
        : value,
    }));
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setItem((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'quantity' ? parseFloat(value) || 0 : value,
    }));
  };

  const addItem = () => {
    if (!item.name || !item.price || item.quantity <= 0) {
      setError('Please provide valid item details.');
      return;
    }

    setNewOrder((prev) => ({
      ...prev,
      items: [...prev.items, item],
      subtotal: prev.subtotal + item.price * item.quantity,
    }));
    setItem({ name: '', description: '', price: 0, quantity: 1 });
    setError('');
  };

  const removeItem = (index) => {
    const itemToRemove = newOrder.items[index];
    setNewOrder((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
      subtotal: prev.subtotal - itemToRemove.price * itemToRemove.quantity,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (newOrder.items.length === 0) {
      setError('Please add at least one item to the order.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const taxes = newOrder.subtotal * 0.1; // Assuming 10% tax rate
      const total = newOrder.subtotal + taxes + newOrder.shipping;

      const orderData = {
        ...newOrder,
        taxes,
        total,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);

      setSuccessMessage('Order added successfully!');
      onOrderAdded({ id: docRef.id, ...orderData });
      setNewOrder({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        shippingAddress: '',
        billingAddress: '',
        status: 'pending',
        items: [],
        subtotal: 0,
        taxes: 0,
        shipping: 0,
        total: 0,
      });
    } catch (err) {
      setError('Failed to add order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-order-modal">
      <div className="modal-content">
        <h2>Add New Order</h2>
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="customerName">Customer Name</label>
            <input
              id="customerName"
              type="text"
              name="customerName"
              value={newOrder.customerName}
              onChange={handleInputChange}
              autoComplete="name"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="customerEmail">Customer Email</label>
            <input
              id="customerEmail"
              type="email"
              name="customerEmail"
              value={newOrder.customerEmail}
              onChange={handleInputChange}
              autoComplete="email"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="customerPhone">Customer Phone</label>
            <input
              id="customerPhone"
              type="text"
              name="customerPhone"
              value={newOrder.customerPhone}
              onChange={handleInputChange}
              autoComplete="tel"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="shippingAddress">Shipping Address</label>
            <input
              id="shippingAddress"
              type="text"
              name="shippingAddress"
              value={newOrder.shippingAddress}
              onChange={handleInputChange}
              autoComplete="shipping street-address"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="billingAddress">Billing Address</label>
            <input
              id="billingAddress"
              type="text"
              name="billingAddress"
              value={newOrder.billingAddress}
              onChange={handleInputChange}
              autoComplete="billing street-address"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={newOrder.status}
              onChange={handleInputChange}
              autoComplete="off"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="shipping">Shipping</label>
            <input
              id="shipping"
              type="number"
              name="shipping"
              value={newOrder.shipping}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              autoComplete="off"
            />
          </div>

          <h3>Items</h3>
          <div className="form-group">
            <input
              type="text"
              name="name"
              placeholder="Item Name"
              value={item.name}
              onChange={handleItemChange}
              autoComplete="off"
            />
            <input
              type="text"
              name="description"
              placeholder="Description"
              value={item.description}
              onChange={handleItemChange}
              autoComplete="off"
            />
            <input
              type="number"
              name="price"
              placeholder="Price"
              value={item.price}
              onChange={handleItemChange}
              step="0.01"
              min="0"
              autoComplete="off"
            />
            <input
              type="number"
              name="quantity"
              placeholder="Quantity"
              value={item.quantity}
              onChange={handleItemChange}
              min="1"
              autoComplete="off"
            />
            <button type="button" onClick={addItem}>
              Add Item
            </button>
          </div>
          <ul>
            {newOrder.items.map((item, index) => (
              <li key={index}>
                {item.name} - {item.quantity} x ${item.price.toFixed(2)}{' '}
                <button type="button" onClick={() => removeItem(index)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Order'}
          </button>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddOrderModal;
