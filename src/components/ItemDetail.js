// src/components/ItemDetail.js
import React from 'react';
import { useParams } from 'react-router-dom';
import items from '../data/items';
import './ItemDetail.css';

const ItemDetail = () => {
  const { id } = useParams();
  const item = items.find((item) => item.id === parseInt(id));

  if (!item) {
    return <div>Item not found</div>;
  }

  return (
    <div className="item-detail-container">
      <div className="item-detail-image">
        <img src={item.imageUrl} alt={item.name} />
      </div>
      <div className="item-detail-info">
        <h1>{item.name}</h1>
        <p>{item.description}</p>
        <p className="item-detail-price">${item.price.toFixed(2)}</p>
        <button className="item-detail-add-to-cart">Add to Cart</button>
      </div>
    </div>
  );
};

export default ItemDetail;
