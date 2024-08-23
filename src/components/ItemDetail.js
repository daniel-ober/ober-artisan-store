import React from 'react';
import { useParams } from 'react-router-dom';
import items from '../data/items';
import './ItemDetail.css'; // Import the CSS file

const ItemDetail = () => {
  const { id } = useParams();
  const item = items.find((item) => item.id === parseInt(id, 10));

  if (!item) {
    return <div>Item not found</div>;
  }

  return (
    <div className="item-detail-container">
      <img src={item.imageUrl} alt={item.name} className="item-detail-image" />
      <div className="item-detail-info">
        <h1>{item.name}</h1>
        <p>{item.description}</p>
        <p>${item.price.toFixed(2)}</p>
        {/* Add additional details or a button to add to cart */}
      </div>
    </div>
  );
};

export default ItemDetail;
