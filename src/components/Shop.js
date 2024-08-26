// src/components/Shop.js
import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation
import items from '../data/items';
import './Shop.css';
import { useDispatch } from 'react-redux';
import { addToCart } from '../redux/cartSlice'; // Adjust the path as necessary

const Shop = () => {
  const dispatch = useDispatch();

  const handleAddToCart = (item) => {
    dispatch(addToCart(item));
  };

  return (
    <div className="shop-container">
      <h1>Shop</h1>
      <div className="item-list">
        {items.map((item) => (
          <div key={item.id} className="item-card">
            <Link to={`/item/${item.id}`} className="item-image-link">
              <img src={item.imageUrl} alt={item.name} className="item-image" />
            </Link>
            <div className="item-info">
              <h2>{item.name}</h2>
              <p>{item.description}</p>
              <p>${item.price.toFixed(2)}</p>
              <Link to={`/item/${item.id}`} className="item-details-link">Item Details</Link>
              <button onClick={() => handleAddToCart(item)}>Add to Cart</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Shop;
