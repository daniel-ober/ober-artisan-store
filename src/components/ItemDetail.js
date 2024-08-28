// src/components/ItemDetail.js
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addItem } from '../redux/cartSlice'; // Import the addItem action
import items from '../data/items';
import './ItemDetail.css';

const ItemDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch(); // Hook to dispatch actions
  const item = items.find((item) => item.id === parseInt(id));

  // Initialize state hooks
  const [selectedImage, setSelectedImage] = useState(item?.imageUrl || '');
  const [isMagnifying, setIsMagnifying] = useState(false);

  // Only run this check if `item` exists
  if (!item) {
    return <div>Item not found</div>;
  }

  const handleOnDoubleClick = () => setIsMagnifying(true);
  const handleOnClick = () => setIsMagnifying(false);

  const handleAddToCart = () => {
    dispatch(addItem({ ...item, quantity: 1 })); // Add item to cart with quantity 1
  };

  return (
    <div className="item-detail-container">
      <div className="item-detail-gallery">
        <div className="gallery-main">
          <div
            className={`magnify-container ${isMagnifying ? 'magnify' : ''}`}
            onDoubleClick={handleOnDoubleClick}
            onClick={handleOnClick}
          >
            <img
              src={selectedImage}
              alt={item.name}
              className="main-image"
            />
          </div>
        </div>
        <div className="gallery-thumbnails">
          {item.images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`Thumbnail ${index}`}
              className={`thumbnail ${selectedImage === image ? 'active' : ''}`}
              onClick={() => setSelectedImage(image)}
            />
          ))}
        </div>
      </div>
      <div className="item-detail-info">
        <h1>{item.name}</h1>
        <p>{item.description}</p>
        <p className="item-detail-price">${item.price.toFixed(2)}</p>
        <button className="item-detail-add-to-cart" onClick={handleAddToCart}>
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ItemDetail;
