import React, { useState, useEffect, useCallback } from 'react';
import { fetchProductById, updateProduct } from '../services/productService';

const EditProductModal = ({ productId, onClose, onProductUpdated }) => {
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProduct = useCallback(async () => {
        try {
            const data = await fetchProductById(productId);
            setProduct(data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch product details.');
            setLoading(false);
        }
    }, [productId]);

    useEffect(() => {
        fetchProduct();
    }, [fetchProduct]);

    const handleUpdateProduct = async () => {
        try {
            await updateProduct(product.id, product);
            onProductUpdated(product);
            onClose();
        } catch (err) {
            setError('Failed to update product.');
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className="modal">
            <h2>Edit Product</h2>
            <input
                type="text"
                value={product.name}
                onChange={(e) => setProduct({ ...product, name: e.target.value })}
                placeholder="Product Name"
            />
            <textarea
                value={product.description}
                onChange={(e) => setProduct({ ...product, description: e.target.value })}
                placeholder="Product Description"
            />
            <select
                value={product.status}
                onChange={(e) => setProduct({ ...product, status: e.target.value })}
            >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
            </select>
            <button onClick={handleUpdateProduct}>Update Product</button>
            <button onClick={onClose}>Cancel</button>
        </div>
    );
};

export default EditProductModal;
