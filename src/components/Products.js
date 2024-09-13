import React, { useEffect, useState } from 'react';
import { fetchProducts } from '../firebaseService';
import ProductCard from './ProductCard';
import './Products.css'; // Make sure the path is correct

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductsData = async () => {
      try {
        const productsList = await fetchProducts();
        setProducts(productsList);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        setLoading(false);
      }
    };

    fetchProductsData();
  }, []);

  if (loading) {
    return <p>Loading products...</p>;
  }

  return (
    <div className="products-container">
      {products.length > 0 ? (
        products.map((product) => (
          <ProductCard 
            key={product._id} 
            product={product} 
          />
        ))
      ) : (
        <p>No products available</p>
      )}
    </div>
  );
};

export default Products;
