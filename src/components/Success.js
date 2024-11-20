import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

const Success = () => {
    const [queryParams] = useSearchParams();
    const sessionId = queryParams.get('session_id');
    const userId = queryParams.get('userId');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Optionally fetch session details from your backend using sessionId
        setLoading(false);
    }, [sessionId]);

    return (
        <div>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <div>
                    <h1>Thank you for your purchase!</h1>
                    <p>Your session ID: {sessionId}</p>
                    <p>User ID: {userId}</p>
                </div>
            )}
        </div>
    );
};

export default Success;
