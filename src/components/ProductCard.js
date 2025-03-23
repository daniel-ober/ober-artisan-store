import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "./ProductCard.css";

const ProductCard = ({ product }) => {
  const { currentUser } = useAuth();
  const { cart, setCart, cartId } = useCart();
  const navigate = useNavigate();
  const [inCart, setInCart] = useState(false);
  const [cartItemId, setCartItemId] = useState(null);

  useEffect(() => {
    checkIfInCart();
  }, [cart]);

  const checkIfInCart = async () => {
    if (!cartId) return;
    const cartRef = doc(db, "carts", cartId);
    const cartSnap = await getDoc(cartRef);

    if (cartSnap.exists() && Array.isArray(cartSnap.data().cart)) {
      const foundItem = cartSnap.data().cart.find((item) => item.id === product.id);
      if (foundItem) {
        setInCart(true);
        setCartItemId(foundItem.id);
      } else {
        setInCart(false);
        setCartItemId(null);
      }
    }
  };

  const handleCartAction = async () => {
    if (!cartId || product.currentQuantity === 0) return; // Prevent adding out-of-stock items

    const cartRef = doc(db, "carts", cartId);

    try {
      const cartSnap = await getDoc(cartRef);
      let updatedCart = cartSnap.exists() && Array.isArray(cartSnap.data().cart)
        ? cartSnap.data().cart
        : [];

      if (inCart) {
        updatedCart = updatedCart.filter((item) => item.id !== product.id);
      } else {
        updatedCart.push({
          id: product.id,
          name: product.name,
          price: product.price,
          thumbnail: product.thumbnail || product.images?.[0] || "/fallback.jpg",
          quantity: 1,
          category: product.category,
          isPreOrder: product.isPreOrder || false,
          currentQuantity: product.currentQuantity || 0,
          maxQuantity: product.maxQuantity || 0,
          description: product.description || "",
          deliveryTime: product.deliveryTime || "",
          status: product.status || "active",
          createdAt: new Date(),
        });
      }

      if (cartSnap.exists()) {
        await updateDoc(cartRef, { cart: updatedCart });
      } else {
        await setDoc(cartRef, { cart: updatedCart });
      }

      setCart(updatedCart);
      setInCart(!inCart);
    } catch (error) {
      console.error("❌ Error updating cart:", error);
      alert("An error occurred while updating the cart.");
    }
  };

  return (
    <div className="product-card">
      {/* Product Image - Ensures Full View */}
      <div
        className="product-image-container"
        onClick={() => navigate(`/products/${product.id}`)}
        onKeyDown={(e) => e.key === "Enter" && navigate(`/products/${product.id}`)}
        role="button"
        tabIndex={0}
        aria-label={`View details of ${product.name}`}
      >
        <img
          src={product.thumbnail || product.images?.[0] || "/fallback.jpg"}
          alt={product.name}
          className="product-image"
          loading="lazy"
        />
      </div>

      {/* Product Info */}
      <div className="product-info">
      <h2 className="product-name">{product.name}</h2>
<p className="product-description">{product.description}</p>



        <div className="product-card-bottom">
          <p className="card-product-price">${product.price}</p>
          <p className="delivery-time">Delivery: {product.deliveryTime}</p>

          {/* Cart Button Logic */}
          {product.currentQuantity === 0 ? (
            <button className="out-of-stock-button" disabled>
              Out of Stock
            </button>
          ) : inCart ? (

<div className="cart-hover-wrapper">
  <button className="in-cart-button">✔ In Cart</button>
  <div className="cart-hover-options">
    <span onClick={() => navigate("/cart")}>View Cart</span>
    <span onClick={handleCartAction}>Remove</span>
  </div>
</div>


          ) : (
            <button className="add-to-cart-button" onClick={handleCartAction}>
              Add to Cart
            </button>
          )}
        </div>
      </div>
        {/* More Info Link */}
        <p 
          className="more-info-link"
          onClick={() => navigate(`/products/${product.id}`)}
        >
          More Info
        </p>
    </div>
  );
};

export default ProductCard;
