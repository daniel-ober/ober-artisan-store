import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import './Cart.css';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

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
            const productsPayload = Object.values(cart).map((product) => {
                if (!product.price || isNaN(product.price)) {
                    throw new Error(`Product ${product.name} has an invalid price.`);
                }
    
                return {
                    name: product.name || 'Unnamed Product',
                    description: product.description || 'No description available',
                    price: product.price, // Price in dollars; backend converts to cents
                    quantity: product.quantity || 1,
                };
            });
    
            console.log('Products Payload:', productsPayload); // Log payload
    
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
    
            if (!response.ok) {
                throw new Error(`Failed to create checkout session. Server responded with: ${response.status}`);
            }
    
            const session = await response.json();
            console.log('Checkout Session:', session);
    
            if (!session.url) {
                throw new Error('Session URL is missing in the response.');
            }
    
            window.location.href = session.url;
        } catch (error) {
            console.error('Failed to redirect to checkout:', error.message);
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
                        <div key={item.id} className="cart-item">
                            {item.images && item.images[0] && (
                                <Link to={`/products/${item.id}`}>
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
