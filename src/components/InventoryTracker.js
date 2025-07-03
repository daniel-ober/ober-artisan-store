import React, { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { seedInventory } from '../../utils/seedFirestore'; // ✅ IMPORT SEED FUNCTION
import './InventoryTracker.css';

const InventoryTracker = () => {
  const [inventory, setInventory] = useState([]);
  const [newItem, setNewItem] = useState({});

  const fetchInventory = async () => {
    const querySnapshot = await getDocs(collection(db, 'inventory'));
    setInventory(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAdd = async () => {
    await addDoc(collection(db, 'inventory'), newItem);
    fetchInventory(); // ✅ Refresh instead of window reload
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'inventory', id));
    fetchInventory(); // ✅ Refresh instead of window reload
  };

  return (
    <div className="inventory-tracker">
      <h1>Inventory Tracker</h1>
      <button onClick={seedInventory}>Seed Firestore with Inventory</button> {/* ✅ SEED BUTTON */}
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>SubCategory</th>
            <th>Name</th>
            <th>Quantity</th>
            <th>Unit</th>
            <th>Location</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map(item => (
            <tr key={item.id}>
              <td>{item.category}</td>
              <td>{item.subCategory}</td>
              <td>{item.name}</td>
              <td>{item.quantity}</td>
              <td>{item.unit}</td>
              <td>{item.location}</td>
              <td>
                <button onClick={() => handleDelete(item.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Add New Item</h2>
      <input placeholder="Name" onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
      <input placeholder="Category" onChange={e => setNewItem({ ...newItem, category: e.target.value })} />
      <input placeholder="SubCategory" onChange={e => setNewItem({ ...newItem, subCategory: e.target.value })} />
      <input placeholder="Quantity" type="number" onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })} />
      <input placeholder="Unit" onChange={e => setNewItem({ ...newItem, unit: e.target.value })} />
      <input placeholder="Location" onChange={e => setNewItem({ ...newItem, location: e.target.value })} />
      <button onClick={handleAdd}>Add Item</button>
    </div>
  );
};

export default InventoryTracker;