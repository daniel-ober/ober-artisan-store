import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { seedInventory } from '../utils/seedFirestore';
import './InventoryTracker.css';

const InventoryTracker = () => {
  const [inventory, setInventory] = useState([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const [newItem, setNewItem] = useState({
    category: '',
    subCategory: '',
    name: '',
    quantity: 0,
    unit: '',
    location: '',
  });

  // For picklists
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  const fetchInventory = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'inventory'));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setInventory(data);

      // Unique values for picklists
      setCategories([
        ...new Set(data.map((item) => item.category).filter(Boolean)),
      ]);
      setSubCategories([
        ...new Set(data.map((item) => item.subCategory).filter(Boolean)),
      ]);
    } catch (err) {
      console.error('❌ Error fetching inventory:', err);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAdd = async () => {
    if (!newItem.name) return alert('Item name is required.');
    try {
      await addDoc(collection(db, 'inventory'), newItem);
      setNewItem({
        category: '',
        subCategory: '',
        name: '',
        quantity: 0,
        unit: '',
        location: '',
      });
      fetchInventory();
    } catch (err) {
      console.error('❌ Error adding item:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'inventory', id));
      fetchInventory();
    } catch (err) {
      console.error('❌ Error deleting item:', err);
    }
  };

  const handleEdit = async (id, field, value) => {
    try {
      const docRef = doc(db, 'inventory', id);
      await updateDoc(docRef, { [field]: value });
      fetchInventory();
    } catch (err) {
      console.error('❌ Error updating item:', err);
    }
  };

  // Filtering
  const filteredInventory = inventory.filter((item) =>
    filterCategory ? item.category === filterCategory : true
  );

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInventory.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);

  return (
    <div className="inventory-tracker">
      <h1>Inventory Tracker</h1>
      <button onClick={seedInventory}>Seed Firestore with Inventory</button>

      <div className="filter">
        <label>Filter by Category:</label>
        <select
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">All</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

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
          {currentItems.map((item) => (
            <tr key={item.id}>
              <td>
                <select
                  value={item.category || ''}
                  onChange={(e) =>
                    handleEdit(item.id, 'category', e.target.value)
                  }
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <select
                  value={item.subCategory || ''}
                  onChange={(e) =>
                    handleEdit(item.id, 'subCategory', e.target.value)
                  }
                >
                  <option value="">Select SubCategory</option>
                  {subCategories.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </td>
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

      <div className="pagination">
        <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}>
          Prev
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() =>
            setCurrentPage((p) => Math.min(p + 1, totalPages))
          }
        >
          Next
        </button>
      </div>

      <h2>Add New Item</h2>
      <div className="form">
        <input
          placeholder="Name"
          value={newItem.name}
          onChange={(e) =>
            setNewItem({ ...newItem, name: e.target.value })
          }
        />

        <label>Category</label>
        <select
          value={newItem.category}
          onChange={(e) =>
            setNewItem({ ...newItem, category: e.target.value })
          }
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <label>SubCategory</label>
        <select
          value={newItem.subCategory}
          onChange={(e) =>
            setNewItem({ ...newItem, subCategory: e.target.value })
          }
        >
          <option value="">Select SubCategory</option>
          {subCategories.map((sub) => (
            <option key={sub} value={sub}>
              {sub}
            </option>
          ))}
        </select>

        <input
          placeholder="Quantity"
          type="number"
          value={newItem.quantity}
          onChange={(e) =>
            setNewItem({
              ...newItem,
              quantity: parseInt(e.target.value) || 0,
            })
          }
        />
        <input
          placeholder="Unit"
          value={newItem.unit}
          onChange={(e) =>
            setNewItem({ ...newItem, unit: e.target.value })
          }
        />
        <input
          placeholder="Location"
          value={newItem.location}
          onChange={(e) =>
            setNewItem({ ...newItem, location: e.target.value })
          }
        />
        <button onClick={handleAdd}>Add Item</button>
      </div>
    </div>
  );
};

export default InventoryTracker;