import React from "react";
import { useNavigate } from "react-router-dom";
import "./ProductCard.css"; // Reusing ProductCard styling

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
  } else if (product.type === "dreamfeather") {
    buttonText = "Own This One-of-a-Kind Snare";
  } else {
    buttonText = "Pre-Order Now";
  }

  return (
    <div className="product-card">
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
        />
        <p className="preorder-description">{product.description}</p>
        <div className="card-preorder-price">Starting Price: ${product.price}</div>
        <p className="delivery-time">Delivery: {product.deliveryTime}</p>

        {/* Product Action Buttons */}
        <div className="preorder-button-container">
          <button
            className={product.currentQuantity === 0 ? "prod-card-view-details-button" : "preorder-card-preorder-button"}
            onClick={() => navigate(`/products/${product.id}`)}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreOrderCard;