import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import './ItemDetail.css';

const ItemDetail = () => {
  const { itemId } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInCart, setIsInCart] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  useEffect(() => {
    if (!itemId) return;

    const fetchItem = async () => {
      try {
        const response = await fetch(`http://localhost:4949/api/products/${itemId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setItem(data);
        setSelectedImage(data.images[0]); // Use the first image as the main image
        checkIfInCart(data._id);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [itemId]);

  const checkIfInCart = (id) => {
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const itemInCart = cartItems.some(cartItem => cartItem._id === id);
    setIsInCart(itemInCart);
  };

  const addToCart = () => {
    if (!item) return;

    const existingCartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const itemIndex = existingCartItems.findIndex(cartItem => cartItem._id === item._id);

    if (itemIndex > -1) {
      existingCartItems[itemIndex].quantity += 1;
    } else {
      existingCartItems.push({ ...item, quantity: 1 });
    }

    localStorage.setItem('cartItems', JSON.stringify(existingCartItems));
    setIsInCart(true);
  };

  const removeFromCart = () => {
    if (!item) return;

    const existingCartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const updatedItems = existingCartItems.filter(cartItem => cartItem._id !== item._id);

    localStorage.setItem('cartItems', JSON.stringify(updatedItems));
    setIsInCart(false);
  };

  const handleThumbnailClick = (image) => {
    setSelectedImage(image);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!item) {
    return <div>Item not found</div>;
  }

  return (
    <div className="item-detail-container">
      <div className="item-detail-main">
        <div className="gallery-main">
          <img src={selectedImage} alt={item.name} className="main-image" />
          <div className="gallery-thumbnails">
            {item.images.length > 0 && item.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className={`thumbnail ${selectedImage === image ? 'active' : ''}`}
                onClick={() => handleThumbnailClick(image)}
              />
            ))}
          </div>
        </div>
        <div className="item-detail-info">
          <h1>{item.name}</h1>
          <p>{item.description}</p>
          <p className="item-detail-price">Price: ${item.price}</p>
          {isInCart ? (
            <button className="item-detail-remove-from-cart" onClick={removeFromCart}>Remove from Cart</button>
          ) : (
            <button className="item-detail-add-to-cart" onClick={addToCart}>Add to Cart</button>
          )}
          {item.price < 500 && isInCart && (
            <p className="cart-message">
              Change quantity in your <Link to="/cart">Shopping Cart</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;
