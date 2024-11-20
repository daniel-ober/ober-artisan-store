import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import './CheckoutSummary.css';

const CheckoutSummary = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const sessionId = queryParams.get('session_id');
    const userId = queryParams.get('userId');
    const status = queryParams.get('status');

    const [orderDetails, setOrderDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            setLoading(true);
            try {
                if (!sessionId) {
                    setError('Invalid session ID.');
                    return;
                }

                const existingOrder = await checkIfOrderExists(sessionId);
                if (!existingOrder) {
                    // Fetch order from the backend
                    const orderData = await fetchOrderFromBackend(sessionId);
                    if (orderData) {
                        await saveOrderToFirestore(orderData);
                        setOrderDetails(orderData);
                    }
                } else {
                    // Retrieve existing order from Firestore
                    const orderData = await fetchOrderFromFirestore(sessionId);
                    setOrderDetails(orderData);
                }
            } catch (err) {
                console.error('Error fetching order details:', err);
                setError('Failed to fetch order details. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [sessionId]);

    const checkIfOrderExists = async (stripeSessionId) => {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('stripeSessionId', '==', stripeSessionId));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    };

    const fetchOrderFromBackend = async (stripeSessionId) => {
        try {
            const response = await fetch(`/api/get-order-details?session_id=${stripeSessionId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch order from backend.');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching order from backend:', error);
            setError('Failed to retrieve order details from the backend.');
            return null;
        }
    };

    const saveOrderToFirestore = async (orderData) => {
        try {
            const ordersRef = collection(db, 'orders');
            await addDoc(ordersRef, {
                ...orderData,
                createdAt: new Date(),
                userId: userId || null,
            });
        } catch (error) {
            console.error('Error saving order to Firestore:', error);
            setError('Failed to save order to Firestore.');
        }
    };

    const fetchOrderFromFirestore = async (stripeSessionId) => {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('stripeSessionId', '==', stripeSessionId));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            return { ...querySnapshot.docs[0].data(), id: querySnapshot.docs[0].id };
        }
        return null;
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="error">{error}</p>;

    return (
        <div className="checkout-summary">
            <h1>Order Summary</h1>
            {orderDetails ? (
                <div className="order-details">
                    <h2>Customer Name: {orderDetails.customerName}</h2>
                    <p>Email: {orderDetails.customerEmail}</p>
                    <p>Products:</p>
                    {orderDetails.products.map((product, index) => (
                        <p key={index}>
                            {product.name} - ${product.price.toFixed(2)} x {product.quantity}
                        </p>
                    ))}
                    <p>Total Amount: ${orderDetails.totalAmount.toFixed(2)}</p>
                    <p>Payment Status: {orderDetails.status}</p>
                </div>
            ) : (
                <p>No order details available.</p>
            )}
        </div>
    );
};

export default CheckoutSummary;
