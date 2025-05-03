import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import ArtisanShopCard from './ArtisanShopCard';
import './ArtisanShop.css';

const ArtisanShop = () => {
  const [preOrderItems, setPreOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreOrderItems = async () => {
      try {
        const productQuery = collection(db, 'products');
        const querySnapshot = await getDocs(productQuery);
  
        let items = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(
            (item) =>
              !item.status || ['available', 'preorder'].includes(item.status)
          );
  
        items = items.sort(
          (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
        );
  
        // Move founders-toast to the end
        const foundersToast = items.find((item) => item.id === 'founders-toast');
        if (foundersToast) {
          items = items.filter((item) => item.id !== 'founders-toast');
          items.push(foundersToast);
        }
  
        setPreOrderItems(items);
      } catch (error) {
        console.error('❌ Error fetching artisan shop items:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchPreOrderItems();
  }, []);

  if (loading) {
    return <div className="loading">Loading Artisan Shop...</div>;
  }

  return (
    <div className="pre-order-page">
      <h1 className="pre-order-page-header">Explore the Artisan Shop</h1>
      <p className="subtitle">
        Reserve your handcrafted drum or specialty item — limited availability.
      </p>

      <div className="pre-order-items">
        {preOrderItems.map((item) => (
          <ArtisanShopCard key={item.id} product={item} />
        ))}
      </div>
    </div>
  );
};

export default ArtisanShop;