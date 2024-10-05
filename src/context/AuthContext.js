// src/context/AuthContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { fetchUserDoc } from '../services/userService'; // Ensure this path is correct

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log('Auth state changed:', user); // Debugging log
            if (user) {
                const userDoc = await fetchUserDoc(user.uid);
                setIsAdmin(userDoc?.isAdmin || false); // Set admin status based on user document
                setUser(user);
                console.log(`User authenticated: ${user.uid}, Admin: ${userDoc?.isAdmin}`); // Debugging log
            } else {
                setUser(null);
                setIsAdmin(false);
                console.log('User is not authenticated'); // Debugging log
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleSignOut = () => {
        auth.signOut().catch((error) => console.error('Sign out error:', error));
        console.log('User signed out'); // Debugging log
    };

    if (loading) {
        return <p>Loading...</p>; // Optionally, you could implement a loading spinner here
    }

    return (
        <AuthContext.Provider value={{ user, isAdmin, handleSignOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
