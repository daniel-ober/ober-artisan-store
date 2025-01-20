// src/components/ProductSync.js
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchProductUpdates } from "../redux/slices/productSlice"; // Action to fetch product updates

const ProductSync = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        await dispatch(fetchProductUpdates()); // Fetch product updates on load
      } catch (error) {
        console.error("Error fetching product updates:", error);
      }
    };

    fetchProducts();

    const interval = setInterval(() => {
      fetchProducts(); // Poll Firestore every 60 seconds for updates
    }, 60000); // Adjust interval as needed

    return () => clearInterval(interval); // Cleanup on unmount
  }, [dispatch]);

  return null; // No UI needed
};

export default ProductSync;