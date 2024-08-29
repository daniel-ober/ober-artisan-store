import React, { useEffect, useState } from 'react';
import './Shop.css';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartItems, setCartItems] = useState([]);

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

  useEffect(() => {
    // Load cart items from localStorage on component mount
    const loadCart = () => {
      const storedCart = JSON.parse(localStorage.getItem('cartItems')) || [];
      setCartItems(storedCart);
    };

    loadCart();
  }, []);

  const updateCart = (product, action) => {
    let updatedCart = [...cartItems];

    if (action === 'add') {
      if (!updatedCart.some(item => item._id === product._id)) {
        product.quantity = 1;
        updatedCart.push(product);
      }
    } else if (action === 'remove') {
      updatedCart = updatedCart.filter(item => item._id !== product._id);
    }

    setCartItems(updatedCart);
    localStorage.setItem('cartItems', JSON.stringify(updatedCart));
  };

  const handleCartToggle = (product) => {
    const isInCart = cartItems.some(item => item._id === product._id);
    const action = isInCart ? 'remove' : 'add';
    updateCart(product, action);
  };

  const isInCart = (productId) => {
    return cartItems.some(item => item._id === productId);
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
              <img
                src={product.imageUrl || '/path/to/placeholder-image.jpg'}
                alt={product.name}
                className="product-image"
              />
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-description">{product.description}</p>
                <p className="product-price">
                  {product.price !== undefined && product.price !== null ? `$${product.price.toFixed(2)}` : 'Price not available'}
                </p>
                <button
                  className={isInCart(product._id) ? 'remove-from-cart-button' : 'add-to-cart-button'}
                  onClick={() => handleCartToggle(product)}
                >
                  {isInCart(product._id) ? 'Remove from Cart' : 'Add to Cart'}
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
