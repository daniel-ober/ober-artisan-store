import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchProductById } from '../services/firebaseService';
import { useCart } from '../context/CartContext';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart, cart } = useCart();
  const [inCart, setInCart] = useState(null);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const productData = await fetchProductById(id);
        if (productData) {
          setProduct(productData);
          // Check if the product is already in the cart
          const cartProduct = cart.find(item => item.id === id);
          setInCart(cartProduct);
        } else {
          setError('Product not found');
        }
      } catch (error) {
        setError('Error fetching product');
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [id, cart]);

  const handleAddToCart = () => {
    if (product) {
      if (addToCart) {
        addToCart(product);
      } else {
        console.error('User not authenticated');
      }
    }
  };

  const handleQuantityChange = (change) => {
    if (!product) return;
    const newQuantity = inCart ? inCart.quantity + change : 1;

    if (newQuantity < 1) return; // Prevent setting quantity to less than 1
    addToCart({ ...product, quantity: newQuantity });
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!product) {
    return <p>Product not found</p>;
  }

  const canAdjustQuantity = product.category !== 'custom shop' && product.category !== 'one of a kind';

  return (
    <div className="product-detail-container">
      <img
        className="product-image"
        src={product.images?.[0] || '/path/to/placeholder.jpg'}
        alt={product.name}
      />
      <div className="product-info">
        <h1 className="product-title">{product.name}</h1>
        <p className="product-description">{product.description}</p>
        <p className="product-price">${product.price}</p>
        <button 
          className="add-to-cart-button" 
          onClick={handleAddToCart}
        >
          Add to Cart
        </button>
        {canAdjustQuantity && (
          <div className="quantity-controls">
            <button
              className="quantity-button"
              onClick={() => handleQuantityChange(-1)}
              disabled={!inCart || inCart.quantity <= 1}
            >
              -
            </button>
            <span className="quantity-display">{inCart ? inCart.quantity : 1}</span>
            <button
              className="quantity-button"
              onClick={() => handleQuantityChange(1)}
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
