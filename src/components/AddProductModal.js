import React, { useState } from 'react';
import { addProduct } from '../services/productService';
import { uploadImage } from '../services/firebaseService';

const AddProductModal = () => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [image, setImage] = useState(null);

    const handleAddProduct = async () => {
        try {
            const imageUrl = image ? await uploadImage(image) : null;
            const productData = { name, description, price: parseFloat(price), imageUrl };
            await addProduct(productData);
            console.log('Product added successfully');
        } catch (error) {
            console.error('Failed to add product:', error.message);
        }
    };

    return (
        <div>
            <h1>Add Product</h1>
            <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
            <input type="file" onChange={(e) => setImage(e.target.files[0])} />
            <button onClick={handleAddProduct}>Add Product</button>
        </div>
    );
};

export default AddProductModal;
