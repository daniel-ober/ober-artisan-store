import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './PreOrderPage.css';

const PreOrderPage = ({ isAdmin }) => {
  const { isAdmin: authIsAdmin } = useAuth();
  const [preOrderItems, setPreOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreOrderItems = async () => {
      try {
        console.log('📥 Fetching pre-order items...');
        const preOrderQuery = query(
          collection(db, 'products'),
          where('isPreOrder', '==', true)
        );
        const querySnapshot = await getDocs(preOrderQuery);
        const items = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort items based on displayOrder
        items.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

        setPreOrderItems(items);
      } catch (error) {
        console.error('❌ Error fetching pre-order items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreOrderItems();
  }, []);

  useEffect(() => {
    // Prevent window auto-scroll when dragging
    const disableScroll = () => document.body.style.overflow = 'hidden';
    const enableScroll = () => document.body.style.overflow = 'auto';

    window.addEventListener("dragstart", disableScroll);
    window.addEventListener("dragend", enableScroll);

    return () => {
      window.removeEventListener("dragstart", disableScroll);
      window.removeEventListener("dragend", enableScroll);
    };
  }, []);

  // Handle drag-and-drop reordering
  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const updatedItems = [...preOrderItems];
    const [movedItem] = updatedItems.splice(result.source.index, 1);
    updatedItems.splice(result.destination.index, 0, movedItem);

    // Reassign correct displayOrder values
    updatedItems.forEach((item, index) => {
      item.displayOrder = index;
    });

    // Force re-render to fix overlapping issue
    setPreOrderItems([]);
    setTimeout(() => setPreOrderItems(updatedItems), 50);

    console.log('🔄 Reordering pre-order items...');

    // Update Firestore with new display order
    try {
      const batchUpdates = updatedItems.map((item) => {
        const productRef = doc(db, 'products', item.id);
        return updateDoc(productRef, { displayOrder: item.displayOrder });
      });

      await Promise.all(batchUpdates);
      console.log('✅ Successfully updated display order in Firestore.');
    } catch (error) {
      console.error('❌ Error updating display order in Firestore:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading Pre-Order Items...</div>;
  }

  return (
    <div className="pre-order-page">
      <h1>Pre-Order Your Handcrafted Drum</h1>
      <p className="subtitle">Limited quantities available. Reserve yours today!</p>

      {authIsAdmin ? (
        <div className="admin-section">
          <h2>Admin Mode: Drag & Drop to Reorder</h2>
          <DragDropContext onDragEnd={onDragEnd}>
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
                          style={{
                            ...provided.draggableProps.style,
                            transition: snapshot.isDragging ? "none" : "transform 0.2s ease-in-out",
                          }}
                        >
                          <img
                            src={item.images?.[0] || '/fallback-images/images-coming-soon-regular.png'}
                            alt={item.name}
                            className="pre-order-image"
                          />
                          <div className="pre-order-info">
                            <h2>{item.name}</h2>
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
        </div>
      ) : (
        <div className="pre-order-items">
          {preOrderItems.map((item) => (
            <div key={item.id} className="pre-order-item">
              <img
                src={item.images?.[0] || '/fallback-images/images-coming-soon-regular.png'}
                alt={item.name}
                className="pre-order-image"
              />
              <div className="pre-order-info">
                <h2>{item.name}</h2>
                <p>{item.description}</p>
                <div className="price-container">
                  <p>Price: ${item.price}</p>
                  <Link to={`/products/${item.id}`}>
                    <button className="pre-order-button">Pre-Order Now</button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PreOrderPage;