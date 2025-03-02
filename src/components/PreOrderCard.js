// src/components/PreOrderCard.js
import React from "react";
import { useNavigate } from "react-router-dom";
import "./ProductCard.css"; // Use the same CSS as ProductCard

const PreOrderCard = ({ product }) => {
  const navigate = useNavigate();

  return (
    <div className="product-card"> {/* Keep className the same for consistency */}
      {/* Product Image */}
      <div
        className="preorder-image-container"
        onClick={() => navigate(`/products/${product.id}`)}
        onKeyDown={(e) => e.key === "Enter" && navigate(`/products/${product.id}`)}
        role="button"
        tabIndex={0}
        aria-label={`View details of ${product.name}`}
      >
        {/* Use product.id for PreOrderCard images */}
        <img
          src={product.thumbnail || product.images?.[0] || "/fallback.jpg"}
          alt={product.name}
          className="preorder-image"
          loading="lazy"
        />
      </div>

      {/* Product Info */}
      <div className="product-info">
      <img
  src={`/artisanseries/${product.id}-black.png`}
  alt={product.id}
  className="preorder-header-image"
  ></img>
        <p className="preorder-description">{product.description}</p>
        <p className="delivery-time">Est. Delivery: {product.deliveryTime}</p>
        <div className="card-preorder-price">Starting Price: ${product.price}</div>

        {/* Product Action Buttons */}
        <div className="preorder-button-container">
          {product.currentQuantity === 0 ? (
            <button
              className="prod-card-view-details-button"
              onClick={() => navigate(`/products/${product.id}`)}
            >
              Click here for more details
            </button>
          ) : (
            <button
              className="preorder-card-preorder-button"
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