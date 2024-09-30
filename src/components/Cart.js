// src/components/Cart.js
import React from 'react';
import { useCart } from '../context/CartContext';
import './Cart.css';

const Cart = () => {
    const { cart, updateQuantity, removeFromCart } = useCart();

    const handleQuantityChange = (productId, change) => {
        const currentQuantity = cart[productId].quantity;
        const newQuantity = currentQuantity + change;

        // Remove item from cart if the quantity goes below 1
        if (newQuantity < 1) {
            removeFromCart(productId);
        } else {
            updateQuantity(productId, newQuantity);
        }
    };

    const getItemTotal = (item) => {
        return item.price * item.quantity;
    };

    const getTotalAmount = () => {
        return Object.values(cart).reduce((total, item) => {
            return total + getItemTotal(item);
        }, 0);
    };

    return (
        <div className="cart-container">
            <h1>Your Cart</h1>
            {Object.keys(cart).length === 0 ? (
                <p>Your cart is empty.</p>
            ) : (
                <>
                    {Object.values(cart).map((item) => (
                        <div key={item.id} className="cart-item">
                            <img src={item.images[0]} alt={item.name} className="cart-item-image" />
                            <div className="cart-item-details">
                                <h2>{item.name}</h2>
                                <p>{item.description}</p>
                                <p>${item.price}</p>

                                <div className="quantity-control">
                                    <button 
                                        onClick={() => handleQuantityChange(item.id, -1)}
                                        disabled={item.category === 'custom shop' || item.category === 'one of a kind'}
                                    >
                                        -
                                    </button>
                                    <span>{item.quantity}</span>
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
                                <p>Total: ${getItemTotal(item)}</p>
                            </div>
                        </div>
                    ))}

                    <div className="cart-total">
                        <h3>Total Amount: ${getTotalAmount().toFixed(2)}</h3>
                    </div>
                </>
            )}
        </div>
    );
};

export default Cart;
