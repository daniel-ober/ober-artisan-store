import React, { useEffect, useState } from 'react';
import { fetchOrderById, updateOrderInFirestore } from '../services/orderService';

const EditOrderModal = ({ orderId, onClose, onOrderUpdated }) => {
  const [order, setOrder] = useState({ customerName: '', total: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (orderId) {
        try {
          const fetchedOrder = await fetchOrderById(orderId);
          setOrder(fetchedOrder);
        } catch (error) {
          console.error('Error fetching order:', error);
          setError('Error fetching order: ' + error.message);
        }
      }
      setLoading(false);
    };
    fetchOrder();
  }, [orderId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOrder((prevOrder) => ({ ...prevOrder, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateOrderInFirestore(orderId, order);
      onOrderUpdated({ id: orderId, ...order });
      onClose();
    } catch (error) {
      console.error('Error saving order:', error);
      setError('Error saving order: ' + error.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Edit Order</h2>
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            name="customerName" 
            value={order.customerName} 
            onChange={handleChange} 
            placeholder="Customer Name" 
            required 
          />
          <input 
            type="number" 
            name="total" 
            value={order.total} 
            onChange={handleChange} 
            placeholder="Total" 
            required 
          />
          <input 
            type="text" 
            name="status" 
            value={order.status} 
            onChange={handleChange} 
            placeholder="Status" 
            required 
          />
          <button type="submit">Update Order</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </form>
      </div>
    </div>
  );
};

export default EditOrderModal;
