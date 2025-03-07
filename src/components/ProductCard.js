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

  useEffect(() => {
    checkIfInCart();
  }, [cart]);

  const checkIfInCart = async () => {
    if (!cartId) return;
    const cartRef = doc(db, "carts", cartId);
    const cartSnap = await getDoc(cartRef);

    if (cartSnap.exists() && Array.isArray(cartSnap.data().cart)) {
      setInCart(cartSnap.data().cart.some(item => item.id === product.id));
    }
  };

  const handleCartAction = async () => {
    if (!cartId) return;
    const cartRef = doc(db, "carts", cartId);

    try {
      const cartSnap = await getDoc(cartRef);
      let updatedCart = cartSnap.exists() && Array.isArray(cartSnap.data().cart)
        ? cartSnap.data().cart
        : [];

      if (inCart) {
        updatedCart = updatedCart.filter(item => item.id !== product.id);
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

  let buttonText;
  let buttonAction;
  let buttonClass = "prod-card-button";

  if (product.id === "soundlegend") {
    buttonText = "Request Consultation";
    buttonAction = () => navigate("/products/soundlegend");
  } else if (product.isPreOrder) {
    buttonText = "Pre-Order Now";
    buttonAction = () => navigate(`/products/${product.id}`);
  } else if (product.currentQuantity === 0) {
    buttonText = "Notify Me When Available";
    buttonAction = null;
    buttonClass = "prod-card-notify-me-button";
  } else if (inCart) {
    buttonText = "Remove from Cart";
    buttonAction = handleCartAction;
  } else {
    buttonText = "Add to Cart";
    buttonAction = handleCartAction;
  }

  return (
    <div className="product-card">
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

      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <p className="delivery-time">Delivery: {product.deliveryTime}</p>
        <p className="card-product-price">${product.price}</p>

        <button
          className="view-details-button"
          onClick={() => navigate(`/products/${product.id}`)}
        >
          Click for Product Details
        </button>

        <div className="product-button-container">
          <button className={buttonClass} onClick={buttonAction} disabled={!buttonAction}>
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;