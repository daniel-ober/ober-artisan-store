import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchProductById } from '../firebaseService';
import { useCart } from '../context/CartContext';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const productData = await fetchProductById(id);
        if (productData) {
          setProduct(productData);
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
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);  // Allow adding all product categories to the cart
    }
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
      </div>
    </div>
  );
};

export default ProductDetail;
