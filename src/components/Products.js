// src/components/Products.js
import React, { useEffect, useState } from 'react';
import { fetchProducts } from '../services/firebaseService';
import ProductCard from './ProductCard';
import { useCart } from '../context/CartContext'; 
import './Products.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <p className="loading-message">Loading products...</p>;
  }

  return (
    <div className="products-container">
      {products.length > 0 ? (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
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
