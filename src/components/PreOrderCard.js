import React from "react";
import { useNavigate } from "react-router-dom";
import "./PreOrderCard.css";

const PreOrderCard = ({ product }) => {
  const navigate = useNavigate();

  // Determine button text dynamically
  let buttonText;
  if (product.currentQuantity === 0) {
    buttonText = "Click here for Details";
  } else if (product.id === "heritage" || product.id === "feuzon") {
    buttonText = "Pre-Order Now";
  } else if (product.id === "soundlegend") {
    buttonText = "Request Consultation";
  } else {
    buttonText = "Pre-Order Now";
  }

  return (
    <div className="preorder-card">
      {/* Product Image */}
      <div
        className="preorder-image-container"
        onClick={() => navigate(`/products/${product.id}`)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            navigate(`/products/${product.id}`);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`View details of ${product.name}`}
      >
        <img
          src={product.thumbnail || product.images?.[0] || "/fallback.jpg"}
          alt={product.name}
          className="preorder-image"
          loading="lazy"
        />
      </div>

      {/* Artisan Series Logo */}
      <img
        src={`/artisanseries/${product.id}-black.png`} 
        alt={`${product.name} logo`}
        className="preorder-header-logo"
      />

      {/* Product Info */}
      <div className="preorder-info">
        {/* <h2 className="preorder-title">{product.name}</h2> */}
        <p className="preorder-description">{product.description}</p>
        <div className="preorder-card-bottom">
        <div className="card-preorder-price">Starting Price: ${product.price}</div>
        <p className="delivery-time">Delivery: {product.deliveryTime}</p>

        {/* Product Action Buttons */}
        <div className="preorder-button-container">
          <button
            className={product.currentQuantity === 0 ? "preorder-card-view-details-button" : "preorder-card-preorder-button"}
            onClick={() => navigate(`/products/${product.id}`)}
          >
            {buttonText}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreOrderCard;