import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import "./Cart.css";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const Cart = () => {
  const { cart, cartId, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [shippingEstimate, setShippingEstimate] = useState(0);

  useEffect(() => {
    if (!cartId) {
      const localCartId = localStorage.getItem("cartId");
      if (!localCartId) {
        const newCartId = `cart-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 10)}`;
        localStorage.setItem("cartId", newCartId);
      }
    }
  }, [cartId]);

  const handleQuantityChange = (productId, change, item) => {
    const currentQuantity = cart[productId]?.quantity || 0;
    const newQuantity = currentQuantity + change;

    // Handle quantity restrictions
    if (item.category === "artisan") {
      if (item.isPreOrder && newQuantity > 3) return; // Pre-order artisan max quantity is 3
      if (!item.isPreOrder && newQuantity > 1) return; // One-of-a-kind artisan max quantity is 1
    }

    if (newQuantity < 1) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const getItemTotal = (item) => {
    return (item.price || 0) * (item.quantity || 0);
  };

  const getTotalAmount = () => {
    return Object.values(cart || {}).reduce(
      (total, item) => total + getItemTotal(item),
      0
    );
  };

  const calculateShipping = () => {
    const totalWeight = Object.values(cart).reduce(
      (total, item) => total + (item.weight || 1) * item.quantity,
      0
    );
    const baseRate = 10; // $10 base rate
    const weightRate = 2; // $2 per unit weight
    const shippingCost = baseRate + weightRate * totalWeight;
    setShippingEstimate(shippingCost);
  };

  useEffect(() => {
    if (Object.keys(cart).length > 0) {
      calculateShipping();
    }
  }, [cart]);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const productsPayload = Object.values(cart).map((product) => ({
        name: product.name || "Unnamed Product",
        description: product.description || "No description available",
        price: product.price,
        quantity: product.quantity || 1,
      }));

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            products: productsPayload,
            userId: user?.uid || localStorage.getItem("cartId"),
          }),
        }
      );

      const session = await response.json();
      window.location.href = session.url;
    } catch (error) {
      alert(`Checkout error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cart-container">
      <h1 className="cart-title">Shopping Cart</h1>
      <p className="cart-id">Cart ID: {cartId || localStorage.getItem("cartId")}</p>
      {Object.keys(cart || {}).length === 0 ? (
        <div className="cart-empty">Your cart is empty.</div>
      ) : (
        <>
          <table className="cart-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Description</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Subtotal</th>
                <th>Remove</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(cart).map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link to={`/products/${item.id}`}>
                      <img
                        src={
                          item.images?.[0] ||
                          "/fallback-images/image-not-available.png"
                        }
                        alt={item.name || "Product Image"}
                        className="cart-item-image"
                      />
                    </Link>
                  </td>
                  <td>
                    <p>{item.name}</p>
                    <p>{item.description || "No description available."}</p>
                  </td>
                  <td>${item.price.toFixed(2)}</td>
                  <td>
                    <div className="quantity-control">
                      <button
                        onClick={() => handleQuantityChange(item.id, -1, item)}
                        title={
                          item.category === "artisan" && item.quantity === 1
                            ? "One-of-a-kind artisan drums are limited to 1."
                            : undefined
                        }
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span>{item.quantity || 0}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, 1, item)}
                        title={
                          item.category === "artisan"
                            ? item.isPreOrder && item.quantity === 3
                              ? "Pre-order artisan drums are limited to 3 to balance production throughput."
                              : !item.isPreOrder && item.quantity === 1
                              ? "One-of-a-kind artisan drums are limited to 1."
                              : undefined
                            : undefined
                        }
                        disabled={
                          (item.isPreOrder && item.quantity >= 3) ||
                          (!item.isPreOrder && item.quantity >= 1)
                        }
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td>${getItemTotal(item).toFixed(2)}</td>
                  <td>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="remove-btn"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="cart-summary">
            <p>Estimated Shipping: ${shippingEstimate.toFixed(2)}</p>
            <p>Total: ${(getTotalAmount() + shippingEstimate).toFixed(2)}</p>
          </div>
          <button
            onClick={handleCheckout}
            className="checkout-button"
            disabled={loading || Object.keys(cart).length === 0}
          >
            {loading ? "Processing..." : "Checkout"}
          </button>
        </>
      )}
    </div>
  );
};

export default Cart;