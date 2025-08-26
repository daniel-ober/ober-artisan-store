// src/components/ProductCard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { analytics, logEvent } from '../firebaseConfig';
import './ProductCard.css';

const FALLBACK_IMAGE = '/fallback-images/fallback_image1.png';

const stripHtml = (html) => {
  const div = document.createElement('div');
  div.innerHTML = html || '';
  return div.textContent || div.innerText || '';
};

const getLowestPrice = (product) => {
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    const prices = product.variants
      .map(
        (v) =>
          v.price ??
          product.stripePriceIds?.[v.id]?.unitAmount ??
          product.stripePriceIds?.[v.id]?.price ??
          v.printifyPriceCents
      )
      .filter((p) => Number.isFinite(p))
      .map((p) => p / 100);
    return prices.length ? Math.min(...prices) : null;
  }
  return product.price ?? null;
};

const getImageSrc = (product) => {
  if (!Array.isArray(product.images) || product.images.length === 0) return FALLBACK_IMAGE;
  const preferred =
    product.images.find((img) => typeof img === 'object' && img?.src && img.displayInGallery !== false) ||
    product.images.find((img) => typeof img === 'object' && img?.src) ||
    product.images[0];

  const src = typeof preferred === 'string' ? preferred : preferred?.src;
  return src || FALLBACK_IMAGE;
};

const ProductCard = ({ product }) => {
  const { cartId } = useCart(); // used elsewhere for analytics; keeping it
  const navigate = useNavigate();

  const imageUrl = getImageSrc(product);
  const price = getLowestPrice(product);
  const delivery = product.deliveryTime || 'Varies';

  const colorOption = product.options?.find((opt) => opt.name === 'Colors');
  const enabledVariantIds = (product.variants || [])
    .filter((v) => v.is_enabled && v.is_available !== false)
    .map((v) => String(v.id));

  const renderColorDots = () => {
    if (!colorOption?.values) return null;

    return colorOption.values.map((val, idx) => {
      // only render dot if at least one image maps to an enabled variant
      const hasEnabledVariantImage = (product.images || []).some((img) =>
        (img.variant_ids || []).map(String).some((id) => enabledVariantIds.includes(id))
      );

      const colors = val.colors || [];
      if (!hasEnabledVariantImage || colors.length === 0) return null;

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
              borderRadius: '50%',
              border: '1px solid #ccc',
              margin: '2px',
              display: 'inline-block',
            }}
          />
        );
      }
      return (
        <div
          key={key}
          className="color-dot"
          title={val.title}
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            border: '1px solid #ccc',
            margin: '2px',
            display: 'inline-block',
            background: `linear-gradient(to right, ${colors[0]} 50%, ${colors[1]} 50%)`,
          }}
        />
      );
    });
  };

  const getDetailPath = () =>
    product.collection === 'merchProducts' ? `/merch/${product.id}` : `/products/${product.id}`;

  return (
    <div className="product-card">
      <div
        className="product-image-container"
        onClick={() => {
          if (analytics) {
            logEvent(analytics, 'click_merch_product', {
              productId: product.id,
              productName: product.title || product.name,
            });
          }
          navigate(getDetailPath());
        }}
        role="button"
        tabIndex={0}
        aria-label={`View details of ${product.title || product.name}`}
      >
        <img
          src={imageUrl}
          alt={product.title || product.name}
          className="product-image"
          loading="lazy"
          onError={(e) => (e.currentTarget.src = FALLBACK_IMAGE)}
        />
      </div>

      <div className="product-info">
        <h2 className="product-name">{product.title || product.name}</h2>
        <p className="product-card-description">{stripHtml(product.description)}</p>

        <div className="color-swatches">{renderColorDots()}</div>

        <div className="product-card-bottom">
          <p className="card-product-price">{price ? `$${price.toFixed(2)}` : 'Price Unavailable'}</p>
          <p className="delivery-time">Delivery: {delivery}</p>

          <button
            className="add-to-cart-button"
            onClick={() => {
              if (analytics) {
                logEvent(analytics, 'click_merch_product', {
                  productId: product.id,
                  productName: product.title || product.name,
                });
              }
              navigate(getDetailPath());
            }}
          >
            Choose Yours
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;