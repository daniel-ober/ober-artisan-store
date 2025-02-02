// src/components/PreOrderPage.js
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Link } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import ProductCard from "./ProductCard";  
import "./PreOrderPage.css";

const artisanLogos = {
  "Heritage": {
    light: "/artisanseries/logo-black-heritage.png",
    dark: "/artisanseries/logo-white-heritage.png",
  },
  "Feuzon": {
    light: "/artisanseries/logo-black-feuzon.png",
    dark: "/artisanseries/logo-white-feuzon.png",
  },
  "Sound Legend": {
    light: "/artisanseries/logo-black-soundlegend.png",
    dark: "/artisanseries/logo-white-soundlegend.png",
  },
};

const PreOrderPage = ({ isDarkMode, isAdmin }) => {  // ✅ Accept isDarkMode as a prop
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
      <h1>Pre-Order Your Handcrafted Drum</h1>
      <p className="subtitle">Limited quantities available. Reserve yours today!</p>

      {isAdmin ? (
        <DragDropContext>
          <Droppable droppableId="preOrderItems" direction="horizontal">
            {(provided) => (
              <div
                className="pre-order-items droppable-container"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {preOrderItems.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`pre-order-item draggable-item ${snapshot.isDragging ? "dragging" : ""}`}
                      >
                        <img
                          src={item.thumbnail || item.images?.[0] || "/fallback.jpg"}
                          alt={item.name}
                          className="pre-order-image"
                          loading="lazy"
                        />
                        <div className="pre-order-info">
                          {/* ✅ Dynamically switch logos based on isDarkMode */}
                          {artisanLogos[item.name] ? (
                            <img
                              src={isDarkMode ? artisanLogos[item.name].dark : artisanLogos[item.name].light}
                              alt={item.name}
                              className="artisan-logo"
                            />
                          ) : (
                            <h2>{item.name}</h2> // Fallback if no logo exists
                          )}
                          <p>{item.description}</p>
                          <div className="price-container">
                            <p>Price: ${item.price}</p>
                            <Link to={`/products/${item.id}`}>
                              <button className="pre-order-button">Pre-Order Now</button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <div className="pre-order-items">
          {preOrderItems.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PreOrderPage;