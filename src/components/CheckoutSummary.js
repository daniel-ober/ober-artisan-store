import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './CheckoutSummary.css';

const CheckoutSummary = () => {
  const location = useLocation();
  const { clearCartOnCheckout } = useCart();
  const [orderDetails, setOrderDetails] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');
    if (!sessionId) {
      setError('Session ID missing.');
      return;
    }

    (async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/orders/by-session/${sessionId}`
        );
        if (response.status === 404) {
          setError(
            'Order not found — session may have expired or been cancelled.'
          );
          return;
        }
        if (!response.ok) throw new Error('Failed to fetch order details');
        const data = await response.json();
        setOrderDetails(data);
        clearCartOnCheckout();
      } catch (err) {
        setError(`Error loading order: ${err.message}`);
      }
    })();
  }, [location.search]);

  const printReceipt = () => window.print();

  if (error) return <div className="checkout-error">{error}</div>;
  if (!orderDetails)
    return <div className="loading">Loading your order details...</div>;

  const {
    orderId: fullOrderId,
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    paymentMethod,
    cardDetails = {},
    status,
    items = [],
    totalAmount = 0,
    currency = 'usd',
    createdAt,
    systemHistory = [],
  } = orderDetails;

  const orderId = fullOrderId?.startsWith('ORD-')
    ? fullOrderId.slice(4)
    : fullOrderId;

  const cardBrandMap = {
    visa: 'VISA',
    mastercard: 'MC',
    amex: 'AMEX',
    discover: 'DISC',
  };

  const formattedCardBrand =
    cardBrandMap[cardDetails.brand?.toLowerCase()] ||
    cardDetails.brand?.toUpperCase() ||
    'N/A';

  const orderDate = createdAt?._seconds
    ? new Date(createdAt._seconds * 1000).toLocaleString()
    : createdAt?.seconds
      ? new Date(createdAt.seconds * 1000).toLocaleString()
      : 'N/A';

  return (
    <div className="transaction-success print-container">
      <div className="print-logo-wrapper">
        <img
          src="/logos/black_logo.png"
          alt="Business Logo"
          className="print-logo"
        />
      </div>
      <h1>Order {status === 'Order Completed' ? 'Successful!' : status}</h1>

      <div className="order-details">
        <h2>Order Summary</h2>
        <p>
          <strong>Order ID:</strong> {orderId || 'N/A'}
        </p>
        <p>
          <strong>Date:</strong> {orderDate}
        </p>
        <p>
          <strong>Status:</strong> {status}
        </p>

        <h3>Customer Info</h3>
        <p>
          <strong>Name:</strong> {customerName || 'N/A'}
        </p>
        <p>
          <strong>Email:</strong> {customerEmail || 'N/A'}
        </p>
        {customerPhone && customerPhone !== 'No phone provided' && (
          <p>
            <strong>Phone:</strong> {customerPhone}
          </p>
        )}

        <h3>Shipping Address</h3>
        <p>{customerAddress || 'N/A'}</p>

        <h3>Payment Info</h3>
        <p>
          <strong>Method:</strong> {paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1) || 'N/A'}
        </p>
        <p>
          <strong>Card:</strong> {formattedCardBrand} ****
          {cardDetails.lastFour || 'XXXX'}
        </p>

        <h3>Items</h3>
        <ul className="checkout-summary-items">
          {items.map((item, idx) => (
            <li key={idx} className="checkout-summary-item">
              <strong>{item.name}</strong> — ${item.price.toFixed(2)} ×{' '}
              {item.quantity}
            </li>
          ))}
        </ul>

        <h3>Total Amount</h3>
        <p>
          ${totalAmount.toFixed(2)} {currency.toUpperCase()}
        </p>

        <button onClick={printReceipt} className="print-btn">
          Print Receipt
        </button>
      </div>
    </div>
  );
};

export default CheckoutSummary;
