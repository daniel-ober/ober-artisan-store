// src/components/AdminModal.js
import React, { useState } from 'react';
import { firestore } from '../firebaseConfig';
import { setDoc, doc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Import auth from your Firebase config

const AdminModal = ({ type, onClose }) => {
    const [formData, setFormData] = useState({});
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (type === 'user') {
                const password = `${formData.firstName}${formData.lastName}${new Date().getFullYear()}`;
                // Create a user in Firestore
                await setDoc(doc(firestore, 'users', formData.email), {
                    ...formData,
                    password, // Set the password
                });
                // Send a password reset email
                await sendPasswordResetEmail(auth, formData.email);
                onClose(); // Close the modal after submission
            } else if (type === 'product') {
                await setDoc(doc(firestore, 'products', formData.id), formData);
                onClose();
            } else if (type === 'order') {
                await setDoc(doc(firestore, 'orders', formData.id), formData);
                onClose();
            }
        } catch (err) {
            setError('Error adding record: ' + err.message);
        }
    };

    return (
        <div className="modal">
            <h2>Add {type}</h2>
            {error && <p>{error}</p>}
            <form onSubmit={handleSubmit}>
                {type === 'user' && (
                    <>
                        <input type="text" name="firstName" placeholder="First Name" onChange={handleChange} required />
                        <input type="text" name="lastName" placeholder="Last Name" onChange={handleChange} required />
                        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
                    </>
                )}
                {type === 'product' && (
                    <>
                        <input type="text" name="id" placeholder="Product ID" onChange={handleChange} required />
                        <input type="text" name="name" placeholder="Product Name" onChange={handleChange} required />
                        <input type="number" name="price" placeholder="Price" onChange={handleChange} required />
                    </>
                )}
                {type === 'order' && (
                    <>
                        <input type="text" name="id" placeholder="Order ID" onChange={handleChange} required />
                        <input type="text" name="productId" placeholder="Product ID" onChange={handleChange} required />
                        <input type="text" name="userId" placeholder="User ID" onChange={handleChange} required />
                    </>
                )}
                <button type="submit">Add {type}</button>
                <button type="button" onClick={onClose}>Cancel</button>
            </form>
        </div>
    );
};

export default AdminModal;
