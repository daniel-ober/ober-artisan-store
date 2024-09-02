// src/components/ItemDetail.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const ItemDetail = () => {
  const { itemId } = useParams(); // Get itemId from the URL
  const [item, setItem] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!itemId) return; // Exit if itemId is undefined

    const fetchItem = async () => {
      try {
        const response = await fetch(`http://localhost:4949/api/products/${itemId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setItem(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [itemId]);

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
    <div>
      <h1>{item.name}</h1>
      <p>{item.description}</p>
      <p>Price: ${item.price}</p>
      <img src={item.imageUrl} alt={item.name} style={{ width: '300px', height: '300px' }} />
      <div>
        <h3>Additional Images:</h3>
        {Array.isArray(item.images) && item.images.length > 0 ? (
          item.images.map((image, index) => (
            <img key={index} src={image} alt={`Additional ${index + 1}`} style={{ width: '100px', height: '100px', margin: '5px' }} />
          ))
        ) : (
          <p>No additional images available</p>
        )}
      </div>
    </div>
  );
};

export default ItemDetail;
