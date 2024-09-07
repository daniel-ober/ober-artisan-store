import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Shop.css';
import { useCart } from '../context/CartContext';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOption, setSortOption] = useState('Most Recent');

  const { addToCart, removeFromCart, cartItems } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/products`);
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError(`Failed to fetch products: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleCartToggle = (product) => {
    const isInCart = cartItems.some(item => item.id === product.id);
    if (isInCart) {
      removeFromCart(product.id);
    } else {
      addToCart(product);
    }
  };

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

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

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
            <div key={product._id} className="product-card">
              <Link to={`/item/${product._id}`} className="product-link">
                <img
                  src={product.images && product.images.length > 0 ? product.images[0] : '/path/to/placeholder-image.jpg'}
                  alt={product.name}
                  className="product-image"
                />
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-description">{product.description}</p>
                  <p className="product-price">
                    {product.price !== undefined && product.price !== null ? `$${product.price.toFixed(2)}` : 'Price not available'}
                  </p>
                </div>
              </Link>
              <div className="product-card-footer">
                <button
                  className={cartItems.some(item => item.id === product._id) ? 'remove-from-cart-button' : 'add-to-cart-button'}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent click event from bubbling up to the Link component
                    handleCartToggle(product);
                  }}
                >
                  {cartItems.some(item => item.id === product._id) ? 'Remove from Cart' : 'Add to Cart'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No items available</p>
        )}
      </div>
    </div>
  );
};

export default Shop;
