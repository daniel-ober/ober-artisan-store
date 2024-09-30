// src/components/Cart.js
import React from 'react';
import { useCart } from '../context/CartContext';
import './Cart.css';

const Cart = () => {
    const { cart, removeFromCart, updateQuantity } = useCart();

    const handleRemove = (productId) => {
        console.log(`Removing item with ID: ${productId}`);
        removeFromCart(productId); // Ensure productId is passed correctly
    };

    const handleQuantityChange = (productId, change) => {
        const currentItem = cart[productId];
        if (!currentItem) return;

        const newQuantity = currentItem.quantity + change;
        if (newQuantity <= 0) {
            handleRemove(productId);
        } else {
            updateQuantity(productId, newQuantity);
        }
    };

    const calculateTotal = () => {
        return Object.values(cart).reduce((acc, item) => {
            const itemTotal = item.price * item.quantity;
            console.log(`Calculating: ${item.name} - Price: $${item.price}, Quantity: ${item.quantity}, Item Total: $${itemTotal}`);
            return acc + itemTotal;
        }, 0).toFixed(2);
    };

    if (!cart || Object.keys(cart).length === 0) {
        return <p>Your cart is empty.</p>;
    }

    return (
        <div className="cart-container">
            <h2>Your Cart</h2>
            <ul className="cart-items">
                {Object.values(cart).map((item) => (
                    <li key={item.id} className="cart-item">
                        <img src={item.images[0]} alt={item.name} className="cart-item-image" />
                        <div className="cart-item-details">
                            <h3>{item.name}</h3>
                            <p>Price: ${item.price}</p>
                            <p>Quantity: {item.quantity}</p>
                            <div className="cart-item-controls">
                                <button onClick={() => handleQuantityChange(item.id, -1)}>-</button>
                                <button onClick={() => handleQuantityChange(item.id, 1)}>+</button>
                                <button onClick={() => handleRemove(item.id)}>Remove</button>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
            <h3>Total: ${calculateTotal()}</h3>
        </div>
    );
};

export default Cart;
