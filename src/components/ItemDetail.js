// src/components/ItemDetail.js
import React from 'react';
import { useDispatch } from 'react-redux';
import { addToCart } from '../redux/slices/cartSlice'; // Correct import

const ItemDetail = ({ item }) => {
  const dispatch = useDispatch();

  const handleAddToCart = () => {
    dispatch(addToCart(item));
  };

  return (
    <div>
      <h2>{item.name}</h2>
      <button onClick={handleAddToCart}>Add to Cart</button>
    </div>
  );
};

export default ItemDetail;
