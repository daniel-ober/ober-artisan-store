import React, { useEffect, useState } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Replace 'firebaseConfig' with your file path
import './AdminModal.css';

const AdminModal = ({ type, onClose, productId }) => {
    const [formData, setFormData] = useState({});
    const [error, setError] = useState('');

    useEffect(() => {
        if (type === 'product' && productId) {
            const fetchProduct = async () => {
                try {
                    const productRef = doc(db, 'products', productId);
                    const productSnapshot = await getDoc(productRef);
                    if (productSnapshot.exists()) {
                        setFormData(productSnapshot.data());
                    }
                } catch (err) {
                    setError('Error fetching product details.');
                }
            };
            fetchProduct();
        }
    }, [type, productId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const collection = type === 'user' ? 'users' : type === 'order' ? 'orders' : 'products';
            const docRef = doc(db, collection, productId || formData.id);
            await setDoc(docRef, formData, { merge: true });
            onClose();
        } catch (err) {
            setError(`Error ${productId ? 'updating' : 'adding'} ${type}: ` + err.message);
        }
    };

    return (
        <div className="modal">
            <h2>{productId ? 'Edit' : 'Add'} {type}</h2>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit}>
                {type === 'user' && (
                    <>
                        <input
                            type="text"
                            name="firstName"
                            placeholder="First Name"
                            value={formData.firstName || ''}
                            onChange={handleChange}
                            required
                        />
                        <input
                            type="text"
                            name="lastName"
                            placeholder="Last Name"
                            value={formData.lastName || ''}
                            onChange={handleChange}
                            required
                        />
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email || ''}
                            onChange={handleChange}
                            required
                        />
                    </>
                )}
                {type === 'product' && (
                    <>
                        <input
                            type="text"
                            name="name"
                            placeholder="Product Name"
                            value={formData.name || ''}
                            onChange={handleChange}
                            required
                        />
                        <input
                            type="number"
                            name="price"
                            placeholder="Price"
                            value={formData.price || ''}
                            onChange={handleChange}
                            required
                        />
                        <textarea
                            name="description"
                            placeholder="Description"
                            value={formData.description || ''}
                            onChange={handleChange}
                        />
                    </>
                )}
                <button type="submit">{productId ? 'Update' : 'Add'} {type}</button>
                <button type="button" onClick={onClose}>Cancel</button>
            </form>
        </div>
    );
};

export default AdminModal;
