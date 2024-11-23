// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { fetchUserDoc } from '../services/userService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            setLoading(true);
            if (user) {
                setUser(user);
                try {
                    const userData = await fetchUserDoc(user.uid);
                    setIsAdmin(userData?.isAdmin || false);
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            } else {
                setUser(null);
                setIsAdmin(false);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const handleSignOut = async () => {
        try {
            await auth.signOut();
            setUser(null);
            setIsAdmin(false);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isAdmin, loading, handleSignOut }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
