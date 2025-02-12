// src/components/PreOrderCard.js
import React from "react";
import { useNavigate } from "react-router-dom";
import "./ProductCard.css";

const PreOrderCard = ({ product }) => {
  const navigate = useNavigate();

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
        <p className="card-product-price">${product.price}</p>

        {/* 🔥 No "View Details" link here, unlike ProductCard.js */}

        {/* Product Action Buttons */}
        <div className="product-button-container">
          {product.currentQuantity === 0 ? (
            <button
              className="prod-card-view-details-button"
              onClick={() => navigate(`/products/${product.id}`)}
            >
              Click here for more details
            </button>
          ) : (
            <button
              className="prod-card-preorder-button"
              onClick={() => navigate(`/products/${product.id}`)}
            >
              Pre-Order Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreOrderCard;