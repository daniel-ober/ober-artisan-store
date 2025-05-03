import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ArtisanShopCard.css';

const ArtisanShopCard = ({ product }) => {
  const navigate = useNavigate();

  // Determine button text dynamically
  let buttonText;

  if (product.currentQuantity === 0) {
    buttonText = 'Out of Stock';
  } else if (product.id === 'founders-toast') {
    buttonText = 'Order Now';
  } else if (product.id === 'heritage' || product.id === 'feuzon') {
    buttonText = 'Pre-Order Now';
  } else if (product.id === 'soundlegend') {
    buttonText = 'Learn More';
  } else {
    buttonText = 'Pre-Order Now';
  }

  // 🔽 ⬅️ Put it here, right before return()
  let buttonClass;
  if (product.currentQuantity === 0) {
    buttonClass = 'preorder-card-out-of-stock-button';
  } else {
    buttonClass = 'preorder-card-preorder-button';
  }

  // Determine destination route
  const isArtisan = [
    'heritage',
    'feuzon',
    'soundlegend',
    'founders-toast',
  ].includes(product.id);

  const productUrl = isArtisan
    ? `/artisan-shop/${product.id}`
    : `/merch/${product.id}`;

  return (
    <div className="preorder-card">
      {/* Product Image */}
      <div
        className="preorder-image-container"
        onClick={() => navigate(productUrl)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            navigate(productUrl);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`View details of ${product.name}`}
      >
        <img
          src={product.thumbnail || product.images?.[0] || '/fallback.jpg'}
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
              className={buttonClass}
              onClick={() => navigate(productUrl)}
              disabled={product.currentQuantity === 0}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtisanShopCard;
