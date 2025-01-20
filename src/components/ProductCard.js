import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import './ProductCard.css';
import { doc, getDoc } from 'firebase/firestore'; // Firebase imports
import { db } from '../firebaseConfig'; // Ensure you import your Firestore config

const ProductCard = ({ product }) => {
  const { addToCart, cart } = useCart();
  const [isSoldOut, setIsSoldOut] = useState(false);
  const [notifyMe, setNotifyMe] = useState(false);
  const navigate = useNavigate();

  // Check if product is already in the cart
  const isInCart = cart[product.id];

  useEffect(() => {
    const checkStock = async () => {
      // Fetch product data from Firestore to check if it is out of stock
      const productRef = doc(db, 'products', product.id);
      const productSnapshot = await getDoc(productRef);
      const productData = productSnapshot.data();
      if (productData?.currentQuantity === 0) {
        setIsSoldOut(true);
      }
    };
    checkStock();
  }, [product.id]);

  const handleAddToCart = () => {
    if (product && !isSoldOut) {
      addToCart({ ...product, _id: product.id });
    } else {
      console.error('Product is not defined or is out of stock');
    }
  };

  const handleImageClick = () => {
    navigate(`/products/${product.id}`);
  };

  const handleNotifyMe = () => {
    // Placeholder for notifying users when the product is back in stock
    alert('You will be notified once this product is available again!');
    setNotifyMe(true);
  };

  return (
    <div className="product-card">
      <div
        className="product-image-container"
        onClick={handleImageClick}
        onKeyDown={(e) => e.key === 'Enter' && handleImageClick()}
        role="button"
        tabIndex={0}
        aria-label={`View details of ${product.name}`}
      >
        <img
          src={product.images?.[0] || '/fallback-images/images-coming-soon-regular.png'}
          alt={product.name}
          className="product-image"
          onError={(e) => (e.target.src = '/fallback-images/images-coming-soon-regular.png')}
        />
      </div>

      <div className="product-info">
        <h3 className="product-title">{product.name}</h3>
        <div className="product-meta">
          {product.artisanLine && (
            <p className="artisan-line">{product.artisanLine}</p>
          )}
          {product.deliveryTime && (
            <p className="delivery-time">Delivery: {product.deliveryTime}</p>
          )}
        </div>
        <p className="product-card-price">${product.price.toFixed(2)}</p>
        <Link to={`/products/${product.id}`} className="view-details-link">
          View Details
        </Link>

        {/* Ensure button stretches edge-to-edge */}
        <div className="product-button-container">
          {isSoldOut ? (
            <button className="sold-out-button" disabled>
              Sold Out
            </button>
          ) : isInCart ? (
            <Link to="/cart" className="add-to-cart-button">
              View in Cart
            </Link>
          ) : (
            <button
              className="add-to-cart-button"
              onClick={handleAddToCart}
              aria-label="Add product to cart"
              disabled={isSoldOut}
            >
              Add to Cart
            </button>
          )}

          {/* Notify Me button */}
          {isSoldOut && !notifyMe && (
            <button className="notify-me-button" onClick={handleNotifyMe}>
              Notify Me When Available
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;