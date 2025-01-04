import React, { useEffect, useState } from 'react';
import { fetchProducts } from '../services/firebaseService';
import ProductCard from './ProductCard';
import './Products.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);  // For error messages

  useEffect(() => {
    let isMounted = true;

    const fetchProductsData = async () => {
      try {
        const productsList = await fetchProducts();
        console.log('Fetched Products List:', productsList);  // Debugging line

        if (productsList.length === 0) {
          console.warn('No products found.');
          setError('No products available at the moment.');
        }

        const activeProducts = productsList.filter(
          (product) => product.status === 'active'
        );

        if (isMounted) {
          setProducts(activeProducts);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setError(`Error: ${error.message || 'Unable to fetch product details.'}`);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProductsData();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <p className="loading-message">Loading products...</p>;
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return <p className="no-products-message">No active products available.</p>;
  }

  return (
    <div className="products-container">
      <h1 className="page-title">Our Products</h1>
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default Products;