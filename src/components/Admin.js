import React, { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { auth } from '../firebaseConfig';

const Admin = () => {
  const [products, setProducts] = useState([]);
  const [email, setEmail] = useState('');
  const [ip, setIp] = useState('');
  const [userRole, setUserRole] = useState(''); // To determine if the user is an admin

  const db = getFirestore();

  useEffect(() => {
    const fetchProducts = async () => {
      const q = query(collection(db, 'products'));
      const querySnapshot = await getDocs(q);
      const productList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productList);
    };

    fetchProducts();
  }, [db]);

  // Placeholder for admin role check - replace with actual role verification logic
  useEffect(() => {
    // Assume a function `checkAdminRole` determines if the user is an admin
    // Example: setUserRole('admin') if the user is an admin
    if (auth.currentUser && auth.currentUser.email === 'admin@example.com') {
      setUserRole('admin');
    }
  }, []);

  const handleAddProduct = async () => {
    // Add a product - replace with actual product data
    await addDoc(collection(db, 'products'), { name: 'New Product', price: 100 });
    // Refresh the product list
    const querySnapshot = await getDocs(collection(db, 'products'));
    setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleRemoveProduct = async (id) => {
    await deleteDoc(doc(db, 'products', id));
    // Refresh the product list
    const querySnapshot = await getDocs(collection(db, 'products'));
    setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleBlockUser = async () => {
    // Implement blocking logic (e.g., saving blocked users to a database)
    console.log(`Blocking user with email: ${email} and IP: ${ip}`);
  };

  if (userRole !== 'admin') {
    return <p>You do not have access to this section.</p>;
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <h2>Manage Products</h2>
      <button onClick={handleAddProduct}>Add Product</button>
      <ul>
        {products.map(product => (
          <li key={product.id}>
            {product.name} - ${product.price}
            <button onClick={() => handleRemoveProduct(product.id)}>Remove</button>
          </li>
        ))}
      </ul>
      <h2>Block User</h2>
      <input type="text" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="text" placeholder="IP Address" value={ip} onChange={(e) => setIp(e.target.value)} />
      <button onClick={handleBlockUser}>Block User</button>
    </div>
  );
};

export default Admin;
