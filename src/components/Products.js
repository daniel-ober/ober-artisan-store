import React, { useEffect, useState } from 'react';
import { fetchProducts } from '../services/firebaseService'; // Adjust the path according to your structure
import ProductCard from './ProductCard';
import './Products.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true; // Track if the component is mounted

    const fetchProductsData = async () => {
      try {
        const productsList = await fetchProducts();
        const availableProducts = productsList.filter(
          (product) => product.status === 'available'
        );
        if (isMounted) {
          setProducts(availableProducts);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProductsData();
    return () => {
      isMounted = false; // Cleanup on unmount
    };
  }, []);

  if (loading) {
    return <p className="loading-message">Loading products...</p>;
  }

  return (
    <div className="products-container">
      {products.length > 0 ? (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="no-products-message">No products available</p>
      )}
    </div>
  );
};

export default Products;
