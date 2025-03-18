import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { useCart } from '../context/CartContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import './CheckoutSummary.css';
import ProductDetail from './ProductDetail';

const CheckoutSummary = () => {
  const location = useLocation();
  const { clearCartOnCheckout } = useCart();
  const [orderDetails, setOrderDetails] = useState(null);
  const [isCartCleared, setIsCartCleared] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      const params = new URLSearchParams(location.search);
      const sessionId = params.get('session_id');

      if (!sessionId) {
        console.error('Session ID not found in query parameters');
        return;
      }

      try {
        const API_BASE_URL = process.env.REACT_APP_API_URL;
        const response = await fetch(
          `${API_BASE_URL}/orders/by-session/${sessionId}`
        );
        if (!response.ok) throw new Error('Failed to fetch order details');

        const data = await response.json();
        console.log('✅ Full Order Details from API:', data); // DEBUGGING

        setOrderDetails(data);
      } catch (error) {
        console.error('❌ Error fetching order details:', error);
      }
    };

    fetchOrderDetails();
  }, [location]);

  const updateProductInventory = async (items) => {
    try {
      console.log('🔍 Starting inventory update for items:', items);

      for (const item of items) {
        if (!item.productId) {
          console.warn('⚠️ Skipping item due to missing productId:', item);
          continue; // Skip this item
        }

        console.log(`📌 Checking product ID: ${item.productId}`);

        // Ensure correct Firestore reference
        let productRef;
        if (item.productId === 'feuzon' || item.productId === 'heritage') {
          productRef = doc(db, 'products', item.productId);
        } else {
          productRef = doc(db, 'products', item.productId);
        }

        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
          console.warn(`⚠️ Product not found in Firestore: ${item.productId}`);
          continue;
        }

        const productData = productSnap.data();
        console.log(
          `📊 Current stock for ${item.productId}: ${productData.currentQuantity}`
        );

        const newQuantity = Math.max(
          0,
          (productData.currentQuantity || 0) - (item.quantity || 1)
        );
        console.log(
          `🔄 Updating stock: ${productData.currentQuantity} -> ${newQuantity}`
        );

        await updateDoc(productRef, { currentQuantity: newQuantity });
        console.log(`✅ Inventory updated for ${item.productId}`);
      }

      console.log('✅ Finished updating inventory!');
    } catch (error) {
      console.error('❌ Error updating inventory:', error);
    }
  };

  const printReceipt = () => {
    window.print();
  };

  if (!orderDetails) {
    return <div className="loading">Loading your order details...</div>;
  }

  const {
    id = 'N/A',
    customerName = 'Customer',
    orderDate = new Date().toISOString(),
    items = [],
    subtotal = 0,
    tax = 0,
    shipping = 0,
    discount = 0,
    totalAmount = 0,
    shippingName = 'N/A',
    shippingAddress = 'N/A',
    estimatedDelivery = 'Not available',
    paymentMethod = {},
  } = orderDetails;

  return (
    <div className="transaction-success">
      <h1>Order Successful!</h1>
      <p className="confirmation-msg">
        Your order has been successfully placed.
      </p>

      <div className="order-details">
        <h2>Order Summary</h2>
        <p>
          <strong>Order ID:</strong> {orderDetails.id || 'N/A'}
        </p>
        <p>
          <strong>Order Date:</strong>{' '}
          {new Date(orderDate).toLocaleDateString()}
        </p>
        <h3>Customer Info</h3>
        <p>
          <strong>Name:</strong> {orderDetails.customerName || 'N/A'}
        </p>
        <p>
          <strong>Email:</strong> {orderDetails.customerEmail || 'N/A'}
        </p>
        <p>
          <strong>Phone:</strong> {orderDetails.customerPhone || 'N/A'}
        </p>
        <h3>Shipping Details</h3>
        <p>
          <strong>Address:</strong> {orderDetails.customerAddress || 'N/A'}
        </p>
        {/* <p>
          <strong>Estimated Delivery:</strong>{' '}
          {orderDetails.shippingDetails || 'N/A'}
        </p> */}
        <h3>Payment Info</h3>
        <p>
          <strong>Payment Method:</strong> {orderDetails.paymentMethod.charAt(0).toUpperCase() +
            orderDetails.paymentMethod.slice(1).toLowerCase() || 'N/A'}
        </p>
        <p>
          <strong>Payment Details: </strong>
          {orderDetails.cardDetails?.brand
            ? orderDetails.cardDetails.brand.charAt(0).toUpperCase() +
              orderDetails.cardDetails.brand.slice(1).toLowerCase()
            : 'N/A'} ****{orderDetails.cardDetails?.lastFour || 'XXXX'}
        </p>{' '}
        <h3>Order Items</h3>
        <ul className="checkout-summary-items">
          {orderDetails.items.length > 0 ? (
            orderDetails.items.map((item, index) => (
              <li key={index} className="checkout-summary-item">
                <strong>{item.name}</strong> - ${item.price.toFixed(2)} x {item.quantity}
                <p>Estimated Delivery: {item.shippingDetails}
                  {item.shippingDetails || 'Not available'}
                </p>
              </li>
            ))
          ) : (
            <p>No items found</p>
          )}
        </ul>
        <h3>Order Total</h3>
        <p>
          <strong>Subtotal:</strong> $
          {orderDetails.subtotal?.toFixed(2) || 'N/A'}
        </p>
        <p>
          <strong>Tax:</strong> ${orderDetails.tax?.toFixed(2) || 'N/A'}
        </p>
        <p>
          <strong>Shipping:</strong> $
          {orderDetails.shipping?.toFixed(2) || 'N/A'}
        </p>
        <p className="total">
          <strong>Total Amount:</strong> $
          {orderDetails.totalAmount?.toFixed(2) || 'N/A'}
        </p>
      </div>
    </div>
  );
};

export default CheckoutSummary;
