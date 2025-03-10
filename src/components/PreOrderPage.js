import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import PreOrderCard from "./PreOrderCard";
import "./PreOrderPage.css";

const PreOrderPage = () => {
  const [preOrderItems, setPreOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreOrderItems = async () => {
      try {
        console.log("📥 Fetching pre-order items...");
        const preOrderQuery = query(collection(db, "products"), where("isPreOrder", "==", true));
        const querySnapshot = await getDocs(preOrderQuery);
        let items = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort by displayOrder
        items = items.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

        setPreOrderItems(items);
      } catch (error) {
        console.error("❌ Error fetching pre-order items:", error);
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
      <h1 className="pre-order-page-header">Pre-Order Your Handcrafted Drum</h1>
      <p className="subtitle">Limited quantities available. Reserve yours today!</p>

      <div className="pre-order-items">
        {preOrderItems.map((item) => (
          <PreOrderCard key={item.id} product={item} />
        ))}
      </div>
    </div>
  );
};

export default PreOrderPage;