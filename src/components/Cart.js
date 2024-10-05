// src/components/Cart.js
import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import './Cart.css';

const stripePromise = loadStripe('your-publishable-key-here');

const Cart = () => {
    const { cart, updateQuantity, removeFromCart, clearCart } = useCart(); // Add clearCart function
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
        return (item.price || 0) * (item.quantity || 0); // Safely handle undefined values
    };

    const getTotalAmount = () => {
        return Object.values(cart || {}).reduce((total, item) => total + getItemTotal(item), 0);
    };

    const handleCheckout = async () => {
        setLoading(true); // Start loading when checkout begins
        try {
            const response = await fetch('http://localhost:4949/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    products: Object.values(cart).map(product => ({
                        name: product.name || 'Unnamed Product', // Fallback name
                        price: product.priceId || '0', // Ensure priceId is valid
                        quantity: product.quantity || 0, // Default to 0 if undefined
                    })),
                    userId: user?.uid,
                }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const session = await response.json();
            window.location.href = session.url;

            // Clear the cart after a successful purchase
            clearCart();
        } catch (error) {
            console.error('Failed to redirect to checkout:', error);
        } finally {
            setLoading(false); // Stop loading after the process
        }
    };

    // Debugging: Log cart content
    console.log("Cart items:", cart);

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
                    {Object.values(cart).map((item) => {
                        // Debugging: Log each item and its price
                        console.log("Cart item details:", item);
                        console.log("Item price:", item.price, "Type:", typeof item.price);
                        
                        return (
                            <div key={item.id} className="cart-item"> {/* Ensure item.id is unique */}
                                {item.images && item.images[0] && (
                                    <img src={item.images[0]} alt={item.name} className="cart-item-image" />
                                )}
                                <div className="cart-item-details">
                                    <h2>{item.name || 'Unnamed Product'}</h2> {/* Fallback name */}
                                    <p>{item.description || 'No description available.'}</p>
                                    <p>${typeof item.price === 'number' ? item.price.toFixed(2) : 'N/A'}</p> {/* Safe toFixed use */}

                                    <div className="quantity-control">
                                        <button 
                                            onClick={() => handleQuantityChange(item.id, -1)}
                                            disabled={item.category === 'custom shop' || item.category === 'one of a kind'}
                                        >
                                            -
                                        </button>
                                        <span>{item.quantity || 0}</span> {/* Fallback to 0 */}
                                        <button 
                                            onClick={() => handleQuantityChange(item.id, 1)} 
                                            disabled={item.category === 'custom shop' || item.category === 'one of a kind'}
                                        >
                                            +
                                        </button>
                                    </div>

                                    <button onClick={() => removeFromCart(item.id)} className="remove-button">
                                        Remove
                                    </button>
                                </div>
                                <div className="cart-item-total">
                                    <p>Total: ${(getItemTotal(item) || 0).toFixed(2)}</p> {/* Safe toFixed use */}
                                </div>
                            </div>
                        );
                    })}

                    <div className="cart-total">
                        <h3>Total Amount: ${(getTotalAmount() || 0).toFixed(2)}</h3> {/* Safe toFixed use */}
                    </div>

                    <button
                        onClick={handleCheckout}
                        className="checkout-button"
                        disabled={loading || Object.keys(cart).length === 0} // Disable if cart is empty
                    >
                        {loading ? 'Processing...' : 'Checkout'}
                    </button>
                </>
            )}
        </div>
    );
};

export default Cart;
