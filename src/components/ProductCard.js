import React from "react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import "./ProductCard.css";

const ProductCard = ({ product, isAdmin }) => {
  const { addToCart, cart } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = () => {
    addToCart({ ...product, _id: product.id });
  };

  const handleViewCart = () => {
    navigate("/cart");
  };

  return (
    <div className="product-card">
      {/* Product Image */}
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
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <p className="delivery-time">Delivery: {product.deliveryTime}</p>
        <p className="card-product-price">${product.price.toFixed(2)}</p>

        {/* View Details Button */}
        <button
          className="view-details-button"
          onClick={() => navigate(`/products/${product.id}`)}
        >
          View Details
        </button>

        {/* Product Action Buttons */}
        <div className="product-button-container">
          {product.currentQuantity === 0 ? (
            <button className="prod-card-notify-me-button" disabled>
              Out of Stock
            </button>
          ) : cart[product.id] ? (
            <button className="prod-card-view-in-cart-button" onClick={handleViewCart}>
              View in Cart
            </button>
          ) : (
            <button className="prod-card-add-to-cart-button" onClick={handleAddToCart}>
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;