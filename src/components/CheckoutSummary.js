import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { db } from "../firebaseConfig";
import { useCart } from "../context/CartContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import "./CheckoutSummary.css";
import ProductDetail from "./ProductDetail";

const CheckoutSummary = () => {
  const location = useLocation();
  const { clearCartOnCheckout } = useCart();
  const [orderDetails, setOrderDetails] = useState(null);
  const [isCartCleared, setIsCartCleared] = useState(false);
  const [inventoryUpdated, setInventoryUpdated] = useState(false); // ✅ Prevent duplicate stock updates

  // ✅ Debugging Log: Ensure API URL is correctly loaded
  console.log("🌍 API Base URL:", process.env.REACT_APP_API_URL);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      const params = new URLSearchParams(location.search);
      const sessionId = params.get("session_id");

      if (!sessionId) {
        console.error("❌ Session ID not found in query parameters");
        return;
      }

      try {
        console.log("📡 Fetching Order Details...");
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/orders/by-session/${sessionId}`
        );

        if (!response.ok) throw new Error("Failed to fetch order details");

        const data = await response.json();
<<<<<<< HEAD
        // console.log('✅ Full Order Details from API:', data); // DEBUGGING
=======
        console.log("✅ Order Details from API:", data);
>>>>>>> 171bfa47 (WORKING PRODUCTION SITE WITH STRIPE CHECKOUTgit status)

        setOrderDetails(data);
      } catch (error) {
        console.error("❌ Error fetching order details:", error);
      }
    };

    fetchOrderDetails();
  }, [location]);

  const updateProductInventory = async (items) => {
    if (inventoryUpdated) return; // ✅ Prevent duplicate inventory updates

    try {
<<<<<<< HEAD
    //   console.log('🔍 Starting inventory update for items:', items);
=======
      console.log("🔍 Starting inventory update for items:", items);
>>>>>>> 171bfa47 (WORKING PRODUCTION SITE WITH STRIPE CHECKOUTgit status)

      for (const item of items) {
        if (!item.productId) {
          console.warn("⚠️ Skipping item due to missing productId:", item);
          continue;
        }

        // console.log(`📌 Checking product ID: ${item.productId}`);

        const productRef = doc(db, "products", item.productId);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
          console.warn(`⚠️ Product not found in Firestore: ${item.productId}`);
          continue;
        }

        const productData = productSnap.data();
<<<<<<< HEAD
        // console.log(
        //   `📊 Current stock for ${item.productId}: ${productData.currentQuantity}`
        // );

        const newQuantity = Math.max(
          0,
          (productData.currentQuantity || 0) - (item.quantity || 1)
        );
        // console.log(
        //   `🔄 Updating stock: ${productData.currentQuantity} -> ${newQuantity}`
        // );
=======
        console.log(`📊 Current stock for ${item.productId}: ${productData.currentQuantity}`);

        const newQuantity = Math.max(0, (productData.currentQuantity || 0) - (item.quantity || 1));
        console.log(`🔄 Updating stock: ${productData.currentQuantity} -> ${newQuantity}`);
>>>>>>> 171bfa47 (WORKING PRODUCTION SITE WITH STRIPE CHECKOUTgit status)

        await updateDoc(productRef, { currentQuantity: newQuantity });
        // console.log(`✅ Inventory updated for ${item.productId}`);
      }

<<<<<<< HEAD
    //   console.log('✅ Finished updating inventory!');
=======
      setInventoryUpdated(true); // ✅ Prevent multiple updates
      console.log("✅ Finished updating inventory!");
>>>>>>> 171bfa47 (WORKING PRODUCTION SITE WITH STRIPE CHECKOUTgit status)
    } catch (error) {
      console.error("❌ Error updating inventory:", error);
    }
  };

  const printReceipt = () => {
    window.print();
  };

  if (!orderDetails) {
    return <div className="loading">Loading your order details...</div>;
  }

  const {
    id = "N/A",
    customerName = "Customer",
    orderDate = new Date().toISOString(),
    items = [],
    subtotal = 0,
    tax = 0,
    shipping = 0,
    discount = 0,
    totalAmount = 0,
    shippingName = "N/A",
    shippingAddress = "N/A",
    estimatedDelivery = "Not available",
    paymentMethod = {},
  } = orderDetails;

  return (
    <div className="transaction-success">
      <h1>Order Successful!</h1>
      <p className="confirmation-msg">Your order has been successfully placed.</p>

      <div className="order-details">
        <h2>Order Summary</h2>
        <p>
          <strong>Order ID:</strong> {orderDetails.id || "N/A"}
        </p>
        <p>
          <strong>Order Date:</strong> {new Date(orderDate).toLocaleDateString()}
        </p>
        <h3>Customer Info</h3>
        <p>
          <strong>Name:</strong> {orderDetails.customerName || "N/A"}
        </p>
        <p>
          <strong>Email:</strong> {orderDetails.customerEmail || "N/A"}
        </p>
        <p>
          <strong>Phone:</strong> {orderDetails.customerPhone || "N/A"}
        </p>
        <h3>Shipping Details</h3>
        <p>
          <strong>Address:</strong> {orderDetails.customerAddress || "N/A"}
        </p>
        <h3>Payment Info</h3>
        <p>
          <strong>Payment Method:</strong>{" "}
          {orderDetails.paymentMethod
            ? orderDetails.paymentMethod.charAt(0).toUpperCase() +
              orderDetails.paymentMethod.slice(1).toLowerCase()
            : "N/A"}
        </p>
        <p>
          <strong>Payment Details: </strong>
          {orderDetails.cardDetails?.brand
            ? orderDetails.cardDetails.brand.charAt(0).toUpperCase() +
              orderDetails.cardDetails.brand.slice(1).toLowerCase()
            : "N/A"}{" "}
          ****{orderDetails.cardDetails?.lastFour || "XXXX"}
        </p>
        <h3>Order Items</h3>
        <ul className="checkout-summary-items">
          {items.length > 0 ? (
            items.map((item, index) => (
              <li key={index} className="checkout-summary-item">
                <strong>{item.name}</strong> - ${item.price.toFixed(2)} x {item.quantity}
                <p>Estimated Delivery: {item.shippingDetails || "Not available"}</p>
              </li>
            ))
          ) : (
            <p>No items found</p>
          )}
        </ul>
        <h3>Order Total</h3>
        <p>
          <strong>Subtotal:</strong> ${subtotal.toFixed(2)}
        </p>
        <p>
          <strong>Tax:</strong> ${tax.toFixed(2)}
        </p>
        <p>
          <strong>Shipping:</strong> ${shipping.toFixed(2)}
        </p>
        <p className="total">
          <strong>Total Amount:</strong> ${totalAmount.toFixed(2)}
        </p>
      </div>
    </div>
  );
};

export default CheckoutSummary;
