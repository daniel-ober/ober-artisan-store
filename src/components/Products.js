import React, { useEffect, useState } from 'react';
import { fetchProducts } from '../firebaseService';
import ProductCard from './ProductCard'; // Assuming a ProductCard component is used

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductsData = async () => {
      try {
        const productsList = await fetchProducts();
        setProducts(productsList); // Ensure productsList includes Firestore doc ids
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
    <div className="shop-container">
      <h1>Products</h1>
      <div className="item-list">
        {products.length === 0 ? (
          <p>No products available.</p>
        ) : (
          products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))
        )}
      </div>
    </div>
  );
};

export default Products;
