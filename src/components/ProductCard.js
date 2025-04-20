import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "./ProductCard.css";

const fallbackImage = "/fallback.jpg";

const stripHtml = (html) => {
  const div = document.createElement("div");
  div.innerHTML = html || "";
  return div.textContent || div.innerText || "";
};

const getLowestPrice = (product) => {
  if (product.variants?.length > 0) {
    const prices = product.variants
      .map((v) =>
        v.price ??
        product.stripePriceIds?.[v.id]?.unitAmount ??
        product.stripePriceIds?.[v.id]?.price
      )
      .filter(Boolean)
      .map((p) => p / 100);
    return prices.length ? Math.min(...prices) : null;
  }
  return product.price;
};

const getImageSrc = (product) => {
  if (Array.isArray(product.images)) {
    const img = product.images.find((img) => img?.src) || product.images[0];
    return typeof img === "string" ? img : img?.src || fallbackImage;
  }
  return fallbackImage;
};

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
      const foundItem = cartSnap.data().cart.find((item) => item.id === product.id);
      setInCart(!!foundItem);
    }
  };

  const handleCartAction = async () => {
    if (!cartId || product.currentQuantity === 0) return;

    const cartRef = doc(db, "carts", cartId);
    const cartSnap = await getDoc(cartRef);
    let updatedCart = cartSnap.exists() && Array.isArray(cartSnap.data().cart)
      ? cartSnap.data().cart
      : [];

    if (inCart) {
      updatedCart = updatedCart.filter((item) => item.id !== product.id);
    } else {
      updatedCart.push({
        id: product.id,
        name: product.title || product.name || "Product",
        price: getLowestPrice(product),
        thumbnail: getImageSrc(product),
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
  };

  const imageUrl = getImageSrc(product);
  const price = getLowestPrice(product);
  const delivery = product.deliveryTime || "Varies";

  const enabledVariantIds = (product.variants || [])
    .filter((v) => v.is_enabled && v.is_available !== false)
    .map((v) => v.id);

  const colorOption = product.options?.find((opt) => opt.name === "Colors");

  const renderColorDots = () => {
    if (!colorOption || !Array.isArray(colorOption.values)) return null;

    return colorOption.values.map((val, idx) => {
      const hasEnabledVariant = (product.images || []).some((img) =>
        img.variant_ids?.some((id) => enabledVariantIds.includes(id))
      );

      const colors = val.colors || [];
      if (!hasEnabledVariant || colors.length === 0) return null;

      const key = `${val.id}-${idx}`;

      if (colors.length === 1) {
        return (
          <div
            key={key}
            className="color-dot"
            title={val.title}
            style={{
              backgroundColor: colors[0],
              width: 16,
              height: 16,
              borderRadius: "50%",
              border: "1px solid #ccc",
              margin: "2px",
              display: "inline-block",
            }}
          />
        );
      } else if (colors.length >= 2) {
        return (
          <div
            key={key}
            className="color-dot"
            title={val.title}
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              border: "1px solid #ccc",
              margin: "2px",
              display: "inline-block",
              background: `linear-gradient(to right, ${colors[0]} 50%, ${colors[1]} 50%)`
            }}
          />
        );
      }

      return null;
    });
  };

  return (
    <div className="product-card">
      <div
        className="product-image-container"
        onClick={() => navigate(`/products/${product.id}`)}
        role="button"
        tabIndex={0}
        aria-label={`View details of ${product.title || product.name}`}
      >
        <img
          src={imageUrl}
          alt={product.title || product.name}
          className="product-image"
          loading="lazy"
          onError={(e) => (e.currentTarget.src = fallbackImage)}
        />
      </div>

      <div className="product-info">
        <h2 className="product-name">{product.title || product.name}</h2>
        <p className="product-description">{stripHtml(product.description)}</p>

        <div className="color-swatches">{renderColorDots()}</div>

        <div className="product-card-bottom">
          <p className="card-product-price">
            {price ? `$${price.toFixed(2)}` : "Price Unavailable"}
          </p>
          <p className="delivery-time">Delivery: {delivery}</p>

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

      <p className="more-info-link" onClick={() => navigate(`/products/${product.id}`)}>
        More Info
      </p>
    </div>
  );
};

export default ProductCard;
