import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '../firebaseConfig'; // Ensure correct import
import { useCart } from '../context/CartContext'; 
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const CheckoutSummary = () => {
    const location = useLocation();
    const { clearCartOnCheckout } = useCart(); 
    const [orderDetails, setOrderDetails] = useState(null);
    const [isCartCleared, setIsCartCleared] = useState(false);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            const params = new URLSearchParams(location.search);
            const sessionId = params.get('session_id');

            if (!sessionId) {
                console.error('Session ID not found in query parameters');
                return;
            }

            try {
                const response = await fetch(`http://localhost:4949/api/orders/by-session/${sessionId}`);
                if (!response.ok) throw new Error('Failed to fetch order details');

                const data = await response.json();
                console.log('✅ Order Details:', data);
                setOrderDetails(data);

                if (!isCartCleared) {
                    // Update product inventory before clearing cart
                    await updateProductInventory(data.items);
                    
                    await clearCartOnCheckout();
                    console.log('🛒 Cart cleared successfully.');
                    setIsCartCleared(true);
                }
            } catch (error) {
                console.error('❌ Error fetching order details:', error);
            }
        };

        fetchOrderDetails();
    }, [location, clearCartOnCheckout, isCartCleared]);

    const updateProductInventory = async (items) => {
        try {
            console.log("🔍 Starting inventory update for items:", items);
    
            for (const item of items) {
                console.log(`📌 Checking product ID: ${item.productId}`);
    
                const productRef = doc(db, "products", item.productId);
                const productSnap = await getDoc(productRef);
    
                if (!productSnap.exists()) {
                    console.warn(`⚠️ Product not found in Firestore: ${item.productId}`);
                    continue;
                }
    
                const productData = productSnap.data();
                console.log(`📊 Current stock for ${item.productId}: ${productData.currentQuantity}`);
    
                const newQuantity = Math.max(0, productData.currentQuantity - item.quantity);
                console.log(`🔄 Updating stock: ${productData.currentQuantity} -> ${newQuantity}`);
    
                await updateDoc(productRef, { currentQuantity: newQuantity });
                console.log(`✅ Inventory updated for ${item.productId}`);
            }
    
            console.log("✅ Finished updating inventory!");
        } catch (error) {
            console.error("❌ Error updating inventory:", error);
        }
    };

    if (!orderDetails) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Checkout Summary</h1>
            <p>Order ID: {orderDetails.id}</p>
            <p>Customer Name: {orderDetails.customerName}</p>
            <p>Total Amount: {orderDetails.totalAmount}</p>
        </div>
    );
};

export default CheckoutSummary;