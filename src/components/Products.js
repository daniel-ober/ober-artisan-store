// src/components/Products.js

import React, { useEffect, useState } from 'react';
import { fetchProducts } from '../firebaseService';
import ProductCard from './ProductCard';
import { useCart } from '../context/CartContext'; // Import the useCart hook
import './Products.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart(); // Get the addToCart function from context

  useEffect(() => {
    const fetchProductsData = async () => {
      try {
        const productsList = await fetchProducts();
        setProducts(productsList);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductsData();
  }, []);

  const handleAddToCart = (product) => {
    if (addToCart) {
      addToCart(product);
    } else {
      console.error('addToCart is not defined');
    }
  };

  if (loading) {
    return <p className="loading-message">Loading products...</p>;
  }

  return (
    <div className="products-container">
      {products.length > 0 ? (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard 
              key={product._id} 
              product={product} 
              onAddToCart={() => handleAddToCart(product)} // Pass the addToCart handler
            />
          ))}
        </div>
      ) : (
        <p className="no-products-message">No products available</p>
      )}
    </div>
  );
};

export default Products;
