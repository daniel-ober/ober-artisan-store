import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Link } from 'react-router-dom';

const PreOrderPage = () => {
  const [preOrderItems, setPreOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreOrderItems = async () => {
      try {
        const preOrderQuery = query(
          collection(db, 'products'),
          where('category', '==', 'pre-order')
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
    return <div>Loading Pre-Order Items...</div>;
  }

  return (
    <div className="pre-order-page">
      <h1>Pre-Order Your Handcrafted Oaked Ember</h1>
      <p>Limited quantities available. Reserve yours today!</p>

      {preOrderItems.length > 0 ? (
        <div className="pre-order-items">
          {preOrderItems.map((item) => (
            <div key={item.id} className="pre-order-item">
              <h2>{item.name}</h2>
              <p>{item.description}</p>
              <p>Price: ${item.price}</p>
              <Link to={`/products/${item.id}`}>
                <button>Pre-Order Now</button>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <p>No pre-order items available at the moment.</p>
      )}
    </div>
  );
};

export default PreOrderPage;
