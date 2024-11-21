import React, { useState, useEffect } from 'react';
import { fetchProducts, deleteProduct } from '../services/productService';
import './ManageProducts.css';

const ManageProducts = ({ onEditProduct }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAllProducts = async () => {
            setLoading(true);
            try {
                const fetchedProducts = await fetchProducts();
                setProducts(fetchedProducts);
            } catch (err) {
                setError('Failed to fetch products. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchAllProducts();
    }, []);

    const handleDeleteProduct = async (productId) => {
        try {
            await deleteProduct(productId);
            setProducts(products.filter((product) => product.id !== productId));
        } catch (err) {
            setError('Error deleting product.');
        }
    };

    if (loading) return <p>Loading products...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className="manage-products-container">
            <h1>Manage Products</h1>
            <table className="manage-products-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product) => (
                        <tr key={product.id}>
                            <td>{product.name}</td>
                            <td>{product.status}</td>
                            <td>
                                <button
                                    className="edit-btn"
                                    onClick={() => onEditProduct(product.id)} // Trigger edit function
                                >
                                    Edit
                                </button>
                                <button
                                    className="delete-btn"
                                    onClick={() => handleDeleteProduct(product.id)}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ManageProducts;
