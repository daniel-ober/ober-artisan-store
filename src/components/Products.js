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
      console.log('Fetching products...');
      try {
        const productsList = await fetchProducts();
        console.log('Products fetched:', productsList);
        const availableProducts = productsList.filter(product => product.status === 'available');
        if (isMounted) {
          console.log('Setting available products:', availableProducts);
          setProducts(availableProducts);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        if (isMounted) {
          console.log('Finished fetching products');
          setLoading(false);
        }
      }
    };

    fetchProductsData();

    return () => {
      isMounted = false; // Cleanup on unmount
      console.log('Products component unmounted');
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
            <ProductCard 
              key={product.id} // Ensure this is unique for each product
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
