import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import './Cart.css';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const Cart = () => {
    const { cart, updateQuantity, removeFromCart } = useCart();
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
            const productsPayload = Object.values(cart).map((product) => ({
                name: product.name || 'Unnamed Product',
                description: product.description || 'No description available',
                price: product.price,
                quantity: product.quantity || 1,
            }));

            const response = await fetch(`${process.env.REACT_APP_API_URL}/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    products: productsPayload,
                    userId: user?.uid || 'guest',
                }),
            });

            const session = await response.json();
            window.location.href = session.url;
        } catch (error) {
            alert(`Checkout error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cart-container">
            <h1>Your Cart</h1>
            {Object.keys(cart || {}).length === 0 ? (
                <p>Your cart is empty.</p>
            ) : (
                <>
                    {Object.values(cart).map((item) => (
                        <div key={item.id} className={`cart-item ${item.category === 'artisan' ? 'artisan-item' : ''}`}>
                            <Link to={`/products/${item.id}`}>
                                <img src={item.images[0]} alt={item.name} className="cart-item-image" />
                            </Link>
                            <div className="cart-item-details">
                                <h2>{item.name}</h2>
                                <p>{item.description || 'No description available.'}</p>
                                <p>${item.price.toFixed(2)}</p>
                            </div>
                            <div className="cart-item-actions">
                                <div className="quantity-control">
                                    <button
                                        onClick={() => handleQuantityChange(item.id, -1)}
                                        disabled={item.category === 'artisan'}
                                        className={item.category === 'artisan' ? 'disabled-button' : ''}
                                        title={item.category === 'artisan' ? 'Artisan drums cannot be adjusted' : 'Decrease quantity'}
                                    >
                                        -
                                    </button>
                                    <span>{item.quantity || 0}</span>
                                    <button
                                        onClick={() => handleQuantityChange(item.id, 1)}
                                        disabled={item.category === 'artisan'}
                                        className={item.category === 'artisan' ? 'disabled-button' : ''}
                                        title={item.category === 'artisan' ? 'Artisan drums cannot be adjusted' : 'Increase quantity'}
                                    >
                                        +
                                    </button>
                                </div>
                                <button onClick={() => removeFromCart(item.id)} className="remove-btn">
                                    Remove
                                </button>
                                <p className="cart-item-total">Total: ${(getItemTotal(item) || 0).toFixed(2)}</p>
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