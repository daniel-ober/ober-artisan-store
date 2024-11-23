import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';  // Import Firebase
import { collection, getDocs, query, where } from 'firebase/firestore';
import './PreOrder.css';  // Add your own styling for PreOrder page

const PreOrder = () => {
  const [preOrderProducts, setPreOrderProducts] = useState([]);

  // Fetch products available for Pre-Order from Firestore
  useEffect(() => {
    const fetchPreOrderProducts = async () => {
      const q = query(collection(db, 'products'), where('isPreOrder', '==', true)); // Filter Pre-Order products
      const querySnapshot = await getDocs(q);
      const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPreOrderProducts(products);
    };
    fetchPreOrderProducts();
  }, []);

  return (
    <div className="pre-order-container">
      <h1>Pre-Order Products</h1>
      <div className="product-list">
        {preOrderProducts.length === 0 ? (
          <p>No products available for pre-order at this time.</p>
        ) : (
          preOrderProducts.map(product => (
            <div key={product.id} className="product-card">
              <img src={product.imageUrl} alt={product.name} className="product-image" />
              <div className="product-info">
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <p className="price">${product.price}</p>
                <button className="pre-order-btn">Pre-Order Now</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PreOrder;
