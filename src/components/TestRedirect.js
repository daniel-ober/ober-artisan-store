// src/pages/TestRedirect.js
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const TestRedirect = () => {
    const location = useLocation();

    useEffect(() => {
        // Log the query parameters for testing
        const params = new URLSearchParams(location.search);
        console.log('Session ID:', params.get('session_id'));
        console.log('Guest Token:', params.get('guest_token'));
    }, [location]);

    return (
        <div>
            <h1>Test Redirect Page</h1>
            <p>Check the console for query parameter logs.</p>
        </div>
    );
};

export default TestRedirect;