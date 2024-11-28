import React, { useEffect, useRef, useState } from 'react';
import { getUserDoc, createCart } from '../firebaseConfig';
import './Home.css';

const Home = () => {
    const [userData, setUserData] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem('darkMode') === 'true';
    });
    const [isVideoReady, setIsVideoReady] = useState(true);

    const lightVideoRef = useRef(null);
    const darkVideoRef = useRef(null);

    // Intersection Observer setup
    const observer = useRef(new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                // Handle visibility of elements here if needed
            }
        });
    }, { threshold: 0.1 }));

    // Effect to observe visibility of elements
    useEffect(() => {
        const elements = document.querySelectorAll('.home-image');
        elements.forEach((element) => {
            observer.current.observe(element);
        });

        return () => {
            elements.forEach((element) => {
                observer.current.unobserve(element);
            });
        };
    }, []);

    // Effect for handling dark mode
    useEffect(() => {
        const initialDarkMode = document.body.classList.contains('dark');
        setIsDarkMode(initialDarkMode);
        localStorage.setItem('darkMode', initialDarkMode);

        const mutationObserver = new MutationObserver(() => {
            const newDarkMode = document.body.classList.contains('dark');
            setIsDarkMode(newDarkMode);
            localStorage.setItem('darkMode', newDarkMode);
        });

        mutationObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

        return () => mutationObserver.disconnect();
    }, []);

    // Test Firebase integration
    useEffect(() => {
        const testFirebaseIntegration = async () => {
            const userId = 'testUserId123';
            const userDoc = await getUserDoc(userId);

            if (!userDoc) {
                await createCart(userId);
                console.log(`Created a cart for user ID: ${userId}`);
            } else {
                setUserData(userDoc);
                console.log('User Data:', userDoc);
            }
        };

        testFirebaseIntegration();
    }, []);

    const handleVideoLoaded = () => {
        setIsVideoReady(true);
    };

    const lightVideoSrc = "https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/Home%2Fteaser-light%2Fd.mp4?alt=media&token=b52e81d0-2ae9-449d-b3cb-051547ed97e0";
    const darkVideoSrc = "https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/Home%2Fteaser-dark%2Fc.mp4?alt=media&token=03f2688a-c1bd-48ba-9c75-b351007e3fa7";

    return (
        <div className="home-container">
            <div className="video-container">
                <video
                    ref={lightVideoRef}
                    src={lightVideoSrc}
                    className={`coming-soon-video ${!isDarkMode && isVideoReady ? 'fade-in' : 'fade-out'}`}
                    autoPlay
                    loop
                    muted
                    playsInline
                    onCanPlayThrough={handleVideoLoaded}
                />
                <video
                    ref={darkVideoRef}
                    src={darkVideoSrc}
                    className={`coming-soon-video ${isDarkMode && isVideoReady ? 'fade-in' : 'fade-out'}`}
                    autoPlay
                    loop
                    muted
                    playsInline
                    onCanPlayThrough={handleVideoLoaded}
                />
            </div>

            <div className="home-content">
                {userData && <p className="user-info">Welcome back, {userData.name}!</p>}

                <div className="home-section">
                    {/* Additional content here */}
                </div>
            </div>

            {/* Footer */}
        </div>
    );
};

export default Home;
