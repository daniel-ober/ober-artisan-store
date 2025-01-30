import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import './ProductCard.css';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const ProductCard = ({ product }) => {
  const { addToCart, cart } = useCart();
  const [isSoldOut, setIsSoldOut] = useState(false);
  const [notifyMe, setNotifyMe] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkStock = async () => {
      try {
        const productRef = doc(db, 'products', product.id);
        const productSnapshot = await getDoc(productRef);
        const productData = productSnapshot.data();

        if (productData?.currentQuantity === 0) {
          setIsSoldOut(true);
        }
      } catch (error) {
        console.error('Error checking stock:', error);
      }
    };
    checkStock();
  }, [product.id]);

  const handleAddToCart = () => {
    if (!isSoldOut) {
      addToCart({ ...product, _id: product.id });
    } else {
      console.error('Product is out of stock');
    }
  };

  const handleNotifyMe = async () => {
    try {
      const productRef = doc(db, 'products', product.id);
      await updateDoc(productRef, { notifyRequests: (product.notifyRequests || 0) + 1 });
      alert('You will be notified when this product is back in stock!');
      setNotifyMe(true);
    } catch (error) {
      console.error('Error setting notify me:', error);
    }
  };

  return (
    <div className="product-card">
      <div
        className="product-image-container"
        onClick={() => navigate(`/products/${product.id}`)}
        onKeyDown={(e) => e.key === "Enter" && navigate(`/products/${product.id}`)}
        role="button"
        tabIndex={0}
        aria-label={`View details of ${product.name}`}
      >
        <img src={product.images?.[0] || '/fallback.jpg'} alt={product.name} className="product-image" />
      </div>
      <div className="product-info">
        <h3>{product.name}</h3>
        <p>Delivery: {product.deliveryTime}</p>
        <p className="product-price">${product.price.toFixed(2)}</p>
        <Link to={`/products/${product.id}`} className="view-details-link">View Details</Link>

        <div className="product-button-container">
          {isSoldOut ? (
            notifyMe ? (
              <button className="notify-me-button" disabled>Notification Requested</button>
            ) : (
              <button className="notify-me-button" onClick={handleNotifyMe}>Notify Me</button>
            )
          ) : (
            cart[product.id] ? (
              <Link to="/cart" className="view-in-cart-button">View in Cart</Link>
            ) : (
              <button className="add-to-cart-button" onClick={handleAddToCart}>Add to Cart</button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;