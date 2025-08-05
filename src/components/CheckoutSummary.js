import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
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
    status,
    items = [],
    totalAmount = 0,
    currency = 'usd',
    createdAt,
  } = orderDetails;

  const orderId = fullOrderId?.startsWith('ORD-')
    ? fullOrderId.slice(4)
    : fullOrderId;

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

      <h1>Order Success</h1>
      <p className="confirmation-msg">
        Thank you for your order! A confirmation email has been sent to{' '}
        <strong>{customerEmail}</strong>.
      </p>

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

        <h3>Items Ordered</h3>
        <ul className="checkout-summary-items">
          {items.map((item, idx) => (
            <li key={idx} className="checkout-summary-item">
              <div>
                <strong>{item.description || item.name || 'Item'}</strong> — $
                {item.price?.toFixed(2)} × {item.quantity}
              </div>

              {/* Friendly, clean variant info */}
              {item.variant &&
                (() => {
                  const v = item.variant;
                  const category =
                    v.category ||
                    (item.name?.toLowerCase().includes('heritage')
                      ? 'artisan'
                      : 'merch');

                  // ✅ Founder's Toast: no options displayed
                  if (item.name?.toLowerCase().includes("founder's toast")) {
                    return null;
                  }

                  // ✅ Merch: show only size and color
                  if (category === 'merch') {
                    return (
                      <div className="variant-details">
                        <strong>Options:</strong>{' '}
                        {[v.size, v.color].filter(Boolean).join(' / ') ||
                          'Standard'}
                      </div>
                    );
                  }

                  // ✅ Artisan Drums: show drum-specific metadata
                  if (category === 'artisan') {
                    const drumOptions = [
                      v.size && `${v.size}" x ${v.depth}"`,
                      v.lugQuantity && `${v.lugQuantity} Lugs`,
                      v.staveQuantity && `${v.staveQuantity} Staves`,
                      v.reRing !== undefined
                        ? v.reRing
                          ? 'With Re-Rings'
                          : 'No Re-Rings'
                        : '',
                      v.hardwareColor && `Hardware: ${v.hardwareColor}`,
                    ].filter(Boolean);

                    return (
                      <div className="variant-details">
                        <strong>Specs:</strong> {drumOptions.join(' • ')}
                      </div>
                    );
                  }

                  return null;
                })()}
            </li>
          ))}
        </ul>

        <h3>Total Amount</h3>
        <p className="total-amount">
          ${totalAmount.toFixed(2)} {currency.toUpperCase()}
        </p>

        <div className="checkout-actions">
          <button onClick={printReceipt} className="print-receipt">
            📄 Print / Download Receipt
          </button>

          <Link to="/" className="continue-shopping">
            🛒 Continue Exploring
          </Link>
        </div>

        <div className="support-contact">
          <p>
            Have questions about your order? <br />
            Contact us at{' '}
            <a href="mailto:support@oberartisandrums.com">
              support@oberartisandrums.com
            </a>{' '}
            and we'll be happy to assist you!
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSummary;
