// src/components/ItemDetail.js
import React from 'react';
import { useParams } from 'react-router-dom';
import items from '../data/items'; // Import the items data
import './ItemDetail.css'; // Ensure you have styling for this component
import { useDispatch } from 'react-redux';
import { addToCart } from '../redux/cartSlice'; // Adjust the path as necessary

const ItemDetail = () => {
  const { id } = useParams(); // Get the item ID from the URL parameters
  const dispatch = useDispatch();

  // Find the item based on the ID
  const item = items.find(item => item.id === parseInt(id, 10));

  const handleAddToCart = () => {
    if (item) {
      dispatch(addToCart(item));
    }
  };

  if (!item) {
    return <p>Item not found</p>;
  }

  return (
    <div className="item-detail-container">
      <h1>{item.name}</h1>
      <img src={item.imageUrl} alt={item.name} className="item-detail-image" />
      <div className="item-detail-info">
        <p>{item.description}</p>
        <p>${item.price.toFixed(2)}</p>
        <button onClick={handleAddToCart}>Add to Cart</button>
      </div>
    </div>
  );
};

export default ItemDetail;
