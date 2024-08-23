import React from 'react';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import items from '../data/items';
import './Shop.css';

const Shop = ({ addToCart }) => {
  if (typeof addToCart !== 'function') {
    console.error('addToCart is not a function');
    return null;
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
              {/* Link to the item detail page */}
              <Link to={`/item/${item.id}`}>View Details</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Shop;
