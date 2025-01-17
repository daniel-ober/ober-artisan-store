import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Link } from 'react-router-dom';
import './PreOrderPage.css';

const PreOrderPage = () => {
  const [preOrderItems, setPreOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreOrderItems = async () => {
      try {
        const preOrderQuery = query(
          collection(db, 'products'),
          where('isPreOrder', '==', true)
        );
        const querySnapshot = await getDocs(preOrderQuery);
        const items = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setPreOrderItems(items);
      } catch (error) {
        console.error('Error fetching pre-order items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreOrderItems();
  }, []);

  if (loading) {
    return <div className="loading">Loading Pre-Order Items...</div>;
  }

  return (
    <div className="pre-order-page">
      <h1>Pre-Order Your Handcrafted Drum</h1>
      <p className="subtitle">Limited quantities available. Reserve yours today!</p>
      <div className="pre-order-items">
        {preOrderItems.map((item) => (
          <div key={item.id} className="pre-order-item">
            {/* Use the first image URL from the images array */}
            <img
  src={item.images?.[0] || '/fallback-images/images-coming-soon-regular.png'}
  alt={item.name}
  className="pre-order-image"
  onError={(e) => (e.target.src = '/fallback-images/images-coming-soon-regular.png')}
/>
            <div className="pre-order-info">
              <h2>{item.name}</h2>
              <p>{item.description}</p>
              <div className="price-container">
                {/* <p className="regular-price">Regular: ${item.regularPrice}</p> */}
                <p className="promo-price">Pre-Order Price: ${item.promoPrice}</p>
              </div>
              <Link to={`/products/${item.id}`}>
                <button className="pre-order-button">Pre-Order Now</button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PreOrderPage;