import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext'; // Import CartContext

const CheckoutSummary = () => {
    const location = useLocation();
    const { clearCartOnCheckout } = useCart(); // Get clearCartOnCheckout from CartContext
    const [orderDetails, setOrderDetails] = useState(null);
    const [isCartCleared, setIsCartCleared] = useState(false); // Add a flag to track cart clearing

    useEffect(() => {
        const fetchOrderDetails = async () => {
            const params = new URLSearchParams(location.search);
            const sessionId = params.get('session_id');

            if (!sessionId) {
                console.error('Session ID not found in query parameters');
                return;
            }

            try {
                // Fetch the Firestore document using the session_id from metadata
                const response = await fetch(`http://localhost:4949/api/orders/by-session/${sessionId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch order details');
                }

                const data = await response.json();
                console.log('Order Details:', data);
                setOrderDetails(data);

                // Clear the cart if it hasn't been cleared yet
                if (!isCartCleared) {
                    await clearCartOnCheckout();
                    console.log('Cart cleared successfully.');
                    setIsCartCleared(true); // Mark as cleared
                }
            } catch (error) {
                console.error('Error fetching order details:', error);
            }
        };

        fetchOrderDetails();
    }, [location, clearCartOnCheckout, isCartCleared]);

    if (!orderDetails) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Checkout Summary</h1>
            <p>Order ID: {orderDetails.id}</p>
            <p>Customer Name: {orderDetails.customerName}</p>
            <p>Total Amount: {orderDetails.totalAmount}</p>
            {/* Render additional order details as needed */}
        </div>
    );
};

export default CheckoutSummary;