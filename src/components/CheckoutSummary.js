import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { useCart } from '../context/CartContext'; 
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import './CheckoutSummary.css'; 

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
                if (!item.productId) {
                    console.warn("⚠️ Skipping item due to missing productId:", item);
                    continue; // Skip this item
                }
    
                console.log(`📌 Checking product ID: ${item.productId}`);
    
                // Ensure correct Firestore reference
                let productRef;
                if (item.productId === "feuzon" || item.productId === "heritage") {
                    productRef = doc(db, "products", item.productId);
                } else {
                    productRef = doc(db, "products", item.productId);
                }
    
                const productSnap = await getDoc(productRef);
    
                if (!productSnap.exists()) {
                    console.warn(`⚠️ Product not found in Firestore: ${item.productId}`);
                    continue;
                }
    
                const productData = productSnap.data();
                console.log(`📊 Current stock for ${item.productId}: ${productData.currentQuantity}`);
    
                const newQuantity = Math.max(0, (productData.currentQuantity || 0) - (item.quantity || 1));
                console.log(`🔄 Updating stock: ${productData.currentQuantity} -> ${newQuantity}`);
    
                await updateDoc(productRef, { currentQuantity: newQuantity });
                console.log(`✅ Inventory updated for ${item.productId}`);
            }
    
            console.log("✅ Finished updating inventory!");
        } catch (error) {
            console.error("❌ Error updating inventory:", error);
        }
    };

    const printReceipt = () => {
        window.print();
    };

    if (!orderDetails) {
        return <div className="loading">Loading your order details...</div>;
    }

    const {
        id = 'N/A',
        customerName = 'Customer',
        orderDate = new Date().toISOString(),
        items = [],
        subtotal = 0,
        tax = 0,
        shipping = 0,
        discount = 0,
        totalAmount = 0,
        shippingName = 'N/A',
        shippingAddress = 'N/A',
        estimatedDelivery = 'Not available',
        paymentMethod = {}
    } = orderDetails;

    return (
        <div className="transaction-success">
            <h1>Order Successful!</h1>
            <p className="confirmation-msg">Your order has been successfully placed.</p>

            <div className="order-details">
                <h2>Order Summary</h2>
                <p><strong>Order ID:</strong> {id}</p>
                <p><strong>Order Date:</strong> {new Date(orderDate).toLocaleDateString()}</p>

                <h3>Items Purchased</h3>
                <ul className="item-list">
                    {items.length > 0 ? items.map((item, index) => (
                        <li key={index} className="product-card">
                            <strong>{item.name}</strong> ({item.productId})  
                            
                            {(item.size || item.depth) && <p>📏 Size: {item.size || "N/A"}&quot; x {item.depth || "N/A"}&quot;</p>}
                            {(item.lugQuantity || item.staveQuantity) && (
                                <p>🔩 Lugs: {item.lugQuantity || "N/A"} | 🪵 Staves: {item.staveQuantity || "N/A"}</p>
                            )}
                            {item.reRing && <p>🛠️ Re-Ring: Yes</p>}
                            {item.shellThickness && <p>🪵 Shell Thickness: {item.shellThickness}mm</p>}
                            
                            {item.constructionType === "Hybrid" && (
                                <>
                                    <p>Outer Shell: {item.outerShellWood || "Unknown"}</p>
                                    <p>Inner Shell: {item.innerShellWood || "Unknown"}</p>
                                </>
                            )}
                            
                            <p>💰 Price: ${item.price ? item.price.toFixed(2) : "N/A"}</p>
                            <p>🛒 Quantity: {item.quantity}</p>
                        </li>
                    )) : <p>No items found</p>}
                </ul>

                <h3>Payment Details</h3>
                <p><strong>Subtotal:</strong> ${subtotal.toFixed(2)}</p>
                <p><strong>Tax:</strong> ${tax.toFixed(2)}</p>
                <p><strong>Shipping:</strong> ${shipping.toFixed(2)}</p>
                {discount > 0 && <p><strong>Discount:</strong> -${discount.toFixed(2)}</p>}
                <p className="total"><strong>Total Amount:</strong> ${totalAmount.toFixed(2)}</p>

                <h3>Shipping Information</h3>
                <p><strong>Recipient:</strong> {shippingName}</p>
                <p><strong>Address:</strong> {shippingAddress}</p>
                <p><strong>Estimated Delivery:</strong> {estimatedDelivery}</p>

                <h3>Payment Info</h3>
                <p><strong>Card Used:</strong> {paymentMethod.brand || "N/A"} •••• {paymentMethod.last4 || "XXXX"}</p>

                <button className="print-receipt" onClick={printReceipt}>🖨️ Print Receipt</button>
            </div>
        </div>
    );
};

export default CheckoutSummary;