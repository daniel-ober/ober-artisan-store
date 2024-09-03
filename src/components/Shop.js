import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Shop.css';
import { useCart } from '../context/CartContext';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { addToCart, removeFromCart, cartItems } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:4949/api/products');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setProducts(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to fetch products');
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleCartToggle = (product) => {
    const isInCart = cartItems.some(item => item._id === product._id);
    if (isInCart) {
      removeFromCart(product._id);
    } else {
      addToCart(product);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <div className="shop-container">
      <div className="item-list">
        {products.length > 0 ? (
          products.map((product) => (
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
              <button
                className={cartItems.some(item => item._id === product._id) ? 'remove-from-cart-button' : 'add-to-cart-button'}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent click event from bubbling up to the Link component
                  handleCartToggle(product);
                }}
              >
                {cartItems.some(item => item._id === product._id) ? 'Remove from Cart' : 'Add to Cart'}
              </button>
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
