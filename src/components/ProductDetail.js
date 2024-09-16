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
        console.log('Fetching product with ID:', id);
        const productData = await fetchProductById(id);
        console.log('Product data:', productData);

        if (productData) {
          setProduct(productData);

          // Check if the product is in the cart
          const cartProduct = cart[productData._id]; // Using _id for cart lookup
          setInCart(cartProduct || null);
        } else {
          setError('Product not found');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Error fetching product');
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [id, cart]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
    }
  };

  const handleQuantityChange = (change) => {
    if (!inCart) return;
    const newQuantity = inCart.quantity + change;

    if (newQuantity < 1) return;
    addToCart({ ...product, quantity: newQuantity });
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  const canAdjustQuantity = product?.category !== 'custom shop' && product?.category !== 'one of a kind';

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
        <p className="product-price">${product.price.toFixed(2)}</p>
        <button className="add-to-cart-button" onClick={handleAddToCart}>
          {inCart ? 'Update Cart' : 'Add to Cart'}
        </button>
        {inCart && canAdjustQuantity && (
          <div className="quantity-controls">
            <button
              className="quantity-button"
              onClick={() => handleQuantityChange(-1)}
              disabled={inCart.quantity <= 1}
            >
              -
            </button>
            <span className="quantity-display">{inCart.quantity}</span>
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
