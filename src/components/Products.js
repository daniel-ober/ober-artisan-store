import React, { useEffect, useState } from 'react';
import { fetchProducts } from '../services/firebaseService';
import ProductCard from './ProductCard';
import './Products.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchProductsData = async () => {
      try {
        const productsList = await fetchProducts();
        const activeProducts = productsList.filter(
          (product) => product.status === 'active'
        );
        if (isMounted) {
          setProducts(activeProducts);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
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