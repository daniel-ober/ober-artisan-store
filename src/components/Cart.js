import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom'; // Import Link for navigation
import { loadStripe } from '@stripe/stripe-js';
import './Cart.css';

const stripePromise = loadStripe('pk_test_51PrBd7Jbbx8jAR4NZ2vOilq5lRJaQ0JnQjT9R7Z1brJvVokZc6TpaRFtX67jSCg8PpeqeUqmXBmFTUBLo0lkeI1G00KrLLeSJb');

const Cart = () => {
    const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleQuantityChange = (productId, change) => {
        const currentQuantity = cart[productId]?.quantity || 0;
        const newQuantity = currentQuantity + change;

        if (newQuantity < 1) {
            removeFromCart(productId);
        } else {
            updateQuantity(productId, newQuantity);
        }
    };

    const getItemTotal = (item) => {
        return (item.price || 0) * (item.quantity || 0);
    };

    const getTotalAmount = () => {
        return Object.values(cart || {}).reduce((total, item) => total + getItemTotal(item), 0);
    };

    const handleCheckout = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:4949/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    products: Object.values(cart).map(product => ({
                        name: product.name || 'Unnamed Product',
                        price: product.priceId || '0',
                        quantity: product.quantity || 0,
                    })),
                    userId: user?.uid,
                }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const session = await response.json();
            window.location.href = session.url;

            clearCart();
        } catch (error) {
            console.error('Failed to redirect to checkout:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div className="cart-container">
            <h1>Your Cart</h1>
            {Object.keys(cart || {}).length === 0 ? (
                <p>Your cart is empty.</p>
            ) : (
                <>
                    {Object.values(cart).map((item) => (
                        <div key={item.id} className="cart-item">
                            {item.images && item.images[0] && (
                                <Link to={`/products/${item.id}`}> {/* Link to product detail page */}
                                    <img src={item.images[0]} alt={item.name} className="cart-item-image" />
                                </Link>
                            )}
                            <div className="cart-item-details">
                                <h2>{item.name || 'Unnamed Product'}</h2>
                                <p>{item.description || 'No description available.'}</p>
                                <p>${typeof item.price === 'number' ? item.price.toFixed(2) : 'N/A'}</p>

                                <div className="quantity-control">
                                    <button 
                                        onClick={() => handleQuantityChange(item.id, -1)}
                                        disabled={item.category === 'artisan'}
                                        className={item.category === 'artisan' ? 'disabled-button' : ''}
                                    >
                                        -
                                    </button>
                                    <span>{item.quantity || 0}</span>
                                    <button 
                                        onClick={() => handleQuantityChange(item.id, 1)} 
                                        disabled={item.category === 'artisan'}
                                        className={item.category === 'artisan' ? 'disabled-button' : ''}
                                    >
                                        +
                                    </button>
                                </div>

                                <button onClick={() => removeFromCart(item.id)} className="remove-button">
                                    Remove
                                </button>
                            </div>
                            <div className="cart-item-total">
                                <p>Total: ${(getItemTotal(item) || 0).toFixed(2)}</p>
                            </div>
                        </div>
                    ))}

                    <div className="cart-total">
                        <h3>Total Amount: ${(getTotalAmount() || 0).toFixed(2)}</h3>
                    </div>

                    <button
                        onClick={handleCheckout}
                        className="checkout-button"
                        disabled={loading || Object.keys(cart).length === 0}
                    >
                        {loading ? 'Processing...' : 'Checkout'}
                    </button>
                </>
            )}
        </div>
    );
};

export default Cart;
