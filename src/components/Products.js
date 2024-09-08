import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ProductCard from './ProductCard'; // Ensure this is the correct path
import './Products.css'; // Add or update the styles if needed

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOption, setSortOption] = useState('Most Recent');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:4949/api/products');
        setProducts(response.data);
      } catch (err) {
        setError('Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleSortChange = (event) => {
    setSortOption(event.target.value);
  };

  const sortedProducts = [...products].sort((a, b) => {
    switch (sortOption) {
      case 'Price: Lowest to Highest':
        return a.price - b.price;
      case 'Price: Highest to Lowest':
        return b.price - a.price;
      case 'Most Recent':
        return new Date(b.dateAdded) - new Date(a.dateAdded);
      case 'Most Popular':
        return b.views - a.views;
      default:
        return 0;
    }
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="shop-container">
      <div className="shop-header">
        <h1>Shop</h1>
        <select value={sortOption} onChange={handleSortChange} className="sort-select">
          <option value="Most Recent">Most Recent</option>
          <option value="Most Popular">Most Popular</option>
          <option value="Price: Lowest to Highest">Price: Lowest to Highest</option>
          <option value="Price: Highest to Lowest">Price: Highest to Lowest</option>
        </select>
      </div>
      <div className="item-list">
        {sortedProducts.length > 0 ? (
          sortedProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))
        ) : (
          <p>No items available</p>
        )}
      </div>
    </div>
  );
};

export default Products;
