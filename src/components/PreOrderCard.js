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
    buttonText = "Learn More";
  } else {
    buttonText = "Pre-Order Now";
  }

  // Determine destination route
  const isArtisan = ["heritage", "feuzon", "soundlegend"].includes(product.id);
  const productUrl = isArtisan ? `/artisanseries/${product.id}` : `/merch/${product.id}`;

  return (
    <div className="preorder-card">
      {/* Product Image */}
      <div
        className="preorder-image-container"
        onClick={() => navigate(productUrl)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            navigate(productUrl);
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
        src={`/v2logo-large/${product.id}-black.png`} 
        alt={`${product.name} logo`}
        className="preorder-header-logo"
      />

      {/* Product Info */}
      <div className="preorder-info">
        <p className="preorder-description">{product.description}</p>
        <div className="preorder-card-bottom">
          <div className="preorder-button-container">
            <button
              className={
                product.currentQuantity === 0
                  ? "preorder-card-view-details-button"
                  : "preorder-card-preorder-button"
              }
              onClick={() => navigate(productUrl)}
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