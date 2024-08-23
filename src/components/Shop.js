// src/components/Shop.js
import React from 'react';
import items from '../data/items'; // Ensure this file exists and has items
import './Shop.css'; // Optional, for styling

const Shop = ({ addToCart }) => {
  // Ensure addToCart is a function
  if (typeof addToCart !== 'function') {
    console.error('addToCart is not a function');
    return null; // or an error message
  }

  const handleAddToCart = (item) => {
    addToCart(item);
  };

  return (
    <div className="shop-container">
      <h1>Shop</h1>
      <div className="item-list">
        {items.map((item) => (
          <div key={item.id} className="item-card">
            <img src={item.imageUrl} alt={item.name} className="item-image" />
            <div className="item-info">
              <h2>{item.name}</h2>
              <p>{item.description}</p>
              <p>${item.price.toFixed(2)}</p>
              <button onClick={() => handleAddToCart(item)}>Add to Cart</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Shop;
