import React, { useState, useEffect } from 'react';
import { fetchProducts, deleteProduct, updateProduct } from '../services/productService';

const ManageProducts = () => {
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
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllProducts();
    }, []);

    const toggleProductStatus = async (productId, currentStatus) => {
        const newStatus = currentStatus === 'available' ? 'unavailable' : 'sold';
        try {
            await updateProduct(productId, { status: newStatus });
            setProducts(products.map(product => 
                product.id === productId ? { ...product, status: newStatus } : product
            ));
        } catch (err) {
            console.error('Failed to update product status:', err);
            setError('Error updating product status.');
        }
    };

    if (loading) return <p>Loading products...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
            <h1>Manage Products</h1>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(product => (
                        <tr key={product.id}>
                            <td>{product.name}</td>
                            <td>{product.status}</td>
                            <td>
                                <button onClick={() => toggleProductStatus(product.id, product.status)}>
                                    {product.status === 'Mark Available' ? 'Mark Unavailable' : 'Inactive'}
                                </button>
                                <button onClick={() => updateProduct(product.id)}>Edit</button>
                                <button onClick={() => deleteProduct(product.id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ManageProducts;
